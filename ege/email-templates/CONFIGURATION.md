# EGE GFM 2027 — Corriger la confirmation et personnaliser les e-mails

## Pourquoi le lien affichait localhost:3000 ?
La confirmation a bien pu réussir, mais le renvoi vers localhost échouait sur le téléphone.
Il faut modifier la configuration du projet Supabase MonBac : `nwcatsmfbkcgvgbanwyl`.

## 1. Corriger les URLs Supabase Auth (obligatoire)
Ouvrir : https://supabase.com/dashboard/project/nwcatsmfbkcgvgbanwyl/auth/url-configuration

- **Site URL** : `https://ege-gfm-2027.janakaleh.workers.dev/`
- **Redirect URLs** (ajouter les entrées exactes) :
  - `https://ege-gfm-2027.janakaleh.workers.dev/`
  - `https://ege-gfm-2027.janakaleh.workers.dev/enseignant.html`
- Enregistrer. Ne pas laisser `http://localhost:3000` comme Site URL de production.
- Tous les prochains liens de confirmation utiliseront la bonne URL.

## 2. Personnaliser le mail (sujet et corps)
Ouvrir : https://supabase.com/dashboard/project/nwcatsmfbkcgvgbanwyl/auth/templates

Dans **Confirm sign up** :
- **Subject** : `Prof. Jana Galeh — Confirmez votre inscription EGE GFM 2027`
- **Body** : coller le contenu du fichier `ege/email-templates/confirmation.html` du dépôt.
- Il faut conserver exactement `{{ .ConfirmationURL }}` dans les liens du modèle.

## 3. Modifier le nom visible de l'expéditeur
Ouvrir : https://supabase.com/dashboard/project/nwcatsmfbkcgvgbanwyl/auth/smtp

Pour ne plus afficher « Supabase Auth » comme nom d'expéditeur, configurer un fournisseur SMTP :
- **Sender name** : `Prof. Jana Galeh`
- **From address** : une adresse réellement validée sur le domaine, par exemple `no-reply@janagaleh.com` uniquement après configuration et vérification du domaine.
- **Host / Port / User / Password** : fournis par le prestataire SMTP choisi, jamais par le modèle d'e-mail.
- Vérifier SPF, DKIM et DMARC.
Sans service SMTP personnalisé, le nom du service d'envoi peut rester « Supabase Auth », même si le contenu du message est personnalisé.

## 4. Vérifier
1. Inscrire un **nouveau** compte de test (éviter de refaire une inscription déjà confirmée).
2. Ouvrir le nouvel e-mail, cliquer sur le lien.
3. Vérifier que le navigateur revient sur `/enseignant.html` ou sur la page EGE.
4. Se connecter et demander un accès enseignant.
5. Valider la demande depuis `/admin-enseignants.html`.

**Important :** le compte de test montré dans les captures du 12/11/2026 est déjà confirmé dans la base ; ne pas le recréer.

## Liens utiles
- https://supabase.com/docs/guides/auth/redirect-urls
- https://supabase.com/docs/guides/auth/auth-email-templates
- https://supabase.com/docs/guides/auth/auth-smtp
