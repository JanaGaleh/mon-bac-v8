-- Évolution du schéma EGE existant. Aucun dossier ni tarif validé par cette migration.
alter table public.ege_demandes_correction add column reponse text;
alter table public.ege_demandes_correction add column traite_par uuid references auth.users(id);
alter table public.ege_lots_fichiers_brouillons add column sha256 text check(sha256 ~ '^[0-9a-f]{64}$');
alter table public.ege_lots_fichiers_brouillons add column taille_octets bigint check(taille_octets between 1 and 20971520);

create table public.ege_versions_word(
 id uuid primary key default gen_random_uuid(),
 commande_id uuid not null references public.ege_commandes(id),
 numero integer not null check(numero between 1 and 9999),
 chemin_fichier text not null unique,
 sha256 text not null check(sha256 ~ '^[0-9a-f]{64}$'),
 taille_octets bigint not null check(taille_octets between 1 and 20971520),
 correction_id uuid references public.ege_demandes_correction(id),
 cree_le timestamptz not null default now(),
 admin_id uuid not null references auth.users(id),
 unique(commande_id,numero), unique(correction_id)
);
create table public.ege_journal_corrections(
 id bigint generated always as identity primary key,
 demande_id uuid not null references public.ege_demandes_correction(id),
 ancienne_valeur text not null, nouvelle_valeur text not null,
 reponse text not null, administrateur_id uuid not null references auth.users(id),
 date_action timestamptz not null default now()
);
alter table public.ege_versions_word enable row level security;
alter table public.ege_journal_corrections enable row level security;
revoke all on public.ege_versions_word,public.ege_journal_corrections from public,anon,authenticated;
grant select(id,commande_id,numero,sha256,taille_octets,correction_id,cree_le) on public.ege_versions_word to authenticated;
grant select(id,demande_id,ancienne_valeur,nouvelle_valeur,reponse,date_action) on public.ege_journal_corrections to authenticated;
create policy ege_versions_proprietaire on public.ege_versions_word for select to authenticated using(exists(select 1 from public.ege_commandes c where c.id=commande_id and c.acheteur_id=(select auth.uid())));
create policy ege_journal_corrections_proprietaire on public.ege_journal_corrections for select to authenticated using(exists(select 1 from public.ege_demandes_correction d where d.id=demande_id and d.demandeur_id=(select auth.uid())));

-- L'utilisateur ne peut forger une réponse administrative à la création.
drop policy ege_correction_demander_soi on public.ege_demandes_correction;
create policy ege_correction_demander_soi on public.ege_demandes_correction for insert to authenticated with check(
 demandeur_id=(select auth.uid()) and statut='en_attente' and traite_le is null and reponse is null and traite_par is null
 and length(btrim(detail)) between 10 and 4000
 and exists(select 1 from public.ege_commandes c where c.dossier_id=ege_demandes_correction.dossier_id
 and c.acheteur_id=(select auth.uid()) and c.statut='livre' and c.date_livraison is not null
 and now() between c.date_livraison and c.date_livraison+interval '7 days')
);

create or replace function public.ege_admin_repondre_correction(p_demande uuid,p_statut text,p_reponse text) returns boolean
language plpgsql security definer set search_path='' as $$
declare d public.ege_demandes_correction%rowtype; msg text:=btrim(coalesce(p_reponse,''));
begin
 if auth.uid() is null or not public.ege_est_admin() then raise exception 'Acces administrateur refuse'; end if;
 if p_statut is null or p_statut not in ('acceptee','refusee') or length(msg) not between 10 and 2000 then raise exception 'Decision ou reponse invalide'; end if;
 select * into d from public.ege_demandes_correction where id=p_demande for update;
 if not found then raise exception 'Demande introuvable'; end if;
 if d.statut=p_statut and d.reponse=msg then return true; end if;
 if d.statut not in ('en_attente','acceptee') then raise exception 'Demande deja cloturee'; end if;
 update public.ege_demandes_correction set statut=p_statut,reponse=msg,traite_par=auth.uid(),traite_le=case when p_statut='refusee' then now() else null end where id=p_demande;
 insert into public.ege_journal_corrections(demande_id,ancienne_valeur,nouvelle_valeur,reponse,administrateur_id) values(p_demande,d.statut,p_statut,msg,auth.uid());
 return true;
end $$;

