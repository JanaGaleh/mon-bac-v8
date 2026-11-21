import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {Window} from 'happy-dom';
const js=readFileSync(new URL('../integrations/prix-psychologique/monavenir-document-viewer.js',import.meta.url),'utf8');
function setup(html){const w=new Window({url:'https://monavenir.janagaleh.com/'});w.document.body.innerHTML=html;vm.runInNewContext(js,{window:w,document:w.document,location:w.location,MutationObserver:w.MutationObserver,requestAnimationFrame:w.requestAnimationFrame.bind(w),getComputedStyle:w.getComputedStyle.bind(w)});return w;}
test('pedagogical SVG is enlarged, navigation icon and native PDF reader untouched',()=>{
 const w=setup('<nav><svg id="icon" viewBox="0 0 20 20"></svg></nav><section><svg id="graph" role="img" viewBox="0 0 360 232" aria-label="Courbes"></svg></section><div class="lr-document"><canvas></canvas></div>');const d=w.document;
 assert.ok(d.querySelector('#graph').classList.contains('madoc-readable-svg'));assert.ok(!d.querySelector('#icon').classList.contains('madoc-readable-svg'));assert.equal(d.querySelectorAll('.madoc-tools').length,1);
 d.querySelector('.madoc-tools button').click();assert.ok(d.querySelector('.madoc-dialog[open]'));
 const get=s=>d.querySelector(`.madoc-dialog [aria-label="${s}"]`);get('Zoom avant').click();assert.equal(d.querySelector('.madoc-dialog output').textContent,'125%');get('Zoom arrière').click();assert.equal(d.querySelector('.madoc-dialog output').textContent,'100%');get('Ajuster à la largeur').click();get('Fermer le document').click();assert.equal(d.querySelector('.madoc-dialog'),null);
});
test('editable table keeps original inputs and in-place zoom; no duplicate IDs',()=>{
 const w=setup('<section><table id="answer"><tr><td><input id="cell" value="17,5"></td></tr></table></section>');const d=w.document,table=d.querySelector('#answer'),field=d.querySelector('#cell');assert.ok(table.classList.contains('madoc-readable-table'));assert.equal(d.querySelectorAll('#cell').length,1);d.querySelector('[aria-label="Agrandir le document"]').click();assert.equal(table.style.zoom,'1.25');assert.equal(field.value,'17,5');field.value='20';d.querySelector('[aria-label="Taille normale"]').click();assert.equal(table.style.zoom,'1');assert.equal(field.value,'20');
});
test('dynamically rendered documents get controls once and spreadsheet grid stays intact',()=>{
 const w=setup('<div class="spreadsheet"><table id="sheet"><tr><td>1</td></tr></table></div><main id="content"></main>');const d=w.document;
 d.querySelector('#content').innerHTML='<figure><img alt="Document de cours" src="data:image/svg+xml,%3Csvg/%3E"></figure>';w.MADocZoom.scan();w.MADocZoom.scan();assert.equal(d.querySelectorAll('.madoc-tools').length,1);assert.ok(!d.querySelector('#sheet').classList.contains('madoc-readable-table'));
});
