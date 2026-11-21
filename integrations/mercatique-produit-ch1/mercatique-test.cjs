const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
(async()=>{
  const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
  try{
    const page=await browser.newPage({viewport:{width:390,height:844}});
    const errors=[];
    page.on('pageerror',e=>errors.push(String(e)));
    await page.route('https://monavenir.test/**', async route=>{
      const url=new URL(route.request().url());
      if(url.searchParams.has('mac1img'))return route.fulfill({contentType:'image/webp',body:fs.readFileSync(path.join(__dirname,'mercatique-images','scene-'+url.searchParams.get('mac1img')+'.webp'))});
      return route.fulfill({contentType:'text/html',body:'<!DOCTYPE html><html><head></head><body><div id="entry"></div></body></html>'});
    });
    await page.goto('https://monavenir.test/');
    await page.evaluate(()=>{window.st={role:'eleve',user:{id:'test-student'}};window.scope={subject:'Mercatique',level:'Terminale',series:'GFM'};window.MASimple={scopeFor:()=>window.scope};});
    await page.addScriptTag({path:path.join(__dirname,'mercatique-ch1.js')});
    await page.evaluate(()=>{document.querySelector('#entry').innerHTML=window.MAMercaCh1.card(scope,'learn','chapitre 1');});
    assert.equal(await page.evaluate(()=>MAMercaCh1.lessons.length),5);
    assert.equal(await page.evaluate(()=>MAMercaCh1.exercises.length),7);
    assert.equal(await page.evaluate(()=>MAMercaCh1.card({...scope,series:'IAG'},'learn','')), '');
    await page.locator('[data-mac1-open]').click();
    await page.locator('[data-mac1-act=lessons]').click();
    assert.equal(await page.locator('[data-mac1-act^=lesson-]').count(),5);
    for(let i=0;i<5;i++){
      await page.locator('[data-mac1-act=lesson-'+i+']').click();
      assert.equal(await page.locator('dialog main img').count(),1);
      await page.locator('[data-mac1-act=mark]').click();
      if(i===4)await page.screenshot({path:'mercatique-mobile.png'});
      await page.locator('[data-mac1-act=home]').click();
      await page.locator('[data-mac1-act=lessons]').click();
    }
    await page.locator('[data-mac1-act=home]').click();
    await page.locator('[data-mac1-act=exercises]').click();
    await page.locator('[data-mac1-act=filter-2]').click();
    assert.equal(await page.locator('[data-mac1-act^=exercise-]').count(),2);
    await page.locator('[data-mac1-act=filter--1]').click();
    assert.equal(await page.locator('[data-mac1-act^=exercise-]').count(),7);
    for(let i=0;i<7;i++){
      await page.locator('[data-mac1-act=exercise-'+i+']').click();
      const questions=await page.evaluate(i=>MAMercaCh1.exercises[i].qs,i);
      for(let j=0;j<questions.length;j++){
        const q=questions[j];
        if(q.options)await page.locator('input[name=q'+j+']').nth(q.options.indexOf(q.a)).check();
        else await page.locator('[name=q'+j+']').fill(q.manual?'Une réponse argumentée avec les données du dossier.':String(q.a));
      }
      await page.locator('[data-mac1-form] button[type=submit]').click();
      assert.equal(await page.locator('.mac1-feedback.bad').count(),0);
      assert.equal(await page.locator('.mac1-feedback.good').count(),questions.filter(q=>!q.manual).length);
      await page.locator('[data-mac1-act=exercises]').click();
    }
    const data=await page.evaluate(()=>JSON.parse(localStorage.getItem('monavenir-merca-ch1-v1:test-student')));
    assert.equal(data.done.length,5);assert.equal(Object.keys(data.results).length,7);
    await page.locator('[data-mac1-act=home]').click();
    assert.equal(await page.locator('progress').getAttribute('value'),'12');
    await page.setViewportSize({width:1280,height:800});
    await page.screenshot({path:'mercatique-desktop.png'});
    assert.deepEqual(errors,[]);
    console.log('PASS: 5 fiches, 7 exercices, niveaux, réponses, progression, filtrage de série et interface adaptative.');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
