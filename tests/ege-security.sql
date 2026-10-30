-- Test transactionnel sur le schéma EGE existant. Aucun compte créé, aucune donnée conservée.
-- Les UUID de test ne sont jamais des chemins de fichiers publiés. Ne pas retirer ROLLBACK.
begin;
select set_config('ege.test_a',(select id::text from auth.users order by id limit 1),true);
select set_config('ege.test_b',(select id::text from auth.users order by id limit 1 offset 1),true);
do $$ begin
 if current_setting('ege.test_a')='' or current_setting('ege.test_b')='' then raise exception 'Deux comptes existants requis'; end if;
end $$;
insert into public.ege_profils(utilisateur_id,statut_candidat,nom,prenom,whatsapp,etablissement,classe)
values(current_setting('ege.test_a')::uuid,'scolarise','Test','EGE','+253 77 00 00 00','Lycée de test','Terminale GFM')
on conflict(utilisateur_id) do update set whatsapp=excluded.whatsapp;
insert into public.ege_dossiers(id,eleve_id,sous_theme_id,type_travail,problematique) values
('eeeeeeee-0000-4000-8000-000000000001',current_setting('ege.test_a')::uuid,1,'individuel','Comment fidéliser les clients ?'),
('eeeeeeee-0000-4000-8000-000000000002',current_setting('ege.test_a')::uuid,1,'individuel','Comment analyser la rentabilité ?'),
('eeeeeeee-0000-4000-8000-000000000003',current_setting('ege.test_b')::uuid,1,'individuel','Comment fidéliser les clients ?');
insert into public.ege_commandes(dossier_id,acheteur_id,type_travail,prix_convenu_djf,moyen_paiement,statut,date_confirmation,date_livraison) values
('eeeeeeee-0000-4000-8000-000000000001',current_setting('ege.test_a')::uuid,'individuel',1000,'cash','livre',now(),now());

set local role anon;
do $$ begin
 if (select count(*) from public.ege_themes where actif and annee_scolaire='2026/2027')<>7 then raise exception 'Catalogue thèmes public'; end if;
 if (select count(*) from public.ege_sous_themes where actif)<>67 then raise exception 'Catalogue sous-thèmes public'; end if;
 if has_column_privilege(current_user,'public.ege_catalogue_dossiers','word_path','SELECT') then raise exception 'Chemin privé exposé'; end if;
 if has_table_privilege(current_user,'public.ege_profils','TRUNCATE') then raise exception 'Truncate anonyme autorisé'; end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub',current_setting('ege.test_a'),true);
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('ege.test_a'),'role','authenticated')::text,true);
set local role authenticated;
do $$ declare n integer; begin
 select count(*) into n from public.ege_dossiers where id='eeeeeeee-0000-4000-8000-000000000003';
 if n<>0 then raise exception 'Dossier B visible par A'; end if;
 if has_table_privilege(current_user,'public.ege_dossiers','TRUNCATE') then raise exception 'TRUNCATE contourne RLS'; end if;
 -- Reproduit précisément la faille : une livraison de A ne permet pas une
 -- correction sur un autre dossier de A, ni sur celui de B.
 begin
  insert into public.ege_demandes_correction(dossier_id,demandeur_id,champ,detail) values('eeeeeeee-0000-4000-8000-000000000002',auth.uid(),'annexes','Demande de test interdite');
  raise exception 'Correction sur dossier non livré acceptée';
 exception when insufficient_privilege then null; end;
 begin
  insert into public.ege_demandes_correction(dossier_id,demandeur_id,champ,detail) values('eeeeeeee-0000-4000-8000-000000000003',auth.uid(),'annexes','Demande de test interdite');
  raise exception 'Correction sur dossier B acceptée';
 exception when insufficient_privilege then null; end;
 insert into public.ege_demandes_correction(dossier_id,demandeur_id,champ,detail) values('eeeeeeee-0000-4000-8000-000000000001',auth.uid(),'annexes','Demande de test autorisée');
 begin
  perform public.ege_word_autorise((select id from public.ege_commandes where dossier_id='eeeeeeee-0000-4000-8000-000000000001'));
  raise exception 'Téléchargement sans livraison Word accepté';
 exception when raise_exception then if sqlerrm='Téléchargement sans livraison Word accepté' then raise; end if; end;
