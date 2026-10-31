import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read=p=>fs.readFileSync(p,'utf8');
const catalog=JSON.parse(read('data/academy.json'));
const origin=catalog.courses.find(c=>c.id==='alphabet-q3-2026-cashflow-valuation');
const advanced=catalog.courses.find(c=>c.id==='alphabet-q3-2026-research-masterclass');
assert(origin&&advanced,'Original introductory Alphabet course and new masterclass must both remain');
assert.equal(origin.steps.length,10,'Do not mutate existing course steps or stored progress indices');
assert.equal(advanced.prerequisite_course_id,origin.id);
assert.equal(advanced.steps.length,20);
assert(advanced.source_url.includes('sec.gov/Archives/edgar'));
assert(advanced.evidence_note.includes('Modell'));
const nums=advanced.steps.filter(s=>s.type==='calc');
const expected=[102.6,15552,36.2,29.9,-9065,19747,1400,1360];
assert.deepEqual(nums.map(x=>x.answer),expected);
assert(Math.abs((30709-15157)/15157*100-102.6)<.1);
assert.equal(30709-15157,15552);
assert(Math.abs(11121/30709*100-36.2)<.1);
assert(Math.abs((40576-31228)/31228*100-29.9)<.1);
assert.equal(42290-51355,-9065);
assert.equal(179551-159804,19747);
assert.equal(70*20,1400);
assert.equal(450*.3+1400*.5+2625*.2,1360);
assert(advanced.steps.every((step)=>step.type!=='visual'||(step.rubric?.length>=3&&step.chart?.labels?.length===step.chart?.values?.length)));
assert(advanced.steps.every(step=>step.type!=='reflect'||step.rubric?.length>=4));
assert(advanced.steps.filter(step=>step.type==='choice').every(step=>step.correct>=0&&step.correct<step.options.length));

const memory={},listeners={};
const localStorage={
 getItem:k=>memory[k]??null,
 setItem:(k,v)=>{memory[k]=String(v)}
};
const state={view:'home'};
const root={innerHTML:'',prepend(){},querySelectorAll(){return []},querySelector(){return null}};
const document={
 readyState:'loading',documentElement:{dataset:{}},body:{append(){}},
 getElementById:id=>id==='view-root'?root:null,
 addEventListener:(name,fn)=>{listeners[name]=fn},
 querySelectorAll(){return[]},
 querySelector(){return null}
};
const window={location:{search:''},scrollTo(){},dispatchEvent(){},FinanzPilotMath:{calculate(raw){return Number(String(raw).replace(',','.'))},toolbar(){return ''},bind(){}}};
const context=vm.createContext({window,document,localStorage,state,daily:{stories:[]},console,Date,Intl,Math,JSON,Number,String,URLSearchParams,URL,
 fetch:async()=>({ok:true,json:async()=>catalog}),Event:class Event{constructor(type){this.type=type}},
 requestAnimationFrame:fn=>fn()});
vm.runInContext(read('academy.js'),context,{filename:'academy.js'});
assert(typeof listeners.DOMContentLoaded==='function');
listeners.DOMContentLoaded();
for(let i=0;i<8;i++)await Promise.resolve();
const app=window.FinanzPilotAcademy;
assert(app);
assert.equal(app.prerequisiteMet(advanced),false);
assert.equal(app.openCourse(advanced.id),false,'A locked course must not open via direct course links');
assert(app.render().includes('Noch gesperrt'),'The catalog should say why advanced courses are locked');
app.progress.completed[origin.id]=origin.steps.length;
assert.equal(app.prerequisiteMet(advanced),true);
assert.equal(app.openCourse(advanced.id),true);
assert.equal(state.view,'academycourse');
assert(root.innerHTML.includes('Erst das Geschäftsmodell'));
app.openCourse(origin.id);
app.progress.completed[advanced.id]=9;
app.openCourse(advanced.id);
assert(root.innerHTML.includes('academy-bar-negative'),'Negative FCF must appear as an actual negative bar');
assert(root.innerHTML.includes('Nullachse mittig'));
const academyCode=read('academy.js');
assert(academyCode.includes("st.type!=='teach'&&!checked"),'Cannot advance after incorrect answers');
assert(academyCode.includes("if(right){progress.answers"),'Only right results are passed');
assert(academyCode.includes("if(name==='retry')"),'Retry control must function');
assert(read('index.html').includes('academy.js?v=25'));
assert(read('index.html').includes('equity-masterclass-v22.css?v=22'));
console.log('Equity masterclass v22: 20 sourced stages, eight numeric checks, scenario valuation, locked prerequisite, signed FCF charts, and strict mastery verified.');
