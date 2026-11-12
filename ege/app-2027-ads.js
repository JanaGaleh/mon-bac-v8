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
      .select("id,submitted_by,title,description,details,destination_url,placements,status,is_premium,priority,start_at,end_at,created_at,updated_at,whatsapp_number,subjects,fee_amount,fee_period,teaching_days,teaching_hours,teaching_mode,course_address,image_url")
      .order("is_premium",{ascending:false}).order("priority",{ascending:false}).order("created_at",{ascending:false}).limit(150);
    if(error)throw error;
    st.ads=data||[];
    st.adError="";
  }catch(e){st.ads=[];st.adError=e.message||"Annonces indisponibles.";}
}

// Rotation Premium : 1 bannière par emplacement, toutes les 5 secondes.
// Les publicités classiques restent dans l'annuaire, jamais dans les bannières tournantes.
const egeCarouselIndex=Object.create(null);
const egeCarouselPausedUntil=Object.create(null);
const EGE_CAROUSEL_DELAY=5000;
let egeCarouselInterval=null;
let egeCarouselPauseWired=false;
function egePremiumSlides(place){
 return (st.ads||[]).filter(a=>egeAdLive(a)&&a.is_premium===true
  &&Array.isArray(a.placements)&&a.placements.includes(place)).sort(egeAdRank);
}
function egeAdPhoto(ad){
 const url=egeAdSafeURL(ad?.image_url);
 return url||"./ad-learning.svg";
}
function egeAdFor(place){
 const items=egePremiumSlides(place);
 const current=Number(egeCarouselIndex[place]||0);
 return items.length?items[((current%items.length)+items.length)%items.length]:null;
}
function adBanner(place){
 const slides=egePremiumSlides(place),active=egeAdFor(place);
 if(!active&&place!=="home"&&place!=="auth")return "";
 const title=active?.title||"Annonces des enseignants";
 const desc=active?.description||"Découvrez les cours de soutien et les accompagnements proposés par les enseignants.";
 const action='<a class="ege-ad-link" href="./annonces.html">Plus d’informations <span aria-hidden="true">›</span></a>';
 const count=slides.length,idx=count?(((Number(egeCarouselIndex[place]||0)%count)+count)%count):0;
 const carouselControls=count>1
  ?'<nav class="ege-ad-carousel-nav" aria-label="Annonces Premium">'
    +'<button class="ege-ad-arrow" type="button" data-act="ad-prev" data-slot="'+place+'" aria-label="Annonce précédente">‹</button>'
    +'<div class="ege-ad-dots">'
    +slides.map((_,n)=>'<button class="ege-ad-dot '+(n===idx?'active':'')+'" type="button" data-act="ad-slide" data-slot="'+place+'" data-slide="'+n+'" aria-label="Annonce '+(n+1)+' sur '+count+'" aria-current="'+(n===idx?'true':'false')+'"></button>').join("")
    +'</div>'
    +'<button class="ege-ad-arrow" type="button" data-act="ad-next" data-slot="'+place+'" aria-label="Annonce suivante">›</button></nav>'
  :'';
 return '<aside class="ege-ad-banner ege-ad-banner--'+esc(place)+'" data-ege-ad-slot="'+esc(place)+'" aria-label="'+(count>0?'Annonce Premium':'Annonces des enseignants')+'">'
   +'<div class="ege-ad-art"><img src="'+esc(egeAdPhoto(active))+'" alt="" loading="lazy"></div>'
   +'<div class="ege-ad-copy"><span class="ege-ad-label">'+(active?'Premium · '+(idx+1)+' / '+count:'Espace des enseignants')+'</span>'
   +'<strong>'+esc(title)+'</strong><p>'+esc(desc)+'</p>'+carouselControls+'</div>'
   +'<div class="ege-ad-action">'+action+'</div></aside>';
}
function egeReplaceBanner(place){
 const old=document.querySelector('[data-ege-ad-slot="'+place+'"]');
 if(!old)return;
 const markup=adBanner(place);
 if(!markup){old.remove();return}
 const template=document.createElement("template");
 template.innerHTML=markup;
 old.replaceWith(template.content.firstElementChild);
}
function egeMoveCarousel(place,step,index=null,manual=false,focusControl=false){
 const list=egePremiumSlides(place);
 if(list.length<2)return;
 const current=Number(egeCarouselIndex[place]||0);
 egeCarouselIndex[place]=index!==null?((index%list.length)+list.length)%list.length:
  ((current+step+list.length)%list.length);
 if(manual)egeCarouselPausedUntil[place]=Date.now()+12000;
 egeReplaceBanner(place);
 if(manual&&focusControl){
  const btn=document.querySelector('[data-ege-ad-slot="'+place+'"] [data-act="'+(step<0?'ad-prev':index!==null?'ad-slide':'ad-next')+'"]');
  btn?.focus?.({preventScroll:true});
 }
}
function egeStartAdCarousel(){
 if(egeCarouselPauseWired===false){
  egeCarouselPauseWired=true;
  document.addEventListener("pointerdown",e=>{
   const target=e.target.closest?.("[data-ege-ad-slot]");
   if(target)egeCarouselPausedUntil[target.dataset.egeAdSlot]=Date.now()+12000;
  },{passive:true});
 }
 if(egeCarouselInterval!==null)return;
 egeCarouselInterval=window.setInterval(()=>{
  if(document.visibilityState==="hidden")return;
  if(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches)return;
  const pointerHover=window.matchMedia?.("(hover: hover)")?.matches;
  document.querySelectorAll("[data-ege-ad-slot]").forEach(node=>{
   const place=node.dataset.egeAdSlot;
   if(egePremiumSlides(place).length<2)return;
   if((egeCarouselPausedUntil[place]||0)>Date.now())return;
   if(pointerHover&&node.matches(":hover"))return;
   if(node.contains(document.activeElement))return;
   if(node.getBoundingClientRect().bottom<0||node.getBoundingClientRect().top>innerHeight)return;
   egeMoveCarousel(place,1);
  });
 },EGE_CAROUSEL_DELAY);
}

