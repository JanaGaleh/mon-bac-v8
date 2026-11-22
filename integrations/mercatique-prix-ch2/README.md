# monAvenir — Terminale GFM, Mercatique, chapitre 2 : Le prix

5 fiches, 7 exercices (3 faciles, 2 moyens, 2 difficiles), 28 questions
(27 autocorrigées, 1 argumentée avec corrigé indicatif). Cas et prix fictifs
en FDJ et 6 illustrations originales générées, optimisées en WebP.
Le prix psychologique préexistant reste intact dans le même chapitre.

Le module contient un simulateur de seuil de rentabilité, un graphique SVG
exact, des tableaux, des indices, des corrections et une progression locale
par compte. Le lecteur de documents transversal fournit l’agrandissement.

## Intégration

`mercatique-ch2.js` est le module autonome à intégrer à la version active de
`ege-gfm-2027`. `patch-mercatique-ch2.mjs` exporte `patchCh2(source, moduleSource,
photos)`, où photos contient les six fichiers images en base64 dans l'ordre.
Le patch conserve les ressources existantes, ajoute le module au groupe
`Le prix`, et renouvelle l’URL du registre et le cache du service worker.
Ne jamais écraser une version plus récente : comparer le déploiement actif
avant le chargement et avant le déploiement. Conserver la version précédente.

Tests : `node mercatique-ch2-unit.cjs` (DOM simulé).
Les assets `images/scene-0.webp` à `scene-5.webp` sont des scènes générées
inspirées de Djibouti : eau, téléphonie, calcul commercial, demande,
restaurant, caisse du supermarché. Aucune image tierce payante.
