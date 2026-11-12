-- EGE 2027 — annonces pédagogiques soumises par les enseignants, publiées par l'administration.
-- Rollback contrôlé (si aucune annonce à conserver) :
-- DROP TRIGGER IF EXISTS ege2027_ad_audit_trigger ON public.ege2027_ads;
-- DROP FUNCTION IF EXISTS ege2027_private.audit_ad_changes();
-- DROP TABLE IF EXISTS public.ege2027_ads;
CREATE TABLE IF NOT EXISTS public.ege2027_ads (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 submitted_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
 title text NOT NULL CHECK (length(trim(title)) BETWEEN 4 AND 90),
 description text NOT NULL CHECK (length(trim(description)) BETWEEN 8 AND 180),
 details text NOT NULL DEFAULT '' CHECK (length(details) <= 1200),
 destination_url text CHECK (destination_url IS NULL OR (length(destination_url) <= 500 AND destination_url ~ '^https://[^[:space:]]+$')),
 placements text[] NOT NULL DEFAULT ARRAY['home']::text[]
  CHECK (cardinality(placements) BETWEEN 1 AND 5 AND placements <@ ARRAY['home','auth','student_home','student_docs','student_group']::text[]),
 status text NOT NULL DEFAULT 'pending'
  CHECK (status IN ('pending','approved','paused','rejected')),
 priority smallint NOT NULL DEFAULT 0 CHECK (priority BETWEEN 0 AND 20),
 start_at timestamptz NULL,
 end_at timestamptz NULL,
 approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK (start_at IS NULL OR end_at IS NULL OR start_at < end_at)
);
CREATE INDEX IF NOT EXISTS ege2027_ads_public_idx ON public.ege2027_ads(status,priority DESC,created_at DESC);
CREATE INDEX IF NOT EXISTS ege2027_ads_submitted_idx ON public.ege2027_ads(submitted_by,created_at DESC);
CREATE INDEX IF NOT EXISTS ege2027_ads_placements_idx ON public.ege2027_ads USING gin(placements);
ALTER TABLE public.ege2027_ads ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ege2027_ads FROM public,anon,authenticated;
GRANT SELECT ON public.ege2027_ads TO anon;
GRANT SELECT,INSERT,UPDATE ON public.ege2027_ads TO authenticated;
DROP POLICY IF EXISTS ege2027_ads_read_public ON public.ege2027_ads;
CREATE POLICY ege2027_ads_read_public ON public.ege2027_ads FOR SELECT
TO anon,authenticated USING (
 status='approved'
 AND (start_at IS NULL OR start_at<=now())
 AND (end_at IS NULL OR end_at>now())
);
DROP POLICY IF EXISTS ege2027_ads_read_owner ON public.ege2027_ads;
CREATE POLICY ege2027_ads_read_owner ON public.ege2027_ads FOR SELECT
TO authenticated USING (submitted_by=(SELECT auth.uid()));
DROP POLICY IF EXISTS ege2027_ads_read_admin ON public.ege2027_ads;
CREATE POLICY ege2027_ads_read_admin ON public.ege2027_ads FOR SELECT
TO authenticated USING (EXISTS (
 SELECT 1 FROM public.ege2027_staff s
 WHERE s.user_id=(SELECT auth.uid()) AND s.role='admin'
));
DROP POLICY IF EXISTS ege2027_ads_insert ON public.ege2027_ads;
CREATE POLICY ege2027_ads_insert ON public.ege2027_ads FOR INSERT TO authenticated
WITH CHECK (
 submitted_by=(SELECT auth.uid()) AND (
  (status='pending' AND EXISTS(
   SELECT 1 FROM public.ege2027_teacher_requests r
   WHERE r.user_id=(SELECT auth.uid()) AND r.status='approved'
  ))
  OR EXISTS(
   SELECT 1 FROM public.ege2027_staff s
   WHERE s.user_id=(SELECT auth.uid()) AND s.role='admin'
  )
 )
);
DROP POLICY IF EXISTS ege2027_ads_update_admin ON public.ege2027_ads;
CREATE POLICY ege2027_ads_update_admin ON public.ege2027_ads FOR UPDATE TO authenticated
USING (EXISTS (
 SELECT 1 FROM public.ege2027_staff s WHERE s.user_id=(SELECT auth.uid()) AND s.role='admin'
))
WITH CHECK (EXISTS (
 SELECT 1 FROM public.ege2027_staff s WHERE s.user_id=(SELECT auth.uid()) AND s.role='admin'
));
CREATE OR REPLACE FUNCTION ege2027_private.audit_ad_changes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NOT NULL THEN
  INSERT INTO public.ege2027_audit_log(actor_id,action,entity_type,entity_id,details)
  VALUES(
   auth.uid(),TG_OP,'ege2027_ads',new.id,
   jsonb_build_object('title',new.title,'status',new.status,'placements',to_jsonb(new.placements))
  );
 END IF;
 RETURN new;
END;
$$;
REVOKE ALL ON FUNCTION ege2027_private.audit_ad_changes() FROM public,anon,authenticated;
DROP TRIGGER IF EXISTS ege2027_ad_audit_trigger ON public.ege2027_ads;
CREATE TRIGGER ege2027_ad_audit_trigger AFTER INSERT OR UPDATE ON public.ege2027_ads
FOR EACH ROW EXECUTE FUNCTION ege2027_private.audit_ad_changes();
