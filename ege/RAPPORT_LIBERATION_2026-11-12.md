# EGE GFM 2027 — Rapport de stabilisation
**Date : 12 novembre 2026 — Statut : OUVERTURE PUBLIQUE NON VALIDÉE**
**Production :** https://ege-gfm-2027.janakaleh.workers.dev/
**Code :** `JanaGaleh/mon-bac-v8` — Cloudflare Worker `ege-gfm-2027`.
**Palette :** rouge #c91b2c, fond blanc, actions prioritaires rouge/texte blanc.

## Travaux effectués et vérifiés
- Sauvegarde du code dans `backup/ege-gfm-2027-before-public-final-2026-11-12`.
- Copie privée des neuf tables EGE dans `ege2027_snapshot_20261112` (même projet Supabase). Les comptes `auth.users` ne sont pas copiés dans ce schéma.
- Suppression des privilèges anonymes excessifs `TRUNCATE` et des permissions non nécessaires sur les tables EGE.
- RLS restreignant le dossier au propriétaire, à l'administrateur autorisé et aux seuls enseignants disposant d'un partage actif avec un membre du groupe.
- Association élève–groupe–dossier volontaire, puis lecture des modifications ultérieures du dossier existant. Retrait de groupe = retrait d'accès sans suppression du dossier.
- Correction de la récursion SQL dans la politique d'insertion du partage.
- Accueil unique en trois espaces : Élève / Enseignant / Administration ; pages internes habillées en rouge et blanc.
- Navigation élève à quatre onglets, navigation enseignant et admin adaptée.
- Enregistrement en ligne après la première association à un dossier cloud, avec temporisation, états visibles et détection de modifications concurrentes par `updated_at`. Le brouillon local est conservé en cas de conflit.
- Annexe : titre, texte, source, aperçu ; importation Word conservant les titres.
- Enseignant et administrateur : avis pour dossier entier ou une annexe, historique des corrections.
- Administration : validation enseignant, création/modification des groupes, retrait d'élèves, journalisation.
- PWA : accueil par rôle et cache de version `v8`, SDK Supabase local (version vendored).
- Courriels HTML de confirmation et de récupération de marque `Prof. Jana Galeh` préparés dans `ege/emails` **mais non encore configurés dans Supabase**.
- Tests statiques de syntaxe et de structure : **22/22 contrôles passent** au moment de la publication. Workflow `.github/workflows/ege-smoke.yml` ajouté ; son exécution distante reste à vérifier.
- Tests SQL transactionnels : élève propriétaire voit son dossier, enseignant sans partage ne le voit pas, enseignant après partage le voit, visiteur extérieur ne le voit pas, accès retiré après départ, création d'un avis par annexe, administration des groupes et audit. Tests annulés par `ROLLBACK`, données de production conservées.
- Cloudflare Worker : déploiement à 100 % confirmé. Test de rendu de l'accueil via Browser Rendering : titre, trois rôles et couleur attendue visibles.

## Bloquants avant ouverture publique
1. **Supabase Authentication > URL Configuration** : configurer `Site URL` à `https://ege-gfm-2027.janakaleh.workers.dev/` et autoriser `https://ege-gfm-2027.janakaleh.workers.dev/**` dans Redirect URLs. Supprimer `localhost:3000` des paramètres de production après vérification. Aucun outil connecté ne permet ici de modifier ces paramètres.
2. **Email Templates / SMTP** : appliquer les modèles de `ege/emails/confirmation.html` et `ege/emails/recovery.html`. Pour afficher réellement l'expéditeur « Prof. Jana Galeh », configurer un fournisseur SMTP et une adresse d'envoi vérifiée. Les modèles GitHub seuls ne modifient pas les e-mails envoyés.
3. **Tests réels de comptes** : avec trois comptes de test indépendants (élève, enseignant, admin), essayer confirmation, récupération, sauvegarde, partage, lecture, correction, retrait, export Word. Ne jamais tester avec mots de passe réels dans le chat.
4. **Appareils** : valider manuellement Android/Chrome, iOS/Safari, PC et PWA installée, y compris mode hors ligne, navigateur lent et changement d'appareil.
5. **Tests d'acceptation** : vérifier un export Word imprimable A4, mise à jour depuis deux appareils, droits administrateurs secondaires, usage des élèves mineurs et accès partagés en conditions réelles.
6. **Sécurité projet MonBac** : examiner l'avis Supabase `auth_leaked_password_protection`, ainsi que les avertissements `SECURITY DEFINER`, index et schémas partagés. Ne pas appliquer de changements au reste de MonBac sans revue.
7. **Sauvegarde hors site** : exporter aussi une copie indépendante de la base si l'ouverture publique est approuvée ; la copie `ege2027_snapshot_20261112` est dans la même base et ne protège pas contre une panne globale.

## Critères d'ouverture
Ne déclarer **PRÊT POUR LE PUBLIC** qu'une fois tous les bloquants éliminés, les tests E2E reproductibles passés et les e-mails vérifiés sur de vrais appareils.

**Verdict présent : OUVERTURE PUBLIQUE NON VALIDÉE.** La version peut être vérifiée dans le cadre d'une phase pilote contrôlée.

## Restauration et précautions
Avant toute restauration, comparer les lignes actuelles aux copies du schéma privé ; ne pas écraser un dossier récent. Conserver l'historique de l'utilisateur. Pour le code, utiliser la branche de sauvegarde. Pour les données, exporter le snapshot de manière indépendante et restaurer au cas par cas dans une transaction sous supervision, jamais un `TRUNCATE` général.
