# MonAvenir — Terminale GFM · Mercatique · Chapitre 1

Le produit et l'offre commerciale : cinq fiches, sept exercices (3 faciles,
2 moyens, 2 difficiles), 25 questions dont 2 argumentées. Situations, chiffres et
marques fictifs adaptés à Djibouti. Les six images WebP sont des illustrations
originales générées, sans photographie de personnes identifiables ni recours à
un hébergement d'images externe.

## Intégration

Ce module est intégré au registre V276 du Worker principal `ege-gfm-2027`
dans la version de déploiement 278, sans modifier ses routes, ses données,
son authentification ni les autres chapitres.

Le fichier `patch-primary.mjs` exporte `patchPrimary(source, moduleSource, photos)`.
`source` est le JavaScript exact du Worker principal V276 ;
`moduleSource` le texte UTF-8 de `mercatique-ch1.js` ; `photos` les six fichiers
`mercatique-images/scene-0.webp` à `scene-5.webp` encodés en base64 dans cet ordre.
La fonction refuse de modifier une version qui ne correspond pas aux ancres
attendues. Garder l'identifiant du déploiement actif pour une restauration.

Le registre ajoute le chapitre aux choix et aux ressources natives de Fiches
et Exercices. Sa nouvelle URL `/monavenir-chapters-v278.js` évite un cache ancien.
Les images sont servies sur `/monavenir-merca-ch1-scene-0.webp` à
`/monavenir-merca-ch1-scene-5.webp` avec le type MIME image/webp. Le lecteur de documents
transversal existant assure les commandes d'agrandissement (photos, tableaux,
graphiques SVG). La progression est enregistrée localement par identifiant de
compte, pas synchronisée entre appareils.

## Tests

`node mercatique-unit.cjs` vérifie le périmètre, le nombre de ressources, la
navigation, les corrections, les indices, les résultats et la progression
locale via un DOM simulé.

`node mercatique-test.cjs` est un test navigateur optionnel avec Playwright
et Chromium installé ; lancer depuis le dossier du module.

Source du référentiel : curricula de Terminale SG, programme de gestion et
marketing, thème 1 (construction de l'offre), partie portant sur le produit.
Le prix demeure dans son chapitre indépendant.
