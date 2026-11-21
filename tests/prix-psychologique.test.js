import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {Window} from 'happy-dom';
const js=readFileSync(new URL('../integrations/prix-psychologique/monavenir-prix-psychologique.js',import.meta.url),'utf8');
function load(role='eleve'){
 const window={}, st={role,user:{id:'test-user'}};
 vm.runInNewContext(js,{window,st,document:{addEventListener(){}},localStorage:{getItem(){return null;},setItem(){}}});
 return window.MAPrixPsychologique;
}
test('exactly 6 lessons and 30 questions with four levels',()=>{const m=load();assert.equal(m.lessons.length,6);assert.equal(m.questions.length,30);assert.deepEqual(Array.from([0,1,2,3],i=>m.questions.filter(q=>q.l===i).length),[8,8,7,7]);for(const q of m.questions){assert.ok(q.p.length>0&&q.e.length>0);if(q.o)assert.ok(q.o.includes(q.a));}});
test('both data tables balance and corrected percentages are mathematically valid',()=>{const m=load();for(const d of m.datasets.slice(0,2)){assert.equal(d.a.reduce((a,b)=>a+b),d.n);assert.equal(d.b.reduce((a,b)=>a+b),d.n);const rows=m.calc(d);for(const r of rows)assert.ok(r.accept>=0&&r.accept<=100);assert.equal(rows.reduce((a,b)=>a.accept>b.accept?a:b).price,2000);}assert.deepEqual(Array.from(m.calc(m.datasets[0]),x=>x.accept),[0,35,55,50,32.5,0]);});
test('numeric answers accept decimal comma and spaces, not blank or invalid answers',()=>{const m=load();assert.ok(m.numberEqual('17,5',17.5));assert.ok(m.numberEqual('2 000',2000));assert.ok(m.numberEqual('55 %',55));assert.ok(!m.numberEqual('',0));assert.ok(!m.numberEqual('abc',0));});
test('course and exercises are restricted to the signed-in TGFM learner and Mercatique',()=>{const m=load(),scope={subject:'Mercatique',level:'Terminale',series:'GFM'};assert.ok(m.card(scope,'learn','prix').includes('6 FICHES'));assert.ok(m.nativeCard(scope).includes('30 exercices'));assert.equal(m.card({...scope,series:'S'},'learn',''),'');assert.equal(m.nativeCard({...scope,level:'Première'}),'');assert.equal(m.card(scope,'learn','optique'),'');assert.equal(load('enseignant').nativeCard(scope),'');});
test('student can open lessons, mark progress, answer a question and practice the table',()=>{
 const window=new Window({url:'https://monavenir.janagaleh.com/'}),scope={subject:'Mercatique',level:'Terminale',series:'GFM'},st={role:'eleve',user:{id:'demo-student'}};
 window.MASimple={scopeFor(){return scope;}};
 vm.runInNewContext(js,{window,st,document:window.document,localStorage:window.localStorage,FormData:window.FormData});
 const d=window.document,m=window.MAPrixPsychologique;
 d.body.innerHTML=m.card(scope,'learn','');
 const click=s=>{const b=d.querySelector(s);assert.ok(b,s);b.click();};
 click('[data-mapr-open]');assert.ok(d.querySelector('dialog'));
 click('[data-mapr-act="lessons"]');click('[data-mapr-act="lesson-0"]');click('[data-mapr-act="mark"]');
 assert.ok(d.querySelector('[data-mapr-act="mark"]').textContent.includes('Compris'));
 click('[data-mapr-act="home"]');click('[data-mapr-act="quiz"]');
 const choice=Array.from(d.querySelectorAll('input[type=radio]')).find(x=>x.value==='Prix d’acceptabilité');choice.checked=true;
 d.querySelector('[data-mapr-quiz]').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));
 assert.ok(d.querySelector('.mapr-feedback.good'));
 click('[data-mapr-act="home"]');click('[data-mapr-act="table"]');
 assert.equal(d.querySelectorAll('[data-mapr-grid] input').length,25);click('[data-mapr-act="new-table"]');assert.ok(d.querySelector('[data-mapr-grid]'));
 click('[data-mapr-act="close"]');assert.equal(d.querySelector('dialog'),null);assert.ok(m.card(scope,'learn','').includes('1/6'));
});
