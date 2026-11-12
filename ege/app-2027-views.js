const official=[{"title":"La fidélisation et la rentabilité financière","subthemes":["L’importance de la fidélisation dans la rentabilité de l’entreprise","L’impact de la satisfaction client sur la rentabilité","Le rôle et les coûts du service après-vente","La politique de prix et la fidélité des clients","Les programmes de fidélité et leur retour sur investissement","Les indicateurs de mesure de la fidélisation","Les limites et risques des stratégies de fidélisation","La personnalisation de l’expérience client et la fidélisation","Le rôle de la fidélisation dans la pérennité de l’entreprise","La maîtrise des coûts de fidélisation et l’augmentation des bénéfices","La fidélisation de la clientèle comme avantage concurrentiel durable"]},{"title":"Financement et développement des organisations (publiques et privées)","subthemes":["Les moyens de financement des organisations","Le financement du cycle d’exploitation","Le financement des organisations publiques","Financement et stratégie de développement de l’organisation","Le choix d’un mode de financement adapté","L’investissement comme moteur du développement des organisations","Les différentes sources de financement et la pérennité des organisations","Le financement externe et le développement des organisations","Le financement de l’innovation","Les stratégies de financement des entreprises nationales","L’équilibre financier et le développement commercial des organisations"]},{"title":"La gestion de la marque et du capital","subthemes":["La valeur perçue de la marque et la fidélisation de la clientèle","Les investissements mercatiques et leur rentabilité","La compétitivité et les stratégies de positionnement des marques locales face aux marques internationales","La croissance de la marque et la rentabilité de l’entreprise","Les stratégies de construction de l’image, de la notoriété et de la communication commerciale","La protection juridique de la marque et la lutte contre la contrefaçon","L’impact des réseaux sociaux et du numérique sur la marque","La notoriété de la marque et son impact sur la rentabilité de l’entreprise"]},{"title":"La politique de prix et la rentabilité","subthemes":["Le prix de vente et la rentabilité","L’influence de la politique de prix sur le comportement des consommateurs","Les stratégies de prix face à la concurrence","La politique de prix et le cycle de vie du produit","Les promotions, les réductions de prix et leur impact sur la rentabilité","Les différentes stratégies de prix et leur impact sur le bénéfice","La maîtrise des coûts dans la fixation des prix"]},{"title":"L’utilisation de l’IA dans la gestion financière et la mercatique","subthemes":["L’impact global de l’intelligence artificielle sur la gestion financière et la performance mercatique","L’IA dans la prévision des ventes","L’IA et la sécurisation des transactions financières","L’utilisation de l’IA dans l’analyse du marché","L’IA, la communication commerciale et la relation client","L’IA dans la fixation des prix et l’optimisation de la rentabilité","La contribution de l’IA à la maîtrise des coûts et à l’automatisation de la comptabilité","La protection des données et le coût de l’utilisation de l’IA dans la gestion","Les métiers de la finance et du marketing à l’ère de l’IA"]},{"title":"La gestion des risques financiers et mercatiques","subthemes":["La gestion des impayés clients et les risques financiers","Les risques d’insolvabilité et d’endettement liés à la gestion de la trésorerie","Les devises étrangères et la gestion des risques financiers","Les stratégies de prévention et de couverture des risques","La gestion des risques financiers et mercatiques sur la rentabilité de l’entreprise"]}];

