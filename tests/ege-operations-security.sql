-- Tests transactionnels : aucun compte ni document de production créé.
-- Les objets Storage ci-dessous sont UNIQUEMENT des métadonnées temporaires.
-- Ces tests ne certifient ni des octets déposés ni le contenu d'un Word.
begin;
select set_config('ege.a',(select u.id::text from auth.users u where not exists(select 1 from public.administrateurs a where a.utilisateur_id=u.id) order by u.id limit 1),true);
select set_config('ege.b',(select u.id::text from auth.users u where not exists(select 1 from public.administrateurs a where a.utilisateur_id=u.id) order by u.id offset 1 limit 1),true);
select set_config('ege.admin',(select utilisateur_id::text from public.administrateurs limit 1),true);
insert into public.ege_dossiers(id,eleve_id,sous_theme_id,type_travail,problematique) values
('dddddddd-0000-4000-8000-000000000001',current_setting('ege.a')::uuid,1,'individuel','Question de test temporaire'),
('dddddddd-0000-4000-8000-000000000002',current_setting('ege.b')::uuid,1,'individuel','Question de test temporaire');
insert into public.ege_commandes(id,dossier_id,acheteur_id,type_travail,prix_convenu_djf,moyen_paiement,statut,date_confirmation) values
('cccccccc-0000-4000-8000-000000000001','dddddddd-0000-4000-8000-000000000001',current_setting('ege.a')::uuid,'individuel',1000,'cash','confirme',now()),
('cccccccc-0000-4000-8000-000000000002','dddddddd-0000-4000-8000-000000000002',current_setting('ege.b')::uuid,'individuel',1000,'cash','confirme',now());
insert into storage.objects(bucket_id,name,metadata) values
('ege-word-prive','cccccccc-0000-4000-8000-000000000001/versions/0001/dossier-personnalise.docx','{"size":128}'),
('ege-word-prive','cccccccc-0000-4000-8000-000000000001/versions/0002/dossier-personnalise.docx','{"size":256}');
select set_config('request.jwt.claim.sub',current_setting('ege.admin'),true);
set local role authenticated;
do $$ declare prep jsonb; begin
 prep:=public.ege_admin_preparer_livraison('cccccccc-0000-4000-8000-000000000001');
 if prep->>'numero'<>'1' then raise exception 'Mauvaise premiere version'; end if;
 if not public.ege_admin_version_depot_autorise(prep->>'chemin') then raise exception 'Depot admin non autorise'; end if;
 begin
  perform public.ege_admin_finaliser_livraison('cccccccc-0000-4000-8000-000000000001',prep->>'chemin',repeat('a',64),999,null);
  raise exception 'Taille fictive acceptee';
 exception when raise_exception then if sqlerrm not like '%taille differente%' then raise; end if; end;
 perform public.ege_admin_finaliser_livraison('cccccccc-0000-4000-8000-000000000001',prep->>'chemin',repeat('a',64),128,null);
 perform public.ege_admin_finaliser_livraison('cccccccc-0000-4000-8000-000000000001',prep->>'chemin',repeat('a',64),128,null);
end $$;
reset role;
select set_config('ege.date_livraison',(select date_livraison::text from public.ege_commandes where id='cccccccc-0000-4000-8000-000000000001'),true);
select set_config('request.jwt.claim.sub',current_setting('ege.a'),true);
set local role authenticated;
do $$ begin
 begin
  insert into public.ege_demandes_correction(dossier_id,demandeur_id,champ,detail,reponse) values('dddddddd-0000-4000-8000-000000000001',auth.uid(),'annexes','Correction de test','Fausse reponse admin');
  raise exception 'Reponse administrative forgee';
 exception when insufficient_privilege then null; end;
 insert into public.ege_demandes_correction(id,dossier_id,demandeur_id,champ,detail) values('bbbbbbbb-0000-4000-8000-000000000001','dddddddd-0000-4000-8000-000000000001',auth.uid(),'annexes','Correction de test sur annexe');
 begin
  perform public.ege_admin_repondre_correction('bbbbbbbb-0000-4000-8000-000000000001','acceptee','Fausse decision admin');
  raise exception 'Decision non-admin acceptee';
 exception when raise_exception then if sqlerrm not like '%administrateur refuse%' then raise; end if; end;
