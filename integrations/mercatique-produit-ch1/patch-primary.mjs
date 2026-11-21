// Add the module to the exact active V276 registry without altering other assets.
export function patchPrimary(source, moduleSource, photos) {
  const oldPath='/monavenir-chapters-v276.js',newPath='/monavenir-chapters-v278.js';
  const anchor='assets['+JSON.stringify(oldPath)+']=';
  if(source.split(anchor).length!==2||source.includes(newPath)||source.includes('MAMercaCh1'))throw Error('Unexpected primary version');
  if(photos.length!==6||photos.some(p=>!/^UklGR[A-Za-z0-9+/=]+$/.test(p)))throw Error('Six WebP photos required');
  const start=source.indexOf(anchor)+anchor.length;
  let e=start,quote=false,escaped=false;
  for(;e<source.length;e++) {const c=source[e];if(quote){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')quote=false;}else if(c==='"')quote=true;else if(c===']')break;}
  const asset=JSON.parse(source.slice(start,e+1));
  if(asset[0]!=='application/javascript; charset=utf-8'||asset[1]!==false)throw Error('Unexpected registry asset');
  let registry=asset[2];
  const chapter='Chapitre 1 — Le produit et l’offre commerciale';
  const one=(s,a,b)=>{if(s.split(a).length!==2)throw Error('Unexpected anchor: '+a);return s.replace(a,()=>b);};
  registry=one(registry,"const seeds=[","const seeds=[{series:'GFM',academic_level:'Terminale',subject:'Mercatique',chapter_title:"+JSON.stringify(chapter)+"},");
  registry=one(registry,"const definitions=[","const definitions=[['MAMercaCh1','GFM','Terminale','Mercatique',"+JSON.stringify(chapter)+"],");
  asset[2]=moduleSource+'\n'+registry;
  let tail=source.slice(e+1);
  tail=one(tail,oldPath,newPath);
  if(!tail.startsWith(';'))throw Error('Unexpected registry terminator');
  const additions=';\nassets['+JSON.stringify(newPath)+']=assets['+JSON.stringify(oldPath)+'];\n'+photos.map((p,i)=>'assets['+JSON.stringify('/monavenir-merca-ch1-scene-'+i+'.webp')+']='+JSON.stringify(['image/webp',true,p])+';').join('\n');
  return source.slice(0,start)+JSON.stringify(asset)+additions+tail.slice(1);
}
