/* EGE GFM 2027 — espace enseignant, accès soumis à approbation Supabase/RLS. */
(()=>{'use strict';
const URL_DB='https://nwcatsmfbkcgvgbanwyl.supabase.co';
const PUBLIC_KEY='sb_publishable_vXuRHP_lqGqtV9d1C_oZWw_SetdoY7L';
const REDIRECT='https://ege-gfm-2027.janakaleh.workers.dev/enseignant.html';
const RECOVERY_REDIRECT='https://ege-gfm-2027.janakaleh.workers.dev/';
const $=s=>document.getElementById(s);
const node=(tag,cls,text)=>{const v=document.createElement(tag);if(cls)v.className=cls;if(text!==undefined)v.textContent=String(text);return v};
const val=s=>String($(s)?.value||'').trim();
const date=s=>s?new Date(s).toLocaleDateString('fr-FR'):'—';
let api=null,user=null,request=null,groups=[],members=[],submissions=[],dossiers=[],selected=null,epoch=0,authBusy=false;
function note(m,bad=false){$('flash').textContent=m;$('flash').classList.toggle('error',bad)}
function show(id,yes){$(id).hidden=!yes}
function buttonsBusy(b){for(const id of ['login','signup','recover'])$(id).disabled=b}
function reset(){show('authSection',!user);show('signOut',!!user);show('requestSection',false);show('pendingSection',false);show('teacherSection',false)}
async function refresh(){
 const ticket=++epoch;
 try{
  const {data,error}=await api.auth.getUser();
  if(error)throw error;
  if(ticket!==epoch)return;
  user=data.user||null;request=null;reset();
  if(!user){note('Connectez-vous pour accéder à votre espace.');return}
  const resp=await api.from('ege2027_teacher_requests').select('user_id,full_name,school,status,rejection_reason').eq('user_id',user.id).maybeSingle();
  if(ticket!==epoch)return;
  if(resp.error)throw resp.error;
  request=resp.data||null;
  if(!request){show('requestSection',true);note('Compte connecté. Demandez l’accès enseignant.');return}
  if(request.status!=='approved'){
   show('pendingSection',true);
   const titles={pending:'Demande en attente de validation',rejected:'Demande refusée',suspended:'Accès enseignant suspendu'};
   $('pendingTitle').textContent=titles[request.status]||'Statut du compte';
   $('pendingText').textContent=request.status==='pending'?'L’administrateur doit approuver votre demande avant la création de groupes.':(request.rejection_reason||'Contactez l’administrateur EGE pour obtenir des précisions.');
   note('Statut : '+(titles[request.status]||request.status));return;
  }
  show('teacherSection',true);$('teacherIdentity').textContent=request.full_name+' · '+request.school;
  $('groupSchool').value=request.school;
  await loadGroups();
  if(ticket!==epoch)return;
  note('Accès enseignant validé. Vos groupes sont privés.');
 }catch(e){note('Service indisponible : '+(e.message||e),true)}
}
async function auth(signUp){
 if(authBusy||!api)return;
 const email=val('email').toLowerCase(),password=$('password').value;
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||password.length<(signUp?12:6)){note('Adresse e-mail valide et mot de passe '+(signUp?'de 12 caractères minimum.':'obligatoire.'),true);return}
 authBusy=true;buttonsBusy(true);note(signUp?'Création du compte…':'Connexion…');
 try{
  const {data,error}=signUp?await api.auth.signUp({email,password,options:{emailRedirectTo:REDIRECT}}):await api.auth.signInWithPassword({email,password});
  if(error)throw error;
  $('password').value='';
  if(signUp&&!data.session){note('Compte créé. Confirmez votre adresse e-mail depuis le message reçu, puis revenez sur cet espace enseignant.');return}
  await refresh();
 }catch(e){note('Connexion/inscription impossible : '+(e.message||e),true)}
 finally{authBusy=false;buttonsBusy(false)}
}
async function recover(){
 const email=val('email').toLowerCase();
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){note('Renseignez d’abord votre adresse e-mail.',true);return}
 buttonsBusy(true);
 try{
  const {error}=await api.auth.resetPasswordForEmail(email,{redirectTo:RECOVERY_REDIRECT});
  if(error)throw error;
  note('Si ce compte existe, un lien de réinitialisation a été demandé par e-mail.');
 }catch(e){note('Demande impossible : '+e.message,true)}
 finally{buttonsBusy(false)}
}
async function sendRequest(e){
 e.preventDefault();if(!user)return;
 const full_name=val('fullName'),school=val('school');
 if(full_name.length<3||school.length<2){note('Complétez votre nom et votre établissement.',true);return}
 const btn=$('requestForm').querySelector('[type=submit]');btn.disabled=true;
 try{
  const {error}=await api.from('ege2027_teacher_requests').insert({user_id:user.id,full_name,school});
  if(error)throw error;
  note('Demande envoyée. En attente de validation de l’administrateur.');await refresh();
 }catch(err){note('Demande non enregistrée : '+err.message,true)}
 finally{btn.disabled=false}
}
async function loadGroups(){
 if(!user||request?.status!=='approved')return;
 const result=await api.from('ege2027_teacher_groups').select('id,name,school,join_code,active,created_at').eq('teacher_id',user.id).order('created_at',{ascending:false}).limit(100);
 if(result.error)throw result.error;
 groups=result.data||[];members=[];submissions=[];dossiers=[];
 if(groups.length){
  const ids=groups.map(g=>g.id);
  const [m,shares]=await Promise.all([
   api.from('ege2027_group_members').select('group_id,student_id,student_name,joined_at').in('group_id',ids).order('joined_at',{ascending:true}).limit(2000),
   api.from('ege2027_group_submissions').select('id,group_id,student_id,dossier_id,submitted_at').in('group_id',ids).order('submitted_at',{ascending:false}).limit(2000)
  ]);
  if(m.error)throw m.error;
  if(shares.error)throw shares.error;
  members=m.data||[];submissions=shares.data||[];
  const dossierIds=[...new Set(submissions.map(x=>x.dossier_id))];
  if(dossierIds.length){
   const d=await api.from('ege2027_dossiers').select('id,owner_id,title,student,payload,updated_at').in('id',dossierIds).is('archived_at',null).order('updated_at',{ascending:false}).limit(400);
   if(d.error)throw d.error;
   dossiers=d.data||[];
  }
 }
 renderGroups();
}
function renderGroups(){
 const host=$('groups');host.replaceChildren();
 if(!groups.length){const box=node('div','card');box.append(node('h2','','Aucun groupe pour le moment'),node('p','muted','Créez votre première classe ci-dessus.'));host.append(box);return}
 for(const group of groups){
  const box=node('article','card');
  const head=node('div','groupHead'),info=node('div'),actions=node('div','row');
  info.append(node('span','tag',group.active?'Actif':'Invitation suspendue'),node('h2','',group.name),node('p','muted',group.school||request?.school||''));
  const toggle=node('button','btn sm',group.active?'Désactiver le code':'Activer le code');toggle.type='button';
  toggle.addEventListener('click',()=>toggleGroup(group));actions.append(toggle);
  head.append(info,actions);box.append(head);
  const codebar=node('div','codebar');codebar.append(node('span','','Code élève :'),node('strong','',group.join_code));
  const copy=node('button','btn sm','Copier');copy.type='button';copy.addEventListener('click',async()=>{
   try{await navigator.clipboard.writeText(group.join_code);note('Code '+group.join_code+' copié.')}
   catch{note('Communiquez ce code à vos élèves : '+group.join_code)}
  });codebar.append(copy);box.append(codebar);
  const pupils=members.filter(m=>m.group_id===group.id);
  box.append(node('h3','',pupils.length+' élève(s) inscrit(s)'));
  if(!pupils.length)box.append(node('p','muted','Communiquez ce code à vos élèves. Ils utilisent « Mes groupes » pour rejoindre votre classe et partager les dossiers de leur choix.'));
  for(const pupil of pupils){
   const line=node('div','pupil'),left=node('div'),right=node('div','row');
   left.append(node('b','',pupil.student_name),node('small','', 'Inscrit le '+date(pupil.joined_at)));
   const docs=dossiers.filter(d=>d.owner_id===pupil.student_id && submissions.some(x=>x.dossier_id===d.id && x.group_id===group.id && x.student_id===pupil.student_id));
   left.append(node('small','',docs.length+' dossier(s) partagé(s) avec ce groupe'));
   for(const doc of docs){
    const b=node('button','btn sm',doc.title||'Ouvrir le dossier');
    b.type='button';b.addEventListener('click',()=>viewDossier(doc));right.append(b);
   }
   const remove=node('button','btn sm danger','Retirer');remove.type='button';remove.addEventListener('click',()=>removePupil(group,pupil));right.append(remove);
   line.append(left,right);box.append(line);
  }
  host.append(box);
 }
}
async function createGroup(e){
 e.preventDefault();if(!user||request?.status!=='approved')return;
 const name=val('groupName'),school=val('groupSchool');
 if(name.length<2){note('Indiquez un nom de groupe.',true);return}
 const btn=$('groupForm').querySelector('[type=submit]');btn.disabled=true;
 try{
  const {error}=await api.from('ege2027_teacher_groups').insert({teacher_id:user.id,name,school});
  if(error)throw error;
  $('groupName').value='';await loadGroups();note('Groupe créé. Vous pouvez communiquer son code aux élèves.');
 }catch(err){note('Création impossible : '+err.message,true)}
 finally{btn.disabled=false}
}
async function toggleGroup(group){
 if(!confirm(group.active?'Désactiver les nouvelles inscriptions dans « '+group.name+' » ?':'Réactiver les inscriptions dans « '+group.name+' » ?'))return;
 const {error}=await api.from('ege2027_teacher_groups').update({active:!group.active}).eq('id',group.id).eq('teacher_id',user.id);
 if(error){note('Modification refusée : '+error.message,true);return}
 await loadGroups();note('Groupe actualisé.');
}
async function removePupil(group,pupil){
 if(!confirm('Retirer '+pupil.student_name+' du groupe '+group.name+' ? Ses dossiers personnels ne seront pas supprimés.'))return;
 const {error}=await api.from('ege2027_group_members').delete().eq('group_id',group.id).eq('student_id',pupil.student_id);
 if(error){note('Retrait impossible : '+error.message,true);return}
 await loadGroups();note('Élève retiré du groupe. Ses dossiers sont conservés.');
}
async function viewDossier(doc){
 selected=doc;
 const d=doc.payload||{},annexes=d.annexes||{},titles=d.annexTitles||{},sources=d.sources||{},sourceChecks=d.sourceChecks||{};
 $('dossierTitle').textContent=(doc.student||d.student||'Élève')+' · Dossier EGE';
 const wrap=$('documentBody');wrap.replaceChildren();
 const header=node('section','dossier-info');
 for(const [label,value] of [
  ['Dossier',doc.title||'—'],['Élève',doc.student||d.student||'—'],
  ['Binôme',d.partner||'—'],['Classe',d.className||'—'],
  ['Établissement',d.school||'—'],['Problématique',d.problem||'—']
 ]){
  const p=node('p','dossier-info-row');
  p.append(node('strong','',label+' : '),node('span','',String(value)));
  header.append(p);
 }
 wrap.append(header);
 let count=0;
 const defaults=[
  'Les notions générales','Comprendre le sous-thème',
  'Éléments de réponse à la problématique','Conditions et limites du sujet'
 ];
 for(const [key,value] of Object.entries(annexes).sort(([a],[b])=>Number(a)-Number(b))){
  const n=Number(key);
  if(!Number.isInteger(n)||n<1||n>4||!String(value||'').trim())continue;
  count++;
  const block=node('article','annex-preview-card');
  block.append(node('div','annex-preview-kicker','ANNEXE '+n));
  block.append(node('h3','annex-preview-title',String(titles[n]||defaults[n-1]).trim()));
  block.append(node('div','annex-preview-content',String(value).slice(0,40000)));
  const src=node('div','annex-preview-source');
  src.append(node('strong','','Source : '),node('span','',String(sources[n]||'Non renseignée')));
  block.append(src);
  block.append(node('small','annex-preview-status',sourceChecks[n]?'Source déclarée vérifiée par l’élève.':'Référence documentaire à vérifier.'));
  wrap.append(block);
 }
 if(!count)wrap.append(node('p','muted','Aucune annexe rédigée dans ce dossier.'));
 $('reviewText').value='';
 $('dossierDialog').showModal();
 await loadReviews();
}
async function loadReviews(){
 if(!selected)return;
 const {data,error}=await api.from('ege2027_reviews').select('decision,observation,created_at').eq('dossier_id',selected.id).order('created_at',{ascending:false}).limit(30);
 const host=$('reviewsHistory');host.replaceChildren();
 if(error){host.append(node('p','',error.message));return}
 if(!data?.length){host.append(node('p','','Pas encore de correction.'));return}
 for(const r of data)host.append(node('p','',(r.decision==='valide'?'Validé':'À corriger')+' · '+date(r.created_at)+' : '+(r.observation||'Sans commentaire')));
}
async function sendReview(decision){
 if(!selected||!user||request?.status!=='approved')return;
 const observation=val('reviewText');
 if(decision==='a_corriger'&&!observation){note('Une observation est nécessaire pour demander une correction.',true);return}
 if(decision==='valide'&&!confirm('Valider le dossier de cet élève ?'))return;
 for(const n of ['approve','revise'])$(n).disabled=true;
 try{
  const {error}=await api.from('ege2027_reviews').insert({dossier_id:selected.id,staff_id:user.id,decision,observation});
  if(error)throw error;
  $('reviewText').value='';await loadReviews();note(decision==='valide'?'Dossier validé.':'Correction demandée. L’élève verra votre observation.');
 }catch(e){note('Avis non enregistré : '+e.message,true)}
 finally{for(const n of ['approve','revise'])$(n).disabled=false}
}
async function boot(){
 if(!window.supabase?.createClient){note('Connexion Supabase indisponible. Vérifiez Internet.',true);return}
 api=window.supabase.createClient(URL_DB,PUBLIC_KEY);
 $('login').addEventListener('click',()=>auth(false));
 $('signup').addEventListener('click',()=>auth(true));
 $('recover').addEventListener('click',recover);
 $('requestForm').addEventListener('submit',sendRequest);
 $('groupForm').addEventListener('submit',createGroup);
 $('checkStatus').addEventListener('click',refresh);
 $('reload').addEventListener('click',async()=>{try{await loadGroups();note('Groupes actualisés.')}catch(e){note(e.message,true)}});
 $('signOut').addEventListener('click',async()=>{await api.auth.signOut();user=null;request=null;reset();note('Déconnecté.');});
 $('closeDialog').addEventListener('click',()=>$('dossierDialog').close());
 $('approve').addEventListener('click',()=>sendReview('valide'));
 $('revise').addEventListener('click',()=>sendReview('a_corriger'));
 api.auth.onAuthStateChange(event=>{if(event==='SIGNED_IN'||event==='SIGNED_OUT')setTimeout(refresh,0)});
 await refresh();
}
document.addEventListener('DOMContentLoaded',boot);
})();