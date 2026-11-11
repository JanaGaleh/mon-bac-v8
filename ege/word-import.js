/* EGE GFM 2027 — Importation locale d'un document Word .docx.
   Les données du fichier ne sont envoyées à aucun serveur.
   Les champs ambigus sont laissés à vérifier par le candidat. */
(function(){
'use strict';
const W_NS='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const ui=id=>document.getElementById(id);
const MAX_FILE=20*1024*1024,MAX_XML=5*1024*1024;
let pending=null;
const trim=x=>String(x??'').replace(/\u00a0/g,' ').replace(/\s+/g,' ').trim();
const normal=x=>trim(x).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’‘]/g,"'").replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const escape=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function notice(s,error){
 const el=ui('wordImportStatus');if(el){el.textContent=s;el.classList.toggle('error',!!error);}
}
function field(id,value){const el=ui(id);if(el)el.value=String(value??'');}
function fromWordXml(xml){
 const doc=new DOMParser().parseFromString(xml,'application/xml');
 if(doc.getElementsByTagName('parsererror').length)throw Error('Le texte du document Word est illisible.');
 const paragraphs=Array.from(doc.getElementsByTagNameNS(W_NS,'p'));
 if(!paragraphs.length)throw Error('Le Word ne contient aucun texte exploitable.');
 if(paragraphs.length>10000)throw Error('Ce Word contient trop de paragraphes pour une importation directe.');
 const items=paragraphs.map(p=>trim(Array.from(p.getElementsByTagNameNS(W_NS,'t')).map(t=>t.textContent).join(''))).filter(Boolean);
 if(items.join('').length<20)throw Error('Le document ne contient pas assez de texte. Les Word scannés sous forme d’images ne peuvent pas être reconnus automatiquement.');
 return items;
}
function fieldFromParagraphs(parts,labels){
 const max=Math.min(125,parts.length);
 const normalizedLabels=labels.map(normal);
 for(let i=0;i<max;i++){
  const text=parts[i],s=normal(text);
  for(const label of normalizedLabels){
   if(s===label){
    const next=parts[i+1]||'';
    if(next&&next.length<=600&&!/^(?:annexe\s*\d|titre$|source$|th[eè]me$|sous.th[eè]me$|probl[eé]matique$)/i.test(next))return trim(next);
   }
   const asText=normal(text.split(/[:：]/)[0]);
   if(asText===label&&/[:：]/.test(text)){
    const val=trim(text.substring(text.indexOf(':')+1));
    if(val.length>1&&val.length<=600)return val;
   }
  }
 }
 return '';
}
function matchTitle(text,options){
 const key=normal(text);
 if(!key)return -1;
 let index=options.findIndex(x=>normal(x)===key);
 if(index>=0)return index;
 // Only accept a strong unique match, to avoid assigning an unrelated official subject.
 const matches=options.map((x,i)=>({i,k:normal(x)})).filter(x=>x.k.length>15&&(key.includes(x.k)||x.k.includes(key))&&Math.min(key.length,x.k.length)/Math.max(key.length,x.k.length)>.80);
 return matches.length===1?matches[0].i:-1;
}
function annexHeading(text){
 if(/\.{2,}\s*page\s*\d+/i.test(text)||/page\s*\d+\s*$/i.test(text))return 0;
 const m=trim(text).match(/^annexe\s*(?:n[°ºo]\s*)?([1-4])(?:\s*[:\-–—.]\s*[\p{L} ]{0,75})?$/iu);
 return m?Number(m[1]):0;
}
function stopSection(text){
 const v=normal(text);
 return /^(?:entreprises potentielles|presentation de l organisation|presentation de l entreprise|organigramme|guide d entretien|tableau comparatif|synthese redigee|synthese de la visite|bibliographie|conclusion generale|partie ii\b|partie pratique\b)/.test(v);
}
function parseAnnexes(parts){
 const best={};
 let markers=[];
 for(let i=0;i<parts.length;i++){const n=annexHeading(parts[i]);if(n)markers.push({i,n});}
 for(const m of markers){
  let last=parts.length;
  const following=markers.find(x=>x.i>m.i);
  if(following)last=following.i;
  for(let i=m.i+1;i<last;i++){if(stopSection(parts[i])){last=i;break;}}
  let body=parts.slice(m.i+1,last);
  // Table of annexes inside the study sheet: ignore inventory content.
  if(body[0]&&normal(body[0])==='titre')continue;
  let source='';
  let lines=[];
  for(let i=0;i<body.length;i++){
   const raw=body[i],v=normal(raw);
   if(/^source\s*(?:[:：]|$)/i.test(raw)){
    let val=trim(raw.replace(/^sources?\s*[:：]?\s*/i,''));
    if(!val&&body[i+1]){val=trim(body[i+1]);i++;}
    if(val&&!/r[eé]f[eé]rence documentaire [aà] renseigner|[aà] compl[eé]ter|source non v[eé]rifi[eé]e/i.test(val))source=val.slice(0,1000);
    continue;
   }
   if(v==='titre'){i++;continue;}
   if(!lines.length&&raw.length<=165&&(!/[.!?]$/.test(raw)||/notions|comprendre|element|reponse/i.test(raw)))continue;
   if(/^\d+$/.test(raw)&&raw.length<=2)continue;
   lines.push(raw);
  }
  const text=lines.join('\n\n').trim().slice(0,30000);
  const score=text.length;
  if(score>0&&(!best[m.n]||score>best[m.n].score))best[m.n]={text,source,score};
 }
 return best;
}
function parseWord(parts){
 const candidate=fieldFromParagraphs(parts,['Candidat(e)','Candidat','Nom du candidat','Nom du candidat(e)','Noms des candidats'])||fieldFromParagraphs(parts,['Nom du candidat']);
 let student=candidate,partner='',className='';
 const classMark=student.match(/\s*[—–-]\s*((?:[1T]GFM|TGFM|[1T]OGRH)\s*\d+)\s*$/i);
 if(classMark){className=trim(classMark[1]);student=trim(student.slice(0,classMark.index));}
 if(!className){
  const other=fieldFromParagraphs(parts,['Nom du candidat','Nom du candidat(e)']);
  const match=other.match(/\s*[—–-]\s*((?:[1T]GFM|TGFM|[1T]OGRH)\s*\d+)\s*$/i);
  if(match)className=trim(match[1]);
 }
 if(!className){const v=fieldFromParagraphs(parts,['Classe','Classe du candidat']);if(v&&v.length<40)className=v;}
 const binome=/\s+et\s+/i.test(student)&&student.length<120;
 if(binome){const a=student.split(/\s+et\s+/i);student=trim(a[0]);partner=trim(a.slice(1).join(' et '));}
 const themeText=fieldFromParagraphs(parts,['Thème','Thème de gestion']);
 const subthemeText=fieldFromParagraphs(parts,['Sous-thème','Sous thème']);
 const themeIndex=matchTitle(themeText,CATALOG.map(x=>x.title));
 const subthemeIndex=themeIndex>=0?matchTitle(subthemeText,CATALOG[themeIndex].subthemes.map(x=>x.name)):-1;
 const annexes=parseAnnexes(parts);
 const mode=binome||annexes[4]?'binome':'individuel';
 const problem=fieldFromParagraphs(parts,['Problématique','Question de gestion','Question problématique']);
 const school=fieldFromParagraphs(parts,['Établissement','Etablissement','Lycée','Etablissement scolaire']);
 let teacher=fieldFromParagraphs(parts,['Professeur','Enseignant','Professeur encadrant']);
 if(/^[àa] pr[eé]ciser|^professeur/i.test(teacher))teacher='';
 const found=Object.values(annexes).filter(x=>x.text&&x.text.length>20).length;
 const notes=[];
 if(themeText&&themeIndex<0)notes.push('Le thème du Word ne correspond pas exactement au référentiel GFM 2026–2027 : choisis le thème officiel.');
 if(subthemeText&&subthemeIndex<0)notes.push('Le sous-thème doit être vérifié et choisi dans la liste officielle.');
 if(!found)notes.push('Aucune annexe numérotée n’a pu être reconnue automatiquement : tu peux affecter le texte à l’annexe 1.');
 if(problem&&problem.trim().split(/\s+/).length>21)notes.push('La problématique importée dépasse 21 mots : reformule-la après importation.');
 const evidence=parts.join('\n').slice(0,45000);
 return {student,partner,className,school,teacher,themeText,subthemeText,themeIndex,subthemeIndex,problem,mode,annexes,found,notes,evidence};
}
function addOption(select,value,label){
 const opt=document.createElement('option');opt.value=String(value);opt.textContent=label;select.append(opt);
}
function updateSubjectOptions(selected){
 const theme=ui('wordImportTheme'),sub=ui('wordImportSubtheme');
 if(!theme||!sub)return;
 const index=Number(theme.value);
 sub.replaceChildren();addOption(sub,'','— Sous-thème à choisir —');
 if(theme.value!==''){
  CATALOG[index].subthemes.forEach((item,i)=>addOption(sub,i,item.name));
  if(selected!==undefined&&selected!==null&&selected>=0)sub.value=String(selected);
 }
}
function openPreview(doc,file){
 pending={doc,fileName:file.name};
 const overlay=ui('wordImportOverlay');
 ui('wordImportFilename').textContent=file.name;
 field('wordImportMode',doc.mode);field('wordImportStudent',doc.student);field('wordImportPartner',doc.partner);field('wordImportClass',doc.className);
 field('wordImportSchool',doc.school);field('wordImportTeacher',doc.teacher);field('wordImportProblem',doc.problem);
 const theme=ui('wordImportTheme');theme.replaceChildren();addOption(theme,'','— Thème officiel à choisir —');
 CATALOG.forEach((item,i)=>addOption(theme,i,item.title));theme.value=doc.themeIndex<0?'':String(doc.themeIndex);
 updateSubjectOptions(doc.subthemeIndex);
 for(let i=1;i<=4;i++){
  field('wordImportAnnex'+i,doc.annexes[i]?.text||'');
  field('wordImportSource'+i,doc.annexes[i]?.source||'');
  const box=ui('wordImportAnnexBox'+i);
  if(box){box.open=!!doc.annexes[i]?.text;box.hidden=i===4&&doc.mode==='individuel';}
 }
 const loose=ui('wordImportLoose');
 loose.value=doc.evidence.slice(0,25000);
 ui('wordImportLooseBox').hidden=doc.found>0;
 const lines=doc.notes.length?doc.notes:['Vérifie les champs extraits avant de confirmer. Les mises en forme complexes et les images ne sont pas reprises.'];
 notice('Reconnaissance terminée : '+doc.found+' annexe(s) détectée(s). '+lines.join(' '),false);
 overlay.hidden=false;overlay.querySelector('.word-import-panel')?.scrollTo(0,0);
 ui('wordImportCancel')?.focus();
}
async function processImport(file){
 if(!/\.docx$/i.test(file.name))throw Error('Sélectionne un fichier Word au format .docx (et non .doc ou PDF).');
 if(file.size>MAX_FILE)throw Error('Le fichier dépasse 20 Mo : réduis sa taille.');
 if(typeof JSZip==='undefined')throw Error('Lecteur Word non disponible sur cet appareil.');
 const zip=await JSZip.loadAsync(await file.arrayBuffer(),{checkCRC32:true});
 const entry=zip.file('word/document.xml');
 if(!entry)throw Error('Structure Word invalide : « word/document.xml » est introuvable.');
 const xml=await entry.async('string');
 if(xml.length>MAX_XML)throw Error('Ce document dépasse la limite de lecture (5 Mo de texte XML).');
 return parseWord(fromWordXml(xml));
}
function applyImport(){
 if(!pending)return;
 const themeEl=ui('wordImportTheme'),subEl=ui('wordImportSubtheme');
 const mode=ui('wordImportMode').value;
 const imported=empty();
 imported.mode=mode==='binome'?'binome':'individuel';
 imported.student=trim(ui('wordImportStudent').value).slice(0,180);
 imported.partner=imported.mode==='binome'?trim(ui('wordImportPartner').value).slice(0,180):'';
 imported.className=trim(ui('wordImportClass').value).slice(0,180);
 imported.school=trim(ui('wordImportSchool').value).slice(0,180);
 imported.teacher=trim(ui('wordImportTeacher').value).slice(0,180);
 imported.problem=trim(ui('wordImportProblem').value).slice(0,700);
 imported.problemMode=imported.problem?'custom':'';
 if(themeEl.value!==''){imported.theme=Number(themeEl.value);}
 if(subEl.value!==''&&imported.theme!==null){imported.subtheme=Number(subEl.value);}
 for(let i=1;i<=(imported.mode==='binome'?4:3);i++){
  let text=ui('wordImportAnnex'+i).value.trim();
  let source=ui('wordImportSource'+i).value.trim();
  if(text)imported.annexes[i]=text.slice(0,30000);
  if(source)imported.sources[i]=source.slice(0,1500);
  // Checking sources is a human action; imports must not mark them as verified.
  imported.sourceChecks[i]=false;
 }
 if(!imported.student&&!imported.problem&&!Object.values(imported.annexes).some(Boolean)){
  notice('Aucun champ ni texte d’annexe à importer. Vérifie le Word ou renseigne les champs.',true);return;
 }
 const oldHasData=!!(data.student||data.problem||Object.values(data.annexes||{}).some(v=>v));
 if(oldHasData&&!confirm('Ce fichier Word remplacera le dossier EGE ouvert sur cet appareil. Veux-tu continuer ? Tu peux d’abord utiliser « Sauvegarder le dossier actuel » pour obtenir une copie JSON.'))return;
 imported.step=!imported.student?'student':imported.theme===null?'theme':imported.subtheme===null?'subtheme':!imported.problem?'problem':'finish';
 imported.resumeAt=imported.step;
 const previous=data;
 data=imported;
 window.EGE2027Phase1?.detachCurrent();
 if(!save()){
  data=previous;notice('Espace de stockage insuffisant : le dossier actuel a été conservé. Libère de l’espace et réessaie.',true);return;
 }
 pending=null;ui('wordImportOverlay').hidden=true;
 render();window.scrollTo({top:0,behavior:'smooth'});
 toast('Dossier Word importé. Relis les champs, annexes et sources avant l’export.');
}
function closePreview(){ui('wordImportOverlay').hidden=true;pending=null;}
document.addEventListener('DOMContentLoaded',()=>{
 const picker=ui('importFile');
 if(!picker)return;
 picker.accept='.json,.docx,application/json,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
 const oldOnChange=picker.onchange;
 picker.onchange=async event=>{
  const file=event.target.files?.[0];
  if(!file)return;
  if(/\.json$/i.test(file.name)){
   if(oldOnChange){
    if((data.student||data.problem||Object.values(data.annexes||{}).some(v=>v))&&!confirm('Restaurer cette sauvegarde JSON à la place du dossier actuel ?')){picker.value='';return;}
    await oldOnChange.call(picker,event);
   }
   return;
  }
  if(!/\.docx$/i.test(file.name)){picker.value='';toast('Formats acceptés : Word .docx ou sauvegarde .json');return;}
  picker.value='';
  ui('wordImportOverlay').hidden=false;notice('Lecture du fichier Word sur cet appareil…');
  try{const parsed=await processImport(file);openPreview(parsed,file)}
  catch(e){pending=null;notice('Importation impossible : '+(e?.message||String(e)),true);}
 };
 ui('wordImportClose')?.addEventListener('click',closePreview);
 ui('wordImportCancel')?.addEventListener('click',closePreview);
 ui('wordImportConfirm')?.addEventListener('click',applyImport);
 ui('wordImportTheme')?.addEventListener('change',()=>updateSubjectOptions());
 ui('wordImportMode')?.addEventListener('change',()=>{const a=ui('wordImportAnnexBox4');if(a)a.hidden=ui('wordImportMode').value!=='binome'});
 ui('wordImportSaveCurrent')?.addEventListener('click',()=>backup());
 ui('wordImportUseLoose')?.addEventListener('click',()=>{
  const box=ui('wordImportAnnex1'),text=ui('wordImportLoose').value.trim();
  if(!text)return;
  if(box.value.trim()&&!confirm('Remplacer le texte de l’annexe 1 par le texte sélectionné ?'))return;
  box.value=text.slice(0,30000);ui('wordImportAnnexBox1').open=true;
  notice('Texte placé dans l’annexe 1. Relis-le et supprime les parties qui ne correspondent pas à l’annexe.');
 });
 ui('wordImportOverlay')?.addEventListener('click',e=>{if(e.target===ui('wordImportOverlay'))closePreview()});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!ui('wordImportOverlay').hidden)closePreview()});
 ui('egeCloudImportDoc')?.addEventListener('click',()=>{
  if(typeof egeCloudOpen==='function')egeCloudOpen(false);
  picker.click();
 });
});
})();
