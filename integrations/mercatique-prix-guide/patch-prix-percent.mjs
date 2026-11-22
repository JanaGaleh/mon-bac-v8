// Replace only the guided exercise in the currently active registry, keeping all other code.
export function patchPercent(source, oldModule, newModule) {
  function quoted(start) {
    if(source[start]!=='"')throw Error('Expected JSON string');
    let escape=false;
    for(let i=start+1;i<source.length;i++){
      const c=source[i];if(escape)escape=false;else if(c==='\\')escape=true;
      else if(c==='"')return {start,end:i+1,value:JSON.parse(source.slice(start,i+1))};
    }throw Error('Unclosed string');
  }
  function lastValue(path){const a='assets['+JSON.stringify(path)+'][2]=';const i=source.lastIndexOf(a);if(i<0)throw Error('Missing '+path);return quoted(i+a.length);}
  const html=lastValue('/app-2027.html'),sw=lastValue('/service-worker-ege-2027.js');
  const scripts=[...html.value.matchAll(/<script defer src="(\/monavenir-chapters-[a-z0-9-]+\.js)"><\/script>/g)];
  if(scripts.length!==1)throw Error('Expected one active registry');
  const oldPath=scripts[0][1],newPath='/monavenir-chapters-prix-percent-v1.js';
  if(source.includes(newPath))throw Error('Target already exists');
  const anchor='assets['+JSON.stringify(oldPath)+']=';
  if(source.split(anchor).length!==2)throw Error('Unexpected registry assignment');
  const start=source.indexOf(anchor)+anchor.length;let end=start,q=false,esc=false;
  for(;end<source.length;end++){const c=source[end];if(q){if(esc)esc=false;else if(c==='\\')esc=true;else if(c==='"')q=false;}else if(c==='"')q=true;else if(c===']')break;}
  const asset=JSON.parse(source.slice(start,end+1));
  if(asset[1]!==false||typeof asset[2]!=='string'||source[end+1]!==';')throw Error('Invalid registry');
  if(asset[2].split(oldModule).length!==2)throw Error('Expected exact prior module once');
  const registry=asset[2].replace(oldModule,()=>newModule);
  if(registry.replace(newModule,()=>oldModule)!==asset[2])throw Error('Unrelated registry change');
  if(!sw.value.includes(oldPath))throw Error('Registry not in precache');
  const sw2=sw.value.replaceAll(oldPath,newPath).replace(/const CACHE='([^']+)'/,(_,v)=>"const CACHE='"+v+"-prix-percent-v1'");
  if(!sw2.includes("-prix-percent-v1'"))throw Error('Cache anchor not found');
  const edits=[{start:end+2,end:end+2,value:'\nassets['+JSON.stringify(newPath)+']='+JSON.stringify([asset[0],false,registry])+';\n'}, {start:html.start,end:html.end,value:JSON.stringify(html.value.replace(oldPath,newPath))},{start:sw.start,end:sw.end,value:JSON.stringify(sw2)}].sort((a,b)=>b.start-a.start);
  for(const edit of edits)source=source.slice(0,edit.start)+edit.value+source.slice(edit.end);
  return {source,oldPath,newPath,registryLength:registry.length};
}
