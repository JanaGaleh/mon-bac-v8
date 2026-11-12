-- Administration des groupes et audit des opérations, sans suppression de dossiers.
create table if not exists public.ege2027_audit_log(
 id uuid primary key default gen_random_uuid(),
 actor_id uuid not null,
 action text not null,
 entity_type text not null,
 entity_id uuid,
 details jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
create index if not exists ege2027_audit_created_idx on public.ege2027_audit_log(created_at desc);
alter table public.ege2027_audit_log enable row level security;
revoke all on public.ege2027_audit_log from anon,authenticated;
grant select on public.ege2027_audit_log to authenticated;
drop policy if exists ege2027_audit_admin_only on public.ege2027_audit_log;
create policy ege2027_audit_admin_only on public.ege2027_audit_log for select to authenticated using(
 exists(select 1 from public.ege2027_staff s where s.user_id=(select auth.uid()) and s.role='admin')
);
drop policy if exists ege2027_groups_admin_update on public.ege2027_teacher_groups;
create policy ege2027_groups_admin_update on public.ege2027_teacher_groups for update to authenticated
using(exists(select 1 from public.ege2027_staff s where s.user_id=(select auth.uid()) and s.role='admin'))
with check(exists(select 1 from public.ege2027_staff s where s.user_id=(select auth.uid()) and s.role='admin'));
drop policy if exists ege2027_groups_admin_insert on public.ege2027_teacher_groups;
create policy ege2027_groups_admin_insert on public.ege2027_teacher_groups for insert to authenticated
with check(
 exists(select 1 from public.ege2027_staff s where s.user_id=(select auth.uid()) and s.role='admin')
 and exists(select 1 from public.ege2027_teacher_requests r where r.user_id=teacher_id and r.status='approved')
);
drop policy if exists ege2027_members_admin_delete on public.ege2027_group_members;
create policy ege2027_members_admin_delete on public.ege2027_group_members for delete to authenticated
using(exists(select 1 from public.ege2027_staff s where s.user_id=(select auth.uid()) and s.role='admin'));
create or replace function ege2027_private.log_moderation_action()
returns trigger language plpgsql security definer set search_path='' as $$
declare rec_id uuid; details jsonb;
begin
 if auth.uid() is null then return coalesce(new,old); end if;
 if tg_table_name='ege2027_teacher_requests' then
  if tg_op='UPDATE' and old.status is not distinct from new.status then return new; end if;
  rec_id:=new.user_id;
  details:=jsonb_build_object('from',old.status,'to',new.status);
 elsif tg_table_name='ege2027_teacher_groups' then
  if tg_op='UPDATE' and (old.name,old.school,old.active) is not distinct from (new.name,new.school,new.active) then return new; end if;
  rec_id:=new.id;
  details:=jsonb_build_object('name',new.name,'active',new.active,'school',new.school);
 elsif tg_table_name='ege2027_group_members' then
  rec_id:=old.group_id;
  details:=jsonb_build_object('student_id',old.student_id::text,'group_id',old.group_id::text);
 else
  return coalesce(new,old);
 end if;
 insert into public.ege2027_audit_log(actor_id,action,entity_type,entity_id,details)
 values(auth.uid(),tg_op,tg_table_name,rec_id,details);
 return coalesce(new,old);
end;
$$;
revoke execute on function ege2027_private.log_moderation_action() from public,anon,authenticated;
drop trigger if exists ege2027_log_teacher_decision on public.ege2027_teacher_requests;
create trigger ege2027_log_teacher_decision after update of status on public.ege2027_teacher_requests
for each row execute function ege2027_private.log_moderation_action();
drop trigger if exists ege2027_log_group_changes on public.ege2027_teacher_groups;
create trigger ege2027_log_group_changes after update of name,school,active on public.ege2027_teacher_groups
for each row execute function ege2027_private.log_moderation_action();
drop trigger if exists ege2027_log_member_departure on public.ege2027_group_members;
create trigger ege2027_log_member_departure after delete on public.ege2027_group_members
for each row execute function ege2027_private.log_moderation_action();
