import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import vm from 'node:vm';
const root=new URL('../',import.meta.url);
function worker(){const handlers={};const deleted=[];const added=[];const self={location:{origin:'https://example.invalid'},registration:{scope:'https://example.invalid/mon-bac-v8/'},clients:{claim:async()=>{}},skipWaiting(){},addEventListener(name,fn){handlers[name]=fn;}};const caches={open:async()=>({addAll:async paths=>added.push(...paths)}),keys:async()=>['other-app-cache','mon-bac-v8-shell-1','mon-bac-v8-shell-5'],delete:async key=>deleted.push(key)};return {handlers,deleted,added,self,caches};}
test('le manifeste et le cache référencent des fichiers existants',async()=>{const manifest=JSON.parse(await readFile(new URL('manifest.webmanifest',root)));for(const icon of manifest.icons)await access(new URL(icon.src,root));const w=worker();vm.runInNewContext(await readFile(new URL('service-worker.js',root),'utf8'),{self:w.self,caches:w.caches,URL});let promise;w.handlers.install({waitUntil:p=>promise=p});await promise;assert(w.added.includes('./vendor/supabase-2.57.4.js'));for(const path of w.added)await access(new URL(path,root));});
test('le service worker ne capture aucune requête Supabase ni écriture',async()=>{const w=worker();vm.runInNewContext(await readFile(new URL('service-worker.js',root),'utf8'),{self:w.self,caches:w.caches,URL});let handled=0;for(const request of [{method:'GET',url:'https://nwcatsmfbkcgvgbanwyl.supabase.co/rest/v1/cours'},{method:'POST',url:'https://example.invalid/mon-bac-v8/index.html'},{method:'GET',url:'https://example.invalid/private-data.json'}])w.handlers.fetch({request,respondWith:()=>handled++});assert.equal(handled,0);});
test('la mise à jour préserve le cache courant et les caches des autres applications',async()=>{
 const source=await readFile(new URL('service-worker.js',root),'utf8');
 const w=worker(),opened=[];
 w.caches.open=async key=>{opened.push(key);return {addAll:async()=>{}};};
 vm.runInNewContext(source,{self:w.self,caches:w.caches,URL});
 let promise;
 w.handlers.install({waitUntil:p=>promise=p});await promise;
 assert.equal(opened.length,1);
 const current=opened[0];
 assert(current.startsWith('mon-bac-v8-'));
 const obsolete=['mon-bac-v8-shell-obsolete-a','mon-bac-v8-shell-obsolete-b'];
 const unrelated=['other-app-cache','janagaleh-shell-1','mon-bac-v80-shell-1'];
 w.caches.keys=async()=>[...unrelated,...obsolete,current];
 w.handlers.activate({waitUntil:p=>promise=p});await promise;
 assert.deepEqual(w.deleted,obsolete);
 assert(!w.deleted.includes(current));
 for(const key of unrelated)assert(!w.deleted.includes(key));
});