function egeAdRank(a,b){
 const premium=Number(Boolean(b.is_premium))-Number(Boolean(a.is_premium));
 if(premium)return premium;
 const rank=Number(b.priority||0)-Number(a.priority||0);
 if(rank)return rank;
 return new Date(b.created_at||0).getTime()-new Date(a.created_at||0).getTime();
}

function egeAdPracticalFields(prefix){
 return '<fieldset class="ege-ad-practical"><legend>Informations pratiques</legend>'
  +egeAdField(prefix+'Subjects','Matières proposées','Ex. Gestion, mathématiques')
  +'<div class="ege-ad-fields-row">'+egeAdField(prefix+'Fee','Frais en FDJ (facultatif)','Ex. 12000')
  +'<label class="field"><span>Tarification</span><select class="select" id="'+prefix+'FeePeriod">'
  +'<option value="mois">Par mois</option><option value="seance">Par séance</option><option value="semaine">Par semaine</option><option value="trimestre">Par trimestre</option></select></label></div>'
  +'<div class="ege-ad-fields-row">'+egeAdField(prefix+'Days','Jours','Ex. Samedi, lundi')
  +egeAdField(prefix+'Hours','Heures','Ex. 16h30 – 18h30')+'</div>'
  +'<label class="field"><span>Modalité des cours</span><select class="select" id="'+prefix+'Mode">'
  +'<option value="">Non précisé</option><option value="groupe">En groupe</option><option value="domicile">À domicile</option><option value="mixte">Groupe et domicile</option></select></label>'
  +egeAdField(prefix+'Address','Adresse pour les cours en groupe','Ex. Hayableh, Djibouti')
  +egeAdField(prefix+'WhatsApp','WhatsApp (indicatif pays inclus)','Ex. +253 77 12 34 56')
  +egeAdField(prefix+'ImageURL','Lien HTTPS vers une image de cours (facultatif)','https://...')
  +'<p class="small muted">Ne publiez pas de photos d’élèves sans autorisation. Un lien d’image doit être accessible publiquement.</p></fieldset>';
}
function egeAdPracticalPayload(prefix){
 const value=suffix=>cleaned(document.getElementById(prefix+suffix)?.value);
 const rawWA=value("WhatsApp");
 const whatsapp_number=rawWA?rawWA.replace(/[+().\s-]/g,""):null;
 if(whatsapp_number&&!/^[0-9]{8,15}$/.test(whatsapp_number))
  throw Error("Le numéro WhatsApp doit inclure l’indicatif pays et compter 8 à 15 chiffres.");
 const rawFee=value("Fee");
 const fee_amount=rawFee===""?null:Number(rawFee);
 if(fee_amount!==null&&(!Number.isInteger(fee_amount)||fee_amount<0||fee_amount>100000000))
  throw Error("Saisissez des frais valides en FDJ.");
 const rawImage=value("ImageURL");
 const image_url=egeAdSafeURL(rawImage);
 if(rawImage&&!image_url)throw Error("Le lien de l’image doit commencer par https://.");
 return {
  whatsapp_number,
  subjects:value("Subjects")||null,
  fee_amount,
  fee_period:fee_amount===null?null:(value("FeePeriod")||"mois"),
  teaching_days:value("Days")||null,
  teaching_hours:value("Hours")||null,
  teaching_mode:value("Mode")||null,
  course_address:value("Address")||null,
  image_url:image_url||null
 };
}
function egeAdWhatsAppURL(ad){
 const number=String(ad?.whatsapp_number||"");
 if(!/^[0-9]{8,15}$/.test(number))return "";
 const message="Bonjour, je souhaite des informations sur vos cours : "+String(ad.title||"Soutien scolaire").slice(0,80);
 return "https://wa.me/"+number+"?text="+encodeURIComponent(message);
}
function egeAdFacts(ad){
 const list=[];
 if(ad.subjects)list.push(["Matières",ad.subjects]);
 if(ad.teaching_days)list.push(["Jours",ad.teaching_days]);
 if(ad.teaching_hours)list.push(["Horaires",ad.teaching_hours]);
 const mode={groupe:"En groupe",domicile:"À domicile",mixte:"Groupe et domicile"}[ad.teaching_mode];
 if(mode)list.push(["Mode",mode+(ad.course_address&&ad.teaching_mode!=="domicile"?" · "+ad.course_address:"")]);
 else if(ad.course_address)list.push(["Adresse",ad.course_address]);
 const period={seance:"séance",semaine:"semaine",mois:"mois",trimestre:"trimestre"}[ad.fee_period]||"mois";
 if(ad.fee_amount!==null&&ad.fee_amount!==undefined)list.push(["Frais",new Intl.NumberFormat("fr-FR").format(ad.fee_amount)+" FDJ / "+period]);
 return list.length?'<dl class="ege-directory-facts">'+list.map(([key,val])=>
  '<div><dt>'+esc(key)+'</dt><dd>'+esc(val)+'</dd></div>').join("")+'</dl>':"";
}


