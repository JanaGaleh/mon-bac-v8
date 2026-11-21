// Extend the current complementary Worker. Do not build from main or a stale snapshot.
import {readFileSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
export function buildChapter2(current,chapter){
  const anchor='export default makeHandler(';
  const at=current.indexOf(anchor);
  if(at<0||current.indexOf(anchor,at+1)>=0)throw Error('Unexpected entrypoint');
  let h=current.slice(0,at);
  if(h.includes('MAGFCh2'))throw Error('Chapter 2 already present');
  const replace=(a,b)=>{if(h.split(a).length!==2)throw Error('Unexpected current Worker anchor: '+a);h=h.replace(a,()=>b);};
  replace("+(window.MAGFCh1?.card(window.MASimple?.scopeFor(st.screen),tab,query)||'');", "+(window.MAGFCh1?.card(window.MASimple?.scopeFor(st.screen),tab,query)||'')+(window.MAGFCh2?.card(window.MASimple?.scopeFor(st.screen),tab,query)||'');");
  replace("+(window.MAGFCh1?.nativeCard(m.scope)||''))", "+(window.MAGFCh1?.nativeCard(m.scope)||'')+(window.MAGFCh2?.nativeCard(m.scope)||''))");
  replace("async function click(ev){const gf=", "async function click(ev){const amort=ev.target.closest('[data-maam-open]');if(amort){if(!busy)window.MAGFCh2?.open(amort,m.scope);return;}const gf=");
  replace("patchSource(path, source, moduleSource, styleSource, gfSource)", "patchSource(path, source, moduleSource, styleSource, gfSource, chapter2Source)");
  replace("makeHandler(moduleSource, styleSource, gfSource)", "makeHandler(moduleSource, styleSource, gfSource, chapter2Source)");
  replace("patchSource(path,source,moduleSource,styleSource,gfSource)", "patchSource(path,source,moduleSource,styleSource,gfSource,chapter2Source)");
  replace("-prix-psychologique-documents-v2-gf-ch1-v1'", "-prix-psychologique-documents-v2-gf-ch1-v1-gf-ch2-v1'");
  replace("if (!window.MAGFCh1) {\\n", "if (!window.MAGFCh2) {\\n${chapter2Source}\\n}\\nif (!window.MAGFCh1) {\\n");
  replace("h.set('x-monavenir-gf','chapter1');", "h.set('x-monavenir-gf','chapter1');h.set('x-monavenir-gf-ch2','1');");
  let args=JSON.parse('['+current.slice(at+anchor.length).trim().replace(/\);\s*$/,'')+']');
  if(args.length!==3||!args[2].includes('window.MAGFCh1')||!args[0].includes('window.MAPrixPsychologique'))throw Error('Current modules missing');
  // The new dialog has its own in-place document zoom: do not double-enhance its documents.
  const docAnchor="const ignored='.magf-dialog,";
  if(args[0].split(docAnchor).length!==2)throw Error('Document viewer anchor changed');
  args[0]=args[0].replace(docAnchor,"const ignored='.maam-dialog,.magf-dialog,");
  return h+anchor+[...args,chapter].map(JSON.stringify).join(',')+');\n';
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const [current,chapter,out]=process.argv.slice(2);
  if(!current||!chapter||!out)throw Error('Usage: node extend-worker.mjs current.mjs chapter.js candidate.mjs');
  writeFileSync(out,buildChapter2(readFileSync(current,'utf8'),readFileSync(chapter,'utf8')));
}
