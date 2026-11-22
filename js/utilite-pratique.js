/* MonAvenir — rubrique pédagogique commune, indépendante du niveau scolaire. */
(()=>{'use strict';if(window.MAUtilite)return;
const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const topics=[
[/tva/, 'La TVA permet à une entreprise de calculer ce qu’elle doit reverser à l’État après avoir déduit la TVA de ses achats.'],
[/unite d oeuvre/, 'Cette méthode mesure l’usure d’un équipement selon son utilisation réelle, par exemple les kilomètres d’un camion.'],
[/amortissement/, 'Le calcul de l’amortissement permet à une entreprise d’évaluer la consommation d’un équipement au fil du temps et de préparer son renouvellement.'],
[/client.*douteux|depreciation.*client|creance/, 'Une entreprise doit anticiper les risques de non-paiement de ses clients pour estimer correctement son patrimoine et protéger sa trésorerie.'],
[/depreciation.*stock|stock.*depreciation/, 'Un commerçant peut ajuster la valeur de marchandises abîmées ou invendables pour établir des comptes fidèles à la réalité.'],
[/depreciation.*titre|titre.*depreciation/, 'La valeur d’un placement peut diminuer : mesurer cette diminution aide à présenter correctement les comptes.'],
[/depreciation.*terrain/, 'Un terrain peut perdre de la valeur à cause d’un changement de son environnement ; l’entreprise doit en tenir compte dans son patrimoine.'],
[/depreciation/, 'Les dépréciations permettent de tenir compte des pertes de valeur lorsqu’elles sont constatées à la clôture des comptes.'],
[/facture|achat.*vente|escompte|remise/, 'Les factures permettent de vérifier le prix réellement payé, les réductions et les taxes, notamment dans les commerces de Djibouti.'],
[/prix psychologique/, 'Un commerçant peut interroger les clients pour déterminer un prix acceptable avant de commercialiser un produit.'],
[/prix|tarif/, 'La fixation d’un prix aide une entreprise à tenir compte des coûts et des attentes des consommateurs.'],
[/produit.*offre|marque|gamme/, 'La conception d’une offre adaptée aide les entreprises à répondre aux besoins des clients et à se différencier.'],
[/optique|lentille|refraction|lumiere/, 'L’optique explique le fonctionnement des lunettes, des appareils photo et des instruments de mesure.'],
[/congruence|codage|cryptograph/, 'Les congruences permettent de construire des méthodes de codage et de calculer des phénomènes cycliques.'],
[/arithmetique|divisibilite|division euclidienne/, 'Ces calculs aident à répartir des quantités en lots égaux et à traiter les restes.'],
[/asymptote|limite.*fonction/, 'Les limites et les asymptotes décrivent le comportement d’un phénomène lorsque le temps ou la distance augmente.'],
[/suite|recurrence|convergence/, 'Les suites modélisent des évolutions dans le temps, comme une épargne ou un stock.'],
[/complexe|affixe/, 'Les nombres complexes sont utilisés pour représenter des positions et analyser les signaux électriques.'],
[/numeration|binaire|hexadecimal|octale/, 'Les systèmes de numération permettent de comprendre comment les données sont représentées par les ordinateurs.'],
[/echantillonnage|fluctuation|statistique|probabilite/, 'Ces méthodes aident à analyser des sondages et à prendre des décisions malgré l’incertitude.'],
[/energie|electricite/, 'Comprendre l’énergie et l’électricité aide à analyser la consommation des appareils et à mieux utiliser les ressources.'],
[/fonction|derivee/, 'Les fonctions permettent de relier deux grandeurs, par exemple une distance et un coût, afin de prendre une décision.'],
[/algorithme|python|programmation/, 'Un algorithme permet d’automatiser des tâches répétitives et de résoudre des problèmes étape par étape.'],
[/tableur|excel/, 'Un tableur facilite le suivi des dépenses, des stocks et des résultats scolaires en automatisant les calculs.'],
[/emprunt|financement/, 'Comprendre le financement permet de comparer les emprunts et de prévoir les remboursements.']
];
const subjects=[
[/gestion financiere|principes de gestion|comptabilite/, 'Cette notion aide à comprendre les décisions financières et à suivre les opérations d’une organisation.'],
[/mercatique|marketing/, 'Cette notion aide à comprendre les besoins des consommateurs et à adapter une offre au marché.'],
[/ogrh|ressources humaines|communication/, 'Cette notion aide à organiser le travail, à collaborer et à communiquer efficacement dans une entreprise.'],
[/management/, 'Cette notion aide à analyser le fonctionnement des organisations et à prendre de meilleures décisions.'],
[/economie|droit|ses/, 'Cette notion permet de mieux comprendre les choix économiques, les règles et la vie des organisations.'],
[/math/, 'Les mathématiques aident à quantifier, comparer et modéliser des situations de la vie quotidienne.'],
[/physique|chimie/, 'Les sciences physiques aident à expliquer des phénomènes observables et à comprendre les technologies du quotidien.'],
[/svt|vie et terre|biologie/, 'Les sciences du vivant aident à comprendre la santé, l’environnement et la gestion des ressources naturelles.'],
[/iag|informatique|numerique/, 'Cette notion aide à utiliser, concevoir et sécuriser les outils numériques du quotidien.'],
[/histoire|geographie/, 'Cette notion aide à comprendre les sociétés, les territoires et leurs transformations.'],
[/philosophie/, 'Cette notion développe la réflexion critique et la capacité à argumenter des choix.'],
[/francais|arabe|anglais|chinois|russe|langue/, 'Cette notion aide à comprendre et à communiquer avec précision dans les études, les échanges et le travail.'],
[/sport|eps/, 'Cette notion aide à pratiquer une activité physique avec méthode et à mieux connaître ses capacités.']
];
function resolve(meta={}){const supplied=String(meta.practical_use||meta.real_life_use||'').trim();if(supplied)return supplied;const topic=norm([meta.part_title,meta.chapter_title,meta.title,meta.context].filter(Boolean).join(' '));const subject=norm(meta.subject);return topics.find(([re])=>re.test(topic))?.[1]||subjects.find(([re])=>re.test(subject))?.[1]||'';}
function html(meta){const s=resolve(meta);return s?'<aside class="ma-life-use"><strong>💡 À quoi ça sert dans la vie réelle ?</strong><p>'+esc(s)+'</p></aside>':'';}
const style=document.createElement('style');style.textContent='.ma-life-use{display:block;padding:10px 13px;margin:8px 0;border:1px solid #f0dcad;border-radius:12px;background:#fff9ec;color:#74490b;font-size:.87rem;line-height:1.45;min-width:0;overflow-wrap:anywhere}.ma-life-use strong{display:block;font-size:.84rem}.ma-life-use p{margin:4px 0 0}.mats-dialog .ma-life-use{display:none}';document.head.append(style);
const registry=window.MAChapters;
if(registry){
 const old=registry.group;registry.group=function(rows,render,opts){return old.call(this,rows,r=>{const out=render(r);if(!out||String(out).includes('mats-entry'))return out;return html(r)+out;},opts);};
 const native=registry.nativeHTML;registry.nativeHTML=function(rows){return native.call(this,rows.map(r=>({...r,html:String(r.html||'').includes('mats-entry')?r.html:html(r)+r.html})));};
}
// Native exercises have several independent dialog engines. Insert the callout once
// per rendered view, without replacing questions, inputs, handlers or navigation.
const dialogs=[['.mgc-main','Gestion financière'],['.mpg-dialog main','Mercatique','Prix psychologique'],['.mad-dialog .mad-body','Physique-Chimie','Optique'],['.maam-main','Gestion financière','Amortissements'],['.magf-main','Gestion financière','Factures'],['.mapr-main','Mercatique','Prix psychologique'],['.mad3-main','Gestion financière','Dépréciation'],['.mad4-main','Gestion financière','Dépréciation des stocks']];
function scan(){for(const [selector,subject,title] of dialogs)for(const host of document.querySelectorAll(selector)){if(host.querySelector(':scope > .ma-life-use')||!host.querySelector('h2,h3'))continue;const heading=host.querySelector('h2,h3')?.textContent||'';const card=html({title,subject,context:heading});if(card)host.insertAdjacentHTML('afterbegin',card);}
 const scope=window.MASimple?.scopeFor?.(typeof st!=='undefined'?st.screen:'');for(const host of document.querySelectorAll('#mbi-root .mbi-main')){if(!scope?.subject||host.querySelector(':scope > .ma-life-use')||!host.querySelector('.mbi-question,.mbi-intro'))continue;const card=html({...scope,title:host.querySelector('h2')?.textContent});if(card)host.insertAdjacentHTML('afterbegin',card);}
}
let pending=false;const schedule=()=>{if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;scan()})};scan();new MutationObserver(x=>{if(x.some(r=>r.addedNodes.length))schedule()}).observe(document.body,{subtree:true,childList:true});
window.MAUtilite={resolve,html,scan};
})();
