/* Phase 1 : espace multi-dossiers et historique EGE GFM 2027.
   Les dossiers privés sont chargés depuis Supabase, avec contrôles RLS.
   Pas de rôle administrateur ni de mot de passe stocké ici. */
(function(){
'use strict';
const id=n=>document.getElementById(n);
let accountId=null, currentId=null, currentTitle='', list=[], showArchived=false, busy=false;
const nameOf=row=>String(row?.title||row?.student||'Mon dossier EGE').trim();
const str=x=>String(x??'').trim();
const date=s=>{try{return new Date(s).toLocaleString('fr-FR')}catch{return '—'}};
const key=uid=>'ege2027_dossier_selection_'+uid;
const cloud=()=>typeof egeSupabaseClient!=='undefined'&&egeSupabaseClient&&typeof egeCloudUser!=='undefined'&&egeCloudUser;
const cloudMsg=message=>{if(typeof egeCloudMsg==='function')egeCloudMsg(message)};
const el=(tag,cls,text)=>{let e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=String(text);return e;};
const populated=()=>!!(data?.student||data?.problem||Object.values(data?.annexes||{}).some(Boolean));
function status(text,bad=false){let e=id('egeDossierStatus');if(e){e.textContent=text;e.classList.toggle('error',bad)}cloudMsg(text)}
function getStored(){
 if(!accountId)return;
 try{const v=JSON.parse(localStorage.getItem(key(accountId))||'null');currentId=v?.id||null;currentTitle=v?.title||''}
 catch{currentId=null;currentTitle=''}
}
function store(){
 if(!accountId)return;
 try{if(currentId)localStorage.setItem(key(accountId),JSON.stringify({id:currentId,title:currentTitle}));else localStorage.removeItem(key(accountId))}catch{}
}
function onAuthChanged(user){
 const now=user?.id||null;
 if(now===accountId)return;
 accountId=now;currentId=null;currentTitle='';list=[];getStored();
 const b=id('egeDossierCurrent');
 if(b)b.textContent=accountId?(currentTitle||'Dossier local non associé'):'Connexion nécessaire';
}
function notifyCurrent(){
 const e=id('egeDossierCurrent');if(e)e.textContent=currentId?(currentTitle||'Dossier en ligne sélectionné'):'Brouillon local';
}
function cleanPayload(source){
 if(!source||typeof source!=='object'||Array.isArray(source))throw Error('Structure du dossier non reconnue');
 const v=empty();
 for(const k of Object.keys(v))if(Object.prototype.hasOwnProperty.call(source,k))v[k]=source[k];
 for(const k of ['annexes','sources','sourceChecks','researchEvidence','annexBackup'])
 v[k]=source[k]&&typeof source[k]==='object'&&!Array.isArray(source[k])?source[k]:{};
 v.candidates=Array.isArray(source.candidates)?source.candidates.slice(0,7):Array(7).fill('');
 v.mode=['','individuel','binome'].includes(source.mode)?source.mode:'';
 v.theme=Number.isInteger(source.theme)&&source.theme>=0&&source.theme<CATALOG.length?source.theme:null;
 v.subtheme=v.theme!==null&&Number.isInteger(source.subtheme)&&source.subtheme>=0&&source.subtheme<CATALOG[v.theme].subthemes.length?source.subtheme:null;
 if(!/^(welcome|mode|student|partner|className|school|teacher|theme|subtheme|problem|annex[1-4]|source[1-4]|company|candidates|finish)$/.test(v.step||''))v.step='welcome';
 if(!v.mode)v.step='mode';
 return v;
}
function dialog(open){
 const overlay=id('egeDossierOverlay');
 if(!overlay)return;
 overlay.hidden=!open;
 if(open){if(typeof egeCloudOpen==='function')egeCloudOpen(false);notifyCurrent();}
 if(open)id('egeDossierClose')?.focus();
}
async function fetchList(){
 if(!cloud()){status('Connecte-toi pour voir tes dossiers.',true);return}
 const {data:rows,error}=await egeSupabaseClient.from('ege2027_dossiers')
 .select('id,title,student,updated_at,archived_at')
 .eq('owner_id',egeCloudUser.id).order('updated_at',{ascending:false}).limit(150);
 if(error)throw error;
 list=rows||[];
 renderList();
}
function renderList(){
 const host=id('egeDossierList');
 if(!host)return;
 host.replaceChildren();
 const archivedToggle=id('egeShowArchived');
 if(archivedToggle)archivedToggle.checked=showArchived;
 const filtered=list.filter(row=>!!row.archived_at===showArchived);
 const q=str(id('egeDossierSearch')?.value||'').toLocaleLowerCase('fr');
 const selected=filtered.filter(row=>(nameOf(row)+' '+(row.student||'')).toLocaleLowerCase('fr').includes(q));
 const count=id('egeDossierCount');if(count)count.textContent=selected.length+' dossier(s)';
 if(!selected.length){host.append(el('p','ege-dossier-hint',showArchived?'Aucun dossier archivé.':'Aucun dossier enregistré. Utilise « Nouveau dossier » ou « Sauvegarder en ligne ».'));return}
 for(const row of selected){
  const card=el('article','ege-dossier-card'+(currentId===row.id?' is-selected':''));
  const heading=el('div','ege-dossier-main');
  heading.append(el('b','',nameOf(row)),el('small','',(row.student||'Candidat non renseigné')+' · '+date(row.updated_at)));
  const buttons=el('div','ege-dossier-row-actions');
  const open=el('button','ege-dossier-primary',row.archived_at?'Consulter':'Ouvrir');
  open.type='button';open.addEventListener('click',()=>openDossier(row));
  buttons.append(open);
  if(row.archived_at){
   const unarchive=el('button','ege-dossier-secondary','Réactiver');unarchive.type='button';unarchive.addEventListener('click',()=>archiveDossier(row,false));buttons.append(unarchive);
  }else{
   const versions=el('button','ege-dossier-secondary','Versions');versions.type='button';versions.addEventListener('click',()=>showVersions(row));buttons.append(versions);
   const rename=el('button','ege-dossier-secondary','Renommer');rename.type='button';rename.addEventListener('click',()=>renameDossier(row));buttons.append(rename);
   const archive=el('button','ege-dossier-muted','Archiver');archive.type='button';archive.addEventListener('click',()=>archiveDossier(row,true));buttons.append(archive);
  }
  card.append(heading,buttons);host.append(card);
 }
}
async function saveDossier(){
 if(!cloud()){if(typeof egeCloudOpen==='function')egeCloudOpen(true);cloudMsg('Connecte-toi pour enregistrer plusieurs dossiers en ligne. Le brouillon reste sur ton appareil.');return false}
 if(busy)return false;
 busy=true;status('Enregistrement en ligne…');
 try{
  const json=JSON.parse(JSON.stringify(data));
  const student=str(data.student||'').slice(0,140);
  const title=(str(currentTitle)||('Dossier de '+(student||'nouveau candidat'))).slice(0,100);
  let row=null,error=null;
  const payload={student,title,payload:json,updated_at:new Date().toISOString()};
  if(currentId){
   ({data:row,error}=await egeSupabaseClient.from('ege2027_dossiers')
     .update(payload).eq('owner_id',egeCloudUser.id).eq('id',currentId).select('id,title,updated_at').maybeSingle());
   if(!error&&!row)throw Error('Ce dossier n’existe plus ou n’appartient pas à ce compte. Ouvre « Mes dossiers » avant de réessayer.');
  }else{
   ({data:row,error}=await egeSupabaseClient.from('ege2027_dossiers')
     .insert({...payload,owner_id:egeCloudUser.id}).select('id,title,updated_at').single());
  }
  if(error)throw error;
  currentId=row.id;currentTitle=row.title;store();notifyCurrent();
  status('Dossier sauvegardé. Une version précédente pourra être restaurée depuis « Versions ».');
  return true;
 }catch(e){status('Sauvegarde impossible : '+(e?.message||String(e))+'. Ton travail reste sur cet appareil.',true);return false}
 finally{busy=false}
}
async function openDossiers(){
 dialog(true);
 status('Chargement de tes dossiers…');
 try{await fetchList();status('Sélectionne un dossier ou crée un nouveau projet. Le dossier actuel n’est pas remplacé sans confirmation.')}
 catch(e){status('Liste indisponible : '+(e?.message||String(e)),true)}
}
async function openDossier(row){
 if(!cloud())return;
 if(populated()&&!confirm('Ouvrir « '+nameOf(row)+' » ? Le dossier actuellement affiché sur cet appareil sera remplacé. Sauvegarde-le avant de continuer si tu souhaites le conserver.'))return;
 status('Ouverture du dossier…');
 try{
  const {data:remote,error}=await egeSupabaseClient.from('ege2027_dossiers')
   .select('id,title,payload').eq('id',row.id).eq('owner_id',egeCloudUser.id).single();
  if(error)throw error;
  const draft=cleanPayload(remote.payload);
  const old=data;
  data=draft;
  if(!save()){data=old;throw Error('Impossible d’écrire dans le stockage local : espace insuffisant.')}
  currentId=remote.id;currentTitle=remote.title;store();render();notifyCurrent();dialog(false);window.scrollTo({top:0,behavior:'smooth'});
  toast('Dossier « '+currentTitle+' » ouvert.');
 }catch(e){status('Ouverture impossible : '+(e?.message||String(e)),true)}
}
function newDossier(){
 if(populated()&&!confirm('Créer un nouveau dossier vierge ? Le dossier actuellement ouvert sera remplacé sur cet appareil. Sauvegarde-le d’abord en ligne ou en JSON si nécessaire.'))return;
 data=empty();currentId=null;currentTitle='';store();save();render();dialog(false);window.scrollTo({top:0,behavior:'smooth'});
 toast('Nouveau dossier prêt. Il sera ajouté à ton compte lors de la première sauvegarde en ligne.');
}
async function renameDossier(row){
 const value=prompt('Nom du dossier (100 caractères maximum)',nameOf(row));
 if(value===null)return;
 const title=str(value).slice(0,100);
 if(!title){status('Le nom ne peut pas être vide.',true);return}
 const {error}=await egeSupabaseClient.from('ege2027_dossiers').update({title,updated_at:new Date().toISOString()})
   .eq('id',row.id).eq('owner_id',egeCloudUser.id);
 if(error){status('Renommage impossible : '+error.message,true);return}
 if(currentId===row.id){currentTitle=title;store();notifyCurrent()}
 status('Dossier renommé.');await fetchList();
}
async function archiveDossier(row,archive){
 if(archive&&!confirm('Archiver « '+nameOf(row)+' » ? Il restera disponible dans les archives.'))return;
 const {error}=await egeSupabaseClient.from('ege2027_dossiers')
  .update({archived_at:archive?new Date().toISOString():null,updated_at:new Date().toISOString()})
  .eq('id',row.id).eq('owner_id',egeCloudUser.id);
 if(error){status('Modification impossible : '+error.message,true);return}
 if(archive&&row.id===currentId){currentId=null;currentTitle='';store();notifyCurrent()}
 status(archive?'Dossier archivé, sans suppression.':'Dossier réactivé.');
 await fetchList();
}
async function showVersions(row){
 if(!cloud())return;
 const host=id('egeDossierVersions'),title=id('egeVersionsTitle');
 if(!host||!title)return;
 title.textContent='Historique : '+nameOf(row);
 host.replaceChildren(el('p','ege-dossier-hint','Chargement des sauvegardes…'));
 const pane=id('egeDossierVersionsPanel');pane.hidden=false;
 try{
  const {data:versions,error}=await egeSupabaseClient.from('ege2027_versions')
    .select('id,created_at,student,title').eq('dossier_id',row.id).order('created_at',{ascending:false}).limit(20);
  if(error)throw error;
  host.replaceChildren();
  if(!versions?.length){host.append(el('p','ege-dossier-hint','Aucune version enregistrée.'));return}
  for(const item of versions){
   const box=el('div','ege-version-row');
   box.append(el('span','',date(item.created_at)));
   const btn=el('button','ege-dossier-secondary','Restaurer');btn.type='button';btn.addEventListener('click',()=>restoreVersion(row,item));box.append(btn);host.append(box);
  }
 }catch(e){host.replaceChildren(el('p','ege-dossier-hint','Historique indisponible : '+(e?.message||String(e))))}
}
async function restoreVersion(row,version){
 if(!cloud()||!confirm('Restaurer la version du '+date(version.created_at)+' ? Elle remplacera le dossier affiché et sera enregistrée comme nouvelle sauvegarde.'))return;
 status('Restauration de la version…');
 try{
  const {data:rev,error}=await egeSupabaseClient.from('ege2027_versions')
  .select('payload,title,student,created_at').eq('id',version.id).eq('dossier_id',row.id).single();
  if(error)throw error;
  const remote=cleanPayload(rev.payload);
  const old=data,oldId=currentId,oldTitle=currentTitle;
  data=remote;currentId=row.id;currentTitle=row.title;store();
  if(!save()){data=old;currentId=oldId;currentTitle=oldTitle;store();throw Error('Impossible de stocker la version localement')}
  const saved=await saveDossier();
  if(!saved){status('La version est restaurée localement, mais son enregistrement en ligne a échoué : utilise « Sauvegarder en ligne ».',true);return}
  render();dialog(false);toast('Ancienne version restaurée et enregistrée.');
 }catch(e){status('Restauration impossible : '+(e?.message||String(e)),true)}
}
async function showReviews(){
 if(!cloud()){if(typeof egeCloudOpen==='function')egeCloudOpen(true);cloudMsg('Connecte-toi pour consulter les corrections.');return}
 if(!currentId){await openDossiers();status('Ouvre d’abord un dossier pour voir ses corrections.');return}
 const {data:reviews,error}=await egeSupabaseClient.from('ege2027_reviews')
 .select('decision,observation,created_at').eq('dossier_id',currentId).order('created_at',{ascending:false}).limit(10);
 if(error){cloudMsg('Corrections indisponibles : '+error.message);return}
 if(typeof egeCloudOpen==='function')egeCloudOpen(true);
 cloudMsg(!reviews?.length?'Pas encore de correction pour ce dossier.':reviews.map(x=>
  (x.decision==='valide'?'Validé':'À corriger')+' ('+date(x.created_at)+') : '+x.observation).join('\n\n'));
}
async function forgotPassword(){
 if(!egeSupabaseClient)return;
 const email=str(id('egeCloudEmail')?.value).toLowerCase();
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){cloudMsg('Entre ton adresse e-mail pour demander un nouveau mot de passe.');return}
 const btn=id('egeCloudForgot');if(btn)btn.disabled=true;
 try{
  const {error}=await egeSupabaseClient.auth.resetPasswordForEmail(email,{redirectTo:'https://ege-gfm-2027.janakaleh.workers.dev/'});
  if(error)throw error;
  cloudMsg('Si ton compte existe, un lien de réinitialisation a été demandé. Vérifie tes e-mails et les spams. Le lien doit ouvrir l’application EGE.');
 }catch(e){cloudMsg('Réinitialisation impossible : '+(e?.message||String(e)))}
 finally{if(btn)btn.disabled=false}
}
function showRecovery(){
 const panel=id('egeRecoveryOverlay');if(!panel)return;
 panel.hidden=false;
 if(typeof egeCloudOpen==='function')egeCloudOpen(false);
 id('egeRecoveryPassword')?.focus();
}
async function updatePassword(e){
 e?.preventDefault();
 const password=id('egeRecoveryPassword')?.value||'';
 const confirmPass=id('egeRecoveryConfirm')?.value||'';
 const msg=id('egeRecoveryMessage');
 if(password.length<12||password!==confirmPass){if(msg)msg.textContent='Utilise au moins 12 caractères et confirme exactement le même mot de passe.';return}
 const btn=id('egeRecoverySubmit');if(btn)btn.disabled=true;
 try{
  if(!egeSupabaseClient)throw Error('Connexion Supabase indisponible');
  const {error}=await egeSupabaseClient.auth.updateUser({password});
  if(error)throw error;
  if(msg)msg.textContent='Mot de passe modifié. Tu peux maintenant te connecter avec cette adresse e-mail et ton nouveau mot de passe.';
  id('egeRecoveryPassword').value='';id('egeRecoveryConfirm').value='';
  id('egeRecoveryOverlay').hidden=true;
  if(typeof egeCloudOpen==='function')egeCloudOpen(true);
  cloudMsg('Mot de passe mis à jour.');
 }catch(err){if(msg)msg.textContent='Modification refusée : '+(err?.message||String(err))}
 finally{if(btn)btn.disabled=false}
}
function buildPhase1UI(){
 if(id('egeDossierOverlay'))return;
 const style=document.createElement('style');
 style.textContent=".ege-phase-overlay[hidden],.ege-dossier-history[hidden]{display:none!important}.ege-phase-overlay{position:fixed;inset:0;z-index:6300;background:#142943bb;display:flex;align-items:center;justify-content:center;padding:10px}.ege-phase-modal{background:#fff;color:#18344f;width:min(100%,660px);max-height:calc(100dvh - 20px);overflow:auto;padding:23px;border-radius:20px;box-shadow:0 20px 60px #071d3355}.ege-phase-header{display:flex;justify-content:space-between;align-items:start;gap:10px}.ege-phase-header h2{font-size:24px;margin:2px 0}.ege-phase-header small{font-size:11px;font-weight:800;color:#2460b9}.ege-phase-header p,.ege-phase-modal>p{font-size:12px;color:#718196}.ege-close{font-size:26px;width:40px}.ege-current{margin:15px 0;padding:12px;background:#ecf4ff;border-radius:12px;display:flex;justify-content:space-between;gap:10px}.ege-current strong{color:#235b9e}.ege-tools,.ege-dossier-row-actions,.ege-filter,.ege-version-head,.ege-version-row,.ege-count{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:9px}.ege-tools{margin:14px 0}.ege-phase-modal button{min-height:40px;border:1px solid #cbdbed;border-radius:10px;background:#eef4fc;color:#28598c;padding:8px 13px;font-weight:700;font-size:13px}.ege-phase-modal button.ege-primary,.ege-phase-modal button.ege-dossier-primary{background:#245ed7;border-color:#245ed7;color:white}.ege-phase-modal button.ege-dossier-muted{color:#896575;background:#faf5f7}.ege-filter>input{flex:1;min-width:0;border:1px solid #cfdeec;border-radius:10px;padding:11px;background:white}.ege-filter label{font-size:12px;display:flex;align-items:center;gap:5px}.ege-list{display:grid;gap:9px;max-height:40vh;overflow-y:auto;margin:10px 0}.ege-dossier-card{border:1px solid #d9e5f2;border-radius:12px;padding:12px}.ege-dossier-card.is-selected{background:#f2f8ff;border-color:#93b7ea}.ege-dossier-main b{display:block}.ege-dossier-main small{display:block;color:#657990;font-size:11px}.ege-dossier-row-actions{justify-content:flex-start;margin-top:9px}.ege-dossier-history{background:#f8fbff;border:1px solid #dce6f1;border-radius:12px;padding:12px}.ege-version-row{border-top:1px solid #e3ecf5;padding:7px 0}.ege-version-head h3{margin:0;font-size:15px}.ege-dossier-status{font-size:12px;color:#225c93;border-top:1px solid #e0e8f1;padding-top:10px;white-space:pre-wrap}.ege-dossier-status.error{color:#af4332}.ege-recovery-form label{display:block;font-weight:700;margin:12px 0 5px}.ege-recovery-form input{width:100%;border:1px solid #c9d9e9;border-radius:10px;padding:12px;background:#fff}.ege-cloud-password-wrap{display:flex;gap:5px}.ege-cloud-password-wrap input{flex:1;min-width:0}.ege-cloud-password-wrap button{border:1px solid #d2dfea;border-radius:10px;background:#eef4fa;color:#255a98;padding:10px}#egeCloudForgot{border:0;background:transparent;color:#245ed7;text-decoration:underline;padding:9px;font-size:12px;font-weight:700}body:has(.ege-phase-overlay:not([hidden])){overflow:hidden}body:has(.ege-phase-overlay:not([hidden])) .ege-bottom-nav{display:none!important}@media(max-width:740px){.ege-phase-overlay{padding:6px;padding-bottom:calc(6px + env(safe-area-inset-bottom))}.ege-phase-modal{max-height:calc(100dvh - 12px - env(safe-area-inset-bottom));padding:16px}.ege-current{display:block}.ege-current strong{display:block}.ege-dossier-row-actions button{flex:1}}@media print{.ege-phase-overlay{display:none!important}}";document.head.appendChild(style);
 document.body.insertAdjacentHTML('beforeend',"<div id=\"egeDossierOverlay\" class=\"ege-phase-overlay\" hidden role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"egeDossierTitle\"><section class=\"ege-phase-modal\">\n <header class=\"ege-phase-header\"><div><small>ESPACE PERSONNEL</small><h2 id=\"egeDossierTitle\">Mes dossiers EGE</h2><p>Plusieurs dossiers et historique de sauvegarde.</p></div><button id=\"egeDossierClose\" class=\"ege-close\" type=\"button\" aria-label=\"Fermer\">×</button></header>\n <div class=\"ege-current\"><small>Actuellement ouvert</small><strong id=\"egeDossierCurrent\">Brouillon local</strong></div>\n <div class=\"ege-tools\"><button id=\"egeDossierNew\" type=\"button\" class=\"ege-primary\">+ Nouveau dossier</button><button id=\"egeDossierRefresh\" type=\"button\">Actualiser</button></div>\n <div class=\"ege-filter\"><input id=\"egeDossierSearch\" type=\"search\" placeholder=\"Rechercher un dossier\" aria-label=\"Rechercher un dossier\"><label><input id=\"egeShowArchived\" type=\"checkbox\"> Archives</label></div>\n <div class=\"ege-count\"><b>Mes documents</b><small id=\"egeDossierCount\"></small></div><div id=\"egeDossierList\" class=\"ege-list\"></div>\n <section id=\"egeDossierVersionsPanel\" class=\"ege-dossier-history\" hidden><div class=\"ege-version-head\"><h3 id=\"egeVersionsTitle\">Versions</h3><button id=\"egeVersionsClose\" type=\"button\">Fermer</button></div><div id=\"egeDossierVersions\"></div><p>Les 20 dernières versions sont récupérables.</p></section>\n <div class=\"ege-tools\"><button id=\"egeDossierSaveLocal\" type=\"button\">Exporter JSON</button><button id=\"egeDossierImport\" type=\"button\">Importer Word / JSON</button></div><p id=\"egeDossierStatus\" role=\"status\" aria-live=\"polite\">Prêt.</p>\n</section></div>\n<div id=\"egeRecoveryOverlay\" class=\"ege-phase-overlay\" hidden role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"egeRecoveryTitle\"><section class=\"ege-phase-modal\" style=\"max-width:450px\"><h2 id=\"egeRecoveryTitle\">Nouveau mot de passe</h2>\n <p>Définis un mot de passe EGE distinct de Gmail.</p><form id=\"egeRecoveryForm\">\n <label for=\"egeRecoveryPassword\">Nouveau mot de passe (12 caractères minimum)</label><input id=\"egeRecoveryPassword\" type=\"password\" minlength=\"12\" autocomplete=\"new-password\" required>\n <label for=\"egeRecoveryConfirm\">Confirmer</label><input id=\"egeRecoveryConfirm\" type=\"password\" minlength=\"12\" autocomplete=\"new-password\" required><p id=\"egeRecoveryMessage\" role=\"status\"></p>\n <div class=\"ege-tools\"><button id=\"egeRecoverySubmit\" class=\"ege-primary\" type=\"submit\">Enregistrer</button><button id=\"egeRecoveryDismiss\" type=\"button\">Fermer</button></div></form></section></div>");
 const auth=id('egeCloudAuth'),pwd=id('egeCloudPassword');
 if(auth&&pwd){const row=document.createElement('div');row.className='ege-cloud-password-wrap';pwd.parentNode.insertBefore(row,pwd);row.append(pwd);const eye=el('button','','Voir');eye.id='egeCloudPasswordEye';eye.type='button';row.append(eye);const forgot=el('button','','Mot de passe oublié ?');forgot.id='egeCloudForgot';forgot.type='button';auth.append(forgot)}
 const actions=id('egeCloudActions');if(actions){const row=el('div','ege-cloud-buttons');const b=el('button','ege-cloud-primary','Mes dossiers');b.id='egeCloudOpenDossiers';b.type='button';row.append(b);actions.prepend(row)}
}
function init(){
 buildPhase1UI();
 id('egeDossierClose')?.addEventListener('click',()=>dialog(false));
 id('egeDossierOverlay')?.addEventListener('click',e=>{if(e.target===id('egeDossierOverlay'))dialog(false)});
 id('egeDossierNew')?.addEventListener('click',newDossier);
 id('egeDossierRefresh')?.addEventListener('click',openDossiers);
 id('egeDossierSearch')?.addEventListener('input',renderList);
 id('egeShowArchived')?.addEventListener('change',e=>{showArchived=e.target.checked;renderList()});
 id('egeVersionsClose')?.addEventListener('click',()=>id('egeDossierVersionsPanel').hidden=true);
 id('egeCloudForgot')?.addEventListener('click',forgotPassword);
 id('egeRecoveryForm')?.addEventListener('submit',updatePassword);
 id('egeRecoveryDismiss')?.addEventListener('click',()=>id('egeRecoveryOverlay').hidden=true);
 id('egeCloudPasswordEye')?.addEventListener('click',()=>{
  const inp=id('egeCloudPassword'),btn=id('egeCloudPasswordEye');if(!inp||!btn)return;
  const shown=inp.type==='password';inp.type=shown?'text':'password';btn.textContent=shown?'Masquer':'Voir';btn.setAttribute('aria-pressed',String(shown));
 });
 id('egeCloudOpenDossiers')?.addEventListener('click',openDossiers);
 id('egeDossierCurrentLink')?.addEventListener('click',openDossiers);
 id('egeDossierImport')?.addEventListener('click',()=>{dialog(false);id('importFile')?.click()});
 id('egeDossierSaveLocal')?.addEventListener('click',()=>backup());
 if(typeof egeCloudUser!=='undefined')onAuthChanged(egeCloudUser);
 if(location.hash.includes('type=recovery')||new URLSearchParams(location.search).get('type')==='recovery'){
  setTimeout(()=>{if(typeof egeCloudUser!=='undefined'&&egeCloudUser)showRecovery()},600);
 }
}
function detachCurrent(){currentId=null;currentTitle='';store();notifyCurrent()}
window.EGE2027Phase1={init,onAuthChanged,saveDossier,openDossiers,showReviews,showRecovery,detachCurrent};
document.addEventListener('DOMContentLoaded',init);
})();
