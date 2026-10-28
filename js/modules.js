// Registre de navigation uniquement : les droits de chaque module restent vérifiés côté serveur.
// Ajouter un module ici ne lui accorde aucun accès aux données ni aux rôles de MON BAC.
export const modules = Object.freeze([
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
