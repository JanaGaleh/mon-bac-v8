import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Window } from "happy-dom";
let fixture, registration;
const api = {
  auth: {
    signUp: async (input) => {
      fixture.signups.push(input);
      if (fixture.failure) return { error: fixture.failure };
      return { data: { user: { id: "created" }, session: null }, error: null };
    },
    resend: async (input) => {
      fixture.resends.push(input);
      return { data: {}, error: null };
    },
  },
  rpc: async (name, args) => {
    fixture.rpcs.push({ name, args });
    if (name === "ma_demande_enseignant")
      return { data: fixture.request || null };
    if (name === "demander_role_enseignant") {
      fixture.request = { statut: "en_attente" };
      return { data: "DEMANDE_ENREGISTREE" };
    }
    return { data: null };
  },
};
async function setup() {
  fixture = {
    signups: [],
    resends: [],
    rpcs: [],
    request: null,
    failure: null,
  };
  const window = new Window({
    url: "https://monbac.janagaleh.com/mon-bac.html",
  });
  window.document.write(
    await readFile(new URL("../mon-bac.html", import.meta.url), "utf8"),
  );
  window.supabase = { createClient: () => api };
  for (const key of ["window", "document", "location", "FormData"])
    Object.defineProperty(globalThis, key, {
      value: window[key],
      configurable: true,
      writable: true,
    });
  registration = await import("../js/registration.js");
  registration.initRegistration({
    onAuthenticated: async () =>
      assert.fail("aucune connexion avant confirmation"),
  });
  return window;
}
const tick = () => new Promise((r) => setTimeout(r, 10));
function fill(type = "eleve") {
  document.querySelector("#openRegistration").click();
  document.querySelector("#registrationRole").value = type;
  document
    .querySelector("#registrationRole")
    .dispatchEvent(new window.Event("change", { bubbles: true }));
  document.querySelector("#signupName").value = "Compte de test";
  document.querySelector("#signupEmail").value = "test@example.invalid";
  document.querySelector("#signupPassword").value = "Un mot de passe long";
  if (type === "enseignant")
    document.querySelector("#signupPresentation").value =
      "Gestion financière, première et terminale.";
}
function submit() {
  document
    .querySelector("#registrationForm")
    .dispatchEvent(
      new window.Event("submit", { bubbles: true, cancelable: true }),
    );
}
test("inscription élève : confirmation e-mail, retour HTTPS et aucun rôle déclaré par le navigateur", async () => {
  const window = await setup();
  fill();
  submit();
  await tick();
  assert.equal(fixture.signups.length, 1);
  const input = fixture.signups[0];
  assert.equal(
    input.options.emailRedirectTo,
    "https://monbac.janagaleh.com/mon-bac.html",
  );
  assert.equal(input.options.data.type_compte_souhaite, "eleve");
  assert.equal(input.options.data.role, undefined);
  assert.equal(document.querySelector("#signupPassword").value, "");
  assert.match(
    document.querySelector("#signupMessage").textContent,
    /confirmation/,
  );
  assert.equal(fixture.rpcs.length, 0);
  await window.happyDOM.close();
});
test("inscription enseignant : intention conservée sans approbation ni demande anonyme", async () => {
  const window = await setup();
  fill("enseignant");
  submit();
  await tick();
  assert.equal(
    fixture.signups[0].options.data.type_compte_souhaite,
    "enseignant",
  );
  assert.match(
    fixture.signups[0].options.data.presentation_enseignant,
    /Gestion/,
  );
  assert.equal(fixture.signups[0].options.data.role, undefined);
  assert.equal(fixture.rpcs.length, 0);
  assert.equal(
    document.querySelector("#signupTeacherNote").classList.contains("hidden"),
    false,
  );
  await window.happyDOM.close();
});
test("la première connexion transmet uniquement la demande ; le rôle reste déterminé par la base", async () => {
  const window = await setup();
  const user = {
    user_metadata: {
      type_compte_souhaite: "enseignant",
      role: "super_admin",
      presentation_enseignant: "Français, classes de première et terminale.",
    },
  };
  const profile = { role: "eleve" };
  const r = await registration.ensureTeacherRequest(user, profile);
  assert.equal(r.statut, "en_attente");
  assert.equal(profile.role, "eleve");
  assert.equal(
    fixture.rpcs.filter((x) => x.name === "demander_role_enseignant").length,
    1,
  );
  await registration.ensureTeacherRequest(user, profile);
  assert.equal(
    fixture.rpcs.filter((x) => x.name === "demander_role_enseignant").length,
    1,
  );
  assert.equal(
    fixture.rpcs.some((x) => x.name === "decider_demande_enseignant"),
    false,
  );
  await window.happyDOM.close();
});
test("validation du formulaire et erreurs SMTP/rate-limit sans fausse réussite", async () => {
  const window = await setup();
  fill("enseignant");
  document.querySelector("#signupPresentation").value = "court";
  submit();
  await tick();
  assert.equal(fixture.signups.length, 0);
  document.querySelector("#signupPresentation").value =
    "Enseignement en première et terminale.";
  fixture.failure = { code: "email_address_not_authorized" };
  submit();
  await tick();
  assert.match(
    document.querySelector("#signupMessage").textContent,
    /administration/,
  );
  assert.equal(
    document.querySelector("#signupSuccess").classList.contains("hidden"),
    true,
  );
  assert.match(registration.registrationError({ status: 429 }), /Patiente/);
  await window.happyDOM.close();
});
test("le renvoi de confirmation ne peut pas être spammé immédiatement", async () => {
  const window = await setup();
  fill();
  submit();
  await tick();
  document.querySelector("#resendSignup").click();
  await tick();
  assert.equal(fixture.resends.length, 0);
  assert.match(document.querySelector("#signupMessage").textContent, /minute/);
  await window.happyDOM.close();
});
