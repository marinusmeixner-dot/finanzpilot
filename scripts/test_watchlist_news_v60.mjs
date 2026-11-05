import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read=p=>fs.readFileSync(p,'utf8');
const daily=JSON.parse(read('data/daily.json'));
const core=JSON.parse(read('data/editorial-core-v43.json'));
const story=daily.stories.find(s=>s.id==='2026-11-02-alphabet-q3-cloud-cashflow');
assert(story,'Alphabet editorial report is missing from the published data');
assert(story.symbols.includes('GOOG')&&story.symbols.includes('GOOGL'),'Alphabet must match both share classes');
assert(story.article.sections.length>=4,'The freely readable story must be complete');
assert.equal(story.published,'2026-10-28','Do not falsify original SEC publication dates');

const html=read('index.html'),market=read('market-v34.js');
assert(/home-v48\.js\?v=(?:8[1-9]|9\d|[1-9]\d\d)/.test(html)&&/market-v34\.js\?v=(?:8[2-9]|9\d|[1-9]\d\d)/.test(html),'New iPhone PWA bundles must be loaded');
assert(market.includes('fp-market-watchlist-ready'),'Watchlist-loaded event should refresh the home article cards');

const events={};
const watch=[{symbol:'GOOG'}];
const window={
 addEventListener:(name,fn)=>{events[name]=fn},
 FinanzPilotCloud:{user:'test-user'},
 FinanzPilotMarkets:{watchlist:watch},
 renderCalls:0,
 render(){this.renderCalls++;}
};
const document={readyState:'loading',addEventListener(){}};
const state={view:'home'};
const fetch=async url=>({ok:true,json:async()=>String(url).includes('daily.json')?daily:core});
vm.runInNewContext(read('home-v48.js'),{window,document,state,fetch,Date,Intl,Math,Number,URL,Set,Map,Promise,console});
await window.FinanzPilotHome.load(true);
let page=window.FinanzPilotHome.render();
assert(page.includes('Neu zu deinen Aktien'),'Watchlist news spotlight missing');
assert(page.includes('Alphabet: Cloud-Umsatz verdoppelt'),'Alphabet is filtered out of logged-in home despite GOOG watchlist');
assert(page.includes('data-fp48-watch-news'),'No direct navigation to the complete watchlist newsroom');
const before=window.renderCalls;
events['fp-market-watchlist-ready']();
assert(window.renderCalls>before,'The home should rerender after watchlist hydration');
window.FinanzPilotMarkets.watchlist=[];
assert(!window.FinanzPilotHome.render().includes('Neu zu deinen Aktien'),'Signed-out or cleared watchlist must not retain private spotlight');
console.log('V60 watchlist editorial: GOOG article is visible, correctly dated and refreshes after private watchlist hydration.');
