// Tests d’interface avec API simulée ; aucun compte ni aucune donnée de production.
const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict');
const base=process.env.MONBAC_TEST_URL||'http://127.0.0.1:8765';
const uid='11111111-1111-4111-8111-111111111111';
const teacher='22222222-2222-4222-8222-222222222222';
const user={id:uid,email:'test@example.invalid',aud:'authenticated',role:'authenticated',app_metadata:{},user_metadata:{}};
async function scenario(engine,role,viewport){
 const browser=await engine.launch({headless:true});const context=await browser.newContext({viewport});const page=await context.newPage();const errors=[];const calls=[];
 page.on('pageerror',e=>errors.push(e.message));
 let signedIn=false;let finished=false;
 const course={id:1,titre:'Économie : la croissance',contenu:'<script>alert(1)</script>\nUne économie en mouvement.',matiere_id:1,classe_id:1,enseignant_id:teacher,est_premium:false,date_creation:'2026-10-28T05:00:00Z'};
 await context.route('https://nwcatsmfbkcgvgbanwyl.supabase.co/**',async route=>{
 const req=route.request();const url=new URL(req.url());const name=url.pathname.split('/').pop();let result=[];const body=req.postDataJSON?.();calls.push({name,method:req.method(),body});
 if(req.method()==='OPTIONS'){await route.fulfill({status:200,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*'}});return;}
 if(url.pathname.includes('/auth/v1/token')){signedIn=true;result={access_token:'eyJhbGciOiJIUzI1NiJ9.'+Buffer.from(JSON.stringify({sub:uid,exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')+'.test',refresh_token:'test-only',expires_in:3600,token_type:'bearer',user};}
 else if(url.pathname.includes('/auth/v1/user')){if(!signedIn){await route.fulfill({status:401,json:{msg:'No session'}});return;}result=user;}
 else if(name==='logout')result={};
 else if(url.pathname.includes('/rpc/')){
 const map={demarrer_quiz:7,consulter_questions_quiz:[{question_id:10,enonce:'2 + 2 ?',type_question:'qcm',points:1,ordre:0,choix_id:11,texte_choix:'4',ordre_choix:0},{question_id:10,enonce:'2 + 2 ?',type_question:'qcm',points:1,ordre:0,choix_id:12,texte_choix:'5',ordre_choix:1},{question_id:20,enonce:'Une réponse courte ?',type_question:'texte',points:1,ordre:1,choix_id:null}],enregistrer_reponse_qcm:null,enregistrer_reponse_texte:null,terminer_quiz:[{note:2,note_max:2}],consulter_resultat_quiz:[{quiz_titre:'Mon quiz',note:2,note_max:2}],consulter_correction_quiz:[{enonce:'2 + 2 ?',points_obtenus:1,points_max:1,reponse_eleve:'4',bonne_reponse:'4',explication:'Addition.'}],mes_eleves_enseignant:[{eleve_nom:'Élève test',eleve_email:user.email}],mes_paiements_enseignant:[],mes_abonnements_enseignant:[],statistiques_admin:[{total_eleves:2,total_enseignants:2,abonnements_actifs:0}],lister_paiements_admin:[{id:5,montant:500,statut:'en_attente',eleve_email:user.email,enseignant_email:'prof@example.invalid'}],lister_utilisateurs_admin:[{nom:'Test',email:user.email,role:'eleve'}],lister_abonnements_admin:[],consulter_journal_admin:[],decider_paiement:'DECISION_ENREGISTREE',rejoindre_enseignant:'INSCRIPTION_VALIDEE',declarer_paiement:'PAIEMENT_DECLARE'};
 if(name==='terminer_quiz')finished=true;result=map[name]??null;
 }else if(name==='profils')result={id:uid,nom:'Jana',role};
 else if(name==='cours')result=url.searchParams.has('id')?course:[course];
 else if(name==='matieres')result=[{id:1,nom:'Économie'}];
 else if(name==='classes')result=[{id:1,nom:'Terminale'}];
 else if(name==='inscriptions')result=[{id:1,enseignant_id:teacher}];
 else if(name==='tentatives_quiz')result=finished?[{id:7,quiz_id:1,statut:'terminee',note:2,note_max:2}]:[];
 else if(name==='quiz')result=req.method()==='POST'?{id:2}:[{id:1,titre:'Mon quiz',cours_id:1}];
 else if(name==='questions_quiz')result=req.method()==='POST'?{id:30}:[];
 else if(name==='invitations')result=[{id:1,code:'MONBAC-TEST'}];
 await route.fulfill({status:200,json:result,headers:{'access-control-allow-origin':'*','access-control-expose-headers':'*'}});
 });
 await page.goto(base+'/mon-bac.html');await page.locator('#email').fill(user.email);await page.locator('#password').fill('test-only');await page.locator('#loginBtn').click();await page.locator('#workspace').waitFor({state:'visible'});await page.locator('#content h1').waitFor();await page.waitForFunction(()=>!document.querySelector('#content .busy'));
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'débordement horizontal');
 if(role==='eleve'){
 await page.locator('[data-action="goCourses"]').first().click();await page.locator('#courseSearch').waitFor();await page.locator('#courseSearch').fill('absent');await page.waitForTimeout(100);assert.equal(await page.locator('[data-action="course"]').count(),0);await page.locator('#courseSearch').fill('');await page.locator('[data-action="course"]').click();await page.locator('#modal').waitFor({state:'visible'});assert.match(await page.locator('#modalBody').innerText(),/<script>alert/);assert.equal(await page.locator('#modalBody script').count(),0);await page.locator('#closeModal').click();
 await page.locator('a[href="#quiz"]').click();await page.locator('#quizNumber').fill('1');await page.locator('#quizForm button').click();await page.locator('#answerForm').waitFor();await page.getByLabel('4',{exact:true}).check();await page.locator('#answer-20').fill('Réponse');await page.locator('#answerForm button').click();await page.waitForFunction(()=>document.querySelector('#modalTitle').textContent==='Mon quiz');assert.match(await page.locator('#modalBody').innerText(),/2 \/ 2/);assert(calls.some(x=>x.name==='enregistrer_reponse_texte'));assert(calls.some(x=>x.name==='terminer_quiz'));
 await page.locator('#closeModal').click();await page.locator('a[href="#profil"]').click();await page.locator('#teacherCode').fill('CODE');await page.locator('#joinForm button').click();await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Inscription validée'));
 }else if(role==='enseignant'){
 await page.locator('[data-action="editCourse"]').first().click();await page.locator('#courseTitle').fill('Nouveau cours');await page.locator('#courseBody').fill('Contenu pédagogique');await page.locator('#courseForm button').click();await page.waitForFunction(()=>!document.querySelector('#modal').open);assert(calls.some(x=>x.name==='cours'&&x.method==='POST'));
 await page.locator('a[href="#quiz"]').click();await page.locator('[data-action="editQuiz"]').click();await page.locator('#questionText').fill('Question ?');await page.locator('#questionChoices').fill('Oui\nNon');await page.locator('#questionForm button').click();await page.waitForFunction(()=>document.querySelector('#status').textContent==='Question ajoutée.');assert(calls.some(x=>x.name==='choix_questions'&&x.method==='POST'));
 }else{
 await page.locator('[data-action="decide"]').click();await page.locator('#decision').selectOption('confirme');await page.locator('[name="verified"]').check();await page.locator('#decisionForm button').click();await page.waitForFunction(()=>document.querySelector('#status').textContent==='Décision enregistrée.');assert(calls.some(x=>x.name==='decider_paiement'&&x.body.p_decision==='confirme'));
 }
 await page.screenshot({path:`/tmp/monbac-${role}-${viewport.width}.png`,fullPage:true});
 await page.locator('#logoutBtn').click();await page.locator('#loginScreen').waitFor({state:'visible'});assert.equal(await page.locator('#content').innerText(),'');assert.deepEqual(errors,[]);
 await context.close();await browser.close();console.log(`PASS ${engine.name()} ${role} ${viewport.width}x${viewport.height}`);
}
(async()=>{for(const engine of [chromium,webkit])for(const role of ['eleve','enseignant','super_admin'])await scenario(engine,role,{width:390,height:844});await scenario(chromium,'eleve',{width:1440,height:1000});})().catch(e=>{console.error(e);process.exit(1)});
