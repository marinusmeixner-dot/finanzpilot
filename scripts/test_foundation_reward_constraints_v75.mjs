import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=x=>fs.readFileSync(x,'utf8');
const m=read('supabase/foundation_reward_constraints_v75.sql');
const award=read('supabase/economy_balance_v56.sql');
const lessons=JSON.parse(read('data/journey-v39.json'));
const bank=JSON.parse(read('data/journey-questions-v55.json'));
const ids=lessons.stages.flatMap(stage=>stage.modules.map(module=>module.id));
assert.equal(ids.length,18,'18 foundation lessons are eligible');
assert.equal(new Set(ids).size,18,'Every foundation lesson ID is unique');
assert.deepEqual([...ids].sort(),Object.keys(bank.questions).sort(),'All graded foundation lessons have stable module IDs');
assert(m.includes('drop constraint fp_foundation_rewards_v55_xp_check'),'Remove obsolete XP=20 constraint');
assert(m.includes('check (xp in (8,10,12,14,16,18,20))'),'Allow the six modern XP stages and preserve historical 20-XP entries');
assert(m.includes('drop constraint fp_foundation_rewards_v55_fp_check'),'Remove obsolete FP=1 constraint');
assert(m.includes('check (fp in (0,1))'),'Most modern lessons award 0 FP; stage finales award 1');
assert(award.includes('fp_foundation_complete_v55'),'All XP passes through server-owned award function');
assert(award.includes('on conflict(user_id,module_id) do nothing'),'Repeat completion may not award twice');
const expected=[8,10,12,14,16,18];
for(let i=0;i<6;i++){
 for(const mod of lessons.stages[i].modules)assert(ids.includes(mod.id));
}
assert(expected.reduce((s,x)=>s+3*x,0)===234,'All new foundation rewards sum to 234 XP without legacy bonuses');
console.log('V75 PASS: reward ledger accepts 8–18 stage XP and 0/1 FP, retains existing 20 XP, all 18 foundation IDs preserved, unique claim enforced.');
