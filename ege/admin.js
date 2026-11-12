'use strict';
const URL_DB='https://nwcatsmfbkcgvgbanwyl.supabase.co';
const PUBLIC_KEY='sb_publishable_vXuRHP_lqGqtV9d1C_oZWw_SetdoY7L';
const $=id=>document.getElementById(id);
let client=null,user=null,member=null,rows=[],selected=null,activeTab='overview';
const pad=(s)=>String(s||'').trim();
const date=v=>{try{return new Date(v).toLocaleString('fr-FR')}catch{return '—'}};
function message(text,kind=''){const node=$('status');node.textContent=text;node.className='status'+(kind?' '+kind:'');}
function node(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=String(text);return e;}
function visible(id,yes){$(id).hidden=!yes}
function loginView(note){user=null;member=null;visible('gate',true);visible('dashboard',false);visible('signOut',false);$('connectionBadge').textContent='Accès restreint';message(note||'Connecte-toi avec ton compte administrateur.');}
async function ensureAdmin(){
 const {data:{user:who},error}=await client.auth.getUser();
 if(error||!who){loginView('Connexion requise. Aucun dossier n’est accessible avant authentification.');return false}
 const result=await client.from('ege2027_staff').select('role').eq('user_id',who.id).maybeSingle();
 if(result.error){loginView('Vérification du rôle impossible : '+result.error.message);return false}
 if(result.data?.role!=='admin'){loginView('Accès refusé. Ce compte ne possède pas le rôle administrateur EGE.');return false}
 user=who;member=result.data;
 visible('gate',false);visible('dashboard',true);visible('signOut',true);
 $('connectionBadge').textContent='Administrateur connecté';
 $('adminIdentity').textContent='Compte autorisé : '+(user.email||'administrateur');
 $('secureRole').textContent='Administrateur EGE authentifié';
 message('Accès administrateur vérifié.', 'ok');
 await refreshAll();return true;
}
async function refreshAll(){
 if(!user||member?.role!=='admin')return;
 const [dossiers,reviews,settings]=await Promise.all([
 client.from('ege2027_dossiers').select('id,owner_id,student,created_at,updated_at,payload').order('updated_at',{ascending:false}).limit(100),
 client.from('ege2027_reviews').select('id,dossier_id,decision,observation,annex_number,created_at').order('created_at',{ascending:false}).limit(200),
 client.from('ege2027_settings').select('id,app_title,academic_year,student_message,updated_at').eq('id',1).single()
 ]);
 if(dossiers.error||reviews.error||settings.error){message('Erreur de chargement : '+(dossiers.error||reviews.error||settings.error).message,'error');return}
 rows=dossiers.data||[];
 $('statDossiers').textContent=String(rows.length)+(rows.length===100?' +':'');
 $('statReviews').textContent=String((reviews.data||[]).length)+(reviews.data?.length===200?' +':'');
 $('statYear').textContent=settings.data.academic_year;
 $('appTitle').value=settings.data.app_title;
 $('academicYear').value=settings.data.academic_year;
 $('studentMessage').value=settings.data.student_message;
 $('settingsSaved').textContent='Dernière mise à jour : '+date(settings.data.updated_at);
 showList($('recentList'),rows.slice(0,6),false);
 showList($('dossierList'),filtered(),true);
 if(selected){selected=rows.find(r=>r.id===selected.id)||null;if(selected)renderSelected((reviews.data||[]).filter(r=>r.dossier_id===selected.id));}
 message('Données actualisées. Accès réservé aux administrateurs EGE.', 'ok');
}
function filtered(){const q=pad($('search').value).toLocaleLowerCase('fr');return q?rows.filter(x=>(x.student||x.payload?.student||'').toLocaleLowerCase('fr').includes(q)):rows}
function showList(parent,data,interactive){
 parent.replaceChildren();
 if(!data.length){parent.append(node('p','muted','Aucun dossier enregistré pour le moment.'));return}
 for(const row of data){
  const b=node(interactive?'button':'div','entry');
  if(interactive)b.type='button';
  const left=node('div');left.append(node('b','',row.student||row.payload?.student||'Candidat sans nom'));
  left.append(node('small','','Dernière modification : '+date(row.updated_at)));
  b.append(left,node('span','pill',interactive?'Consulter':'Récemment modifié'));
  if(interactive)b.addEventListener('click',()=>choose(row));
  parent.append(b);
 }
}
async function choose(row){
 selected=row;visible('reviewPanel',true);
 const resp=await client.from('ege2027_reviews').select('decision,observation,created_at').eq('dossier_id',row.id).order('created_at',{ascending:false}).limit(30);
 if(resp.error){message('Historique indisponible : '+resp.error.message,'error');return}
 renderSelected(resp.data||[]);
 $('reviewPanel').scrollIntoView({behavior:'smooth',block:'start'});
}
function renderSelected(history){
 if(!selected)return;
 const d=selected.payload||{};
 $('selectedStudent').textContent=selected.student||d.student||'Candidat sans nom';
 $('studentMeta').textContent='Classe : '+(d.className||'—')+' · Établissement : '+(d.school||'—')+' · Mis à jour : '+date(selected.updated_at);
 const doc=$('studentDocument');doc.replaceChildren();
 for(const [label,value] of [['Mode',d.mode],['Thème',d.theme],['Sous-thème',d.subtheme],['Problématique',d.problem],['Professeur',d.teacher]]){
  const t=node('h3','',label);const p=node('p','',value===null||value===undefined||value===''?'—':String(value));doc.append(t,p)
 }
 const annexes=d.annexes||{},titles=d.annexTitles||{},sources=d.sources||{},sourceChecks=d.sourceChecks||{};
 const defaultTitles=['Les notions générales','Comprendre le sous-thème','Éléments de réponse à la problématique','Conditions et limites'];
 for(const [num,value] of Object.entries(annexes).sort(([a],[b])=>Number(a)-Number(b))){
  const n=Number(num);if(!Number.isInteger(n)||n<1||n>4)continue;
  const article=node('article','admin-annex-card');
  article.append(node('small','admin-annex-label','ANNEXE '+n));
  article.append(node('h3','admin-annex-title',String(titles[n]||defaultTitles[n-1])));
  article.append(node('div','admin-annex-content',String(value||'Non rédigée').slice(0,40000)));
  const source=node('div','admin-annex-source');
  source.append(node('strong','','Source : '),node('span','',String(sources[n]||'À renseigner')));
  article.append(source,node('small','admin-annex-check',sourceChecks[n]?'Source déclarée vérifiée par l’élève':'Source à vérifier'));
  doc.append(article);
 }
 const historyDiv=$('reviewHistory');historyDiv.replaceChildren();
 if(!history.length)historyDiv.append(node('p','muted','Aucune correction enregistrée.'));
 for(const rev of history){
  const e=node('div','entry review'),title=node('b','',(rev.decision==='valide'?'Validé':'À corriger')+(rev.annex_number?' · Annexe '+rev.annex_number:' · Dossier complet'));
  e.append(title,node('small','',date(rev.created_at)),node('p','',rev.observation||'Aucune observation'));
  historyDiv.append(e);
 }
}
async function sendReview(decision){
 if(!selected||!user||member?.role!=='admin')return;
 const observation=pad($('observation').value);
 if(decision==='a_corriger'&&!observation){message('Indique une observation pour demander une correction.','error');return}
 if(decision==='valide'&&!confirm('Confirmer la validation de ce dossier ?'))return;
 const buttons=[$('markApproved'),$('markRevision')];buttons.forEach(b=>b.disabled=true);
 try{
  const {error}=await client.from('ege2027_reviews').insert({dossier_id:selected.id,staff_id:user.id,decision,observation,annex_number:$('adminReviewAnnex').value?Number($('adminReviewAnnex').value):null});
  if(error)throw error;
  $('observation').value='';
  message(decision==='valide'?'Validation enregistrée.':'Demande de correction enregistrée.','ok');
  await choose(selected);await refreshAll();
 }catch(e){message('Impossible d’enregistrer la correction : '+e.message,'error')}
 finally{buttons.forEach(b=>b.disabled=false)}
}
async function saveSettings(event){
 event.preventDefault();if(!user||member?.role!=='admin')return;
 const app_title=pad($('appTitle').value),academic_year=pad($('academicYear').value),student_message=pad($('studentMessage').value);
 if(app_title.length<3||academic_year.length<4||student_message.length>650){message('Vérifie le nom, l’année scolaire et le message (650 caractères maximum).','error');return}
 $('saveSettings').disabled=true;
 try{
  const {data,error}=await client.from('ege2027_settings').update({app_title,academic_year,student_message,updated_at:new Date().toISOString(),updated_by:user.id}).eq('id',1).select('updated_at').single();
  if(error)throw error;
  $('settingsSaved').textContent='Enregistré le '+date(data.updated_at);
  $('statYear').textContent=academic_year;
  message('Paramètres enregistrés. Les élèves verront les modifications à l’ouverture de l’application.','ok');
 }catch(e){message('Enregistrement refusé : '+e.message,'error')}finally{$('saveSettings').disabled=false}
}

