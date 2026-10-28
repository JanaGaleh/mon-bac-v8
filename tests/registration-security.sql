-- Tests transactionnels de l’inscription et de l’approbation : aucun compte de test conservé.
begin;
select set_config('monbac.test_admin',(select id::text from public.profils where role='super_admin' limit 1),true);
select set_config('monbac.candidate',gen_random_uuid()::text,true);
select set_config('monbac.other',gen_random_uuid()::text,true);
insert into auth.users(id,aud,role,email,email_confirmed_at,raw_app_meta_data,raw_user_meta_data)
values(current_setting('monbac.candidate')::uuid,'authenticated','authenticated','monbac-transaction-'||current_setting('monbac.candidate')||'@example.invalid',now(),'{}','{"nom":"Candidat test","role":"super_admin","type_compte_souhaite":"enseignant"}'),
(current_setting('monbac.other')::uuid,'authenticated','authenticated','monbac-transaction-'||current_setting('monbac.other')||'@example.invalid',null,'{}','{"nom":"Autre candidat"}');
set local role authenticated;
do $test$
declare r jsonb; count_requests integer;
begin
 perform set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('monbac.candidate'),'role','authenticated')::text,true);
 if (select role from public.profils where id=auth.uid())<>'eleve' then raise exception 'TEST_METADATA_ROLE_ESCALATION'; end if;
 if public.demander_role_enseignant('Gestion financière, classes de première et terminale.')<>'DEMANDE_ENREGISTREE' then raise exception 'TEST_CREATE_REQUEST'; end if;
 if public.demander_role_enseignant('Demande répétée, sans doublon.')<>'DEMANDE_DEJA_EN_ATTENTE' then raise exception 'TEST_REQUEST_DUPLICATE'; end if;
 if (public.ma_demande_enseignant()->>'statut')<>'en_attente' then raise exception 'TEST_OWN_REQUEST'; end if;
 if (select role from public.profils where id=auth.uid())<>'eleve' then raise exception 'TEST_PREMATURE_TEACHER_ROLE'; end if;
 begin
  perform public.decider_demande_enseignant(auth.uid(),'approuvee');raise exception 'TEST_SELF_APPROVAL';
 exception when others then if sqlerrm<>'ACCES_ADMIN_REFUSE' then raise; end if; end;
 begin
  perform public.lister_demandes_enseignants_admin();raise exception 'TEST_CANDIDATE_LISTING';
 exception when others then if sqlerrm<>'ACCES_ADMIN_REFUSE' then raise; end if; end;
 begin
  update public.profils set role='enseignant' where id=auth.uid();raise exception 'TEST_DIRECT_ROLE_UPDATE';
 exception when insufficient_privilege then null; end;
 begin
  select count(*) into count_requests from monbac_private.demandes_enseignants;raise exception 'TEST_DIRECT_PRIVATE_READ';
 exception when insufficient_privilege then null; end;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('monbac.other'),'role','authenticated')::text,true);
 if public.ma_demande_enseignant() is not null then raise exception 'TEST_FOREIGN_REQUEST'; end if;
 begin
  perform public.demander_role_enseignant('Une demande avant confirmation email.');raise exception 'TEST_UNCONFIRMED_EMAIL';
 exception when others then if sqlerrm<>'EMAIL_A_CONFIRMER' then raise; end if; end;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('monbac.test_admin'),'role','authenticated')::text,true);
 r:=public.lister_demandes_enseignants_admin();
 if not exists(select 1 from jsonb_array_elements(r) t where t->>'utilisateur_id'=current_setting('monbac.candidate')) then raise exception 'TEST_ADMIN_LIST'; end if;
 if public.decider_demande_enseignant(current_setting('monbac.candidate')::uuid,'approuvee','Vérification de test')<>'DECISION_ENREGISTREE' then raise exception 'TEST_ADMIN_APPROVE'; end if;
 begin
  perform public.decider_demande_enseignant(current_setting('monbac.candidate')::uuid,'refusee');raise exception 'TEST_DUPLICATE_DECISION';
 exception when others then if sqlerrm<>'DEMANDE_DEJA_TRAITEE' then raise; end if; end;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('monbac.candidate'),'role','authenticated')::text,true);
 if (select role from public.profils where id=auth.uid())<>'enseignant' then raise exception 'TEST_FINAL_TEACHER_ROLE'; end if;
 if (public.ma_demande_enseignant()->>'statut')<>'approuvee' then raise exception 'TEST_APPROVAL_STATUS'; end if;
 perform set_config('monbac.registration_tests','PASS: safe auth trigger; pending request; idempotence; no self-approval; no user role update; no private table access; cross-user isolation; email confirmation; admin-only list and approval; duplicate decision denial; teacher role after approval',true);
end;
$test$;
reset role;
do $test$
begin
 if not exists(select 1 from public.journal_admin where action='DECISION_DEMANDE_ENSEIGNANT' and details->>'utilisateur_id'=current_setting('monbac.candidate')) then raise exception 'TEST_AUDIT_LOG'; end if;
 if has_function_privilege('anon','public.demander_role_enseignant(text)','EXECUTE') then raise exception 'TEST_ANON_EXECUTE'; end if;
 if (select count(*) from pg_policies where schemaname='public')<>36 then raise exception 'TEST_EXISTING_POLICIES_CHANGED'; end if;
end;
$test$;
update auth.users set email_confirmed_at=now() where id=current_setting('monbac.other')::uuid;
set local role authenticated;
do $test$
begin
 perform set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('monbac.other'),'role','authenticated')::text,true);
 perform public.demander_role_enseignant('Français, classes de première et terminale.');
 perform set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('monbac.test_admin'),'role','authenticated')::text,true);
 perform public.decider_demande_enseignant(current_setting('monbac.other')::uuid,'refusee','Informations à compléter');
 perform set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('monbac.other'),'role','authenticated')::text,true);
 if (select role from public.profils where id=auth.uid())<>'eleve' then raise exception 'TEST_REJECTION_ROLE'; end if;
 if public.ma_demande_enseignant()->>'motif_decision'<>'Informations à compléter' then raise exception 'TEST_REJECTION_REASON'; end if;
 if public.ma_demande_enseignant()->>'statut'<>'refusee' then raise exception 'TEST_REJECTION_STATUS'; end if;
end;
$test$;
select current_setting('monbac.registration_tests') as registration_tests;
rollback;
