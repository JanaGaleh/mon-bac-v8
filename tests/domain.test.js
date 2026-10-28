import test from 'node:test';
import assert from 'node:assert/strict';
import {escapeHtml,positiveId,groupQuestions,summary,friendlyError} from '../js/domain.js';
test('les contenus HTML ne deviennent jamais du code',()=>{assert.equal(escapeHtml('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');assert.equal(escapeHtml(null),'');});
test('les identifiants RPC rejettent les entrées ambiguës',()=>{for(const value of ['','0','-1','1e2','1.5','1;drop',Number.MAX_SAFE_INTEGER+1])assert.throws(()=>positiveId(value));assert.equal(positiveId('42'),42);});
test('les questions QCM et texte restent distinctes',()=>{const rows=[{question_id:1,choix_id:7,texte_choix:'A'},{question_id:1,choix_id:8,texte_choix:'B'},{question_id:2,choix_id:null,type_question:'texte'}];const questions=groupQuestions(rows);assert.equal(questions.length,2);assert.deepEqual(questions[0].choices.map(x=>x.id),[7,8]);assert.equal(questions[1].choices.length,0);});
test('la moyenne ignore les tentatives non notées et en cours',()=>{assert.deepEqual(summary([]),{done:0,average:null});assert.deepEqual(summary([{statut:'terminee',note:1,note_max:2},{statut:'terminee',note:0,note_max:0},{statut:'en_cours',note:0,note_max:100}]),{done:2,average:50});});
test('les erreurs métiers sont expliquées sans détails serveur',()=>{assert.match(friendlyError({message:'ACCES_COURS_REFUSE'}),/Premium/);assert.doesNotMatch(friendlyError({message:'postgres secret internals'}),/secret/);});
