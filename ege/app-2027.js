'use strict';
const paths={
 home:'<path d="M3 10.5 12 3l9 7.5V21h-6v-7H9v7H3z"/>',
 book:'<path d="M3 5.5c3-1.4 6-1.4 9 0v14c-3-1.4-6-1.4-9 0zm18 0c-3-1.4-6-1.4-9 0v14c3-1.4 6-1.4 9 0z"/>',
 cap:'<path d="m2 9 10-5 10 5-10 5-10-5zm5 3v5c3 2.3 7 2.3 10 0v-5m5-3v7"/>',
 users:'<circle cx="9" cy="8" r="3"/><path d="M3 20v-3c0-2.4 2.5-4 6-4s6 1.6 6 4v3"/><path d="M17 5a3 3 0 0 1 0 6m1 3c2.5.3 4 1.4 4 3v3"/>',
 shield:'<path d="M12 2 4 6v6c0 5 3 8.3 8 10 5-1.7 8-5 8-10V6z"/><path d="m9 12 2 2 4-4"/>',
 folder:'<path d="M3 6h7l2 2h9v12H3z"/>',
 file:'<path d="M6 2h9l5 5v15H6z"/><path d="M15 2v6h5M9 12h8M9 16h8"/>',
 bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9z"/><path d="M10 21h4"/>',
 user:'<circle cx="12" cy="7" r="4"/><path d="M4 21c0-5 3-8 8-8s8 3 8 8"/>',
 chevron:'<path d="m9 5 7 7-7 7"/>',
 left:'<path d="m15 5-7 7 7 7"/>',
 arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
 plus:'<path d="M12 4v16M4 12h16"/>',
 check:'<path d="m4 12 5 5L20 6"/>',
 cloud:'<path d="M6 19h13a4 4 0 0 0 0-8h-1.2A7 7 0 0 0 4.5 13 3.3 3.3 0 0 0 6 19z"/>',
 chat:'<path d="M4 4h16v12H8l-4 4z"/>',
 edit:'<path d="m4 20 4-.7L20 7a2 2 0 0 0-3-3L5 16z"/>',
 copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
 trash:'<path d="M4 7h16M10 4h4m-8 3 1 14h10l1-14M10 11v6m4-6v6"/>',
 search:'<circle cx="10.7" cy="10.7" r="6.7"/><path d="m16 16 5 5"/>',
 settings:'<circle cx="12" cy="12" r="3"/><path d="m9 2 1 2h4l1-2 3 2-1 2 2 3 2 1v4l-2 1-2 3 1 2-3 2-1-2h-4l-1 2-3-2 1-2-2-3-2-1v-4l2-1 2-3-1-2z"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 3"/>',
 logout:'<path d="M10 4H4v16h6M13 8l4 4-4 4m-8-4h12"/>',
 eye:'<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z"/><circle cx="12" cy="12" r="2.6"/>',
 'eye-off':'<path d="M3 3l18 18M10.6 6.1A11.8 11.8 0 0 1 12 6c6.5 0 10 6 10 6a14.2 14.2 0 0 1-4.1 4.2M6.1 6.3C3.5 8.1 2 12 2 12s3.5 6 10 6c1.3 0 2.6-.2 3.7-.6"/><path d="M10 10a2.8 2.8 0 0 0 4 4"/>',
 download:'<path d="M12 3v13m-5-5 5 5 5-5M4 20h16"/>',
 more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
 lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 1 1 8 0v3"/>',
 spark:'<path d="m12 2 1.5 6.5L20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5zM19 17l.7 2.3L22 20l-2.3.7L19 23l-.7-2.3L16 20l2.3-.7z"/>',
 chart:'<path d="M4 20V4M4 20h17M8 16v-5m5 5V7m5 9V3"/>',
 warning:'<path d="m12 3 10 18H2zM12 9v5m0 3v.1"/>',
 menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
 monitor:'<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
 phone:'<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 19h2"/>',
 tablet:'<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M11 19h2"/>'
};
const I=(name,cls='')=>`<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${paths[name]||paths.file}</svg>`;
const esc=s=>String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));


