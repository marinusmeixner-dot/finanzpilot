import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=file=>fs.readFileSync(file,'utf8');
const basics=JSON.parse(read('data/journey-v39.json'));
const questions=JSON.parse(read('data/journey-questions-v55.json'));
const skills=JSON.parse(read('data/specializations-v41.json'));
// The Journey loader upgrades active lessons to the verified four-option foundation bank.
for(const stage of basics.stages)for(const module of stage.modules){if(questions.questions[module.id])module.questions=questions.questions[module.id];}
const variants=JSON.parse(read('data/adaptive-variants-v77.json'));
const main=read('adaptive-study-v77.js'),sync=read('sync.js'),index=read('index.html');
const allSkills=skills.skills.flatMap(s=>s.lessons);
assert.equal(allSkills.length,156);
assert.equal(variants.schema_version,1);
assert.equal(variants.variants.length,25);
assert.equal(new Set(variants.variants.map(v=>v.id)).size,25);
const activeIds=new Set([...basics.stages.flatMap(s=>s.modules.map(m=>m.id)),...allSkills.map(x=>x.id)]);
for(const v of variants.variants){
 assert(activeIds.has(v.lesson_id),'Unknown variant target '+v.lesson_id);
 assert(v.prompt.length>=32&&v.explanation.length>=38,v.id+' needs clear, actionable content');
 if(v.type==='mcq'){
  assert.equal(v.options.length,4);
  assert(Number.isInteger(v.correct)&&v.correct>=0&&v.correct<4);
  assert.equal(v.diagnosis.length,4,'Each wrong selection needs an individual explanation');
  assert(v.diagnosis.filter((x,i)=>i!==v.correct).every(x=>x.length>=25),'Explain every wrong option');
 }else{
  assert.equal(v.type,'numeric');
  assert(Number.isFinite(v.answer)&&Number.isFinite(v.tolerance)&&v.tolerance>0);
  assert(v.steps?.length===3,'Numeric cases show worked derivations');
 }
}
const store={};
let now=Date.parse('2026-11-03T12:00:00Z'),events=[],ready={};
class TestDate extends Date{static now(){return now}}
const w={FinanzPilotCloud:{user:'user-123'},FinanzPilotLearningHub:{catalog:skills,status:{lessons:allSkills.map(l=>({lesson_id:l.id,completed_at:now-2*86400000}))}},
  FinanzPilotJourney:{catalog:basics,completed:Object.fromEntries(Object.keys(questions.questions).map(id=>[id,now-2*86400000]))},
  addEventListener:(name,handler)=>{ready[name]=handler},
  dispatchEvent:(event)=>events.push(event.type),
  render:()=>{}
};
const doc={readyState:'loading',addEventListener:(event,handler)=>{ready['doc-'+event]=handler}};
const localStorage={getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=v},removeItem:k=>delete store[k]};
const ctx={window:w,document:doc,localStorage,Event:class{constructor(type){this.type=type}},Date:TestDate,Math,Number,String,Array,JSON,Intl,console,Set,Map,
 fetch:async()=>({ok:true,json:async()=>variants})};
