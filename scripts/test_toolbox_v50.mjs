import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const script=fs.readFileSync('toolbox-v50.js','utf8');
const data=JSON.parse(fs.readFileSync('data/specializations-v41.json','utf8'));
const reports=JSON.parse(fs.readFileSync('data/company-financials-v47.json','utf8'));
const html=fs.readFileSync('index.html','utf8');
const career=fs.readFileSync('career.js','utf8');
assert(html.includes('toolbox-v50.js?v=50')&&html.includes('toolbox-v50.css?v=50'));
assert(html.includes('career.js?v=50" defer'));
assert(career.includes('FinanzPilotToolbox?.render')&&career.includes('FinanzPilotToolbox?.bind'));
assert(career.includes('jede drei erfolgreich bestandenen neuen Spezialisierungen'));
const store={};
let currentUser=null;
const window={
 FinanzPilotCloud:{get user(){return currentUser}},
 FinanzPilotLearningHub:{catalog:data,status:{lessons:[]}},
 render(){},FinanzPilotNavigation:{route(){}}
};
const localStorage={getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=v}};
const document={readyState:'loading',addEventListener(){}};
const ctx=vm.createContext({window,localStorage,document,console,Date,Math,Intl,Number,String,Array,Object,fetch:async()=>({ok:true,json:async()=>reports})});
vm.runInContext(script,ctx,{filename:'toolbox-v50.js'});
const t=window.FinanzPilotToolbox;
assert.equal(t.tools.length,7);
assert(t.tools.every(d=>data.skills.some(s=>s.id===d.skill)));
assert(t.tools.every(d=>!t.gate(d.id).available),'Guest cannot earn toolkit access.');
currentUser='aaaaaaaa-1111-2222-3333-bbbbbbbbbbbb';
assert(t.tools.every(d=>!t.gate(d.id).available),'No stored completions: tools remain locked.');
const skill=data.skills.find(x=>x.id==='berichte-lesen');
window.FinanzPilotLearningHub.status.lessons=skill.lessons.map(x=>({lesson_id:x.id,completed_at:'2026-11-02T10:00:00Z'}));
assert(t.gate('report').available);
assert(!t.gate('dcf').available);
const test=(id,fields,fragment)=>{const r=t.calc(id,fields);assert(r.facts.some(x=>String(x[1]).includes(fragment)),id+': '+JSON.stringify(r.facts));assert(r.math.length>35&&r.caution.length>50)};
test('cashflow',{profit:'80',noncash:'24',working:'-18',capex:'30'},'56');
test('dcf',{fcf:'100',growth:'5',wacc:'10',terminal:'2',debt:'200',shares:'50',price:'30'},'Mio.');
test('portfolio',{capital:'10000',w1:'40',r1:'-30',w2:'35',r2:'-15',w3:'15',r3:'5'},'-16,5');
test('trade',{capital:'10000',risk:'1',entry:'50',stop:'46',target:'62',fee:'4',gap:'42'},'24');
test('etf',{capital:'10000',return:'8',fees:'0,2',tax:'20',inflation:'2'},'10.624');
test('research',{name:'Beispiel',thesis:'A',source:'https://example.org/report',fact:'120 Mio.',counter:'B',trigger:'C',review:'2026-12-01'},'6 von 6');
for(const [id,fieldset] of [
 ['cashflow',{profit:'NaN',noncash:'24',working:'-18',capex:'30'}],
 ['portfolio',{capital:10000,w1:99,r1:-30,w2:30,r2:10,w3:0,r3:0}],
 ['trade',{capital:10000,risk:1,entry:50,stop:55,target:62,fee:4,gap:42}],
 ['dcf',{fcf:100,growth:5,wacc:2,terminal:4,debt:0,shares:10,price:10}]
])assert.throws(()=>t.calc(id,fieldset),id+' must reject invalid inputs');
assert.throws(()=>t.save('research',{thesis:'x'},'x'),'A tool cannot be saved without required verified skill.');
const one=t.save('report',{symbol:'SIE.DE'},'Siemens analysis');
assert.equal(t.history()[0].id,one.id);
currentUser='cccccccc-1111-2222-3333-dddddddddddd';
assert.equal(t.history().length,0,'Saved records must not be shared across user accounts.');
currentUser='aaaaaaaa-1111-2222-3333-bbbbbbbbbbbb';
assert.equal(t.history().length,1);
await t.loadReports();
for(const c of reports.companies){
 const s=t.reportView(c.symbol);
 assert(s.includes(c.name.replaceAll('&','&amp;')),c.symbol);
 assert(s.includes('Primärquelle öffnen'),c.symbol);
 assert(s.includes('aufklappen')||s.includes('Aufklappen'),c.symbol);
}
assert(!/eval\s*\(|new Function\s*\(/.test(script));
assert(!/\.rpc\s*\(|insert\(|update\(/.test(script),'Toolbox must not issue trading or reward mutations.');
console.log('v50 toolbox: seven earned working tools, model calculations, data-source report reader, validation, per-account local saves and no economy changes PASS.');
