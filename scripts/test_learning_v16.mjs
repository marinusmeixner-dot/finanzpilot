import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read=p=>fs.readFileSync(p,'utf8');
const content=JSON.parse(read('data/terminology.json'));
const legacyCode=read('skills.js'),worldCode=read('skill-world.js'),conceptCode=read('concepts.js');
assert.equal(content.schema_version,1);
assert.equal(content.modules.length,10);
assert.equal(content.modules.reduce((sum,m)=>sum+m.steps.length,0),40);
for(let i=0;i<content.modules.length;i++){
 const m=content.modules[i];
 assert.equal(m.steps.length,4);
 assert.equal(m.steps[0].type,'read');
 assert.equal(m.steps[1].type,'number');
 assert.equal(m.steps[2].type,'multi');
 assert.equal(m.steps[3].type,'decision');
 assert.equal(m.prerequisite,i===0?null:content.modules[i-1].id);
}

const memory={};
const storage={getItem:k=>memory[k]||null,setItem:(k,v)=>memory[k]=v};
const window={
 addEventListener(){},dispatchEvent(){},
 FinanzPilotMath:{calculate(raw){
  const n=String(raw).trim().replace(',','.');
  if(!/^[+\-]?\d+(?:\.\d+)?$/.test(n))return NaN;
  return Number(n);
 }}
};
const document={readyState:'loading',addEventListener(){}};
const context=vm.createContext({window,localStorage:storage,document,console,Date,Intl,Math,Number,String,JSON,Event:class{} ,fetch:async()=>({ok:true,json:async()=>content})});
vm.runInContext(legacyCode,context,{filename:'skills.js'});
const preserved=window.FinanzPilotSkills.levels;
const before=window.FinanzPilotSkills.levels();
assert.equal(Object.keys(before).length,13);

vm.runInContext(worldCode,context,{filename:'skill-world.js'});
assert.equal(window.FinanzPilotSkills.levels,preserved);
assert.equal(window.FinanzPilotSkillWorld.count,53);
assert.equal(window.FinanzPilotSkillWorld.edges.length,66);
assert.equal(Object.keys(window.FinanzPilotSkills.fullLevels()).length,53);

vm.runInContext(conceptCode,context,{filename:'concepts.js'});
await window.FinanzPilotConcepts.load();
const grade=window.FinanzPilotConcepts.grade;
for(const m of content.modules){
 const [_,num,multi,decision]=m.steps;
 assert(grade(num,String(num.answer).replace('.',',')).correct,'correct number '+m.id);
 assert(!grade(num,String(num.answer+10)).correct,'wrong number '+m.id);
 assert(grade(multi,multi.correct).correct,'correct multi '+m.id);
 assert(!grade(multi,[]).correct,'unanswered multi '+m.id);
 assert(grade(decision,[decision.correct]).correct,'correct decision '+m.id);
 assert(!grade(decision,[(decision.correct+1)%decision.options.length]).correct,'wrong decision '+m.id);
}
assert(window.FinanzPilotConcepts.render().includes('Lernstufen'));
memory.finanzpilot_concepts_v1=JSON.stringify({sessions:{guv:{step:4,answers:{1:{correct:true},2:{correct:true},3:{correct:true}},bestScore:3,completedAt:Date.now()}}});
const expanded=window.FinanzPilotSkills.fullLevels();
assert(expanded['p-guv-1'].mastered);
assert(expanded['p-guv-2'].mastered);
assert(expanded['p-guv-3'].mastered);
assert(expanded['p-margen-1'].available);
assert(!expanded['p-margen-3'].mastered);
assert.equal(Object.keys(window.FinanzPilotSkills.levels()).length,13);
assert(read('index.html').includes('skill-world.js?v=16-r2'));
assert(read('index.html').includes('concepts.js?v=28'));
assert(read('ux-v15.js').includes("concepts:'learn'"));
assert(read('sync.js').includes("'finanzpilot_concepts_v1'"));
console.log('V16 OK: 53 connected nodes / 66 edges, unchanged 13 career core skills, 10 progressive lessons and 30 verified question sets.');
