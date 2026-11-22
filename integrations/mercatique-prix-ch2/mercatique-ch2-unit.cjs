const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const listeners={},store=new Map(),main={innerHTML:'',scrollTop:0},sim={innerHTML:''};
let dialog;
const document={getElementById:()=>null,head:{append(){}},body:{append(){}},addEventListener(type,fn){listeners[type]=fn;},createElement(tag){if(tag!=='dialog')return {};return dialog={setAttribute(){},addEventListener(){},showModal(){},close(){},remove(){},contains:()=>true,querySelector:s=>s==='[data-mac2-simulation]'?sim:main};}};
const scope={subject:'Mercatique',level:'Terminale',series:'GFM'};
const window={MASimple:{scopeFor:()=>scope}};
const sandbox={window,document,st:{role:'eleve',user:{id:'test-student'}},localStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)},FormData:class{constructor(target){this.values=target.values;}get(k){return this.values[k];}}};
vm.runInNewContext(fs.readFileSync('mercatique-ch2.js','utf8'),sandbox);
const mod=window.MAMercaCh2;
assert.equal(mod.lessons.length,5);assert.equal(mod.exercises.length,7);
assert.deepEqual([0,1,2].map(i=>mod.exercises.filter(q=>q.level===i).length),[3,2,2]);
assert.equal(mod.card({...scope,series:'IAG'},'learn',''),'');assert.equal(mod.card({...scope,level:'Première'},'learn',''),'');assert.match(mod.card(scope,'learn','chapitre 2'),/data-mac2-open/);assert.match(mod.nativeCard(scope),/7 exercices/);
mod.open({dataset:{mac2Open:'home'}},scope);assert.match(main.innerHTML,/Fiches de cours/);
const act=a=>listeners.click({target:{closest:()=>({hasAttribute:()=>false,dataset:{mac2Act:a}})}});
act('lessons');assert.equal((main.innerHTML.match(/data-mac2-act="lesson-/g)||[]).length,5);
for(let i=0;i<5;i++){act('lesson-'+i);assert.match(main.innerHTML,/<img src=/);assert.match(main.innerHTML,/À retenir pour le bac/);assert.match(main.innerHTML,/data-ma-document/);act('mark');}
assert.match(main.innerHTML,/Simulateur : nombre de repas/);
listeners.input({target:{matches:()=>true,value:'2000'}});assert.match(sim.innerHTML,/200\s000 FDJ/);assert.match(sim.innerHTML,/<svg/);
act('exercises');assert.equal((main.innerHTML.match(/data-mac2-act="exercise-/g)||[]).length,7);act('filter-2');assert.equal((main.innerHTML.match(/data-mac2-act="exercise-/g)||[]).length,2);act('filter--1');
for(let i=0;i<7;i++){act('exercise-'+i);assert.match(main.innerHTML,/<img src=/);assert.match(main.innerHTML,/Besoin d’un indice/);const ex=mod.exercises[i],values={};ex.qs.forEach((q,j)=>values['q'+j]=q.manual?'Justification fondée sur le dossier':String(q.a).replace('.',','));listeners.submit({preventDefault(){},target:{matches:()=>true,values}});assert.equal((main.innerHTML.match(/mac2-feedback good/g)||[]).length,ex.qs.filter(q=>!q.manual).length);assert.equal((main.innerHTML.match(/mac2-feedback bad/g)||[]).length,0);}
const saved=JSON.parse(store.get('monavenir-merca-ch2-v1:test-student'));assert.equal(saved.done.length,5);assert.equal(Object.keys(saved.results).length,7);act('home');assert.match(main.innerHTML,/value="12"/);act('exercise-3');act('retry');assert.match(main.innerHTML,/Vérifier mes réponses/);assert.equal(mod.equal('',0),false);assert.equal(mod.equal('1,375',1.375),true);assert.equal(mod.equal('-10',-10),true);assert.equal(mod.equal('1 350 000',1350000),true);
assert.equal(mod.exercises.reduce((a,b)=>a+b.qs.length,0),28);
console.log('PASS — 5 fiches, 7 exercices, 28 questions, 6 images, simulateur, calculs, suivi, filtres et périmètre.');
