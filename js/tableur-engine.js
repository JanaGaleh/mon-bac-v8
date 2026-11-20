// Moteur de formules sans eval, Function ni code exécutable.
export function evaluateCell(cells,ref,stack=new Set()){
  ref=String(ref).toUpperCase().replace(/\$/g,'');
  if(stack.has(ref))throw Error('Référence circulaire');
  const raw=String(cells[ref]??'');
  if(!raw.startsWith('='))return raw;
  const next=new Set([...stack,ref]);
  const src=raw.slice(1).replace(/;/g,',').toUpperCase();
  const tokens=src.match(/\s+|\$?[A-Z]{1,3}\$?\d+|\d+(?:[.,]\d+)?(?:E[+-]?\d+)?|[A-Z_][A-Z_0-9]*|[()+*/^,:-]/g)||[];
  if(tokens.join('')!==src)throw Error('Formule non reconnue');
  const t=tokens.filter(x=>!/^\s+$/.test(x));let i=0;
  const peek=()=>t[i],take=()=>t[i++];
  const number=v=>{if(v===''||v===null)return 0;const n=Number(v);if(!Number.isFinite(n))throw Error('Valeur non numérique');return n};
  const position=r=>{const m=/^([A-Z]{1,3})(\d+)$/.exec(r.replace(/\$/g,''));if(!m)throw Error('Cellule');let col=0;for(const c of m[1])col=col*26+c.charCodeAt(0)-64;return [Number(m[2]),col]};
  const address=(r,c)=>{let s='';while(c){c--;s=String.fromCharCode(65+c%26)+s;c=Math.floor(c/26)}return s+r};
  const range=(a,b)=>{const [r1,c1]=position(a),[r2,c2]=position(b);if(r2<r1||c2<c1||(r2-r1+1)*(c2-c1+1)>10000)throw Error('Plage invalide');const out=[];for(let r=r1;r<=r2;r++)for(let c=c1;c<=c2;c++)out.push(number(evaluateCell(cells,address(r,c),next)));return out};
  function primary(){const x=take();if(x===undefined)throw Error('Formule incomplète');if(x==='('){const v=expression();if(take()!==')')throw Error('Parenthèse');return v}if(x==='+'||x==='-'){const v=primary();return x==='-'?-number(v):number(v)}if(/^\d/.test(x))return Number(x.replace(',','.'));if(/^\$?[A-Z]{1,3}\$?\d+$/.test(x)){if(peek()===':'){take();const end=take();if(!/^\$?[A-Z]{1,3}\$?\d+$/.test(end||''))throw Error('Plage');return range(x,end)}return number(evaluateCell(cells,x.replace(/\$/g,''),next))}
    if(/^[A-Z_]/.test(x)&&peek()==='('){take();const args=[];if(peek()!==')'){do{args.push(expression());if(peek()!==',')break;take()}while(true)}if(take()!==')')throw Error('Parenthèse');const vals=args.flat(Infinity).map(number);switch(x){case 'SOMME':case 'SUM':return vals.reduce((a,b)=>a+b,0);case 'MOYENNE':case 'AVERAGE':return vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:0;case 'MIN':return Math.min(...vals);case 'MAX':return Math.max(...vals);case 'NB':case 'COUNT':return vals.length;case 'ABS':return Math.abs(vals[0]);case 'ARRONDI':case 'ROUND':return Number(vals[0].toFixed(Math.max(0,Math.min(12,vals[1]||0))));case 'SI':case 'IF':return vals[0]?vals[1]:vals[2]??0;default:throw Error('Fonction non prise en charge')}}throw Error('Élément non reconnu')}
  function power(){let a=primary();if(peek()==='^'){take();a=Math.pow(number(a),number(power()))}return a}
  function term(){let a=power();while(['*','/'].includes(peek())){const op=take(),b=power();a=op==='*'?number(a)*number(b):number(a)/number(b)}return a}
  function expression(){let a=term();while(['+','-'].includes(peek())){const op=take(),b=term();a=op==='+'?number(a)+number(b):number(a)-number(b)}return a}
  const result=expression();if(i!==t.length||!Number.isFinite(result))throw Error('Calcul invalide');return result;
}
