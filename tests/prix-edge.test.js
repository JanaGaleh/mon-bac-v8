import {test} from 'node:test';
import assert from 'node:assert/strict';
import {LEARNING,INTERACTIVE,SHELL,patchSource,makeHandler} from '../integrations/prix-psychologique/edge-worker.mjs';
const learning="const optics=window.MAOptique?.card(window.MASimple?.scopeFor(st.screen),tab,query)||'';";
const interactive="const optics=(window.MADefiOptique?.nativeCard(m.scope)||'');async function click(ev){const opt=ev.target;}";
const source='window.MAPrixPsychologique={card(){},nativeCard(){}};';
const style='.mapr-entry{color:red}';
const handler=makeHandler(source,style);
const ctx={waitUntil(){}};
test('patch only the two exact assets, preserve old hooks and inject module once',()=>{
 const a=patchSource(LEARNING,learning,source,style),b=patchSource(INTERACTIVE,interactive,source,style);
 assert.ok(a.includes('MAOptique?.card'));assert.ok(a.includes('MAPrixPsychologique?.card'));
 assert.ok(b.includes('MADefiOptique?.nativeCard'));assert.ok(b.includes('MAPrixPsychologique?.nativeCard'));assert.ok(b.includes('MAPrixPsychologique?.open(prix,m.scope)'));
 assert.equal(patchSource(LEARNING,a,source,style),null);assert.equal(patchSource('/laboratoire.html',learning,source,style),null);assert.equal(patchSource(LEARNING,learning+learning,source,style),null);
});
test('fetch via primary with conditional and range headers removed; no stale validators',async()=>{
 const env={PRIMARY:{async fetch(req){assert.equal(new URL(req.url).hostname,'monavenir.janagaleh.com');assert.equal(req.headers.get('if-none-match'),null);assert.equal(req.headers.get('range'),null);return new Response(learning,{headers:{'content-type':'application/javascript','etag':'"old"','cache-control':'max-age=3600'}});}}};
 const res=await handler.fetch(new Request('https://monavenir.janagaleh.com'+LEARNING,{headers:{'if-none-match':'"old"',range:'bytes=0-100'}}),env,ctx);
 assert.equal(res.status,200);assert.equal(res.headers.get('x-monavenir-prix'),'1');assert.equal(res.headers.get('etag'),null);assert.equal(res.headers.get('cache-control'),'no-store');assert.ok((await res.text()).includes('MAPrixPsychologique?.card'));
});
test('when hooks change upstream, original remains unchanged',async()=>{
 const env={PRIMARY:{async fetch(){return new Response('new version',{headers:{'content-type':'application/javascript'}});}}};
 const res=await handler.fetch(new Request('https://monavenir.janagaleh.com'+LEARNING),env,ctx);assert.equal(await res.text(),'new version');assert.equal(res.headers.get('x-monavenir-prix'),null);
});
test('other production paths untouched; preview may not proxy other assets',async()=>{
 const env={PRIMARY:{async fetch(req){return new Response(new URL(req.url).pathname);}}};
 assert.equal(await (await handler.fetch(new Request('https://monavenir.janagaleh.com/laboratoire.html'),env,ctx)).text(),'/laboratoire.html');
 assert.equal((await handler.fetch(new Request('https://preview.workers.dev/laboratoire.html'),env,ctx)).status,404);
});
test('installed PWA refreshes static shell only; leave caching and notification logic intact',()=>{
 const sw=`const CACHE='ege-gfm-2027-shell-v271';const files=['${LEARNING}','${INTERACTIVE}'];self.addEventListener('push',e=>{});`;
 const patched=patchSource(SHELL,sw,source,style);
 assert.equal(patched,sw.replace('shell-v271','shell-v271-prix-psychologique-v1'));
 assert.equal(patchSource(SHELL,patched,source,style),null);
 assert.equal(patchSource(SHELL,sw.replace(INTERACTIVE,'other.js'),source,style),null);
});
