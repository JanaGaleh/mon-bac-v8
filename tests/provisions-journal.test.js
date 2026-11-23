import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {ACCOUNTS,EXERCISES,entriesFor,amountValue,checkJournal,netChange} from "../monavenir/modules/gestion-financiere/terminale-gfm/ch4-partie3/journal-model.mjs";

test("five PCG accounts and four distinct guided scenarios",()=>{
  assert.deepEqual(Object.keys(ACCOUNTS),["1511","1512","1572","6815","7815"]);
  assert.equal(EXERCISES.length,4);
  assert.deepEqual(new Set(EXERCISES.map(e=>e.id)).size,4);
});
test("litige: annulation de 180 000, constatation de 250 000",()=>{
  const exercise=EXERCISES.find(e=>e.id==="litige");
  assert.deepEqual(entriesFor(exercise),[
    {kind:"annulation",label:"Annuler l'ancienne provision",debit:"1511",credit:"7815",amount:180000,tip:entriesFor(exercise)[0].tip},
    {kind:"constatation",label:"Constater la provision nécessaire",debit:"6815",credit:"1511",amount:250000,tip:entriesFor(exercise)[1].tip}
  ]);
  assert.equal(netChange(exercise),70000);
});
test("garanties clients: reprise nette de 30 000 FDJ",()=>{
  const e=EXERCISES.find(e=>e.id==="garanties");
  assert.equal(entriesFor(e).length,2);
  assert.equal(entriesFor(e)[0].account,undefined);
  assert.equal(entriesFor(e)[0].debit,"1512");
  assert.equal(entriesFor(e)[1].credit,"1512");
  assert.equal(netChange(e),-30000);
});
test("grosses réparations: provision cumulée de 600 000 FDJ en N+1",()=>{
  const e=EXERCISES.find(e=>e.id==="reparations");
  assert.equal(e.old,300000);assert.equal(e.needed,600000);
  assert.equal(entriesFor(e)[0].amount,300000);
  assert.equal(entriesFor(e)[1].amount,600000);
});
test("réalisation: une seule écriture de reprise, facture distincte",()=>{
  const e=EXERCISES.find(e=>e.id==="reprise");
  const entries=entriesFor(e);
  assert.equal(entries.length,1);
  assert.deepEqual([entries[0].debit,entries[0].credit,entries[0].amount],["1572","7815",900000]);
});
test("un journal exact est validé cellule par cellule et équilibré",()=>{
  const e=entriesFor(EXERCISES[0])[0];
  const result=checkJournal([
    {account:"1511",debit:"180 000",credit:""},
    {account:"7815",debit:"",credit:"180 000"}
  ],e);
  assert.equal(result.valid,true);
  assert.equal(result.balanced,true);
  assert.deepEqual(result.totals,{debit:180000,credit:180000});
});
test("un journal équilibré mais avec des comptes inversés est rejeté",()=>{
  const e=entriesFor(EXERCISES[0])[0];
  const result=checkJournal([
    {account:"7815",debit:"180000",credit:""},
    {account:"1511",debit:"",credit:"180000"}
  ],e);
  assert.equal(result.balanced,true);
  assert.equal(result.valid,false);
  assert.equal(result.cellResults[0].account,false);
});
test("les montants vides, négatifs et décimaux sont rejetés",()=>{
  for(const n of [""," ","-10","1.5","abc"])assert.equal(amountValue(n),null);
  assert.equal(amountValue("250\u202f000"),250000);
});
test("la page guidée importe le moteur et inclut le journal et sa vérification",()=>{
  const html=readFileSync(new URL("../monavenir/modules/gestion-financiere/terminale-gfm/ch4-partie3/index.html",import.meta.url),"utf8");
  for(const token of ["journal-model.mjs","journalRows","caseSelect","checkButton","progressArea","aria-live","coachPhoto"]) {
    assert.ok(html.includes(token),"élément manquant : "+token);
  }
});
