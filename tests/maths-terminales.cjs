const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setContent('<!doctype html><html><head></head><body><main id="app"></main></body></html>');
  await page.evaluate(()=>{window.st={user:{id:'fixture'},role:'eleve',screen:'student-learning'};window.MAChapters={native:()=>[{html:'<div>existing</div>'}],nativeHTML:rows=>rows.map(r=>r.html).join(''),choices:()=>['Ancien chapitre'],compare:(a,b)=>a.localeCompare(b),group:(rows,render)=>rows.map(render).join('')};});
  await page.addScriptTag({path:path.resolve(__dirname,'../js/maths-terminales.js')});
  await page.addScriptTag({path:path.resolve(__dirname,'../js/utilite-pratique.js')});
  const facts=await page.evaluate(()=>{
   const t=MAMathsTS,valid=t.variants.every(v=>v.steps.length>=3&&v.steps.every(s=>s.ask&&s.why&&t.correct(s.answer,s.answer)&&!t.correct('incorrect!',s.answer)));
   const scope={subject:'Mathématiques',level:'Terminale',series:'S'};
   return {chapters:t.chapters.length,parts:t.chapters.reduce((n,c)=>n+c.parts.length,0),variants:t.variants.length,guided:t.variants.filter(x=>x.d===0).length,valid,correctNegative:t.correct('−4','-4'),correctFraction:t.correct('3/2','1.5'),correctRoot:t.correct('√3',String(Math.sqrt(3))),differentSign:!t.correct('−∞','+∞'),native:MAChapters.native(scope,'guided').length,noLeak:MAChapters.native({...scope,series:'GFM'},'guided').length,usage:MAUtilite.resolve({subject:'Gestion financière',title:'TVA à décaisser'})};
  });
  assert.equal(facts.chapters,6);assert.equal(facts.parts,27);assert.equal(facts.variants,108);assert.equal(facts.guided,27);assert(facts.valid&&facts.correctNegative&&facts.correctFraction&&facts.correctRoot&&facts.differentSign);assert.equal(facts.native,7);assert.equal(facts.noLeak,1);assert.match(facts.usage,/TVA/);
  // Exercise each of the 27 guided tracks through every question and correction, using the real browser.
  for(let ci=0;ci<6;ci++){
   const parts=await page.evaluate(ci=>MAMathsTS.chapters[ci].parts.length,ci);
   for(let pi=0;pi<parts;pi++){
    await page.evaluate(ci=>MAMathsTS.open(ci,'guided'),ci);
    await page.locator('[data-mats=part]').nth(pi).click();
    assert(await page.locator('.mats-use').isVisible());
    await page.locator('[data-mats=start]').click();
    const steps=await page.evaluate(([ci,pi])=>MAMathsTS.variants.find(v=>v.ci===ci&&v.pi===pi&&v.d===0).steps,[ci,pi]);
    for(const step of steps){
     await page.locator('input[name=answer]').fill(step.answer);
     await page.locator('.mats-answer button').click();
     assert.equal(await page.locator('.mats-feedback').getAttribute('data-correct'),'true');
     await page.locator('[data-mats=next]').click();
    }
    assert.match(await page.locator('.mats-dialog main').innerText(),/Parcours terminé/);
    await page.locator('[data-mats=practice]').click();
    assert.equal(await page.locator('[data-mats=start]').count(),3);
    await page.locator('button[aria-label=Fermer]').click();
   }
  }
  for(const width of [320,390,768,1280]){
    await page.setViewportSize({width,height:860});
    await page.evaluate(()=>MAMathsTS.open(3,'learning'));
    await page.locator('[data-mats=part]').nth(3).click();
    await page.locator('[data-mats=start]').nth(3).click();
    const layout=await page.locator('.mats-dialog').evaluate(d=>({client:d.clientWidth,scroll:d.scrollWidth,inside:d.getBoundingClientRect().right<=innerWidth+1}));
    assert(layout.inside&&layout.scroll<=layout.client+1,JSON.stringify(layout));
    await page.locator('button[aria-label=Fermer]').click();
  }
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({facts,allGuidedTested:true,responsive:[320,390,768,1280],errors},null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
