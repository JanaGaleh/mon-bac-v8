// Registre de navigation uniquement : les droits de chaque module restent vérifiés côté serveur.
// Ajouter un module ici ne lui accorde aucun accès aux données ni aux rôles de MON BAC.
export const modules = Object.freeze([
  Object.freeze({
    id: "prof-jana-galeh",
    name: "Prof. Jana Galeh",
    category: "Gestion Financière · MENFOP Djibouti",
    description: "Cours, exercices et QCM hebdomadaires. Chapitre 3 — Partie 2 : Dépréciation des titres immobilisés.",
    tags: Object.freeze(["Cours", "Exercices", "QCM"]),
    entry: "./prof-jana-galeh/",
    account: "./mon-bac.html#profil",
    status: "available",
  }),
  Object.freeze({
    id: "ege",
    name: "EGE 2026/2027",
    category: "Terminale GFM · Djibouti",
    description: "Thèmes, dossiers documentaires et suivi de votre étude de gestion encadrée.",
    tags: Object.freeze(["Catalogue", "Dossiers Word", "Suivi"]),
    entry: "./ege/",
    account: "./ege/#workspace",
    status: "available",
  }),
  Object.freeze({
    id: "mon-bac",
    name: "MON BAC",
    category: "Enseignement & formation",
    description:
      "Vos cours, vos quiz et vos progrès. Un espace pour apprendre et transmettre.",
    tags: Object.freeze(["Cours", "Quiz", "Corrections"]),
    entry: "./mon-bac.html",
    account: "./mon-bac.html#profil",
    status: "available",
  }),
]);
export const legacyTabs = new Set([
  "accueil",
  "cours",
  "quiz",
  "resultats",
  "profil",
  "eleves",
  "paiements",
  "utilisateurs",
  "journal",
]);
export function legacyModuleTarget(hash) {
  const tab = String(hash).replace(/^#/, "");
  return legacyTabs.has(tab) ? `./mon-bac.html#${tab}` : null;
}

