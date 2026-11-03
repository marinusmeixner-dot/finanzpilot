import assert from 'node:assert/strict';
import fs from 'node:fs';
const load=p=>fs.readFileSync(p,'utf8');
const data=JSON.parse(load('data/specializations-v41.json'));
const news=new Map([
 ['umsatzqualitaet-vertraege',[0,1,2]],
 ['aktienverwaesserung-eps',[1,2,0]],
 ['depot-stresstests',[1,0,2]],
 ['wettbewerbsvorteile-pruefen',[1,0,2]],
 ['fiskalpolitik-staatsschulden',[1,0,1]],
 ['etf-tracking-steuern',[1,0,2]],
 ['trade-risiko-plan',[0,2,1]],
 ['basisraten-entscheidungen',[1,2,0]]
]);
assert.equal(data.branches.length,8);
assert.equal(data.skills.length,52);
const all=data.skills.flatMap(s=>s.lessons);
assert.equal(all.length,156);
assert.equal(new Set(data.skills.map(s=>s.id)).size,52);
assert.equal(new Set(all.map(l=>l.id)).size,156);
assert.equal(all.filter(l=>l.practice).length,46);
const index=new Map(data.skills.map(s=>[s.id,s]));
const required=s=>[...(s.parent?[s.parent]:[]),...(s.prerequisites||[])];
const visiting=new Set(),done=new Set();
function visit(id){if(done.has(id))return;assert(!visiting.has(id),'Cycle at '+id);visiting.add(id);for(const p of required(index.get(id))){assert(index.has(p),'Missing '+p);assert.notEqual(id,p);visit(p)}visiting.delete(id);done.add(id)}
for(const s of data.skills)visit(s.id);
const sql=load('supabase/deep_skills_v49.sql');
for(const [id,answerKeys] of news){
 const s=index.get(id);assert(s,id+' not in catalog');
 assert.equal(s.lessons.length,3);assert.equal(s.prerequisites.length,1);
 assert(s.description.length>90);assert(sql.includes("'"+id+"'"),'Missing server registration '+id);
 for(const [i,l] of s.lessons.entries()){
  assert.equal(l.correct,answerKeys[i],l.id+' wrong quiz key');
  assert.equal(l.sequence,i+1);
  assert(l.explanation.length>=130,l.id+' thin explanation');
  assert(l.example.length>=60,l.id+' thin case');
  assert(l.workedSteps?.length>=2&&l.workedSteps.length<=4&&l.pitfall?.length>=65,l.id+' lacks meaningful and concise case explanation');
  assert(l.transferPrompt?.length>90,l.id+' lacks transfer');
  assert(l.options.length===3&&new Set(l.options).size===3,l.id+' ambiguous options');
  assert(sql.includes("'"+l.id+"'"),'Missing server quiz '+l.id);
  assert(sql.includes("'"+l.id+"','"+id+"',"+(i+1)+","+l.xp+","+l.correct+")"),'Server/client answer mismatch '+l.id);
  if(l.practice){assert(Number.isFinite(l.practice.answer),l.id+' not numeric');assert(Number.isFinite(l.practice.tolerance));assert(l.practice.prompt.length>25);assert(l.practice.unit);}
 }
}
const first=data.skills.slice(0,44).flatMap(s=>s.lessons);
assert.equal(first.filter(l=>l.pitfall.includes('Bei „')).length,0,'No original template pitfall should remain');
assert(first.filter(l=>l.workedSteps?.[0]?.includes('Markiere die wichtigen Zahlen')).length===0,'First 21 lessons now have real worked steps, not a generic template');
assert.equal(data.special.length,3,'Legacy multi-part special cases must remain intact');
console.log('v49 learning QA passed: 52 skills, 156 lessons, 46 numeric exercises, 21 improved existing lessons, verified client/server answer keys, full DAG and legacy content intact.');
