const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const path=require('node:path');
(async()=>{
  const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  for(const size of [{width:390,height:844},{width:768,height:1024},{width:1440,height:900}]){
    const p=await browser.newPage({viewport:size});
    const errors=[];p.on('pageerror',e=>errors.push(e.message));
    await p.route('https://monavenir.test/',r=>r.fulfill({contentType:'text/html',body:'<!DOCTYPE html><html lang="fr"><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><main id="root"></main></body></html>'}));
    await p.goto('https://monavenir.test/');
    await p.evaluate(()=>{window.st={role:'eleve',user:{id:'test-local'}};window.scope={subject:'Gestion financière',level:'Terminale',series:'GFM'};});
    await p.addScriptTag({path:path.resolve(__dirname,'monavenir-gf-ch2.js')});
    await p.evaluate(()=>document.getElementById('root').innerHTML=window.MAGFCh2.card(window.scope,'all',''));
    await p.locator('[data-maam-open]').click();
    const click=async a=>p.locator('[data-maam-action="'+a+'"]').first().click();
    await click('lessons');assert.equal(await p.locator('.maam-tile').count(),12);
    await click('lesson-6');assert.equal(await p.locator('table tbody tr').count(),5);
    await click('zoom-plus');assert.equal(await p.locator('.maam-scale').first().evaluate(e=>e.dataset.zoom),'1.25');
    await click('zoom-fit');await click('zoom-full');assert.equal(await p.locator('.maam-doc.full').count(),1);
    await p.locator('.maam-doc.full [data-maam-action="zoom-full"]').click();await click('mark');
    await click('home');await click('exercises');await click('level-2');
    await click('start-27');
    const fill=async()=>{const fs=await p.evaluate(()=>window.MAGFCh2.specs(window.MAGFCh2.questions[27]));for(const f of fs)await p.locator('input[name="'+f.key+'"]').fill(String(f.a));};
    await fill();await p.locator('[data-maam-form] button[type=submit]').click();assert.match(await p.locator('[role=status]').innerText(),/Excellent/);
    await click('variant');assert.match(await p.locator('.maam-chip').first().innerText(),/VERSION 2/);
    await click('home');await click('sim-compare');
    assert.equal(await p.locator('table').count(),2);
    await p.locator('[data-maam-sim=vo]').fill('2400000');
    assert.match(await p.locator('.maam-kpi').innerText(),/2.200.000/s);
    const bounds=await p.locator('dialog').boundingBox();assert.ok(bounds.x>=-1&&bounds.x+bounds.width<=size.width+1);
    await p.screenshot({path:'gf-ch2-'+size.width+'.png'});
    await click('home');await click('results');assert.match(await p.locator('.maam-main').innerText(),/1\/60/);
    await click('close');assert.equal(await p.locator('dialog').count(),0);
    assert.deepEqual(errors,[]);
    await p.close();console.log('OK',size.width,size.height);
  }
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
