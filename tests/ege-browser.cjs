// Parcours navigateur avec API simulée : aucun compte ni paiement réel.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const base=process.env.EGE_TEST_URL||'http://127.0.0.1:8765';
const uid='11111111-1111-4111-8111-111111111111';
const user={id:uid,email:'ege-test@example.invalid',aud:'authenticated',role:'authenticated',app_metadata:{},user_metadata:{}};
async function scenario(width){
 const browser=await chromium.launch({headless:true});
 const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'});
 const page=await context.newPage();const errors=[],calls=[];let profile=null;
 page.on('pageerror',e=>errors.push(e.message));
 await context.route('https://nwcatsmfbkcgvgbanwyl.supabase.co/**',async route=>{
  const request=route.request(),url=new URL(request.url()),name=url.pathname.split('/').pop();
  calls.push({name,method:request.method()});let result=[];
  if(request.method()==='OPTIONS'){await route.fulfill({status:204,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*'}});return;}
  if(url.pathname.includes('/auth/v1/token'))result={access_token:'eyJhbGciOiJIUzI1NiJ9.'+Buffer.from(JSON.stringify({sub:uid,exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')+'.test',refresh_token:'test-only',expires_in:3600,token_type:'bearer',user};
  else if(url.pathname.includes('/auth/v1/user'))result=user;
  else if(url.pathname.includes('/rpc/'))result=name==='ege_est_admin'?false:null;
  else if(name==='ege_themes')result=[{id:1,titre:'La fidélisation et la rentabilité financière',annee_scolaire:'2026/2027'}];
  else if(name==='ege_sous_themes')result=[{id:1,theme_id:1,numero:1,intitule:'La fidélisation des clients',actif:true}];
  else if(name==='ege_tarifs')result=[{code:'dossier_individuel',montant_djf:1000},{code:'dossier_binome',montant_djf:1500}];
  else if(name==='ege_profils'){
   if(request.method()==='POST'){profile=request.postDataJSON();result=null;}
   else result=profile;
  }
  await route.fulfill({status:200,json:result,headers:{'access-control-allow-origin':'*','access-control-expose-headers':'*'}});
 });
 await page.goto(base+'/ege/');
 await page.locator('#catalogueCount').filter({hasText:'1 thèmes'}).waitFor();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'débordement horizontal');
 assert.equal(await page.locator('[data-offer]').count(),0);
 await page.locator('#themeGrid summary').click();
 assert.match(await page.locator('#themeGrid').innerText(),/Aucun dossier validé disponible/);
 await page.locator('#search').fill('inexistant');
 assert.match(await page.locator('#themeGrid').innerText(),/Aucun sous-thème/);
 await page.locator('#search').fill('');
 await page.locator('#accountButton').click();
 await page.locator('[name="email"]').fill(user.email);
 await page.locator('[name="password"]').fill('test-only');
 await page.locator('#authForm button').click();
 await page.locator('#profileForm').waitFor();
 for(const [field,value] of Object.entries({nom:'Test',prenom:'Élève',whatsapp:'+253 77 00 00 00',etablissement:'Lycée test'}))await page.locator(`#profileForm [name="${field}"]`).fill(value);
 await page.locator('#profileForm button').click();
 await page.locator('#privateMessage').filter({hasText:'confirmé'}).waitFor();
 assert(calls.some(c=>c.name==='ege_profils'&&c.method==='POST'));
 await page.locator('#profilePanel summary').click();
 await page.screenshot({path:`/tmp/ege-${width}.png`,fullPage:true});
 await page.locator('#logout').click();
 await page.locator('#workspace').waitFor({state:'hidden'});
 assert.equal(await page.locator('#orders').innerText(),'');
 assert.deepEqual(errors,[]);
 await context.close();await browser.close();console.log(`PASS EGE Chromium ${width}px : invité, recherche, connexion, profil, indisponibilité, déconnexion`);
}
(async()=>{for(const width of [390,1440])await scenario(width);})().catch(e=>{console.error(e);process.exit(1)});
