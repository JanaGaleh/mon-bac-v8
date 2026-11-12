/* EGE GFM 2027 · espace élève et partage volontaire. */
(()=>{'use strict';
const DB='https://nwcatsmfbkcgvgbanwyl.supabase.co';
const KEY='sb_publishable_vXuRHP_lqGqtV9d1C_oZWw_SetdoY7L';
const $=id=>document.getElementById(id);
const val=id=>String($(id)?.value||'').trim();
const make=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=String(txt);return e};
let api=null,user=null,memberRows=[],groupRows=[],dossiers=[],shares=[],reviews=[],busy=false,seq=0;
function note(t,err=false){$('flash').textContent=t;$('flash').classList.toggle('error',err)}
function show(id,yes){$(id).hidden=!yes}
function date(s){return s?new Date(s).toLocaleDateString('fr-FR'):'—'}
function button(text,fn,cls='btn small'){const b=make('button',cls,text);b.type='button';b.addEventListener('click',fn);return b}
function render(){
 const groups=new Map(groupRows.map(g=>[g.id,g]));
 const selectGroup=$('groupSelect'),selectDossier=$('dossierSelect');
 selectGroup.replaceChildren();selectDossier.replaceChildren();
 if(!memberRows.length)selectGroup.add(new Option('Rejoins d’abord une classe',''));
 for(const m of memberRows)selectGroup.add(new Option(groups.get(m.group_id)?.name||'Mon groupe',m.group_id));
 if(!dossiers.length)selectDossier.add(new Option('Sauvegarde d’abord un dossier en ligne',''));
 for(const d of dossiers)selectDossier.add(new Option((d.title||'Mon dossier')+' · '+(d.student||'Élève'),d.id));
 $('shareForm').querySelector('[type=submit]').disabled=!memberRows.length||!dossiers.length;
 show('noDossier',!dossiers.length);
 if(memberRows.length&&!val('studentName'))$('studentName').value=memberRows[0].student_name||'';
 const host=$('groupList');host.replaceChildren();
 if(!memberRows.length){const box=make('div','card');box.append(make('h2','','Aucune classe pour le moment'),make('p','muted','Entre le code transmis par ton enseignant pour rejoindre sa classe.'));host.append(box);return}
 for(const m of memberRows){
  const g=groups.get(m.group_id);
  const box=make('article','card');
  box.append(make('span','tag','Inscrit'),make('h2','',g?.name||'Groupe EGE'),make('p','muted',(g?.school||'')+' · Depuis le '+date(m.joined_at)));
  const shared=shares.filter(s=>s.group_id===m.group_id);
  box.append(make('h3','',shared.length+' dossier(s) partagé(s)'));
  if(!shared.length)box.append(make('p','mini','Aucun dossier partagé : ton professeur ne voit pas encore tes travaux.'));
  for(const s of shared){
   const d=dossiers.find(d=>d.id===s.dossier_id);
   const line=make('div','entry'),name=make('strong','',d?.title||'Dossier EGE'),feedback=reviews.find(r=>r.dossier_id===s.dossier_id);
   line.append(name,make('small','','Partagé le '+date(s.submitted_at)));
   if(feedback){
    const status=feedback.decision==='valide'?'Dossier validé':'Correction demandée';
    line.append(make('p','mini',status+(feedback.annex_number?' · Annexe '+feedback.annex_number:'')+' : '+(feedback.observation||'Sans observation')));
   }
   const actions=make('div','row');actions.append(button('Ne plus partager',()=>unshare(s),'btn danger small'));line.append(actions);box.append(line);
  }
  const actions=make('div','row');actions.append(button('Quitter ce groupe',()=>leave(m),'btn danger small'));box.append(actions);
  host.append(box);
 }
}
async function refresh(){
 const ticket=++seq;
 if(!api)return;
 try{
  const {data,error}=await api.auth.getUser();
  if(error)throw error;
  if(ticket!==seq)return;
  user=data.user||null;show('authArea',!user);show('privateArea',!!user);show('signOut',!!user);
  if(!user){memberRows=[];groupRows=[];dossiers=[];shares=[];reviews=[];note('Connecte-toi avec ton compte EGE pour retrouver tes groupes.');return}
  const [a,b,c]=await Promise.all([
   api.from('ege2027_group_members').select('group_id,student_id,student_name,joined_at').eq('student_id',user.id).order('joined_at',{ascending:false}).limit(100),
   api.from('ege2027_dossiers').select('id,owner_id,title,student,updated_at').eq('owner_id',user.id).is('archived_at',null).order('updated_at',{ascending:false}).limit(200),
   api.from('ege2027_group_submissions').select('id,group_id,dossier_id,submitted_at').eq('student_id',user.id).order('submitted_at',{ascending:false}).limit(200)
  ]);
  if(a.error||b.error||c.error)throw(a.error||b.error||c.error);
  if(ticket!==seq)return;
  memberRows=a.data||[];dossiers=b.data||[];shares=c.data||[];
  groupRows=[];reviews=[];
  const ids=[...new Set(memberRows.map(m=>m.group_id))];
  if(ids.length){
   const q=await api.from('ege2027_teacher_groups').select('id,name,school,active').in('id',ids).limit(100);
   if(q.error)throw q.error;
   groupRows=q.data||[];
  }
  const dossierIds=[...new Set(shares.map(s=>s.dossier_id))];
  if(dossierIds.length){
   const q=await api.from('ege2027_reviews').select('dossier_id,decision,observation,annex_number,created_at').in('dossier_id',dossierIds).order('created_at',{ascending:false}).limit(300);
   if(q.error)throw q.error;
   reviews=q.data||[];
  }
  if(ticket!==seq)return;
  render();note('Mes groupes et dossiers sont actualisés.');
 }catch(e){note('Chargement impossible : '+(e.message||e),true)}
}
async function signIn(){
 const email=val('email').toLowerCase(),password=$('password').value;
 if(!email||!password){note('Renseigne ton adresse et ton mot de passe.',true);return}
 $('login').disabled=true;
 try{
  const {error}=await api.auth.signInWithPassword({email,password});
  if(error)throw error;
  $('password').value='';await refresh();
 }catch(e){note('Connexion impossible : '+e.message,true)}finally{$('login').disabled=false}
}
async function recover(){
 const email=val('email').toLowerCase();
 if(!email.includes('@')){note('Entre ton adresse e-mail.',true);return}
 $('recover').disabled=true;
 try{
  const {error}=await api.auth.resetPasswordForEmail(email,{redirectTo:new URL('./assistant-dossier-gfm-2027.html',location.href).href});
  if(error)throw error;
  note('Si le compte existe, un message de réinitialisation sera envoyé.');
 }catch(e){note(e.message,true)}finally{$('recover').disabled=false}
}
async function join(e){
 e.preventDefault();if(!user||busy)return;
 const p_code=val('groupCode').toUpperCase(),p_student_name=val('studentName');
 if(!/^[0-9A-F]{12}$/.test(p_code)||p_student_name.length<2){note('Indique ton nom et un code de 12 caractères.',true);return}
 busy=true;const b=$('joinForm').querySelector('[type=submit]');b.disabled=true;
 try{
  const {data:joined,error}=await api.rpc('ege2027_join_group',{p_code,p_student_name});
  if(error)throw error;
  $('groupCode').value='';await refresh();
  if(joined && memberRows.some(m=>m.group_id===joined))$('groupSelect').value=joined;
  const suggested=dossiers.length===1?dossiers[0]:null;
  if(suggested&&joined&&confirm('Associer le dossier « '+(suggested.title||'Mon dossier')+' » à cette classe ? Votre professeur pourra consulter toutes ses prochaines sauvegardes. Vos autres dossiers restent privés.')){
   const link=await api.from('ege2027_group_submissions').insert({group_id:joined,dossier_id:suggested.id,student_id:user.id});
   if(link.error&&link.error.code!=='23505'){note('Groupe rejoint, mais association impossible : '+link.error.message,true);return}
   await refresh();note('Groupe rejoint et dossier associé. Le professeur voit désormais le travail et ses prochaines modifications.');return;
  }
  note(dossiers.length?'Groupe rejoint. Choisis le dossier à associer dans le formulaire ci-dessus.':'Groupe rejoint. Crée puis sauvegarde un dossier dans ton espace élève avant de l’associer à ce groupe.');
 }catch(err){note('Impossible de rejoindre ce groupe : '+err.message,true)}
 finally{busy=false;b.disabled=false}
}
async function share(e){
 e.preventDefault();if(!user||busy)return;
 const group_id=val('groupSelect'),dossier_id=val('dossierSelect');
 if(!memberRows.some(m=>m.group_id===group_id)||!dossiers.some(d=>d.id===dossier_id)){note('Sélectionne une classe et ton dossier.',true);return}
 if(shares.some(s=>s.group_id===group_id&&s.dossier_id===dossier_id)){note('Ce dossier est déjà partagé avec ce groupe.');return}
 busy=true;const b=$('shareForm').querySelector('[type=submit]');b.disabled=true;
 try{
  const {error}=await api.from('ege2027_group_submissions').insert({group_id,dossier_id,student_id:user.id});
  if(error)throw error;
  await refresh();note('Dossier associé au groupe. Les prochaines modifications sauvegardées en ligne sont automatiquement accessibles à cet enseignant.');
 }catch(err){note('Partage impossible : '+err.message,true)}
 finally{busy=false;b.disabled=false}
}
async function unshare(s){
 if(!user||busy||!confirm('Arrêter le partage de ce dossier avec ton enseignant ?'))return;
 busy=true;
 try{
  const {error}=await api.from('ege2027_group_submissions').delete().eq('id',s.id).eq('student_id',user.id);
  if(error)throw error;
  await refresh();note('Partage retiré. Ton dossier personnel est conservé.');
 }catch(e){note(e.message,true)}finally{busy=false}
}
async function leave(m){
 if(!user||busy||!confirm('Quitter cette classe ? Les partages associés seront retirés, mais tes dossiers resteront dans ton compte.'))return;
 busy=true;
 try{
  const {error}=await api.from('ege2027_group_members').delete().eq('group_id',m.group_id).eq('student_id',user.id);
  if(error)throw error;
  await refresh();note('Tu as quitté la classe. Tes dossiers personnels sont conservés.');
 }catch(e){note('Départ impossible : '+e.message,true)}finally{busy=false}
}
async function boot(){
 if(!window.supabase?.createClient){note('La bibliothèque Supabase ne s’est pas chargée. Vérifie ta connexion Internet.',true);return}
 api=window.supabase.createClient(DB,KEY);
 $('login').addEventListener('click',signIn);
 $('recover').addEventListener('click',recover);
 $('joinForm').addEventListener('submit',join);
 $('shareForm').addEventListener('submit',share);
 $('reload').addEventListener('click',refresh);
 $('signOut').addEventListener('click',async()=>{await api.auth.signOut();await refresh()});
 api.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT')refresh()});
 await refresh();
}
document.addEventListener('DOMContentLoaded',boot);
})();