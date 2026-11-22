function getSource(raw){return raw.slice(raw.indexOf("\r\n\r\n")+4,raw.lastIndexOf("\r\n--"))}function jsonString(src,start){let e=false;for(let i=start+1;i<src.length;i++){const c=src[i];if(e)e=false;else if(c==="\\")e=true;else if(c==='"')return {start,end:i+1,value:JSON.parse(src.slice(start,i+1))}}throw Error("unclosed")}function last(src,path){const a="assets["+JSON.stringify(path)+"][2]=";const i=src.lastIndexOf(a);if(i<0)throw Error(path);return jsonString(src,i+a.length)}function asset(src,path){const a="assets["+JSON.stringify(path)+"]=";const i=src.lastIndexOf(a);const key=JSON.stringify(path)+":";const j=src.indexOf(key);if(i<0&&j<0)throw Error(path);const start=i>=0?i+a.length:j+key.length;let end=start,q=false,e=false;for(;end<src.length;end++){const c=src[end];if(q){if(e)e=false;else if(c==="\\")e=true;else if(c==='"')q=false}else if(c==='"')q=true;else if(c===']')break}return {start,end:end+1,value:JSON.parse(src.slice(start,end+1))}}
function patchGuide(s){
 const change=(a,b)=>{if(s.split(a).length!==2)throw Error("guide anchor "+a.slice(0,100));s=s.replace(a,()=>b)};
 change("const stages=['Pourcentages','Cumul croissant','Cumul décroissant','Acheteurs potentiels','Tracer le graphique','Interpréter'];","const stages=['Trop cher — pourcentages','Trop cher — cumul croissant','Moins cher — pourcentages et cumul','Acheteurs potentiels','Tracer le graphique','Interpréter'];");
 change("const cols=[{key:'hp',label:'Trop cher (%)'},{key:'lp',label:'Qualité insuff. (%)'},{key:'hc',label:'Cumul croissant (%)'},{key:'lc',label:'Cumul décroissant (%)'},{key:'buyers',label:'Acheteurs potentiels (%)'}];","const cols=[{key:'high',label:'Trop cher (effectif)',raw:true},{key:'hp',label:'Pourcentage (%)',aria:'Trop cher — pourcentage'},{key:'hc',label:'Cumul croissant (%)'},{key:'low',label:'Moins cher (effectif)',raw:true},{key:'lp',label:'Pourcentage (%)',aria:'Moins cher — pourcentage'},{key:'lc',label:'Cumul décroissant (%)'},{key:'buyers',label:'Acheteurs potentiels (%)'}];");
 change(" const eligible=()=>"," const legacyTasks=tasks.slice();legacyTasks.forEach((t,i)=>{t.stableId=i;if(t.kind==='cell'&&t.col==='lp')t.stage=2;});const order=['hp','hc','lp','lc','buyers'];const orderedTasks=[...legacyTasks.filter(t=>t.kind==='cell').sort((a,b)=>order.indexOf(a.col)-order.indexOf(b.col)||a.stableId-b.stableId),...legacyTasks.filter(t=>t.kind!=='cell')];\n function restoreTasks(ids){const done=new Set(ids);const finished=orderedTasks.filter(t=>done.has(t.stableId));tasks.splice(0,tasks.length,...finished,...orderedTasks.filter(t=>!done.has(t.stableId)));n=finished.length;}\n const eligible=()=>");
 const old="const storageKey=()=>`monavenir-prix-guide-v1:${owner}`;\n function sync(){let uid=eligible()?String(st.user.id):'';if(uid===owner)return;owner=uid;n=0;try{const saved=Number(localStorage.getItem(storageKey()));if(Number.isInteger(saved)&&saved>=0&&saved<=tasks.length)n=saved;}catch{}}\n function save(){if(owner)try{localStorage.setItem(storageKey(),String(n));}catch{}}";
 const fresh="const storageKey=()=>`monavenir-prix-guide-v2:${owner}`;\n function sync(){let uid=eligible()?String(st.user.id):'';if(uid===owner)return;owner=uid;let ids=[];try{const v2=localStorage.getItem(storageKey());if(v2!==null){const parsed=JSON.parse(v2);if(Array.isArray(parsed))ids=parsed.filter(x=>Number.isInteger(x)&&x>=0&&x<legacyTasks.length);}else{const saved=Number(localStorage.getItem('monavenir-prix-guide-v1:'+owner));if(Number.isInteger(saved)&&saved>=0&&saved<=legacyTasks.length)ids=legacyTasks.slice(0,saved).map(t=>t.stableId);}}catch{}restoreTasks(ids);}\n function save(){if(owner)try{localStorage.setItem(storageKey(),JSON.stringify(tasks.slice(0,n).map(t=>t.stableId)));}catch{}}";
 change(old,fresh);
 change('<th scope="col">Trop cher (effectif)</th><th scope="col">Qualité insuff. (effectif)</th>${cols.map','${cols.map');
 change('<td>${high[i]}</td><td>${low[i]}</td>${cols.map(c=>{const key=', '${cols.map(c=>{if(c.raw)return `<td>${data[c.key][i]}</td>`;const key=');
 change("E(c.label+' à '+fmt(p)+' FDJ')","E((c.aria||c.label)+' à '+fmt(p)+' FDJ')");
 change('<td>200</td><td>200</td>${cols.map(c=>`<td>${[\'hp\',\'lp\'].includes(c.key)','${cols.map(c=>`<td>${c.raw?fmt(N):[\'hp\',\'lp\'].includes(c.key)');
 change("t.stage===0?'Divise l’effectif indiqué par 200, puis multiplie par 100.':t.stage===1?", "['hp','lp'].includes(t.col)?'Divise l’effectif indiqué par 200, puis multiplie par 100.':t.col==='hc'?");
 change("t.stage===2?'Pars du plus grand", "t.col==='lc'?'Pars du plus grand");
 change("if(a==='confirm-reset'){n=0;save();","if(a==='confirm-reset'){restoreTasks([]);save();");
 change("wrap.scrollLeft=Math.max(0,active.offsetLeft-wrap.offsetLeft-wrap.clientWidth/2+active.clientWidth/2);","const pinned=wrap.querySelector('tbody th');const w=pinned?.getBoundingClientRect().width||0;const left=active.getBoundingClientRect().left-wrap.getBoundingClientRect().left+wrap.scrollLeft;wrap.scrollLeft=Math.max(0,left-w-Math.max(0,(wrap.clientWidth-w-active.getBoundingClientRect().width)/2));");
 change("main.scrollTop=prev;const active=main.querySelector", "main.scrollTop=prev;scrollActive();}\n function scrollActive(){const main=dlg?.querySelector('main');if(!main)return;const active=main.querySelector");
 change("render();dlg.showModal();", "render();dlg.showModal();scrollActive();");
 change(".mpg-table tbody th{background:#f8fafc;position:sticky;left:0;z-index:1}", ".mpg-table tbody th{background:#f8fafc;position:sticky;left:0;z-index:2}.mpg-table thead th:first-child{position:sticky;left:0;z-index:2;background:#fff1f2}");
 return s;
}
function patchLegacy(s){
 const change=(a,b)=>{if(s.split(a).length!==2)throw Error("legacy anchor "+a.slice(0,100));s=s.replace(a,()=>b)};
 change("const headers=['Prix (FDJ)','Effectif A','Effectif B','% A','% B','CCD A','CCC B','Acheteurs %'];","const headers=['Prix (FDJ)','Trop cher (effectif)','Pourcentage (%)','Cumul croissant (%)','Moins cher (effectif)','Pourcentage (%)','Cumul décroissant (%)','Acheteurs potentiels (%)'];const headerNames={b:'Trop cher — pourcentage',ccc:'Cumul croissant',a:'Moins cher — pourcentage',ccd:'Cumul décroissant',accept:'Acheteurs potentiels'};");
 change("table(headers.slice(0,3),d.prices.map((p,i)=>[money(p),d.a[i],d.b[i]]))","table([headers[0],headers[1],headers[4]],d.prices.map((p,i)=>[money(p),d.b[i],d.a[i]]))");
 change("[money(r.price),d.a[i],d.b[i],money(r.a),money(r.b),money(r.ccd),money(r.ccc),money(r.accept)]","[money(r.price),d.b[i],money(r.b)+' %',money(r.ccc)+' %',d.a[i],money(r.a)+' %',money(r.ccd)+' %',money(r.accept)+' %']");
 change("cols=['a','b','ccd','ccc','accept']","cols=['b','ccc','a','ccd','accept']");
 change('<td>${d.a[i]}</td><td>${d.b[i]}</td>${cols.map(c=>{const k=i+\'-\'+c,v=gridAnswers[k];return `<td><input aria-label="${headers[cols.indexOf(c)+3]}, ${r.price} FDJ" name="${k}" inputmode="decimal" required value="${E(v?.value||\'\')}" class="${v?(v.ok?\'mapr-correct\':\'mapr-error\'):\'\'}"></td>`;}).join(\'\')}','<td>${d.b[i]}</td>${cols.map(c=>{const k=i+\'-\'+c,v=gridAnswers[k];return `${c===\'a\'?`<td>${d.a[i]}</td>`:\'\'}<td><span class="mapr-pct-field"><input aria-label="${headerNames[c]}, ${r.price} FDJ" name="${k}" inputmode="decimal" required value="${E(String(v?.value??\'\').replace(/\\s*%$/,\'\'))}" class="${v?(v.ok?\'mapr-correct\':\'mapr-error\'):\'\'}"><span aria-hidden="true">%</span></span></td>`;}).join(\'\')}');
 change("window.MAPrixPsychologique={card,nativeCard,open,calc,datasets,questions,lessons,numberEqual,matches};", "const layout=document.createElement('style');layout.textContent='.mapr-table th:first-child,.mapr-table td:first-child{position:sticky;left:0;background:#f8fafc;z-index:1}.mapr-pct-field{display:block;position:relative;min-width:76px}.mapr-pct-field input{box-sizing:border-box;width:100%;padding-right:24px!important}.mapr-pct-field>span{position:absolute;right:7px;top:50%;transform:translateY(-50%);pointer-events:none;color:#a40e33;font-weight:700}';document.head.append(layout);window.MAPrixPsychologique={card,nativeCard,open,calc,datasets,questions,lessons,numberEqual,matches};");
 return s;
}
function patchWorker(src){
 const html=last(src,"/app-2027.html"),sw=last(src,"/service-worker-ege-2027.js");
 const paths=[...html.value.matchAll(/<script[^>]*src="([^"?]+\.js)/g)].map(m=>m[1]).filter(x=>x.includes("guided-hub-v1.js"));
 const reg=paths.find(x=>x.includes("chapters-prix-percent")),learn=paths.find(x=>x.includes("learning-chapters-amort")),inter=paths.find(x=>x.includes("interactive-chapters-amort"));
 if(!reg||!learn||!inter)throw Error("active assets not found");
 let hp=html.value,sp=sw.value,edits=[],out=[];
 for(const p of [reg,learn,inter]){
   const a=asset(src,p),old=a.value[2];let next,block;
   if(p===reg){const end=old.indexOf("window.MAPrixGuide=");if(end<0)throw Error("Missing guide");const boundary=old.indexOf("})();",end)+5;block=patchGuide(old.slice(0,boundary));next=block+old.slice(boundary);}
   else{const start=old.indexOf("if (!window.MAPrixPsychologique)"),end=old.indexOf("window.MAPrixPsychologique=",start),boundary=old.indexOf("})();",end)+5;if(start<0||end<0||boundary<5)throw Error("Legacy missing");block=patchLegacy(old.slice(start,boundary));next=old.slice(0,start)+block+old.slice(boundary);}
   const alias=p.replace(/\.js$/,"-colonnes-v2.js");if(src.includes(alias)||hp.split(p).length!==2||!sp.includes(p)||src[a.end]!==";")throw Error("Unexpected active asset: "+p);
   hp=hp.replace(p,alias);sp=sp.replaceAll(p,alias);
   // Keep old route as an alias-compatible entry; only add one reference, not a copy of large content.
   const anchor='assets['+JSON.stringify(p)+']=';const start=a.start-anchor.length;if(src.slice(start,a.start)!==anchor)throw Error('Active assignment mismatch');edits.push({start,end:a.end+1,value:'assets['+JSON.stringify(alias)+']='+JSON.stringify([a.value[0],false,next])+';\nassets['+JSON.stringify(p)+']=assets['+JSON.stringify(alias)+'];'});
   out.push({p,alias,block,content:next});
 }
 sp=sp.replace(/const CACHE='([^']+)'/,(_,v)=>"const CACHE='"+v+"-prix-colonnes-v2'");
 if(!sp.includes("-prix-colonnes-v2'"))throw Error("cache missing");
 edits.push({start:html.start,end:html.end,value:JSON.stringify(hp)},{start:sw.start,end:sw.end,value:JSON.stringify(sp)});
 for(const e of edits.sort((a,b)=>b.start-a.start))src=src.slice(0,e.start)+e.value+src.slice(e.end);
 return {source:src,out,html:hp,sw:sp};
}
export {patchWorker,patchGuide,patchLegacy};