-- Lecture administrative nominative, uniquement à l'ouverture de la commande.
create or replace function public.ege_admin_commande_detail(p_commande uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare c public.ege_commandes%rowtype;
begin
 if auth.uid() is null or not public.ege_est_admin() then raise exception 'Acces administrateur refuse'; end if;
 select * into c from public.ege_commandes where id=p_commande;
 if not found then raise exception 'Commande introuvable'; end if;
 return jsonb_build_object('commande',to_jsonb(c),'dossier',(select to_jsonb(d) from public.ege_dossiers d where d.id=c.dossier_id),
 'corrections',(select coalesce(jsonb_agg(to_jsonb(x) order by x.cree_le desc),'[]') from public.ege_demandes_correction x where x.dossier_id=c.dossier_id),
 'versions',(select coalesce(jsonb_agg(to_jsonb(x) order by x.numero desc),'[]') from public.ege_versions_word x where x.commande_id=c.id));
end $$;

create or replace function public.ege_admin_preparer_livraison(p_commande uuid,p_correction uuid default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare c public.ege_commandes%rowtype; n integer;
begin
 if auth.uid() is null or not public.ege_est_admin() then raise exception 'Acces administrateur refuse'; end if;
 select * into c from public.ege_commandes where id=p_commande;
 if not found or c.date_confirmation is null or c.statut not in ('confirme','livre') then raise exception 'Paiement non confirme'; end if;
 if p_correction is null and c.statut<>'confirme' then raise exception 'Correction acceptee requise'; end if;
 if p_correction is not null and (c.statut<>'livre' or not exists(select 1 from public.ege_demandes_correction d where d.id=p_correction and d.dossier_id=c.dossier_id and d.statut='acceptee')) then raise exception 'Correction non autorisee'; end if;
 select greatest(coalesce(max(numero),0),case when exists(select 1 from public.ege_livraisons_word where commande_id=c.id) then 1 else 0 end)+1 into n from public.ege_versions_word where commande_id=c.id;
 if n>9999 then raise exception 'Limite de versions atteinte'; end if;
 return jsonb_build_object('chemin',c.id::text||'/versions/'||lpad(n::text,4,'0')||'/dossier-personnalise.docx','numero',n);
end $$;

create or replace function public.ege_admin_finaliser_livraison(p_commande uuid,p_chemin text,p_sha256 text,p_taille bigint,p_correction uuid default null) returns boolean
language plpgsql security definer set search_path='' as $$
declare c public.ege_commandes%rowtype; prep jsonb; v public.ege_versions_word%rowtype; old_state text;
begin
 if auth.uid() is null or not public.ege_est_admin() then raise exception 'Acces administrateur refuse'; end if;
 if p_sha256 is null or p_sha256 !~ '^[0-9a-f]{64}$' or p_taille is null or p_taille not between 1 and 20971520 then raise exception 'Empreinte ou taille invalide'; end if;
 select * into c from public.ege_commandes where id=p_commande for update;
 if not found then raise exception 'Commande introuvable'; end if;
 -- Un accusé perdu peut être repris sans doubler la version ni le journal.
 select * into v from public.ege_versions_word where commande_id=c.id and chemin_fichier=p_chemin;
 if found then
  if v.sha256=p_sha256 and v.taille_octets=p_taille and v.correction_id is not distinct from p_correction then return true; end if;
  raise exception 'Version deja enregistree avec un autre contenu';
 end if;
 if p_correction is not null then perform 1 from public.ege_demandes_correction where id=p_correction for update; end if;
 prep:=public.ege_admin_preparer_livraison(c.id,p_correction);
 if p_chemin is null or p_chemin<>prep->>'chemin' then raise exception 'Chemin de version invalide'; end if;
 if not exists(select 1 from storage.objects where bucket_id='ege-word-prive' and name=p_chemin and (metadata->>'size')::bigint=p_taille) then raise exception 'Fichier absent ou taille differente dans Storage'; end if;
 insert into public.ege_versions_word(commande_id,numero,chemin_fichier,sha256,taille_octets,correction_id,admin_id) values(c.id,(prep->>'numero')::integer,p_chemin,p_sha256,p_taille,p_correction,auth.uid());
 insert into public.ege_livraisons_word(commande_id,chemin_fichier,admin_id) values(c.id,p_chemin,auth.uid())
 on conflict(commande_id) do update set chemin_fichier=excluded.chemin_fichier,admin_id=excluded.admin_id,cree_le=now();
 update public.ege_commandes set statut='livre',date_livraison=coalesce(date_livraison,now()),corrections_jusquau=coalesce(date_livraison,now())+interval '7 days' where id=c.id;
 if p_correction is not null then
  select statut into old_state from public.ege_demandes_correction where id=p_correction;
  update public.ege_demandes_correction set statut='traitee',traite_le=now(),traite_par=auth.uid(),reponse='Le document corrige est disponible dans votre espace.' where id=p_correction;
  insert into public.ege_journal_corrections(demande_id,ancienne_valeur,nouvelle_valeur,reponse,administrateur_id) values(p_correction,old_state,'traitee','Nouvelle version Word livree',auth.uid());
 end if;
 insert into public.ege_journal_paiements(commande_id,administrateur_id,ancienne_valeur,nouvelle_valeur,motif) values(c.id,auth.uid(),c.statut,'livre','Version Word '||(prep->>'numero')||' deposee et controlee');
 return true;
end $$;

create or replace function public.ege_admin_version_depot_autorise(p_path text) returns boolean
language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and public.ege_est_admin()
 and p_path ~ '^[0-9a-f-]{36}/versions/[0-9]{4}/dossier-personnalise[.]docx$'
 and exists(select 1 from public.ege_commandes c where c.id::text=split_part(p_path,'/',1) and c.date_confirmation is not null
 and (c.statut='confirme' or (c.statut='livre' and exists(select 1 from public.ege_demandes_correction d where d.dossier_id=c.dossier_id and d.statut='acceptee')))
 and p_path=c.id::text||'/versions/'||lpad((greatest(coalesce((select max(v.numero) from public.ege_versions_word v where v.commande_id=c.id),0),case when exists(select 1 from public.ege_livraisons_word where commande_id=c.id) then 1 else 0 end)+1)::text,4,'0')||'/dossier-personnalise.docx')
$$;
create policy ege_version_admin_insert on storage.objects for insert to authenticated with check(bucket_id='ege-word-prive' and public.ege_admin_version_depot_autorise(name));
create policy ege_version_admin_lire on storage.objects for select to authenticated using(bucket_id='ege-word-prive' and (select public.ege_est_admin()) and name ~ '^[0-9a-f-]{36}/versions/[0-9]{4}/dossier-personnalise[.]docx$');

-- Import des fichiers source : jamais une validation pédagogique.
create or replace function public.ege_admin_lots_import() returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.ege_est_admin() then raise exception 'Acces administrateur refuse'; end if;
 return (select coalesce(jsonb_agg(to_jsonb(x) order by x.sous_theme_id,x.numero),'[]') from (
 select l.*,exists(select 1 from storage.objects o where o.bucket_id='ege-word-prive' and o.name=l.chemin_stockage) as objet_present
 from public.ege_lots_fichiers_brouillons l where l.annee_scolaire='2026/2027') x);
end $$;
create or replace function public.ege_admin_import_chemin_autorise(p_path text) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and public.ege_est_admin() and p_path ~ '^brouillons/theme1/[0-9a-f]{64}/T1_ST0[1-9]_D(0[1-9]|[1-4][0-9]|50)_(individuel|binome)[.]docx$'
 and exists(select 1 from public.ege_lots_fichiers_brouillons l where l.nom_fichier=split_part(p_path,'/',4) and l.annee_scolaire='2026/2027')
$$;
create policy ege_import_hash_admin_insert on storage.objects for insert to authenticated with check(bucket_id='ege-word-prive' and public.ege_admin_import_chemin_autorise(name));
create policy ege_import_hash_admin_lire on storage.objects for select to authenticated using(bucket_id='ege-word-prive' and public.ege_admin_import_chemin_autorise(name));
create or replace function public.ege_admin_enregistrer_import(p_fichier text,p_sha256 text,p_taille bigint) returns boolean language plpgsql security definer set search_path='' as $$
declare l public.ege_lots_fichiers_brouillons%rowtype; p text;
begin
 if auth.uid() is null or not public.ege_est_admin() then raise exception 'Acces administrateur refuse'; end if;
 if p_sha256 is null or p_sha256 !~ '^[0-9a-f]{64}$' or p_taille is null or p_taille not between 1 and 20971520 then raise exception 'Empreinte ou taille invalide'; end if;
 select * into l from public.ege_lots_fichiers_brouillons where nom_fichier=p_fichier and annee_scolaire='2026/2027' for update;
 if not found then raise exception 'Fichier non attendu dans le lot'; end if;
 p:='brouillons/theme1/'||p_sha256||'/'||p_fichier;
 if not public.ege_admin_import_chemin_autorise(p) then raise exception 'Chemin import invalide'; end if;
 if not exists(select 1 from storage.objects where bucket_id='ege-word-prive' and name=p and (metadata->>'size')::bigint=p_taille) then raise exception 'Objet absent ou taille differente dans Storage'; end if;
 if l.sha256=p_sha256 and l.chemin_stockage=p and l.taille_octets=p_taille then return true; end if;
 if l.sha256 is not null then raise exception 'Un autre fichier est deja associe au lot : revision requise'; end if;
 perform 1 from public.ege_catalogue_dossiers c where c.sous_theme_id=l.sous_theme_id and c.numero=l.numero and c.annee_scolaire=l.annee_scolaire and c.type_travail=l.type_travail and c.statut='brouillon' for update;
 if not found then raise exception 'Modele brouillon compatible requis'; end if;
 update public.ege_lots_fichiers_brouillons set chemin_stockage=p,sha256=p_sha256,taille_octets=p_taille,etat='controle_requis' where sous_theme_id=l.sous_theme_id and numero=l.numero and annee_scolaire=l.annee_scolaire;
 update public.ege_catalogue_dossiers set word_path=p where sous_theme_id=l.sous_theme_id and numero=l.numero and annee_scolaire=l.annee_scolaire;
 return true;
end $$;

-- Des index utiles aux listes privées, recherches de commandes et au suivi.
create index if not exists ege_commandes_acheteur_date on public.ege_commandes(acheteur_id,date_creation desc,id);
create index if not exists ege_dossiers_eleve on public.ege_dossiers(eleve_id);
create index if not exists ege_corrections_demandeur_date on public.ege_demandes_correction(demandeur_id,cree_le desc);
create index if not exists ege_corrections_dossier_statut on public.ege_demandes_correction(dossier_id,statut);
create index if not exists ege_versions_correction on public.ege_versions_word(correction_id);
create index if not exists ege_journal_correction_demande on public.ege_journal_corrections(demande_id,date_action);
create index if not exists ege_lots_nom_annee on public.ege_lots_fichiers_brouillons(nom_fichier,annee_scolaire);

create or replace function public.ege_admin_lister_commandes(p_statut text default null,p_offset integer default 0,p_limite integer default 25) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.ege_est_admin() then raise exception 'Acces administrateur refuse'; end if;
 return jsonb_build_object('total',(select count(*) from public.ege_commandes where p_statut is null or statut=p_statut),
 'items',(select coalesce(jsonb_agg(to_jsonb(x)),'[]') from (select id,dossier_id,statut,moyen_paiement,prix_convenu_djf as prix_djf,date_creation,reference_transaction,type_travail from public.ege_commandes where p_statut is null or statut=p_statut order by date_creation desc,id desc limit least(greatest(coalesce(p_limite,25),1),50) offset greatest(coalesce(p_offset,0),0)) x));
end $$;
create or replace function public.ege_admin_lister_corrections(p_statut text default null,p_offset integer default 0,p_limite integer default 25) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.ege_est_admin() then raise exception 'Acces administrateur refuse'; end if;
 return jsonb_build_object('total',(select count(*) from public.ege_demandes_correction where p_statut is null or statut=p_statut),
 'items',(select coalesce(jsonb_agg(to_jsonb(x)),'[]') from (select d.*,c.id as commande_id from public.ege_demandes_correction d join public.ege_commandes c on c.dossier_id=d.dossier_id where p_statut is null or d.statut=p_statut order by d.cree_le desc,d.id desc limit least(greatest(coalesce(p_limite,25),1),50) offset greatest(coalesce(p_offset,0),0)) x));
end $$;
revoke all on function public.ege_admin_lister_commandes(text,integer,integer),public.ege_admin_lister_corrections(text,integer,integer) from public,anon;
grant execute on function public.ege_admin_lister_commandes(text,integer,integer),public.ege_admin_lister_corrections(text,integer,integer) to authenticated;

-- Les nouvelles opérations privilégiées contrôlent l'appelant ; seul authenticated les appelle.
revoke all on function public.ege_admin_repondre_correction(uuid,text,text),public.ege_admin_commande_detail(uuid),public.ege_admin_preparer_livraison(uuid,uuid),public.ege_admin_finaliser_livraison(uuid,text,text,bigint,uuid),public.ege_admin_version_depot_autorise(text),public.ege_admin_lots_import(),public.ege_admin_import_chemin_autorise(text),public.ege_admin_enregistrer_import(text,text,bigint) from public,anon;
grant execute on function public.ege_admin_repondre_correction(uuid,text,text),public.ege_admin_commande_detail(uuid),public.ege_admin_preparer_livraison(uuid,uuid),public.ege_admin_finaliser_livraison(uuid,text,text,bigint,uuid),public.ege_admin_version_depot_autorise(text),public.ege_admin_lots_import(),public.ege_admin_import_chemin_autorise(text),public.ege_admin_enregistrer_import(text,text,bigint) to authenticated;
