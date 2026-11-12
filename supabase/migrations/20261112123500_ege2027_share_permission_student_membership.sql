-- Student can associate a dossier to a group they belong to.
-- Teacher suspension is enforced on read, not on student sharing.
drop policy if exists ege2027_submissions_insert on public.ege2027_group_submissions;
create policy ege2027_submissions_insert on public.ege2027_group_submissions for insert to authenticated
with check (
 student_id=(select auth.uid())
 and ege2027_private.is_own_dossier(dossier_id)
 and exists (
  select 1 from public.ege2027_group_members m
  join public.ege2027_teacher_groups g on g.id=m.group_id and g.teacher_id=m.teacher_id
  where m.group_id=ege2027_group_submissions.group_id and m.student_id=(select auth.uid())
 )
);