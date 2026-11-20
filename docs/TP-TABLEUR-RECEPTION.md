# MonAvenir — TP Tableur : réception avant publication

## Réalisé dans cette branche
- Prototype autonome `tp-tableur-prototype.html` : grille 14 × 6, saisie et calcul de formules arithmétiques et SOMME, modes TP/libre/entraînement, exercice guidé et correction numérique.
- Import/export CSV, modèles réutilisables en stockage local, duplication et sauvegarde locale.
- Entrée de navigation dans les espaces élève et enseignant via `js/app.js`.
- Les changements ne doivent pas être fusionnés sans les contrôles ci-dessous.

## Points bloquants avant production
1. **Authentification** : protéger l'accès aux données personnelles et lier les travaux à l'utilisateur connecté. Le prototype actuel est accessible directement et ne doit pas recevoir de données sensibles.
2. **Persistance** : concevoir tables Supabase pour TP, versions, affectations, copies et corrections ; politiques RLS strictes élève/enseignant/admin et migrations réversibles.
3. **Éditeur enseignant** : créer, enregistrer en brouillon, affecter par classes, publier, corriger et suivre les copies ; prévisualiser le parcours élève.
4. **Moteur tableur** : remplacer l'évaluateur expérimental par un moteur testé et compatible avec les formules requises, références, plages et erreurs. Vérifier l'absence d'exécution de code arbitraire.
5. **XLSX** : ajouter un parseur/exporteur adapté et tester la fidélité des fichiers ; le CSV actuel n'est pas du XLSX.
6. **Mobile** : tester Android/iOS, clavier, focus, sélection, grille scrollable, accessibilité et orientation.
7. **Sauvegarde** : reprise entre appareils, conflits, connexion interrompue et prévention des pertes.
8. **Tests** : tests unitaires formules, RLS multi-comptes, navigation élève/enseignant, import malveillant, charge et non-régression du reste de MonAvenir.
9. **Déploiement** : confirmer le dépôt et la branche réellement reliés à monavenir.janagaleh.com ; prévisualiser, valider puis déployer avec retour arrière.

## Philosophie de design
- Garder l'identité de la maquette (violet, blanc, ombres discrètes et cartes arrondies) sans remplacer la navigation existante.
- Pas de texte coupé ni de défilement horizontal global ; défilement limité à la grille.
- Les fonctions essentielles sont visibles, les options avancées restent discrètes.
- Français simple, consignes courtes, autonomie de l'élève, pas de surcharge.

## Avancement du 20 novembre 2026
- Page authentifiée `tp-tableur.html` et contrôleur `js/tp-tableur.js` ajoutés.
- Tables `tp_tableur`, `tp_tableur_affectations`, `tp_tableur_travaux` créées dans Supabase, avec RLS activée et contrôlée.
- Enseignant : brouillon, publication, duplication, affectation aux élèves inscrits, correction manuelle, cellule protégée et réponse attendue.
- Élève : TP affectés, feuille vierge, entraînement, sauvegarde, remise.
- **Non validé pour production** : tests automatisés et parcours réels, moteur tableur complet, XLSX, synchronisation du travail libre, correction automatique des TP enseignants, vérification approfondie des politiques RLS.
