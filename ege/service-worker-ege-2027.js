/* EGE 2027 — cache de l'interface seulement, jamais de réponses Supabase, données ou dossiers privés. */
const CACHE='ege-gfm-2027-shell-v6';
const ROOT=new URL('./',self.registration.scope).href;
const PAGE=new URL('./assistant-dossier-gfm-2027.html',self.registration.scope).href;
const ASSETS=['./','./portail.html','./portail.js','./theme-rouge.css','./assistant-dossier-gfm-2027.html','./manifest-ege-2027.webmanifest','./icon-ege-192.png','./icon-ege-512.png','./word-import.js','./phase1.js','./auth-feedback.js'].map(p=>new URL(p,self.registration.scope).href);
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('ege-gfm-2027-shell-')&&k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()])));
self.addEventListener('fetch',event=>{
 const req=event.request;if(req.method!=='GET')return;
 const url=new URL(req.url);if(url.origin!==self.location.origin)return;
 const page=url.href===PAGE||url.href===ROOT;
 const shell=ASSETS.includes(url.href);if(!page&&!shell)return;
 if(page){
  event.respondWith(fetch(req).then(res=>{if(res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(url.href,copy)).catch(()=>{})}return res}).catch(()=>caches.match(url.href)));
  return;
 }
 event.respondWith(caches.match(req).then(hit=>hit||fetch(req)));
});
