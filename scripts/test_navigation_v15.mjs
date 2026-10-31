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
assert.equal(current.version,23);
assert.equal(manifest.start_url,'./?v=23');
assert.equal(manifest.display,'standalone');
assert(manifest.icons.some(i=>i.type==='image/png'&&i.sizes==='180x180'));
assert(html.includes('rel="apple-touch-icon"'));
assert(fs.statSync('apple-touch-icon.png').size>1000);
assert(html.includes('ux-v15.js?v=23'));
assert(html.includes('ux-v15.css?v=18'));
assert(html.includes('app.js?v=23'));
assert(html.includes('research.js?v=18'));
assert(html.includes('updates.js?v=23'));
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
const scrolls=[];const sent=[];const w={scrollY:0,scrollTo(...args){scrolls.push(args)},dispatchEvent(ev){sent.push(ev.type)},addEventListener(){},FinanzPilotLab:null};
const location={hash:'',pathname:'/finanzpilot/',search:'?v=23'};
const history={replaceState:(_,__,url)=>{location.hash=url.includes('#')?'#'+url.split('#')[1]:''}};
const context=vm.createContext({window:w,document,localStorage:{getItem:k=>memory[k]??null,setItem:(k,v)=>memory[k]=v},state,chooseView:v=>{state.view=v},
 MutationObserver:class{observe(){}},requestAnimationFrame:fn=>fn(),history,location,URLSearchParams,console,Date,JSON,
 clearTimeout(){},setTimeout(){},Event:class Event{constructor(type){this.type=type}}});
vm.runInContext(navSource,context,{filename:'ux-v15.js'});
events.DOMContentLoaded();
const nav=w.FinanzPilotNavigation;
assert(nav);
assert.deepEqual([...['home','learn','markets','research','progress'].filter(x=>nav.isHub(x))],['learn','markets','research','progress']);
assert.equal(nav.renderHub('home'),'');
const groups={
 learn:['learnpath','concepts','transfer','training','skills','glossary','foundations'],
 markets:['marketoverview','academymarket'],
 research:['researchcatalog','investmentcommittee','theses','academy'],
 progress:['learningstats','career','inventory']
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
 assert(crumb?.innerHTML.includes(parent==='research'?'Aktien-Übersicht':parent==='progress'?'Profil-Übersicht':parent==='markets'?'Märkte-Übersicht':'Lernen-Übersicht'));
}
assert(nav.renderHub('progress').includes('data-section-account'));
assert.equal((bottom.innerHTML.match(/data-section-main=/g)||[]).length,5);
assert.equal(nav.parentOf('skills'),'learn');
assert.equal(nav.parentOf('transfer'),'learn');
assert.equal(nav.parentOf('academy'),'research');
assert.equal(nav.parentOf('investmentcommittee'),'research');
assert.equal(nav.parentOf('inventory'),'progress');
assert(sent.includes('fp-navigation'));
assert(html.includes('mobile-layout-v19.css?v=20'));
assert(html.includes('transfer.js?v=20'));
assert(html.includes('learning-v20.css?v=20'));
assert(html.includes('investment-committee.js?v=21'));
assert(html.includes('investment-committee.css?v=21'));
assert(app.includes("state.view==='investmentcommittee'"));
assert(html.includes('sync.js?v=21'));
assert(html.includes('content="black"'));
const stylesheet=fs.readFileSync('mobile-layout-v19.css','utf8');
assert(stylesheet.includes('env(safe-area-inset-top'));
assert(stylesheet.includes('position:sticky!important'));
assert(stylesheet.includes('min-height:100dvh'));
nav.route('home');assert.equal(state.view,'home');
const stateAfterHome=JSON.parse(memory.finanzpilot_navigation_v6);
assert.equal(stateAfterHome.positions.home,0);
assert.notEqual(stateAfterHome.resume,'progress');
nav.route('progress');assert.equal(state.view,'progress');
nav.route('home');assert.equal(JSON.parse(memory.finanzpilot_navigation_v6).positions.home,0);
assert(scrolls.some(args=>args[0]===0&&args[1]===0));

assert(app.includes("state.view==='learnpath'?window.FinanzPilotLab.renderLearn()"));
assert(app.includes("state.view==='marketoverview'?window.FinanzPilotLab.renderMarkets()"));
assert(app.includes("state.view==='learningstats'?window.FinanzPilotLab.renderProgress()"));
assert(app.includes("state.view==='researchcatalog'&&window.FinanzPilotResearch"));
assert(research.includes("state.view='researchcatalog'"));

let serverVersion=23,replaced=null,syncCalls=0;
const pageLoc={href:'https://marinusmeixner-dot.github.io/finanzpilot/?v=23#view=training',hash:'#view=training',
 replace:url=>{replaced=url}};
const updaterWindow={FinanzPilotCloud:{sync:async()=>{syncCalls++}},addEventListener(){}};
const updateContext=vm.createContext({window:updaterWindow,document:{readyState:'loading',addEventListener(){}},
 navigator:{onLine:true},location:pageLoc,URL,Date,console:{info(){}},
 fetch:async()=>({ok:true,json:async()=>({version:serverVersion})}),setTimeout(){},setInterval(){}});
vm.runInContext(updater,updateContext,{filename:'updates.js'});
await updaterWindow.FinanzPilotUpdate.check(true);
assert.equal(replaced,null);
serverVersion=24;
await updaterWindow.FinanzPilotUpdate.check(true);
assert.equal(syncCalls,1);
assert(replaced.includes('?v=24#view=training'));
console.log('Version 23 tests passed: Start preserved; four tab list overviews, all subroutes, contextual back, separate equity research and Home Screen icon.');
