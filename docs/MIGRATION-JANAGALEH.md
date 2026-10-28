# Migration MonBac vers janagaleh-plateform — 28 octobre 2026

## État

La copie de la base est réalisée et vérifiée. Le site publié et le projet source restent en place. Cette branche prépare uniquement le changement de configuration du client ; elle ne doit pas être fusionnée avant la recette d’authentification demandée par le propriétaire.

Source : projet Supabase `mon-bac` (`nwcatsmfbkcgvgbanwyl`).
Cible : projet Supabase `janagaleh-plateform` (`yxlyfgyviupkzoboxpte`).

## Copie contrôlée

| Élément | Source | Cible |
|---|---:|---:|
| Tables applicatives | 26 | 26 |
| Comptes Auth | 6 | 6 |
| Identités Auth | 6 | 6 |
| Profils | 6 | 6 |
| Cours | 2 | 2 |
| Matières | 7 | 7 |
| Paiements historiques | 4 | 4 |
| Politiques RLS | 36 | 36 |
| Fonctions métier | 33 | 33 |
| Déclencheurs applicatifs | 3 | 3 |
| Objets Supabase Storage | 0 | 0 |

Les 52 enregistrements des 28 tables concernées (26 applicatives et 2 Auth) ont été comparés par nombre de lignes et empreinte du contenu complet de chaque ligne. Tous correspondent, y compris après les tests transactionnels. Les identifiants, relations, séquences, contraintes, comptes et empreintes de mots de passe ont été conservés. Aucune empreinte de mot de passe, donnée personnelle ou donnée de session ne figure dans ce dépôt ou dans ce bilan. Les sessions existantes ne sont pas transférées : une nouvelle connexion sera nécessaire lors de la bascule.

Les fonctions et contraintes ont été importées dans leur structure existante pour préserver les appels du client. Les données MonBac conservent leurs noms de tables ; `monbac_private` reste privé. Il ne faut pas réutiliser `profils.role` comme autorisation administrative globale des autres applications sans définir explicitement cette séparation.

Migrations enregistrées dans le projet cible : `import_monbac_schema` et `restore_monbac_least_privilege_access`. Les données des comptes ont été transférées séparément du SQL de structure ; elles ne sont pas stockées dans les fichiers de migration.

## Sécurité

Les 26 tables conservent RLS activé. Aucun accès de table ou de séquence n’est accordé à `anon`. Les droits directs de `authenticated` sont limités aux commandes couvertes par les politiques existantes ; les opérations sensibles passent par les fonctions vérifiées. Aucun droit direct de modification du rôle d’un profil ou d’accès à la liste des administrateurs n’est accordé aux utilisateurs.

Une première reprise des permissions historiques a été refusée par le contrôle automatique parce qu’elle accordait des écritures anonymes inutiles. Elle n’a pas été appliquée. La version suivante retire ces droits et a été appliquée avec succès.

L’advisor conserve les remarques suivantes, à interpréter sans ouvrir de droits supplémentaires :

- [Tables RLS sans politique](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) : cinq tables volontairement inaccessibles directement et gérées par les fonctions autorisées.
- [Fonctions SECURITY DEFINER](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable) : les fonctions nécessaires aux opérations métier restent appelables par les comptes authentifiés et vérifient leurs autorisations. Les tests vérifient notamment le refus des appels administratifs par un élève.
- [Extension dans public](https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public) : `btree_gist` a été conservée pour la contrainte empêchant le chevauchement des tarifs.
- [Protection contre les mots de passe compromis](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) : cette option reste désactivée ; aucune offre payante n’a été souscrite.

## Validation réalisée

- `npm test` : 25 tests DOM et unitaires passent. Ces tests simulent le fournisseur Auth et ne prouvent pas la délivrance des e-mails ou un vrai parcours OAuth.
- `npm run check` : syntaxe des scripts valide.
- `tests/security.sql` sur la cible, transaction annulée : séparation des profils, cours autorisés, confidentialité des corrigés, refus des actions administratives, reprise et notation serveur des quiz, refus des accès à la tentative d’un autre élève.
- `tests/registration-security.sql` sur la cible, transaction annulée : création sûre des profils par le déclencheur Auth, vérification de l’e-mail côté base, demande de rôle enseignant sans auto-approbation, isolement des demandes, validation/refus administratifs et journalisation.
- `python3 scripts/migration_preflight.py` : Auth répond en HTTP 200 ; inscription e-mail activée ; confirmation requise ; Google désactivé ; accès anonymes aux profils et à la RPC administrative refusés en HTTP 401.
- Après tests : aucune ligne de test conservée ; les 52 enregistrements correspondent toujours au relevé initial ; la source n’a pas changé.

La vérification visuelle dans un navigateur n’a pas été réalisée dans cette session, car le contrôle du navigateur n’était pas disponible. Le HTML/CSS d’affichage n’a pas été refait : seules les URL de connexion autorisées par les CSP ont changé.

## Avant toute bascule

1. Configurer et contrôler les URL de retour Auth pour l’environnement de recette, puis l’adresse publiée de MonBac. Vérifier l’émetteur SMTP, l’envoi et la réception réels des confirmations et de récupération.
2. Ajouter/configurer le parcours Google et la récupération du mot de passe. Le client MonBac existant ne les fournit pas encore complètement ; cette branche ne prétend pas les avoir validés.
3. Tester réellement inscription, confirmation e-mail, connexion avec mot de passe, Google, déconnexion et récupération avec un compte de recette. Les tests SQL et les simulations ne remplacent pas ces parcours.
4. Vérifier les rôles élève, enseignant et administrateur dans le navigateur, sans élargir leurs autorisations.
5. Relever les éventuelles modifications intervenues dans la source depuis la copie et les synchroniser avant la bascule. Aucune synchronisation automatique n’a été activée.
6. Publier la configuration uniquement après ces vérifications. Le service worker utilise une nouvelle version de cache pour éviter un ancien client associé à la mauvaise base.
7. Conserver le projet source pour le retour arrière. Ne le supprimer et ne le mettre en pause qu’après validation distincte.

Le domaine et le sous-domaine existants n’ont pas été modifiés. Aucun paiement ni message aux utilisateurs n’a été déclenché.

## Reprise de la procédure

Une copie de données n’est pas une sauvegarde des paramètres d’Auth : clés de signature, fournisseurs OAuth, URL de retour et configuration SMTP appartiennent à chaque projet. Il faut reconfigurer et tester ces éléments. La procédure officielle de référence est [Backup and Restore using the CLI](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore).
