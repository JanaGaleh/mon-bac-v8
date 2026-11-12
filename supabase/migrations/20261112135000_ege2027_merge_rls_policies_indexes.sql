-- Optimisation ciblée de l'espace EGE avant diffusion.
create index if not exists ege2027_members_group_teacher_idx on public.ege2027_group_members(group_id,teacher_id);
create index if not exists ege2027_settings_updated_by_idx on public.ege2027_settings(updated_by);
create index if not exists ege2027_teacher_requests_reviewed_by_idx on public.ege2027_teacher_requests(reviewed_by);
-- Une policy par commande, avec OR explicite, évite les permissions permissives multiples.
drop policy if exists ege2027_members_delete on public.ege2027_group_members;
drop policy if exists ege2027_members_admin_delete on public.ege2027_group_members;
create policy ege2027_members_delete on public.ege2027_group_members for delete to authenticated using(
 student_id=(select auth.uid())
 or (teacher_id=(select auth.uid()) and exists(select 1 from public.ege2027_teacher_requests r where r.user_id=(select auth.uid()) and r.status='approved'))
 or exists(select 1 from public.ege2027_staff s where s.user_id=(select auth.uid()) and s.role='admin')
);
drop policy if exists ege2027_groups_insert on public.ege2027_teacher_groups;
drop policy if exists ege2027_groups_admin_insert on public.ege2027_teacher_groups;
create policy ege2027_groups_insert on public.ege2027_teacher_groups for insert to authenticated with check(
 (teacher_id=(select auth.uid()) and exists(select 1 from public.ege2027_teacher_requests r where r.user_id=(select auth.uid()) and r.status='approved'))
 or (exists(select 1 from public.ege2027_staff s where s.user_id=(select auth.uid()) and s.role='admin')
 and exists(select 1 from public.ege2027_teacher_requests r where r.user_id=teacher_id and r.status='approved'))
);
drop policy if exists ege2027_groups_update on public.ege2027_teacher_groups;
drop policy if exists ege2027_groups_admin_update on public.ege2027_teacher_groups;
create policy ege2027_groups_update on public.ege2027_teacher_groups for update to authenticated
using(
 (teacher_id=(select auth.uid()) and exists(select 1 from public.ege2027_teacher_requests r where r.user_id=(select auth.uid()) and r.status='approved'))
 or exists(select 1 from public.ege2027_staff s where s.user_id=(select auth.uid()) and s.role='admin')
)
with check(
 (teacher_id=(select auth.uid()) and exists(select 1 from public.ege2027_teacher_requests r where r.user_id=(select auth.uid()) and r.status='approved'))
 or exists(select 1 from public.ege2027_staff s where s.user_id=(select auth.uid()) and s.role='admin')
);