vm.runInNewContext(main,ctx,{filename:'adaptive-study-v77.js'});
const app=w.FinanzPilotAdaptive;
await app.load();
const pool=app.queue();
assert.equal(pool.length,174,'156 skill and 18 foundation lessons in review pool');
assert.equal(app.dueCount(),174,'Past completions without adaptive evidence are due');
const firstBranches=new Set(pool.slice(0,8).map(x=>x.branch));
assert(firstBranches.size>=5,'Mixed review plan should contain several financial domains');
assert.equal(app.variants(pool.find(x=>x.id==='rechnen-marge')).length,4,'Foundation: 2 independent quiz items, one open transfer, one newly calculated case');
assert.equal(app.variants(pool.find(x=>x.id==='working-capital-diagnose-1')).length,4,'Specialist: original question, numeric practice, open transfer, and new numeric case');
assert(app.variants(pool.find(x=>x.id==='berichte-lesen-1')).length>=3);
const original=app.variants(pool.find(x=>x.id==='rechnen-marge')).find(v=>v.id.endsWith(':q1'));
assert(original&&original.options.length===4);
assert(app.start('rechnen-marge'));
const a=app.active;
assert(a.variant&&a.stage==='ask');
assert.equal(app.objective(),false,'Cannot grade before choosing answer and reporting confidence');
a.confidence=3;
a.selected=a.variant.correct===0?1:0;
assert(app.objective(),'The wrong answer must be objectively graded');
assert.equal(app.active.stage,'feedback');
assert.equal(app.objective(),false,'Double clicking cannot produce a second attempt');
const wrong=app.knowledge('rechnen-marge');
assert.equal(wrong.objectiveTested,1);
assert.equal(wrong.objectiveCorrect,0);
assert(wrong.dueAt>now&&wrong.dueAt<=now+7*3600000,'High-confidence misconception repeats within six hours');
assert(app.renderReview().includes('Wissenslücke erkannt'),'Feedback diagnoses overconfidence only after a real wrong answer');
assert.equal(app.numericDiagnosis(-7.5,7.5,.001).kind,'sign','Sign reversal is diagnosed distinctly');
assert.equal(app.numericDiagnosis(.075,7.5,.001).kind,'percent','Percent scaling mistake gets targeted feedback');
assert.equal(app.numericDiagnosis(7500,7.5,.001).kind,'units','Thousandfold unit errors are identified');
assert.equal(app.numericDiagnosis(1/12,12,.001).kind,'inverse','Inverted financial ratios are identified');
assert(app.selectVariant(pool.find(x=>x.id==='rechnen-marge')).id!==a.variant.id,'New review switches variants');
assert(app.start('rechnen-marge'));
const next=app.active;
next.confidence=2;
if(next.variant.type==='mcq')next.selected=next.variant.correct;
else if(next.variant.type==='numeric')next.input=String(next.variant.answer);
else {next.stage='reflection';assert(app.reflect(2));}
if(next.stage==='ask')assert(app.objective());
const k=app.knowledge('rechnen-marge');
assert.equal(k.attempts,2,'Two independent exercises are stored');
const storeKey='finanzpilot_adaptive_v77';
assert(store[storeKey]?.includes('attempts'));
assert(events.includes('fp-progress-change'),'Practice events must trigger private cloud synchronization');
assert(!main.includes('fp_foundation_complete_v55')&&!main.includes('fp_specialization_action')&&!main.includes('awardFoundation'),'Practice must never call XP or FP reward APIs');
// Official answer verification feeds a baseline only; not an unearned long-term mastery result.
app.observeLesson('cashflow-einfach',true,'foundation-question-0');
assert.equal(app.knowledge('cashflow-einfach').stage,0);
assert.equal(app.knowledge('cashflow-einfach').last.mode,'lesson');
assert.equal(app.knowledge('cashflow-einfach').last.quality,2);
// A delayed objective review is the only way to claim measured delayed retrieval.
app.record('cashflow-einfach',{mode:'mcq',variant:'x2',ok:true,quality:4,confidence:3});
now+=8*86400000;
app.record('cashflow-einfach',{mode:'numeric',variant:'x3',ok:true,quality:4,confidence:3});
now+=31*86400000;
app.record('cashflow-einfach',{mode:'mcq',variant:'x4',ok:false,quality:0,confidence:3});
const observed=app.knowledge('cashflow-einfach');
assert.equal(observed.delayed7.count,2);
assert.equal(observed.delayed30.count,1);
assert.equal(observed.delayed30.correct,0);
assert(app.stats().seven.total>=2&&app.stats().thirty.total>=1);
assert.notEqual(observed.label,'Längerfristig bestätigt','Recent observed failure weakens the indicated knowledge status');
// Merge independent device logs by immutable event ID; never add up duplicates.
const start=sync.indexOf('  function mergeAdaptive('),end=sync.indexOf('  function mergePayload(',start);
assert(start>0&&end>start&&sync.includes("'finanzpilot_adaptive_v77'"));
const mergeSource=sync.slice(start,end)+';return mergeAdaptive;';
const merge=new Function('isObject','Set','Map',mergeSource)(x=>x&&typeof x==='object'&&!Array.isArray(x),Set,Map);
const existing=app.state.attempts['cashflow-einfach'];
const local={owner:'user-123',attempts:{'cashflow-einfach':[existing[0],existing[1]]}};
const cloud={owner:'user-123',attempts:{'cashflow-einfach':[existing[1],existing[2],existing[3]]}};
const result=merge(local,cloud);
assert.equal(result.attempts['cashflow-einfach'].length,4,'Devices preserve all events without duplicate counting');
assert.deepEqual(result.attempts['cashflow-einfach'].map(x=>x.id),merge(result,cloud).attempts['cashflow-einfach'].map(x=>x.id),'Re-sync is idempotent');
assert(index.includes('adaptive-study-v77.js?v=77')&&index.includes('adaptive-study-v77.css?v=77'),'Adaptive runtime and UI are loaded');
assert(index.includes('study-coach-v46.js?v=77')&&index.includes('sync.js?v=77'));
assert(read('study-coach-v46.js').includes('FinanzPilotAdaptive?.renderReview'),'Original review tab delegates to adaptive review');
assert(read('journey-v39.js').includes('FinanzPilotAdaptive?.observeLesson'),'Foundations feed objective grades');
assert(read('learning-hub-v41.js').includes('FinanzPilotAdaptive?.observeLesson'),'Only server-confirmed skills feed objective grades');
assert.equal(JSON.parse(read('version.json')).version,77);
console.log('V77 adaptive learning PASS: 174 lesson topics, 25 curated variants, mixed questions, secure objective grading, confidence/feedback, 7- and 30-day observation, distributed review schedule, CRDT-safe merge, no XP changes.');
