/**
 * MonAvenir — Gestion financière — Terminale GFM — Chapitre 4, Partie 3.
 * Journal pédagogique : annulation intégrale puis constatation.
 * Uniquement des données d'exercices fictives, sans connexion ni stockage.
 */
export const ACCOUNTS = Object.freeze({
  "1511":"Provisions pour litiges",
  "1512":"Provisions pour garanties données aux clients",
  "1572":"Provisions pour grosses réparations",
  "6815":"Dotations aux provisions pour risques et charges d'exploitation",
  "7815":"Reprises sur provisions pour risques et charges d'exploitation"
});
export const EXERCISES = Object.freeze([
  {id:"litige",group:"risques",label:"Litiges",icon:"⚖",title:"Litige avec un fournisseur",
   story:"DJIB-COM, entreprise de Djibouti, a constitué au 31/12/N une provision de 180 000 FDJ pour un litige avec un fournisseur. Au 31/12/N+1, son avocat estime le risque probable à 250 000 FDJ.",
   date:"31/12/N+1",account:"1511",old:180000,needed:250000,
   lesson:"Le risque augmente. On annule l'ancienne provision, puis on constate la nouvelle pour son montant total."},
  {id:"garanties",group:"risques",label:"Garanties clients",icon:"✓",title:"Garanties accordées aux clients",
   story:"Une entreprise de matériel électronique à Djibouti avait provisionné 120 000 FDJ pour des garanties clients. À la clôture suivante, les dépenses probables sont réestimées à 90 000 FDJ.",
   date:"31/12/N+1",account:"1512",old:120000,needed:90000,
   lesson:"Le risque diminue. Les deux écritures donnent une reprise nette de 30 000 FDJ."},
  {id:"reparations",group:"charges",label:"Grosses réparations",icon:"⚙",title:"Grosses réparations pluriannuelles",
   story:"Une entreprise de Djibouti programme une grande révision de ses installations frigorifiques, estimée à 900 000 FDJ sur trois exercices. Les conditions du provisionnement sont supposées remplies. En N, 300 000 FDJ ont été provisionnés. En N+1, la provision cumulée nécessaire est de 600 000 FDJ.",
   date:"31/12/N+1",account:"1572",old:300000,needed:600000,
   lesson:"La provision cumulée nécessaire à N+1 est de 600 000 FDJ. La dotation nette est donc de 300 000 FDJ."},
  {id:"reprise",group:"charges",label:"Réalisation",icon:"↩",title:"Reprise après réalisation des travaux",
   story:"Une entreprise avait constitué 900 000 FDJ pour de grosses réparations. Les travaux ont été réalisés ; l'obligation couverte par la provision a disparu. Dans ce journal, on traite uniquement la reprise de la provision. La facture réelle est à comptabiliser séparément.",
   date:"31/12/N+2",account:"1572",old:900000,needed:0,
   lesson:"Lorsque la provision n'est plus justifiée, sa reprise est totale. L'enregistrement de la facture reste une opération distincte."}
]);
export const currency = amount => Number(amount).toLocaleString("fr-FR")+" FDJ";
export function entriesFor(exercise) {
  const entries = [];
  if(exercise.old>0) entries.push({
    kind:"annulation",label:"Annuler l'ancienne provision",debit:exercise.account,credit:"7815",
    amount:exercise.old,tip:"Pour annuler, on débite la provision (compte 15) et on crédite le compte de reprise 7815."
  });
  if(exercise.needed>0) entries.push({
    kind:"constatation",label:"Constater la provision nécessaire",debit:"6815",credit:exercise.account,
    amount:exercise.needed,tip:"Pour constater, on débite la dotation 6815 et on crédite la provision (compte 15)."
  });
  return entries;
}
/** Parse spaces (including narrow no-break spaces) but reject negative, decimals and empty values. */
export function amountValue(value) {
  const normalized=String(value??"").replace(/[\s\u00a0\u202f]/g,"");
  if(!/^\d+$/.test(normalized)) return null;
  const n=Number(normalized);
  return Number.isSafeInteger(n) ? n : null;
}
/** Each journal entry has two lines. Blank amount is required on the opposite side. */
export function checkJournal(lines, entry) {
  const expected=[
    {account:entry.debit,debit:entry.amount,credit:null},
    {account:entry.credit,debit:null,credit:entry.amount}
  ];
  const cellResults=expected.map((row,i)=>{
    const actual=lines[i]||{};
    const emptyDebit=String(actual.debit??"").trim()==="";
    const emptyCredit=String(actual.credit??"").trim()==="";
    return {
      account:actual.account===row.account,
      debit:row.debit===null ? emptyDebit : amountValue(actual.debit)===row.debit,
      credit:row.credit===null ? emptyCredit : amountValue(actual.credit)===row.credit
    };
  });
  const valid=cellResults.every(c=>Object.values(c).every(Boolean));
  const totals=lines.reduce((sum,line)=>({
    debit:sum.debit+(amountValue(line.debit)||0),
    credit:sum.credit+(amountValue(line.credit)||0)
  }),{debit:0,credit:0});
  return {valid,cellResults,totals,balanced:totals.debit===totals.credit&&totals.debit>0};
}
export function netChange(exercise) { return exercise.needed-exercise.old; }
