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
 await page.getByText('Aucun dossier validé disponible pour le moment.',{exact:true}).waitFor();
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
async function adminScenario(){
 const vm=require('node:vm'),fs=require('node:fs');
 const ctx={module:{exports:{}},exports:{},setTimeout,clearTimeout,setImmediate,Promise,Buffer,Uint8Array,ArrayBuffer};
 vm.runInNewContext(fs.readFileSync('ege/vendor/jszip-3.10.1.min.js','utf8'),ctx);
 const zip=new ctx.module.exports();
 zip.file('[Content_Types].xml','<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
 zip.file('_rels/.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>');
 zip.file('word/document.xml','<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Document technique de test uniquement.</w:t></w:r></w:p></w:body></w:document>');
 const buffer=Buffer.from(await zip.generateAsync({type:'uint8array'}));
 const browser=await chromium.launch({headless:true}),context=await browser.newContext({viewport:{width:390,height:900},serviceWorkers:'block'}),page=await context.newPage();
 const errors=[],calls=[];page.on('pageerror',e=>errors.push(e.message));
 const command='33333333-3333-4333-8333-333333333333',correction='44444444-4444-4444-8444-444444444444';
 let correctionStatus='en_attente';
 const filename='T1_ST01_D01_individuel.docx';
 await context.route('https://nwcatsmfbkcgvgbanwyl.supabase.co/**',async route=>{
  const request=route.request(),url=new URL(request.url()),name=url.pathname.split('/').pop();let result=[];
  if(request.method()==='OPTIONS'){await route.fulfill({status:204,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*'}});return;}
  if(url.pathname.includes('/auth/v1/token'))result={access_token:'eyJhbGciOiJIUzI1NiJ9.'+Buffer.from(JSON.stringify({sub:uid,exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')+'.test',refresh_token:'test-only',expires_in:3600,token_type:'bearer',user};
  else if(url.pathname.includes('/auth/v1/user'))result=user;
  else if(url.pathname.includes('/rpc/')){
   const body=request.postDataJSON();calls.push({name,body});
   const item={id:correction,commande_id:command,dossier_id:uid,champ:'annexes',detail:'Merci de corriger cette annexe de test.',statut:correctionStatus};
   const map={ege_est_admin:true,ege_admin_bilan:{brouillons:450,valides:0,modeles_stockes:0,fichiers_word:0,annexes_a_corriger:27,revenus_confirmes:1000},ege_admin_lister_commandes:{total:1,items:[{id:command,statut:'livre',prix_djf:1000,moyen_paiement:'cash'}]},ege_admin_lister_corrections:{total:body.p_statut===correctionStatus?1:0,items:body.p_statut===correctionStatus?[item]:[]},ege_admin_configuration:{moyens:[{moyen:'waafi',actif:false,numero_reception:null,titulaire:null}]},ege_admin_lots_import:[{nom_fichier:filename,sha256:null,chemin_stockage:null,objet_present:false}],ege_admin_commande_detail:{commande:{id:command,statut:'livre',prix_convenu_djf:1000},dossier:{identite_figee:{nom:'Test',prenom:'Élève',etablissement:'Lycée test',classe:'Terminale GFM'},problematique:'Question de test'},versions:[]},ege_admin_preparer_livraison:{numero:2,chemin:command+'/versions/0002/dossier-personnalise.docx'}};
   if(name==='ege_admin_repondre_correction')correctionStatus='acceptee';
   if(name==='ege_admin_finaliser_livraison'){
    assert.equal(body.p_correction,correction);assert.equal(body.p_taille,buffer.length);assert.match(body.p_sha256,/^[0-9a-f]{64}$/);correctionStatus='traitee';
   }
   result=map[name]??true;
  }else if(url.pathname.includes('/storage/v1/object/')){calls.push({name:'storage-upload',path:url.pathname});result={Key:'private-test',Id:'private-test'};}
  else if(name==='ege_profils')result=null;
  await route.fulfill({status:200,json:result,headers:{'access-control-allow-origin':'*','access-control-expose-headers':'*'}});
 });
 await page.goto(base+'/ege/');await page.locator('#accountButton').click();await page.locator('[name="email"]').fill(user.email);await page.locator('[name="password"]').fill('test-only');await page.locator('#authForm button').click();
 const checked=await page.evaluate(async encoded=>{
  const {validateDocx}=await import('/ege/files.js');
  const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));
  const result=await validateDocx(new File([bytes],'test.docx'));
  const unsafe=await window.JSZip.loadAsync(bytes);
  unsafe.file('word/_rels/document.xml.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="bad" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/attachedTemplate" TargetMode="External" Target="https://evil.invalid/template"/></Relationships>');
  try{await validateDocx(new File([await unsafe.generateAsync({type:'uint8array'})],'unsafe.docx'));return {unexpected:true};}
  catch(error){return {...result,rejection:error.message};}
 },buffer.toString('base64'));
 assert.match(checked.sha256,/^[0-9a-f]{64}$/);assert.match(checked.rejection,/Lien externe actif interdit/);
 await page.locator('[data-review-correction]').waitFor();await page.locator('[data-review-correction]').click();await page.locator('[name="reponse"]').fill('Votre demande est acceptée après examen.');await page.locator('#correctionDecisionForm button').click();
 await page.locator('#dialog').waitFor({state:'hidden'});await page.locator('#privateMessage').filter({hasText:'Enregistrement confirmé'}).waitFor();await page.locator('#adminCorrectionFilter').selectOption('acceptee');await page.locator('[data-correction-id]').waitFor();await page.locator('[data-correction-id]').click();
 await page.locator('#deliveryForm').waitFor();await page.locator('#deliveryForm [name="word"]').setInputFiles({name:'correction.docx',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',buffer});await page.locator('#deliveryForm [type="checkbox"]').check();await page.locator('#deliveryForm button').click();
 await page.locator('#dialog').waitFor({state:'hidden'});assert(calls.some(c=>c.name==='ege_admin_finaliser_livraison'));
 await page.locator('#adminCorrectionFilter').selectOption('traitee');await page.locator('#adminPanel .order strong').filter({hasText:'Traitée · nouveau Word disponible'}).waitFor();
 await page.getByText('Importer les brouillons Word',{exact:true}).click();await page.locator('#importForm [name="files"]').setInputFiles({name:filename,mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',buffer});await page.locator('#importForm [type="checkbox"]').check();await page.locator('#importForm button').click();
 await page.locator('#importStatus').filter({hasText:'Import terminé'}).waitFor();assert(calls.some(c=>c.name==='ege_admin_enregistrer_import'&&c.body.p_fichier===filename));
 await page.getByText('Coordonnées de paiement marchand',{exact:true}).click();await page.locator('[data-payment-config="waafi"]').click();await page.locator('[name="numero"]').fill('+253 77 00 00 00');await page.locator('[name="titulaire"]').fill('Compte marchand test');await page.locator('[name="actif"]').check();await page.locator('#paymentConfigForm [type="checkbox"]').last().check();await page.locator('#paymentConfigForm button').click();
 await page.locator('#dialog').waitFor({state:'hidden'});assert(calls.some(c=>c.name==='ege_admin_enregistrer_moyen'&&c.body.p_actif===true));
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'débordement horizontal administration');assert.deepEqual(errors,[]);
 await page.screenshot({path:'/tmp/ege-admin-390.png',fullPage:true});await context.close();await browser.close();console.log('PASS EGE administration : réponse correction, livraison versionnée, import Word et coordonnées marchandes');
}
(async()=>{for(const width of [390,1440])await scenario(width);await adminScenario();})().catch(e=>{console.error(e);process.exit(1)});
