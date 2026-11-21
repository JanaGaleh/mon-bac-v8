/* Shared MonAvenir reading standard: documents, never navigation icons. */
(() => {
  'use strict';
  if(window.MADocZoom)return;
  const selectors=[
    'svg[role="img"][viewBox]','svg[data-ma-document]','figure svg[viewBox]','.mapr-curves','.mao-diagram svg','.mad-doc-svg','canvas[data-ma-document]','canvas[role="img"]',
    'figure img','img[data-ma-document]','img[role="img"]','.lr-media-preview img','.mbi-media-item img','.mad-doc img','.paper img','.study-paper img','.document-preview img','.annexe-preview img',
    '.mapr-chart','.mad-doc-text','article.paper','.study-paper','[data-ma-document-text]','table:not([role="presentation"])',
    'iframe[data-ma-document]','iframe[src*=".pdf"]','object[type="application/pdf"]','embed[type="application/pdf"]'
  ].join(',');
  const ignored='.madoc-dialog,.madoc-tools,.lr-document,.mapr-product,nav,button,a,[role="button"],.monavenir-labo,.laboratoire,.spreadsheet,.sheet-grid,.tableur-grid,[role="grid"],.mbi-media-box details,.avatar,.brand,.logo,.banner,.side-hint,.mb72-ad';
  const seen=new WeakSet();
  let viewer=null,queued=false;
  const element=(tag,attrs={},text='')=>{const e=document.createElement(tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);if(text)e.textContent=text;return e;};
  const label=(node)=>node.getAttribute('aria-label')||node.getAttribute('alt')||node.querySelector('caption')?.textContent||node.closest('figure')?.querySelector('figcaption')?.textContent||node.closest('.mapr-panel,.mao-panel,.mad-doc')?.querySelector('h3,strong')?.textContent||'Document pédagogique';
  const control=(text,title,fn)=>{const b=element('button',{type:'button',class:'madoc-btn','aria-label':title,title},text);b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();fn();});return b;};
  const dynamic=node=>node.matches('iframe,embed,object')||!!node.querySelector('input,select,textarea,button,[contenteditable="true"]');
  const graphical=node=>node.matches('svg,img,canvas,.mapr-chart');
  function prepareTable(node){
    node.classList.add('madoc-readable-table');
    let wrap=node.parentElement;
    if(!wrap)return node;
    if(!wrap.matches('.mapr-table,.mbi-table-wrap,.mad-doc-table-wrap,.madoc-scroll,.mao-table,.lr-word')&&!(getComputedStyle(wrap).overflowX==='auto'||getComputedStyle(wrap).overflowX==='scroll')){
      const container=element('div',{class:'madoc-scroll',role:'region','aria-label':'Tableau défilable',tabindex:'0'});wrap.insertBefore(container,node);container.append(node);wrap=container;
    }
    wrap.classList.add('madoc-table-wrap');return wrap;
  }
  function attachInline(node,anchor,tools){
    let z=1;const readout=element('output',{'aria-live':'polite',class:'madoc-percent'},'100%');
    function set(value){z=Math.max(.75,Math.min(3,value));node.style.zoom=String(z);readout.textContent=Math.round(z*100)+'%';}
    tools.append(control('−','Réduire le document',()=>set(z-.25)),readout,control('+','Agrandir le document',()=>set(z+.25)),control('Ajuster','Taille normale',()=>set(1)));
    if(node.matches('iframe,object,embed'))anchor.classList.add('madoc-embedded');
  }
  function cloneDocument(node){
    if(node.matches('canvas')){const copy=element('canvas');copy.width=node.width;copy.height=node.height;try{copy.getContext('2d').drawImage(node,0,0);}catch{}return copy;}
    const copy=node.cloneNode(true);const all=[copy,...copy.querySelectorAll('*')];
    // Make cloned reading material inert; never clone a live form or add a download action.
    for(const e of all){for(const a of [...e.attributes])if(/^on/i.test(a.name)||['autofocus','contenteditable','formaction','tabindex'].includes(a.name))e.removeAttribute(a.name);if(e.matches('a'))e.removeAttribute('href');if(!e.closest('svg'))e.removeAttribute('id');}
    for(const e of copy.querySelectorAll('.madoc-tools,script,iframe,object,embed'))e.remove();
    copy.classList.add('madoc-copy');return copy;
  }
  function open(node,origin){
    if(viewer||!node.isConnected)return;
    const dialog=element('dialog',{class:'madoc-dialog','aria-label':'Lecteur de document'}),head=element('header',{class:'madoc-head'}),title=element('strong',{},label(node)),bar=element('div',{class:'madoc-zoom-bar'}),stage=element('div',{class:'madoc-stage',tabindex:'0','aria-label':'Document à lire et à agrandir'}),content=element('div',{class:'madoc-content'}),copy=cloneDocument(node),value=element('output',{class:'madoc-percent','aria-live':'polite'},'100%');
    let zoom=1,base=320,pinch=null;
    function scale(z){zoom=Math.max(.5,Math.min(4,z));content.style.zoom=String(zoom);value.textContent=Math.round(zoom*100)+'%';}
    const fit=()=>{base=Math.max(180,stage.clientWidth-24);if(node.matches('table'))base=Math.max(base,node.scrollWidth||0,280);content.style.width=base+'px';scale(1);stage.scrollTop=0;stage.scrollLeft=0;};
    const close=()=>{if(viewer!==dialog)return;viewer=null;dialog.close();dialog.remove();if(origin?.isConnected)origin.focus();};
    head.append(title,control('×','Fermer le document',close));
    bar.append(control('−','Zoom arrière',()=>scale(zoom-.25)),value,control('+','Zoom avant',()=>scale(zoom+.25)),control('Ajuster','Ajuster à la largeur',fit));
    content.append(copy);stage.append(content);dialog.append(head,bar,stage);document.body.append(dialog);viewer=dialog;
    dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
    dialog.addEventListener('keydown',e=>{if(e.key==='+'||e.key==='='){e.preventDefault();scale(zoom+.25);}if(e.key==='-'){e.preventDefault();scale(zoom-.25);}if(e.key==='0'){e.preventDefault();fit();}});
    stage.addEventListener('touchstart',e=>{if(e.touches.length===2){const [a,b]=e.touches;pinch={gap:Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY),zoom};}},{passive:true});
    stage.addEventListener('touchmove',e=>{if(e.touches.length===2&&pinch?.gap>0){e.preventDefault();const [a,b]=e.touches;scale(pinch.zoom*Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY)/pinch.gap);}},{passive:false});
    stage.addEventListener('touchend',()=>{pinch=null;},{passive:true});
    dialog.showModal();fit();stage.focus({preventScroll:true});
  }
  function enhance(node){
    if(seen.has(node)||!node.isConnected||node.closest(ignored)||node.matches('img[alt=""]:not([data-ma-document])'))return;
    if(node.matches('table')&&node.closest('table')!==node)return;
    if(node.matches('table')&&node.parentElement?.closest('table'))return;
    seen.add(node);
    let anchor=node;
    if(node.matches('svg'))node.classList.add('madoc-readable-svg');
    if(node.matches('img'))node.classList.add('madoc-readable-image');
    if(node.matches('table'))anchor=prepareTable(node);
    if(node.matches('iframe,embed,object')){node.classList.add('madoc-readable-embed');anchor=node;}
    const tools=element('div',{class:'madoc-tools','aria-label':'Commandes du document'});
    if(dynamic(node))attachInline(node,anchor,tools);
    else{const b=control('Agrandir ⤢','Agrandir le document',()=>open(node,b));tools.append(b);if(graphical(node))node.addEventListener('click',()=>open(node,b));}
    anchor.insertAdjacentElement('afterend',tools);
  }
  function scan(){queued=false;document.querySelectorAll(selectors).forEach(enhance);}
  function schedule(){if(!queued){queued=true;requestAnimationFrame(scan);}}
  async function renderAttachment(host,ext,url){
    if(ext!=='pdf'||!host?.isConnected||host.querySelector('.madoc-pdf'))return;
    const target=new URL(url,location.href);if(target.protocol!=='https:')return;
    const box=element('section',{class:'madoc-pdf','aria-label':'Aperçu du document PDF'}),status=element('p',{role:'status'},'Chargement du PDF…'),bar=element('div',{class:'madoc-tools'}),scroll=element('div',{class:'madoc-pdf-scroll'});
    box.append(status,bar,scroll);host.prepend(box);
    try{
      const pdfjs=await import(new URL('/vendor/mon-bac-pdf-5.6.205.mjs',location.href).href);pdfjs.GlobalWorkerOptions.workerSrc=new URL('/vendor/mon-bac-pdf-worker-5.6.205.mjs',location.href).href;
      const pdf=await pdfjs.getDocument({url:target.href}).promise;if(!box.isConnected){await pdf.destroy();return;}
      let page=1,zoom=1,seq=0;const value=element('output',{class:'madoc-percent','aria-live':'polite'});
      async function paint(){const token=++seq,pg=await pdf.getPage(page),base=pg.getViewport({scale:1}),w=Math.max(220,scroll.clientWidth-8),vp=pg.getViewport({scale:w/base.width*zoom}),c=element('canvas'),ratio=Math.min(devicePixelRatio||1,2);c.width=Math.round(vp.width*ratio);c.height=Math.round(vp.height*ratio);c.style.width=vp.width+'px';c.style.height=vp.height+'px';await pg.render({canvasContext:c.getContext('2d'),viewport:vp,transform:ratio===1?null:[ratio,0,0,ratio,0,0]}).promise;if(token===seq&&box.isConnected){scroll.replaceChildren(c);value.textContent=`${page}/${pdf.numPages} · ${Math.round(zoom*100)}%`;status.textContent='';}}
      const change=fn=>()=>{fn();paint().catch(()=>{status.textContent='Aperçu indisponible. Utilisez le lien d’ouverture ci-dessous.';});};
      bar.append(control('‹','Page précédente',change(()=>{page=Math.max(1,page-1)})),control('−','Réduire',change(()=>{zoom=Math.max(.5,zoom-.25)})),value,control('+','Agrandir',change(()=>{zoom=Math.min(3,zoom+.25)})),control('Ajuster','Ajuster le PDF à la largeur',change(()=>{zoom=1})),control('›','Page suivante',change(()=>{page=Math.min(pdf.numPages,page+1)})));await paint();
    }catch{if(box.isConnected)status.textContent='Aperçu indisponible. Utilisez le lien d’ouverture ci-dessous.';}
  }
  const observer=new MutationObserver(mutations=>{if(mutations.some(m=>[...m.addedNodes].some(n=>n.nodeType===1&&!n.matches?.('.madoc-tools,.madoc-dialog')&&!n.closest?.('.madoc-dialog,.madoc-tools'))))schedule();});
  function start(){scan();observer.observe(document.body,{childList:true,subtree:true});}
  if(document.body)start();else document.addEventListener('DOMContentLoaded',start,{once:true});
  window.MADocZoom={scan,open,renderAttachment};
})();
