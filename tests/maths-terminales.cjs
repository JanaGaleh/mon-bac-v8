const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),headless:true});
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
  // Verify the actual chapter-card click, filtering and dialog navigation.
  await page.evaluate(()=>{
   const scope={subject:'Mathématiques',level:'Terminale',series:'S'};
   document.querySelector('#app').innerHTML=MAChapters.nativeHTML(MAChapters.native(scope,'guided'));
  });
  assert.equal(await page.locator('[data-mats=open]').count(),6);
  await page.locator('[data-mats=open]').first().click();
  await page.locator('[data-mats=part]').first().click();
  await page.locator('[data-mats=start]').click();
  await page.locator('input[name=answer]').fill('incorrect');
  await page.locator('.mats-answer button').click();
  assert.equal(await page.locator('.mats-feedback').getAttribute('data-correct'),'false');
  await page.locator('button[aria-label=Fermer]').click();
  await page.locator('.mats-dialog').waitFor({state:'detached'});
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
    await page.locator('.mats-dialog').waitFor({state:'detached'});
   }
  }
  // Every interactive track and every one of its questions: actual DOM event path.
  const total=await page.evaluate(async()=>{
   let tested=0,questions=0;
   const click=(selector,index=0)=>document.querySelectorAll(selector)[index].click();
   function check(value,message){if(!value)throw Error(message);}
   for(const v of MAMathsTS.variants.filter(v=>v.d!==0)){
    MAMathsTS.open(v.ci,'interactive');
    click('[data-mats=part]',v.pi);
    check(document.querySelectorAll('[data-mats=start]').length===3,'Difficultés manquantes');
    click('[data-mats=start]',v.d-1);
    for(const step of v.steps){
     const form=document.querySelector('.mats-answer');
     form.elements.answer.value=step.answer;form.requestSubmit();
     check(document.querySelector('.mats-feedback').dataset.correct==='true','Correction '+v.ci+'/'+v.pi+'/'+v.d);
     click('[data-mats=next]');questions++;
    }
    check(document.querySelector('.mats-dialog main').textContent.includes('Parcours terminé'),'Résultat absent');
    const dialog=document.querySelector('.mats-dialog');
    const closed=new Promise(resolve=>dialog.addEventListener('close',resolve,{once:true}));
    click('button[aria-label=Fermer]');await closed;tested++;
   }return {tested,questions};
  });
  assert.equal(total.tested,81);assert.equal(total.questions,324);
  for(const width of [320,390,768,1280]){
    await page.setViewportSize({width,height:860});
    await page.evaluate(()=>MAMathsTS.open(3,'learning'));
    await page.locator('[data-mats=part]').nth(3).click();
    await page.locator('[data-mats=start]').nth(3).click();
    const layout=await page.locator('.mats-dialog').evaluate(d=>({client:d.clientWidth,scroll:d.scrollWidth,inside:d.getBoundingClientRect().right<=innerWidth+1}));
    assert(layout.inside&&layout.scroll<=layout.client+1,JSON.stringify(layout));
    await page.locator('button[aria-label=Fermer]').click();
    await page.locator('.mats-dialog').waitFor({state:'detached'});
  }
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({facts,allGuidedTested:true,interactive:total,responsive:[320,390,768,1280],errors},null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
