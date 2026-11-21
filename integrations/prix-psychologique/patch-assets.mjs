// Apply only to a fresh export of the CURRENT production static assets.
// Usage: node patch-assets.mjs /path/to/current-assets.json /path/to/patched-assets.json
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const [input,output]=process.argv.slice(2);
if(!input||!output||input===output)throw Error('Specify distinct input and output files.');
const here=dirname(fileURLToPath(import.meta.url));
const assets=JSON.parse(readFileSync(input,'utf8'));
const one=(pattern)=>{const found=Object.keys(assets).filter(x=>pattern.test(x));if(found.length!==1)throw Error('Expected exactly one matching live asset: '+pattern+'; got '+found.length);return found[0];};
const replace=(path,anchor,next)=>{const row=assets[path];if(!Array.isArray(row)||row[1]||typeof row[2]!=='string')throw Error('Expected text asset: '+path);if(row[2].split(anchor).length!==2)throw Error('Anchor missing or repeated: '+path);row[2]=row[2].replace(anchor,next);};
const learning=one(/\/mon-bac-v85-compact-list-.*optique-v268-feedback-v269\.js$/);
const interactive=one(/\/mon-bac-interactive-facture-.*optique-v270\.js$/);
const htmls=Object.keys(assets).filter(k=>Array.isArray(assets[k])&&!assets[k][1]&&typeof assets[k][2]==='string'&&assets[k][2].includes(learning.slice(1))&&assets[k][2].includes(interactive.slice(1))&&assets[k][2].includes('</head>'));
if(!htmls.length)throw Error('Live learning and exercise scripts are not referenced in an HTML asset.');
const js='/monavenir-prix-psychologique.js',css='/monavenir-prix-psychologique.css';
if(assets[js]||assets[css])throw Error('Module already installed; do not apply twice.');
replace(learning,"const optics=window.MAOptique?.card(window.MASimple?.scopeFor(st.screen),tab,query)||'';","const optics=(window.MAOptique?.card(window.MASimple?.scopeFor(st.screen),tab,query)||'')+(window.MAPrixPsychologique?.card(window.MASimple?.scopeFor(st.screen),tab,query)||'');");
replace(interactive,"(window.MADefiOptique?.nativeCard(m.scope)||'')","((window.MADefiOptique?.nativeCard(m.scope)||'')+(window.MAPrixPsychologique?.nativeCard(m.scope)||''))");
replace(interactive,"async function click(ev){const opt=", "async function click(ev){const prix=ev.target.closest('[data-mapr-open]');if(prix){if(!busy)window.MAPrixPsychologique?.open(prix,m.scope);return;}const opt=");
for(const path of htmls)replace(path,'</head>',`<link rel="stylesheet" href="${css}"><script defer src="${js}"></script></head>`);
assets[js]=['application/javascript; charset=utf-8',false,readFileSync(join(here,js.slice(1)),'utf8')];
assets[css]=['text/css; charset=utf-8',false,readFileSync(join(here,css.slice(1)),'utf8')];
writeFileSync(output,JSON.stringify(assets),'utf8');
console.log('Patched exact live hooks: '+[learning,interactive,...htmls].join(', '));
