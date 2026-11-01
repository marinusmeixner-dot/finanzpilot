import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync('index.html','utf8');
const navSource=fs.readFileSync('ux-v15.js','utf8');
const app=fs.readFileSync('app.js','utf8');
const research=fs.readFileSync('research.js','utf8');
const manifest=JSON.parse(fs.readFileSync('manifest.webmanifest','utf8'));
const current=JSON.parse(fs.readFileSync('version.json','utf8'));
const updater=fs.readFileSync('updates.js','utf8');
assert.equal(current.version,48);
assert.equal(manifest.start_url,'./?v=48');
assert.equal(manifest.display,'standalone');
assert(manifest.icons.some(i=>i.type==='image/png'&&i.sizes==='180x180'));
assert(html.includes('rel="apple-touch-icon"'));
assert(fs.statSync('apple-touch-icon.png').size>1000);
assert(html.includes('ux-v15.js?v=46'));
assert(html.includes('ux-v15.css?v=18'));
assert(html.includes('app.js?v=48'));
assert(html.includes('research.js?v=18'));
assert(html.includes('updates.js?v=48'));
assert(!html.includes('src="ux.js'));
assert(!navSource.includes('fp-section-overlay'));
assert(!navSource.includes('data-section-open'));
assert(!navSource.includes('openSectionMenu'));
assert(navSource.includes('window.FinanzPilotLab.renderHome=()=>')); // Existing Start design still intact.

