-- Fix circular RLS dependency: submission INSERT -> dossiers SELECT -> submissions SELECT.
-- This helper exposes only a boolean for the current authenticated owner.
create schema if not exists ege2027_private;
create or replace function ege2027_private.is_own_dossier(p_dossier_id uuid)
returns boolean language sql stable security definer set search_path=''
as $f$ select auth.uid() is not null and exists(
 select 1 from public.ege2027_dossiers d
 where d.id=p_dossier_id and d.owner_id=auth.uid()
); $f$;
revoke all on function ege2027_private.is_own_dossier(uuid) from public,anon,authenticated;
grant usage on schema ege2027_private to authenticated;
grant execute on function ege2027_private.is_own_dossier(uuid) to authenticated;
drop policy if exists ege2027_submissions_insert on public.ege2027_group_submissions;
create policy ege2027_submissions_insert
on public.ege2027_group_submissions for insert to authenticated
with check (
 student_id=(select auth.uid())
 and (select ege2027_private.is_own_dossier(dossier_id))
 and exists(
  select 1 from public.ege2027_group_members m
  join public.ege2027_teacher_groups g on g.id=m.group_id and g.teacher_id=m.teacher_id
  join public.ege2027_teacher_requests r on r.user_id=g.teacher_id and r.status='approved'
  where m.group_id=ege2027_group_submissions.group_id and m.student_id=(select auth.uid())
 )
);
