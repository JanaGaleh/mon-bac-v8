// Adds the chapter 2 module to the active registry, preserving all existing modules.
export function patchCh2(source,moduleSource,photos){
  if(source.includes('window.MAMercaCh2')||source.includes('/monavenir-merca-ch2-scene-'))throw Error('Chapter already exists; inspect instead of overwriting');
  if(photos.length!==6||photos.some(p=>!/^UklGR[A-Za-z0-9+/=]+$/.test(p)))throw Error('Six WebP images required');
  function quoted(start){if(source[start]!=='"')throw Error('Expected JSON string');let escape=false;for(let i=start+1;i<source.length;i++){const c=source[i];if(escape)escape=false;else if(c==='\\')escape=true;else if(c==='"')return {start,end:i+1,value:JSON.parse(source.slice(start,i+1))};}throw Error('Unclosed JSON string');}
  function lastValue(path){const anchor='assets['+JSON.stringify(path)+'][2]=';const i=source.lastIndexOf(anchor);if(i<0)throw Error('Missing active '+path);return quoted(i+anchor.length);}
  const html=lastValue('/app-2027.html'),sw=lastValue('/service-worker-ege-2027.js');
  const matches=[...html.value.matchAll(/<script defer src="(\/monavenir-chapters-[a-z0-9-]+\.js)"><\/script>/g)];if(matches.length!==1)throw Error('Expected one active registry script');
  const oldPath=matches[0][1],newPath='/monavenir-chapters-merca-prix-v1.js';if(source.includes(newPath))throw Error('Registry path exists');
  const anchor='assets['+JSON.stringify(oldPath)+']=';if(source.split(anchor).length!==2)throw Error('Invalid current registry assignment');
  const start=source.indexOf(anchor)+anchor.length;let e=start,q=false,escape=false;for(;e<source.length;e++){const c=source[e];if(q){if(escape)escape=false;else if(c==='\\')escape=true;else if(c==='"')q=false;}else if(c==='"')q=true;else if(c===']')break;}
  const asset=JSON.parse(source.slice(start,e+1));if(asset[1]!==false||typeof asset[2]!=='string'||source[e+1]!==';')throw Error('Unexpected registry asset');
  const prior=asset[2],entry="['MAPrixPsychologique','GFM','Terminale','Mercatique','Le prix']";
  if(prior.split(entry).length!==2||!prior.includes('MAMercaCh1')||!prior.includes('MAGFAmortCoach')||!prior.includes('MAGFCh4Stocks'))throw Error('Unexpected registry; preserve prior updates');
  const merged=moduleSource+'\n'+prior.replace(entry,entry+",['MAMercaCh2','GFM','Terminale','Mercatique','Le prix']");
  const imageAssets=photos.map((p,i)=>'assets['+JSON.stringify('/monavenir-merca-ch2-scene-'+i+'.webp')+']='+JSON.stringify(['image/webp',true,p])+';').join('\n');
  const addition='\nassets['+JSON.stringify(newPath)+']='+JSON.stringify([asset[0],false,merged])+';\n'+imageAssets+'\n';
  const html2=html.value.replace(oldPath,newPath);
  if(!sw.value.includes(oldPath))throw Error('Active precache path missing');
  const sw2=sw.value.replaceAll(oldPath,newPath).replace(/const CACHE='([^']+)'/,(_,v)=>"const CACHE='"+v+"-merca-prix-v1'");
  if(!sw2.includes('-merca-prix-v1\''))throw Error('Cache version anchor missing');
  const edits=[{start:e+2,end:e+2,value:addition},{start:html.start,end:html.end,value:JSON.stringify(html2)},{start:sw.start,end:sw.end,value:JSON.stringify(sw2)}].sort((a,b)=>b.start-a.start);
  for(const op of edits)source=source.slice(0,op.start)+op.value+source.slice(op.end);
  return {source,oldPath,newPath,images:photos.length};
}