'use strict';
const DB_URL="https://nwcatsmfbkcgvgbanwyl.supabase.co";
const DB_PUBLIC="sb_publishable_vXuRHP_lqGqtV9d1C_oZWw_SetdoY7L";
const appBase=new URL("./",location.href).href;
const screenList=[
["welcome","Accueil"],["auth","Connexion"],["student-home","Accueil élève"],["student-docs","Mes dossiers"],
["student-wizard","Parcours guidé"],["student-annex","Mes annexes"],["student-group","Mon groupe"],
["teacher-home","Accueil enseignant"],["teacher-groups","Mes groupes"],["teacher-students","Mes élèves"],["teacher-review","Corriger"],
["admin-home","Accueil administration"],["admin-users","Utilisateurs"],["admin-groups","Groupes"],["admin-monitor","Dossiers et sécurité"],["profile","Profil"]
];
const navs={
eleve:[["student-home","Accueil","home"],["student-docs","Dossiers","folder"],["student-group","Groupe","users"],["profile","Profil","user"]],
enseignant:[["teacher-home","Accueil","home"],["teacher-groups","Groupes","users"],["teacher-review","Corrections","edit"],["profile","Profil","user"]],
admin:[["admin-home","Accueil","home"],["admin-users","Utilisateurs","users"],["admin-monitor","Contrôle","shield"],["profile","Profil","user"]]
};
const homes={eleve:"student-home",enseignant:"teacher-home",admin:"admin-home"};
const st={screen:"welcome",role:"eleve",desired:"eleve",user:null,db:null,staff:null,teacher:null,docs:[],groups:[],members:[],shares:[],reviews:[],requests:[],audit:[],ads:[],adError:'',settings:null,selectedDocId:null,selectedGroupId:null,selectedStudentId:null,annex:1,reviewAnnex:1,wizardStep:1,adminTab:"dossiers",filter:"",mode:"login",busy:false,saving:false,saveTimer:null,saveBadge:"Non enregistré",warning:"",notice:"",lastError:"",draft:null,teacherOpen:false,adminOpen:false,expandedGroup:false,loaded:false,pendingPasswordReset:false};
const $=id=>document.getElementById(id);
const cleaned=v=>String(v??"").trim();
const shortDate=v=>v?new Date(v).toLocaleDateString("fr-FR"):"—";
const longDate=v=>v?new Date(v).toLocaleString("fr-FR"):"—";
const badge=(t,type="")=>`<span class="badge ${type}">${esc(t)}</span>`;
const btn=(text,act,cls="btn",icon="",data="")=>`<button type="button" class="${cls}" data-act="${esc(act)}" ${data}>${icon?I(icon):""}${esc(text)}</button>`;
const title=(eyebrow,name,desc,tools="")=>`<div class="page-head"><div><div class="page-eyebrow">${esc(eyebrow)}</div><h1>${esc(name)}</h1><p>${esc(desc)}</p></div><div class="inline-actions">${tools}</div></div>`;
const box=(s)=>`<div class="card">${s}</div>`;
const emptyCard=(msg)=>`<div class="empty">${esc(msg)}</div>`;
const stateSafe=()=>st.db&&st.user;
const currentDoc=()=>st.docs.find(d=>d.id===st.selectedDocId)||null;
const currentGroup=()=>st.groups.find(g=>g.id===st.selectedGroupId)||null;
const currentTeacherDoc=()=>st.docs.find(d=>d.id===st.selectedDocId)||null;
const entityDoc=(id)=>st.docs.find(d=>d.id===id)||null;
const docTitle=d=>cleaned(d?.title)||cleaned(d?.payload?.problem)||"Mon dossier EGE";
const displayStudent=d=>cleaned(d?.payload?.student)||cleaned(d?.student)||"Élève";
const status=v=>{st.notice=String(v||"");st.lastError="";};
const fail=e=>{st.lastError=String(e?.message||e||"Erreur inconnue");st.notice="";toast("Opération non aboutie : "+st.lastError);};
const toast=s=>{const el=$("toast");if(!el)return;el.textContent=String(s);el.classList.add("show");clearTimeout(window.__egeToastTimer);window.__egeToastTimer=setTimeout(()=>el.classList.remove("show"),3500)};
const markPending=s=>{st.saveBadge=s;const b=$("saveState");if(b)b.textContent=s;};
const csvCount=n=>Number(n||0).toLocaleString("fr-FR");
const emptyPayload=()=>({mode:"individuel",student:"",partner:"",className:"",school:"",teacher:"",theme:null,subtheme:null,problem:"",problemMode:"custom",annexes:{},annexTitles:{},sources:{},sourceChecks:{},researchEvidence:{},annexBackup:{},candidates:Array(7).fill(""),resumeAt:"student",step:"welcome"});
function docProgress(d){
 const p=d?.payload||{},items=[!!cleaned(p.student),Number.isInteger(p.theme),Number.isInteger(p.subtheme),!!cleaned(p.problem)];
 const count=p.mode==="binome"?4:3;
 for(let n=1;n<=count;n++)items.push(!!cleaned(p.annexes?.[n])&&!!cleaned(p.sources?.[n]));
 return Math.round(items.filter(Boolean).length/items.length*100);
}
function getTitle(n,p){return cleaned(p?.annexTitles?.[n])||(["","Les notions générales","Comprendre le sous-thème","Éléments de réponse à la problématique","Conditions et limites"][n]);}
function saveLocalDraft(){
 if(!st.user||!st.draft||!st.selectedDocId)return;
 try{localStorage.setItem(`ege27_draft_${st.user.id}_${st.selectedDocId}`,JSON.stringify({payload:st.draft,modifiedAt:Date.now()}))}catch(_){}
}
function clearLocalDraft(){
 if(!st.user||!st.selectedDocId)return;
 try{localStorage.removeItem(`ege27_draft_${st.user.id}_${st.selectedDocId}`)}catch(_){}
}
function restoreLocalDraft(){
 if(!st.user||!st.selectedDocId||!st.draft)return;
 try{
  const data=JSON.parse(localStorage.getItem(`ege27_draft_${st.user.id}_${st.selectedDocId}`)||"null");
  if(data?.payload&&JSON.stringify(data.payload)!==JSON.stringify(st.draft)){
   st.warning="Un brouillon local différent existe. Vous pouvez l'importer sans écraser le dossier en ligne.";
   st.localCandidate=data.payload; markPending("Brouillon local à récupérer");
  }else{st.localCandidate=null;st.warning="";}
 }catch(_){}
}
function selectDoc(id){
 const d=entityDoc(id);if(!d)throw Error("Ce dossier n'est pas accessible.");
 st.selectedDocId=d.id;st.draft=JSON.parse(JSON.stringify(d.payload||emptyPayload()));st.wizardStep=1;st.annex=1;
 st.saveBadge="Enregistré en ligne";st.warning="";st.localCandidate=null;restoreLocalDraft();
}
function go(screen){
 if(!screenList.some(x=>x[0]===screen))return;
 if(st.busy)return;
 const scope=screen.split("-")[0];
 if(["student","teacher","admin"].includes(scope)){
  const role={student:"eleve",teacher:"enseignant",admin:"admin"}[scope];
  if(!st.user){st.desired=role;st.screen="auth";render();return;}
  if(st.role!==role){toast("Cet espace n'est pas autorisé pour ce compte.");return}
 }
 st.screen=screen;st.notice="";st.lastError="";render();
 if(typeof scrollTo==="function")scrollTo({top:0,behavior:"instant"});
}
async function resolveRole(){
 if(!st.user)return null;
 const [a,b]=await Promise.all([
  st.db.from("ege2027_staff").select("role").eq("user_id",st.user.id).maybeSingle(),
  st.db.from("ege2027_teacher_requests").select("user_id,full_name,school,status,rejection_reason").eq("user_id",st.user.id).maybeSingle()
 ]);
 if(a.error)throw a.error;if(b.error)throw b.error;
 st.staff=a.data||null;st.teacher=b.data||null;
 if(a.data?.role==="admin")return "admin";
 if(b.data||a.data?.role==="enseignant"||st.user.user_metadata?.requested_role==="enseignant")return "enseignant";
 return "eleve";
}
async function readRows(table,columns="*",configure=null){
 let q=st.db.from(table).select(columns);
 if(configure)q=configure(q);
 const {data,error}=await q;if(error)throw error;return data||[];
}
async function loadAll(){
 if(!st.user)return;
 st.loaded=false;
 const role=st.role;
 try{
  if(role==="eleve"){
   st.docs=await readRows("ege2027_dossiers","id,owner_id,title,student,payload,updated_at,archived_at",q=>q.eq("owner_id",st.user.id).is("archived_at",null).order("updated_at",{ascending:false}).limit(300));
   st.members=await readRows("ege2027_group_members","group_id,student_id,student_name,teacher_id,joined_at",q=>q.eq("student_id",st.user.id));
   const gids=[...new Set(st.members.map(m=>m.group_id))];
   st.groups=gids.length?await readRows("ege2027_teacher_groups","id,name,school,teacher_id,join_code,active",q=>q.in("id",gids)):[];
   st.shares=await readRows("ege2027_group_submissions","id,group_id,dossier_id,student_id",q=>q.eq("student_id",st.user.id));
   const ids=st.docs.map(d=>d.id);
   st.reviews=ids.length?await readRows("ege2027_reviews","id,dossier_id,decision,observation,annex_number,created_at",q=>q.in("dossier_id",ids).order("created_at",{ascending:false}).limit(500)):[];
  } else if(role==="enseignant"){
   if(st.teacher?.status!=="approved"){st.docs=[];st.groups=[];st.members=[];st.shares=[];st.reviews=[];await loadAds();st.loaded=true;render();return;}
   st.groups=await readRows("ege2027_teacher_groups","id,name,school,join_code,active,teacher_id,created_at",q=>q.eq("teacher_id",st.user.id).order("created_at",{ascending:false}));
   const gids=st.groups.map(x=>x.id);
   st.members=gids.length?await readRows("ege2027_group_members","group_id,student_id,student_name,joined_at",q=>q.in("group_id",gids)):[];
   st.shares=gids.length?await readRows("ege2027_group_submissions","group_id,student_id,dossier_id,submitted_at",q=>q.in("group_id",gids)):[];
   const ids=[...new Set(st.shares.map(x=>x.dossier_id))];
   st.docs=ids.length?await readRows("ege2027_dossiers","id,owner_id,title,student,payload,updated_at,archived_at",q=>q.in("id",ids).is("archived_at",null).limit(500)):[];
   st.reviews=ids.length?await readRows("ege2027_reviews","id,dossier_id,decision,observation,annex_number,created_at",q=>q.in("dossier_id",ids).order("created_at",{ascending:false}).limit(500)):[];
  } else {
   st.requests=await readRows("ege2027_teacher_requests","user_id,full_name,school,status,created_at,reviewed_at,rejection_reason",q=>q.order("created_at",{ascending:false}).limit(300));
   st.docs=await readRows("ege2027_dossiers","id,owner_id,title,student,payload,updated_at,archived_at",q=>q.is("archived_at",null).order("updated_at",{ascending:false}).limit(500));
   st.groups=await readRows("ege2027_teacher_groups","id,teacher_id,name,school,join_code,active,created_at",q=>q.order("created_at",{ascending:false}).limit(500));
   st.members=await readRows("ege2027_group_members","group_id,student_id,student_name,joined_at",q=>q.limit(1000));
   st.shares=await readRows("ege2027_group_submissions","group_id,student_id,dossier_id",q=>q.limit(1500));
   st.reviews=await readRows("ege2027_reviews","id,dossier_id,decision,observation,annex_number,created_at",q=>q.order("created_at",{ascending:false}).limit(500));
   st.audit=await readRows("ege2027_audit_log","id,action,entity_type,created_at,details",q=>q.order("created_at",{ascending:false}).limit(70));
   const sets=await readRows("ege2027_settings","app_title,academic_year,student_message",q=>q.eq("id",1).limit(1));
   st.settings=sets[0]||null;
  }
  if(!entityDoc(st.selectedDocId)){
   st.selectedDocId=st.docs[0]?.id||null;
   st.draft=null;
  }
  if(st.selectedDocId&&st.role==="eleve"&&!st.draft)selectDoc(st.selectedDocId);
  if(!st.groups.some(g=>g.id===st.selectedGroupId))st.selectedGroupId=st.groups[0]?.id||null;
  await loadAds();
  st.loaded=true;render();
 }catch(e){st.loaded=true;fail(e);render()}
}
async function initApp(){
 const factory=window.supabase?.createClient;
 if(!factory){st.lastError="Impossible de charger le service de connexion. Vérifiez Internet.";render();return}
 st.db=factory(DB_URL,DB_PUBLIC);
 await loadAds();
 st.db.auth.onAuthStateChange((event)=>{if(event==="PASSWORD_RECOVERY"){st.pendingPasswordReset=true;st.screen="auth";render()}});
 try{
  const {data,error}=await st.db.auth.getUser();
  if(error&&error.name!=="AuthSessionMissingError"&&!/auth session missing/i.test(error.message||""))throw error;
  st.user=data?.user||null;
  if(st.user){
   st.role=await resolveRole();
   if(st.role==="enseignant"&&!st.teacher){
    const m=st.user.user_metadata||{};
    if(m.full_name&&m.school){
     const {error:reqError}=await st.db.from("ege2027_teacher_requests").insert({user_id:st.user.id,full_name:m.full_name,school:m.school,status:"pending"});
     if(reqError)throw reqError;st.role=await resolveRole();
    }
   }
   if(new URLSearchParams(location.search).get("choisir")==="1"){st.screen="welcome";}
   else if(new URLSearchParams(location.hash.slice(1)).get("type")==="recovery"){st.pendingPasswordReset=true;st.screen="auth";}
   else st.screen=homes[st.role];
   await loadAll();
  } else render();
 }catch(e){fail(e);render();}
 if("serviceWorker" in navigator)navigator.serviceWorker.register("./service-worker-ege-2027.js").catch(()=>{});
}
async function doLogin(mode){
 const email=cleaned($("authEmail")?.value).toLowerCase();
 const password=$("authPassword")?.value||"";
 const full_name=cleaned($("authFullName")?.value);
 const school=cleaned($("authSchool")?.value);
 if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))throw Error("Saisissez une adresse e-mail valide.");
 if(mode!=="forgot"&&password.length<(mode==="signup"?12:6))throw Error(mode==="signup"?"Le mot de passe doit contenir au moins 12 caractères.":"Vérifiez votre mot de passe.");
 if(mode==="forgot"){
  const {error}=await st.db.auth.resetPasswordForEmail(email,{redirectTo:appBase});if(error)throw error;
  toast("Si le compte existe, un e-mail de récupération sera envoyé.");return;
 }
 if(mode==="signup"){
  if(st.desired==="enseignant"&&(!full_name||!school))throw Error("Indiquez le nom du professeur et son établissement.");
  const {data,error}=await st.db.auth.signUp({email,password,options:{emailRedirectTo:appBase,data:{requested_role:st.desired,full_name,school}}});
  if(error)throw error;
  if(!data.session){toast("Inscription enregistrée. Confirmez votre e-mail avant de vous connecter.");return}
 }else{
  const {error}=await st.db.auth.signInWithPassword({email,password});
  if(error)throw error;
 }
 const {data,error}=await st.db.auth.getUser();if(error)throw error;
 st.user=data.user;st.role=await resolveRole();
 if(st.desired==="admin"&&st.role!=="admin")throw Error("Ce compte ne possède pas les droits administrateur.");
 if(st.desired==="enseignant"&&st.role==="eleve")throw Error("Ce compte n'a pas de profil enseignant.");
 if(st.role==="enseignant"&&!st.teacher){
  const info=st.user.user_metadata||{};
  if(info.full_name&&info.school){
   const {error:requestError}=await st.db.from("ege2027_teacher_requests").insert({user_id:st.user.id,full_name:info.full_name,school:info.school,status:"pending"});
   if(requestError)throw requestError;
   st.role=await resolveRole();
  }
 }
 st.screen=homes[st.role];status("Connexion réussie.");await loadAll();
}
async function recoverPassword(){
 const password=$("newPassword")?.value||"";
 if(password.length<12)throw Error("Le nouveau mot de passe doit contenir au moins 12 caractères.");
 const {error}=await st.db.auth.updateUser({password});if(error)throw error;
 history.replaceState(null,"",location.pathname);st.pendingPasswordReset=false;
 toast("Mot de passe modifié.");st.screen=homes[st.role]||"welcome";render();
}
async function signOut(){
 if(st.db){const {error}=await st.db.auth.signOut();if(error)throw error}
 clearTimeout(st.saveTimer);
 Object.assign(st,{user:null,staff:null,teacher:null,role:"eleve",desired:"eleve",docs:[],groups:[],members:[],shares:[],reviews:[],requests:[],audit:[],selectedDocId:null,selectedGroupId:null,draft:null,screen:"welcome",loaded:false});
 render();
}
async function createDoc(){
 if(!stateSafe()||st.role!=="eleve")throw Error("Connectez-vous dans l'espace élève.");
 const payload=emptyPayload();
 const {data,error}=await st.db.from("ege2027_dossiers").insert({owner_id:st.user.id,title:"Nouveau dossier EGE",student:"",payload}).select("id,owner_id,title,student,payload,updated_at,archived_at").single();
 if(error)throw error;
 st.docs.unshift(data);selectDoc(data.id);st.wizardStep=1;go("student-wizard");toast("Nouveau dossier créé.");
}
function setDraftField(name,value){
 if(!st.draft||st.role!=="eleve")return;
 const map={dMode:"mode",dStudent:"student",dPartner:"partner",dClass:"className",dSchool:"school",dTeacher:"teacher",dProblem:"problem"};
 if(map[name])st.draft[map[name]]=value;
 if(name==="dTheme"){st.draft.theme=value===""?null:Number(value);st.draft.subtheme=null}
 if(name==="dSubtheme")st.draft.subtheme=value===""?null:Number(value);
 const annex=/^annex_(title|body|source|checked)_(\d+)$/.exec(name);
 if(annex){const type=annex[1],n=annex[2];
  if(type==="title")st.draft.annexTitles[n]=value;
  if(type==="body")st.draft.annexes[n]=value;
  if(type==="source")st.draft.sources[n]=value;
  if(type==="checked")st.draft.sourceChecks[n]=Boolean(value);
 }
 saveLocalDraft();markPending(navigator.onLine?"Modifications en attente":"Hors connexion");
 clearTimeout(st.saveTimer);st.saveTimer=setTimeout(()=>saveDoc().catch(fail),1300);
}
async function saveDoc(opts={}){
 if(!st.user||st.role!=="eleve"||!st.draft)return false;
 if(st.saving)return false;
 if(!navigator.onLine){markPending("Hors connexion — brouillon conservé");saveLocalDraft();return false;}
 const d=currentDoc();if(!d)return false;
 const cloned=JSON.parse(JSON.stringify(st.draft));
 st.saving=true;markPending("Enregistrement en cours…");
 try{
  const changes={payload:cloned,student:cleaned(cloned.student),title:cleaned(d.title)||"Dossier EGE",updated_at:new Date().toISOString()};
  const {data,error}=await st.db.from("ege2027_dossiers").update(changes).eq("id",d.id).eq("owner_id",st.user.id).eq("updated_at",d.updated_at).select("id,owner_id,title,student,payload,updated_at,archived_at").maybeSingle();
  if(error)throw error;
  if(!data){st.warning="Une autre version a été enregistrée sur un autre appareil. Votre brouillon local est conservé : ne l'écrasez pas.";markPending("Conflit de sauvegarde");saveLocalDraft();throw Error(st.warning)}
  const idx=st.docs.findIndex(x=>x.id===d.id);st.docs[idx]=data;
  if(JSON.stringify(st.draft)===JSON.stringify(cloned)){clearLocalDraft();st.warning="";markPending("Enregistré en ligne");}
  else{markPending("Modifications en attente");clearTimeout(st.saveTimer);st.saveTimer=setTimeout(()=>saveDoc().catch(fail),800);}
  if(!opts.silent)toast("Enregistré en ligne.");return true;
 }catch(e){saveLocalDraft();fail(e);return false;}
 finally{st.saving=false;}
}
async function archiveDoc(id){
 if(!confirm("Archiver ce dossier ? Il ne sera pas supprimé et restera récupérable dans les archives."))return;
 const {error}=await st.db.from("ege2027_dossiers").update({archived_at:new Date().toISOString()}).eq("id",id).eq("owner_id",st.user.id);if(error)throw error;
 if(st.selectedDocId===id){st.selectedDocId=null;st.draft=null}await loadAll();toast("Dossier archivé.");
}
async function selectAndGoDoc(id,screen="student-wizard"){
 if(st.draft&&st.selectedDocId!==id&&st.saveBadge!=="Enregistré en ligne"){
  const ok=await saveDoc({silent:true});if(!ok)throw Error("Le brouillon précédent n'est pas synchronisé. Sauvegardez-le avant de changer de dossier.");
 }
 selectDoc(id);go(screen);
}
async function legacyEditor(){
 if(st.role!=="eleve"||!currentDoc()||!st.draft)throw Error("Ouvrez un dossier avant de l'exporter.");
 if(st.saveBadge!=="Enregistré en ligne"){
  const ok=await saveDoc({silent:true});if(!ok)throw Error("Le dossier n'est pas synchronisé. Sauvegardez ou résolvez le conflit avant l'export.");
 }
 const d=currentDoc();
 localStorage.setItem("ege-gfm-2027-v3",JSON.stringify({...emptyPayload(),...st.draft}));
 localStorage.setItem("ege2027_dossier_selection_"+st.user.id,JSON.stringify({id:d.id,title:d.title,updated_at:d.updated_at}));
 location.assign(new URL("./assistant-dossier-gfm-2027.html",location.href).href);
}
async function joinGroup(){
 const p_code=cleaned($("joinCode")?.value).toUpperCase(),p_student_name=cleaned(st.draft?.student)||cleaned(st.user?.email?.split("@")[0]);
 if(!p_code)throw Error("Saisissez le code transmis par votre enseignant.");
 const {error}=await st.db.rpc("ege2027_join_group",{p_code,p_student_name});
 if(error)throw error;
 await loadAll();toast("Classe rejointe. Associez votre dossier pour que le professeur puisse le consulter.");
}
async function associateDoc(){
 const gid=$("shareGroup")?.value,did=$("shareDoc")?.value;
 if(!gid||!did)throw Error("Choisissez votre groupe et un dossier.");
 if(!st.docs.some(d=>d.id===did)||!st.members.some(m=>m.group_id===gid))throw Error("L'accès à ce groupe ou dossier n'est pas autorisé.");
 if(!confirm("Autoriser l'enseignant de cette classe à consulter ce dossier et toutes ses futures sauvegardes ? Vos autres dossiers resteront privés."))return;
 const {error}=await st.db.from("ege2027_group_submissions").insert({group_id:gid,dossier_id:did,student_id:st.user.id});
 if(error&&error.code!=="23505")throw error;
 await loadAll();toast("Dossier associé. Le professeur peut maintenant le consulter.");
}
async function leaveGroup(groupId){
 if(!confirm("Quitter ce groupe ? L'enseignant perdra l'accès aux dossiers associés à ce groupe. Vos dossiers restent enregistrés."))return;
 const {error}=await st.db.from("ege2027_group_members").delete().eq("group_id",groupId).eq("student_id",st.user.id);
 if(error)throw error;await loadAll();toast("Vous avez quitté le groupe.");
}
async function createGroup(){
 if(st.role!=="enseignant"||st.teacher?.status!=="approved")throw Error("Votre compte enseignant doit être approuvé.");
 const name=cleaned($("groupName")?.value),school=cleaned($("groupSchool")?.value);
 if(name.length<2)throw Error("Indiquez le nom de la classe.");
 const {error}=await st.db.from("ege2027_teacher_groups").insert({teacher_id:st.user.id,name,school});
 if(error)throw error;st.teacherOpen=false;await loadAll();toast("Groupe créé.");
}
async function teacherDecision(docId,decision){
 const doc=entityDoc(docId);if(!doc)throw Error("Le dossier n'est pas accessible.");
 const observation=cleaned($("teacherComment")?.value),annex=$("reviewAnnex")?.value;
 if(decision==="a_corriger"&&!observation)throw Error("Indiquez l'observation à transmettre.");
 const payload={dossier_id:docId,staff_id:st.user.id,decision,observation,annex_number:annex?Number(annex):null};
 const {error}=await st.db.from("ege2027_reviews").insert(payload);if(error)throw error;
 await loadAll();toast(decision==="valide"?"Travail validé.":"Correction transmise à l'élève.");
}
async function removeStudent(groupId,studentId){
 if(!confirm("Retirer cet élève de la classe ? Ses dossiers personnels seront conservés et l'accès enseignant sera révoqué."))return;
 const {error}=await st.db.from("ege2027_group_members").delete().eq("group_id",groupId).eq("student_id",studentId);
 if(error)throw error;await loadAll();toast("Élève retiré du groupe.");
}
async function changeGroup(groupId,action){
 const g=st.groups.find(x=>x.id===groupId);if(!g)throw Error("Groupe introuvable.");
 let changes;
 if(action==="rename"){const name=prompt("Nom du groupe",g.name);if(name===null)return;const v=cleaned(name);if(v.length<2)throw Error("Nom trop court.");changes={name:v}}
 else {if(!confirm(g.active?"Suspendre les nouvelles inscriptions dans ce groupe ?":"Réactiver les inscriptions ?"))return;changes={active:!g.active}}
 const {error}=await st.db.from("ege2027_teacher_groups").update(changes).eq("id",g.id);if(error)throw error;
 await loadAll();toast("Groupe mis à jour.");
}
async function approveTeacher(userId,status){
 if(st.role!=="admin")throw Error("Droits administrateur nécessaires.");
 const r=st.requests.find(x=>x.user_id===userId);if(!r)throw Error("Demande introuvable.");
 if(!confirm((status==="approved"?"Approuver":status==="suspended"?"Suspendre":"Refuser")+" l'enseignant "+r.full_name+" ?"))return;
 let rejection_reason="";
 if(status!=="approved"){const reason=prompt("Motif à communiquer à l'enseignant",r.rejection_reason||"");if(reason===null)return;if(!cleaned(reason))throw Error("Indiquez un motif.");rejection_reason=cleaned(reason)}
 const {error}=await st.db.from("ege2027_teacher_requests").update({status,rejection_reason,reviewed_at:new Date().toISOString(),reviewed_by:st.user.id}).eq("user_id",userId);
 if(error)throw error;await loadAll();toast("Décision enregistrée.");
}
async function adminGroupCreate(){
 const teacher_id=$("adminTeacher")?.value,name=cleaned($("adminGroupName")?.value),school=cleaned($("adminGroupSchool")?.value);
 if(!st.requests.some(r=>r.user_id===teacher_id&&r.status==="approved")||name.length<2)throw Error("Choisissez un enseignant approuvé et un nom de classe.");
 const {error}=await st.db.from("ege2027_teacher_groups").insert({teacher_id,name,school});if(error)throw error;
 st.adminOpen=false;await loadAll();toast("Groupe créé.");
}
async function saveSettings(){
 if(st.role!=="admin")throw Error("Accès administrateur requis.");
 const academic_year=cleaned($("settingsYear")?.value),student_message=cleaned($("settingsMessage")?.value);
 if(!academic_year)throw Error("Indiquez l'année scolaire.");
 const {error}=await st.db.from("ege2027_settings").update({academic_year,student_message,updated_at:new Date().toISOString(),updated_by:st.user.id}).eq("id",1);
 if(error)throw error;await loadAll();toast("Paramètres enregistrés.");
}
function choiceRole(role){
 st.desired=role;
 if(st.user){
  if(st.role!==role){toast("Ce compte est lié à un autre espace. Utilisez un compte autorisé pour ce rôle.");st.screen="auth";}
  else st.screen=homes[role];
 }else {st.screen="auth";st.mode="login";}
 render();
}
// Installation PWA : le prompt natif ne peut être déclenché que par un clic réel.
let egeInstallPrompt=null;
let egeInstallInProgress=false;
const egeIsInstalled=()=>window.matchMedia?.("(display-mode: standalone)")?.matches===true||navigator.standalone===true;
const egeIsIOS=()=>/iPad|iPhone|iPod/.test(navigator.userAgent)||navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1;
function refreshInstallButtons(){
 const installed=egeIsInstalled();
 for(const el of document.querySelectorAll('[data-act="install"]')){
  el.hidden=installed;
  el.disabled=egeInstallInProgress;
 }
}
function explainInstall(){
 const content=document.getElementById("egeInstallInstructions");
 const dialog=document.getElementById("egeInstallDialog");
 if(!content||!dialog){toast("Ouvrez cette page dans Safari ou Chrome, puis utilisez le menu du navigateur pour l’ajouter à l’écran d’accueil.");return}
 if(egeIsIOS()){
  content.textContent="Sur iPhone ou iPad : ouvrez cette adresse dans Safari, appuyez sur Partager, choisissez « Sur l’écran d’accueil », puis « Ajouter ».";
 }else if(/Android/i.test(navigator.userAgent)){
  content.textContent="Sur Android : ouvrez EGE GFM 2027 dans Chrome, appuyez sur le menu ⋮, puis choisissez « Installer l’application » ou « Ajouter à l’écran d’accueil ». Si vous utilisez un navigateur intégré à une autre application, ouvrez d’abord le lien dans Chrome.";
 }else{
  content.textContent="Ouvrez EGE GFM 2027 dans un navigateur compatible. Utilisez l’option « Installer l’application » dans la barre d’adresse ou dans le menu du navigateur.";
 }
 if(typeof dialog.showModal==="function")dialog.showModal();
 else dialog.setAttribute("open","");
}
async function installEGE(){
 if(egeIsInstalled()){toast("EGE GFM 2027 est déjà installée sur cet appareil.");refreshInstallButtons();return}
 if(egeInstallInProgress)return;
 if(!egeInstallPrompt){explainInstall();return}
 const prompt=egeInstallPrompt;egeInstallPrompt=null;
 egeInstallInProgress=true;
 refreshInstallButtons();
 try{
  await prompt.prompt();
  const result=await prompt.userChoice;
  if(result?.outcome==="accepted")toast("Installation acceptée. Suivez les indications de votre appareil.");
  else toast("Installation annulée. Vous pouvez réessayer depuis le navigateur.");
 }catch(err){egeInstallPrompt=null;explainInstall()}
 finally{egeInstallInProgress=false;refreshInstallButtons()}
}
window.addEventListener("beforeinstallprompt",event=>{
 event.preventDefault();
 egeInstallPrompt=event;
 refreshInstallButtons();
});
window.addEventListener("appinstalled",()=>{
 egeInstallPrompt=null;
 toast("EGE GFM 2027 est installée.");
 refreshInstallButtons();
});

