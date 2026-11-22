const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const code=fs.readFileSync('prix-guide.js','utf8'),store=new Map();
function fixture(id){let dialog;const main={innerHTML:'',scrollTop:0,querySelector:()=>null},listeners={};const document={getElementById:()=>null,head:{append(){}},body:{append(){}},addEventListener(k,v){listeners[k]=v;},createElement(tag){if(tag!=='dialog')return {};return dialog={className:'',innerHTML:'',setAttribute(){},addEventListener(k,v){this[k]=v;},querySelector(){return main;},showModal(){},close(){this.close?.();},remove(){}};}};const window={},st={role:'eleve',user:{id}},sandbox={window,st,document,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},FormData:class{constructor(t){this.v=t.v;}get(){return this.v;}}};vm.runInNewContext(code,sandbox);return {mod:window.MAPrixGuide,main,getDialog:()=>dialog,st};}
const scope={subject:'Mercatique',level:'Terminale',series:'GFM'};
const a=fixture('alpha'),m=a.mod,d=m.data;
assert.equal(d.high.reduce((a,b)=>a+b,0),200);assert.equal(d.low.reduce((a,b)=>a+b,0),200);
assert.equal(d.hc.join(','),'0,5,15,40,100');assert.equal(d.lc.join(','),'100,55,25,10,0');assert.equal(d.buyers.join(','),'0,40,60,50,0');assert.equal(d.prices[d.best],2000);assert.equal(d.buyers[d.best]*d.N/100,120);
assert.equal(m.tasks.filter(t=>t.kind==='cell').length,25);assert.equal(m.tasks.filter(t=>t.kind==='point').length,15);assert.equal(m.tasks.filter(t=>t.kind==='link').length,3);assert.equal(m.tasks.length,48);
assert.equal(m.correct('',0),false);assert.equal(m.correct('2 000',2000),true);assert.equal(m.correct('10,0',10),true);assert.equal(m.correct('Infinity',10),false);assert.equal(m.correct('2e3',2000),false);
assert.match(m.nativeCard(scope),/data-mpg-open/);assert.equal(m.nativeCard({...scope,series:'OGRH'}),'');a.st.role='admin';assert.equal(m.nativeCard(scope),'');a.st.role='eleve';
store.set('monavenir-prix-guide-v1:alpha','27');const resumed=fixture('alpha');resumed.mod.open({},scope);assert.match(resumed.main.innerHTML,/27\/48 validations/);assert.match(resumed.main.innerHTML,/Tracer le graphique/);assert.equal((resumed.main.innerHTML.match(/<polyline/g)||[]).length,0);
const b=fixture('beta');b.mod.open({},scope);assert.match(b.main.innerHTML,/0\/48 validations/);assert.match(b.main.innerHTML,/Hodan Électronique/);assert.match(b.main.innerHTML,/monavenir-coach-jana-v276.webp/);assert.match(b.main.innerHTML,/monavenir-prix-guide-scene-v1.webp/);
store.set('monavenir-prix-guide-v1:gamma','99');const c=fixture('gamma');c.mod.open({},scope);assert.match(c.main.innerHTML,/0\/48 validations/);
console.log('PASS — indépendant : données, 48 tâches, périmètre, calculs, sauvegarde par élève et reprise.');
