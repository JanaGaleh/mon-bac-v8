CREATE OR REPLACE FUNCTION public.ege_creer_commande(p_dossier uuid, p_moyen text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare d record; c uuid; prix integer; t text;
begin
 if auth.uid() is null then raise exception 'Connexion obligatoire'; end if;
 if p_moyen is null or p_moyen not in ('waafi','dmoney','cacpay','sabapay','cash') then raise exception 'Moyen de paiement invalide'; end if;
 select * into d from public.ege_dossiers where id=p_dossier and eleve_id=auth.uid() for update;
 if not found or d.sujet_confirme_le is null then raise exception 'Dossier non confirme ou non autorise'; end if;
 if not exists(select 1 from public.ege_reservations_catalogue r join public.ege_catalogue_dossiers m on m.id=r.dossier_modele_id where r.dossier_eleve_id=p_dossier and m.statut='valide' and m.controle_sources and m.controle_coherence and exists(select 1 from storage.objects o where o.bucket_id='ege-word-prive' and o.name=m.word_path) and exists(select 1 from storage.objects o where o.bucket_id='ege-apercus-prives' and o.name=m.apercu_path)) then raise exception 'Aucun modele valide reserve et stocke'; end if;
 if p_moyen <> 'cash' and not exists(select 1 from public.ege_comptes_paiement where moyen=p_moyen and actif and nullif(btrim(numero_reception),'') is not null and nullif(btrim(titulaire),'') is not null) then raise exception 'Moyen mobile non encore active'; end if;
 select id into c from public.ege_commandes where dossier_id=p_dossier;
 if c is not null then return c; end if;
 t:=case when d.type_travail='binome' then 'dossier_binome' else 'dossier_individuel' end;
 select montant_djf into prix from public.ege_tarifs where code=t and actif=true;
 if prix is null then raise exception 'Tarif indisponible'; end if;
 insert into public.ege_commandes(dossier_id,acheteur_id,type_travail,prix_convenu_djf,moyen_paiement,statut)
 values(p_dossier,auth.uid(),d.type_travail,prix,p_moyen,'en_attente') returning id into c;
 return c;
end $function$;

-- L'index préexistant ege_reference_paiement_unique conserve l'anti-réutilisation des références mobiles.
-- Reprise d'un dépôt interrompu : lecture réservée aux admins, avant livraison.
create policy ege_admin_personnalise_reprise on storage.objects for select to authenticated using(bucket_id='ege-word-prive' and name=split_part(name,'/',1)||'/dossier-personnalise.docx' and public.ege_admin_depot_autorise(split_part(name,'/',1)));

