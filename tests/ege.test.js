import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {wordCount,correctionOpen,validateProfile,safeDownload} from '../ege/domain.js';
test('EGE peut être servi uniquement sous /ege sans dépendre des scripts du portail',async()=>{
 const html=await readFile(new URL('../ege/index.html',import.meta.url),'utf8');
 assert.doesNotMatch(html,/(?:src|href)="\.\.\/(?:vendor|js|icon|platform)/);
 for(const name of ['app.js','files.js','styles.css','manifest.webmanifest','service-worker.js']){
  const source=await readFile(new URL('../ege/'+name,import.meta.url),'utf8');
  assert.doesNotMatch(source,/\.\.\/(?:vendor|js|icon|platform)/);
 }
});
test('corrections : livraison réelle, borne de 7 jours et date future refusée',()=>{
 const date=Date.parse('2026-10-30T12:00:00Z');const order={statut:'livre',date_livraison:new Date(date).toISOString()};
 assert(correctionOpen(order,date));assert(correctionOpen(order,date+7*86400000));
 for(const now of [date-1,date+7*86400000+1])assert(!correctionOpen(order,now));
 assert(!correctionOpen({...order,statut:'confirme'},date));assert(!correctionOpen({...order,date_livraison:null},date));
});
test('profil : téléphone normal et établissement obligatoire pour un élève',()=>{
 const p={nom:'Ali',prenom:'Test',whatsapp:'+253 77 00 00 00',statut_candidat:'scolarise',etablissement:'Lycée test'};
 assert.equal(validateProfile(p),p);assert.throws(()=>validateProfile({...p,etablissement:''}));assert.throws(()=>validateProfile({...p,whatsapp:'abc'}));
 assert.equal(wordCount(' un\n sujet  simple '),3);
});
test('un lien Word doit pointer vers le bucket privé signé du projet',()=>{
 const good='https://nwcatsmfbkcgvgbanwyl.supabase.co/storage/v1/object/sign/ege-word-prive/test.docx?token=test';
 assert.equal(safeDownload(good),good);
 for(const bad of ['javascript:alert(1)','https://evil.invalid/a.docx','https://nwcatsmfbkcgvgbanwyl.supabase.co/storage/v1/object/public/ege-word-prive/a.docx'])assert.throws(()=>safeDownload(bad));
});
test('le worker EGE ne capture ni API ni Word ni liens signés ni paramètres de session',async()=>{
 const handlers={};const self={registration:{scope:'https://example.invalid/ege/'},addEventListener:(k,f)=>handlers[k]=f};
 vm.runInNewContext(await readFile(new URL('../ege/service-worker.js',import.meta.url),'utf8'),{self,URL});
 let intercepted=0;
 for(const url of ['https://nwcatsmfbkcgvgbanwyl.supabase.co/rest/v1/ege_commandes','https://example.invalid/ege/private.docx','https://example.invalid/ege/?code=private','https://nwcatsmfbkcgvgbanwyl.supabase.co/storage/v1/object/sign/ege-word-prive/a.docx?token=x'])handlers.fetch({request:{method:'GET',url},respondWith(){intercepted++;}});
 assert.equal(intercepted,0);
});
