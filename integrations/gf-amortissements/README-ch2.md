# MonAvenir — Terminale GFM / Gestion financière / Chapitre 2

Module additionnel : amortissement linéaire et par unité d’œuvre, 12 fiches, 60 exercices répartis sur quatre niveaux (15/20/15/10), dont quatre cas de synthèse BAC, tableaux de plans à saisir, journal à cinq colonnes, bilan, simulateurs et comparateur. Les plans arrondissent le cumul au FDJ et plafonnent le cumul à la base amortissable. La progression est locale par élève et appareil.

Références : [PCG Djibouti 2012](https://budget.gouv.dj/wp-content/uploads/2022/07/PLAN-COMPTABLE-GENERAL-DE-DJIBOUT.pdf), [CRIPEN — programmes de Terminale](https://cripen.dj/wp-content/uploads/2025/05/Programme-compile-Terminale.pdf), [ressource française Gestion et Finance (inspiration de la démarche uniquement)](https://cache.media.eduscol.education.fr/file/Terminale_Gestion_et_Finance/53/5/Theme_1_243535.pdf). Le PCG djiboutien gouverne les comptes, la valeur résiduelle et les méthodes.

## Intégration

Ce dossier concerne le Worker complémentaire existant `monavenir-prix-psychologique`, et non la branche principale ou le Worker primaire `ege-gfm-2027`. Le fichier `current-edge.mjs` est le code du Worker complémentaire actif au moment de la préparation, version `6429f547-8131-45d5-87ce-16ad8945604e`. Il inclut déjà le prix psychologique, le lecteur de documents et le chapitre 1 de GF.

```sh
node extend-worker.mjs current-edge.mjs monavenir-gf-ch2.js candidate-edge.mjs
node --check candidate-edge.mjs
node --test gf-ch2.test.cjs edge-ch2.test.mjs
node gf-ch2.browser.cjs  # dans un environnement Chromium autorisé
```

Le patch s'arrête si les ancres du Worker actif ne correspondent pas. Il ajoute uniquement les hooks du chapitre 2 aux deux scripts pédagogiques existants, conserve les modules actuels et avance le nom du cache statique PWA. Il exclut le nouveau dialogue du lecteur transversal, car ce dialogue possède ses commandes de zoom sans cloner les formulaires. Ne jamais modifier les routes, le Worker primaire, les bindings ou les données sans nécessité distincte.

Tests exécutés : 7 tests Node réussis ; rendu Chromium isolé via Browser Run réussi aux dimensions 390×844, 768×850 et 1440×850. Le navigateur local n'a pas pu démarrer en raison d'une restriction système. Aucun compte réel n'a été créé pour les tests.

Le déploiement d'une version spécifique du Worker complémentaire permet un retour à son identifiant de version actif avant publication. Toujours relire l'identifiant de déploiement courant avant de publier pour éviter d'écraser des changements concurrents.
