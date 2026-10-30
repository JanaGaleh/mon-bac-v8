-- Extension du schéma EGE existant, sans modification des tarifs ni validation de documents.
-- Les fonctions SECURITY DEFINER sont des opérations métier atomiques : identité issue
-- de auth.uid(), contrôles en base, search_path vide, aucune entrée SQL dynamique.

do $$ declare t record; begin
 for t in select tablename from pg_tables where schemaname='public' and tablename like 'ege\_%' escape '\' loop
  execute format('revoke all on public.%I from anon, authenticated',t.tablename);
 end loop;
end $$;
grant select on public.ege_themes, public.ege_sous_themes, public.ege_tarifs to anon, authenticated;
create policy ege_themes_public_actifs on public.ege_themes for select to anon using (actif);
create policy ege_sous_themes_public_actifs on public.ege_sous_themes for select to anon using (actif and exists(select 1 from public.ege_themes t where t.id=theme_id and t.actif));
create policy ege_tarifs_public_actifs on public.ege_tarifs for select to anon using (actif);
grant select,insert,update on public.ege_profils to authenticated;
grant select,insert,update on public.ege_dossiers to authenticated;
grant select on public.ege_commandes, public.ege_comptes_paiement, public.ege_contact_admin, public.ege_reservations_catalogue to authenticated;
grant select,insert on public.ege_demandes_correction to authenticated;
grant select on public.ege_sources,public.ege_annexes to authenticated;
create policy ege_reservation_proprietaire on public.ege_reservations_catalogue for select to authenticated using (exists(select 1 from public.ege_dossiers d where d.id=dossier_eleve_id and d.eleve_id=(select auth.uid())));

-- Seules les métadonnées commerciales d'un document validé sont publiques.
grant select(id,sous_theme_id,type_travail,numero,titre,problematique,annee_scolaire,statut,controle_sources,controle_coherence) on public.ege_catalogue_dossiers to anon,authenticated;
create policy ege_catalogue_public_valide on public.ege_catalogue_dossiers for select to anon,authenticated using (statut='valide' and controle_sources and controle_coherence);

-- Corrige une expression régulière suréchappée qui refusait les vrais téléphones.
alter table public.ege_profils drop constraint ege_profils_whatsapp_check;
alter table public.ege_profils add constraint ege_profils_whatsapp_check check (whatsapp ~ '^[+]?[0-9 ]{7,20}$');

drop policy ege_correction_demander_soi on public.ege_demandes_correction;
create policy ege_correction_demander_soi on public.ege_demandes_correction for insert to authenticated with check (
 demandeur_id=(select auth.uid()) and statut='en_attente' and traite_le is null and length(btrim(detail)) between 10 and 4000
 and exists(select 1 from public.ege_commandes c join public.ege_dossiers d on d.id=c.dossier_id
 where c.dossier_id=ege_demandes_correction.dossier_id and d.eleve_id=(select auth.uid()) and c.acheteur_id=(select auth.uid())
 and c.statut='livre' and c.date_livraison is not null and now() between c.date_livraison and c.date_livraison+interval '7 days')
);

create or replace function public.ege_proteger_sujet() returns trigger language plpgsql set search_path='' as $$
begin
 if old.sujet_confirme_le is not null and (new.eleve_id,new.sous_theme_id,new.type_travail,new.binome_nom,new.identite_figee,new.sujet_confirme_le,new.problematique,new.preliminaires)
 is distinct from (old.eleve_id,old.sous_theme_id,old.type_travail,old.binome_nom,old.identite_figee,old.sujet_confirme_le,old.problematique,old.preliminaires)
 then raise exception 'Sujet et beneficiaires definitivement verrouilles'; end if;
 return new;
end $$;

