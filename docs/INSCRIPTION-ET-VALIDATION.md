# Inscription élève et demande enseignant

## Parcours livré

Le lien **Créer un compte** est ajouté à l’écran de connexion de MON BAC. Le formulaire demande le nom affiché, l’adresse e-mail, un mot de passe d’au moins 12 caractères et le type d’inscription. Les candidats enseignants présentent également leurs matières et niveaux.

La confirmation de l’e-mail reste obligatoire, conformément aux réglages Supabase observés (`disable_signup=false`, `mailer_autoconfirm=false`). Le formulaire prévoit le renvoi du lien et indique de revenir se connecter après confirmation. Les mots de passe restent gérés par Supabase Auth ; ils ne sont pas inscrits dans les profils, les demandes ni le journal.

Le déclencheur existant crée toujours un profil `eleve`, même si des métadonnées du navigateur prétendent demander un rôle supérieur. Il n’est pas modifié.

Pour un enseignant, les métadonnées ne servent qu’à conserver l’intention et la présentation jusqu’à la première connexion après confirmation. Elles ne donnent aucun droit. La demande est alors enregistrée par une fonction serveur et le candidat est dirigé vers son profil, où il voit l’attente ou la décision administrative. Un élève déjà inscrit peut également demander l’accès enseignant depuis son profil, sans créer un deuxième compte.

Dans **Administration → Comptes**, l’administrateur peut examiner la présentation puis approuver ou refuser. L’approbation attribue le rôle `enseignant` dans la même transaction que la décision et l’écriture au journal. Le refus conserve le rôle élève et affiche le message au candidat. Une décision déjà enregistrée ne peut pas être rejouée ; une demande refusée doit être réexaminée avec l’administration, sans nouvelle demande automatique.

Le candidat doit actualiser ses accès ou se reconnecter pour ouvrir les menus enseignant après approbation.

## Modifications serveur autorisées par ce circuit

Migration `teacher_registration_approval`, appliquée et conservée dans `supabase/migrations` avec la version retournée par le serveur.

- Nouvelle table `monbac_private.demandes_enseignants`, hors schéma API, RLS activée, sans privilège direct pour les rôles navigateur.
- Fonctions privilégiées dans ce schéma privé, avec `search_path` vide et vérification explicite de l’utilisateur, de la confirmation e-mail, du rôle candidat ou du rôle administrateur.
- Quatre façades publiques `SECURITY INVOKER` : demande, consultation de sa demande, liste administrative, décision.
- Exécution interdite à `anon` et `PUBLIC`, accordée au rôle `authenticated` avec contrôles dans chaque fonction privée.
- Aucune modification des 36 politiques publiques existantes ; aucun changement des règles cours, quiz ou Premium.
- Aucun rôle attribué à partir des métadonnées utilisateur. Aucun compte ni rôle réel existant modifié par les tests.

Le diagnostic Supabase ajoute une information « RLS sans politique » pour la nouvelle table privée : son accès direct est volontairement fermé. Les avertissements antérieurs restent inchangés ; aucune nouvelle fonction privilégiée publique n’a été exposée.

## Tests et limites de vérification

- 24 tests automatisés : parcours existants, formulaire élève/enseignant, mot de passe, métadonnées non privilégiées, confirmation, limitation de renvoi, erreurs d’envoi, absence d’auto-approbation côté client et décision administrative via RPC.
- Tests SQL réels dans une transaction annulée : création du profil avec rôle élève malgré des métadonnées malveillantes, demande idempotente, rejet de l’auto-approbation, impossibilité de changer directement son rôle, accès privé bloqué, isolation entre utilisateurs, confirmation e-mail obligatoire, décision administrateur, approbation et refus, absence de répétition de décision, journalisation.
- Vérification après rollback : cinq profils existants, zéro compte de test conservé, zéro demande de test conservée, 36 politiques publiques existantes.
- Les scénarios de formulaire utilisent une API simulée : aucun message de test n’a été envoyé à un destinataire réel. La réception et le parcours du mail réel doivent encore être validés avec une adresse de recette.

## Configuration e-mail de production à contrôler

Le code demande un retour vers `https://monbac.janagaleh.com/mon-bac.html`. Cette adresse doit être autorisée dans **Supabase → Authentication → URL Configuration**. Le réglage serveur n’a pas été modifié sans accès à sa configuration.

Un service SMTP adapté aux inscriptions publiques est nécessaire pour un usage en production. Les outils disponibles n’ont pas permis de confirmer le fournisseur et les limites actuels. La protection par confirmation d’e-mail n’a pas été désactivée pour contourner un problème d’envoi. Si Supabase renvoie `email_address_not_authorized` ou une limite d’envoi, le formulaire affiche une explication et ne prétend pas que le compte est activé.
