// Add only the chapter 1 module to the currently deployed complement.
// Refuse unrecognized sources instead of rebuilding or replacing existing modules.
export function patchWorker(source, moduleSource, photos) {
  if (!source.includes('window.MAGFCh2') || !source.includes('window.MAPrixPsychologique') || source.includes('window.MAMercaCh1')) throw Error('Unexpected worker or existing module');
  if (!Array.isArray(photos) || photos.length!==6 || photos.some(p=>!/^UklGR[A-Za-z0-9+/=]+$/.test(p))) throw Error('Six WebP photos required');
  function one(oldValue,newValue) {
    if(source.split(oldValue).length!==2)throw Error('Unexpected or duplicated integration anchor: '+oldValue.slice(0,90));
    source=source.replace(oldValue,()=>newValue);
  }
  one("+(window.MAGFCh2?.card(window.MASimple?.scopeFor(st.screen),tab,query)||'');", "+(window.MAGFCh2?.card(window.MASimple?.scopeFor(st.screen),tab,query)||'')+(window.MAMercaCh1?.card(window.MASimple?.scopeFor(st.screen),tab,query)||'');");
  one("+(window.MAGFCh2?.nativeCard(m.scope)||''))", "+(window.MAGFCh2?.nativeCard(m.scope)||'')+(window.MAMercaCh1?.nativeCard(m.scope)||''))");
  one("const clickPatch=\"async function click(ev){", "const clickPatch=\"async function click(ev){const merca=ev.target.closest('[data-mac1-open]');if(merca){if(!busy)window.MAMercaCh1?.open(merca,m.scope);return;}");
  one("const marker='-prix-psychologique-documents-v2-gf-ch1-v2-gf-ch2-v3';","const marker='-prix-psychologique-documents-v2-gf-ch1-v2-gf-ch2-v3-merca-ch1-v1';");
  // The module is served before the original script and is idempotent across both entry points.
  one('return `/* MonAvenir: modules pédagogiques complémentaires */\\n', 'return `/* MonAvenir: modules pédagogiques complémentaires */\\nif (!window.MAMercaCh1) {\\n${mercaSource}\\n}\\n');
  // Only exact image IDs on the already-routed learning asset return images.
  const imageBranch=`\n    if(path===LEARNING&&u.searchParams.has('mac1img')&&['GET','HEAD'].includes(request.method)){\n      const id=u.searchParams.get('mac1img');\n      if(!/^[0-5]$/.test(id))return new Response('Image introuvable',{status:404});\n      const bytes=Uint8Array.from(atob(MERCA_IMAGES[Number(id)]),c=>c.charCodeAt(0));\n      return new Response(request.method==='HEAD'?null:bytes,{headers:{'content-type':'image/webp','cache-control':'public, max-age=86400','x-content-type-options':'nosniff','x-monavenir-merca-ch1':'1'}});\n    }`;
  const routeAnchor="const u=new URL(request.url), path=u.pathname, isTarget=PATHS.includes(path);";
  one(routeAnchor,routeAnchor+imageBranch);
  one("h.set('x-monavenir-gf-ch2','compact-v2');","h.set('x-monavenir-gf-ch2','compact-v2');h.set('x-monavenir-merca-ch1','1');");
  one('export default makeHandler(', 'const mercaSource='+JSON.stringify(moduleSource)+';\nconst MERCA_IMAGES='+JSON.stringify(photos)+';\nexport default makeHandler(');
  return source;
}
