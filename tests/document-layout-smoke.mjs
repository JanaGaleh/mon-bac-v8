// Real Chromium layout regression for the mobile graph and fullscreen zoom.
import {readFileSync,writeFileSync,mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const dir=mkdtempSync(join(tmpdir(),'monavenir-doc-layout-'));
const source=name=>readFileSync(new URL('../integrations/prix-psychologique/'+name,import.meta.url),'utf8');
const css=source('monavenir-prix-psychologique.css')+'\n'+source('monavenir-document-viewer.css');
const js=source('monavenir-prix-psychologique.js')+'\n'+source('monavenir-document-viewer.js');
const path=join(dir,'test.html');
writeFileSync(path,`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}body{margin:0}svg{width:21px;height:21px;flex:none;stroke:currentColor;fill:none}${css}</style></head><body><nav><svg id="icon" viewBox="0 0 20 20"></svg></nav><main id="root"></main><script>var st={role:'eleve',user:{id:'test'}};window.MASimple={scopeFor:()=>({subject:'Mercatique',level:'Terminale',series:'GFM'})};${js}
document.getElementById('root').innerHTML=MAPrixPsychologique.card(MASimple.scopeFor(),'learn','');document.querySelector('[data-mapr-open]').click();document.querySelector('[data-mapr-act="lessons"]').click();document.querySelector('[data-mapr-act="lesson-4"]').click();MADocZoom.scan();const graph=document.querySelector('.mapr-curves'),r=graph.getBoundingClientRect(),panel=graph.parentElement.getBoundingClientRect(),icon=document.querySelector('#icon').getBoundingClientRect();graph.click();const copy=document.querySelector('.madoc-dialog svg'),before=copy.getBoundingClientRect();document.querySelector('.madoc-dialog [aria-label="Zoom avant"]').click();const after=copy.getBoundingClientRect();document.body.setAttribute('data-result',[r.width,r.height,panel.width,icon.height,before.width,after.width].join(','));</script></body></html>`);
const viewport=process.argv[2]||'390,844';
const output=execFileSync('chromium',['--headless','--no-sandbox','--disable-gpu','--no-first-run','--disable-dev-shm-usage',`--window-size=${viewport}`,'--virtual-time-budget=1200','--dump-dom',`file://${path}`],{encoding:'utf8',stdio:['ignore','pipe','ignore']});
const match=output.match(/data-result="([\d.,]+)"/);assert.ok(match,'document layout result missing');
const [width,height,panelWidth,iconHeight,normal,zoomed]=match[1].split(',').map(Number);
assert.ok(width>=250&&height>=150,`graph too small: ${width} × ${height}`);assert.ok(width<=panelWidth,'graph overflows panel');assert.equal(iconHeight,21);assert.ok(zoomed>normal*1.2,'zoom did not enlarge document');
console.log(`Viewport ${viewport}: graph ${width.toFixed(0)} × ${height.toFixed(0)} CSS px, icon ${iconHeight}px, zoom ${normal.toFixed(0)} → ${zoomed.toFixed(0)}px`);
