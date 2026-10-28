# Plateforme janagaleh.com — structure et parcours

## Livraison de cette étape

La racine du site devient l’accueil de la plateforme. MON BAC est une application distincte, accessible depuis `mon-bac.html`, avec un lien de retour aux applications. Le registre `js/modules.js` permet d’ajouter d’autres applications disponibles sans leur accorder de droits implicites sur les données de MON BAC. Aucun autre module métier n’a été inventé ou déclaré fonctionnel.

Le compte Supabase existant et sa session sont réutilisés sur le même domaine d’hébergement. Les rôles actuels restent limités à leur fonctionnement dans MON BAC. Ce socle de navigation ne constitue pas encore un système d’autorisations commun à plusieurs applications : chaque future application devra vérifier ses droits côté serveur.

Les anciens liens `/#cours`, `/#profil`, etc. renvoient vers l’écran MON BAC correspondant. Le manifeste garde son identifiant PWA et ouvre désormais directement MON BAC. Le cache est versionné `shell-3` ; il contient uniquement les fichiers de l’interface et conserve les caches d’autres applications.

## MON BAC en service

- Accueil élève limité à trois blocs : prochain cours/quiz ou invitation, derniers cours, progression.
- Retour direct à la plateforme depuis la connexion et l’espace connecté.
- Reprise du dernier cours accessible (seul son identifiant est mémorisé localement, séparément pour chaque utilisateur ; aucun contenu pédagogique ajouté au stockage local).
- Listes réutilisées en mémoire pendant 30 secondes, invalidées après une écriture ou une actualisation explicite, supprimées à la déconnexion.
- Contenu des cours chargé uniquement à l’ouverture ou à l’édition ; la liste n’en télécharge plus le texte complet.
- Déclaration de règlement dans une section repliable, pour alléger le profil.
- Les contrôles serveur et les rôles existants restent appliqués. Aucune migration ni modification RLS effectuée.

## Maquette interactive isolée

`parcours.html` présente des données fictives clairement identifiées et bloque toutes les connexions réseau avec `connect-src 'none'`. Aucun client Supabase n’est chargé. Elle ne crée aucun compte, ne transmet aucune demande, n’envoie aucune notification, n’effectue aucun paiement et n’accorde aucun accès réel.

Parcours disponibles :

1. Catalogue : recherche par titre/matière/enseignant, filtres gratuit/payant et matière, fiche de cours, programme à déplier, téléchargement d’un petit document texte de démonstration.
2. Profils : fiche enseignant publique et espace élève privé ; photo facultative essayée localement, sans téléversement ni enregistrement.
3. Inscription : élève, enseignant, formateur ou autre ; choix d’une formule gratuite/payante, tarifs et quotas explicitement à définir, validation administrative simulée.
4. Paiement : choix Waafi, D-Money, CAC Pay, SabaPay ou espèces ; état en attente, confirmation administrative simulée et aperçu de notification enseignant.

Les méthodes de paiement sont des choix de conception ; aucune disponibilité d’API, aucun contrat prestataire et aucun encaissement automatique ne sont revendiqués. Les tarifs de cours et d’abonnement ne sont pas inventés.

## Évolutions serveur à faire valider avant mise en production

| Évolution | Contrôles proposés et justification |
| --- | --- |
| Compte plateforme et rôles par application | Séparer identité commune, demande de rôle et attribution validée par application. Un utilisateur ne doit jamais pouvoir s’attribuer un rôle privilégié via un formulaire ou ses métadonnées. |
| Profils enrichis | Profil public enseignant distinct des données privées élève et contacts. Liste stricte des champs que l’utilisateur peut modifier ; rôle et statut réservés à l’administration. |
| Inscription et validation | Statuts `en_attente`, `valide`, `refuse`, `suspendu` séparés de l’offre commerciale. Journaliser qui valide et limiter les droits tant que la validation n’a pas eu lieu. |
| Catalogue public | Exposer uniquement titres, matières, niveaux, présentation et prix approuvés. Ne pas exposer le contenu Premium ni les profils élèves pour rendre un catalogue lisible. |
| Documents et photos | Stockage privé pour les documents ; contrôle de propriété, type MIME, taille et quota ; téléchargement autorisé côté serveur avec liens limités dans le temps. Photos publiques uniquement selon la visibilité du profil validée. |
| Accès par cours | L’accès actuel est lié à un enseignant. Créer une attribution par cours distincte des abonnements plateforme, avec migration additive et préservation des accès existants. |
| Paiements | Confirmation serveur par prestataire quand l’intégration est possible ; sinon vérification administrative. Référence unique, anti-doublon, idempotence, traçabilité et montant vérifié côté serveur. Une déclaration élève ne valide jamais elle-même un paiement. |
| Notifications | Créer une notification privée pour les destinataires autorisés après une inscription ou une confirmation effective ; éviter toute duplication lors d’un nouvel appel. Ne pas exposer les données de paiement aux autres élèves. |
| Offres et quotas | Définir prix, capacité, fonctionnalités, renouvellement et comportement à expiration. Limites vérifiées côté serveur, indépendamment du rôle ; aucune suppression automatique des données existantes. |

Ces propositions ne sont pas des migrations appliquées. Une validation fonctionnelle générale n’est pas traitée comme une permission d’ouvrir de nouvelles données publiques.

## Domaine janagaleh.com

Le dépôt reste publié sur GitHub Pages, conformément à l’architecture existante. Aucun enregistrement DNS, aucune configuration CNAME et aucun certificat n’ont été modifiés. Les vérifications HTTPS du domaine et de `www` n’ont pas abouti depuis l’environnement de travail ; cela ne permet pas de conclure que le domaine est libre ou non enregistré.

Pour le rattacher, il faut identifier le fournisseur du domaine, vérifier sa configuration et l’hébergement actuel, puis préparer les changements exacts sans couper un site ou une messagerie existants. Ne pas remplacer aveuglément les enregistrements DNS.

## Vérifications

Les 19 tests automatisés réussis couvrent les parcours existants, la navigation sans rechargement inutile des listes, les liens des trois pages, le registre des modules, la compatibilité des anciens liens, l’isolation réseau de la maquette, la recherche et les inscriptions simulées, les paiements simulés, les profils et le cache PWA.

La prévisualisation navigateur a permis de parcourir le portail, une fiche payante, le choix D-Money, l’attente de confirmation et la notification fictive. Les tests physiques Android/iPhone et les intégrations serveur restent à réaliser.
