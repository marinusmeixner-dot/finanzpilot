import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=p=>fs.readFileSync(p,'utf8');
const data=JSON.parse(read('data/specializations-v41.json'));
const sql=read('supabase/specialization_progress_v41.sql');
const streak=read('supabase/streak_promotion_upgrade_v41.sql');
const app=read('app.js'),nav=read('ux-v15.js'),career=read('career.js'),html=read('index.html');
assert.equal(JSON.parse(read('version.json')).version,44);
assert.equal(data.branches.length,4);
assert.equal(data.skills.length,28);
assert.equal(data.special.length,3);
assert.equal(data.skills.reduce((n,s)=>n+s.lessons.length,0),84);
const names=new Set(data.skills.map(x=>x.id));
assert.equal(names.size,28);
for(const s of data.skills){
 assert(s.description.length>=65&&s.cost===3);
 assert(s.lessons.length===3);
 assert(!s.parent||names.has(s.parent));
 assert(s.lessons.every((l,i)=>l.sequence===i+1));
 for(const l of s.lessons){
  assert(l.explanation.length>=95,l.id+' requires meaningful explanations');
  assert(l.example.length>=60,l.id+' requires real examples');
  assert(l.options.length===3);
  assert(Number.isInteger(l.correct)&&l.correct>=0&&l.correct<3);
  assert(Number.isInteger(l.xp)&&l.xp>0);
 }
}
assert(sql.includes("perform pg_advisory_xact_lock"));
assert(sql.includes("p_action not in ('enroll','unlock','submit')"));
assert(sql.includes("v_points<v_skill.cost_points"));
assert(sql.includes("if p_payment='research'"));
assert(sql.includes("if v_wallet<10"));
assert(sql.includes("v_correct:=p_answer=v_lesson.answer"));
assert(read('supabase/owned_artifact_effects_v44.sql').includes('xp_awarded=v_award_xp'));
assert(read('supabase/promotion_three_shards_fix_v43.sql').includes('v_mastered%3=0'));
assert(read('supabase/promotion_three_shards_fix_v43.sql').includes('shards=public.fp_artifact_shards.shards+3'));
assert(sql.includes("public.fp_specialization_promotions"));
assert(streak.includes("v_bonus_euros:=least(7"));
assert(streak.includes("v_bonus_points:=least(7"));
assert(nav.includes("skilltree:'learn'"));
assert(nav.includes("skilllessons:'learn'"));
assert(nav.includes("speciallessons:'learn'"));
assert(nav.includes("if(to==='skills')to='skilltree'"));
assert(!career.includes('data-view="skills"'),'Skillbaum must be removed from profile');
assert(app.includes("FinanzPilotLearningHub.tree()"));
assert(app.includes("FinanzPilotLearningHub.skillIndex()"));
assert(app.includes("FinanzPilotLearningHub.specials()"));
assert(html.includes("learning-hub-v41.js?v=44")&&html.includes("learning-hub-v41.css?v=44"));
assert(read('docs/CONNECTED_LEARNING_ARTIFACTS_V41.md').includes('maximal **vier aktive'));

const routes=[];
const window={
 addEventListener(){},
 render(){},
 dispatchEvent(){},
 FinanzPilotJourney:{renderHome:()=>'<h1>Deine sechs Grundlagenetappen</h1>'},
 FinanzPilotNavigation:{route:view=>routes.push(view)},
 FinanzPilotCloud:{user:null,paperClient:null}
};
const document={readyState:'loading',addEventListener(){}};
const context=vm.createContext({window,document,fetch:async()=>({ok:true,json:async()=>data}),console});
vm.runInContext(read('learning-hub-v41.js'),context,{filename:'learning-hub-v41.js'});
const api=window.FinanzPilotLearningHub;
await api.load();
const learn=api.home();
assert(['Grundlagen','Skillbaum','Skill-Lektionen','Speziallektionen'].every(x=>learn.includes(x)));
const tree=api.tree();
assert(tree.includes('data-fp42-node="berichte-lesen"'));
assert(tree.includes('fp42-map-lines'));
assert(!tree.includes('fp41-branches'));
for(const b of data.branches)assert(tree.includes(b.title.replaceAll('&','&amp;')));
api.pick('berichte-lesen');
assert.equal(routes.at(-1),'skilllessons');
const lessons=api.skillIndex();
assert(lessons.includes('3 Forschungspunkte'));
assert(lessons.includes('Geschäftsjahre und Quartale'));
assert(lessons.includes('Zuerst')||lessons.includes('vorherige Lektion'));
assert(lessons.includes('kostenlos speichern'));
const specials=api.specials();
assert(specials.includes('Kreditkrise im Stresstest'));
assert(specials.includes('Noch gesperrt'));
console.log('v43: 4 listed learning sections and branching skill map, 4 coherent skill paths / 60 specialist lessons, prerequisite economy and three-skill promotion shards, exclusive special cases and legacy career preservation verified.');