async function dispatchClick(e){
 const el=e.target.closest("[data-act]");if(!el)return;
 e.preventDefault();const a=el.dataset.act,id=el.dataset.id,mode=el.dataset.mode;
 try{
  if(a==="toggle-password"){
   const input=$(el.dataset.target);
   if(!input||!["authPassword","newPassword"].includes(input.id))return;
   const visible=input.type==="password";
   input.type=visible?"text":"password";
   el.setAttribute("aria-label",visible?"Masquer le mot de passe":"Afficher le mot de passe");
   el.setAttribute("title",visible?"Masquer le mot de passe":"Afficher le mot de passe");
   el.setAttribute("aria-pressed",visible?"true":"false");
   el.innerHTML=I(visible?"eye-off":"eye");
   input.focus({preventScroll:true});
   return;
  }
  if(a==="install"){await installEGE();return}
  if(a==="close-install"){
   const dialog=document.getElementById("egeInstallDialog");
   if(dialog?.close)dialog.close();else dialog?.removeAttribute("open");
   return;
  }
  if(a==="ad-info"){egeShowAdInfo(id);return}
  if(a==="ad-close"){const dialog=document.getElementById("egeAdDialog");if(dialog?.close)dialog.close();else dialog?.removeAttribute("open");return}
  if(["ad-approve","ad-save-positions","ad-pause","ad-reject"].includes(a)){
   await egeAdminUpdateAd(id,a==="ad-approve"?"approve":a==="ad-pause"?"pause":a==="ad-reject"?"reject":"save");
   return;
  }
  if(a==="goto"){go(el.dataset.to);return}
  if(a==="role"){choiceRole(el.dataset.role);return}
  if(a==="mode"){st.mode=mode;if(st.screen==="profile"){st.screen="auth";st.desired=st.role}render();return}
  if(a==="refresh"){await loadAll();toast("Données actualisées.");return}
  if(a==="logout"){await signOut();return}
  if(a==="newdoc"){
   if(st.draft&&st.saveBadge!=="Enregistré en ligne"){
    const done=await saveDoc({silent:true});if(!done)throw Error("Votre brouillon actuel n'est pas synchronisé. Sauvegardez-le avant de créer un autre dossier.");
   }
   await createDoc();return
  }
  if(a==="opendoc"){await selectAndGoDoc(id,el.dataset.to||"student-wizard");return}
  if(a==="annex"){st.annex=Number(el.dataset.n)||1;if(st.screen!=="student-annex")st.screen="student-annex";render();return}
  if(a==="legacy"){await legacyEditor();return}
  if(a==="archive"){await archiveDoc(id);return}
  if(a==="wizard"){st.wizardStep=Number(el.dataset.n)||1;render();return}
  if(a==="wizard-next"){st.wizardStep=Math.min(4,st.wizardStep+1);await saveDoc({silent:true});render();return}
  if(a==="wizard-prev"){st.wizardStep=Math.max(1,st.wizardStep-1);render();return}
  if(a==="save"){await saveDoc();render();return}
  if(a==="restore-draft"){if(!st.localCandidate)return;st.draft=st.localCandidate;st.localCandidate=null;st.warning="Brouillon local récupéré, à synchroniser.";markPending("À synchroniser");saveLocalDraft();render();return}
  if(a==="join"){await joinGroup();return}
  if(a==="associate"){await associateDoc();return}
  if(a==="leave"){await leaveGroup(id);return}
  if(a==="teacher-create"){st.teacherOpen=!st.teacherOpen;if(st.screen!=="teacher-groups"){st.screen="teacher-groups"}render();return}
  if(a==="teacher-select"){st.selectedGroupId=id;go("teacher-students");return}
  if(a==="teacher-review"){st.selectedDocId=id;st.reviewAnnex=1;go("teacher-review");return}
  if(a==="teacher-annex"){st.reviewAnnex=Number(el.dataset.n)||1;render();return}
  if(a==="remove-student"){await removeStudent(el.dataset.group,id);return}
  if(a==="group-rename"||a==="group-toggle"){await changeGroup(id,a==="group-rename"?"rename":"toggle");return}
  if(a==="copy"){const code=el.dataset.code;if(!code)return;if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(code);toast("Code copié : "+code);return}
  if(a==="request-status"){await approveTeacher(id,el.dataset.status);return}
  if(a==="review"){await teacherDecision(id,el.dataset.decision);return}
  if(a==="admin-create"){st.adminOpen=!st.adminOpen;render();return}
  if(a==="admin-group"){st.selectedGroupId=id;go("admin-groups");return}
  if(a==="admin-tab"){st.adminTab=mode;render();return}
  if(a==="admin-read"){st.selectedDocId=id;st.adminTab="preview";go("admin-monitor");return}
  if(a==="save-settings"){await saveSettings();return}
  if(a==="reset-password"){await recoverPassword();return}
  if(a==="profile-changepass"){st.pendingPasswordReset=true;go("auth");return}
  if(a==="preview"){document.querySelector("#paper")?.scrollIntoView({block:"start",behavior:"smooth"});return}
  if(a==="signup-info"){toast("Utilisez le formulaire d'inscription pour créer votre compte.");return}
 }catch(error){fail(error);render()}
}
async function dispatchSubmit(e){
 if(!["authForm","groupJoinForm","groupShareForm","teacherNewGroupForm","adminNewGroupForm","egeAdTeacherForm","egeAdAdminForm"].includes(e.target.id))return;
 e.preventDefault();
 if(st.busy)return;st.busy=true;
 try{
  if(e.target.id==="authForm"){await doLogin(st.mode)}
  else if(e.target.id==="groupJoinForm")await joinGroup();
  else if(e.target.id==="groupShareForm")await associateDoc();
  else if(e.target.id==="teacherNewGroupForm")await createGroup();
  else if(e.target.id==="adminNewGroupForm")await adminGroupCreate();
  else if(e.target.id==="egeAdTeacherForm")await egeSubmitTeacherAd();
  else if(e.target.id==="egeAdAdminForm")await egeAdminCreateAd();
 }catch(error){fail(error)}
 finally{st.busy=false;render()}
}
function dispatchInput(e){
 const el=e.target,field=el.dataset.field;
 if(field){setDraftField(field,el.type==="checkbox"?el.checked:el.value);
  if(field.startsWith("annex_")){
   const key=field.split("_")[1],v=el.value,previewEl=key==="title"?$("paperTitle"):key==="body"?$("paperBody"):key==="source"?$("paperSource"):null;
   if(previewEl)previewEl.textContent=v||"À renseigner";
   const wc=$("wordCount");if(wc&&key==="body")wc.textContent=(cleaned(v).match(/\S+/g)||[]).length+" mots";
  }
 }
 if(el.id==="docSearch"){st.filter=el.value;const list=$("docsList");if(list)list.innerHTML=docRows()}
 if(el.id==="groupSelect"){st.selectedGroupId=el.value;render();}
 if(el.id==="adminTeacherFilter"){st.selectedGroupId=el.value;render();}
}
document.addEventListener("click",dispatchClick);
document.addEventListener("submit",dispatchSubmit);
document.addEventListener("input",dispatchInput);
document.addEventListener("change",e=>{
 const el=e.target;
 if(el.id==="annexTab"){st.annex=Number(el.value);render()}
 if(el.id==="groupSelect"){st.selectedGroupId=el.value;render()}
 if(el.id==="dTheme"){render()}
 if(el.dataset.field==="dMode"){render()}
});
window.addEventListener("online",()=>{if(st.role==="eleve"&&st.draft&&st.saveBadge!=="Enregistré en ligne")saveDoc({silent:true}).then(()=>render())});
document.addEventListener("DOMContentLoaded",()=>initApp());