/* Validation centrale des enseignants EGE (l'administration seule peut modifier le statut). */
function installTeacherAdminUI(){
 if($('teachers'))return;
 const nav=document.querySelector('#dashboard .tabs');
 const tabButton=node('button','','Enseignants');tabButton.type='button';tabButton.dataset.tab='teachers';tabButton.setAttribute('aria-pressed','false');nav.append(tabButton);
 const panel=node('section','tabPanel');panel.id='teachers';panel.hidden=true;
 const content=node('div','panel');
 const heading=node('h2','','Validation des enseignants');
 const lead=node('p','muted','Approuvez les comptes enseignants avant qu’ils puissent créer des groupes ou consulter les dossiers de leurs propres élèves.');
 const reload=node('button','outline','Actualiser les demandes');reload.type='button';reload.addEventListener('click',loadTeacherRequests);
 const host=node('div','entries');host.id='egeTeacherRequests';
 content.append(heading,lead,reload,host);panel.append(content);
 const dash=$('dashboard');dash.insertBefore(panel,$('adminBottomNav'));
 const mobile=node('button');mobile.type='button';mobile.dataset.adminBottom='teachers';mobile.setAttribute('aria-pressed','false');
 mobile.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="7" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M18 9v8m-4-4h8"/></svg><span>Profs</span>';
 $('adminBottomNav').append(mobile);
}
async function loadTeacherRequests(){
 if(!user||member?.role!=='admin')return;
 const host=$('egeTeacherRequests');if(!host)return;
 host.replaceChildren(node('p','muted','Chargement…'));
 const {data,error}=await client.from('ege2027_teacher_requests')
  .select('user_id,full_name,school,status,created_at,rejection_reason')
  .order('created_at',{ascending:false}).limit(200);
 if(error){host.replaceChildren(node('p','muted','Chargement impossible : '+error.message));return}
 host.replaceChildren();
 if(!data?.length){host.append(node('p','muted','Aucune demande pour le moment.'));return}
 const labels={pending:'En attente',approved:'Approuvé',rejected:'Refusé',suspended:'Suspendu'};
 for(const t of data){
  const item=node('article','entry');
  const info=node('div');
  info.append(node('b','',t.full_name+' · '+t.school));
  info.append(node('small','','Statut : '+(labels[t.status]||t.status)+' · Demande du '+date(t.created_at)));
  if(t.rejection_reason)info.append(node('small','','Observation : '+t.rejection_reason));
  const buttons=node('div','actions');buttons.style.flexWrap='wrap';
  const add=(label,status,cls)=>{
   const b=node('button',cls,label);b.type='button';b.style.minHeight='38px';
   b.addEventListener('click',()=>decideTeacher(t,status));buttons.append(b);
  };
  if(t.status!=='approved')add('Approuver','approved','primary');
  if(t.status==='pending')add('Refuser','rejected','outline');
  if(t.status==='approved')add('Suspendre','suspended','outline');
  item.append(info,buttons);host.append(item);
 }
}
async function decideTeacher(t,status){
 if(!user||member?.role!=='admin')return;
 let reason=null;
 if(status==='approved'){
  if(!confirm('Autoriser '+t.full_name+' à gérer ses classes et à corriger les dossiers de ses élèves ?'))return;
 }else{
  reason=prompt('Motif (visible par l’enseignant) :',status==='suspended'?'Accès temporairement suspendu.':'');
  if(reason===null)return;
  if(!reason.trim()){message('Indique un motif pour refuser ou suspendre.','error');return}
 }
 const payload={status,reviewed_at:new Date().toISOString(),reviewed_by:user.id,rejection_reason:status==='approved'?null:reason.trim().slice(0,500)};
 const {error}=await client.from('ege2027_teacher_requests').update(payload).eq('user_id',t.user_id);
 if(error){message('Décision non enregistrée : '+error.message,'error');return}
 message(status==='approved'?'Enseignant approuvé.':'Statut enseignant modifié.','ok');
 await loadTeacherRequests();
}

