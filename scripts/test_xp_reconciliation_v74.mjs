import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=x=>fs.readFileSync(x,'utf8');
const foundation=JSON.parse(read('data/journey-questions-v55.json'));
const skillCatalog=JSON.parse(read('data/specializations-v41.json'));
assert.equal(Object.keys(foundation.questions).length,18,'Exactly 18 graded foundation lessons');
assert.equal(Object.values(foundation.questions).flat().length,36,'Each foundation lesson has two graded questions');
const skillLessons=skillCatalog.skills.flatMap(s=>s.lessons);
assert.equal(skillLessons.length,156,'All 156 graded skill lessons must retain XP');
assert(skillLessons.every(l=>Number(l.xp)>0&&Number.isInteger(l.correct)),'Skill lesson XP and correct answers must be present');
const sql=read('supabase/economy_balance_v56.sql');
assert(sql.includes('on conflict(user_id,module_id) do nothing'),'Foundation awards must be server-idempotent');
assert(sql.includes('v_correct:=p_answer=v_lesson.answer;'),'Wrong skill answers must not be rewarded');
assert(sql.includes("if not v_correct then return"),'Wrong skill answers cannot reach XP update');
assert(sql.includes('xp_awarded=v_award_xp'),'Skill lesson XP must persist with completion');
const levels=read('levels-v55.js'),journey=read('journey-v39.js'),hub=read('learning-hub-v41.js');
assert(levels.includes("from('fp_foundation_rewards_v55').select('module_id').eq('user_id',id)"),'Ledger verification uses authenticated RLS');
assert(!levels.includes('if(claims(id)[moduleId])return null'),'Local cache must not suppress XP');
assert(levels.includes('backfillAgain=true')&&levels.includes('if(backfillAgain)'),'Concurrent progress imports need a second pass');
assert(journey.includes("if(window.FinanzPilotCloud?.user){"),'Completed local lessons may retry after a previous failed RPC');
assert(journey.includes("FinanzPilotLevels?.awardFoundation?.(m.id,m.title,false)"),'Only completed foundations claim rewards');
assert(hub.includes("XP wurden serverseitig gutgeschrieben."),'Skill answers show real XP');
assert(hub.includes("FinanzPilotLevels?.refresh?.(true)"),'Skill rewards refresh level progress');

// Simulate a browser whose local cache incorrectly says an unpaid lesson was paid.
const paid=new Set(['geld-wofuer']);const user='xp-account';let xp=20,calls=0,reads=0;
const memory={'finanzpilot_foundation_rewards_v55_'+user:JSON.stringify({'geld-wofuer':true,'was-ist-boerse':true})};
const done={'geld-wofuer':1711111111,'was-ist-boerse':1711112222};
const modules=[{id:'geld-wofuer',title:'Geld'},{id:'was-ist-boerse',title:'Börse'},{id:'anlagearten',title:'ETF'}];
let defer=null;
const api={
 from(table){assert.equal(table,'fp_foundation_rewards_v55');return {select(columns){assert.equal(columns,'module_id');return {async eq(field,id){assert.equal(field,'user_id');assert.equal(id,user);reads++;if(defer){const p=defer;defer=null;await p.promise}return{data:[...paid].map(module_id=>({module_id})),error:null}}}}}},
 async rpc(name,params){
  if(name==='fp_foundation_complete_v55'){
   calls++;const id=params.p_module_id,fresh=!paid.has(id);
   if(fresh){paid.add(id);xp+=8}
   return{data:{ok:true,awarded_now:fresh,module_id:id,xp_awarded:fresh?8:0,fp_awarded:0,xp_total:xp},error:null};
  }
  assert.equal(name,'fp_level_claim_v55');
  return{data:{ok:true,xp,level:1,next_xp:100,foundation_completed:paid.size,new_levels:[],level_euros_awarded:0},error:null};
 }
};
const events={},w={
 FinanzPilotCloud:{user,paperClient:api},
 FinanzPilotJourney:{completed:done,modules},
 FinanzPilotHeader:{refresh(){}},
 FinanzPilotCelebrations:{show(){}},
 addEventListener(k,v){events[k]=v}
};
const storage={getItem:k=>memory[k]||null,setItem:(k,v)=>{memory[k]=v},removeItem:k=>delete memory[k]};
const doc={readyState:'loading',addEventListener(){}};
vm.runInNewContext(levels,{window:w,document:doc,localStorage:storage,console,Date,Math,Number,String,Array,Set,JSON,Promise},{filename:'levels-v55.js'});
const manager=w.FinanzPilotLevels;
let result=await manager.backfill();
assert.equal(result.newly,1,'Unpaid cached lesson must be credited');
assert.equal(xp,28);
assert(paid.has('was-ist-boerse'));
result=await manager.backfill();
assert.equal(result.newly,0,'Repeat reconciliation is idempotent');
assert.equal(xp,28);
assert.equal(calls,1,'Already-paid lessons must not be submitted again');

// Progress imported while server request runs must trigger a second pass.
let resolve;
defer={promise:new Promise(r=>{resolve=r})};
const running=manager.backfill();
done.anlagearten=1711113333;
await manager.backfill();
resolve();
await running;
for(let i=0;i<18;i++)await Promise.resolve();
assert(paid.has('anlagearten'),'Newly-imported completion was not lost');
assert.equal(xp,36,'One and only one XP award for the imported lesson');
assert.equal(manager.status.xp,36,'Level view reads refreshed server XP');
result=await manager.awardFoundation('anlagearten','ETF',false);
assert.equal(result.awarded_now,false,'Repeated claim confirmed without double payment');
assert.equal(xp,36);
console.log('V74 XP PASS: 18 foundations, 156 skill lessons; stale cache, reloads and concurrent cloud sync cannot lose or duplicate XP.');
