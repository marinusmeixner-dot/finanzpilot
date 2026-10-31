import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const navSrc=fs.readFileSync('ux-v15.js','utf8');
const updateSrc=fs.readFileSync('updates.js','utf8');
const manifest=JSON.parse(fs.readFileSync('manifest.webmanifest','utf8'));
const version=JSON.parse(fs.readFileSync('version.json','utf8'));
const page=fs.readFileSync('index.html','utf8');
assert.equal(version.version,15);
assert.equal(manifest.display,'standalone');
assert(manifest.start_url.includes('v=15'));
assert(page.includes('ux-v15.js?v=15'));
assert(page.includes('updates.js?v=15'));
assert(!page.includes('src="ux.js'));

const events={};
const app={view:'home'},storage={};
const sidebar={innerHTML:''},bottom={innerHTML:''},top={querySelector:()=>null,insertAdjacentHTML:()=>{}};
let routeHeader=null;
const root={querySelector:q=>q===':scope > .fp-section-bar'?routeHeader:null,prepend:e=>routeHeader=e,addEventListener(){}};
const elements={},dlg={hidden:true,setAttribute(){},querySelector:q=>elements[q]??=(q==='[data-section-close]'?{focus(){}}:{textContent:'',innerHTML:''}),addEventListener(){}};
const doc={
 readyState:'loading',
 querySelector:q=>({'.sidebar':sidebar,'.bottom-nav':bottom,'.topbar':top})[q]||null,
 querySelectorAll:()=>[],
 getElementById:q=>q==='view-root'?root:q==='fp-section-overlay'?dlg:null,
 createElement:()=>({className:'',dataset:{},innerHTML:''}),
 addEventListener:(type,fn)=>{events[type]=fn},
 body:{insertAdjacentHTML(){},classList:{add(){},remove(){}}}
};
const win={scrollY:0,scrollTo(){},addEventListener(){}};
const loc={hash:'',pathname:'/finanzpilot/',search:'?v=15'};
const hist={replaceState:(_,__,url)=>{loc.hash=url.includes('#')?'#'+url.split('#')[1]:''}};
const ctx=vm.createContext({
 window:win,document:doc,localStorage:{getItem:k=>storage[k]||null,setItem:(k,v)=>storage[k]=v},
 state:app,chooseView:v=>{app.view=v},
 MutationObserver:class{observe(){}},requestAnimationFrame:fn=>fn(),
 history:hist,location:loc,URLSearchParams,console
});
vm.runInContext(navSrc,ctx,{filename:'ux-v15.js'});
assert.equal(typeof events.DOMContentLoaded,'function');
events.DOMContentLoaded();
const nav=win.FinanzPilotNavigation;
assert.equal(nav.parentOf('skills'),'learn');
assert.equal(nav.parentOf('training'),'learn');
assert.equal(nav.parentOf('glossary'),'learn');
assert.equal(nav.parentOf('academy'),'research');
assert.equal(nav.parentOf('research'),'research');
assert.equal(nav.parentOf('academymarket'),'markets');
assert.equal(nav.parentOf('career'),'progress');
assert.equal(nav.parentOf('inventory'),'progress');
assert.equal((bottom.innerHTML.match(/data-section-main=/g)||[]).length,5);
assert(!bottom.innerHTML.includes('Zurück'));
nav.route('career');
assert.equal(app.view,'career');
nav.openSectionMenu();
assert.equal(dlg.hidden,false);
assert(elements['[data-section-list]'].innerHTML.includes('Inventar & Belohnungen'));
assert(!elements['[data-section-list]'].innerHTML.includes('Aktienkatalog'));
nav.route('training');
assert.equal(app.view,'training');
nav.openSectionMenu();
assert(elements['[data-section-list]'].innerHTML.includes('Skillbaum'));
assert(!elements['[data-section-list]'].innerHTML.includes('Analystenkarriere'));

// Update marker loads from network; app does not reload when version is unchanged.
let fresh=15,reloaded=null,syncCalls=0;
const locV={href:'https://marinusmeixner-dot.github.io/finanzpilot/?v=15#view=training',hash:'#view=training',replace(url){reloaded=url}};
const docV={readyState:'loading',addEventListener(){}};
const updateWin={FinanzPilotCloud:{sync:async()=>{syncCalls++}},addEventListener(){}};
const updateCtx=vm.createContext({
 window:updateWin,document:docV,navigator:{onLine:true},location:locV,URL,
 Date,console:{info(){}},fetch:async()=>({ok:true,json:async()=>({version:fresh})}),
 setTimeout(){},setInterval(){}
});
vm.runInContext(updateSrc,updateCtx,{filename:'updates.js'});
await updateWin.FinanzPilotUpdate.check(true);
assert.equal(reloaded,null);
fresh=16;
await updateWin.FinanzPilotUpdate.check(true);
assert.equal(syncCalls,1);
assert(reloaded.includes('?v=16#view=training'));
console.log('Navigation/PWA tests passed: five isolated tabs, area menus, hierarchy, version refresh and saved location.');
