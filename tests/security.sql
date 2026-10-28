-- Test d’intégration transactionnel : aucune donnée de test conservée.
-- Exécution via une connexion de gestion. Aucun mot de passe ni clé privée requis dans ce fichier.
BEGIN;
SELECT set_config('monbac.student', (SELECT p.id::text FROM public.profils p JOIN public.inscriptions i ON i.eleve_id=p.id WHERE p.role='eleve' LIMIT 1),true);
SELECT set_config('monbac.teacher', (SELECT enseignant_id::text FROM public.inscriptions WHERE eleve_id=current_setting('monbac.student')::uuid LIMIT 1),true);
SELECT set_config('monbac.other_student', (SELECT id::text FROM public.profils WHERE role='eleve' AND id<>current_setting('monbac.student')::uuid LIMIT 1),true);
SELECT set_config('monbac.class', (SELECT id::text FROM public.classes LIMIT 1),true);
SELECT set_config('monbac.subject', (SELECT id::text FROM public.matieres LIMIT 1),true);
SET LOCAL ROLE authenticated;
DO $test$
DECLARE course_id bigint; quiz_id bigint; question_id bigint; choice_id bigint; attempt_id bigint; result record; total integer;
BEGIN
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('monbac.teacher'),'role','authenticated')::text,true);
 INSERT INTO public.cours(enseignant_id,matiere_id,classe_id,titre,contenu,est_premium) VALUES(auth.uid(),current_setting('monbac.subject')::bigint,current_setting('monbac.class')::bigint,'TEST TRANSACTIONNEL MON BAC','Contenu temporaire',false) RETURNING id INTO course_id;
 INSERT INTO public.quiz(enseignant_id,cours_id,titre) VALUES(auth.uid(),course_id,'TEST TRANSACTIONNEL QUIZ') RETURNING id INTO quiz_id;
 INSERT INTO public.questions_quiz(quiz_id,enonce,type_question,points,ordre) VALUES(quiz_id,'Deux plus deux ?', 'qcm',2,1) RETURNING id INTO question_id;
 INSERT INTO public.choix_questions(question_id,texte,est_correct,explication,ordre) VALUES(question_id,'4',true,'2 + 2 = 4',1) RETURNING id INTO choice_id;
 INSERT INTO public.choix_questions(question_id,texte,est_correct,ordre) VALUES(question_id,'5',false,2);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('monbac.student'),'role','authenticated')::text,true);
 IF (SELECT count(*) FROM public.profils WHERE id<>auth.uid())<>0 THEN RAISE EXCEPTION 'TEST_PROFILE_ISOLATION'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.cours WHERE id=course_id) THEN RAISE EXCEPTION 'TEST_FREE_COURSE'; END IF;
 IF EXISTS(SELECT 1 FROM public.questions_quiz WHERE id=question_id) THEN RAISE EXCEPTION 'TEST_ANSWER_LEAK'; END IF;
 IF public.decider_paiement(-1,'confirme')<>'ACCES_REFUSE' THEN RAISE EXCEPTION 'TEST_ADMIN_ESCALATION'; END IF;
 attempt_id:=public.demarrer_quiz(quiz_id);
 IF public.demarrer_quiz(quiz_id)<>attempt_id THEN RAISE EXCEPTION 'TEST_RESUME_DUPLICATE'; END IF;
 SELECT count(*) INTO total FROM public.consulter_questions_quiz(attempt_id);
 IF total<>2 THEN RAISE EXCEPTION 'TEST_QUESTION_OPTIONS'; END IF;
 BEGIN
  PERFORM public.consulter_correction_quiz(attempt_id);
  RAISE EXCEPTION 'TEST_PREMATURE_CORRECTION';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'CORRECTION_NON_AUTORISEE' THEN RAISE; END IF; END;
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('monbac.other_student'),'role','authenticated')::text,true);
 BEGIN
  PERFORM public.consulter_questions_quiz(attempt_id);
  RAISE EXCEPTION 'TEST_FOREIGN_QUESTIONS';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'ACCES_QUESTIONS_NON_AUTORISE' THEN RAISE; END IF; END;
 BEGIN
  PERFORM public.enregistrer_reponse_qcm(attempt_id,question_id,choice_id);
  RAISE EXCEPTION 'TEST_FOREIGN_ANSWER';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'TENTATIVE_NON_AUTORISEE' THEN RAISE; END IF; END;
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('monbac.student'),'role','authenticated')::text,true);
 PERFORM public.enregistrer_reponse_qcm(attempt_id,question_id,choice_id);
 SELECT * INTO result FROM public.terminer_quiz(attempt_id);
 IF result.note<>2 OR result.note_max<>2 THEN RAISE EXCEPTION 'TEST_SERVER_SCORE'; END IF;
 SELECT * INTO result FROM public.consulter_correction_quiz(attempt_id);
 IF result.bonne_reponse<>'4' OR result.points_obtenus<>2 THEN RAISE EXCEPTION 'TEST_CORRECTION'; END IF;
 BEGIN
  PERFORM public.enregistrer_reponse_qcm(attempt_id,question_id,choice_id);
  RAISE EXCEPTION 'TEST_FINISHED_LOCK';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'TENTATIVE_DEJA_TERMINEE' THEN RAISE; END IF; END;
 PERFORM set_config('monbac.tests','PASS: free course, profile isolation, answer secrecy, admin denial, quiz resume, questions, correction gating, cross-account denial, server scoring, correction, finished lock',true);
END;
$test$;
SELECT current_setting('monbac.tests') AS test_result;
ROLLBACK;
