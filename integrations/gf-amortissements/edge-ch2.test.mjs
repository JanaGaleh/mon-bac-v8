import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildChapter2} from './extend-worker.mjs';
import {patchSource,LEARNING,INTERACTIVE,SHELL} from './candidate-edge.mjs';
const source=readFileSync('current-edge.mjs','utf8'),chapter=readFileSync('monavenir-gf-ch2.js','utf8');
test('strict, reproducible extension',()=>{
  assert.equal(buildChapter2(source,chapter),readFileSync('candidate-edge.mjs','utf8'));
  assert.throws(()=>buildChapter2(source.replace('const gf=','const changed='),chapter));
  assert.throws(()=>buildChapter2(buildChapter2(source,chapter),chapter));
});
test('course and exercise hooks coexist with chapter 1 and Mercatique',()=>{
  const a="const optics=window.MAOptique?.card(window.MASimple?.scopeFor(st.screen),tab,query)||'';";
  const b="const x=(window.MADefiOptique?.nativeCard(m.scope)||'');async function click(ev){const opt=1;}";
  for(const [path,code] of [[LEARNING,a],[INTERACTIVE,b]]){
    const patched=patchSource(path,code,'/*price*/','/*style*/','/*chapter1*/','/*chapter2*/');
    assert.match(patched,/MAGFCh1/);assert.match(patched,/MAPrixPsychologique/);assert.match(patched,/MAGFCh2/);
    assert.match(patched,/\/\*chapter2\*\//);
    assert.doesNotThrow(()=>new Function(patched));
  }
  assert.equal(patchSource(LEARNING,'no anchor','','','',''),null);
});
test('only static cache name changes',()=>{
  const s="const CACHE='ege-gfm-2027-shell-r1'; const entries="+JSON.stringify([LEARNING.slice(1),INTERACTIVE.slice(1)])+";";
  assert.equal(patchSource(SHELL,s,'','','','').replace('-prix-psychologique-documents-v2-gf-ch1-v1-gf-ch2-v1',''),s);
});
