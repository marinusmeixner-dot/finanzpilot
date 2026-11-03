import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=file=>fs.readFileSync(file,'utf8');
const html=read('index.html'),bank=JSON.parse(read('data/journey-questions-v55.json'));
const pick=[[0,3,4],[0,1,4],[0,3,4],[0,1,4],[0,1,4],[0,2,4]]; // Correct below verified from live course selection.
const modules=new Set(['geld-wofuer','was-ist-boerse','anlagearten','unternehmen-geschaeft','umsatz-kosten','cashflow-einfach','wachstum-marge','aktienpreis-wert','bewertungsvergleiche','rechnen-veraenderung','rechnen-marge','rechnen-bewertung','analysieren-fragestellung','analysieren-quellen','analysieren-kurzbericht','urteil-fakt-vs-deutung','urteil-chancen-risiken','urteil-these-protokoll']);
assert.equal(Object.keys(bank.questions).length,18);
const counts=[0,0,0,0];
for(const [id,questions] of Object.entries(bank.questions)){
 assert(modules.has(id),id);
 assert.equal(questions.length,2);
 for(const q of questions){
  assert(q.prompt.length>=55,id);
  assert(q.explanation.length>=75,id);
  assert.equal(q.options.length,4);
  assert.equal(new Set(q.options).size,4);
  assert(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<4);
  counts[q.correct]++;
 }
}
assert(counts.every(x=>x>=4),'Answer positions must be distributed: '+counts);
const journey=read('journey-v39.js');
assert(journey.includes('QUESTION_DATA')&&journey.includes('questionBankLoaded=true'));
assert(journey.includes('reconcileQuestionSessions()'),'Migrate pending attempts when content changes');
assert(journey.includes('state.completed?.[m.id]'),'Previously completed foundation lessons must survive');
assert(journey.includes('FinanzPilotLevels?.awardFoundation?.(m.id,m.title,false)'),'Server XP is credited only after a local, immediately celebrated completion.');
assert(journey.includes("FinanzPilotFeedback?.tone?.(i===q.correct?'answer':'wrong')"),'Correct answer should have sound, not animation.');
const sync=read('sync.js');
assert(sync.includes("status==='pending'&&showSpinner"),'Invisible progress sync should not spin.');
assert(sync.includes("await sync(true,false)"),'Initial account sync must run without spinner.');
assert(sync.includes('sync:()=>sync(true)'),'Explicit user manual sync must still be possible.');
const levels=read('levels-v55.js'),css=read('levels-v55.css');
assert(html.includes('levels-v55.js?v='+JSON.parse(read('version.json')).version)&&html.includes('levels-v55.css?v=55'));
assert(html.includes('journey-v39.js?v='+JSON.parse(fs.readFileSync('version.json','utf8')).version)&&html.includes('sync.js?v=57'));
assert(levels.includes('fp_foundation_complete_v55')&&levels.includes('fp_level_claim_v55'));
assert(levels.includes('fp55-level')&&css.includes('.fp55-level.current'));
assert(read('streak-v40.js').includes("show?.('streak'")&&read('streak-v40.js').includes('data?.awarded_now'));
assert(read('celebrations-v53.js').includes("level:{caption:'LEVEL AUFGESTIEGEN!'"));
const notices=[];
const memory={};
const doc={readyState:'loading',addEventListener(){}};
let calls={foundation:0,level:0},uid='account123';
const client={rpc:async(name,params)=>{
 if(name==='fp_foundation_complete_v55'){calls.foundation++;const fresh=calls.foundation===1;return {data:{ok:true,awarded_now:fresh,module_id:params.p_module_id,xp_awarded:fresh?8:0,fp_awarded:0,xp_total:120},error:null}}
 if(name==='fp_level_claim_v55'){calls.level++;return {data:{ok:true,xp:120,level:2,next_xp:220,level_points_awarded:0,new_levels:[{level:2,points:0}],foundation_completed:1},error:null}}
 throw Error('unexpected RPC '+name);
}};
const events={};
const w={FinanzPilotCloud:{get user(){return uid},paperClient:client},FinanzPilotJourney:{completed:{},modules:[]},FinanzPilotHeader:{refresh(){}},
 FinanzPilotCelebrations:{show(kind,params){notices.push({kind,params})}},addEventListener(n,cb){events[n]=cb}};
const cx=vm.createContext({window:w,document:doc,localStorage:{getItem:key=>memory[key]||null,setItem:(key,v)=>memory[key]=v,removeItem:k=>delete memory[k]},Date,Number,Math,JSON,String,Array,console});
vm.runInContext(levels,cx,{filename:'levels-v55.js'});
const manager=w.FinanzPilotLevels;
assert(manager.render().includes('Level & Belohnungen'));
assert(manager.render().includes('Level 10')&&manager.render().includes('+2 FP')&&manager.render().includes('Level 5'));
let response=await manager.awardFoundation('geld-wofuer','Finanzgrundlagen',true);
assert.equal(response.xp_awarded,8);
assert.equal(calls.foundation,1);
assert.equal(calls.level,1);
assert(notices.some(n=>n.kind==='basics'));
assert(notices.some(n=>n.kind==='level'));
response=await manager.awardFoundation('geld-wofuer','Finanzgrundlagen',true);
assert.equal(response.awarded_now,false,'The server confirms an already-paid lesson without crediting it twice.');
assert.equal(calls.foundation,2,'A stale browser cache must not block server verification.');
assert(manager.render().includes('120'));
assert(manager.render().includes('Level 2'));
assert(manager.render().includes('Depotguthaben'),'Ordinary levels earn small cash, not FP');
console.log('V55: 36 challenging foundations, difficulty XP/stage FP, level roadmap, audible correct answer, first streak and non-spinning background sync PASS.');
