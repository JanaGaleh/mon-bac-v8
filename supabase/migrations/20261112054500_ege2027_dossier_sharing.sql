
-- Complète les tables enseignants et groupes EGE 2027 déjà présentes dans MonBac.
-- Un partage volontaire par dossier évite tout accès transversal entre groupes.
create table if not exists public.ege2027_group_submissions (
 id uuid primary key default gen_random_uuid(),
 group_id uuid not null references public.ege2027_teacher_groups(id) on delete cascade,
 dossier_id uuid not null references public.ege2027_dossiers(id) on delete cascade,
 student_id uuid not null references auth.users(id) on delete cascade,
 submitted_at timestamptz not null default now(),
 unique (group_id,dossier_id)
);
create index if not exists ege2027_group_submissions_student_idx on public.ege2027_group_submissions(student_id);
create index if not exists ege2027_group_submissions_dossier_idx on public.ege2027_group_submissions(dossier_id);
create index if not exists ege2027_group_submissions_group_idx on public.ege2027_group_submissions(group_id);
alter table public.ege2027_group_submissions enable row level security;
revoke all on public.ege2027_group_submissions from anon;
grant select,insert,delete on public.ege2027_group_submissions to authenticated;
drop policy if exists ege2027_submissions_select on public.ege2027_group_submissions;
create policy ege2027_submissions_select on public.ege2027_group_submissions for select to authenticated
using (
 student_id=(select auth.uid())
 or exists(
  select 1 from public.ege2027_teacher_groups g
  join public.ege2027_group_members m on m.group_id=g.id and m.student_id=ege2027_group_submissions.student_id
  join public.ege2027_teacher_requests r on r.user_id=g.teacher_id and r.status='approved'
  where g.id=ege2027_group_submissions.group_id and g.teacher_id=(select auth.uid()) and g.active
 )
 or exists(select 1 from public.ege2027_staff s where s.user_id=(select auth.uid()) and s.role='admin')
);
drop policy if exists ege2027_submissions_insert on public.ege2027_group_submissions;
create policy ege2027_submissions_insert on public.ege2027_group_submissions for insert to authenticated
with check (
 student_id=(select auth.uid())
 and exists(
  select 1 from public.ege2027_group_members m
  join public.ege2027_teacher_groups g on g.id=m.group_id
  join public.ege2027_teacher_requests r on r.user_id=g.teacher_id and r.status='approved'
  where m.group_id=ege2027_group_submissions.group_id and m.student_id=(select auth.uid()) and g.active
 )
 and exists(select 1 from public.ege2027_dossiers d where d.id=ege2027_group_submissions.dossier_id and d.owner_id=(select auth.uid()))
);
drop policy if exists ege2027_submissions_delete on public.ege2027_group_submissions;
create policy ege2027_submissions_delete on public.ege2027_group_submissions for delete to authenticated using
(student_id=(select auth.uid()));
-- Le groupe peut exister sans donner à son enseignant le droit de lire tous les dossiers.
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
    and x.student_id=ege2027_dossiers.owner_id and g.teacher_id=(select auth.uid()) and g.active
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
  where x.dossier_id=ege2027_reviews.dossier_id and g.teacher_id=(select auth.uid()) and g.active
 )
);
drop policy if exists ege2027_reviews_insert on public.ege2027_reviews;
create policy ege2027_reviews_insert on public.ege2027_reviews for insert to authenticated with check (
 staff_id=(select auth.uid())
 and (
  exists(select 1 from public.ege2027_staff s where s.user_id=(select auth.uid()) and s.role='admin')
  or exists(
   select 1 from public.ege2027_group_submissions x
   join public.ege2027_teacher_groups g on g.id=x.group_id
   join public.ege2027_group_members m on m.group_id=g.id and m.student_id=x.student_id
   join public.ege2027_teacher_requests r on r.user_id=g.teacher_id and r.status='approved'
   where x.dossier_id=ege2027_reviews.dossier_id and g.teacher_id=(select auth.uid()) and g.active
  )
 )
);
-- Les comptes enseignants révoqués ne voient plus les listes des groupes.
drop policy if exists ege2027_members_select on public.ege2027_group_members;
create policy ege2027_members_select on public.ege2027_group_members for select to authenticated using (
 student_id=(select auth.uid())
 or (
  teacher_id=(select auth.uid()) and exists(
   select 1 from public.ege2027_teacher_requests r where r.user_id=(select auth.uid()) and r.status='approved'
  )
 )
 or exists(select 1 from public.ege2027_staff s where s.user_id=(select auth.uid()) and s.role='admin')
);