create or replace function public.ege_confirmer_sujet(p_dossier uuid) returns boolean language plpgsql security definer set search_path='' as $$
declare d public.ege_dossiers%rowtype; p public.ege_profils%rowtype;
begin
 if auth.uid() is null then raise exception 'Connexion requise'; end if;
 select * into d from public.ege_dossiers where id=p_dossier and eleve_id=auth.uid() for update;
 if not found then raise exception 'Dossier introuvable'; end if;
 if d.sujet_confirme_le is not null then return true; end if;
 if d.statut<>'brouillon' then raise exception 'Statut incompatible'; end if;
 select * into p from public.ege_profils where utilisateur_id=auth.uid() for update;
 if not found or nullif(btrim(p.nom),'') is null or nullif(btrim(p.prenom),'') is null then raise exception 'Profil EGE incomplet'; end if;
 if p.statut_candidat='libre' then raise exception 'Regles candidats libres a definir avant reservation'; end if;
 if length(btrim(coalesce(p.etablissement,'')))<3 then raise exception 'Etablissement obligatoire'; end if;
 if d.type_travail='binome' and nullif(btrim(d.binome_nom),'') is null then raise exception 'Deuxieme candidat requis'; end if;
 if nullif(btrim(d.problematique),'') is null or cardinality(regexp_split_to_array(btrim(d.problematique),'[[:space:]]+'))>28 then raise exception 'Problematique requise, 28 mots maximum'; end if;
 if not exists(select 1 from public.ege_sous_themes s join public.ege_themes t on t.id=s.theme_id where s.id=d.sous_theme_id and s.actif and t.actif and t.annee_scolaire='2026/2027') then raise exception 'Sujet indisponible'; end if;
 update public.ege_dossiers set sujet_confirme_le=now(),identite_figee=jsonb_build_object('nom',p.nom,'prenom',p.prenom,'statut',p.statut_candidat,'classe',p.classe,'etablissement',p.etablissement,'binome',d.binome_nom) where id=p_dossier;
 return true;
end $$;

