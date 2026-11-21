const assert=require('node:assert/strict');
const test=require('node:test');
global.window={};global.document={addEventListener(){}};
require('./monavenir-gf-ch2.js');
const m=window.MAGFCh2;
test('12 fiches, 60 exercices, répartition validée',()=>{
  assert.equal(m.lessons.length,12);
  assert.equal(m.questions.length,60);
  assert.deepEqual([0,1,2,3].map(l=>m.questions.filter(q=>q.l===l).length),[15,20,15,10]);
  assert.deepEqual([0,1,2,3,4,5,6].map(g=>m.questions.filter(q=>q.g===g).length),[8,8,16,12,8,4,4]);
});
test('linéaire, prorata, résiduelle, arrondis et UO',()=>{
  assert.deepEqual(m.linear(1200000,200000,5).map(r=>r.a),[200000,200000,200000,200000,200000]);
  assert.deepEqual(m.linear(1000000,200000,4,6).map(r=>r.a),[100000,200000,200000,200000,100000]);
  assert.deepEqual(m.plan(1200000,200000,[20000,35000,25000,20000]).map(r=>r.a),[200000,350000,250000,200000]);
  for(const rows of [m.linear(1000,1,3,7),m.plan(199,7,[1,3,2])])assert.equal(rows.at(-1).a+rows.at(-2).cumul,rows.at(-1).cumul);
  assert.throws(()=>m.linear(100,101,3));
  assert.throws(()=>m.plan(100,0,[0,0]));
  assert.throws(()=>m.linear(100,0,2,0));
});
test('corrigés, variantes et saisies invalides',()=>{
  for(const q of m.questions)for(const v of [0,1,2]){
    const x=m.alternate(q,v),fields=m.specs(x),valid=Object.fromEntries(fields.map(f=>[f.key,String(f.a)]));
    assert.ok(fields.length,q.id);assert.ok(m.grade(x,valid).ok,q.id);
    assert.equal(m.grade(x,{}).ok,false,q.id);
    assert.equal(m.grade(x,{...valid,[fields[0].key]:'incorrect'}).ok,false,q.id);
    if(x.schedule){assert.equal(x.schedule.rows.at(-1).vnc,x.schedule.vr,q.id);assert.equal(x.schedule.rows.at(-1).cumul,x.schedule.vo-x.schedule.vr,q.id);}
    if(x.caseFields)assert.equal(x.journal.a,x.schedule.rows[0].a,q.id);
  }
});
test('catalogue ciblé et simulateur',()=>{
  assert.ok(m.matches({subject:'Gestion financière',level:'Terminale',series:'GFM'}));
  assert.ok(!m.matches({subject:'Mercatique',level:'Terminale',series:'GFM'}));
  assert.ok(!m.matches({subject:'Gestion financière',level:'Première',series:'GFM'}));
  assert.match(m.simOutput(),/Plan linéaire/);
  assert.match(m.simOutput(),/Plan par UO/);
});
