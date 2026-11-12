-- Tracer également la création de groupes par un administrateur.
drop trigger if exists ege2027_log_group_creation on public.ege2027_teacher_groups;
create trigger ege2027_log_group_creation after insert on public.ege2027_teacher_groups
for each row execute function ege2027_private.log_moderation_action();