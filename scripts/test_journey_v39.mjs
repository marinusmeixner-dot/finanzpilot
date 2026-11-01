import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read=p=>fs.readFileSync(p,'utf8');
const data=JSON.parse(read('data/journey-v39.json'));
const app=read('app.js'),nav=read('ux-v15.js'),sync=read('sync.js'),css=read('journey-v39.css');
assert.equal(JSON.parse(read('version.json')).version,39);
assert.equal(data.schema_version,1);
assert.equal(data.stages.length,6);
assert.equal(data.stages.reduce((n,s)=>n+s.modules.length,0),36);
assert.equal(new Set(data.stages.map(x=>x.id)).size,6);
const ids=data.stages.flatMap(s=>s.modules.map(m=>m.id));
assert.equal(new Set(ids).size,36);
for(const [n,s] of data.stages.entries()){
 assert.equal(s.modules.length,6);
 assert.equal(s.modules[5].id,n===5?'abschluss-urteil':'bruecke-'+(n+1));
 for(const m of s.modules){
  assert(m.explain.length>=120&&m.example.length>=110,m.id+' has substantive beginner explanation and example');
  assert.equal(m.questions.length,2);
  for(const q of m.questions){
   assert(q.options.length>=3&&Number.isInteger(q.correct)&&q.correct<q.options.length);
   assert(q.explanation.length>40);
  }
 }
}
assert(nav.includes("if(v==='learn')return window.FinanzPilotJourney?.renderHome"));
for(let n=1;n<=6;n++)assert(nav.includes("'journey-"+n+"':'learn'"));
assert(app.includes("window.FinanzPilotJourney.renderFor(state.view)"));
assert(sync.includes("'finanzpilot_journey_v1'")&&sync.includes('mergeJourney(a,b)'));
assert(css.includes('.fp39-stage-grid')&&css.includes('.fp39-reading'));
const memory={},callbacks={},routes=[];
let view='learn';
const window={
 addEventListener:(event,callback)=>{callbacks[event]=callback},
 dispatchEvent(){},
 render(){},
 scrollTo(){},
 FinanzPilotNavigation:{
  route(next){routes.push(view);view=next},
  goBack(){view=routes.pop();return !!view}
 }
};
const document={readyState:'loading',addEventListener:(event,callback)=>callbacks[event]=callback};
const storage={getItem:key=>memory[key]||null,setItem:(key,value)=>memory[key]=value};
const context=vm.createContext({window,document,localStorage:storage,fetch:async()=>({ok:true,json:async()=>data}),
 console,Event:class Event{constructor(type){this.type=type}}});
vm.runInContext(read('journey-v39.js'),context,{filename:'journey-v39.js'});
const journey=window.FinanzPilotJourney;
await journey.load();
const initial=journey.renderHome();
assert(initial.includes('Mit Lektion 1 anfangen'));
assert(initial.includes('0 von 36'));
for(let n=1;n<=6;n++)assert(initial.includes('data-journey-stage="'+n+'"'));
assert(!initial.includes('Nächste Lernstufe'));
assert(!initial.includes('data-section-route="learnpath"'),'Old unordered advanced lessons must not remain on main learning screen');
const separate=data.stages.map((s,i)=>journey.renderFor('journey-'+(i+1)));
assert.equal(new Set(separate.map(html=>html.match(/<h1>(.*?)<\/h1>/)?.[1])).size,6);
assert(separate[0].includes('Wofür ist Geld da?'));
assert(separate[2].includes('Wachstum und Marge'));
assert(!separate[0].includes('KION:'));
journey.start();
assert.equal(view,'journeycourse');
assert.equal(routes.at(-1),'journey-1');
assert(journey.renderFor(view).includes('Erst die Idee verstehen'));
function press(selector,dataset={}){
 const element={dataset,addEventListener(name,fn){if(name==='click')this.callback=fn}};
 const root={querySelector:q=>q===selector?element:null,querySelectorAll:q=>q===selector?[element]:[]};
 journey.bind(root);
 assert(typeof element.callback==='function','Missing action '+selector);
 element.callback();
}
press('[data-journey-next]');
assert(journey.renderFor(view).includes('So sieht das im Alltag aus'));
press('[data-journey-next]');
assert(journey.renderFor(view).includes('VERSTÄNDNISCHECK'));
const first=data.stages[0].modules[0];
const wrong=(first.questions[0].correct+1)%first.questions[0].options.length;
press('[data-journey-answer]',{journeyAnswer:String(wrong)});
assert(journey.renderFor(view).includes('Noch nicht.'));
press('[data-journey-prev]');
assert(journey.renderFor(view).includes('So sieht das im Alltag aus'));
press('[data-journey-next]');
assert(!journey.renderFor(view).includes('Richtig.'));
press('[data-journey-answer]',{journeyAnswer:String(first.questions[0].correct)});
assert(journey.renderFor(view).includes('Richtig.'));
press('[data-journey-next]');
press('[data-journey-answer]',{journeyAnswer:String(first.questions[1].correct)});
press('[data-journey-next]');
assert(journey.renderFor(view).includes('Wissen gesichert'));
press('[data-journey-complete]');
assert.equal(view,'journey-1');
assert(journey.completed[first.id]);
assert.equal(journey.firstIncomplete().id,data.stages[0].modules[1].id);
const saved=JSON.parse(memory.finanzpilot_journey_v1);
assert(saved.completed[first.id]&&saved.lessons[first.id].answers[0].correct&&saved.lessons[first.id].answers[1].correct);
assert(!app.includes('fp39-lesson-reward'),'Journey must not award unapproved XP or artifacts');
console.log('v39: 36 unique beginner-to-investment lessons, six distinct screens, wrong-answer retry, safe page rewind, clear progression and preserved saves verified.');
