/* EGE 2027 — annonces pédagogiques modérées, sans suivi individuel des élèves. */
const EGE_AD_SLOTS=[
  {id:"home",name:"Accueil général"},
  {id:"auth",name:"Connexion et inscription"},
  {id:"student_home",name:"Accueil élève"},
  {id:"student_docs",name:"Mes dossiers"},
  {id:"student_group",name:"Mon groupe"}
];
function egeAdSafeURL(url){
  if(!url)return "";
  try{const u=new URL(url);return u.protocol==="https:"&&u.hostname?u.href:""}catch(_){return ""}
}
function egeAdLive(ad){
  if(!ad||ad.status!=="approved")return false;
  const t=Date.now();
  return (!ad.start_at||new Date(ad.start_at).getTime()<=t)
    &&(!ad.end_at||new Date(ad.end_at).getTime()>t);
}
async function loadAds(){
  if(!st.db)return;
  try{
    const {data,error}=await st.db.from("ege2027_ads")
      .select("id,submitted_by,title,description,details,destination_url,placements,status,priority,start_at,end_at,created_at,updated_at")
      .order("priority",{ascending:false}).order("created_at",{ascending:false}).limit(150);
    if(error)throw error;
    st.ads=data||[];
    st.adError="";
  }catch(e){st.ads=[];st.adError=e.message||"Annonces indisponibles.";}
}
function egeAdFor(place){
  return (st.ads||[]).find(a=>egeAdLive(a)&&Array.isArray(a.placements)&&a.placements.includes(place))||null;
}
function adBanner(place){
  const active=egeAdFor(place);
  if(!active&&place!=="home"&&place!=="auth")return "";
  const title=active?.title||"Soutien scolaire";
  const desc=active?.description||"Préparez efficacement votre examen avec un accompagnement adapté.";
  const url=egeAdSafeURL(active?.destination_url);
  const action=url
    ?'<a class="ege-ad-link" target="_blank" rel="noopener noreferrer" href="'+esc(url)+'">Plus d’informations <span aria-hidden="true">›</span></a>'
    :'<button class="ege-ad-link" type="button" data-act="ad-info" data-id="'+esc(active?.id||"")+'">Plus d’informations <span aria-hidden="true">›</span></button>';
  return '<aside class="ege-ad-banner ege-ad-banner--'+esc(place)+'" aria-label="Annonce pédagogique">'
   +'<div class="ege-ad-art"><img src="./ad-learning.svg" alt="" loading="lazy"></div>'
   +'<div class="ege-ad-copy"><span class="ege-ad-label">'+(active?"Annonce pédagogique":"Espace d’annonce · Exemple")+'</span>'
   +'<strong>'+esc(title)+'</strong><p>'+esc(desc)+'</p></div>'
   +'<div class="ege-ad-action">'+action+'</div></aside>';
}
function egeAdDialogHTML(){
  return '<dialog id="egeAdDialog" class="ege-ad-info-dialog" aria-labelledby="egeAdDialogTitle">'
    +'<div class="ege-ad-dialog-head"><h2 id="egeAdDialogTitle">Annonce pédagogique</h2>'
    +'<button type="button" class="ege-install-close" data-act="ad-close" aria-label="Fermer">'+I("plus")+'</button></div>'
    +'<p id="egeAdDialogCopy" class="ege-ad-dialog-copy"></p>'
    +'<button class="btn primary full" type="button" data-act="ad-close">Fermer</button></dialog>';
}
function egeShowAdInfo(id){
  const ad=(st.ads||[]).find(a=>a.id===id&&egeAdLive(a));
  const dlg=document.getElementById("egeAdDialog");
  if(!dlg)return;
  const label=document.getElementById("egeAdDialogTitle");
  const content=document.getElementById("egeAdDialogCopy");
  label.textContent=ad?.title||"Espace de publicité pédagogique";
  content.textContent=ad?.details||ad?.description||"Cet emplacement est réservé aux annonces pédagogiques approuvées. Les enseignants peuvent proposer leurs cours de soutien depuis leur espace.";
  if(dlg.showModal)dlg.showModal();else dlg.setAttribute("open","");
}
function egeAdField(name,label,placeholder,value="",required=false){
  return '<label class="field"><span>'+esc(label)+'</span><input class="input" id="'+name+'" '
    +(required?"required ":"")+'placeholder="'+esc(placeholder)+'" value="'+esc(value)+'"></label>';
}
function teacherAdPanel(){
 if(st.teacher?.status!=="approved")return "";
 const mine=(st.ads||[]).filter(a=>a.submitted_by===st.user?.id);
 return '<section class="card ege-ad-manager"><div class="card-head"><div><h3>Proposer une publicité</h3><p class="small muted">Présentez vos cours de soutien. L’administrateur choisit l’emplacement et autorise la publication.</p></div>'+badge("Validation requise","orange")+'</div>'
  +'<form id="egeAdTeacherForm" class="ege-forms">'
  +egeAdField("egeAdTeacherTitle","Titre de l’annonce","Ex. Cours de soutien en gestion","",true)
  +'<label class="field"><span>Description courte</span><textarea id="egeAdTeacherDesc" class="textarea" maxlength="180" required placeholder="Une phrase claire sur les cours proposés."></textarea></label>'
  +'<label class="field"><span>Informations complémentaires (facultatif)</span><textarea id="egeAdTeacherDetails" class="textarea" maxlength="1200" placeholder="Niveaux, matières, horaires ou conditions."></textarea></label>'
  +egeAdField("egeAdTeacherURL","Lien HTTPS de contact (facultatif)","https://...")
  +'<button class="btn primary" type="submit">'+I("check")+' Envoyer à l’administration</button></form>'
  +(mine.length?'<h4 style="margin:22px 0 8px">Mes annonces</h4>'+mine.map(a=>'<div class="list-row"><div class="row-content"><strong>'+esc(a.title)+'</strong><small>'+esc(a.description)+'</small></div>'+badge(a.status==="approved"?"Publiée":a.status==="pending"?"En attente":a.status==="paused"?"Suspendue":"Refusée",a.status==="approved"?"green":"orange")+'</div>').join(""):"")
  +'</section>';
}
function egeAdPlacesChecks(prefix,selected=["home"]){
 return '<div class="ege-ad-checks">'+EGE_AD_SLOTS.map(p=>'<label><input type="checkbox" data-ad-slot="'+esc(prefix)+'" value="'+p.id+'" '+(selected.includes(p.id)?"checked":"")+'><span>'+esc(p.name)+'</span></label>').join("")+'</div>';
}
function egeAdminAdPanel(){
 const records=st.ads||[];
 return '<section class="card ege-ad-manager"><div class="card-head"><div><h3>Gérer les annonces</h3><p class="small muted">Créez, approuvez et positionnez les bannières. Aucune publicité dans la rédaction ou la correction.</p></div>'+badge(records.filter(a=>a.status==="pending").length+" à examiner","orange")+'</div>'
  +'<details class="ege-ad-create"><summary>'+I("plus")+' Créer une annonce administrative</summary>'
  +'<form id="egeAdAdminForm" class="ege-forms" style="margin-top:15px">'
  +egeAdField("egeAdAdminTitle","Titre","Ex. Cours de soutien","",true)
  +'<label class="field"><span>Description courte</span><textarea class="textarea" maxlength="180" required id="egeAdAdminDesc" placeholder="Phrase courte, adaptée aux élèves."></textarea></label>'
  +'<label class="field"><span>Informations complémentaires</span><textarea class="textarea" maxlength="1200" id="egeAdAdminDetails"></textarea></label>'
  +egeAdField("egeAdAdminURL","Lien externe HTTPS (facultatif)","https://...")
  +'<p class="small" style="font-weight:700">Afficher à ces emplacements</p>'+egeAdPlacesChecks("new",["home"])
  +'<button class="btn primary" type="submit">Créer et publier</button></form></details>'
  +(records.length?records.map(a=>{
    const tag=a.status==="approved"?"Publiée":a.status==="pending"?"À valider":a.status==="paused"?"Suspendue":"Refusée";
    return '<div class="ege-ad-admin-entry"><div class="card-head"><div><strong>'+esc(a.title)+'</strong><p class="small muted">'+esc(a.description)+'</p></div>'+badge(tag,a.status==="approved"?"green":"orange")+'</div>'
     +'<p class="small" style="font-weight:700;margin:13px 0 7px">Emplacements de diffusion</p>'
     +egeAdPlacesChecks(a.id,Array.isArray(a.placements)?a.placements:["home"])
     +'<div class="ege-ad-schedule"><label>Début (facultatif)<input type="datetime-local" data-ad-start="'+esc(a.id)+'" value="'+egeAdLocalTime(a.start_at)+'"></label>'
     +'<label>Fin (facultatif)<input type="datetime-local" data-ad-end="'+esc(a.id)+'" value="'+egeAdLocalTime(a.end_at)+'"></label>'
     +'<label>Priorité <select data-ad-priority="'+esc(a.id)+'">'+[0,5,10,15,20].map(n=>'<option value="'+n+'" '+(a.priority===n?"selected":"")+'>'+n+'</option>').join("")+'</select></label></div>'
     +'<div class="inline-actions" style="margin-top:15px">'
     +'<button type="button" class="btn primary smol" data-act="ad-approve" data-id="'+esc(a.id)+'">'+I("check")+' Approuver / enregistrer</button>'
     +'<button type="button" class="btn smol" data-act="ad-save-positions" data-id="'+esc(a.id)+'">Enregistrer les emplacements</button>'
     +(a.status!=="paused"?'<button type="button" class="btn smol" data-act="ad-pause" data-id="'+esc(a.id)+'">Suspendre</button>':'')
     +(a.status==="pending"?'<button type="button" class="btn smol" data-act="ad-reject" data-id="'+esc(a.id)+'">Refuser</button>':'')
     +'</div></div>';
  }).join(""):'<p class="small muted" style="margin-top:18px">Aucune annonce enregistrée pour le moment. Vous pouvez publier une première annonce ci-dessus.</p>')
  +'</section>';
}
function egeAdLocalTime(date){
 if(!date)return "";
 const d=new Date(date);
 const local=new Date(d.getTime()-d.getTimezoneOffset()*60000);
 return Number.isNaN(local.getTime())?"":local.toISOString().slice(0,16);
}
function egeAdSelectedSlots(prefix){
 return Array.from(document.querySelectorAll('[data-ad-slot="'+CSS.escape(prefix)+'"]:checked')).map(x=>x.value);
}
function egeAdDate(id,key){
 const raw=cleaned(document.querySelector('[data-ad-'+key+'="'+CSS.escape(id)+'"]')?.value);
 if(!raw)return null;
 const d=new Date(raw);
 if(Number.isNaN(d.getTime()))throw Error("Date incorrecte.");
 return d.toISOString();
}
async function egeSubmitTeacherAd(){
 if(st.role!=="enseignant"||st.teacher?.status!=="approved")throw Error("Compte enseignant non approuvé.");
 const title=cleaned(document.getElementById("egeAdTeacherTitle")?.value);
 const description=cleaned(document.getElementById("egeAdTeacherDesc")?.value);
 const details=cleaned(document.getElementById("egeAdTeacherDetails")?.value);
 const rawURL=cleaned(document.getElementById("egeAdTeacherURL")?.value);
 if(title.length<4||description.length<8)throw Error("Saisissez un titre et une description.");
 const url=egeAdSafeURL(rawURL);
 if(rawURL&&!url)throw Error("L'adresse doit commencer par https://.");
 const {error}=await st.db.from("ege2027_ads").insert({
  submitted_by:st.user.id,title,description,details,destination_url:url||null,status:"pending",placements:["home"]
 });
 if(error)throw error;
 await loadAds();toast("Annonce envoyée à l’administrateur pour validation.");render();
}
async function egeAdminCreateAd(){
 if(st.role!=="admin")throw Error("Accès administrateur nécessaire.");
 const title=cleaned(document.getElementById("egeAdAdminTitle")?.value);
 const description=cleaned(document.getElementById("egeAdAdminDesc")?.value);
 const details=cleaned(document.getElementById("egeAdAdminDetails")?.value);
 const rawURL=cleaned(document.getElementById("egeAdAdminURL")?.value);
 const placements=egeAdSelectedSlots("new");
 if(title.length<4||description.length<8)throw Error("Saisissez un titre et une description.");
 if(!placements.length)throw Error("Choisissez au moins un emplacement.");
 const url=egeAdSafeURL(rawURL);
 if(rawURL&&!url)throw Error("Seules les adresses HTTPS sont acceptées.");
 const {error}=await st.db.from("ege2027_ads").insert({
  submitted_by:st.user.id,title,description,details,destination_url:url||null,
  status:"approved",approved_by:st.user.id,placements
 });
 if(error)throw error;
 await loadAds();toast("Annonce créée et publiée.");render();
}
async function egeAdminUpdateAd(id,action){
 if(st.role!=="admin")throw Error("Accès administrateur nécessaire.");
 const target=(st.ads||[]).find(a=>a.id===id);
 if(!target)throw Error("Annonce introuvable.");
 const placements=egeAdSelectedSlots(id);
 if(!placements.length)throw Error("Choisissez au moins un emplacement.");
 const start_at=egeAdDate(id,"start"),end_at=egeAdDate(id,"end");
 if(start_at&&end_at&&new Date(start_at)>=new Date(end_at))throw Error("La date de fin doit être après le début.");
 const priority=Number(document.querySelector('[data-ad-priority="'+CSS.escape(id)+'"]')?.value||"0");
 const changes={placements,start_at,end_at,priority,updated_at:new Date().toISOString()};
 if(action==="approve"){changes.status="approved";changes.approved_by=st.user.id}
 if(action==="pause"||action==="reject"){
  if(!confirm((action==="pause"?"Suspendre":"Refuser")+" cette annonce ?"))return;
  changes.status=action==="pause"?"paused":"rejected";
 }
 const {error}=await st.db.from("ege2027_ads").update(changes).eq("id",id);
 if(error)throw error;
 await loadAds();toast("Annonce mise à jour.");render();
}
