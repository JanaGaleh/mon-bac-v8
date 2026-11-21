const test=require('node:test');
const assert=require('node:assert/strict');
global.window={};global.document={addEventListener(){}};
require('./live-ch2.js');
const m=window.MAGFCh2;
test('5 fiches pour chaque méthode, 9 exercices équilibrés',()=>{
  assert.equal(m.lessons.length,10);assert.equal(m.questions.length,9);
  assert.deepEqual([0,1].map(g=>m.lessons.filter(l=>l[5]===g).length),[5,5]);
  assert.deepEqual([0,1,2].map(l=>m.questions.filter(q=>q.l===l).map(q=>q.g)),[[0,1,2],[0,1,2],[0,1,2]]);
  assert.equal(m.questions.filter(q=>q.caseFields).length,2);
});
test('correction, variantes et rejets',()=>{
  for(const q of m.questions)for(const v of [0,1,2]){
    const x=m.alternate(q,v),fs=m.specs(x),answers=Object.fromEntries(fs.map(f=>[f.key,String(f.a)]));
    assert.ok(fs.length);assert.ok(m.grade(x,answers).ok);assert.ok(!m.grade(x,{}).ok);
    assert.ok(!m.grade(x,{...answers,[fs[0].key]:'erreur'}).ok);
    if(x.schedule){assert.equal(x.schedule.rows.at(-1).vnc,x.schedule.vr);assert.equal(x.schedule.rows.at(-1).cumul,x.schedule.vo-x.schedule.vr);}
    if(x.caseFields)assert.equal(x.journal.a,x.schedule.rows[0].a);
  }
});
test('calcul économique et filtres de la version actuelle',()=>{
  assert.deepEqual(m.linear(1000000,200000,4,6).map(r=>r.a),[100000,200000,200000,200000,100000]);
  assert.deepEqual(m.plan(700000,100000,[1000,2000,3000]).map(r=>r.a),[100000,200000,300000]);
  assert.ok(m.matches({matiere:'Gestion financière',academic_level:'Terminale',track:'GFM'}));
  assert.ok(!m.matches({matiere:'Gestion financière',academic_level:'Première',track:'GFM'}));
  assert.match(m.simOutput(),/Plan linéaire/);
  assert.match(m.simOutput(),/Plan par UO/);
});
