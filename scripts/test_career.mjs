import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const config=JSON.parse(fs.readFileSync('data/career.json','utf8'));
const skillCode=fs.readFileSync('skills.js','utf8');
const careerCode=fs.readFileSync('career.js','utf8');
async function boot(progress={}){
 const store={...progress};
 const localStorage={getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=v}};
 const window={FinanzPilotMath:{calculate:s=>{const n=String(s).replace(',','.');if(!/^[-+]?\d+(?:\.\d+)?$/.test(n))throw Error('bad number');return Number(n)}}};
 const document={readyState:'loading',addEventListener(){}};
 const fetch=async()=>({ok:true,json:async()=>config});
 const sandbox=vm.createContext({window,localStorage,document,fetch,console});
 vm.runInContext(skillCode,sandbox,{filename:'skills.js'});
 vm.runInContext(careerCode,sandbox,{filename:'career.js'});
 await window.FinanzPilotCareer.load();
 return window.FinanzPilotCareer;
}
const empty=await boot();
assert.equal(empty.status().count,0);
assert.equal(empty.status().rank.id,'kursfunke');
assert(config.tools.every(x=>!empty.toolGate(x.id).available));
assert(config.collectibles.every(x=>!empty.status().collected(x)));
const partial=await boot({
 'finanzpilot_v1':JSON.stringify({completed:{etf:true,earnings:true,risk:true,diversify:true}}),
 'finanzpilot_training_v1':JSON.stringify({sessions:{'aixtron-auftraege':{bestScore:4},'alphabet-cloud':{bestScore:4}}})
});
assert.equal(partial.status().rank.id,'renditeschmied');
assert(partial.toolGate('margin').available);
assert(partial.toolGate('orders').available);
assert(!partial.toolGate('safety').available);
assert(partial.status().collected(config.collectibles.find(x=>x.id==='silicon-lens')));
assert(!partial.status().collected(config.collectibles.find(x=>x.id==='industrial-core')));
const master=await boot({
 'finanzpilot_v1':JSON.stringify({completed:{etf:true,earnings:true,risk:true,diversify:true,rates:true,emotion:true}}),
 'finanzpilot_lab_v3':JSON.stringify({completed:{breakout:true}}),
 'finanzpilot_academy_v4':JSON.stringify({completed:{'microsoft-full-fy25':8,'kion-deep-valuation-2026':22,'alphabet-q3-2026-cashflow-valuation':10}}),
 'finanzpilot_training_v1':JSON.stringify({sessions:{'kion-nachfrage':{bestScore:4},'aixtron-auftraege':{bestScore:4},'alphabet-cloud':{bestScore:4}}})
});
assert.equal(master.status().count,13);
assert.equal(master.status().rank.id,'kapitalnavigator');
assert(config.tools.every(x=>master.toolGate(x.id).available));
assert(config.collectibles.every(x=>master.status().collected(x)));
assert(master.render().includes('Werkzeugkasten'));
for(const [name,args,expected] of [
 ['margin',{revenue:'8522',previous:'8200,4',ebit:'632,5'},'7,4 %'],
 ['orders',{orders:'274,9',revenue:'183,6'},'1,50×'],
 ['safety',{fair:'58,20',price:'33,27',discount:'25'},'43,65'],
 ['risk',{w1:'60',r1:'-20',w2:'30',r2:'10'},'-9,0 %'],
 ['peer',{price:'33,27',shares:'131,1',debt:'1196',ebit:'845',multiple:'8'},'6,58×'],
 ['committee',{bear:'24,59',base:'58,20',bull:'94,65',pb:'30',pbase:'50',pbull:'20',price:'33,27'},'55,41']
]) assert(master.evaluate(name,args).includes(expected),'Rechner fehlerhaft: '+name);
for(const tool of config.tools)assert(config.ranks[tool.minRank],'Rang fehlt: '+tool.id);
console.log('Karriere-Tests bestanden: 3 Profile, 7 Freischaltungen, 4 Artefakte, 6 Rechenwege.');
