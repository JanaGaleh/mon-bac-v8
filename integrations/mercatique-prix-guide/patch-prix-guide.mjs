// Target only the active client registry, app HTML, service worker and the new illustration.
export function patchGuide(source,moduleSource,photo){
 if(source.includes('window.MAPrixGuide')||source.includes('/monavenir-prix-guide-scene-v1.webp'))throw Error('Module already present. Inspect before overwriting.');
 if(!/^UklGR[A-Za-z0-9+/=]+$/.test(photo))throw Error('Valid WebP required');
 if(!source.includes('/monavenir-coach-jana-v276.webp'))throw Error('Existing coach avatar missing');
 function quoted(start){if(source[start]!=='"')throw Error('Expected JSON string');let escape=false;for(let i=start+1;i<source.length;i++){const c=source[i];if(escape)escape=false;else if(c==='\\')escape=true;else if(c==='"')return {start,end:i+1,value:JSON.parse(source.slice(start,i+1))};}throw Error('Unclosed JSON string');}
 function lastValue(path){const a='assets['+JSON.stringify(path)+'][2]=';const i=source.lastIndexOf(a);if(i<0)throw Error('Missing active '+path);return quoted(i+a.length);}
 const html=lastValue('/app-2027.html'),sw=lastValue('/service-worker-ege-2027.js');
 const scripts=[...html.value.matchAll(/<script defer src="(\/monavenir-chapters-[a-z0-9-]+\.js)"><\/script>/g)];if(scripts.length!==1)throw Error('Expected one active registry');
 const oldPath=scripts[0][1],newPath='/monavenir-chapters-prix-guide-v1.js';if(source.includes(newPath))throw Error('New registry path already exists');
 const anchor='assets['+JSON.stringify(oldPath)+']=';if(source.split(anchor).length!==2)throw Error('Invalid active registry assignment');
 const start=source.indexOf(anchor)+anchor.length;let e=start,q=false,escape=false;for(;e<source.length;e++){const c=source[e];if(q){if(escape)escape=false;else if(c==='\\')escape=true;else if(c==='"')q=false;}else if(c==='"')q=true;else if(c===']')break;}
 const asset=JSON.parse(source.slice(start,e+1));if(asset[1]!==false||typeof asset[2]!=='string'||source[e+1]!==';')throw Error('Unexpected registry asset');
 const prior=asset[2],entry="['MAPrixPsychologique','GFM','Terminale','Mercatique','Le prix']";
 for(const m of ['MAMercaCh1','MAMercaCh2','MAGFAmortCoach','MAGFCh4Stocks'])if(!prior.includes(m))throw Error('Prior module missing: '+m);
 if(prior.split(entry).length!==2)throw Error('Price chapter anchor missing or repeated');
 const merged=moduleSource+'\n'+prior.replace(entry,entry+",['MAPrixGuide','GFM','Terminale','Mercatique','Le prix']");
 const addition='\nassets['+JSON.stringify(newPath)+']='+JSON.stringify([asset[0],false,merged])+';\nassets["/monavenir-prix-guide-scene-v1.webp"]='+JSON.stringify(['image/webp',true,photo])+';\n';
 const html2=html.value.replace(oldPath,newPath);if(!sw.value.includes(oldPath))throw Error('Active precache path missing');
 const sw2=sw.value.replaceAll(oldPath,newPath).replace(/const CACHE='([^']+)'/,(_,v)=>"const CACHE='"+v+"-prix-guide-v1'")+"\nASSETS.push(new URL('/monavenir-prix-guide-scene-v1.webp',self.registration.scope).href);\n";
 if(!sw2.includes("-prix-guide-v1'"))throw Error('Cache version anchor missing');
 const edits=[{start:e+2,end:e+2,value:addition},{start:html.start,end:html.end,value:JSON.stringify(html2)},{start:sw.start,end:sw.end,value:JSON.stringify(sw2)}].sort((a,b)=>b.start-a.start);
 for(const op of edits)source=source.slice(0,op.start)+op.value+source.slice(op.end);
 return {source,oldPath,newPath,priorLength:prior.length,mergedLength:merged.length};
}
