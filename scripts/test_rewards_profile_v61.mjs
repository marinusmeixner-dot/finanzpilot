import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=f=>fs.readFileSync(f,'utf8');
const html=read('index.html'),header=read('header-v43.js'),portfolio=read('portfolio.js');
const prefs=read('feedback-v52.js'),profile=read('profile-v42.js'),celebrations=read('celebrations-v53.js');
const economy=read('economy.js'),levels=read('levels-v55.js'),streak=read('streak-v40.js');
const version=JSON.parse(read('version.json'));
assert.equal(version.version,61);
assert(html.includes('top-depot')&&!html.includes('top-level'),'Replace level in topbar with total portfolio value.');
assert(!html.includes('fp43-level-trigger')&&!html.includes('fp52-settings-toggle'),'No header level or sound controls.');
for(const name of ['header-v43.js','portfolio.js','profile-v42.js','feedback-v52.js','celebrations-v53.js','economy.js'])assert(html.includes(name+'?v=61'),'Fresh PWA asset '+name);
assert(portfolio.includes('currencyStats')&&portfolio.includes('cash:balance,value,invested,total:round(balance+value)'),'Authoritative EUR portfolio total is cash PLUS holdings.');
assert(portfolio.includes('complete:valid&&!stats.unpriced'),'Must never show misleading incomplete total.');
const elements=Object.fromEntries(['top-depot','top-fp','fp43-depot-trigger'].map(k=>[k,{textContent:'',title:'',addEventListener(n,h){this[n]=h}}]));
const callbacks={},calls=[],uid='user-1';
const doc={readyState:'loading',getElementById:id=>elements[id]||null,addEventListener(k,h){callbacks[k]=h}};
const win={
 FinanzPilotCloud:{user:uid,paperClient:{from(table){return{select(){return this},eq(){return this},async maybeSingle(){return{data:table==='fp_economy_accounts'?{research_points:9}:{xp:155},error:null}}}}}},
 FinanzPilotPortfolio:{status:{loaded:false,complete:false,total:null},load(){calls.push('portfolio.load')}},
 FinanzPilotNavigation:{route(v){calls.push(v)}},
 addEventListener(k,h){callbacks[k]=h},dispatchEvent(){},
};
const now={window:win,document:doc,Date,Intl,Number,Promise,console,Math,setTimeout:fn=>{fn();return 1},clearTimeout(){}};
vm.runInContext(header,vm.createContext(now));
callbacks.DOMContentLoaded();
assert.equal(elements['top-depot'].textContent,'—','Never make up 1000 EUR before portfolio loads.');
win.FinanzPilotPortfolio.status={loaded:true,complete:true,total:1324.5};
callbacks['fp-portfolio-loaded']();
assert(elements['top-depot'].textContent.includes('1.324,50'),'Show Euro total after portfolio loaded.');
win.FinanzPilotPortfolio.status={loaded:true,complete:false,unpriced:true,total:1324.5};
callbacks['fp-portfolio-loaded']();
assert.equal(elements['top-depot'].textContent,'—','Do not mislabel partial holdings value as full balance.');
elements['fp43-depot-trigger'].click();
assert(calls.includes('depot'),'Depot total links to depot page.');
callbacks['fp-reward-confirmed']();
assert(calls.includes('portfolio.load'),'Earned reward refreshes total in topbar.');

const storage={};
const fbEvents={},fakeDoc={readyState:'loading',hidden:false,documentElement:{classList:{toggle(){}}},addEventListener(n,h){fbEvents[n]=h},querySelector(){return null}};
const fakeWin={addEventListener(){},matchMedia(){return{matches:false,addEventListener(){}}},dispatchEvent(){}};
vm.runInContext(prefs,vm.createContext({window:fakeWin,document:fakeDoc,localStorage:{getItem:k=>storage[k]||null,setItem:(k,v)=>{storage[k]=v}},Date,Math,Number,console,Event:class{constructor(n){this.type=n}}}));
const controller=fakeWin.FinanzPilotFeedback;
const settings=controller.settingsHtml();
assert.equal((settings.match(/role="switch"/g)||[]).length,2,'Exactly two switches.');
for(const word of ['Töne','Animationen'])assert(settings.includes(word));
for(const forbidden of ['Ton testen','animation-test','sound-test','Vorschau','fp52-settings-toggle'])assert(!settings.includes(forbidden));
assert(profile.includes('settingsHtml?.()')&&profile.includes('bindSettings?.(root)'),'Both controls render and bind in profile.');
assert(prefs.includes('answer:[[660,0,.075,.055],[880,.077,.095,.06]]'),'Normal soft two-note success tone, not shrill single beep.');
assert(prefs.includes('wrong:[[440,0,.13,.055]]'),'Low neutral failure tone.');
const bindings={};
controller.bindSettings({querySelector(sel){return{checked:true,addEventListener(type,fn){bindings[sel]=fn}}}});
bindings['#fp52-sound-pref']({currentTarget:{checked:false}});
bindings['#fp52-motion-pref']({currentTarget:{checked:false}});
assert.equal(controller.preferences.sound,false);
assert.equal(controller.preferences.motion,'off');
assert(storage.finanzpilot_feedback_preferences_v52.includes('"sound":false'),'Persist preference on device.');
assert(celebrations.includes("preferences?.motion==='off'")&&celebrations.includes("if(active||document.hidden)queue.push(entry)"),'Respect animation-off and never drop queued earned rewards.');
for(const source of [levels,streak,economy])assert(source.includes('FinanzPilotCelebrations'),'Reward source must emit genuine celebrations.');
for(const kind of ['level','streak','skill','promotion','artifact','shards','mission','reward'])assert(celebrations.includes(kind+':{caption:'),'Every reward category has own animation.');
assert(levels.includes('for(const reached of freshLevels)'),'Each newly earned level gets its own animation.');
for(const receipt of ['artifact-exchanged','practice-award','redeemed:','style-unlocked'])assert(economy.includes(receipt),'Missing server-confirmed reward reveal '+receipt);
console.log('V61 PASS: exact two saved profile toggles, no tests/header speaker, default correct/wrong tones, reliable EUR total plus positions, refresh on earned rewards, all level and streak animations and verified artifacts.');
