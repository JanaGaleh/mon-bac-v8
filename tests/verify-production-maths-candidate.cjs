/* Vérification locale uniquement : aucun appel réseau, aucune écriture Cloudflare. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const backup=process.argv[2];
assert(backup,'Indiquer le dossier de sauvegarde de production.');
const read=n=>fs.readFileSync(path.join(backup,n,'worker.js'),'utf8');
const parse=s=>{const start=s.indexOf('const assets=')+13,end=s.indexOf(';\n',start);return {assets:JSON.parse(s.slice(start,end)),start,end};};
const root=read('ege-gfm-2027'),rootAssets=parse(root).assets;
const service='monavenir-assets-exercise-layout-v293',original=read(service),{assets,start,end}=parse(original);
const manifest=JSON.parse(fs.readFileSync(path.join(backup,'manifest.json'),'utf8'));
assert(manifest.workers[0].bindings.some(x=>x.service===service&&x.name==='MONAVENIR_ASSET_11'));
const layout='/monavenir-exercise-layout-v293.js',html='/app-2027.html';
assert.equal(rootAssets[layout][1],11);assert.equal(rootAssets[html][1],11);
const newAssets=structuredClone(assets);
const code=['maths-terminales.js','utilite-pratique.js'].map(n=>fs.readFileSync(path.join(__dirname,'../js',n),'utf8')).join('\n');
assert(!assets[layout][2].includes('MAMathsTS'));
assert(newAssets[html][2].includes('src="'+layout+'"'));
newAssets[html][2]=newAssets[html][2].replace('src="'+layout+'"','src="'+layout+'?v=294"');
newAssets[layout][2]+='\n'+code;
const candidate=original.slice(0,start)+JSON.stringify(newAssets)+original.slice(end);
assert.equal(Object.keys(newAssets).length,Object.keys(assets).length);
for(const key of Object.keys(assets))if(![html,layout].includes(key))assert.deepEqual(assets[key],newAssets[key],key);
assert(newAssets[layout][2].startsWith(assets[layout][2]));
assert.equal(newAssets[html][2].replace('?v=294',''),assets[html][2]);
for(const image of ['/monavenir-coach-jana-v276.webp','/monavenir-amort-photo-computer-v283.webp','/gf-stock-v276-supermarket.jpg','/monavenir-amort-photo-lorry-v283.webp','/gf-stock-v276-warehouse.jpg']){
 assert(rootAssets[image],image+' absent de la table de routage');
 const binding=manifest.workers[0].bindings.find(b=>b.name==='MONAVENIR_ASSET_'+rootAssets[image][1]);
 const entry=parse(read(binding.service)).assets[image];
 assert(entry&&entry[0].startsWith('image/')&&entry[1]&&Buffer.from(entry[2],'base64').length>1000,image);
}
(async()=>{
 const m=await import('data:text/javascript;base64,'+Buffer.from(candidate).toString('base64'));
 for(const key of Object.keys(newAssets)){
  const response=await m.default.fetch(new Request('https://internal.invalid/?path='+encodeURIComponent(key)));
  assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),newAssets[key][0]);
  const expected=newAssets[key][1]?Buffer.from(newAssets[key][2],'base64'):Buffer.from(newAssets[key][2]);
  assert.deepEqual(Buffer.from(await response.arrayBuffer()),expected,key);
 }
 const unlisted=await m.default.fetch(new Request('https://internal.invalid/?path=/nonexistent'));
 assert.equal(unlisted.status,404);
 const hash=crypto.createHash('sha256').update(root).digest('hex');
 console.log(JSON.stringify({workerPrincipal:'inchangé',sha256:hash,service,assetsMaintenus:Object.keys(assets).length,assetsModifies:[html,layout],illustrationsVerifiees:5,ajoutSourceOctets:Buffer.byteLength(code),candidate:'OK',deploiement:false},null,2));
})().catch(e=>{console.error(e);process.exit(1)});
