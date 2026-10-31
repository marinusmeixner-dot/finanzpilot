import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=p=>fs.readFileSync(p,'utf8');
const src=read('investment-committee.js');
const content=JSON.parse(read('data/investment-committee.json'));
const kion=JSON.parse(read('data/kion_model.json'));
assert.equal(content.schema,1);
assert.equal(content.cases.length,2);
assert.equal(content.stages.length,8);
assert.deepEqual(content.cases.map(c=>c.id),['kion-2026','msft-fy2026']);
assert.equal(kion.quote.asof,'2026-10-30');
const store={};
const localStorage={getItem:k=>store[k]||null,setItem:(k,v)=>store[k]=v};
const window={dispatchEvent(){},scrollTo(){}};
const document={readyState:'loading',addEventListener(){}};
const context=vm.createContext({window,document,localStorage,console,Date,Intl,JSON,Math,Number,String,
 Event:class Event{constructor(type){this.type=type}},
 fetch:async(url)=>({ok:true,json:async()=>String(url).includes('investment-committee.json')?content:kion})});
vm.runInContext(src,context,{filename:'investment-committee.js'});
await window.FinanzPilotInvestmentCommittee.load();
const lab=window.FinanzPilotInvestmentCommittee;
assert(lab.render().includes('Investmentkomitee'));
const examples={
 'kion-2026':[24.59,58.20,94.65],
 'msft-fy2026':[345.60,466.56,587.52]
};
for(const c of lab.cases){
 assert(c.source.url.startsWith('https://'));
 assert(c.date&&c.review.length>=5);
 const result=lab.calculate(c);
 assert(!result.error);
 assert.equal(result.targets.length,3);
 examples[c.id].forEach((target,i)=>assert(Math.abs(result.targets[i]-target)<.025,c.id+' target '+i));
 assert(Math.abs(result.weights.reduce((a,b)=>a+b,0)-100)<.001);
 const invalid=lab.calculate(c,{bear:50,base:50,bull:20,wacc:10.5,g:2,pe:27});
 assert(invalid.error.includes('100'));
 for(const q of c.exercises){
  assert(lab.grade(q,String(q.answer).replace('.',',')).correct,'correct computation '+c.id);
  assert(!lab.grade(q,String(q.answer+7)).correct,'incorrect computation '+c.id);
 }
 for(const q of [c.critical,c.decision,c.postModel]){
  const answer=Array.isArray(q.correct)?q.correct:[q.correct];
  assert(lab.grade(q,answer).correct,c.id+' decision');
  assert(!lab.grade(q,[]).correct,c.id+' no answer');
 }
}
const badWacc=lab.calculate(lab.cases[0],{bear:30,base:50,bull:20,wacc:2,g:4,pe:27});
assert(badWacc.error.includes('WACC'));
const noQuote=lab.calculate(lab.cases[1]);
assert.equal(noQuote.relative,null,'Never invent a Microsoft live quote');
assert.equal(lab.cases[1].model.eps,17.28);
assert(src.includes('data-ic-thesis')===false); // real form ID is fp-ic-thesis
assert(src.includes('fp-ic-thesis'));
assert(src.includes('data-ic-copy'));
assert(src.includes('kein aktueller Marktkurs')||src.includes('Kein aktueller Marktkurs'));
assert(read('ux-v15.js').includes("investmentcommittee:'stockhub'"));
assert(read('sync.js').includes('mergeInvestmentCommittee'));
assert(read('index.html').includes('investment-committee.js?v=23'));
assert(read('index.html').includes('investment-committee.css?v=21'));
console.log('Investment Committee v21: KION 5-year DCF, Microsoft EPS-model, 2×8 stages, 10 objective answers, 6 anchored scenarios and all guards verified.');