'use strict';
function vGreeting(){
 const email=cleaned(st.user?.email||"");
 const first=st.role==="enseignant"?cleaned(st.teacher?.full_name):st.role==="admin"?"Administration":cleaned(st.draft?.student||currentDoc()?.payload?.student);
 return first||email.split("@")[0]||"Bienvenue";
}
function renderHeader(){
 const intro=st.screen==="welcome"||st.screen==="auth"||st.screen==="ads-directory";
 if(intro)return `<header class="ege-red-hero" aria-label="EGE 2027">
  <div class="ege-hero-actions"><span class="ege-hero-edition">Études de Gestion Encadrées</span>
   <button class="ege-hero-install" type="button" data-act="install">${I("download")} <span>Installer</span></button>
  </div>
  <div class="ege-hero-brand"><div class="ege-hero-symbol" aria-hidden="true">${I("cap")}${I("book")}</div>
   <h1>EGE 2027</h1><p>Votre espace pédagogique</p></div>
  <svg class="ege-hero-wave" viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden="true">
   <path d="M0 53 C160 -5 325 101 520 78 S875 0 1000 40 L1000 100 L0 100Z" fill="#ffffff"/>
  </svg></header>`;
 const role={eleve:"Élève",enseignant:"Enseignant",admin:"Administration"}[st.role];
 return `<header class="app-header"><a class="brand" href="./" aria-label="Accueil EGE 2027" style="text-decoration:none">
 <img class="brandmark ege-brand-icon" src="./icon-ege-2027.svg" width="43" height="43" alt="EGE 2027"><span><span class="brandname">EGE 2027</span><br><span class="brand-sub">Encadrement pédagogique · ${role}</span></span></a>
 <div class="header-right"><button type="button" class="btn ege-install-header" data-act="install" aria-label="Installer EGE 2027">${I("download")}<span>Installer</span></button><span class="version-pill">2026–2027</span>${st.user?`<button class="header-icon" data-act="refresh" aria-label="Actualiser">${I("clock")}</button><button class="avatar" data-act="goto" data-to="profile" aria-label="Ouvrir mon profil">${esc((vGreeting()||"U").charAt(0).toUpperCase())}</button>`:badge("Bienvenue","red")}</div></header>`;
}
function menu(){
 const items=navs[st.role]||[],active=st.screen;
 return `<aside class="sidebar" aria-label="Navigation"><div class="sectionlabel">Mon espace</div>
 ${items.map(([id,label,icon])=>`<button type="button" class="side-link ${(id===active)?"active":""}" data-act="goto" data-to="${id}"><span class="ico">${I(icon)}</span><span class="txt">${esc(label)}</span></button>`).join("")}
 <div class="sectionlabel">Outils</div>
 ${st.role==="eleve"?`<button class="side-link" data-act="goto" data-to="student-wizard"><span class="ico">${I("edit")}</span><span class="txt">Assistant EGE</span></button>
 <button class="side-link" data-act="goto" data-to="student-annex"><span class="ico">${I("file")}</span><span class="txt">Mes annexes</span></button>`:st.role==="enseignant"?`<button class="side-link" data-act="goto" data-to="teacher-students"><span class="ico">${I("cap")}</span><span class="txt">Mes élèves</span></button>`:`<button class="side-link" data-act="goto" data-to="admin-groups"><span class="ico">${I("users")}</span><span class="txt">Groupes</span></button><button class="side-link" data-act="goto" data-to="admin-monitor"><span class="ico">${I("shield")}</span><span class="txt">Audit et sécurité</span></button>`}
 <div class="side-spacer"></div><div class="side-hint"><b>Votre travail reste personnel.</b><p>${st.role==="eleve"?"L’enseignant ne voit que le dossier associé à son groupe.":st.role==="admin"?"Les opérations sensibles sont enregistrées.":"Chaque groupe conserve ses propres membres et dossiers."}</p></div>
 </aside>`;
}
function bottomNav(){
 return `<nav class="bottomnav" aria-label="Navigation rapide">${(navs[st.role]||[]).map(([id,name,icon])=>`<button type="button" data-act="goto" data-to="${id}" class="${st.screen===id?"active":""}" aria-label="${esc(name)}">${I(icon)}<span>${esc(name)}</span></button>`).join("")}</nav>`;
}
function feedback(){
 if(st.lastError)return `<div class="ege-feedback" role="alert">${esc(st.lastError)}</div>`;
 if(st.notice)return `<div class="ege-feedback good" role="status">${esc(st.notice)}</div>`;
 return "";
}
function welcome(){
 const roles=[
  ["eleve","Élève","Mes dossiers et mes corrections","cap"],
  ["enseignant","Enseignant","Mes groupes et mes élèves","users"],
  ["admin","Administrateur","Gestion de la plateforme","shield"]
 ];
 return `<div class="onboard ege-onboard-new">
  <div class="onboard-top"><h2>Choisissez votre espace</h2><p class="onlead">Un accès simple pour préparer, suivre et encadrer les études de gestion.</p></div>
  <div class="rolecards">
   ${roles.map(([id,name,desc,icon])=>`<button type="button" class="rolecard" data-act="role" data-role="${id}" aria-label="Accéder à l'espace ${esc(name)}">
     <span class="roleicon">${I(icon)}</span><h3>${name}</h3><p>${desc}</p>
   </button>`).join("")}
  </div>
  ${adBanner("home")}
  <div class="ege-install-entry"><button type="button" class="btn primary ege-install-button" data-act="install">${I("download")} Installer l’application</button></div>
  <div class="onboard-bottom">Connexion sécurisée · Confidentialité des dossiers · Accompagnement scolaire</div>
 </div>`;
}
function auth(){
 const role={eleve:"élève",enseignant:"enseignant",admin:"administrateur"}[st.desired]||"élève";
 const isSign=st.mode==="signup",isForgot=st.mode==="forgot";
 return `<div class="ege-auth-stage"><div class="login-card"><button class="backbtn" data-act="goto" data-to="welcome">${I("left")} Changer d’espace</button>
 <span class="login-badge">${esc(role.toUpperCase())}</span><h1>${st.pendingPasswordReset?"Changer votre mot de passe":isSign?"Créer mon compte":isForgot?"Récupérer mon compte":"Connexion"}</h1>
 <p class="muted small">${st.pendingPasswordReset?"Définissez un nouveau mot de passe pour votre compte.":isForgot?"Recevez un lien de réinitialisation par e-mail.":"Retrouvez vos dossiers, classes et corrections."}</p>
 ${st.pendingPasswordReset?`<div class="field"><label class="password-label" for="newPassword">Nouveau mot de passe</label><div class="password-wrap"><input id="newPassword" class="input" type="password" minlength="12" autocomplete="new-password" placeholder="12 caractères minimum"><button class="password-toggle" type="button" data-act="toggle-password" data-target="newPassword" aria-label="Afficher le mot de passe" aria-pressed="false" title="Afficher le mot de passe">${I("eye")}</button></div></div>${btn("Enregistrer le nouveau mot de passe","reset-password","btn primary full","check")}`:
 `<form id="authForm" class="ege-forms">
 <label class="field"><span>Adresse e-mail</span><input id="authEmail" class="input" type="email" required autocomplete="email" placeholder="prenom@exemple.com"></label>
 ${!isForgot?`<div class="field"><label class="password-label" for="authPassword">Mot de passe</label><div class="password-wrap"><input id="authPassword" class="input" type="password" minlength="${isSign?12:6}" required autocomplete="${isSign?"new-password":"current-password"}" placeholder="Votre mot de passe"><button class="password-toggle" type="button" data-act="toggle-password" data-target="authPassword" aria-label="Afficher le mot de passe" aria-pressed="false" title="Afficher le mot de passe">${I("eye")}</button></div></div>`:""}
 ${isSign&&st.desired==="enseignant"?`<label class="field"><span>Nom complet de l'enseignant</span><input id="authFullName" class="input" required maxlength="120" placeholder="Nom et prénom"></label><label class="field"><span>Établissement</span><input id="authSchool" class="input" required maxlength="160" placeholder="Nom du lycée"></label>`:""}
 <button type="submit" class="btn primary full">${isForgot?"Envoyer un lien":isSign?"M'inscrire":"Se connecter"} ${I("arrow")}</button></form>
 <div class="inline-actions" style="justify-content:space-between;margin-top:16px">
 ${st.desired!=="admin"?btn(isSign||isForgot?"Déjà inscrit ?":"Créer un compte","mode","btn ghost smol","",`data-mode="${isSign||isForgot?"login":"signup"}"`):""}
 ${btn(isForgot?"Retour":"Mot de passe oublié ?","mode","btn ghost smol","",`data-mode="${isForgot?"login":"forgot"}"`)}
 </div>${st.desired==="enseignant"?`<p class="form-note">Votre compte enseignant sera actif après validation par l'administrateur.</p>`:""}`}
 </div><div class="ege-auth-ad">${adBanner("auth")}</div></div>`;
}
function stat(label,num,icon){return `<div class="stat"><div class="stat-row"><span class="stat-label">${esc(label)}</span><span class="stat-icon">${I(icon)}</span></div><div class="stat-num">${csvCount(num)}</div></div>`}
function tile(name,sub,icon,screen){return `<button class="tile" data-act="goto" data-to="${screen}"><span class="tile-icon">${I(icon)}</span><span><span class="tile-title">${esc(name)}</span><br><span class="tile-sub">${esc(sub)}</span></span></button>`}
function reviewBadge(r){return badge(r.decision==="valide"?"Validé":"À corriger",r.decision==="valide"?"green":"orange")}
function reviewList(rows){
 if(!rows.length)return emptyCard("Aucune correction reçue pour le moment.");
 return rows.map(r=>`<div class="list-row"><span class="row-icon red">${I("chat")}</span><div class="row-content"><strong>${r.annex_number?"Annexe "+r.annex_number:"Dossier complet"}</strong><small>${esc(r.observation||"Travail validé")} · ${longDate(r.created_at)}</small></div>${reviewBadge(r)}</div>`).join("");
}
function studentHome(){
 const d=currentDoc(),group=st.groups[0],rev=d?st.reviews.filter(r=>r.dossier_id===d.id):st.reviews,progress=docProgress(d);
 return `${title("Mon espace élève","Bonjour "+vGreeting(),"Retrouvez votre travail exactement là où vous l'avez laissé.",badge(st.saveBadge,st.saveBadge==="Enregistré en ligne"?"green":"orange"))}
 <div class="layout-side"><div class="section-stack">
 <section class="feature"><div class="feature-label">${I("folder")} ${d?"Mon dossier en cours":"Commencer mon étude"}</div>
 <h2>${esc(d?docTitle(d):"Créons votre premier dossier EGE")}</h2><p>${d?esc((Number.isInteger(d.payload?.theme)?`Thème ${d.payload.theme+1}`:"Sujet à préciser")+(group?" · "+group.name:"")):"Un accompagnement progressif, une seule étape à la fois."}</p>
 <div class="compact-legend"><strong>Progression du dossier</strong><strong>${progress}%</strong></div><div class="progress-track"><div class="progress-bar" style="width:${progress}%"></div></div>
 <div class="feature-bottom"><span class="small muted">${d?"Modifié le "+shortDate(d.updated_at):"Aucun dossier enregistré"}</span>${d?btn("Continuer mon travail","opendoc","btn primary","arrow",`data-id="${d.id}"`):btn("Créer mon dossier","newdoc","btn primary","plus")}</div></section>
 <div class="grid3">${tile("Mes dossiers",st.docs.length+" dossier(s) enregistré(s)","folder","student-docs")}${tile("Mon groupe",group?.name||"Rejoindre une classe","users","student-group")}${tile("Mes annexes",d?"Rédiger et vérifier":"Commencer un dossier","edit",d?"student-annex":"student-docs")}</div></div>
 <div class="section-stack"><section class="card"><div class="card-head"><h3>Dernières corrections</h3>${badge(rev.length+" avis","red")}</div>${reviewList(rev.slice(0,3))}
 ${btn("Voir mes corrections","goto","btn ghost smol","arrow",'data-to="student-group"')}</section>
 <div class="notice info">${I("cloud")}<span><strong>Synchronisation :</strong> ${esc(st.saveBadge)}. ${st.warning?"Attention : "+esc(st.warning):"Votre dossier personnel reste privé tant que vous ne l'associez pas à un groupe."}</span></div></div></div>
 ${adBanner("student_home")}`;
}
function docRows(){
 const docs=st.docs.filter(d=>docTitle(d).toLowerCase().includes(st.filter.toLowerCase()));
 if(!docs.length)return emptyCard("Aucun dossier trouvé. Créez votre premier dossier EGE.");
 return docs.map(d=>`<div class="list-row ege-list-row"><span class="row-icon red">${I("file")}</span><div class="row-content"><strong>${esc(docTitle(d))}</strong><small>${esc(displayStudent(d))} · Modifié le ${shortDate(d.updated_at)}</small><div class="meta">${badge(docProgress(d)+" % terminé","red")}</div></div>
 <div class="inline-actions">${btn("Ouvrir","opendoc","btn primary smol","chevron",`data-id="${d.id}"`)}${btn("Archiver","archive","btn smol","",`data-id="${d.id}"`)}</div></div>`).join("");
}
function studentDocs(){
 return `${title("Mes documents","Mes dossiers EGE","Ouvrez, continuez ou créez un dossier sans perdre les travaux existants.",btn("Nouveau dossier","newdoc","btn primary","plus"))}
 <div class="card"><div class="mini-filter"><div class="search">${I("search")}<input id="docSearch" class="input" placeholder="Rechercher un dossier" value="${esc(st.filter)}" aria-label="Rechercher un dossier"></div>${badge(st.docs.length+" dossier(s)")}</div><div id="docsList">${docRows()}</div></div>
 <p class="form-note">Seuls les dossiers volontairement associés à un groupe sont accessibles à l'enseignant de ce groupe.</p>
 ${adBanner("student_docs")}`;
}
function teacherPending(){
 return `${title("Espace enseignant","Validation du compte","L'accès aux classes nécessite l'approbation administrative.")}
 <div class="card" style="max-width:660px"><div class="notice info">${I("clock")}<span>${st.teacher?.status==="pending"?"Votre demande est enregistrée. Elle attend la validation de l'administrateur.":st.teacher?.status==="rejected"?"Votre demande a été refusée. Contactez l'administrateur.":st.teacher?.status==="suspended"?"Votre accès enseignant est suspendu.":"Le profil enseignant est incomplet. Complétez votre demande."}</span></div>
 ${st.teacher?.rejection_reason?`<p class="ege-feedback">${esc(st.teacher.rejection_reason)}</p>`:""}
 ${!st.teacher?`<p class="small muted">Vérifiez votre nom et votre établissement dans votre inscription ou contactez l'administrateur.</p>`:""}
 <div class="inline-actions" style="margin-top:17px">${btn("Actualiser","refresh","btn primary","clock")}${btn("Mon profil","goto","btn","user",'data-to="profile"')}</div></div>`;
}
function studentWizard(){
 if(!st.draft)return `${title("Parcours guidé","Créer mon dossier","Commencez par créer un dossier personnel.")}${box(btn("Nouveau dossier","newdoc","btn primary","plus"))}`;
 const p=st.draft,step=st.wizardStep,nSub=Number.isInteger(p.theme)?official[p.theme]?.subthemes||[]:[];
 const steps=["Identification","Sujet","Problématique","Annexes"];
 let content="";
 if(step===1)content=`<label class="field"><span>Travail</span><select class="select" data-field="dMode"><option value="individuel" ${p.mode!=="binome"?"selected":""}>Individuel</option><option value="binome" ${p.mode==="binome"?"selected":""}>Binôme</option></select></label>
 <label class="field"><span>Nom du candidat</span><input class="input" data-field="dStudent" value="${esc(p.student||"")}" placeholder="Votre nom et prénom"></label>
 ${p.mode==="binome"?`<label class="field"><span>Nom du binôme</span><input class="input" data-field="dPartner" value="${esc(p.partner||"")}" placeholder="Nom du deuxième candidat"></label>`:""}
 <label class="field"><span>Classe</span><input class="input" data-field="dClass" value="${esc(p.className||"")}" placeholder="Ex. TGFM6"></label>
 <label class="field"><span>Établissement</span><input class="input" data-field="dSchool" value="${esc(p.school||"")}" placeholder="Nom du lycée"></label>
 <label class="field"><span>Enseignant encadrant</span><input class="input" data-field="dTeacher" value="${esc(p.teacher||"")}" placeholder="Nom du professeur"></label>`;
 if(step===2)content=`<label class="field"><span>Thème officiel 2026–2027</span><select class="select" id="dTheme" data-field="dTheme"><option value="">Choisir un thème</option>${official.map((x,i)=>`<option value="${i}" ${p.theme===i?"selected":""}>${esc((i+1)+". "+x.title)}</option>`).join("")}</select></label>
 <label class="field"><span>Sous-thème officiel</span><select class="select" id="dSubtheme" data-field="dSubtheme"><option value="">Choisir un sous-thème</option>${nSub.map((x,i)=>`<option value="${i}" ${p.subtheme===i?"selected":""}>${esc(x)}</option>`).join("")}</select></label>
 <p class="small muted">Les thèmes et sous-thèmes respectent le référentiel de l'Inspection du 3 novembre 2026.</p>`;
 if(step===3)content=`<label class="field"><span>Ma problématique (21 mots maximum)</span><textarea class="textarea" data-field="dProblem" rows="4" placeholder="Quelle question souhaitez-vous étudier ?">${esc(p.problem||"")}</textarea></label><div class="notice info">${I("book")}<span>Votre problématique doit être précise, courte et en rapport avec le sous-thème.</span></div>`;
 if(step===4)content=`<p class="small muted">Préparez chaque annexe : titre, texte et source, puis vérifiez son aperçu.</p>${Array.from({length:p.mode==="binome"?4:3},(_,i)=>i+1).map(n=>`<div class="list-row"><span class="row-icon red">${I("file")}</span><div class="row-content"><strong>Annexe ${n} — ${esc(getTitle(n,p))}</strong><small>${cleaned(p.annexes?.[n])?"Contenu rédigé":"À préparer"} · ${cleaned(p.sources?.[n])?"Source renseignée":"Source manquante"}</small></div>${btn("Modifier","annex","btn smol","edit",`data-n="${n}"`)}</div>`).join("")}`;
 return `${title("Assistant EGE","Mon étude guidée","Une seule étape à la fois : vous pouvez revenir modifier votre travail.",badge(step+" / 4","red"))}
 <div class="stepper">${steps.map((x,i)=>`<button class="step ${step===i+1?"active":step>i+1?"done":""}" data-act="wizard" data-n="${i+1}"><em>${step>i+1?"✓":i+1}</em>${x}</button>`).join("")}</div>
 <div class="card" style="max-width:770px"><h2>${["","Identifions votre dossier","Choisissons votre sujet","Rédigeons votre problématique","Préparons vos annexes"][step]}</h2>
 <div class="ege-forms" style="margin-top:23px">${content}</div>
 <div class="form-footer">${step>1?btn("Précédent","wizard-prev","btn","left"):"<span class='small muted'>Étape 1</span>"}${step<4?btn("Continuer","wizard-next","btn primary","arrow"):btn("Voir mes annexes","goto","btn primary","arrow",'data-to="student-annex"')}</div></div>
 <div class="notice info" style="margin-top:16px;max-width:770px">${I("cloud")}<span id="saveState">${esc(st.saveBadge)}</span></div>`;
}
function annexPaper(n,p){
 return `<div class="paper" id="paper"><div class="paper-kicker">EGE 2027 · ANNEXE ${n}</div>
 <h3 id="paperTitle">${esc(getTitle(n,p))}</h3><div id="paperBody" class="paper-text ege-paper-text">${esc(p.annexes?.[n]||"Le contenu apparaîtra ici.")}</div>
 <div class="paper-source ege-source"><strong>Source : </strong><span id="paperSource">${esc(p.sources?.[n]||"À renseigner")}</span></div>
 <div class="paper-note">Aperçu de lecture · contrôle pédagogique avant l'export Word</div></div>`;
}
function studentAnnex(){
 if(!st.draft)return `${title("Mes annexes","Aucun dossier ouvert","Choisissez d'abord un dossier dans Mes dossiers.")}${box(btn("Mes dossiers","goto","btn primary","folder",'data-to="student-docs"'))}`;
 const p=st.draft,n=st.annex,max=p.mode==="binome"?4:3;
 return `${title("Rédaction","Mes annexes","Copiez-collez votre texte, ajoutez sa source et contrôlez l'aperçu.",btn("Enregistrer","save","btn primary","check"))}
 ${st.warning?`<p class="ege-feedback warn">${esc(st.warning)} ${st.localCandidate?btn("Récupérer le brouillon","restore-draft","btn smol"):""}</p>`:""}
 <div class="tabset">${Array.from({length:max},(_,i)=>i+1).map(i=>`<button class="tab ${i===n?"active":""}" data-act="annex" data-n="${i}">Annexe ${i}</button>`).join("")}</div>
 <div class="layout-editor"><div class="card ege-forms"><div class="card-head"><h3>Modifier l'annexe ${n}</h3>${badge(p.sourceChecks?.[n]?"Source vérifiée":"Source à vérifier",p.sourceChecks?.[n]?"green":"orange")}</div>
 <label class="field"><span>1. Titre de l'annexe</span><input class="input" data-field="annex_title_${n}" value="${esc(getTitle(n,p))}" maxlength="190"></label>
 <label class="field"><span>2. Contenu (copier-coller autorisé)</span><textarea class="textarea tall" data-field="annex_body_${n}" placeholder="Collez ou rédigez votre texte. Séparez les paragraphes par une ligne vide.">${esc(p.annexes?.[n]||"")}</textarea></label>
 <div class="compact-legend"><span>Texte de l'annexe</span><span id="wordCount">${(cleaned(p.annexes?.[n]).match(/\S+/g)||[]).length} mots</span></div>
 <label class="field"><span>3. Source documentaire</span><textarea class="textarea" style="min-height:86px" data-field="annex_source_${n}" placeholder="Auteur, organisme, titre, année ou URL">${esc(p.sources?.[n]||"")}</textarea></label>
 <label class="small" style="display:flex;gap:9px;align-items:center"><input type="checkbox" data-field="annex_checked_${n}" ${p.sourceChecks?.[n]?"checked":""}> J'ai réellement consulté et vérifié cette source.</label>
 <div class="form-footer">${btn("Voir l'aperçu","preview","btn","eye")}${btn("Enregistrer","save","btn primary","check")}</div></div>
 <div class="section-stack"><div class="textline"><h3>Aperçu de l'annexe</h3>${badge("Lecture A4","red")}</div>${annexPaper(n,p)}
 <div class="inline-actions">${btn("Ouvrir le Word complet","legacy","btn","download")}</div>
 <p class="form-note">L'enseignant voit cette présentation lorsque le dossier est associé à son groupe.</p></div></div>`;
}
function studentGroup(){
 const groups=st.groups,docs=st.docs,shared=st.shares,rows=st.reviews;
 return `${title("Mon espace élève","Mon groupe et mes corrections","Suivez votre classe, vos partages et les observations de votre professeur.",badge(groups.length+" groupe(s)","red"))}
 <div class="layout-side"><div class="section-stack">
 ${groups.map(g=>`<div class="card"><div class="card-head"><div><h2>${esc(g.name)}</h2><p class="small muted">${esc(g.school||"Établissement non renseigné")}</p></div>${badge("Inscrit","green")}</div>
 <p class="small">Dossiers associés : ${st.shares.filter(x=>x.group_id===g.id).length}</p>
 ${st.shares.filter(x=>x.group_id===g.id).map(x=>`<div class="list-row"><span class="row-icon">${I("folder")}</span><div class="row-content"><strong>${esc(docTitle(entityDoc(x.dossier_id)))}</strong><small>Les mises à jour sauvegardées sont visibles par cet enseignant.</small></div></div>`).join("")}
 ${btn("Quitter le groupe","leave","btn smol","",`data-id="${g.id}`)}</div>`).join("")}
 <div class="card"><h3>Rejoindre un groupe</h3><form id="groupJoinForm"><label class="field"><span>Code transmis par le professeur</span><input class="input" id="joinCode" placeholder="Code du groupe" maxlength="20" required></label><button type="submit" class="btn primary">${I("users")} Rejoindre</button></form></div>
 ${groups.length&&docs.length?`<div class="card"><h3>Associer un dossier à une classe</h3><p class="small muted">Cette association se fait avec votre accord initial et reste active pour les sauvegardes futures.</p>
 <form id="groupShareForm"><label class="field"><span>Groupe</span><select class="select" id="shareGroup">${groups.map(g=>`<option value="${g.id}">${esc(g.name)}</option>`).join("")}</select></label>
 <label class="field"><span>Dossier</span><select class="select" id="shareDoc">${docs.map(d=>`<option value="${d.id}">${esc(docTitle(d))}</option>`).join("")}</select></label><button type="submit" class="btn primary">${I("check")} Associer ce dossier</button></form></div>`:""}
 </div><div class="card"><div class="card-head"><h3>Corrections reçues</h3>${badge(rows.length+" avis")}</div>${reviewList(rows)}</div></div>
 ${adBanner("student_group")}`;
}
function teacherHome(){
 if(st.teacher?.status!=="approved")return teacherPending();
 const count=st.members.length,assigned=st.docs.length;
 return `${title("Espace enseignant","Bonjour "+vGreeting(),"Retrouvez vos groupes et les travaux associés.",btn("Mes groupes","goto","btn primary","users",'data-to="teacher-groups"'))}
 <div class="grid3" style="margin-bottom:18px">${stat("Groupes actifs",st.groups.filter(g=>g.active).length,"users")}${stat("Élèves inscrits",count,"cap")}${stat("Dossiers associés",assigned,"file")}</div>
 <div class="layout-side"><div class="card"><div class="card-head"><h3>Mes classes</h3>${badge(st.groups.length+" groupe(s)")}</div>${st.groups.length?st.groups.map(g=>`<div class="list-row"><span class="row-icon red">${I("users")}</span><div class="row-content"><strong>${esc(g.name)}</strong><small>${esc(g.school)} · ${st.members.filter(m=>m.group_id===g.id).length} élève(s)</small></div>${btn("Ouvrir","teacher-select","btn smol","arrow",`data-id="${g.id}"`)}</div>`).join(""):emptyCard("Aucun groupe : créez une classe pour commencer.")}
 <div class="form-footer">${btn("Créer un groupe","teacher-create","btn primary","plus")}</div></div>
 <div class="card"><div class="card-head"><h3>Derniers avis</h3>${badge(st.reviews.length+" correction(s)")}</div>${reviewList(st.reviews.slice(0,5))}</div></div>
 ${teacherAdPanel()}`;
}
function teacherGroups(){
 if(st.teacher?.status!=="approved")return teacherPending();
 return `${title("Encadrement","Mes groupes","Un code par classe, avec des dossiers visibles uniquement après association.",btn("Nouveau groupe","teacher-create","btn primary","plus"))}
 ${st.teacherOpen?`<div class="card" style="margin-bottom:17px"><h3>Créer une classe</h3><form id="teacherNewGroupForm"><label class="field"><span>Nom du groupe</span><input id="groupName" class="input" required minlength="2" maxlength="90" placeholder="Ex. TGFM6"></label><label class="field"><span>Établissement</span><input id="groupSchool" class="input" value="${esc(st.teacher?.school||"")}" maxlength="160"></label><button class="btn primary" type="submit">Créer le groupe</button></form></div>`:""}
 ${st.groups.length?st.groups.map(g=>`<section class="card"><div class="card-head"><div><h2>${esc(g.name)}</h2><p class="small muted">${esc(g.school||"—")}</p></div>${badge(g.active?"Actif":"Code désactivé",g.active?"green":"orange")}</div>
 <div class="codebox"><div><small>Code de la classe</small><strong>${esc(g.join_code)}</strong></div>${btn("Copier","copy","btn smol","copy",`data-code="${esc(g.join_code)}"`)}</div>
 <div class="grid2" style="margin:18px 0">${stat("Élèves inscrits",st.members.filter(m=>m.group_id===g.id).length,"users")}${stat("Dossiers associés",st.shares.filter(x=>x.group_id===g.id).length,"folder")}</div>
 <div class="inline-actions">${btn("Voir les élèves","teacher-select","btn primary","users",`data-id="${g.id}"`)}${btn("Renommer","group-rename","btn","edit",`data-id="${g.id}"`)}${btn(g.active?"Fermer inscriptions":"Réactiver","group-toggle","btn","",`data-id="${g.id}"`)}</div></section>`).join(""):box(emptyCard("Aucun groupe créé pour le moment."))}`;
}
function teacherStudents(){
 if(st.teacher?.status!=="approved")return teacherPending();
 const g=currentGroup(),ms=st.members.filter(m=>m.group_id===st.selectedGroupId);
 return `${title("Suivi des élèves",g?.name||"Mes élèves","Consultez les dossiers associés à votre groupe et gérez les inscriptions.",btn("Mes groupes","goto","btn","left",'data-to="teacher-groups"'))}
 <div class="card"><div class="card-head"><h3>${esc(g?.school||"Groupe non sélectionné")}</h3>${badge(ms.length+" élève(s)")}</div>
 ${ms.length?ms.map(m=>{const shares=st.shares.filter(s=>s.group_id===m.group_id&&s.student_id===m.student_id),docs=shares.map(s=>entityDoc(s.dossier_id)).filter(Boolean);
 return `<div class="list-row"><span class="avatar">${esc((m.student_name||"E").slice(0,1))}</span><div class="row-content"><strong>${esc(m.student_name||"Élève")}</strong><small>${docs.length} dossier(s) associé(s) · Inscrit le ${shortDate(m.joined_at)}</small></div>
 <div class="inline-actions">${docs.map(d=>btn("Consulter : "+docTitle(d),"teacher-review","btn smol","file",`data-id="${d.id}"`)).join("")}${btn("Retirer","remove-student","btn smol","trash",`data-group="${m.group_id}" data-id="${m.student_id}"`)}</div></div>`}).join(""):emptyCard("Aucun élève inscrit dans ce groupe. Transmettez le code d'inscription.")}
 </div>`;
}
function teacherReview(){
 const d=currentTeacherDoc();
 if(st.teacher?.status!=="approved")return teacherPending();
 if(!d)return `${title("Relecture","Dossiers à corriger","Sélectionnez un dossier associé à votre groupe.")}
 ${box(st.docs.length?st.docs.map(d=>`<div class="list-row"><span class="row-icon red">${I("file")}</span><div class="row-content"><strong>${esc(docTitle(d))}</strong><small>${esc(displayStudent(d))}</small></div>${btn("Lire","teacher-review","btn primary smol","arrow",`data-id="${d.id}"`)}</div>`).join(""):emptyCard("Aucun dossier associé pour le moment."))}`;
 const p=d.payload||{},n=st.reviewAnnex,max=p.mode==="binome"?4:3,rev=st.reviews.filter(r=>r.dossier_id===d.id);
 return `${title("Suivi pédagogique",displayStudent(d)+" · Dossier EGE","Consultez le travail complet et transmettez vos observations.",badge("Dossier associé","green"))}
 <div class="layout-editor"><div class="section-stack"><div class="card"><h3>${esc(docTitle(d))}</h3>
 <div class="meta">${esc(p.className||"Classe non renseignée")} · ${esc(p.school||"Établissement non renseigné")}</div>
 ${p.problem?`<p class="small" style="margin-top:14px"><strong>Problématique : </strong>${esc(p.problem)}</p>`:""}
 </div><div class="tabset">${Array.from({length:max},(_,i)=>i+1).map(i=>`<button class="tab ${i===n?"active":""}" data-act="teacher-annex" data-n="${i}">Annexe ${i}</button>`).join("")}</div>
 ${annexPaper(n,p)}</div>
 <div class="section-stack"><div class="card ege-forms"><h3>Évaluer le travail</h3>
 <label class="field"><span>Travail concerné</span><select id="reviewAnnex" class="select"><option value="">Dossier complet</option>${Array.from({length:max},(_,i)=>i+1).map(i=>`<option value="${i}" ${i===n?"selected":""}>Annexe ${i}</option>`).join("")}</select></label>
 <label class="field"><span>Votre observation</span><textarea id="teacherComment" class="textarea" rows="5" placeholder="Précisez les points à corriger ou le motif de validation."></textarea></label>
 <div class="inline-actions">${btn("Valider","review","btn primary","check",`data-id="${d.id}" data-decision="valide"`)}${btn("Demander une correction","review","btn","edit",`data-id="${d.id}" data-decision="a_corriger"`)}</div></div>
 <div class="card"><div class="card-head"><h3>Historique des corrections</h3>${badge(rev.length+" avis")}</div>${reviewList(rev)}</div></div></div>`;
}
function adminHome(){
 return `${title("Administration","Vue générale","Suivez les dossiers, les enseignants et les groupes de la plateforme.",badge("Super-administrateur","red"))}
 <div class="grid4" style="margin-bottom:20px">${stat("Dossiers",st.docs.length,"file")}${stat("Enseignants",st.requests.length,"cap")}${stat("Groupes",st.groups.length,"users")}${stat("Corrections",st.reviews.length,"check")}</div>
 <div class="layout-side"><div class="card"><div class="card-head"><h3>Demandes des enseignants</h3>${badge(st.requests.filter(r=>r.status==="pending").length+" en attente","orange")}</div>
 ${st.requests.length?st.requests.slice(0,6).map(r=>`<div class="list-row"><span class="avatar">${esc((r.full_name||"P").slice(0,1))}</span><div class="row-content"><strong>${esc(r.full_name)}</strong><small>${esc(r.school)} · ${esc(r.status)}</small></div>
 <div class="inline-actions">${r.status!=="approved"?btn("Approuver","request-status","btn primary smol","check",`data-id="${r.user_id}" data-status="approved"`):btn("Suspendre","request-status","btn smol","",`data-id="${r.user_id}" data-status="suspended"`)}</div></div>`).join(""):emptyCard("Aucune demande d'enseignant.")}
 <div class="form-footer">${btn("Gérer les utilisateurs","goto","btn","users",'data-to="admin-users"')}</div></div>
 <div class="card"><div class="card-head"><h3>Dernières opérations</h3>${badge(st.audit.length+" entrées")}</div>
 ${st.audit.length?st.audit.slice(0,5).map(a=>`<div class="list-row"><span class="row-icon">${I("clock")}</span><div class="row-content"><strong>${esc(a.entity_type.replace("ege2027_",""))}</strong><small>${esc(a.action)} · ${longDate(a.created_at)}</small></div></div>`).join(""):emptyCard("Aucune opération enregistrée.")}
 ${btn("Journal et sécurité","goto","btn ghost smol","arrow",'data-to="admin-monitor"')}</div></div>`;
}
function adminUsers(){
 return `${title("Administration","Gestion des utilisateurs","Approuvez ou suspendez les enseignants, sans accéder aux mots de passe.",btn("Actualiser","refresh","btn primary","clock"))}
 <div class="card"><div class="card-head"><h3>Enseignants</h3>${badge(st.requests.length+" demande(s)")}</div>
 ${st.requests.length?st.requests.map(r=>`<div class="list-row"><span class="avatar">${esc((r.full_name||"P").slice(0,1))}</span><div class="row-content"><strong>${esc(r.full_name||"Professeur")}</strong><small>${esc(r.school||"—")} · Demande du ${shortDate(r.created_at)}</small></div><div class="inline-actions">
 ${badge(r.status,r.status==="approved"?"green":r.status==="pending"?"orange":"red")}
 ${r.status!=="approved"?btn("Approuver","request-status","btn primary smol","check",`data-id="${r.user_id}" data-status="approved"`):btn("Suspendre","request-status","btn smol","",`data-id="${r.user_id}" data-status="suspended"`)}
 ${r.status==="pending"?btn("Refuser","request-status","btn smol","",`data-id="${r.user_id}" data-status="rejected"`):""}
 </div></div>`).join(""):emptyCard("Aucune inscription enseignant pour le moment.")}</div>
 <div class="notice info" style="margin-top:18px">${I("shield")}<span>Les profils élèves sont visibles via leurs groupes et leurs dossiers autorisés. Aucun mot de passe n'est accessible à l'administrateur.</span></div>`;
}
function adminGroups(){
 const groups=st.groups;
 return `${title("Administration","Groupes et établissements","Gestion des classes et affectations.",btn("Créer un groupe","admin-create","btn primary","plus"))}
 ${st.adminOpen?`<div class="card" style="margin-bottom:15px"><h3>Nouveau groupe</h3><form id="adminNewGroupForm" class="ege-forms">
 <label class="field"><span>Enseignant approuvé</span><select id="adminTeacher" class="select" required>${st.requests.filter(x=>x.status==="approved").map(r=>`<option value="${r.user_id}">${esc(r.full_name)}</option>`).join("")}</select></label>
 <label class="field"><span>Nom de la classe</span><input id="adminGroupName" class="input" required placeholder="Ex. TGFM6"></label>
 <label class="field"><span>Établissement</span><input id="adminGroupSchool" class="input" placeholder="Nom du lycée"></label>
 <button type="submit" class="btn primary">Créer</button></form></div>`:""}
 ${groups.length?groups.map(g=>`<div class="card"><div class="card-head"><div><h3>${esc(g.name)}</h3><p class="small muted" style="margin:0">${esc(g.school||"—")}</p></div>${badge(g.active?"Actif":"Inscriptions fermées",g.active?"green":"orange")}</div>
 <div class="codebox"><div><small>Code de classe</small><strong>${esc(g.join_code)}</strong></div>${btn("Copier","copy","btn smol","copy",`data-code="${esc(g.join_code)}"`)}</div>
 <div class="list-row"><span class="row-icon red">${I("users")}</span><div class="row-content"><strong>${st.members.filter(m=>m.group_id===g.id).length} élève(s) inscrit(s)</strong><small>${st.shares.filter(x=>x.group_id===g.id).length} dossier(s) associé(s)</small></div></div>
 <div class="inline-actions">${btn("Renommer","group-rename","btn smol","edit",`data-id="${g.id}"`)}${btn(g.active?"Fermer le code":"Réactiver","group-toggle","btn smol","",`data-id="${g.id}"`)}</div>
 ${st.members.filter(m=>m.group_id===g.id).map(m=>`<div class="list-row"><span class="avatar">${esc((m.student_name||"E")[0])}</span><div class="row-content"><strong>${esc(m.student_name||"Élève")}</strong></div>${btn("Retirer","remove-student","btn smol","trash",`data-group="${g.id}" data-id="${m.student_id}"`)}</div>`).join("")}
 </div>`).join(""):box(emptyCard("Aucun groupe créé."))}`;
}
function adminMonitor(){
 const tab=st.adminTab;
 return `${title("Supervision","Dossiers, statistiques et sécurité","Contrôlez les travaux et les paramètres généraux.",badge("Accès administrateur","red"))}
 <div class="tabset">${[["dossiers","Dossiers"],["stats","Statistiques"],["security","Sécurité"],["ads","Publicités"],["preview","Lire un dossier"]].map(([id,label])=>`<button class="tab ${tab===id?"active":""}" data-act="admin-tab" data-mode="${id}">${label}</button>`).join("")}</div>
 ${tab==="dossiers"?`<div class="card"><div class="card-head"><h3>Dossiers enregistrés</h3>${badge(st.docs.length+" dossier(s)")}</div>
 ${st.docs.length?st.docs.map(d=>`<div class="list-row"><span class="row-icon red">${I("file")}</span><div class="row-content"><strong>${esc(docTitle(d))}</strong><small>${esc(displayStudent(d))} · ${shortDate(d.updated_at)}</small></div>${btn("Consulter","admin-read","btn primary smol","eye",`data-id="${d.id}"`)}</div>`).join(""):emptyCard("Aucun dossier.")}</div>`:tab==="stats"?`<div class="grid3">${stat("Dossiers",st.docs.length,"file")}${stat("Élèves en groupe",new Set(st.members.map(m=>m.student_id)).size,"users")}${stat("Enseignants",st.requests.length,"cap")}</div><div class="card" style="margin-top:15px"><h3>Statistiques réelles</h3><p class="muted small">Comptages calculés à partir des lignes visibles à l'administrateur (pagination limitée).</p></div>`:tab==="security"?`<div class="layout-side">
 <div class="card"><h3>Paramètres généraux</h3><label class="field"><span>Année scolaire</span><input class="input" id="settingsYear" value="${esc(st.settings?.academic_year||"2026–2027")}"></label><label class="field"><span>Message aux élèves</span><textarea class="textarea" id="settingsMessage">${esc(st.settings?.student_message||"")}</textarea></label>${btn("Enregistrer les paramètres","save-settings","btn primary","check")}</div>
 <div class="card"><h3>Historique des actions</h3>${st.audit.length?st.audit.map(a=>`<div class="list-row"><span class="row-icon">${I("clock")}</span><div class="row-content"><strong>${esc(a.action+" · "+a.entity_type.replace("ege2027_",""))}</strong><small>${longDate(a.created_at)}</small></div></div>`).join(""):emptyCard("Aucune opération enregistrée.")}</div></div>`:tab==="ads"?egeAdminAdPanel():
 (()=>{const d=currentDoc();if(!d)return box(emptyCard("Sélectionnez un dossier dans l'onglet Dossiers."));
 const p=d.payload||{},len=p.mode==="binome"?4:3;
 return `<div class="card"><h3>${esc(docTitle(d))} · ${esc(displayStudent(d))}</h3>${p.problem?`<p>${esc(p.problem)}</p>`:""}
 ${Array.from({length:len},(_,i)=>i+1).map(n=>`<details class="card" style="margin-top:14px" ${n===1?"open":""}><summary><strong>Annexe ${n} — ${esc(getTitle(n,p))}</strong></summary>${annexPaper(n,p)}</details>`).join("")}
 <div class="form-footer">${btn("Retour aux dossiers","admin-tab","btn","left",'data-mode="dossiers"')}</div></div>`})()}`;
}
function profile(){
 const who=st.user,role={eleve:"Élève",enseignant:"Enseignant",admin:"Super-administrateur"}[st.role];
 return `${title("Mon compte","Profil et paramètres","Retrouvez les informations de votre compte et vos options de travail.")}
 <div class="layout-side"><div class="card"><div class="card-head"><h3>Mon compte</h3>${badge(role,"red")}</div>
 <div class="list-row"><span class="avatar">${esc((vGreeting()||"U")[0].toUpperCase())}</span><div class="row-content"><strong>${esc(vGreeting())}</strong><small>${esc(who?.email||"—")}</small></div></div>
 <div class="list-row"><span class="row-icon red">${I("shield")}</span><div class="row-content"><strong>Accès sécurisé</strong><small>Rôle contrôlé par les autorisations Supabase.</small></div></div>
 <div class="inline-actions" style="margin-top:17px">${btn("Se déconnecter","logout","btn primary","logout")}${btn("Actualiser","refresh","btn","clock")}</div></div>
 <div class="card"><h3>Mon travail</h3><div class="ege-actions" style="margin-bottom:14px">${btn("Installer l’application","install","btn primary","download")}</div>${st.role==="eleve"?`<p class="small muted">Synchronisation actuelle : ${esc(st.saveBadge)}</p>${btn("Mes dossiers","goto","btn","folder",'data-to="student-docs"')}${currentDoc()?btn("Exporter / Word","legacy","btn primary","download"):""}`:
 st.role==="enseignant"?`<p class="small muted">${esc(st.teacher?.status==="approved"?"Compte enseignant approuvé.":"Validation en attente.")}</p>${btn("Mes groupes","goto","btn primary","users",'data-to="teacher-groups"')}`:btn("Superviser les comptes","goto","btn primary","users",'data-to="admin-users"')}
 <hr class="subtle-divider"><p class="small muted">Les mots de passe ne sont jamais consultables par l'administrateur. Pour changer votre mot de passe, utilisez le lien de récupération.</p>
 ${btn("Récupération du mot de passe","mode","btn smol","lock",'data-mode="forgot"')}</div></div>`;
}
function view(){
 switch(st.screen){
  case"welcome":return welcome();case"auth":return auth();case"ads-directory":return egeAdsDirectory();
  case"student-home":return studentHome();case"student-docs":return studentDocs();case"student-wizard":return studentWizard();case"student-annex":return studentAnnex();case"student-group":return studentGroup();
  case"teacher-home":return teacherHome();case"teacher-groups":return teacherGroups();case"teacher-students":return teacherStudents();case"teacher-review":return teacherReview();
  case"admin-home":return adminHome();case"admin-users":return adminUsers();case"admin-groups":return adminGroups();case"admin-monitor":return adminMonitor();case"profile":return profile();
  default:return welcome();
 }
}
function render(){
 const host=$("app");if(!host)return;
 host.className="app"+((st.screen==="welcome"||st.screen==="auth"||st.screen==="ads-directory")?" ege-intro-app":"");
 const intro=st.screen==="welcome"||st.screen==="auth"||st.screen==="ads-directory";
 host.innerHTML=renderHeader()+`<div class="app-body">${intro?"":menu()}<main class="main ${intro?(st.screen==="welcome"?"intro-main":"login-main"):""}" id="content"><section class="screen">${feedback()}${view()}</section></main></div>${intro?"":bottomNav()}
 <dialog id="egeInstallDialog" class="ege-install-dialog" aria-labelledby="egeInstallTitle">
  <div class="ege-install-dialog-head"><h2 id="egeInstallTitle">Installer EGE 2027</h2><button type="button" class="ege-install-close" data-act="close-install" aria-label="Fermer">${I("plus")}</button></div>
  <p id="egeInstallInstructions" class="ege-install-instructions"></p>
  <button type="button" class="btn primary full" data-act="close-install">Compris</button>
 </dialog>${egeAdDialogHTML()}`;
 refreshInstallButtons();
}
