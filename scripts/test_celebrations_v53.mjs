import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=f=>fs.readFileSync(f,'utf8');
const source=read('celebrations-v53.js'),css=read('celebrations-v53.css'),html=read('index.html');
assert(html.includes('celebrations-v53.js?v=54')&&html.includes('celebrations-v53.css?v=54'));
assert(css.includes('fp54-lesson')&&css.includes('fp54-skill')&&css.includes('fp54-artifact')&&css.includes('fp54-promotion'));
assert(!/infinite|setInterval\s*\(/.test(css+source));
assert(!/createElement\(['\"]canvas['\"]\)|getUserMedia|fetch\s*\(|https?:\/\//.test(source),'No media payload, canvas, remote effect or UI polling.');
assert(source.includes('confirmed!==true'),'Only verified commits may trigger a reveal.');
const timers=new Map();let timerId=0;
const host={hidden:true,innerHTML:'',textContent:'',setAttribute(){},querySelector(){return {addEventListener(){}}}};
const docEvents={},winEvents={};
let hidden=false,reduce=false,gesture=false;
const doc={
 readyState:'loading',
 get hidden(){return hidden},
 body:{append(node){assert.equal(node,host)}},
 createElement(){return host},
 getElementById(id){return id==='fp53-celebration'&&host.id?host:null},
 addEventListener(type,cb){docEvents[type]=cb}
};
const tones=[];
const win={matchMedia(){return{get matches(){return reduce}}},addEventListener(type,cb){winEvents[type]=cb},
 FinanzPilotFeedback:{tone(name){tones.push(name)},preferences:{motion:'system'}}};
const ctx=vm.createContext({window:win,document:doc,Date,Array,Object,Math,String,console,setTimeout(fn,d){timers.set(++timerId,{fn,d});return timerId},clearTimeout(n){timers.delete(n)}});
vm.runInContext(source,ctx,{filename:'celebrations-v53.js'});
const celebrations=win.FinanzPilotCelebrations;
assert.equal(celebrations.show('artifact',{title:'test'}),false,'Unverified success should not animate.');
assert.equal(celebrations.show('fake',{confirmed:true}),false);
assert.equal(celebrations.mount(),host);
assert.equal(celebrations.show('lesson',{confirmed:true,id:'lesson:1',title:'Lektion',value:'+15 XP'}),true);
assert.equal(celebrations.active,'lesson');
assert(!host.hidden);
assert(!host.innerHTML.includes('fp53-card')&&!host.innerHTML.includes('fp53-close'),'No card, dialog or close button.');
assert(/pointer-events:none/.test(css),'Effects must not block normal app interaction.');
assert(host.innerHTML.includes('LEKTION BESTANDEN')&&host.innerHTML.includes('+15 XP'));
assert(!host.innerHTML.includes('fp54-particle '),'No particles for a small lesson.');
assert.equal(celebrations.show('lesson',{confirmed:true,id:'lesson:1'}),false,'Repeated reward id must be suppressed.');
assert.equal(celebrations.show('skill',{confirmed:true,id:'skill:2',title:'Skill fertig'}),true);
assert(celebrations.queued.includes('skill'));
assert.equal(celebrations.show('promotion',{confirmed:true,id:'promotion:1',title:'Stufe 1'}),true);
assert(celebrations.queued.includes('promotion'));
const next=[...timers.values()][0];next.fn();
assert.equal(celebrations.active,'skill');
assert(host.innerHTML.includes('fp54-particle'));
let done=[...timers.values()][0];done.fn();
assert.equal(celebrations.active,'promotion');
assert(host.innerHTML.includes('BEFÖRDERUNG!'));
reduce=true;
celebrations.stop();
assert(host.hidden);
assert.equal(celebrations.show('artifact',{confirmed:true,id:'art:3',title:'Datenprisma',text:'<script>alert(1)</script>'}),true);
assert(host.innerHTML.includes('&lt;script&gt;'),'Escapes all content.');
assert(!host.innerHTML.includes('fp54-particle '),'Reduced motion never creates particles.');
assert(host.innerHTML.includes('NEUES ARTEFAKT'));
hidden=true;celebrations.stop();
assert.equal(celebrations.show('streak',{confirmed:true,id:'today:1'}),false,'No background reveals.');
assert.equal(tones.length,0,'No autoplay sound without gesture.');
const hub=read('learning-hub-v41.js'),economy=read('economy.js'),missions=read('missions-v51.js'),streak=read('streak-v40.js'),journey=read('journey-v39.js');
for(const t of ["'skillUnlock'","'lessonUnlock'","'promotion'","'skill'","'lesson'"])assert(hub.includes(t),t);
assert(hub.includes('data?.unchanged!==true'),'Repeat course completion must remain silent.');
assert(economy.includes("show?.('artifact'")&&economy.includes('data?.id&&data?.kind'));
assert(missions.includes("show?.('mission'")&&missions.includes('result.points_awarded>0'));
assert(streak.includes("show?.('streak'")&&streak.includes('Number(data.milestone)>0'));
assert(journey.includes("show?.('basics'")&&journey.includes('firstFinish'));
console.log('V53: Only confirmed new server achievements, reward hierarchy, capped effects, reduced-motion, no-autoplay, escaping, duplicate suppression, deferred queue and all 6 integration points PASS.');