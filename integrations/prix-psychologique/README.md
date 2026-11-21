# MonAvenir — Terminale GFM / Mercatique / Le prix psychologique

Module additionnel autonome : six fiches, trente questions corrigées, quatre niveaux, tableau à compléter avec deux jeux de données, graphiques et progression locale par compte. Pas de nouvelle dépendance réseau ni modification de la base, du laboratoire, de l’EGE, de la navigation globale ou des API. Contextes commerciaux et données fictifs ; le contenu vise la notion de prix psychologique du référentiel de Terminale SG (Gestion et Marketing).

## Intégration à la version réellement publiée

Le 21/11/2026, `monavenir.janagaleh.com` est servi par le Worker Cloudflare `ege-gfm-2027`, distinct de la branche GitHub `main`. L'interface publique charge ses ressources statiques depuis ce Worker, notamment deux scripts dans lesquels se trouvent les points d'extension déjà utilisés par le module d'optique. **Ne pas déployer cette branche GitHub sur le domaine en remplacement du Worker.**

1. Exporter et conserver l'intégralité de la version actuelle du Worker, ses paramètres et l'identifiant de déploiement. Ne pas utiliser le snapshot du 19/11 comme version actuelle.
2. Extraire sa table `assets` dans un fichier JSON UTF-8 (format `[mime, binary, content]`), sans modifier le gestionnaire de requête ni les bindings.
3. `node integrations/prix-psychologique/patch-assets.mjs current-assets.json patched-assets.json` — le script s'arrête si les points d'extension exacts de la version actuelle ne correspondent pas. Il ajoute deux ressources, leurs liens et les deux accès au module, en conservant les autres entrées.
4. Vérifier le diff, reconstruire le Worker à partir du code serveur exact (en ne remplaçant que la table `assets`) et tester une prévisualisation authentifiée Terminale GFM/Mercatique, ainsi que le retour aux espaces, les autres matières et les anciens modules. Conserver la version active pour restauration.
5. Déployer sur le même Worker seulement après vérification, puis tester l'URL publique. La progression est locale au navigateur et au compte, pas synchronisée entre appareils.

## Déploiement complémentaire — 21/11/2026

L'export du Worker principal dépasse la limite mémoire du connecteur. Le propriétaire a validé le recours à un Worker complémentaire nommé `monavenir-prix-psychologique` : `edge-worker.mjs` s'appuie sur le service `PRIMARY` (`ege-gfm-2027`) et ne transforme que les deux scripts identifiés. Le Worker principal, le domaine, les pages, les API et la base de données ne sont pas remplacés. Les modifications sont ajoutées au contenu original à la volée ; si les points d'intégration exacts changent, le fichier d'origine est conservé. La réponse modifiée porte `x-monavenir-prix: 1` et n'est pas mise en cache.

Le Worker a été testé sur son sous-domaine de prévisualisation puis raccordé à `monavenir.janagaleh.com` avec deux routes précises (les noms sont constants dans `edge-worker.mjs`). Les deux scripts publics retournent HTTP 200 avec le marqueur, et la page d'accueil publique est identique avant/après. Pour retirer le module, retirer seulement ces deux routes, sans toucher au domaine personnalisé du Worker principal. En cas de nouvelle version modifiant les noms des scripts, revoir les routes et les points d'intégration avant de les actualiser.

## Tests

`node --test tests/prix-psychologique.test.js tests/prix-edge.test.js`