function egeTeacherAdCard(ad){
 const url=egeAdSafeURL(ad.destination_url);
 const whatsApp=egeAdWhatsAppURL(ad);
 const cta=url
  ?'<a class="ege-directory-link" href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">Plus d’informations '+I("arrow")+'</a>'
  :'<button type="button" class="ege-directory-link" data-act="ad-info" data-id="'+esc(ad.id)+'">Voir les détails '+I("arrow")+'</button>';
 const whatsappButton=whatsApp?'<a class="ege-wa-button" target="_blank" rel="noopener noreferrer" href="'+esc(whatsApp)+'" aria-label="Contacter cet enseignant sur WhatsApp">'
  +I("chat")+' WhatsApp</a>':"";
 return '<article class="ege-directory-card">'
  +'<div class="ege-directory-icon"><img src="'+esc(egeAdPhoto(ad))+'" width="94" height="80" alt="" loading="lazy"></div>'
  +'<div class="ege-directory-content"><div class="ege-directory-overline">'
  +(ad.is_premium?'<span class="ege-premium-pill">Premium</span>':'<span>Annonce pédagogique</span>')
  +'</div><h3>'+esc(ad.title)+'</h3><p>'+esc(ad.description)+'</p>'
  +egeAdFacts(ad)
  +'<div class="ege-directory-actions">'+whatsappButton+cta+'</div></div></article>';
}

