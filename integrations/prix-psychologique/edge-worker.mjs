// Narrow, reversible routing layer for the two public JS assets only.
export const LEARNING='/mon-bac-v85-compact-list-20261119-sort-r1-market-r1-simple-r1-flow-r1-qcm-v266-optique-v268-feedback-v269.js';
export const INTERACTIVE='/mon-bac-interactive-facture-20261119-sort-r1-market-r1-simple-r1-flow-r1-bento-v267-feedback-v269-optique-v270.js';
export const SHELL='/service-worker-ege-2027.js';
export const PATHS=[LEARNING,INTERACTIVE,SHELL];
const HOST='monavenir.janagaleh.com';
const MAX_BYTES=512*1024;
const learningAnchor="const optics=window.MAOptique?.card(window.MASimple?.scopeFor(st.screen),tab,query)||'';";
const learningPatch="const optics=(window.MAOptique?.card(window.MASimple?.scopeFor(st.screen),tab,query)||'')+(window.MAPrixPsychologique?.card(window.MASimple?.scopeFor(st.screen),tab,query)||'');";
const interactiveAnchor="(window.MADefiOptique?.nativeCard(m.scope)||'')";
const interactivePatch="((window.MADefiOptique?.nativeCard(m.scope)||'')+(window.MAPrixPsychologique?.nativeCard(m.scope)||''))";
const clickAnchor="async function click(ev){const opt=";
const clickPatch="async function click(ev){const prix=ev.target.closest('[data-mapr-open]');if(prix){if(!busy)window.MAPrixPsychologique?.open(prix,m.scope);return;}const opt=";

export function patchSource(path, source, moduleSource, styleSource) {
  if(path===SHELL){
    // Existing installations cache JS assets. Advance only the static shell
    // cache identifier so the existing install/activate logic fetches them anew.
    const marker='-prix-psychologique-v1';
    if(!source.includes(LEARNING.slice(1))||!source.includes(INTERACTIVE.slice(1))||source.includes(marker))return null;
    const matches=[...source.matchAll(/const CACHE='(ege-gfm-2027-shell-[^'\r\n]+)';/g)];
    if(matches.length!==1)return null;
    return source.replace(matches[0][0],`const CACHE='${matches[0][1]}${marker}';`);
  }
  // Never overwrite or duplicate a module already embedded by a newer main deployment.
  if(source.includes('window.MAPrixPsychologique'))return null;
  const replacements=path===LEARNING?[[learningAnchor,learningPatch]]:path===INTERACTIVE?[[interactiveAnchor,interactivePatch],[clickAnchor,clickPatch]]:[];
  if(!replacements.length||replacements.some(([anchor])=>source.split(anchor).length!==2))return null;
  let patched=source;
  for(const [anchor,next] of replacements)patched=patched.replace(anchor,next);
  return `/* MonAvenir: module Mercatique complémentaire */\nif (!window.MAPrixPsychologique) {\n${moduleSource}\n}\nif (!document.getElementById('mapr-prix-style')) {const style=document.createElement('style');style.id='mapr-prix-style';style.textContent=${JSON.stringify(styleSource)};document.head.append(style);}\n;\n${patched}\n`;
}

async function boundedText(response,ctx){
  if(!response.body)return null;
  if(Number(response.headers.get('content-length'))>MAX_BYTES)return null;
  const reader=response.clone().body.getReader();
  let n=0;const parts=[];
  try{
    while(true){const {done,value}=await reader.read();if(done)break;n+=value.byteLength;if(n>MAX_BYTES){ctx.waitUntil(reader.cancel().catch(()=>{}));return null;}parts.push(value);}
    const bytes=new Uint8Array(n);let i=0;for(const chunk of parts){bytes.set(chunk,i);i+=chunk.byteLength;}
    return new TextDecoder('utf-8',{fatal:true}).decode(bytes);
  }finally{reader.releaseLock();}
}

export function makeHandler(moduleSource, styleSource) {
  return {async fetch(request,env,ctx){
    const u=new URL(request.url), path=u.pathname, isTarget=PATHS.includes(path);
    if(!isTarget&&u.hostname!==HOST)return new Response('Not found',{status:404});
    // Preserve requests to the main Worker; the preview can only access the two public scripts.
    const url=new URL(request.url);url.hostname=HOST;url.protocol='https:';url.port='';
    if(!isTarget||!['GET','HEAD'].includes(request.method))return env.PRIMARY.fetch(new Request(url,request));
    const headers=new Headers(request.headers);
    for(const name of ['if-none-match','if-modified-since','if-range','range','accept-encoding'])headers.delete(name);
    const original=await env.PRIMARY.fetch(new Request(url,{method:'GET',headers}));
    if(!original.ok||!/(?:javascript|ecmascript)/i.test(original.headers.get('content-type')||''))return original;
    try{
      const source=await boundedText(original,ctx);
      const patched=source!==null?patchSource(path,source,moduleSource,styleSource):null;
      if(patched===null){console.warn(JSON.stringify({event:'prix_unmodified',path}));return original;}
      const h=new Headers(original.headers);
      for(const name of ['content-length','content-encoding','etag','last-modified','content-range','accept-ranges','digest','content-md5'])h.delete(name);
      h.set('cache-control','no-store');h.set('content-type','application/javascript; charset=utf-8');h.set('x-monavenir-prix','1');
      return new Response(request.method==='HEAD'?null:patched,{status:200,headers:h});
    }catch(error){console.error(JSON.stringify({event:'prix_patch_error',path,error:String(error)}));return original;}
  }};
}
