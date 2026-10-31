import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const file=p=>fs.readFileSync(p,'utf8');
const dataset=JSON.parse(file('data/transfer-cases.json'));
const source=file('transfer.js');
const conceptSource=file('concepts.js');
const nav=file('ux-v15.js');
const app=file('app.js');
const sync=file('sync.js');
assert.equal(dataset.schema_version,1);
assert.equal(dataset.modules.length,5);
assert.equal(dataset.modules.reduce((n,m)=>n+m.steps.filter(x=>x.type!=='read').length,0),25);
assert.equal(dataset.modules.reduce((n,m)=>n+m.steps.length,0),30);
assert(dataset.modules.every(m=>m.steps.length===6));
assert(dataset.modules.every(m=>m.prerequisite));
assert(dataset.modules.every(m=>m.steps[0].visual.labels.length===m.steps[0].visual.values.length));

const memory={};
const storage={getItem:k=>memory[k]??null,setItem:(k,v)=>{memory[k]=v}};
const window={
 FinanzPilotConcepts:{achievements:{guv:true,working:false,roic:false,enterprise:false,szenarien:false},
  modules:dataset.modules.map(m=>({id:m.prerequisite,title:m.prerequisite}))},
 FinanzPilotMath:{calculate(raw){const v=String(raw).trim().replace(',','.');
   return /^[+\-]?\d+(?:\.\d+)?$/.test(v)?Number(v):NaN}}
};
const document={readyState:'loading',addEventListener(){}};
const context=vm.createContext({window,document,localStorage:storage,console,Date,Intl,Math,Number,String,JSON,Event:class{},
 fetch:async()=>({ok:true,json:async()=>dataset})});
vm.runInContext(source,context,{filename:'transfer.js'});
await window.FinanzPilotTransfer.load();
const grade=window.FinanzPilotTransfer.grade;
for(const m of dataset.modules){
 const [read,n1,n2,multi,sequence,decision]=m.steps;
 assert.equal(read.type,'read');
 assert.equal(n1.type,'number');
 assert.equal(n2.type,'number');
 assert.equal(multi.type,'multi');
 assert.equal(sequence.type,'sequence');
 assert.equal(decision.type,'decision');
 for(const n of [n1,n2]){
  assert(grade(n,String(n.answer).replace('.',',')).correct,'numeric answer '+m.id);
  assert(!grade(n,String(n.answer+100)).correct,'false numeric '+m.id);
 }
 assert(grade(multi,multi.correct).correct,'multiple selection '+m.id);
 assert(!grade(multi,[]).correct,'empty selection '+m.id);
 assert(grade(sequence,sequence.correct).correct,'ordered analysis '+m.id);
 assert(!grade(sequence,[...sequence.correct].reverse()).correct,'wrong order '+m.id);
 assert(grade(decision,[decision.correct]).correct,'decision '+m.id);
 assert(!grade(decision,[(decision.correct+1)%decision.options.length]).correct,'wrong decision '+m.id);
}
const rendered=window.FinanzPilotTransfer.render();
assert(rendered.includes('data-training-open="liquiditaetsfalle"'));
assert.equal((rendered.match(/fp-concept-locked/g)||[]).length,4);
assert(source.includes('data-training-retry'),'incorrect responses must require another attempt');
assert(!source.includes('FinanzPilotEconomy?.verify'),'no unearned virtual rewards');
assert(nav.includes("transfer:'learn'"));
assert(app.includes("state.view==='transfer'"));
assert(sync.includes("'finanzpilot_transfer_v1'"));
assert(file('index.html').includes('transfer.js?v=20'));
assert(file('index.html').includes('learning-v20.css?v=20'));
console.log('FinancePilot v20: 5 structured transfer cases; 25 correct assessments; 25 incorrect responses rejected; mastery gating, retries, and sync wiring validated.');
