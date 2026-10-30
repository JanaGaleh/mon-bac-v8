import {client} from "../js/api.js";
const $=s=>document.querySelector(s);
const el=(tag,text,className)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=String(text);if(className)e.className=className;return e};
const state={user:null,admin:false,soutien:false,catalogue:[],practice:null};
function notice(message){const n=$("#notice");n.textContent=message;n.hidden=!message;}
function apiError(error){notice("Opération impossible : "+String(error?.message||error||"Erreur").slice(0,200));}
function panel(id){document.querySelectorAll(".pane").forEach(x=>x.hidden=x.id!==id);document.querySelectorAll("[data-tab]").forEach(x=>x.classList.toggle("selected",x.dataset.tab===id));notice("");if(id==="resultats")loadResults();if(id==="admin")loadAdmin();}
document.querySelectorAll("[data-tab]").forEach(b=>b.addEventListener("click",()=>panel(b.dataset.tab)));
$("#account").addEventListener("click",()=>{location.href="../mon-bac.html#profil";});
function needLogin(){notice("Connectez-vous à MON BAC, ou créez votre compte, pour accéder à la bibliothèque.");$("#library").replaceChildren(el("p","Compte MON BAC requis."));const a=el("a","Connexion et inscription MON BAC","primary");a.href="../mon-bac.html#profil";$("#library").append(a);}
async function init(){
 const {data,error}=await client.auth.getUser();
 if(error||!data.user){needLogin();return;}
 state.user=data.user;
 const [r,s]=await Promise.all([client.rpc("pjg_admin"),client.from("pjg_soutien").select("eleve_id").eq("eleve_id",data.user.id).maybeSingle()]);
 state.admin=r.data===true;state.soutien=!!s.data;
 $("#account").textContent=state.admin?"Administration MON BAC":state.soutien?"Élève du soutien":"Mon compte";
 $("#admin-tab").hidden=!state.admin;
 await loadCatalogue();newPractice();
}
async function loadCatalogue(){
 const {data,error}=await client.from("pjg_catalogue").select("id,titre,type_contenu,matiere,chapitre,partie,resume,gratuit,publie").order("cree_le",{ascending:false});
 if(error){apiError(error);return;}
 state.catalogue=data||[];const root=$("#library");root.replaceChildren();
 if(!data.length)root.append(el("p","Aucune publication pour le moment."));
 for(const c of data){
  const box=el("article",undefined,"item"),copy=el("div"),meta=el("small",c.matiere+" · "+c.chapitre+" · "+c.partie+" · "+c.type_contenu),title=el("strong",c.titre),desc=el("p",c.resume||"");
  copy.append(meta,title,desc);
  const b=el("button",c.gratuit?"Consulter":"Ouvrir / demander");b.type="button";b.addEventListener("click",()=>openItem(c));
  box.append(copy,b);root.append(box);
 }
}
function showLocked(c){
 const reader=$("#reader");reader.hidden=false;reader.replaceChildren(el("h3",c.titre),el("p","Cette ressource nécessite votre autorisation. L’administrateur examine les demandes manuellement."));
 const b=el("button","Demander l’accès","primary");b.type="button";
 b.addEventListener("click",async()=>{
  const {error}=await client.from("pjg_demandes").insert({eleve_id:state.user.id,contenu_id:c.id});
  if(error&&error.code!=="23505"){apiError(error);return;}
  const message="Bonjour Prof. Jana Galeh, je demande l’accès à : "+c.titre+". Identifiant MON BAC : "+state.user.email+".";
  window.open("https://wa.me/25377231904?text="+encodeURIComponent(message),"_blank","noopener");
  notice("Demande enregistrée. Envoyez également le message WhatsApp pour validation.");
 });reader.append(b);reader.scrollIntoView({behavior:"smooth"});
}
async function openItem(c){
 notice("");const {data,error}=await client.from("pjg_details").select("texte,questions").eq("contenu_id",c.id).maybeSingle();
 if(error){apiError(error);return;}
 if(!data){showLocked(c);return;}
 const reader=$("#reader");reader.hidden=false;reader.replaceChildren(el("p",c.chapitre+" · "+c.partie,"overline"),el("h3",c.titre),el("div",data.texte,"textblock"));
 if(c.chapitre==="Chapitre 3"&&c.partie==="Partie 2"&&c.type_contenu==="cours")appendDjiboutiTable(reader);
 if(c.type_contenu==="qcm"&&Array.isArray(data.questions))renderQcm(c,data.questions,reader);
 reader.scrollIntoView({behavior:"smooth",block:"start"});
}
function appendDjiboutiTable(root){
 const heads=["Compte","Titres","Valeur globale","Valeur au 31/12/N","Dépréciation N","Valeur au 31/12/N+1","Dépréciation N+1","Dotation","Reprise"];
 const rows=[["271","Actions","140 000","160 000","0","130 000","10 000","10 000","0"],["272","Obligations","220 000","180 000","40 000","200 000","20 000","0","20 000"]];
 const wrap=el("div",undefined,"columns"),table=el("table"),thead=el("thead"),tr=el("tr");heads.forEach(h=>tr.append(el("th",h)));thead.append(tr);table.append(thead);const tbody=el("tbody");
 rows.forEach(r=>{const line=el("tr");r.forEach(v=>line.append(el("td",v)));tbody.append(line)});
 table.append(tbody);wrap.append(table);root.append(el("h3","Tableau de calcul — méthode djiboutienne"),wrap);
 const tip=el("p","Le tableau conserve les neuf colonnes de référence. Faites défiler horizontalement sur téléphone.");tip.style.color="#657581";root.append(tip);
}
function renderQcm(c,questions,root){
 if(!questions.length)return;
 const form=el("form");questions.forEach((q,i)=>{
  form.append(el("h3",(i+1)+". "+String(q.q||"Question")));
  const options=el("div",undefined,"qcm-options");(q.choices||[]).forEach((value,j)=>{
   const label=el("label");const radio=el("input");radio.type="radio";radio.name="q"+i;radio.value=String(j);radio.required=true;label.append(radio,document.createTextNode(String(value)));options.append(label);
  });form.append(options);
 });
 const feedback=el("p");const b=el("button","Corriger mon QCM","primary");b.type="submit";form.append(b,feedback);
 form.addEventListener("submit",async e=>{e.preventDefault();let earned=0;
  questions.forEach((q,i)=>{const answer=form.querySelector('input[name="q'+i+'"]:checked');if(answer&&Number(answer.value)===Number(q.correct))earned++;});
  feedback.textContent="Résultat indicatif : "+earned+" / "+questions.length+".";
  const {error}=await client.from("pjg_resultats").insert({eleve_id:state.user.id,contenu_id:c.id,score:earned,total:questions.length});
  if(error)apiError(error);
 });root.append(form);
}
function rand(a,b){return Math.floor(Math.random()*(b-a+1))+a}
function newPractice(){
 const qty=rand(5,20),price=rand(8,30)*1000,invN=price+rand(-6,4)*1000,invN1=price+rand(-7,5)*1000;
 state.practice={qty,price,invN,invN1};$("#practice-data").textContent="Une entreprise de Djibouti détient "+qty+" titres achetés à "+price.toLocaleString("fr-FR")+" FDJ l’unité. Leur valeur unitaire au 31/12/N est "+invN.toLocaleString("fr-FR")+" FDJ, puis "+invN1.toLocaleString("fr-FR")+" FDJ au 31/12/N+1. Indiquez la dépréciation à chaque date et la valeur absolue de l’ajustement.";
 $("#practice-form").reset();$("#practice-feedback").textContent="";
}
$("#new-practice").addEventListener("click",newPractice);
$("#practice-form").addEventListener("submit",async e=>{
 e.preventDefault();if(!state.user){needLogin();return;}
 const p=state.practice;if(!p)return;
 const dn=p.qty*Math.max(0,p.price-p.invN),dn1=p.qty*Math.max(0,p.price-p.invN1),adjust=Math.abs(dn1-dn);
 const values=[Number($("#answer-n").value),Number($("#answer-n1").value),Number($("#answer-adjust").value)];
 const score=[dn,dn1,adjust].filter((v,i)=>v===values[i]).length;
 $("#practice-feedback").textContent="Résultat indicatif : "+score+"/3. Dépréciation N : "+dn.toLocaleString("fr-FR")+" FDJ ; N+1 : "+dn1.toLocaleString("fr-FR")+" FDJ ; "+(dn1>dn?"dotation":dn1<dn?"reprise":"aucun ajustement")+" : "+adjust.toLocaleString("fr-FR")+" FDJ.";
 const entry=state.catalogue.find(x=>x.chapitre==="Chapitre 3"&&x.partie==="Partie 2");
 if(entry){const {error}=await client.from("pjg_resultats").insert({eleve_id:state.user.id,contenu_id:entry.id,score,total:3});if(error)apiError(error);}
});
async function loadResults(){
 if(!state.user){needLogin();return;}
 const {data,error}=await client.from("pjg_resultats").select("score,total,cree_le").order("cree_le",{ascending:false}).limit(50);
 if(error){apiError(error);return;}
 const root=$("#results-list");root.replaceChildren();
 if(!data.length)root.append(el("p","Aucun résultat enregistré."));
 for(const r of data){const row=el("article",undefined,"item");row.append(el("div","Exercice ou QCM · "+new Date(r.cree_le).toLocaleDateString("fr-FR")),el("strong",r.score+" / "+r.total));root.append(row);}
}
async function loadAdmin(){
 if(!state.admin){notice("Accès administrateur requis.");return;}
 const {data,error}=await client.from("pjg_demandes").select("id,eleve_id,contenu_id,date_demande").eq("statut","en_attente").order("date_demande",{ascending:false});
 if(error){apiError(error);return;}
 const root=$("#requests");root.replaceChildren();
 if(!data.length){root.append(el("p","Aucune demande en attente."));return;}
 for(const r of data){
  const box=el("div",undefined,"request"),titre=state.catalogue.find(c=>c.id===r.contenu_id)?.titre||"Ressource";
  box.append(el("strong",titre),el("small","Élève : "+r.eleve_id));
  const actions=el("div");
  const approve=el("button","Accorder l’accès","primary"),deny=el("button","Refuser","quiet"),support=el("button","Valider soutien gratuit","quiet");
  approve.onclick=()=>decide(r,"acceptee",false);deny.onclick=()=>decide(r,"refusee",false);support.onclick=()=>decide(r,"acceptee",true);
  actions.append(approve,deny,support);box.append(actions);root.append(box);
 }
}
async function decide(req,status,isSupport){
 try{
  if(status==="acceptee"){
   const tbl=isSupport?"pjg_soutien":"pjg_autorisations",payload=isSupport?{eleve_id:req.eleve_id}:{eleve_id:req.eleve_id,contenu_id:req.contenu_id};
   const {error}=await client.from(tbl).upsert(payload);if(error)throw error;
  }
  const {error}=await client.from("pjg_demandes").update({statut:status,traite_le:new Date().toISOString()}).eq("id",req.id);if(error)throw error;
  notice(isSupport?"Élève du soutien validé, accès gratuit intégral.":"Décision enregistrée.");await loadAdmin();
 }catch(e){apiError(e);}
}
$("#pub-kind").addEventListener("change",()=>{$("#qcm-builder").hidden=$("#pub-kind").value!=="qcm";});
$("#publish-form").addEventListener("submit",async e=>{
 e.preventDefault();if(!state.admin)return;
 const kind=$("#pub-kind").value,questions=[];
 if(kind==="qcm"){
  const choices=["a","b","c","d"].map(k=>$("#qcm-"+k).value.trim());
  if(!$("#question").value.trim()||choices.some(v=>!v)){notice("Complétez la question et les quatre propositions.");return;}
  questions.push({q:$("#question").value.trim(),choices,correct:Number($("#qcm-answer").value)});
 }
 const entry={titre:$("#pub-title").value.trim(),type_contenu:kind,resume:$("#pub-summary").value.trim(),matiere:"Gestion Financière",chapitre:"Chapitre 3",partie:"Partie 2",gratuit:$("#pub-free").checked,publie:true};
 const {data,error}=await client.from("pjg_catalogue").insert(entry).select("id").single();
 if(error){apiError(error);return;}
 const added=await client.from("pjg_details").insert({contenu_id:data.id,texte:$("#pub-body").value.trim(),questions});
 if(added.error){await client.from("pjg_catalogue").delete().eq("id",data.id);apiError(added.error);return;}
 $("#publish-form").reset();$("#qcm-builder").hidden=true;notice("Publication ajoutée.");await loadCatalogue();
});
init().catch(apiError);
