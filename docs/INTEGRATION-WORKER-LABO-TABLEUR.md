# Intégration ciblée — monAvenir / Worker existant

Branche de préparation : `feature/monavenir-labo-tableur-worker`.

## État de référence Cloudflare (20/11/2026)
- Worker : `ege-gfm-2027`
- Version de restauration : 186
- ID : `5080807e-24c4-474f-a916-9939d7ef014f`
- Déploiement actuel : 100 % sur cette version lors du contrôle.
- Le Worker existant embarque ses ressources dans l'objet JavaScript `assets`. Le Worker actuel ne contient pas `/laboratoire.html` ni `/tp-tableur.html`.

## Fichiers à ajouter au Worker, sans remplacer les autres ressources
- `/laboratoire.html`
- `/tp-tableur.html`
- `/tp-tableur.css`
- `/js/tp-tableur.js`
- `/js/tableur-engine.js`
- `/js/tableur-xlsx.js`
- Dépendances du tableur à auditer : `/js/api.js` et ses imports transitifs.

Le Laboratoire pointe vers `./tp-tableur.html` pour le tableur complet.

## Conditions avant mise en production
1. Sauvegarder et vérifier l'intégrité du code exact de la version déployée (pas seulement son ID).
2. Reconstituer le Worker à partir de la sauvegarde en conservant les bindings, les routes et les deux API d'IA existantes.
3. Ajouter uniquement les chemins nécessaires à l'objet `assets` et un accès discret depuis l'interface actuelle, sans refonte.
4. Tester HTML/CSS/JS, le moteur de calcul, import/export XLSX, les permissions et les parcours élève/enseignant.
5. Vérifier la réponse du Worker en préproduction, puis publier avec possibilité de retour immédiat à la version 186.

**Attention :** le prototype Laboratoire actuel n'exécute pas encore Python ; « Mes TP » n'est pas encore une gestion Supabase opérationnelle. Ne pas annoncer ces fonctions comme terminées.

Ne pas déployer directement la branche GitHub sur le domaine : le site public est servi par le Worker Cloudflare et non par GitHub Pages.
