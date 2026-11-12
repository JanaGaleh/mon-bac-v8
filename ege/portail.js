/* Portail par rôles — ne confère jamais de privilèges à partir d'un choix utilisateur. */
(()=>{'use strict';
const PROJECT='https://nwcatsmfbkcgvgbanwyl.supabase.co';
const PUBLIC_KEY='sb_publishable_vXuRHP_lqGqtV9d1C_oZWw_SetdoY7L';
const PATHS={eleve:'./assistant-dossier-gfm-2027.html',enseignant:'./enseignant.html',admin:'./admin.html'};
const $=id=>document.getElementById(id);
let api=null,requested='eleve',user=null,actual='eleve',busy=false;
const originUrl=new URL('./',location.href).href;
function notice(txt,good=false){const e=$('notice');e.textContent=txt;e.classList.toggle('ok',good)}
function panel(view){$('choose').hidden=view!=='choose';$('loginPanel').hidden=view!=='login';$('resetPanel').hidden=view!=='reset';}
function safeStore(r){try{sessionStorage.setItem('ege2027_last_role',r)}catch(_){}}
function safeRead(){try{return sessionStorage.getItem('ege2027_last_role')}catch(_){return null}}
function go(role){location.assign(new URL(PATHS[role]||PATHS.eleve,location.href).href)}
async function resolveRole(){
 if(!user)return 'eleve';
 const admin=await api.from('ege2027_staff').select('role').eq('user_id',user.id).maybeSingle();
 if(admin.error)throw admin.error;
 if(admin.data?.role==='admin')return 'admin';
 const teacher=await api.from('ege2027_teacher_requests').select('status').eq('user_id',user.id).maybeSingle();
 if(teacher.error)throw teacher.error;
 if(teacher.data||admin.data?.role==='enseignant')return 'enseignant';
 return (user.user_metadata?.requested_role==='enseignant'||safeRead()==='enseignant')?'enseignant':'eleve';
}
function openRole(role){
 requested=role;
 safeStore(role);
 panel('login');
 const names={eleve:'Élève',enseignant:'Enseignant',admin:'Administration'};
 $('loginTitle').textContent='Espace '+names[role];
 $('loginHelp').textContent=role==='admin'?'Accès réservé aux administrateurs autorisés.':'Connectez-vous pour retrouver votre travail.';
 $('teacherNotice').hidden=role!=='enseignant';
 $('signup').hidden=role==='admin';
 notice('');
 if(user){go(actual==='enseignant'&&role==='eleve'?'enseignant':actual==='admin'?'admin':role==='enseignant'?'enseignant':'eleve');}
}
async function refresh({auto=true}={}){
 if(!api)return;
 try{
  const {data,error}=await api.auth.getUser();
  if(error)throw error;
  user=data.user||null;
  if(!user)return;
  actual=await resolveRole();
  const reset=(new URLSearchParams(location.hash.slice(1)).get('type')==='recovery');
  if(reset){panel('reset');return}
  if(auto&&new URLSearchParams(location.search).get('choisir')!=='1')go(actual);
 }catch(e){notice('Impossible de vérifier le compte : '+(e.message||e))}
}
async function submit(e){
 e.preventDefault();
 if(!api||busy)return;
 const email=$('userEmail').value.trim().toLowerCase(),password=$('userPassword').value;
 if(password.length<6){notice('Entrez votre mot de passe.');return}
 busy=true;$('submitLogin').disabled=true;notice('Connexion en cours…');
 try{
  const {error}=await api.auth.signInWithPassword({email,password});
  if(error)throw error;
  const {data}=await api.auth.getUser();
  user=data.user;
  actual=await resolveRole();
  if(requested==='admin'&&actual!=='admin'){notice('Ce compte ne dispose pas des droits administrateur.');return}
  go(actual==='enseignant'?'enseignant':actual==='admin'?'admin':requested==='enseignant'?'enseignant':'eleve');
 }catch(err){notice('Connexion impossible : '+(err?.message||err))}
 finally{busy=false;$('submitLogin').disabled=false}
}
async function signup(){
 if(!api||busy)return;
 const email=$('userEmail').value.trim().toLowerCase(),password=$('userPassword').value;
 if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)||password.length<12){notice('Renseignez un e-mail valide et un mot de passe d’au moins 12 caractères.');return}
 busy=true;$('signup').disabled=true;
 try{
  const {data,error}=await api.auth.signUp({email,password,options:{emailRedirectTo:originUrl,data:{requested_role:requested==='enseignant'?'enseignant':'eleve'}}});
  if(error)throw error;
  if(data.session){user=data.user;go(requested)}
  else notice('Inscription enregistrée. Confirmez votre adresse à l’aide du message de Prof. Jana Galeh puis revenez vous connecter.',true);
 }catch(err){notice('Inscription impossible : '+(err?.message||err))}
 finally{busy=false;$('signup').disabled=false}
}
async function forgot(){
 if(!api)return;
 const email=$('userEmail').value.trim().toLowerCase();
 if(!email.includes('@')){notice('Indiquez d’abord votre adresse e-mail.');return}
 try{const {error}=await api.auth.resetPasswordForEmail(email,{redirectTo:originUrl});if(error)throw error;notice('Si le compte existe, un e-mail de récupération vous sera envoyé.',true)}
 catch(e){notice('Réinitialisation indisponible : '+e.message)}
}
async function reset(e){
 e.preventDefault();
 const password=$('newPassword').value;
 if(password.length<12){notice('Saisissez au moins 12 caractères.');return}
 try{const {error}=await api.auth.updateUser({password});if(error)throw error;history.replaceState(null,'',location.pathname);notice('Mot de passe modifié. Vous pouvez accéder à votre espace.',true);await refresh({auto:true})}
 catch(err){notice('Modification impossible : '+err.message)}
}
async function boot(){
 document.querySelectorAll('[data-role]').forEach(btn=>btn.addEventListener('click',()=>openRole(btn.dataset.role)));
 $('goBack').addEventListener('click',()=>{panel('choose');notice('')});
 $('eye').addEventListener('click',()=>{let input=$('userPassword');input.type=input.type==='password'?'text':'password';$('eye').textContent=input.type==='password'?'Voir':'Masquer';});
 $('loginForm').addEventListener('submit',submit);
 $('signup').addEventListener('click',signup);
 $('forgot').addEventListener('click',forgot);
 $('resetForm').addEventListener('submit',reset);
 if(!window.supabase?.createClient){notice('Connexion impossible. Vérifiez votre accès à Internet.');return}
 api=window.supabase.createClient(PROJECT,PUBLIC_KEY);
 if('serviceWorker' in navigator)navigator.serviceWorker.register('./service-worker-ege-2027.js').catch(()=>{});
 api.auth.onAuthStateChange(event=>{if(event==='PASSWORD_RECOVERY')panel('reset');});
 if(new URLSearchParams(location.hash.slice(1)).get('type')==='recovery')panel('reset');
 await refresh({auto:true});
}
document.addEventListener('DOMContentLoaded',boot);
})();