create or replace function public.ege_reserver_modele(p_dossier uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare d public.ege_dossiers%rowtype; v uuid; e text; an text;
begin
 if auth.uid() is null then raise exception 'Connexion obligatoire'; end if;
 select * into d from public.ege_dossiers where id=p_dossier and eleve_id=auth.uid() for update;
 if not found or d.sujet_confirme_le is null then raise exception 'Dossier non confirme ou non autorise'; end if;
 if d.identite_figee->>'statut' is distinct from 'scolarise' then raise exception 'Regles candidats libres a definir avant reservation'; end if;
 e:=upper(regexp_replace(btrim(coalesce(d.identite_figee->>'etablissement','')),'[[:space:]]+',' ','g'));
 if length(e)<3 then raise exception 'Etablissement obligatoire'; end if;
 select t.annee_scolaire into an from public.ege_sous_themes s join public.ege_themes t on t.id=s.theme_id where s.id=d.sous_theme_id and s.actif and t.actif;
 if an is null then raise exception 'Sujet indisponible'; end if;
 perform pg_advisory_xact_lock(hashtextextended(e||':'||d.sous_theme_id::text||':'||an,0));
 select dossier_modele_id into v from public.ege_reservations_catalogue where dossier_eleve_id=p_dossier;
 if v is not null then return v; end if;
 select c.id into v from public.ege_catalogue_dossiers c
 where c.sous_theme_id=d.sous_theme_id and c.type_travail=d.type_travail and c.annee_scolaire=an
 and c.statut='valide' and c.controle_sources and c.controle_coherence
 and lower(btrim(c.problematique))=lower(btrim(d.problematique))
 and exists(select 1 from storage.objects o where o.bucket_id='ege-word-prive' and o.name=c.word_path)
 and exists(select 1 from storage.objects o where o.bucket_id='ege-apercus-prives' and o.name=c.apercu_path)
 and not exists(select 1 from public.ege_reservations_catalogue r where r.dossier_modele_id=c.id and r.etablissement_cle=e and r.annee_scolaire=an)
 order by c.numero limit 1 for update of c skip locked;
 if v is null then raise exception 'Aucun dossier valide compatible et disponible pour cet etablissement'; end if;
 insert into public.ege_reservations_catalogue(dossier_modele_id,dossier_eleve_id,etablissement_cle,annee_scolaire) values(v,p_dossier,e,an);
 return v;
end $$;

create or replace function public.ege_preparer_commande(p_modele uuid,p_moyen text,p_binome text default null) returns uuid language plpgsql security definer set search_path='' as $$
declare m public.ege_catalogue_dossiers%rowtype; d uuid;
begin
 if auth.uid() is null then raise exception 'Connexion obligatoire'; end if;
 -- Une même soumission répétée ne crée pas une deuxième commande.
 perform pg_advisory_xact_lock(hashtextextended('ege-achat:'||auth.uid()::text,0));
 select * into m from public.ege_catalogue_dossiers where id=p_modele and statut='valide' and controle_sources and controle_coherence;
 if not found then raise exception 'Modele indisponible'; end if;
 select c.id into d from public.ege_commandes c join public.ege_dossiers x on x.id=c.dossier_id
 where c.acheteur_id=auth.uid() and x.sous_theme_id=m.sous_theme_id and x.type_travail=m.type_travail
 and lower(btrim(x.problematique))=lower(btrim(m.problematique)) and c.statut<>'refuse';
 if d is not null then return d; end if;
 if length(coalesce(p_binome,''))>200 then raise exception 'Identite binome trop longue'; end if;
 insert into public.ege_dossiers(eleve_id,sous_theme_id,type_travail,problematique,binome_nom)
 values(auth.uid(),m.sous_theme_id,m.type_travail,m.problematique,nullif(btrim(p_binome),'')) returning id into d;
 perform public.ege_confirmer_sujet(d);
 perform public.ege_reserver_modele(d);
 return public.ege_creer_commande(d,p_moyen);
end $$;

-- L'ancienne fonction de livraison ne vérifiait ni objet personnalisé ni paiement daté.
create or replace function public.ege_marquer_livree(p_commande uuid) returns boolean language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.ege_est_admin() then raise exception 'Acces administrateur refuse'; end if;
 return public.ege_enregistrer_word_livraison(p_commande,p_commande::text||'/dossier-personnalise.docx');
end $$;

-- Administration : indicateurs réels, aucune identité élève ni fichier rendu public.
create or replace function public.ege_admin_bilan() returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.ege_est_admin() then raise exception 'Acces administrateur refuse'; end if;
 return jsonb_build_object(
 'brouillons',(select count(*) from public.ege_catalogue_dossiers where statut='brouillon'),
 'valides',(select count(*) from public.ege_catalogue_dossiers where statut='valide'),
 'fichiers_word',(select count(*) from storage.objects where bucket_id='ege-word-prive'),
 'modeles_stockes',(select count(*) from public.ege_catalogue_dossiers c where exists(select 1 from storage.objects o where o.bucket_id='ege-word-prive' and o.name=c.word_path)),
 'annexes_a_corriger',(select count(*) from public.ege_annexes_bibliotheque where statut='a_corriger'),
 'revenus_confirmes',(select coalesce(sum(prix_convenu_djf),0) from public.ege_commandes where statut in ('confirme','livre')),
 'corrections',(select coalesce(jsonb_agg(to_jsonb(x)),'[]') from (select id,dossier_id,champ,detail,statut,cree_le from public.ege_demandes_correction order by cree_le desc limit 200) x));
end $$;
revoke all on function public.ege_preparer_commande(uuid,text,text),public.ege_admin_bilan() from public,anon;
grant execute on function public.ege_preparer_commande(uuid,text,text),public.ege_admin_bilan() to authenticated;

-- Storage ne doit pas dépendre de la visibilité des commandes d'autrui par RLS.
create or replace function public.ege_admin_depot_autorise(p_commande text) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and public.ege_est_admin() and exists(select 1 from public.ege_commandes c where c.id::text=p_commande and c.statut='confirme' and c.date_confirmation is not null)
$$;
revoke all on function public.ege_admin_depot_autorise(text) from public,anon;
grant execute on function public.ege_admin_depot_autorise(text) to authenticated;
create policy ege_admin_personnalise_insert on storage.objects for insert to authenticated with check (
 bucket_id='ege-word-prive' and name=split_part(name,'/',1)||'/dossier-personnalise.docx'
 and public.ege_admin_depot_autorise(split_part(name,'/',1))
);

-- Empêche de présenter un document validé sans les deux objets privés réels.
create schema if not exists ege_private;
revoke all on schema ege_private from public,anon,authenticated;
create or replace function ege_private.verifier_publication() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.statut='valide' and (
 not exists(select 1 from storage.objects where bucket_id='ege-word-prive' and name=new.word_path)
 or not exists(select 1 from storage.objects where bucket_id='ege-apercus-prives' and name=new.apercu_path))
 then raise exception 'Objets Word et apercu requis avant publication'; end if;
 return new;
end $$;
revoke all on function ege_private.verifier_publication() from public,anon,authenticated;
create trigger ege_verifier_publication before insert or update on public.ege_catalogue_dossiers for each row execute function ege_private.verifier_publication();
