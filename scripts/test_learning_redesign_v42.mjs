import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=p=>fs.readFileSync(p,'utf8');
const html=read('index.html'),nav=read('ux-v15.js'),app=read('app.js'),portfolio=read('portfolio.js');
const old=JSON.parse(read('data/journey-v39.json')),specials=JSON.parse(read('data/specializations-v41.json'));
assert.equal(JSON.parse(read('version.json')).version,47);
assert.equal(old.stages.length,6);
assert.equal(old.stages.flatMap(s=>s.modules).length,36,'Original learning assets preserved');
assert.equal(specials.skills.length,44);
assert.equal(specials.skills.flatMap(s=>s.lessons).length,132,'No purchased course removed');
assert(html.includes('learning-hub-v41.js?v=46'));
assert(html.includes('learning-hub-v41.css?v=46'));
assert(html.includes('profile-v42.js?v=44'));
assert(html.includes('profile-v42.css?v=44'));
assert(!portfolio.includes('fp-depot-chart'),'No second stock chart at bottom of Depot');
assert(!portfolio.includes('FinanzPilotCharts.html('),'Depot must not duplicate Märkte charts');
assert(nav.includes("basics:'learn'"));
assert(nav.includes("window.FinanzPilotProfile?.render"));
assert(app.includes("window.FinanzPilotLearningHub.basics()"));
assert(app.includes("window.FinanzPilotProfile.stats()"));
assert(!app.includes('fp-progress-skill-link'),'Old profile skill shortcut removed');

const doc={readyState:'loading',addEventListener(){}};
const contextWin={
 innerWidth:1080,addEventListener(){},render(){},dispatchEvent(){},
 FinanzPilotNavigation:{route(){}},
 FinanzPilotCloud:{user:null,paperClient:null},
 FinanzPilotJourney:{renderHome:()=>'<div class="fp39-home"><h1>Grundlagen</h1></div>',modules:[],completed:{}},
 FinanzPilotStreak:{status:{day:4}},
 FinanzPilotEconomy:{claims:[],account:{research_points:5}},
 FinanzPilotCareer:{status:()=>({rank:{name:'Kursfunke'}})}
};
const ctx=vm.createContext({window:contextWin,document:doc,fetch:async()=>({ok:true,json:async()=>specials}),console});
vm.runInContext(read('learning-hub-v41.js'),ctx,{filename:'learning-hub-v41.js'});
const api=contextWin.FinanzPilotLearningHub;await api.load();
const home=api.home(),tree=api.tree();
assert.equal((home.match(/class="fp42-learn-entry/g)||[]).length,4);
assert(!home.includes('fp41-tabs'),'Four learning sections must be listed, not top tabs');
for(const r of ['basics','skilltree','skilllessons','speciallessons'])assert(home.includes('data-fp41-route="'+r+'"'));
assert(tree.includes('fp42-map-viewport'));
assert(tree.includes('<svg class="fp42-map-lines"'));
assert.equal((tree.match(/data-fp42-node="/g)||[]).length,44);
assert((tree.match(/class="fp42-line/g)||[]).length>=28);
assert(tree.includes('fp42-skill-detail'));
assert(!tree.includes('fp41-branches'),'Not a four-card list');
const cases=api.specials();
assert(cases.includes('Vorhandene Unternehmensfälle'));
assert(cases.includes('data-section-route="training"'));
assert(cases.includes('data-section-route="transfer"'));
assert(cases.includes('data-section-route="academy"'));

vm.runInContext(read('profile-v42.js'),ctx,{filename:'profile-v42.js'});
const profile=contextWin.FinanzPilotProfile.render();
assert(profile.includes('fp42-profile-hero'));
assert(profile.includes('fp42-profile-stats'));
assert(profile.includes('DEINE ANALYSTENKARRIERE'));
assert(profile.includes('data-section-route="inventory"'));
assert(profile.includes('data-section-route="career"'));
assert(profile.includes('data-section-route="learningstats"'));
assert(profile.includes('data-section-account'));
assert(profile.indexOf('KONTO &amp; SICHERUNG')>=0||profile.indexOf('KONTO & SICHERUNG')>0);
assert(profile.indexOf('KONTO & SICHERUNG')>profile.indexOf('Deine Erfolge'));
assert(!profile.includes('data-view="skills"'));

const saved={completed:{'budget-reserve':1690000000000},lessons:{'budget-reserve':{page:4,answers:{0:{correct:true}},updatedAt:1690000000000}}};
const memory={'finanzpilot_journey_v1':JSON.stringify(saved)};
const journeyWin={addEventListener(){},dispatchEvent(){},render(){},FinanzPilotNavigation:{route(){},goBack(){return true}}};
const journeyDoc={readyState:'loading',addEventListener(){}};
const session=vm.createContext({window:journeyWin,document:journeyDoc,localStorage:{getItem:k=>memory[k]??null,setItem:(k,v)=>memory[k]=v},fetch:async()=>({ok:true,json:async()=>old}),Date,console,Event:class Event{constructor(type){this.type=type}}});
vm.runInContext(read('journey-v39.js'),session);
await journeyWin.FinanzPilotJourney.load();
const journey=journeyWin.FinanzPilotJourney;
assert.equal(journey.modules.length,18);
for(let i=1;i<=6;i++)assert.equal((journey.renderFor('journey-'+i).match(/data-journey-open/g)||[]).length,3);
assert(journey.state.completed['budget-reserve'],'Old optional lesson completion must be retained even if no longer required');
assert(journey.renderHome().includes('18 Lektionen')||journey.renderHome().includes('von 18'));
console.log('v42: Four-row Lernen, real branching/zoom Skillkarte, concise 18-lesson basics, preserved old progress, moved cases, clean Depot and direct Profil dashboard validated.');
