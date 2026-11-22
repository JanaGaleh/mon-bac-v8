# monAvenir — Prix psychologique, exercice guidé

Terminale GFM · Mercatique · Le prix. Données fictives de 200 consommateurs.
25 cellules de cinq colonnes, deux axes, 15 points et trois liaisons, puis trois
questions d’interprétation : 48 validations. Les deux refus sont cumulés dans les
sens opposés. Le prix psychologique est 2 000 FDJ (60 %, 120 consommateurs).

`prix-guide.js` expose le module `MAPrixGuide` au registre des ressources natives.
Il réutilise la miniature du professeur `/monavenir-coach-jana-v276.webp` et
une illustration originale générée, `prix-guide-scene.webp`, publiée sous
`/monavenir-prix-guide-scene-v1.webp`. Situation fictive : vendeur djiboutien
présentant des écouteurs sans fil dans un magasin. Aucun abonnement d'images.

`patch-prix-guide.mjs` cible le Worker principal `ege-gfm-2027` : ajouter le
module et l'image à la version active sans supprimer les autres ressources,
changer l’URL du registre et renouveler le service worker. Il refuse tout
registre inattendu. Ne pas déployer si la version active a changé entretemps.

Tests : `node prix-guide-unit.cjs`, `node --check prix-guide.js`,
`node --check patch-prix-guide.mjs`. Le test browser `prix-guide-browser-test.js`
est un test de parcours avec DOM réel, sans données utilisateur et sans appel
réseau d'authentification. Contrôles : 390, 768 et 1280 pixels, erreurs volontaires,
calculatrice, indices, formulaires, zoom, tracé, réinitialisation et sauvegarde.
