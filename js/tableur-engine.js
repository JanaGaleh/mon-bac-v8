// Moteur pédagogique de formules : aucune évaluation de code JavaScript.
const aliases={SUM:'SOMME',AVERAGE:'MOYENNE',COUNT:'NB',ROUND:'ARRONDI',IF:'SI',AND:'ET',OR:'OU',NOT:'NON',SQRT:'RACINE',POWER:'PUISSANCE',LEN:'NBCAR',LEFT:'GAUCHE',RIGHT:'DROITE',MID:'STXT',UPPER:'MAJUSCULE',LOWER:'MINUSCULE',TRIM:'SUPPRESPACE',CONCATENATE:'CONCATENER',TODAY:'AUJOURDHUI',NOW:'MAINTENANT',YEAR:'ANNEE',MONTH:'MOIS',DAY:'JOUR',MOD:'MOD',INT:'ENT',PRODUCT:'PRODUIT',MEDIAN:'MEDIANE',STDEV:'ECARTYPE',VAR:'VARIANCE',PI:'PI',TRUE:'VRAI',FALSE:'FAUX',IFERROR:'SIERREUR',COUNTIF:'NB.SI',SUMIF:'SOMME.SI'};
const avg=a=>a.length?a.reduce((s,v)=>s+v,0)/a.length:0;
const numeric=a=>a.map(v=>Number(v)).filter(Number.isFinite);
const variance=(a,sample=false)=>{const v=numeric(a);if(v.length<1+(sample?1:0))throw Error('Données insuffisantes');const m=avg(v);return v.reduce((s,x)=>s+(x-m)**2,0)/(v.length-(sample?1:0))};
const median=a=>{const v=numeric(a).sort((a,b)=>a-b),m=v.length>>1;return v.length?(v.length%2?v[m]:(v[m-1]+v[m])/2):0};
const num=v=>{if(v===''||v===null||v===undefined)return 0;const n=Number(v);if(!Number.isFinite(n))throw Error('Valeur non numérique');return n};
const text=v=>String(v??'');
const date=v=>{const d=new Date(v);if(Number.isNaN(d.getTime()))throw Error('Date invalide');return d};
const functions={
SOMME:a=>numeric(a).reduce((s,v)=>s+v,0),
MOYENNE:a=>avg(numeric(a)),
MIN:a=>Math.min(...numeric(a)),
MAX:a=>Math.max(...numeric(a)),
NB:a=>numeric(a).length,
NBVAL:a=>a.filter(x=>x!==''&&x!==null&&x!==undefined).length,
ABS:a=>Math.abs(num(a[0])),
ARRONDI:a=>Number(num(a[0]).toFixed(Math.max(0,Math.min(12,num(a[1]))))),
'ARRONDI.INF':a=>Math.floor(num(a[0])*10**num(a[1]))/10**num(a[1]),
'ARRONDI.SUP':a=>Math.ceil(num(a[0])*10**num(a[1]))/10**num(a[1]),
ENT:a=>Math.floor(num(a[0])),
TRONQUE:a=>Math.trunc(num(a[0])*10**num(a[1]))/10**num(a[1]),
MOD:a=>num(a[0])%num(a[1]),
QUOTIENT:a=>Math.trunc(num(a[0])/num(a[1])),
PUISSANCE:a=>num(a[0])**num(a[1]),
RACINE:a=>Math.sqrt(num(a[0])),
EXP:a=>Math.exp(num(a[0])),
LN:a=>Math.log(num(a[0])),
LOG:a=>Math.log(num(a[0]))/Math.log(num(a[1]??10)),
LOG10:a=>Math.log10(num(a[0])),
PI:()=>Math.PI,
SIN:a=>Math.sin(num(a[0])),
COS:a=>Math.cos(num(a[0])),
TAN:a=>Math.tan(num(a[0])),
ASIN:a=>Math.asin(num(a[0])),
ACOS:a=>Math.acos(num(a[0])),
ATAN:a=>Math.atan(num(a[0])),
RADIANS:a=>num(a[0])*Math.PI/180,
DEGRES:a=>num(a[0])*180/Math.PI,
SIGNE:a=>Math.sign(num(a[0])),
PRODUIT:a=>numeric(a).reduce((p,v)=>p*v,1),
'SOMME.CARRES':a=>numeric(a).reduce((s,v)=>s+v*v,0),
MEDIANE:a=>median(a),
MODE:a=>{const m=new Map();for(const v of numeric(a))m.set(v,(m.get(v)||0)+1);return [...m].sort((x,y)=>y[1]-x[1])[0]?.[0]??0},
ECARTYPE:a=>Math.sqrt(variance(a,true)),
'ECARTYPE.P':a=>Math.sqrt(variance(a)),
VARIANCE:a=>variance(a,true),
'VAR.P':a=>variance(a),
'GRANDE.VALEUR':a=>numeric(a.slice(0,-1)).sort((x,y)=>y-x)[num(a.at(-1))-1]??0,
'PETITE.VALEUR':a=>numeric(a.slice(0,-1)).sort((x,y)=>x-y)[num(a.at(-1))-1]??0,
RANG:a=>1+numeric(a.slice(1)).filter(v=>v>num(a[0])).length,
CENTILE:a=>{const v=numeric(a.slice(0,-1)).sort((x,y)=>x-y),p=num(a.at(-1));if(!v.length||p<0||p>1)throw Error('Centile invalide');const pos=(v.length-1)*p,lo=Math.floor(pos);return v[lo]+(v[Math.ceil(pos)]-v[lo])*(pos-lo)},
SI:a=>a[0]?a[1]:a[2]??0,
SIERREUR:a=>a[0]??a[1]??0,
ET:a=>a.every(Boolean)?1:0,
OU:a=>a.some(Boolean)?1:0,
NON:a=>a[0]?0:1,
VRAI:()=>1,
FAUX:()=>0,
ESTNUM:a=>Number.isFinite(Number(a[0]))?1:0,
ESTVIDE:a=>a[0]===''?1:0,
NBCAR:a=>text(a[0]).length,
GAUCHE:a=>text(a[0]).slice(0,num(a[1]??1)),
DROITE:a=>text(a[0]).slice(-num(a[1]??1)),
STXT:a=>text(a[0]).slice(num(a[1])-1,num(a[1])-1+num(a[2])),
MAJUSCULE:a=>text(a[0]).toUpperCase(),
MINUSCULE:a=>text(a[0]).toLowerCase(),
NOMPROPRE:a=>text(a[0]).toLowerCase().replace(/\b\p{L}/gu,c=>c.toUpperCase()),
SUPPRESPACE:a=>text(a[0]).trim().replace(/\s+/g,' '),
CONCATENER:a=>a.map(text).join(''),
'JOINDRE.TEXTE':a=>a.slice(2).filter(x=>a[1]?x!=='':true).map(text).join(text(a[0])),
TROUVE:a=>{const p=text(a[1]).indexOf(text(a[0]),num(a[2]??1)-1);if(p<0)throw Error('Texte introuvable');return p+1},
CHERCHE:a=>{const p=text(a[1]).toLowerCase().indexOf(text(a[0]).toLowerCase(),num(a[2]??1)-1);if(p<0)throw Error('Texte introuvable');return p+1},
SUBSTITUE:a=>text(a[0]).split(text(a[1])).join(text(a[2])),
REMPLACER:a=>text(a[0]).slice(0,num(a[1])-1)+text(a[3])+text(a[0]).slice(num(a[1])-1+num(a[2])),
REPT:a=>text(a[0]).repeat(Math.min(10000,Math.max(0,num(a[1])))),
VALEUR:a=>num(a[0]),
TEXTE:a=>text(a[0]),
CAR:a=>String.fromCharCode(num(a[0])),
CODE:a=>text(a[0]).charCodeAt(0),
AUJOURDHUI:()=>new Date().toISOString().slice(0,10),
MAINTENANT:()=>new Date().toISOString(),
DATE:a=>new Date(Date.UTC(num(a[0]),num(a[1])-1,num(a[2]))).toISOString().slice(0,10),
ANNEE:a=>date(a[0]).getUTCFullYear(),
MOIS:a=>date(a[0]).getUTCMonth()+1,
JOUR:a=>date(a[0]).getUTCDate(),
JOURSEM:a=>(date(a[0]).getUTCDay()+(num(a[1]??1)===2?6:0))%7+1,
JOURS:a=>Math.round((date(a[0])-date(a[1]))/86400000),
FACT:a=>{const n=num(a[0]);if(n<0||n>170||!Number.isInteger(n))throw Error('Factorielle invalide');let p=1;for(let i=2;i<=n;i++)p*=i;return p},
'FIN.MOIS':a=>new Date(Date.UTC(date(a[0]).getUTCFullYear(),date(a[0]).getUTCMonth()+num(a[1])+1,0)).toISOString().slice(0,10),
};
export const SUPPORTED_FUNCTIONS=Object.freeze(Object.keys(functions));
export function evaluateCell(cells,ref,stack=new Set()){
 const id=String(ref).toUpperCase().replace(/\$/g,'');if(stack.has(id))throw Error('Référence circulaire');
 const raw=String(cells[id]??'');if(!raw.startsWith('='))return raw;
 const next=new Set([...stack,id]);const src=raw.slice(1).toUpperCase();
 const re=/\s+|"(?:[^"]|"")*"|\$?[A-Z]{1,3}\$?\d+|\d+(?:\.\d+)?(?:E[+-]?\d+)?|[A-Z_À-Ÿ][A-Z_À-Ÿ0-9.]*|<=|>=|<>|[()+*/^,:;<>=&-]/g;
 const tokens=src.match(re)||[];if(tokens.join('')!==src)throw Error('Formule non reconnue');
 const t=tokens.filter(x=>!(/^\s+$/.test(x)));let i=0,peek=()=>t[i],take=()=>t[i++];
 const position=r=>{const m=/^([A-Z]{1,3})(\d+)$/.exec(r.replace(/\$/g,''));if(!m)throw Error('Cellule');let c=0;for(const ch of m[1])c=c*26+ch.charCodeAt(0)-64;return [+m[2],c]};
 const address=(r,c)=>{let s='';while(c){c--;s=String.fromCharCode(65+c%26)+s;c=Math.floor(c/26)}return s+r};
 const range=(a,b)=>{const [r1,c1]=position(a),[r2,c2]=position(b);if(r2<r1||c2<c1||(r2-r1+1)*(c2-c1+1)>10000)throw Error('Plage invalide');const out=[];for(let r=r1;r<=r2;r++)for(let c=c1;c<=c2;c++)out.push(evaluateCell(cells,address(r,c),next));return out};
 function primary(){const x=take();if(x===undefined)throw Error('Formule incomplète');if(x==='('){const v=expression();if(take()!==')')throw Error('Parenthèse');return v}if(x==='+'||x==='-'){const v=primary();return x==='-'?-num(v):num(v)}if(x.startsWith('"'))return x.slice(1,-1).replace(/""/g,'"');if(/^\d/.test(x))return Number(x);if(/^\$?[A-Z]{1,3}\$?\d+$/.test(x)){if(peek()===':'){take();const end=take();if(!/^\$?[A-Z]{1,3}\$?\d+$/.test(end||''))throw Error('Plage');return range(x,end)}return evaluateCell(cells,x.replace(/\$/g,''),next)}
 if(/^[A-Z_À-Ÿ]/.test(x)&&peek()==='('){take();const args=[];if(peek()!==')'){do{args.push(expression());if(peek()!==','&&peek()!==';')break;take()}while(true)}if(take()!==')')throw Error('Parenthèse');const name=aliases[x]||x,fn=functions[name];if(!fn)throw Error('Fonction non prise en charge : '+x);const result=fn(args.flat(Infinity));if(typeof result==='number'&&!Number.isFinite(result))throw Error('Calcul invalide');return result}throw Error('Élément non reconnu')}
 function power(){let a=primary();if(peek()==='^'){take();a=num(a)**num(power())}return a}
 function term(){let a=power();while(['*','/'].includes(peek())){const op=take(),b=power();a=op==='*'?num(a)*num(b):num(a)/num(b)}return a}
 function expression(){let a=term();while(['+','-','&','=','<>','<','>','<=','>='].includes(peek())){const op=take(),b=term();switch(op){case '+':a=num(a)+num(b);break;case '-':a=num(a)-num(b);break;case '&':a=text(a)+text(b);break;case '=':a=a==b?1:0;break;case '<>':a=a!=b?1:0;break;case '<':a=a<b?1:0;break;case '>':a=a>b?1:0;break;case '<=':a=a<=b?1:0;break;case '>=':a=a>=b?1:0;break}}return a}
 const result=expression();if(i!==t.length)throw Error('Formule invalide');if(typeof result==='number'&&!Number.isFinite(result))throw Error('Calcul invalide');return result;
}
