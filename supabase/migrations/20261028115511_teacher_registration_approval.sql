-- Inscription enseignant sur demande. Aucun changement des règles des tables existantes.
create schema if not exists monbac_private;
revoke all on schema monbac_private from public, anon;
grant usage on schema monbac_private to authenticated;

create table monbac_private.demandes_enseignants (
 utilisateur_id uuid primary key references public.profils(id),
 motivation text not null check (length(btrim(motivation)) between 10 and 2000),
 statut text not null default 'en_attente' check (statut in ('en_attente','approuvee','refusee')),
 date_demande timestamptz not null default now(),
 traite_par uuid references public.profils(id),
 date_decision timestamptz,
 motif_decision text check (motif_decision is null or length(motif_decision)<=1000),
 constraint decision_coherente check (
  (statut='en_attente' and traite_par is null and date_decision is null)
  or (statut in ('approuvee','refusee') and traite_par is not null and date_decision is not null)
 )
);
alter table monbac_private.demandes_enseignants enable row level security;
revoke all on table monbac_private.demandes_enseignants from public, anon, authenticated;

create function monbac_private.demander_role_enseignant(p_motivation text)
returns text language plpgsql security definer set search_path='' as $$
declare v_role text; v_statut text;
begin
 if auth.uid() is null then raise exception 'AUTHENTIFICATION_REQUISE'; end if;
 select p.role into v_role from public.profils p where p.id=auth.uid();
 if v_role='enseignant' then return 'DEJA_ENSEIGNANT'; end if;
 if v_role is distinct from 'eleve' then raise exception 'DEMANDE_NON_AUTORISEE'; end if;
 if not exists(select 1 from auth.users u where u.id=auth.uid() and u.email_confirmed_at is not null) then raise exception 'EMAIL_A_CONFIRMER'; end if;
 if p_motivation is null or length(btrim(p_motivation)) not between 10 and 2000 then raise exception 'MOTIVATION_INVALIDE'; end if;
 insert into monbac_private.demandes_enseignants(utilisateur_id,motivation)
 values(auth.uid(),btrim(p_motivation)) on conflict(utilisateur_id) do nothing;
 if found then
  insert into public.journal_admin(acteur_id,action,details) values(auth.uid(),'DEMANDE_ENSEIGNANT',jsonb_build_object('utilisateur_id',auth.uid()));
  return 'DEMANDE_ENREGISTREE';
 end if;
 select d.statut into v_statut from monbac_private.demandes_enseignants d where d.utilisateur_id=auth.uid();
 return case v_statut when 'en_attente' then 'DEMANDE_DEJA_EN_ATTENTE' when 'approuvee' then 'DEMANDE_DEJA_APPROUVEE' else 'DEMANDE_DEJA_REFUSEE' end;
end;
$$;

create function monbac_private.ma_demande_enseignant()
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_result jsonb;
begin
 if auth.uid() is null then raise exception 'AUTHENTIFICATION_REQUISE'; end if;
 select jsonb_build_object('statut',d.statut,'motivation',d.motivation,'date_demande',d.date_demande,'date_decision',d.date_decision,'motif_decision',d.motif_decision)
 into v_result from monbac_private.demandes_enseignants d where d.utilisateur_id=auth.uid();
 return v_result;
end;
$$;

create function monbac_private.lister_demandes_enseignants_admin()
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_result jsonb;
begin
 if auth.uid() is null or not public.est_super_admin() then raise exception 'ACCES_ADMIN_REFUSE'; end if;
 select coalesce(jsonb_agg(row_to_json(t)),'[]'::jsonb) into v_result from (
  select d.utilisateur_id,p.nom,u.email::text,d.motivation,d.statut,d.date_demande,d.date_decision,d.motif_decision
  from monbac_private.demandes_enseignants d join public.profils p on p.id=d.utilisateur_id join auth.users u on u.id=d.utilisateur_id
  order by (d.statut='en_attente') desc,d.date_demande desc,d.utilisateur_id limit 200
 ) t;
 return v_result;
