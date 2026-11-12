-- EGE 2027 : classement premium administré sur la page publique des annonces.
-- Réversible : ALTER TABLE public.ege2027_ads DROP COLUMN is_premium;
ALTER TABLE public.ege2027_ads
 ADD COLUMN IF NOT EXISTS is_premium boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS ege2027_ads_directory_rank_idx
 ON public.ege2027_ads (status, is_premium DESC, priority DESC, created_at DESC);
-- Les enseignants proposent uniquement des annonces standard en attente.
-- Seul l'administrateur peut rendre une annonce premium.
DROP POLICY IF EXISTS ege2027_ads_insert ON public.ege2027_ads;
CREATE POLICY ege2027_ads_insert ON public.ege2027_ads
 FOR INSERT TO authenticated
 WITH CHECK(
  submitted_by=(SELECT auth.uid())
  AND (
   (
    status='pending'
    AND is_premium=false
    AND EXISTS (
     SELECT 1 FROM public.ege2027_teacher_requests r
     WHERE r.user_id=(SELECT auth.uid()) AND r.status='approved'
    )
   )
   OR EXISTS (
    SELECT 1 FROM public.ege2027_staff s
    WHERE s.user_id=(SELECT auth.uid()) AND s.role='admin'
   )
  )
 );