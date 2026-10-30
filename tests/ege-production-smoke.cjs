// Contrôle de disponibilité public, sans cookie, JWT ni clé privilégiée.
const assert=require('node:assert/strict');
const base=process.env.EGE_PRODUCTION_URL||'https://mon-bac-v8.vercel.app/ege/';
async function get(path){
 const url=new URL(path,base),response=await fetch(url,{signal:AbortSignal.timeout(20000),redirect:'follow'});
 assert.equal(response.status,200,`HTTP ${response.status} pour ${url.pathname}`);
 assert.equal(new URL(response.url).origin,url.origin,'redirection vers une authentification externe');
 return response;
}
(async()=>{
 const html=await (await get('./')).text();assert.match(html,/EGE 2026\/2027/);assert.match(html,/id="catalogue"/);
 const manifest=await (await get('./manifest.webmanifest')).json();assert.equal(manifest.scope,'./');
 for(const path of ['./app.js','./api.js','./vendor/supabase-2.57.4.js','./service-worker.js'])await get(path);
 console.log('PASS production publique : page EGE, manifeste et scripts accessibles sans compte Vercel');
})().catch(error=>{console.error(error.message);process.exit(1)});