end $$;
reset role;
select set_config('request.jwt.claim.sub',current_setting('ege.admin'),true);
set local role authenticated;
select public.ege_admin_repondre_correction('bbbbbbbb-0000-4000-8000-000000000001','acceptee','Correction acceptee apres examen du dossier');
select public.ege_admin_repondre_correction('bbbbbbbb-0000-4000-8000-000000000001','acceptee','Correction acceptee apres examen du dossier');
select public.ege_admin_finaliser_livraison('cccccccc-0000-4000-8000-000000000001','cccccccc-0000-4000-8000-000000000001/versions/0002/dossier-personnalise.docx',repeat('b',64),256,'bbbbbbbb-0000-4000-8000-000000000001');
-- Un accusé tardif de v1 ne doit pas rétablir v1 comme livraison courante.
select public.ege_admin_finaliser_livraison('cccccccc-0000-4000-8000-000000000001','cccccccc-0000-4000-8000-000000000001/versions/0001/dossier-personnalise.docx',repeat('a',64),128,null);
reset role;
do $$ begin
 if (select count(*) from public.ege_versions_word where commande_id='cccccccc-0000-4000-8000-000000000001')<>2 then raise exception 'Historique ou idempotence incorrect'; end if;
 if (select count(*) from public.ege_journal_corrections where demande_id='bbbbbbbb-0000-4000-8000-000000000001')<>2 then raise exception 'Journal duplique ou incomplet'; end if;
 if (select statut from public.ege_demandes_correction where id='bbbbbbbb-0000-4000-8000-000000000001')<>'traitee' then raise exception 'Correction non traitee'; end if;
 if (select date_livraison from public.ege_commandes where id='cccccccc-0000-4000-8000-000000000001')<>current_setting('ege.date_livraison')::timestamptz then raise exception 'Delai artificiellement prolonge'; end if;
 if (select chemin_fichier from public.ege_livraisons_word where commande_id='cccccccc-0000-4000-8000-000000000001') not like '%/0002/%' then raise exception 'Livraison courante ecrasee par v1'; end if;
end $$;
select set_config('request.jwt.claim.sub',current_setting('ege.a'),true);
set local role authenticated;
do $$ declare v uuid; begin
 select id into v from public.ege_versions_word where commande_id='cccccccc-0000-4000-8000-000000000001' and numero=1;
 if public.ege_word_version_autorisee('cccccccc-0000-4000-8000-000000000001',v) not like '%/0001/%' then raise exception 'Version historique inaccessible'; end if;
end $$;
reset role;
select set_config('ege.version',(select id::text from public.ege_versions_word where commande_id='cccccccc-0000-4000-8000-000000000001' and numero=1),true);
select set_config('request.jwt.claim.sub',current_setting('ege.b'),true);
set local role authenticated;
do $$ begin
 if (select count(id) from public.ege_versions_word where commande_id='cccccccc-0000-4000-8000-000000000001')<>0 then raise exception 'Versions A visibles par B'; end if;
 begin
  perform public.ege_word_version_autorisee('cccccccc-0000-4000-8000-000000000001',current_setting('ege.version')::uuid);
  raise exception 'Telechargement A autorise pour B';
 exception when raise_exception then if sqlerrm not like '%Version non autorisee%' then raise; end if; end;
 if has_table_privilege(current_user,'public.ege_versions_word','UPDATE') or has_table_privilege(current_user,'public.ege_journal_corrections','DELETE') then raise exception 'Historique modifiable'; end if;
end $$;
reset role;
-- Un import associé reste un brouillon : objet, taille et empreinte requis.
select set_config('ege.fichier',(select nom_fichier from public.ege_lots_fichiers_brouillons where sous_theme_id=1 and numero=1),true);
insert into storage.objects(bucket_id,name,metadata) values('ege-word-prive','brouillons/theme1/'||repeat('c',64)||'/'||current_setting('ege.fichier'),'{"size":512}');
select set_config('request.jwt.claim.sub',current_setting('ege.admin'),true);
set local role authenticated;
select public.ege_admin_enregistrer_import(current_setting('ege.fichier'),repeat('c',64),512);
select public.ege_admin_enregistrer_import(current_setting('ege.fichier'),repeat('c',64),512);
reset role;
do $$ begin
 if (select etat from public.ege_lots_fichiers_brouillons where nom_fichier=current_setting('ege.fichier'))<>'controle_requis' then raise exception 'Etat import incorrect'; end if;
 if (select statut from public.ege_catalogue_dossiers where sous_theme_id=1 and numero=1)<>'brouillon' then raise exception 'Import a valide un brouillon'; end if;
end $$;
select set_config('request.jwt.claim.sub',current_setting('ege.admin'),true);
set local role authenticated;
do $$ begin
 begin
  perform public.ege_admin_enregistrer_moyen('waafi',true,'123','Titulaire de test');
  raise exception 'Numero marchand invalide accepte';
 exception when raise_exception then if sqlerrm not like '%Numero marchand invalide%' then raise; end if; end;
 perform public.ege_admin_enregistrer_moyen('waafi',true,'+253 77 00 00 00','Titulaire de test');
end $$;
reset role;
select set_config('request.jwt.claim.sub',current_setting('ege.a'),true);
set local role authenticated;
do $$ begin
 if not exists(select 1 from public.ege_comptes_paiement where moyen='waafi' and actif and titulaire='Titulaire de test') then raise exception 'Moyen configure non visible'; end if;
 begin
  perform public.ege_admin_enregistrer_moyen('waafi',false,null,null);
  raise exception 'Configuration par non-admin';
 exception when raise_exception then if sqlerrm not like '%administrateur refuse%' then raise; end if; end;
end $$;
reset role;
rollback;
select 'PASS operations EGE : corrections, journal, versions, isolation et import sans validation' as resultat;
