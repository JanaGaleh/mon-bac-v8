import test from 'node:test';import assert from 'node:assert/strict';import {evaluateCell} from '../js/tableur-engine.js';import {exportXlsx} from '../js/tableur-xlsx.js';
test('references et operations',()=>{assert.equal(evaluateCell({A1:'12',B1:'3',C1:'=A1*B1'},'C1'),36)});
test('plages et SOMME',()=>{assert.equal(evaluateCell({A1:'10',A2:'20',A3:'=SOMME(A1:A2)'},'A3'),30)});
test('MOYENNE et ARRONDI',()=>{assert.equal(evaluateCell({A1:'4',A2:'8',B1:'=MOYENNE(A1:A2)',B2:'=ARRONDI(3.14159,2)'},'B1'),6);assert.equal(evaluateCell({B2:'=ARRONDI(3.14159,2)'},'B2'),3.14)});
test('detecte les references circulaires',()=>assert.throws(()=>evaluateCell({A1:'=B1',B1:'=A1'},'A1'),/circulaire/));
test('rejette le code arbitraire',()=>assert.throws(()=>evaluateCell({A1:'=alert(1)'},'A1')));
test('genere une archive Excel',async()=>{const file=exportXlsx({A1:'Produit',B1:'100',C1:'=B1*2'});assert.ok(file.size>500);const bytes=new Uint8Array(await file.arrayBuffer());assert.deepEqual([...bytes.slice(0,4)],[80,75,3,4])});