end;
$$;

create function monbac_private.decider_demande_enseignant(p_utilisateur_id uuid,p_decision text,p_motif text default null)
returns text language plpgsql security definer set search_path='' as $$
declare v_demande monbac_private.demandes_enseignants%rowtype; v_role text;
begin
 if auth.uid() is null or not public.est_super_admin() then raise exception 'ACCES_ADMIN_REFUSE'; end if;
 if p_decision is null or p_decision not in ('approuvee','refusee') then raise exception 'DECISION_INVALIDE'; end if;
 if p_motif is not null and length(p_motif)>1000 then raise exception 'MOTIF_INVALIDE'; end if;
 select * into v_demande from monbac_private.demandes_enseignants d where d.utilisateur_id=p_utilisateur_id for update;
 if not found then raise exception 'DEMANDE_INTROUVABLE'; end if;
 if v_demande.statut<>'en_attente' then raise exception 'DEMANDE_DEJA_TRAITEE'; end if;
 select p.role into v_role from public.profils p where p.id=p_utilisateur_id for update;
 if v_role is distinct from 'eleve' then raise exception 'PROFIL_INCOMPATIBLE'; end if;
 if p_decision='approuvee' then
  if not exists(select 1 from auth.users u where u.id=p_utilisateur_id and u.email_confirmed_at is not null) then raise exception 'EMAIL_A_CONFIRMER'; end if;
  update public.profils set role='enseignant' where id=p_utilisateur_id;
 end if;
 update monbac_private.demandes_enseignants set statut=p_decision,traite_par=auth.uid(),date_decision=now(),motif_decision=nullif(btrim(p_motif),'') where utilisateur_id=p_utilisateur_id;
 insert into public.journal_admin(acteur_id,action,details) values(auth.uid(),'DECISION_DEMANDE_ENSEIGNANT',jsonb_build_object('utilisateur_id',p_utilisateur_id,'decision',p_decision,'motif',nullif(btrim(p_motif),'')));
 return 'DECISION_ENREGISTREE';
end;
$$;

-- Façades API sans privilège élevé. Les contrôles sont dans le schéma non exposé.
create function public.demander_role_enseignant(p_motivation text) returns text language sql security invoker set search_path='' as $$ select monbac_private.demander_role_enseignant(p_motivation); $$;
create function public.ma_demande_enseignant() returns jsonb language sql stable security invoker set search_path='' as $$ select monbac_private.ma_demande_enseignant(); $$;
create function public.lister_demandes_enseignants_admin() returns jsonb language sql stable security invoker set search_path='' as $$ select monbac_private.lister_demandes_enseignants_admin(); $$;
create function public.decider_demande_enseignant(p_utilisateur_id uuid,p_decision text,p_motif text default null) returns text language sql security invoker set search_path='' as $$ select monbac_private.decider_demande_enseignant(p_utilisateur_id,p_decision,p_motif); $$;

revoke all on function monbac_private.demander_role_enseignant(text), monbac_private.ma_demande_enseignant(), monbac_private.lister_demandes_enseignants_admin(), monbac_private.decider_demande_enseignant(uuid,text,text) from public, anon, authenticated;
revoke all on function public.demander_role_enseignant(text), public.ma_demande_enseignant(), public.lister_demandes_enseignants_admin(), public.decider_demande_enseignant(uuid,text,text) from public, anon, authenticated;
grant execute on function monbac_private.demander_role_enseignant(text), monbac_private.ma_demande_enseignant(), monbac_private.lister_demandes_enseignants_admin(), monbac_private.decider_demande_enseignant(uuid,text,text) to authenticated;
grant execute on function public.demander_role_enseignant(text), public.ma_demande_enseignant(), public.lister_demandes_enseignants_admin(), public.decider_demande_enseignant(uuid,text,text) to authenticated;
