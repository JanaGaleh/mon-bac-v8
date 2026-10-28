import { escapeHtml as esc } from "./domain.js";
// Maquette isolée : aucun client Supabase, aucune écriture réseau ou persistante.
const $ = (id) => document.getElementById(id);
const courses = [
  {
    id: 1,
    title: "Comprendre le bilan comptable",
    subject: "Gestion financière",
    level: "Terminale",
    teacher: "Enseignant exemple A",
    initials: "EA",
    premium: false,
    chapters: 4,
  },
  {
    id: 2,
    title: "Les fonctions, étape par étape",
    subject: "Mathématiques",
    level: "Terminale",
    teacher: "Enseignant exemple B",
    initials: "EB",
    premium: true,
    chapters: 6,
  },
  {
    id: 3,
    title: "Construire une argumentation",
    subject: "Français",
    level: "Première",
    teacher: "Enseignant exemple C",
    initials: "EC",
    premium: false,
    chapters: 3,
  },
  {
    id: 4,
    title: "Analyser les coûts et les marges",
    subject: "Gestion financière",
    level: "Terminale",
    teacher: "Enseignant exemple A",
    initials: "EA",
    premium: true,
    chapters: 5,
  },
];
const methods = ["Waafi", "D-Money", "CAC Pay", "SabaPay", "Espèces"];
const model = {
  view: "catalogue",
  search: "",
  access: "all",
  subject: "all",
  profile: "enseignant",
  registration: null,
  payment: null,
  enrolments: new Set(),
  notification: null,
  photo: null,
};
const action = (label, type, id = "", primary = false) =>
  `<button type="button" class="${primary ? "preview-primary" : "preview-secondary"}" data-preview-action="${type}" data-id="${id}">${label}</button>`;
