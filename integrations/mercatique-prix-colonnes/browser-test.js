function qa(){
 const $=s=>document.querySelector(s),out=$('#qa'),checks=[],scope={subject:'Mercatique',level:'Terminale',series:'GFM'};
 function check(v,m){if(!v)throw Error(m);checks.push(m)}
 const headers=['Prix (FDJ)','Trop cher (effectif)','Pourcentage (%)','Cumul croissant (%)','Moins cher (effectif)','Pourcentage (%)','Cumul décroissant (%)','Acheteurs potentiels (%)'];
 const clean=s=>s.replace(/\s+/g,' ').trim();
 const header=(sel)=>Array.from(document.querySelectorAll(sel+' thead th')).map(x=>clean(x.textContent));
 function show(){const m=$('#mount');m.innerHTML=window.MAPrixGuide.nativeCard(scope);m.querySelector('[data-mpg-open]').click()}
 function progress(){return Number($('.mpg-dialog progress').value)}
 function submit(v){const f=$('.mpg-dialog form'),t=window.MAPrixGuide.tasks[progress()];if(t.kind==='axis')f.querySelector(`input[name="answer"][value="${v}"]`).checked=true;else{const input=f.querySelector('[data-mpg-answer]');input.value=String(v);input.dispatchEvent(new Event('input',{bubbles:true}));}f.requestSubmit()}
 function close(){const d=$('.mpg-dialog');d.close();d.dispatchEvent(new Event('close'))}
 try {
  const mod=window.MAPrixGuide;check(mod.data.buyers.join(',')==='0,40,60,50,0','buyer calculations unchanged');show();check(JSON.stringify(header('.mpg-table'))===JSON.stringify(headers),'eight headers in required order');
  check(mod.tasks.slice(0,25).map(t=>t.col).filter((c,i,a)=>i===0||c!==a[i-1]).join(',')==='hp,hc,lp,lc,buyers','logical task order');
  check($('.mpg-active input').closest('td').cellIndex===2,'first editable percentage column');
  const r=$('.mpg-table tbody tr');check(r.cells[1].textContent==='0'&&r.cells[4].textContent==='90','effectifs correctly aligned');
  submit(0);check(progress()===1&&$('.mpg-table .mpg-done').textContent==='0 %','accepted cell and % suffix');
  while(progress()<25){const t=mod.tasks[progress()];check($('.mpg-active').cellIndex===({hp:2,hc:3,lp:5,lc:6,buyers:7}[t.col]),'active column '+progress());const active=$('.mpg-active').getBoundingClientRect(),wrap=$('.mpg-table-wrap').getBoundingClientRect(),pinned=$('.mpg-table tbody th').getBoundingClientRect();check(active.left>=pinned.right-2&&active.right<=wrap.right+2,'active visible '+progress());submit(t.expected)}
  check(progress()===25,'all 25 cells');check(JSON.parse(localStorage.getItem('monavenir-prix-guide-v2:fresh')).length===25,'new persistent stable task ids');
  while(progress()<48){const t=mod.tasks[progress()];if(t.kind==='link')$('[data-mpg-act="link"]').click();else submit(t.expected)}
  check(progress()===48&&$('.mpg-complete').textContent.includes('2 000 FDJ'),'48 validations and correct price');check(JSON.stringify(header('.mpg-table'))===JSON.stringify(headers),'corrected table same column order');const final=$('.mpg-table tbody tr:nth-child(3)');check(Array.from(final.cells).map(x=>clean(x.textContent)).join('|')==='2 000|20|10 %|15 %|30|15 %|25 %|60 %','corrected row values');close();
  st.user.id='migration';localStorage.setItem('monavenir-prix-guide-v1:migration','10');show();check(progress()===10,'legacy 10 steps retained');check(document.querySelectorAll('.mpg-table .mpg-done').length===10,'all 10 validated cells retained');check(mod.tasks[10].col==='hc','next task logically resumed');check($('.mpg-table tbody tr').cells[5].textContent==='45 %','prior low percentage retained');submit(mod.tasks[10].expected);check(progress()===11,'migration progress advances');close();
  st.user.id='other';show();close();st.user.id='migration';show();check(progress()===11,'new save resumes after account change');$('[data-mpg-act="restart"]').click();$('[data-mpg-act="confirm-reset"]').click();check(progress()===0&&mod.tasks[0].col==='hp','restart resets only exercise');close();
  const legacy=window.MAPrixPsychologique;$('#mount').innerHTML=legacy.card(scope,'all','');$('#mount button').click();$('[data-mapr-act="table"]').click();check(JSON.stringify(header('.mapr-table'))===JSON.stringify(headers),'legacy interactive table same headers');const lr=$('.mapr-table tbody tr'),d=legacy.datasets[1],computed=legacy.calc(d);check(lr.cells[1].textContent===String(d.b[0])&&lr.cells[4].textContent===String(d.a[0]),'legacy correct effectifs');check(Array.from(lr.querySelectorAll('input')).map(x=>x.name).join(',')==='0-b,0-ccc,0-a,0-ccd,0-accept','legacy fields align with correct answers');check(lr.querySelectorAll('.mapr-pct-field').length===5,'legacy percentage signs automatic');for(const input of $('.mapr-dialog form').querySelectorAll('input')){const [i,k]=input.name.split('-');input.value=String(computed[Number(i)][k]);}$('.mapr-dialog form').requestSubmit();check($('.mapr-dialog [role="status"]').textContent.includes('25/25'),'legacy correction validates all cells');check(JSON.stringify(header('.mapr-dialog details .mapr-table'))===JSON.stringify(headers),'legacy corrected table same headers');
  out.textContent=JSON.stringify({ok:true,checks:checks.length,viewport:innerWidth});
 }catch(e){out.textContent=JSON.stringify({ok:false,error:e.message,checks,scriptErrors:window.qaErrors||[]});}out.dataset.status='done';
}
qa();