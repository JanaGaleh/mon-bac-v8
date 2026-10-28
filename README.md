# MON BAC V8

PWA éducative en français, publiée sur https://janagaleh.github.io/mon-bac-v8/.

Architecture conservée : HTML/CSS/JavaScript statiques sur GitHub Pages, Supabase Auth et Postgres, permissions RLS et fonctions RPC existantes. Aucun framework ni serveur supplémentaire requis. Le client Supabase 2.57.4 est distribué localement avec sa licence, sans dépendance à un CDN à l’ouverture.

## Fonctionnalités

- Connexion commune avec orientation selon le rôle lu dans `profils` : élève, enseignant, super_admin.
- Élève : accueil et indicateurs réels, cours gratuits/Premium autorisés par la base, recherche et filtres, lecture sécurisée, inscription par code, déclaration de règlement et suivi des accès.
- Quiz : ouverture par numéro enseignant, reprise, QCM/vrai-faux/texte, réponses et notation par les RPC existantes, résultats et corrections après clôture.
- Enseignant : création/modification de cours, création de quiz et questions avec corrigés, codes d’invitation, consultation des élèves/paiements/accès.
- Administration : statistiques, comptes en lecture seule, vérification et décision sur les paiements via RPC, abonnements et journal.
- PWA : manifeste et icônes corrigés, interface adaptée aux petits écrans, cache de l’interface uniquement, avertissement hors connexion.

## Développement et vérification

```sh
npm ci
npm test
npm run check
python -m http.server 8765
```

Les tests `tests/*.test.js` vérifient les fonctions métier et les parcours d’interface dans un DOM simulé, avec API fictive. Ils ne constituent pas une validation sur téléphone physique.

`tests/security.sql` est un test d’intégration **transactionnel** à exécuter avec une connexion de gestion Supabase : il utilise les comptes existants, crée des contenus et une tentative temporaires, vérifie les rôles et les RPC, puis fait `ROLLBACK`. Les séquences d’identifiants peuvent avancer malgré le rollback. Aucune donnée de test n’est conservée. Ne pas exécuter en supprimant le rollback.

`tests/browser.cjs` prépare les scénarios Chromium/WebKit avec API simulée. Il nécessite Playwright et ses navigateurs installés. Son exécution n’a pas été possible dans l’environnement initial, le téléchargement des navigateurs étant bloqué. Les tests DOM restent exécutables via `npm test`.

## Déploiement

GitHub Pages utilise `main`, dossier racine, comme avant. Les fichiers sont directement publiables, sans build. Le workflow de vérification exécute les tests à chaque push/PR ; la publication Pages existante reste indépendante. Pour revenir à une version précédente, utiliser un commit de restauration Git, sans toucher à Supabase.

## Limites et suite

Voir [le bilan technique](docs/BILAN-2026-10-28.md). Ne jamais ajouter de clé secrète/service_role dans les fichiers publics. Les changements RLS, de droits ou de fonctions de sécurité nécessitent justification et validation du propriétaire.

## Plateforme janagaleh.com

La page d’accueil présente désormais les applications. MON BAC reste accessible directement dans [`mon-bac.html`](mon-bac.html), avec le même compte Supabase et les mêmes droits. Les anciens liens avec onglets sont redirigés vers le module correspondant.

[`parcours.html`](parcours.html) est une **maquette interactive isolée**, avec données fictives et sans connexion réseau : profils, inscription, formules et moyens de paiement. Elle ne crée aucun compte et ne traite aucun paiement réel.

Voir [la structure de plateforme et les évolutions serveur proposées](docs/PLATEFORME-JANAGALEH.md). Le rattachement du domaine `janagaleh.com` reste à configurer séparément ; aucune modification DNS n’a été effectuée.