function tab(name){
 activeTab=name;
 for(const x of ['overview','dossiers','settings','security','teachers'])visible(x,x===name);
 document.querySelectorAll('[data-tab]').forEach(b=>{const on=b.dataset.tab===name;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))});
 document.querySelectorAll('[data-admin-bottom]').forEach(b=>{const on=b.dataset.adminBottom===name;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))});
 if(name==='dossiers')$('search').focus();
 if(name==='teachers')loadTeacherRequests();
}
async function signOut(){await client.auth.signOut();loginView('Déconnexion effectuée.')}
async function start(){
 document.querySelectorAll('[data-open-tab]').forEach(b=>b.addEventListener('click',()=>document.querySelector('[data-tab="'+b.dataset.openTab+'"]')?.click()));
 if(!window.supabase?.createClient){loginView('Bibliothèque Supabase indisponible. Vérifie ta connexion Internet.');return}
 client=window.supabase.createClient(URL_DB,PUBLIC_KEY);
 installTeacherAdminUI();
 const eye=$('togglePassword');
 eye?.addEventListener('click',()=>{
  const field=$('loginPassword');
  if(!field)return;
  const show=field.type==='password';
  field.type=show?'text':'password';
  eye.setAttribute('aria-pressed',String(show));
  eye.setAttribute('aria-label',show?'Masquer le mot de passe':'Afficher le mot de passe');
  eye.title=show?'Masquer le mot de passe':'Afficher le mot de passe';
  field.focus();
 });
 $('loginForm').addEventListener('submit',async event=>{
  event.preventDefault();$('loginBtn').disabled=true;
  message('Authentification en cours…');
  try{
   const email=pad($('loginEmail').value).toLowerCase(),password=$('loginPassword').value;
   const {error}=await client.auth.signInWithPassword({email,password});
   if(error)throw error;
   $('loginPassword').value='';
   await ensureAdmin();
  }catch(e){message(/email not confirmed/i.test(e.message)?'Adresse e-mail non confirmée. Confirme-la avant de te connecter.':'Connexion impossible : '+e.message,'error')}
  finally{$('loginBtn').disabled=false}
 });
 $('signOut').addEventListener('click',signOut);
 $('adminPasswordReset')?.addEventListener('click',async()=>{
  const email=pad($('loginEmail')?.value).toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){message('Entre ton adresse e-mail pour réinitialiser le mot de passe.','error');return;}
  const btn=$('adminPasswordReset');btn.disabled=true;
  try{
   const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:'https://ege-gfm-2027.janakaleh.workers.dev/'});
   if(error)throw error;
   message('Un e-mail de réinitialisation a été demandé. Vérifie ta boîte et les spams. Le lien ouvre EGE 2027.','ok');
  }catch(e){message('Réinitialisation impossible : '+e.message,'error');}
  finally{btn.disabled=false;}
 });
 $('reload').addEventListener('click',refreshAll);
 $('search').addEventListener('input',()=>showList($('dossierList'),filtered(),true));
 $('closeReview').addEventListener('click',()=>{selected=null;visible('reviewPanel',false)});
 $('markApproved').addEventListener('click',()=>sendReview('valide'));
 $('markRevision').addEventListener('click',()=>sendReview('a_corriger'));
 $('settingsForm').addEventListener('submit',saveSettings);
 document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>tab(b.dataset.tab)));
 document.querySelectorAll('[data-admin-bottom]').forEach(b=>b.addEventListener('click',()=>{tab(b.dataset.adminBottom);window.scrollTo({top:0,behavior:'smooth'})}));
 document.addEventListener('focusin',ev=>{
   if(ev.target?.matches?.('input:not([type=checkbox]):not([type=radio]),textarea,select,[contenteditable=true]'))document.body.classList.add('admin-keyboard-open');
 });
 document.addEventListener('focusout',()=>requestAnimationFrame(()=>{
   if(!document.activeElement?.matches?.('input:not([type=checkbox]):not([type=radio]),textarea,select,[contenteditable=true]'))document.body.classList.remove('admin-keyboard-open');
 }));
 
 client.auth.onAuthStateChange((event)=>{if(event==='SIGNED_OUT')loginView('Tu as été déconnecté.')});
 await ensureAdmin();
}
document.addEventListener('DOMContentLoaded',start);
