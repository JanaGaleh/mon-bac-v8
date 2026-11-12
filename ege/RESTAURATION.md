# EGE GFM 2027 — Procédure de récupération (non destructive)

1. Suspendre les écritures sur les parcours concernés ; signaler une maintenance.
2. Vérifier que le dernier correctif GitHub et Cloudflare est bien identifié (SHA et version Worker).
3. Conserver une exportation hors site des tables `public.ege2027_*` et `ege2027_snapshot_20261112.*` avec contrôle du nombre de lignes.
4. Restaurer le **code** en repartant, si nécessaire, de la branche `backup/ege-gfm-2027-before-public-final-2026-11-12`. Toute restauration du Worker exige une nouvelle vérification de ses routes.
5. Restaurer les **données** individuellement par `id` et `owner_id`, en comparant `created_at`, `updated_at`, et les versions. Ne jamais exécuter de suppression massive ni remplacer une sauvegarde plus récente par le snapshot initial.
6. Vérifier l'isolation RLS (élève/enseignant/admin), les liens groupe-dossier et la fonctionnalité Word avant de réouvrir.
7. Consigner chaque restauration et sa justification.

La sauvegarde privée interne ne couvre **pas** les utilisateurs de `auth.users`, le service SMTP ni les ressources Cloudflare. Prévoir une sauvegarde Supabase indépendante avant diffusion massive.