const events={},memory={};
const state={view:'home'};
const sidebar={innerHTML:''},bottom={innerHTML:''},top={querySelector:()=>null,insertAdjacentHTML:()=>{}};
let crumb=null;
const root={
 querySelector:q=>q===':scope > .fp-tab-crumb'?crumb:null,
 prepend:el=>{crumb=el;el.remove=()=>{crumb=null}},
 addEventListener(){}
};
const document={
 readyState:'loading',
 querySelector:q=>({'.sidebar':sidebar,'.bottom-nav':bottom,'.topbar':top})[q]||null,
 querySelectorAll:()=>[],
 getElementById:q=>q==='view-root'?root:null,
 createElement:()=>({className:'',dataset:{},innerHTML:'',remove:()=>{crumb=null}}),
 addEventListener:(type,fn)=>{events[type]=fn},
 body:{classList:{add(){},remove(){}}}
};
const scrolls=[];const sent=[];const w={scrollY:0,scrollTo(...args){scrolls.push(args)},dispatchEvent(ev){sent.push(ev.type)},addEventListener(){},FinanzPilotLab:null,FinanzPilotJourney:{renderHome:()=>'<div class="fp39-home"><button data-journey-start>Starten</button><button data-journey-stage="1">Orientieren</button><button data-journey-stage="2">Verstehen</button><button data-journey-stage="3">Verknüpfen</button><button data-journey-stage="4">Anwenden</button><button data-journey-stage="5">Analysieren</button><button data-journey-stage="6">Urteil</button></div>'}};
w.FinanzPilotLearningHub={home:()=>'<section class="fp42-learn-home">'+['basics','skilltree','skilllessons','speciallessons'].map(x=>'<button data-fp41-route="'+x+'">'+x+'</button>').join('')+'</section>'};
w.FinanzPilotProfile={render:()=>'<section class="fp42-profile"><button data-section-route="learningstats">Statistik</button><button data-section-route="career">Karriere</button><button data-section-route="inventory">Artefakte</button><button data-section-account>Konto</button></section>'};
const location={hash:'',pathname:'/finanzpilot/',search:'?v=43};
const history={replaceState:(_,__,url)=>{location.hash=url.includes('#')?'#'+url.split('#')[1]:''}};
const context=vm.createContext({window:w,document,localStorage:{getItem:k=>memory[k]??null,setItem:(k,v)=>memory[k]=v},state,chooseView:v=>{state.view=v},
 MutationObserver:class{observe(){}},requestAnimationFrame:fn=>fn(),history,location,URLSearchParams,console,Date,JSON,
 clearTimeout(){},setTimeout(){},Event:class Event{constructor(type){this.type=type}}});
vm.runInContext(navSource,context,{filename:'ux-v15.js'});
events.DOMContentLoaded();
const nav=w.FinanzPilotNavigation;
assert(nav);
assert.deepEqual([...['home','learn','markets','depot','progress','stockhub'].filter(x=>nav.isHub(x))],['learn','markets','progress','stockhub']);
assert.equal(nav.renderHub('home'),'');
const groups={
 markets:['marketoverview','marketnews','marketfinancials']
};
for(const [parent,subpages] of Object.entries(groups)){
 const markup=nav.renderHub(parent);
 assert(markup.includes('fp-tab-hub-list'),parent);
 assert(!markup.includes('data-section-open'),parent);
 assert(!markup.includes('Bereiche</span>'),parent);
 assert(markup.includes('fp-tab-hub-item'),parent);
 for(const page of subpages){
   assert(markup.includes('data-section-route="'+page+'"'),parent+' '+page);
   assert.equal(nav.parentOf(page),parent);
 }
 nav.route(parent);
 assert.equal(state.view,parent);
 assert.equal(crumb,null,'Overview must not have global back button');
 nav.route(subpages[0]);
 assert.equal(state.view,subpages[0]);
 assert(crumb?.innerHTML.includes('Zurück'),'Back button uses the last visited screen');
}
assert(nav.renderHub('progress').includes('data-section-account'));
assert(nav.renderHub('progress').includes('fp42-profile'));
for(const child of ['learningstats','career','inventory'])assert(nav.renderHub('progress').includes('data-section-route="'+child+'"'));
assert.equal((bottom.innerHTML.match(/data-section-main=/g)||[]).length,5);
assert.equal(nav.parentOf('skills'),'learn');
assert.equal(nav.parentOf('transfer'),'learn');
assert.equal(nav.parentOf('academy'),'learn');
assert.equal(nav.parentOf('investmentcommittee'),'learn');
assert.equal(nav.parentOf('stockhub'),'learn');
assert(nav.renderHub('stockhub').includes('data-section-route="researchcatalog"'));
assert(nav.renderHub('learn').includes('fp42-learn-home'));
assert(!nav.renderHub('learn').includes('fp41-tabs'));
for(const route of ['basics','skilltree','skilllessons','speciallessons'])assert(nav.renderHub('learn').includes('data-fp41-route="'+route+'"'));
for(let i=1;i<=6;i++)assert.equal(nav.parentOf('journey-'+i),'learn');
assert.equal(nav.parentOf('basics'),'learn');
assert.equal(nav.parentOf('journeycourse'),'learn');
nav.route('learn');nav.route('journey-1');assert.equal(state.view,'journey-1');nav.route('journey-2');assert.equal(state.view,'journey-2');nav.goBack();assert.equal(state.view,'journey-1');
nav.route('stockhub');assert(state.view==='stockhub');assert(crumb?.innerHTML.includes('Zurück'));
nav.route('academy');assert(crumb?.innerHTML.includes('Zurück'));
nav.route('depot');assert(state.view==='depot');assert.equal(crumb,null);
assert(bottom.innerHTML.includes('Depot')&&!bottom.innerHTML.includes('>Aktien<'));
assert.equal(nav.parentOf('inventory'),'progress');
nav.route('depot');nav.route('marketdetail');nav.route('marketnews');nav.route('marketarticle');
assert.equal(state.view,'marketarticle');
assert(crumb?.innerHTML.includes('‹ Zurück'));
nav.goBack();assert.equal(state.view,'marketnews','Article back must return to news');
nav.goBack();assert.equal(state.view,'marketdetail','Next back must return to the stock chart');
nav.goBack();assert.equal(state.view,'depot','Next back must return to Depot');

assert(sent.includes('fp-navigation'));
assert(html.includes('mobile-layout-v19.css?v=20'));
assert(html.includes('transfer.js?v=20'));
assert(html.includes('learning-v20.css?v=30'));
assert(html.includes('investment-committee.js?v=23'));
assert(html.includes('investment-committee.css?v=21'));
assert(app.includes("state.view==='investmentcommittee'"));
assert(html.includes('sync.js?v=46'));
assert(html.includes('content="black"'));
const stylesheet=fs.readFileSync('mobile-layout-v19.css','utf8');
assert(stylesheet.includes('env(safe-area-inset-top'));
assert(fs.readFileSync('market-v34.css','utf8').includes('position:fixed!important'));
assert(stylesheet.includes('min-height:100dvh'));
nav.route('home');assert.equal(state.view,'home');
const stateAfterHome=JSON.parse(memory.finanzpilot_navigation_v6);
assert.equal(stateAfterHome.positions.home,0);
assert.notEqual(stateAfterHome.resume,'progress');
nav.route('progress');assert.equal(state.view,'progress');
nav.route('home');assert.equal(JSON.parse(memory.finanzpilot_navigation_v6).positions.home,0);
assert(scrolls.some(args=>args[0]===0&&args[1]===0));

assert(app.includes("state.view==='learnpath'?window.FinanzPilotLab.renderLearn()"));
assert(app.includes("state.view==='marketoverview'&&window.FinanzPilotMarkets"));
assert(app.includes("state.view==='learningstats'?window.FinanzPilotLab.renderProgress()"));
assert(app.includes("state.view==='researchcatalog'&&window.FinanzPilotResearch"));
assert(app.includes("state.view==='depot'&&window.FinanzPilotPortfolio"));
assert(html.includes('portfolio.js?v=44'));
assert(html.includes('portfolio-v26.css?v=30'));
assert(research.includes("state.view='researchcatalog'"));

let serverVersion=48,replaced=null,syncCalls=0;
const pageLoc={href:'https://marinusmeixner-dot.github.io/finanzpilot/?v=48#view=training',hash:'#view=training',
 replace:url=>{replaced=url}};
const updaterWindow={FinanzPilotCloud:{sync:async()=>{syncCalls++}},addEventListener(){}};
const updateContext=vm.createContext({window:updaterWindow,document:{readyState:'loading',addEventListener(){}},
 navigator:{onLine:true},location:pageLoc,URL,Date,console:{info(){}},
 fetch:async()=>({ok:true,json:async()=>({version:serverVersion})}),setTimeout(){},setInterval(){}});
vm.runInContext(updater,updateContext,{filename:'updates.js'});
await updaterWindow.FinanzPilotUpdate.check(true);
assert.equal(replaced,null);
serverVersion=49;
await updaterWindow.FinanzPilotUpdate.check(true);
assert.equal(syncCalls,1);
assert(replaced.includes('?v=49#view=training'));
console.log('Version 47 tests passed: Start preserved; Depot as a main tab, nested Markt Aktienanalysen, contextual back, PWA icon.');
