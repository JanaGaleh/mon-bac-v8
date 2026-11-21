// Reproducible Cloudflare module bundle; pipe to an upload workflow, not a browser.
import {readFileSync} from 'node:fs';
const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');
const code=read('edge-worker.mjs');
const moduleSource=read('monavenir-prix-psychologique.js')+'\n'+read('monavenir-document-viewer.js');
const styles=read('monavenir-prix-psychologique.css')+'\n'+read('monavenir-document-viewer.css');
process.stdout.write(code+`\nexport default makeHandler(${JSON.stringify(moduleSource)},${JSON.stringify(styles)});\n`);
