import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const economyScript=fs.readFileSync('economy.js','utf8');
const migration=fs.readFileSync('supabase/economy_v1.sql','utf8');
const remembered={
 'finanzpilot_training_v1':JSON.stringify({sessions:{'aixtron-auftraege':{answers:{
 '1':{correct:true,value:'121,7'},
 '2':{correct:true,value:[1,3]},
 '3':{correct:true,value:[1,3,0,2]},
 '4':{correct:true,value:[1]}
 }}}})
};
const localStorage={getItem:k=>remembered[k]||null,setItem:(k,v)=>{remembered[k]=v}};
const records={accounts:[],claims:[],perks:[],ledger:[],verified:[]};
const cloud={
 user:'test-identity',
 economyRead:async t=>({
 fp_economy_accounts:records.accounts,
 fp_reward_claims:records.claims,
 fp_reward_perks:records.perks,
 fp_reward_ledger:records.ledger,
 fp_verified_training:records.verified
 })[t],
 economyRpc:async(name,a)=>{
  if(name!=='fp_submit_training_answer')throw Error('Unexpected RPC');
  const correct={
   'aixtron-auftraege:1':a.p_answer===121.7,
   'aixtron-auftraege:2':JSON.stringify(a.p_answer)==='[1,3]',
   'aixtron-auftraege:3':JSON.stringify(a.p_answer)==='[1,3,0,2]',
   'aixtron-auftraege:4':a.p_answer===1
  }[a.p_module+':'+a.p_step]===true;
  if(correct&&!records.verified.some(x=>x.module_id===a.p_module&&x.step_index===a.p_step))
   records.verified.push({module_id:a.p_module,step_index:a.p_step});
  const count=records.verified.length,newReward=count===4&&records.claims.length===0;
  if(newReward){records.claims.push({module_id:a.p_module,item_id:'silicon-lens',choice:null});
   records.accounts.push({research_points:100,virtual_euro_cents:0});
   records.ledger.push({points_delta:100,event_type:'module_mastery',created_at:'2026-10-31T00:00:00Z'});}
  return {correct,verified:count,newReward};
 }
};
const events=new Map();
const window={FinanzPilotCloud:cloud,FinanzPilotMath:{calculate:s=>Number(String(s).replace(',','.'))},addEventListener:()=>{},dispatchEvent:()=>{}};
const document={readyState:'loading',body:{classList:{toggle:()=>{}}},addEventListener:(t,fn)=>events.set(t,fn)};
const state={view:'home'};
const context=vm.createContext({window,document,localStorage,state,Event:class Event{},console,confirm:()=>false});
vm.runInContext(economyScript,context,{filename:'economy.js'});
const econ=window.FinanzPilotEconomy;
await econ.refresh(false);
assert(econ.render().includes('0/4 Antworten bestätigt'));
const initial=await econ.certifySaved('aixtron-auftraege');
assert.equal(initial.awarded,true);
assert.equal(initial.verifiedCount,4);
assert(econ.render().includes('Silizium-Linse'));
assert(econ.render().includes('100 FP'));
const retry=await econ.certifySaved('aixtron-auftraege');
assert.equal(retry.awarded,false);
assert.equal(records.claims.length,1);
assert.equal(records.ledger.length,1);
assert.equal(records.accounts[0].research_points,100);
cloud.user=null;
await econ.refresh(false);
assert(econ.render().includes('Mit Google oder E-Mail anmelden'));
assert(!econ.render().includes('100 FP'));
for(const key of [
 'enable row level security',
 'revoke all on table',
 'on conflict(user_id,event_key) do nothing',
 'for update',
 "raise exception 'Gegenstand fehlt oder wurde bereits eingelöst'",
 'security definer set search_path'
]) assert(migration.includes(key),'Missing DB safety contract: '+key);
console.log('Economy checks passed: 4 answer validations, one-time mint, no duplicate claim, logout state cleared and SQL protections.');
