const CACHE='ege-shell-v2';
const SHELL=['./','./index.html','./styles.css','./app.js','./domain.js','./data.js','./files.js','./pwa.js','./manifest.webmanifest','../platform.css','../js/api.js','../js/domain.js','../vendor/supabase-2.57.4.js','../icon-192.png','../icon-512.png'];
const urls=SHELL.map(path=>new URL(path,self.registration.scope).href);
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(urls)));});
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('ege-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
// Liste stricte de fichiers statiques. Aucun catalogue, compte, API, Word ou lien signé.
self.addEventListener('fetch',event=>{
 const r=event.request;
 if(r.method!=='GET'||!urls.includes(r.url))return;
 event.respondWith(fetch(r).then(response=>{if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(r,copy)));}return response;}).catch(async()=>await caches.match(r)||new Response('Connexion requise',{status:503})));
});
