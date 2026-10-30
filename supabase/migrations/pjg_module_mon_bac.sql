
-- Extension isolée Prof. Jana Galeh pour MON BAC (authentification partagée)
create or replace function public.pjg_admin()
returns boolean language sql stable security invoker set search_path = ''
as $$ select exists(select 1 from public.profils p where p.id=(select auth.uid()) and p.role='super_admin') $$;
revoke all on function public.pjg_admin() from public;
grant execute on function public.pjg_admin() to authenticated;

create table if not exists public.pjg_soutien (
  eleve_id uuid primary key references auth.users(id) on delete cascade,
  valide_le timestamptz not null default now()
);
create table if not exists public.pjg_catalogue (
  id uuid primary key default gen_random_uuid(),
  titre text not null check (char_length(titre) between 3 and 180),
  type_contenu text not null check (type_contenu in ('cours','exercice','qcm')),
  matiere text not null default 'Gestion Financière',
  chapitre text not null default 'Chapitre 3',
  partie text not null default 'Partie 2',
  resume text not null default '',
  gratuit boolean not null default false,
  publie boolean not null default false,
  cree_le timestamptz not null default now()
);
create table if not exists public.pjg_details (
  contenu_id uuid primary key references public.pjg_catalogue(id) on delete cascade,
  texte text not null default '',
  questions jsonb not null default '[]'::jsonb check (jsonb_typeof(questions)='array')
);
create table if not exists public.pjg_autorisations (
  eleve_id uuid not null references auth.users(id) on delete cascade,
  contenu_id uuid not null references public.pjg_catalogue(id) on delete cascade,
  expire_le timestamptz,
  accordee_le timestamptz not null default now(),
  primary key (eleve_id, contenu_id)
);
create table if not exists public.pjg_demandes (
  id bigint generated always as identity primary key,
  eleve_id uuid not null references auth.users(id) on delete cascade,
  contenu_id uuid not null references public.pjg_catalogue(id) on delete cascade,
  statut text not null default 'en_attente' check (statut in ('en_attente','acceptee','refusee')),
  date_demande timestamptz not null default now(),
  traite_le timestamptz
);
create unique index if not exists pjg_demandes_une_active on public.pjg_demandes(eleve_id,contenu_id) where statut='en_attente';
create table if not exists public.pjg_resultats (
  id bigint generated always as identity primary key,
  eleve_id uuid not null references auth.users(id) on delete cascade,
  contenu_id uuid not null references public.pjg_catalogue(id) on delete cascade,
  score numeric(8,2) not null check (score >= 0),
  total numeric(8,2) not null check (total > 0 and score <= total),
  source text not null default 'navigateur_indicatif' check(source='navigateur_indicatif'),
  cree_le timestamptz not null default now()
);

alter table public.pjg_soutien enable row level security;
alter table public.pjg_catalogue enable row level security;
alter table public.pjg_details enable row level security;
alter table public.pjg_autorisations enable row level security;
alter table public.pjg_demandes enable row level security;
alter table public.pjg_resultats enable row level security;

create policy pjg_soutien_lecture on public.pjg_soutien for select to authenticated
 using (eleve_id=(select auth.uid()) or (select public.pjg_admin()));
create policy pjg_soutien_admin on public.pjg_soutien for all to authenticated
 using ((select public.pjg_admin())) with check ((select public.pjg_admin()));
create policy pjg_catalogue_lecture on public.pjg_catalogue for select to authenticated
 using (publie or (select public.pjg_admin()));
create policy pjg_catalogue_admin on public.pjg_catalogue for all to authenticated
 using ((select public.pjg_admin())) with check ((select public.pjg_admin()));
create policy pjg_grants_lecture on public.pjg_autorisations for select to authenticated
 using (eleve_id=(select auth.uid()) or (select public.pjg_admin()));
create policy pjg_grants_admin on public.pjg_autorisations for all to authenticated
 using ((select public.pjg_admin())) with check ((select public.pjg_admin()));
create policy pjg_details_lecture on public.pjg_details for select to authenticated
 using ((select public.pjg_admin()) or exists (
  select 1 from public.pjg_catalogue c
  where c.id=contenu_id and c.publie and (
    c.gratuit
    or exists(select 1 from public.pjg_soutien s where s.eleve_id=(select auth.uid()))
    or exists(select 1 from public.pjg_autorisations g where g.eleve_id=(select auth.uid())
      and g.contenu_id=c.id and (g.expire_le is null or g.expire_le>now()))
  )
 ));
create policy pjg_details_admin on public.pjg_details for all to authenticated
 using ((select public.pjg_admin())) with check ((select public.pjg_admin()));
create policy pjg_demandes_lecture on public.pjg_demandes for select to authenticated
 using (eleve_id=(select auth.uid()) or (select public.pjg_admin()));
create policy pjg_demandes_creation on public.pjg_demandes for insert to authenticated
 with check (eleve_id=(select auth.uid()) and statut='en_attente' and traite_le is null);
create policy pjg_demandes_admin on public.pjg_demandes for update to authenticated
 using ((select public.pjg_admin())) with check ((select public.pjg_admin()));
create policy pjg_resultats_lecture on public.pjg_resultats for select to authenticated
 using (eleve_id=(select auth.uid()) or (select public.pjg_admin()));
create policy pjg_resultats_creation on public.pjg_resultats for insert to authenticated
 with check (eleve_id=(select auth.uid()) and source='navigateur_indicatif' and exists (
  select 1 from public.pjg_details d where d.contenu_id=pjg_resultats.contenu_id
 ));

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.pjg_soutien, public.pjg_catalogue, public.pjg_details, public.pjg_autorisations to authenticated;
grant select, insert, update on public.pjg_demandes to authenticated;
grant select, insert on public.pjg_resultats to authenticated;
grant usage, select on sequence public.pjg_demandes_id_seq, public.pjg_resultats_id_seq to authenticated;

insert into public.pjg_catalogue(titre,type_contenu,matiere,chapitre,partie,resume,gratuit,publie)
select 'Dépréciation des titres immobilisés','cours','Gestion Financière','Chapitre 3','Partie 2',
       'Méthode djiboutienne : valeur globale, inventaires N et N+1, dotations et reprises.',true,true
where not exists(select 1 from public.pjg_catalogue where titre='Dépréciation des titres immobilisés' and partie='Partie 2');

insert into public.pjg_details(contenu_id,texte)
select c.id, 'Un titre immobilisé est une immobilisation financière (actions, obligations). La dépréciation est réversible. Valeur globale = nombre de titres × prix d''achat unitaire. Valeur à l''inventaire = nombre de titres × valeur unitaire au 31/12. Dépréciation nécessaire = maximum(0, valeur globale − valeur à l''inventaire). Dotation = hausse de la dépréciation nécessaire ; reprise = baisse de la dépréciation. Exemples du tableau djiboutien : actions : 10 × 14 000 = 140 000 FDJ, inventaire N : 10 × 16 000 = 160 000 (dépréciation 0), N+1 : 10 × 13 000 = 130 000 (dotation 10 000). Obligations : 20 × 11 000 = 220 000 FDJ, N : 20 × 9 000 = 180 000 (dépréciation 40 000), N+1 : 20 × 10 000 = 200 000 (dépréciation 20 000, reprise 20 000). Écritures du modèle : comptes 6866, 297 et 7866.'
from public.pjg_catalogue c
where c.titre='Dépréciation des titres immobilisés' and c.partie='Partie 2'
on conflict (contenu_id) do nothing;