end $$;
reset role;
-- Contrôle des 28 mots réel : l'ancienne expression ne découpait pas les espaces.
update public.ege_dossiers set problematique=repeat('mot ',29) where id='eeeeeeee-0000-4000-8000-000000000002';
set local role authenticated;
do $$ begin
 begin
  perform public.ege_confirmer_sujet('eeeeeeee-0000-4000-8000-000000000002');
  raise exception 'Problematique trop longue acceptee';
 exception when raise_exception then if sqlerrm not like '%28 mots maximum%' then raise; end if; end;
end $$;
reset role;
update public.ege_dossiers set sujet_confirme_le=now(),identite_figee='{}'::jsonb where id='eeeeeeee-0000-4000-8000-000000000002';
do $$ begin
 begin
  update public.ege_dossiers set problematique='Modification interdite' where id='eeeeeeee-0000-4000-8000-000000000002';
  raise exception 'Sujet confirmé modifiable';
 exception when raise_exception then if sqlerrm not like '%definitivement verrouilles%' then raise; end if; end;
 begin
  insert into public.ege_catalogue_dossiers(sous_theme_id,type_travail,numero,titre,problematique,statut,controle_sources,controle_coherence,word_path,apercu_path,annee_scolaire)
  values(1,'individuel',100,'Test temporaire','Question de test','valide',true,true,'absent.docx','absent.pdf','TEST-ROLLBACK');
  raise exception 'Publication sans objet acceptée';
 exception when raise_exception then if sqlerrm not like '%Objets Word et apercu requis%' then raise; end if; end;
end $$;
-- Disponibilité et unicité : seuls des objets de métadonnées temporaires sont
-- utilisés ici. Ce test ne certifie pas le contenu d'un DOCX ni le transfert Storage.
insert into public.ege_profils(utilisateur_id,statut_candidat,nom,prenom,whatsapp,etablissement,classe)
values(current_setting('ege.test_b')::uuid,'scolarise','Test','Second','+253 77 00 00 01','  lycée   de test  ','Terminale GFM')
on conflict(utilisateur_id) do update set etablissement=excluded.etablissement;
insert into storage.objects(bucket_id,name) values('ege-word-prive','test-rollback-modele.docx'),('ege-apercus-prives','test-rollback-apercu.pdf');
update public.ege_catalogue_dossiers set statut='valide',controle_sources=true,controle_coherence=true,problematique='Comment comparer les coûts ?',word_path='test-rollback-modele.docx',apercu_path='test-rollback-apercu.pdf'
where sous_theme_id=1 and numero=1 and annee_scolaire='2026/2027';
select set_config('ege.test_modele',(select id::text from public.ege_catalogue_dossiers where sous_theme_id=1 and numero=1 and annee_scolaire='2026/2027'),true);
set local role authenticated;
do $$ declare c uuid; c2 uuid; prix integer; begin
 c:=public.ege_preparer_commande(current_setting('ege.test_modele')::uuid,'cash',null);
 c2:=public.ege_preparer_commande(current_setting('ege.test_modele')::uuid,'cash',null);
 if c<>c2 then raise exception 'Commande répétée non idempotente'; end if;
 select prix_convenu_djf into prix from public.ege_commandes where id=c;
 if prix<>1000 then raise exception 'Prix individuel incorrect'; end if;
 begin
  perform public.ege_decider_paiement(c,'confirme',null);
  if not public.ege_est_admin() then raise exception 'Paiement accepté par non-admin'; end if;
 exception when raise_exception then if sqlerrm not like '%administrateur refuse%' then raise; end if; end;
end $$;
reset role;
select set_config('request.jwt.claim.sub',current_setting('ege.test_b'),true);
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('ege.test_b'),'role','authenticated')::text,true);
set local role authenticated;
do $$ begin
 begin
  perform public.ege_preparer_commande(current_setting('ege.test_modele')::uuid,'cash',null);
  raise exception 'Doublon même établissement accepté';
 exception when raise_exception then if sqlerrm not like '%Aucun dossier valide%' then raise; end if; end;
 if exists(select 1 from public.ege_dossiers where eleve_id=auth.uid() and problematique='Comment comparer les coûts ?') then raise exception 'Échec non atomique : dossier résiduel'; end if;
end $$;
reset role;
rollback;
select 'PASS EGE : catalogue public, isolation, corrections, verrouillage, publication et droits' as resultat;
