import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read=file=>fs.readFileSync(file,'utf8');
const audio=read('feedback-v52.js'),celebrate=read('celebrations-v53.js');
const js=read('journey-v39.js'),css=read('celebrations-v53.css'),markup=read('index.html');
assert(markup.includes('feedback-v52.js?v=61')&&markup.includes('celebrations-v53.js?v=61'),'iPhone must fetch new scripts rather than old PWA cache.');
assert(markup.includes('celebrations-v53.css?v=58'),'Fresh animation stylesheet loaded.');
assert(/answer:\[\[\d+/.test(audio),'A defined confirmation tone exists.');
assert(/wrong:\[\[\d+/.test(audio),'A distinct error tone exists.');
assert(audio.includes('role="switch" id="fp52-sound-pref"')&&audio.includes('role="switch" id="fp52-motion-pref"'),'Two simple switches replace all test/demo buttons.');
assert(js.includes("i===q.correct?'answer':'wrong'"),'Every correct/incorrect Grundlagen choice plays its own ping.');
assert(read('lesson-view-v46.js').includes("correct?'answer':'wrong'"),'Special practice also signals wrong answers.');
assert(read('learning-hub-v41.js').includes("tone?.('wrong')"),'Server-verified wrong specialization answer signals error.');
assert(!css.includes(':root.fp52-motion'),'Reward display should not depend on fragile initialization class.');
assert(css.includes('html:not(.fp52-static)')&&css.includes('pointer-events:none'),'Visible, self-fading, nonblocking animation when motion is enabled.');
assert(celebrate.includes("duration:2600,level:2"),'Completed lessons get noticeable, particle-backed celebrations.');
assert(celebrate.includes('if(active||document.hidden)queue.push(entry);else present(entry);'),'All confirmed rewards are queued.');
assert(celebrate.includes('dismissTimer=setTimeout(advance'),'All reveals self close.');
assert(!celebrate.includes('fp53-card'),'No modal or card reward.');

const catalog=JSON.parse(read('data/journey-v39.json'));
const bank=JSON.parse(read('data/journey-questions-v55.json'));
const effects=[],tones=[],memory={},events={},calls=[];
const doc={readyState:'loading',addEventListener(n,fn){events[n]=fn}};
const win={
 FinanzPilotNavigation:{route(v){calls.push(['route',v])},goBack(){return true}},
 FinanzPilotStudy:{seed(){}},FinanzPilotFeedback:{tone(kind){tones.push(kind)}},
 FinanzPilotCloud:{user:'account-1'},
 FinanzPilotLevels:{
  awardFoundation(id,title,celebrate){assert.equal(celebrate,false,'No duplicate animation before server confirms reward.');calls.push(['serverAward',id]);return Promise.resolve({awarded_now:true,xp_awarded:8,fp_awarded:0})},
  refresh(){}
 },
 FinanzPilotCelebrations:{show(kind,payload){effects.push({kind,payload});return true}},
 dispatchEvent(){},render(){},scrollTo(){},addEventListener(){},
};
const vmctx=vm.createContext({window:win,document:doc,
 localStorage:{getItem:key=>memory[key]||null,setItem:(key,v)=>memory[key]=v},
 fetch:async url=>({ok:true,json:async()=>String(url).includes('questions')?bank:catalog}),
 Date,Math,Number,Object,String,Set,Promise,console,Event:class{constructor(type){this.type=type}}
});
vm.runInContext(js,vmctx,{filename:'journey-v39.js'});
const j=win.FinanzPilotJourney;
await j.load();
assert.equal(j.modules.length,18);
j.open('geld-wofuer');
assert.equal(j.state.selected,'geld-wofuer','First foundation lesson is opened.');
function button(dataset={}){const handlers={};return {dataset,addEventListener(n,cb){handlers[n]=cb},click(){assert(handlers.click,'missing click');handlers.click()}}}
function tap(which,index){
 const nodes={
  next:button(),check:button(),complete:button(),prev:button(),
  answers:Array.from({length:4},(_,i)=>button({journeyAnswer:String(i)}))
 };
 const root={
  querySelectorAll(sel){return sel==='[data-journey-answer]'?nodes.answers:[]},
  querySelector(sel){return {'[data-journey-next]':nodes.next,'[data-journey-check]':nodes.check,'[data-journey-complete]':nodes.complete,'[data-journey-prev]':nodes.prev}[sel]||null}
 };
 j.bind(root);
 (which==='answer'?nodes.answers[index]:nodes[which]).click();
}
tap('next');tap('next');
assert.equal(j.state.lessons['geld-wofuer'].page,2);
const q=bank.questions['geld-wofuer'];
tap('answer',(q[0].correct+1)%4);
assert.equal(tones.length,0,'Selection must never emit a sound.');
assert(!j.renderFor('journeycourse').includes('Noch nicht richtig.'));
tap('check');
assert(tones.includes('wrong'),'Only checking plays the failure sound.');
tap('answer',q[0].correct);
assert.equal(tones.length,1,'Selecting a replacement answer stays silent.');
tap('check');
assert(tones.includes('answer'),'Correct check plays simple confirmation sound.');
assert.equal(effects.length,0,'No animated correct-choice toast.');
tap('next');tap('answer',q[1].correct);tap('check');
assert(j.renderFor('journeycourse').includes('Lektion abschließen'));
assert.equal(j.state.lessons['geld-wofuer'].page,3);
tap('complete');
assert.equal(effects[0].kind,'basics','Completion is celebrated immediately on user gesture, even before asynchronous RPC.');
assert(!effects[0].payload.value,'No premature or fabricated XP before cloud award.');
assert(calls.some(x=>x[0]==='serverAward'),'Authenticated first completion requests idempotent reward from server.');
await Promise.resolve();await Promise.resolve();
assert(effects.some(x=>x.kind==='reward'&&x.payload.value==='+8 XP'),'Server-earned amount gets its own reveal.');
const priorAwards=calls.filter(x=>x[0]==='serverAward').length;
const priorEffects=effects.length;
j.open('geld-wofuer');tap('complete');
assert.equal(calls.filter(x=>x[0]==='serverAward').length,priorAwards,'Repeat does not earn points again.');
assert.equal(effects.length,priorEffects+1,'Repeat completion still gets satisfying animation.');
assert(effects.at(-1).payload.text.includes('keine zusätzlichen Punkte'),'Repeat reward clearly has no XP/FP.');
console.log('V58 PASS: correct and wrong high short pings, instant first and repeat lesson animation, no answer animation, server-only points, bounded self-fading effects, responsive PWA assets.');
