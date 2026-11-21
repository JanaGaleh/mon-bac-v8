const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const listeners={},store=new Map(),main={innerHTML:'',scrollTop:0};
let dialog;
const document={
  getElementById:()=>null,head:{append(){}},body:{append(){}},
  addEventListener(type,fn){listeners[type]=fn;},
  createElement(tag){if(tag!=='dialog')return {};return dialog={setAttribute(){},addEventListener(){},showModal(){},close(){},remove(){},contains:()=>true,querySelector:()=>main};}
};
const scope={subject:'Mercatique',level:'Terminale',series:'GFM'};
const window={MASimple:{scopeFor:()=>scope}};
const sandbox={window,document,st:{role:'eleve',user:{id:'test-student'}},localStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)},FormData:class{constructor(target){this.values=target.values;}get(k){return this.values[k];}}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'mercatique-ch1.js'),'utf8'),sandbox);
const mod=window.MAMercaCh1;
assert.equal(mod.lessons.length,5);assert.equal(mod.exercises.length,7);
assert.equal(mod.exercises.filter(q=>q.level===0).length,3);
assert.equal(mod.exercises.filter(q=>q.level===1).length,2);
assert.equal(mod.exercises.filter(q=>q.level===2).length,2);
assert.equal(mod.card({...scope,series:'IAG'},'learn',''),'');
assert.equal(mod.card({...scope,level:'Première'},'learn',''),'');
assert.match(mod.card(scope,'learn','chapitre 1'),/data-mac1-open/);
assert.match(mod.nativeCard(scope),/7 exercices/);
mod.open({dataset:{mac1Open:'home'}},scope);
assert.match(main.innerHTML,/Fiches de cours/);
const act=a=>listeners.click({target:{closest:()=>({hasAttribute:()=>false,dataset:{mac1Act:a}})}});
act('lessons');
assert.equal((main.innerHTML.match(/data-mac1-act="lesson-/g)||[]).length,5);
for(let i=0;i<5;i++){act('lesson-'+i);assert.match(main.innerHTML,/<img src=/);assert.match(main.innerHTML,/À retenir pour le bac/);assert.match(main.innerHTML,/data-ma-document/);act('mark');}
act('exercises');assert.equal((main.innerHTML.match(/data-mac1-act="exercise-/g)||[]).length,7);
act('filter-2');assert.equal((main.innerHTML.match(/data-mac1-act="exercise-/g)||[]).length,2);
act('filter--1');
for(let i=0;i<7;i++){
  act('exercise-'+i);
  assert.match(main.innerHTML,/<img src=/);assert.match(main.innerHTML,/Besoin d’un indice/);
  const ex=mod.exercises[i],values={};
  ex.qs.forEach((q,j)=>values['q'+j]=q.manual?'Justification fondée sur le document':String(q.a));
  listeners.submit({preventDefault(){},target:{matches:()=>true,values}});
  assert.equal((main.innerHTML.match(/mac1-feedback good/g)||[]).length,ex.qs.filter(q=>!q.manual).length);
  assert.equal((main.innerHTML.match(/mac1-feedback bad/g)||[]).length,0);
}
const saved=JSON.parse(store.get('monavenir-merca-ch1-v1:test-student'));
assert.equal(saved.done.length,5);assert.equal(Object.keys(saved.results).length,7);
act('home');assert.match(main.innerHTML,/value="12"/);
act('exercise-3');act('retry');assert.match(main.innerHTML,/Vérifier mes réponses/);
assert.equal(mod.equal('',0),false);assert.equal(mod.equal(' 9 ',9),true);
console.log('PASS — 5 fiches et 7 exercices, illustrations, filtrage, corrections, calculs, suivi, reprise et périmètre Terminale GFM.');