function egeAdsDirectory(){
 const ads=(st.ads||[]).filter(egeAdLive).sort(egeAdRank);
 const premium=ads.filter(a=>a.is_premium),standard=ads.filter(a=>!a.is_premium);
 const block=(name,caption,rows)=>rows.length?
  '<section class="ege-directory-section"><div class="ege-directory-section-head"><h2>'+name+'</h2><span>'+caption+'</span></div>'
  +'<div class="ege-directory-grid">'+rows.map(egeTeacherAdCard).join("")+'</div></section>':'';
 const empty=st.adError
  ?'<div class="ege-directory-empty" role="status"><h2>Annonces momentanément indisponibles</h2><p>La liste n’a pas pu être chargée. Réessayez en actualisant la page.</p><button type="button" data-act="refresh-ads" class="btn primary">Actualiser</button></div>'
  :'<div class="ege-directory-empty"><div class="ege-directory-empty-icon">'+I("cap")+'</div><h2>Aucune annonce publiée pour le moment</h2>'
   +'<p>Les annonces des enseignants apparaîtront ici après validation de l’administration.</p></div>';
 return '<div class="ege-directory-page"><div class="ege-directory-top"><a class="ege-directory-back" href="./">'+I("left")+' Retour à l’accueil</a>'
  +'<span class="ege-directory-top-label">Soutien scolaire et accompagnement</span>'
  +'<h1>Annonces des enseignants</h1>'
  +'<p>Retrouvez les annonces pédagogiques approuvées. Les annonces Premium apparaissent en premier.</p></div>'
  +(ads.length?block('Annonces Premium','En tête des résultats',premium)+block('Autres annonces','Toutes les annonces approuvées',standard):empty)
  +'</div>';
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
  +egeAdPracticalFields("egeAdTeacher")
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
  +egeAdPracticalFields("egeAdAdmin")
  +egeAdField("egeAdAdminURL","Lien externe HTTPS (facultatif)","https://...")
  +'<p class="small" style="font-weight:700">Afficher à ces emplacements</p>'+egeAdPlacesChecks("new",["home"])
  +'<label class="ege-ad-premium-choice"><input id="egeAdAdminPremium" type="checkbox"> Mettre en Premium (affiché en premier)</label>'
  +'<button class="btn primary" type="submit">Créer et publier</button></form></details>'
  +(records.length?records.map(a=>{
    const tag=a.status==="approved"?"Publiée":a.status==="pending"?"À valider":a.status==="paused"?"Suspendue":"Refusée";
    return '<div class="ege-ad-admin-entry"><div class="card-head"><div><strong>'+esc(a.title)+'</strong><p class="small muted">'+esc(a.description)+'</p></div>'+badge(tag,a.status==="approved"?"green":"orange")+'</div>'
     +'<label class="ege-ad-premium-choice"><input type="checkbox" data-ad-premium="'+esc(a.id)+'" '+(a.is_premium?'checked':'')+'> Afficher en Premium (avant les annonces classiques)</label>'
     +'<p class="small muted">Matières : '+esc(a.subjects||"Non renseignées")+' · WhatsApp : '+esc(a.whatsapp_number||"Non renseigné")+'</p>'
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
  submitted_by:st.user.id,title,description,details,destination_url:url||null,status:"pending",is_premium:false,placements:["home"],...egeAdPracticalPayload("egeAdTeacher")
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
  status:"approved",approved_by:st.user.id,is_premium:Boolean(document.getElementById("egeAdAdminPremium")?.checked),placements,
  ...egeAdPracticalPayload("egeAdAdmin")
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
 const is_premium=Boolean([...document.querySelectorAll("[data-ad-premium]")].find(x=>x.dataset.adPremium===id)?.checked);
 const changes={placements,start_at,end_at,priority,is_premium,updated_at:new Date().toISOString()};
 if(action==="approve"){changes.status="approved";changes.approved_by=st.user.id}
 if(action==="pause"||action==="reject"){
  if(!confirm((action==="pause"?"Suspendre":"Refuser")+" cette annonce ?"))return;
  changes.status=action==="pause"?"paused":"rejected";
 }
 const {error}=await st.db.from("ege2027_ads").update(changes).eq("id",id);
 if(error)throw error;
 await loadAds();toast("Annonce mise à jour.");render();
}
