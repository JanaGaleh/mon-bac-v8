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
 client.from('ege2027_reviews').select('id,dossier_id,decision,observation,created_at').order('created_at',{ascending:false}).limit(200),
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
 const annexes=d.annexes||{};
 for(const [num,value] of Object.entries(annexes).sort(([a],[b])=>Number(a)-Number(b))){
  const t=node('h3','','Annexe '+num),p=node('pre','',String(value||'—').slice(0,20000));doc.append(t,p)
 }
 const historyDiv=$('reviewHistory');historyDiv.replaceChildren();
 if(!history.length)historyDiv.append(node('p','muted','Aucune correction enregistrée.'));
 for(const rev of history){
  const e=node('div','entry review'),title=node('b','',rev.decision==='valide'?'Dossier validé':'Correction demandée');
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
  const {error}=await client.from('ege2027_reviews').insert({dossier_id:selected.id,staff_id:user.id,decision,observation});
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
function tab(name){
 activeTab=name;
 for(const x of ['overview','dossiers','settings','security'])visible(x,x===name);
 document.querySelectorAll('[data-tab]').forEach(b=>{const on=b.dataset.tab===name;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))});
 document.querySelectorAll('[data-admin-bottom]').forEach(b=>{const on=b.dataset.adminBottom===name;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))});
 if(name==='dossiers')$('search').focus();
}
async function signOut(){await client.auth.signOut();loginView('Déconnexion effectuée.')}
async function start(){
 if(!window.supabase?.createClient){loginView('Bibliothèque Supabase indisponible. Vérifie ta connexion Internet.');return}
 client=window.supabase.createClient(URL_DB,PUBLIC_KEY);
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
