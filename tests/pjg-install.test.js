import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {join} from "node:path";

const root=join(process.cwd(),"prof-jana-galeh");
test("PWA Prof. Jana Galeh installée indépendamment de MON BAC",()=>{
 const m=JSON.parse(readFileSync(join(root,"manifest.webmanifest"),"utf8"));
 assert.equal(m.id,"/prof-jana-galeh/");
 assert.equal(m.scope,"/prof-jana-galeh/");
 assert.equal(m.start_url,"/prof-jana-galeh/");
 assert.equal(m.display,"standalone");
 assert.ok(m.icons.some(icon=>icon.sizes==="192x192"&&icon.type==="image/png"));
 assert.ok(m.icons.some(icon=>icon.sizes==="512x512"&&icon.type==="image/png"));
 const html=readFileSync(join(root,"index.html"),"utf8");
 assert.match(html,/rel="manifest"/);
 assert.match(html,/id="installApp"/);
 assert.match(html,/apple-touch-icon/);
 assert.match(html,/install\.js/);
});
test("Les icônes PNG sont de dimensions correctes",()=>{
 for(const size of [192,512]){
  const bytes=readFileSync(join(root,"icon-"+size+".png"));
  assert.equal(bytes.subarray(0,8).toString("hex"),"89504e470d0a1a0a");
  assert.equal(bytes.readUInt32BE(16),size);
  assert.equal(bytes.readUInt32BE(20),size);
 }
});
test("Le service worker PWA ne cache pas de données scolaires",()=>{
 const sw=readFileSync(join(root,"sw.js"),"utf8");
 assert.match(sw,/pjg-shell-/);
 assert.doesNotMatch(sw,/supabase\.co/);
 assert.doesNotMatch(sw,/\/rest\/v1/);
 assert.match(sw,/new Set\(SHELL/);
});
