
-- Les validations d'enseignants doivent aussi satisfaire la FK des avis EGE.
create or replace function ege2027_private.ensure_teacher_staff()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
 if new.status='approved' then
  insert into public.ege2027_staff(user_id,role)
  values(new.user_id,'enseignant')
  on conflict(user_id) do nothing;
 end if;
 return new;
end $$;
revoke execute on function ege2027_private.ensure_teacher_staff() from public,anon,authenticated;
drop trigger if exists ege2027_teacher_approval_staff on public.ege2027_teacher_requests;
create trigger ege2027_teacher_approval_staff after insert or update of status
on public.ege2027_teacher_requests for each row
when (new.status='approved') execute function ege2027_private.ensure_teacher_staff();
insert into public.ege2027_staff(user_id,role)
select r.user_id,'enseignant' from public.ege2027_teacher_requests r where r.status='approved'
on conflict(user_id) do nothing;
-- Le retrait du groupe retire ses partages.
create or replace function ege2027_private.clear_left_group_shares()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
 delete from public.ege2027_group_submissions x where x.group_id=old.group_id and x.student_id=old.student_id;
 return old;
end $$;
revoke execute on function ege2027_private.clear_left_group_shares() from public,anon,authenticated;
drop trigger if exists ege2027_clear_shares_on_leave on public.ege2027_group_members;
create trigger ege2027_clear_shares_on_leave after delete on public.ege2027_group_members
for each row execute function ege2027_private.clear_left_group_shares();
-- Désactiver un code bloque les nouvelles inscriptions, pas les corrections de membres existants.
drop policy if exists ege2027_submissions_select on public.ege2027_group_submissions;
create policy ege2027_submissions_select on public.ege2027_group_submissions for select to authenticated using (
 student_id=(select auth.uid())
 or exists(
  select 1 from public.ege2027_teacher_groups g
  join public.ege2027_group_members m on m.group_id=g.id and m.student_id=ege2027_group_submissions.student_id
  join public.ege2027_teacher_requests r on r.user_id=g.teacher_id and r.status='approved'
  where g.id=ege2027_group_submissions.group_id and g.teacher_id=(select auth.uid())
 )
 or exists(select 1 from public.ege2027_staff s where s.user_id=(select auth.uid()) and s.role='admin')
);
drop policy if exists ege2027_submissions_insert on public.ege2027_group_submissions;
create policy ege2027_submissions_insert on public.ege2027_group_submissions for insert to authenticated with check (
 student_id=(select auth.uid())
 and exists(
  select 1 from public.ege2027_group_members m
  join public.ege2027_teacher_groups g on g.id=m.group_id
  join public.ege2027_teacher_requests r on r.user_id=g.teacher_id and r.status='approved'
  where m.group_id=ege2027_group_submissions.group_id and m.student_id=(select auth.uid())
 )
 and exists(select 1 from public.ege2027_dossiers d where d.id=ege2027_group_submissions.dossier_id and d.owner_id=(select auth.uid()))
);
drop policy if exists ege2027_dossiers_select on public.ege2027_dossiers;
create policy ege2027_dossiers_select on public.ege2027_dossiers for select to authenticated using (
 owner_id=(select auth.uid())
 or exists(select 1 from public.ege2027_staff s where s.user_id=(select auth.uid()) and s.role='admin')
 or exists(
  select 1 from public.ege2027_group_submissions x
  join public.ege2027_teacher_groups g on g.id=x.group_id
  join public.ege2027_group_members m on m.group_id=g.id and m.student_id=x.student_id
  join public.ege2027_teacher_requests r on r.user_id=g.teacher_id and r.status='approved'
  where x.dossier_id=ege2027_dossiers.id
  and x.student_id=ege2027_dossiers.owner_id and g.teacher_id=(select auth.uid())
 )
);
drop policy if exists ege2027_reviews_select on public.ege2027_reviews;
create policy ege2027_reviews_select on public.ege2027_reviews for select to authenticated using (
 exists(select 1 from public.ege2027_dossiers d where d.id=ege2027_reviews.dossier_id and d.owner_id=(select auth.uid()))
 or exists(select 1 from public.ege2027_staff s where s.user_id=(select auth.uid()) and s.role='admin')
 or exists(
  select 1 from public.ege2027_group_submissions x
  join public.ege2027_teacher_groups g on g.id=x.group_id
  join public.ege2027_group_members m on m.group_id=g.id and m.student_id=x.student_id
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
   join public.ege2027_group_members m on m.group_id=g.id and m.student_id=x.student_id
   join public.ege2027_teacher_requests r on r.user_id=g.teacher_id and r.status='approved'
   where x.dossier_id=ege2027_reviews.dossier_id and g.teacher_id=(select auth.uid())
  )
 )
);
