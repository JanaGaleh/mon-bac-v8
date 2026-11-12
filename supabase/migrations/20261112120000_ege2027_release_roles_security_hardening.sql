-- Release hardening: all EGE privileges are explicit; RLS requires a student's opt-in dossier association.
revoke all on table public.ege2027_group_members,public.ege2027_teacher_groups,public.ege2027_teacher_requests from anon;
revoke truncate,references,trigger on table public.ege2027_dossiers,public.ege2027_group_members,public.ege2027_group_submissions,public.ege2027_reviews,public.ege2027_settings,public.ege2027_staff,public.ege2027_teacher_groups,public.ege2027_teacher_requests,public.ege2027_versions from authenticated;
grant select,insert,delete on public.ege2027_group_members to authenticated;
grant select,insert,update,delete on public.ege2027_teacher_groups to authenticated;
grant select,insert,update on public.ege2027_teacher_requests to authenticated;
grant select,insert,delete on public.ege2027_group_submissions to authenticated;
create index if not exists ege2027_members_group_student_check_idx on public.ege2027_group_members(group_id,student_id);
create index if not exists ege2027_reviews_staff_check_idx on public.ege2027_reviews(staff_id);
create index if not exists ege2027_versions_owner_check_idx on public.ege2027_versions(owner_id);
drop policy if exists ege2027_dossiers_select on public.ege2027_dossiers;
create policy ege2027_dossiers_select on public.ege2027_dossiers for select to authenticated using (
 owner_id=(select auth.uid())
 or exists(select 1 from public.ege2027_staff s where s.user_id=(select auth.uid()) and s.role='admin')
 or exists(
  select 1 from public.ege2027_group_submissions x
  join public.ege2027_teacher_groups g on g.id=x.group_id
  join public.ege2027_group_members m on m.group_id=g.id and m.student_id=x.student_id and m.teacher_id=g.teacher_id
  join public.ege2027_teacher_requests r on r.user_id=g.teacher_id and r.status='approved'
  where x.dossier_id=ege2027_dossiers.id and x.student_id=ege2027_dossiers.owner_id and g.teacher_id=(select auth.uid())
 )
);
drop policy if exists ege2027_reviews_select on public.ege2027_reviews;
create policy ege2027_reviews_select on public.ege2027_reviews for select to authenticated using (
 exists(select 1 from public.ege2027_dossiers d where d.id=ege2027_reviews.dossier_id and d.owner_id=(select auth.uid()))
 or exists(select 1 from public.ege2027_staff s where s.user_id=(select auth.uid()) and s.role='admin')
 or exists(
  select 1 from public.ege2027_group_submissions x
  join public.ege2027_teacher_groups g on g.id=x.group_id
  join public.ege2027_group_members m on m.group_id=g.id and m.student_id=x.student_id and m.teacher_id=g.teacher_id
  join public.ege2027_teacher_requests r on r.user_id=g.teacher_id and r.status='approved'
  where x.dossier_id=ege2027_reviews.dossier_id and g.teacher_id=(select auth.uid())
 )
);
drop policy if exists ege2027_reviews_insert on public.ege2027_reviews;
create policy ege2027_reviews_insert on public.ege2027_reviews for insert to authenticated with check (
 staff_id=(select auth.uid()) and (
  exists(select 1 from public.ege2027_staff s where s.user_id=(select auth.uid()) and s.role='admin')
  or exists(
   select 1 from public.ege2027_group_submissions x
   join public.ege2027_teacher_groups g on g.id=x.group_id
   join public.ege2027_group_members m on m.group_id=g.id and m.student_id=x.student_id and m.teacher_id=g.teacher_id
   join public.ege2027_teacher_requests r on r.user_id=g.teacher_id and r.status='approved'
   where x.dossier_id=ege2027_reviews.dossier_id and g.teacher_id=(select auth.uid())
  )
 )
);