function dialog(title, html) {
  $("previewDialogTitle").textContent = title;
  $("previewDialogBody").innerHTML = html;
  if (!$("previewDialog").open) $("previewDialog").showModal();
}
function courseCards() {
  const items = courses.filter(
    (c) =>
      (c.title + " " + c.subject + " " + c.teacher)
        .toLocaleLowerCase("fr")
        .includes(model.search.toLocaleLowerCase("fr")) &&
      (model.access === "all" ||
        (model.access === "premium" ? c.premium : !c.premium)) &&
      (model.subject === "all" || c.subject === model.subject),
  );
  return items.length
    ? items
        .map(
          (c) =>
            `<article class="preview-course"><div class="preview-course-icon" aria-hidden="true">${c.subject === "Mathématiques" ? "ƒ" : c.subject === "Français" ? "Aa" : "∑"}</div><div class="preview-card-labels"><span>${esc(c.subject)}</span><span class="preview-badge ${c.premium ? "paid" : ""}">${c.premium ? "Payant" : "Gratuit"}</span></div><h3>${esc(c.title)}</h3><p>${esc(c.level)} · ${c.chapters} chapitres</p><div class="preview-teacher"><span class="tiny-avatar">${c.initials}</span>${esc(c.teacher)}</div><div class="preview-card-action">${action("Voir le cours →", "course", c.id)}${c.premium ? '<span class="price-pending">Tarif à définir</span>' : ""}</div></article>`,
        )
        .join("")
    : '<p class="preview-empty">Aucun cours ne correspond à votre recherche. Essayez une autre matière ou retirez un filtre.</p>';
}
function catalogue() {
  return `<div class="preview-section-head"><div><h2>Trouvez votre prochain cours.</h2><p>Des exemples pour tester la recherche et les accès.</p></div><span class="preview-small">4 cours fictifs</span></div><div class="preview-filters"><label class="search-label"><span class="sr-only">Rechercher un cours ou un enseignant</span><input id="previewSearch" type="search" placeholder="Cours, matière ou enseignant…" value="${esc(model.search)}"></label><label><span class="sr-only">Accès au cours</span><select id="previewAccess"><option value="all">Tous les accès</option><option value="free" ${model.access === "free" ? "selected" : ""}>Gratuits</option><option value="premium" ${model.access === "premium" ? "selected" : ""}>Payants</option></select></label><label><span class="sr-only">Matière</span><select id="previewSubject"><option value="all">Toutes les matières</option>${["Gestion financière", "Mathématiques", "Français"].map((s) => `<option ${model.subject === s ? "selected" : ""}>${s}</option>`).join("")}</select></label></div><div id="previewCourseGrid" class="preview-course-grid">${courseCards()}</div>`;
}
function profile() {
  const teacher = model.profile === "enseignant";
  return `<div class="preview-section-head"><div><h2>Un profil utile, sans superflu.</h2><p>${teacher ? "Exemple de fiche publique d’enseignant." : "Exemple d’espace personnel élève, privé."}</p></div><div class="segmented" role="group" aria-label="Type de profil">${action("Enseignant", "profile", "enseignant", teacher)}${action("Élève", "profile", "eleve", !teacher)}</div></div><div class="profile-layout"><article class="profile-card"><div class="profile-cover"></div><div class="profile-content"><div class="profile-avatar">${model.photo ? `<img src="${model.photo}" alt="Photo choisie pour l’aperçu">` : teacher ? "EA" : "EE"}</div><span class="preview-badge">${teacher ? "Exemple de compte validé" : "Profil privé"}</span><h2>${teacher ? "Enseignant exemple A" : "Élève exemple"}</h2><p class="profile-subtitle">${teacher ? "Gestion financière · Première & Terminale" : "Terminale · Gestion financière"}</p><p>${teacher ? "Une méthode progressive pour comprendre les notions, s’entraîner et préparer les épreuves." : "Objectif : mieux comprendre les cours et réviser régulièrement."}</p><div class="profile-chips"><span>Gestion financière</span><span>${teacher ? "Comptabilité" : "Français"}</span></div><details class="preview-details"><summary>${teacher ? "Présentation et expérience" : "Mes préférences"}</summary><p>${teacher ? "Cette zone accueillera les diplômes et l’expérience renseignés par l’enseignant. Le badge de vérification ne sera accordé qu’après contrôle administratif." : "Le niveau et les matières permettront de retrouver des cours adaptés. Les résultats et les paiements resteront privés."}</p></details>${teacher ? action("Voir ses cours →", "teacherCourses", "", "true") : action("Retrouver mes cours →", "view", "catalogue", true)}</div></article><aside class="preview-panel"><h3>Informations essentielles</h3><dl class="profile-facts"><div><dt>Nom affiché</dt><dd>${teacher ? "Enseignant exemple A" : "Élève exemple"}</dd></div><div><dt>Niveau</dt><dd>${teacher ? "Première · Terminale" : "Terminale"}</dd></div><div><dt>Photo</dt><dd>Facultative</dd></div><div><dt>Visibilité</dt><dd>${teacher ? "Fiche pédagogique publique" : "Informations privées"}</dd></div></dl><label class="photo-label" for="previewPhoto">Essayer une photo</label><input id="previewPhoto" type="file" accept="image/jpeg,image/png,image/webp"><p class="preview-small">Aperçu sur cet appareil seulement. Aucun fichier n’est envoyé ni enregistré. JPEG, PNG ou WebP, 5 Mo maximum.</p><p id="photoMessage" role="status"></p></aside></div>`;
}
function registration() {
  return `<div class="preview-section-head"><div><h2>Votre compte, en quelques étapes.</h2><p>Un compte plateforme, puis les accès propres à chaque application.</p></div></div><div class="registration-layout"><section class="preview-panel"><div class="step-label">1 · PROFIL &nbsp; → &nbsp; 2 · OFFRE &nbsp; → &nbsp; 3 · VALIDATION</div><form id="previewRegisterForm"><label for="registerName">Nom affiché</label><input id="registerName" name="nom" required maxlength="80" placeholder="Utilisez un nom fictif pour cet essai"><label for="registerEmail">Adresse e-mail</label><input id="registerEmail" name="email" type="email" required placeholder="exemple@example.com"><label for="registerRole">Votre activité dans MON BAC</label><select id="registerRole" name="role"><option value="eleve">Élève</option><option value="enseignant">Enseignant</option><option value="formateur">Formateur</option><option value="autre">Autre activité</option></select><div id="otherActivity" class="hidden"><label for="registerOther">Précisez l’activité</label><input id="registerOther" name="autre" maxlength="100"></div><p class="preview-small">Aucun mot de passe demandé dans cette maquette. Ces informations restent dans cet écran.</p><button class="preview-primary full-width">Continuer vers les offres →</button></form></section><aside class="preview-panel soft-panel"><h3>Vous gardez le contrôle.</h3><ul class="clean-list"><li>Une photo facultative.</li><li>Seulement les informations nécessaires.</li><li>Des droits professionnels validés par l’administration.</li><li>Une offre payante ne remplace pas cette validation.</li></ul><p class="preview-small">Les profils élève restent privés. La fiche publique de l’enseignant présente uniquement son offre pédagogique.</p></aside></div>`;
}
function administration() {
  return `<div class="preview-section-head"><div><h2>Les actions qui attendent.</h2><p>Les priorités d’abord, les détails à la demande.</p></div><span class="preview-badge paid">Simulation</span></div><div class="admin-grid"><section class="preview-panel"><div class="preview-section-head"><h3>Comptes à valider</h3><span class="count-dot">${model.registration && model.registration.status !== "approved" ? 1 : 0}</span></div>${model.registration ? `<div class="preview-admin-row"><div><strong>${esc(model.registration.nom)}</strong><p>${esc(model.registration.role)} · Offre ${model.registration.offre === "pro" ? "payante envisagée" : "gratuite"}</p></div>${model.registration.status === "approved" ? '<span class="preview-badge">Validation simulée</span>' : action("Simuler la validation", "approveAccount")}</div>` : '<p class="preview-empty">Aucune demande dans cet aperçu. Essayez le parcours Inscription.</p>'}<p id="accountApproval" role="status"></p></section><section class="preview-panel"><div class="preview-section-head"><h3>Règlements à vérifier</h3><span class="count-dot">${model.payment?.status === "pending" ? 1 : 0}</span></div>${model.payment ? `<div class="preview-admin-row"><div><strong>${esc(model.payment.course.title)}</strong><p>${esc(model.payment.method)} · Référence de démonstration DEMO-001</p><span class="preview-badge ${model.payment.status === "pending" ? "paid" : ""}">${model.payment.status === "pending" ? "En attente de vérification" : "Confirmation simulée"}</span></div>${model.payment.status === "pending" ? action("Simuler la confirmation", "approvePayment") : ""}</div>` : '<p class="preview-empty">Aucun règlement à vérifier. Ouvrez un cours payant pour tester le parcours.</p>'}</section></div><section class="preview-panel notification-panel"><h3>Exemple de notification enseignant</h3>${model.notification ? `<div role="status" class="demo-notification"><span aria-hidden="true">✓</span><div><strong>${model.payment?.status === "confirmed" ? "Inscription et règlement confirmés" : "Nouvelle inscription"}</strong><p>${esc(model.notification)}</p><span class="preview-small">Exemple affiché uniquement dans la maquette. Aucune notification envoyée.</span></div></div>` : '<p class="preview-small">Après une confirmation simulée, la notification liée au cours apparaîtra ici.</p>'}</section>`;
}
function render() {
  const allowed = ["catalogue", "profils", "inscription", "administration"];
  model.view = allowed.includes(location.hash.slice(1))
    ? location.hash.slice(1)
    : "catalogue";
  document.querySelectorAll("[data-view]").forEach((a) => {
    if (a.dataset.view === model.view) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  $("previewContent").innerHTML = {
    catalogue,
    profils: profile,
    inscription: registration,
    administration,
  }[model.view]();
}
function go(view) {
  if (location.hash === "#" + view) render();
  else location.hash = view;
}
function showCourse(id) {
  const c = courses.find((c) => c.id === Number(id));
  if (!c) return;
  dialog(
    c.title,
    `<div class="preview-card-labels"><span>${esc(c.subject)} · ${esc(c.level)}</span><span class="preview-badge ${c.premium ? "paid" : ""}">${c.premium ? "Payant" : "Gratuit"}</span></div><p>Un parcours progressif en ${c.chapters} chapitres, avec cours, exercices et quiz. Contenu de démonstration.</p><details class="preview-details"><summary>Voir le programme</summary><ol><li>Comprendre les notions essentielles</li><li>S’entraîner avec des exercices</li><li>Vérifier ses acquis avec un quiz</li></ol></details><div class="sample-document"><span class="document-icon">TXT</span><div><strong>Extrait gratuit — Présentation du cours</strong><p>Document de démonstration · texte</p></div><a class="preview-secondary" href="./demo/extrait-cours.txt" download="MON_BAC_extrait_demo.txt">Télécharger</a></div><p class="preview-small">${c.premium ? "Le prix et les conditions seront affichés avant tout achat réel. Dans cet aperçu, aucun tarif commercial n’est fixé." : "Le bouton ci-dessous simule une inscription gratuite."}</p>${model.enrolments.has(c.id) ? '<div class="demo-success">Inscription simulée. Aucun accès réel n’a été modifié.</div>' : action(c.premium ? "Voir les moyens de paiement" : "Simuler mon inscription", c.premium ? "checkout" : "enrol", c.id, true)}`,
  );
}
function checkout(id) {
  const c = courses.find((c) => c.id === Number(id));
  if (!c) return;
  dialog(
    "Choisir un moyen de paiement",
    `<span class="preview-badge paid">Simulation · aucun débit</span><h3>${esc(c.title)}</h3><p class="preview-small">Le futur paiement concernera ce cours. L’abonnement à la plateforme sera présenté séparément. Les connexions aux prestataires ne sont pas encore actives.</p><form id="previewPaymentForm" data-course="${c.id}"><fieldset class="payment-methods"><legend>Moyen de règlement</legend>${methods.map((m, i) => `<label class="payment-method"><input type="radio" name="method" value="${m}" ${i === 0 ? "checked" : ""}><span class="method-symbol" aria-hidden="true">${["W", "D", "C", "S", "₣"][i]}</span><span>${m}</span></label>`).join("")}</fieldset><p class="preview-small">Dans le service final, un règlement devra être confirmé par le prestataire ou vérifié par l’administration. Une capture d’écran seule ne suffira pas.</p><button class="preview-primary full-width">Simuler une déclaration de règlement</button></form>`,
  );
}
async function act(type, id) {
  switch (type) {
    case "course":
      return showCourse(id);
    case "checkout":
      return checkout(id);
    case "enrol": {
      const c = courses.find((x) => x.id === Number(id));
      model.enrolments.add(c.id);
      model.notification =
        "Un élève exemple a rejoint le cours gratuit « " + c.title + " ».";
      showCourse(id);
      return;
    }
    case "profile":
      model.profile = id;
      render();
      return;
    case "teacherCourses":
      model.search = "Enseignant exemple A";
      go("catalogue");
      return;
    case "view":
      go(id);
      return;
    case "approveAccount":
      model.registration.status = "approved";
      render();
      $("accountApproval").textContent =
        "Validation simulée. Aucun rôle ni compte réel n’a été modifié.";
      return;
    case "approvePayment":
      model.payment.status = "confirmed";
      model.enrolments.add(model.payment.course.id);
      model.notification =
        "Un élève exemple a rejoint « " +
        model.payment.course.title +
        " ». Le règlement via " +
        model.payment.method +
        " a été vérifié (simulation).";
      render();
      return;
  }
}
$("previewClose").addEventListener("click", () => $("previewDialog").close());
window.addEventListener("hashchange", () => {
  $("previewDialog").close();
  render();
});
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-preview-action]");
  if (b) act(b.dataset.previewAction, b.dataset.id);
});
document.addEventListener("input", (e) => {
  if (e.target.id === "previewSearch") {
    model.search = e.target.value;
    $("previewCourseGrid").innerHTML = courseCards();
  }
});
document.addEventListener("change", (e) => {
  if (e.target.id === "previewAccess" || e.target.id === "previewSubject") {
    model[e.target.id === "previewAccess" ? "access" : "subject"] =
      e.target.value;
    $("previewCourseGrid").innerHTML = courseCards();
  }
  if (e.target.id === "registerRole") {
    $("otherActivity").classList.toggle("hidden", e.target.value !== "autre");
    $("registerOther").required = e.target.value === "autre";
  }
  if (e.target.id === "previewPhoto") {
    const file = e.target.files[0];
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      $("photoMessage").textContent =
        "Choisissez une image JPEG, PNG ou WebP de moins de 5 Mo.";
      return;
    }
    if (model.photo) URL.revokeObjectURL(model.photo);
    model.photo = URL.createObjectURL(file);
    render();
  }
});
document.addEventListener("submit", (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  if (e.target.id === "previewRegisterForm") {
    const role = f.get("role") === "autre" ? f.get("autre") : f.get("role");
    model.registration = { nom: f.get("nom"), role, offre: "free" };
    dialog(
      "Choisir sa formule",
      `<p>Bonjour ${esc(f.get("nom"))}. Choisissez une formule pour tester la suite.</p><div class="offer-grid"><section><span class="preview-badge">Gratuite</span><h3>L’essentiel pour commencer</h3><p>Fonctions essentielles et stockage limité. Quotas à définir.</p>${action("Choisir l’offre gratuite", "chooseFree", "", "true")}</section><section><span class="preview-badge paid">Payante</span><h3>Plus de possibilités</h3><p>Plus d’espace et d’outils. Tarif et quotas à définir avant lancement.</p>${action("Essayer ce parcours", "choosePro")}</section></div><p class="preview-small">Une formule payante n’inclut pas automatiquement tous les cours et ne dispense pas de validation administrative.</p>`,
    );
  }
  if (e.target.id === "previewPaymentForm") {
    model.payment = {
      course: courses.find((c) => c.id === Number(e.target.dataset.course)),
      method: f.get("method"),
      status: "pending",
    };
    dialog(
      "Déclaration simulée",
      `<div class="demo-success"><strong>En attente de vérification</strong><p>Vous avez choisi ${esc(f.get("method"))}. Aucun paiement ni inscription réelle n’a été effectué.</p></div><p>Dans le service final, vous suivrez la confirmation depuis votre espace, sans refaire votre demande.</p>${action("Voir la vérification administrative →", "reviewPayment", "", "true")}`,
    );
  }
});
document.addEventListener("click", (e) => {
  const a = e.target.closest("[data-preview-action]");
  if (!a) return;
  if (["chooseFree", "choosePro"].includes(a.dataset.previewAction)) {
    model.registration.offre =
      a.dataset.previewAction === "choosePro" ? "pro" : "free";
    dialog(
      "Demande prête — simulation",
      `<span class="preview-badge paid">En attente de validation</span><p>Le parcours de ${esc(model.registration.nom)} est terminé. Dans le service final, l’administration pourra examiner la demande et confirmer les accès.</p><p class="preview-small">Aucun compte n’a été créé, aucun abonnement souscrit et aucune demande envoyée.</p>${action("Voir l’espace administration →", "reviewPayment", "", "true")}`,
    );
  }
  if (a.dataset.previewAction === "reviewPayment") {
    $("previewDialog").close();
    go("administration");
  }
});
render();

window.addEventListener("pagehide", () => {
  if (model.photo) URL.revokeObjectURL(model.photo);
});
