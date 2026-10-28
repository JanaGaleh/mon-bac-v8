import test from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { Window } from "happy-dom";
import { modules, legacyModuleTarget } from "../js/modules.js";
test("le registre sépare la plateforme du module et conserve uniquement les liens anciens connus", () => {
  assert.equal(modules.length, 1);
  assert.equal(modules[0].entry, "./mon-bac.html");
  assert.equal(legacyModuleTarget("#cours"), "./mon-bac.html#cours");
  assert.equal(legacyModuleTarget("#applications"), null);
  assert.equal(legacyModuleTarget("#https://evil.invalid"), null);
  assert.equal(legacyModuleTarget("#profil?role=super_admin"), null);
  assert(Object.isFrozen(modules));
});
test("les pages publiques ne contiennent aucun lien vers un fichier local manquant", async () => {
  for (const name of ["index.html", "mon-bac.html", "parcours.html"]) {
    const window = new Window({ url: "http://localhost/" });
    window.document.write(
      await readFile(new URL("../" + name, import.meta.url), "utf8"),
    );
    for (const el of window.document.querySelectorAll(
      "[src],link[href],a[href]",
    )) {
      const value = el.getAttribute("src") || el.getAttribute("href");
      if (!value || value.startsWith("#") || /^https?:/.test(value)) continue;
      const path = value.split("#")[0].split("?")[0];
      await access(new URL("../" + path, import.meta.url));
    }
    await window.happyDOM.close();
  }
});
test("la maquette interdit les connexions réseau et ne charge pas Supabase", async () => {
  const html = await readFile(
    new URL("../parcours.html", import.meta.url),
    "utf8",
  );
  assert.match(html, /connect-src 'none'/);
  assert.doesNotMatch(html, /supabase|vendor\//);
  const source = await readFile(
    new URL("../js/prototype.js", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(source, /fetch\(|\.rpc\(|localStorage|sessionStorage/);
});

test('l’accueil réutilise la session sans afficher de données personnelles ni charger les cours',async()=>{
 const window=new Window({url:'http://localhost/'});
 window.document.write(await readFile(new URL('../index.html',import.meta.url),'utf8'));
 let onAuth;
 window.supabase={createClient:()=>({auth:{getUser:async()=>({data:{user:{id:'test-account',email:'confidentiel@example.invalid'}}}),onAuthStateChange:callback=>onAuth=callback}})};
 for(const key of ['window','document','location','navigator'])Object.defineProperty(globalThis,key,{value:window[key],configurable:true,writable:true});
 await import('../js/platform.js?session-test');
 await new Promise(resolve=>setTimeout(resolve,10));
 assert.equal(document.querySelector('#platformAccountLabel').textContent,'Mon compte');
 assert.equal(document.querySelector('#launchMonBac span').textContent,'Retrouver mon espace');
 assert.doesNotMatch(document.body.textContent,/confidentiel/);
 onAuth('SIGNED_OUT');
 assert.equal(document.querySelector('#platformAccountLabel').textContent,'Se connecter');
 await window.happyDOM.close();
});
