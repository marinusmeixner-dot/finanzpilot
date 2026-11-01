import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read=p=>fs.readFileSync(p,'utf8');
const html=read('index.html');
const nav=read('ux-v15.js');
const app=read('app.js');
const portfolio=read('portfolio.js');
const stylesheet=read('market-v34.css');
const daily=JSON.parse(read('data/daily.json'));
const learning=JSON.parse(read('data/learning-news.json'));
assert.equal(JSON.parse(read('version.json')).version,46);
assert(html.includes('market-v34.js?v=45')&&html.includes('learning-news-v34.js?v=34'));
assert(html.includes('market-v34.css?v=45'));
assert(stylesheet.includes('position:fixed!important')&&stylesheet.includes('env(safe-area-inset-bottom'));
assert(nav.includes("['marketoverview','Marktüberblick'")&&nav.includes("['marketnews','News'"));
assert(nav.includes("['learningnews','News verstehen'"));
assert(app.includes('FinanzPilotMarkets.renderOverview()')&&app.includes('FinanzPilotMarkets.renderNews()'));
assert(app.includes('FinanzPilotMarkets.renderDetail()')&&app.includes('FinanzPilotLearningNews.render()'));
assert(portfolio.includes('data-fp34-inspect')&&portfolio.includes('fp-watchlist-changed'));
assert(!portfolio.includes('>Chart & News</button>'),'Explicit redundant chart button removed');
assert(read('sync.js').includes("'finanzpilot_learning_news_v1'"));
assert(learning.schema_version===1&&learning.cases.length>0);
for(const c of learning.cases){
 assert(c.id&&c.url.startsWith('https:')&&c.source&&c.published);
 assert(c.questions.length>=3);
 for(const q of c.questions)assert(q.options.length===4&&Number.isInteger(q.correct)&&q.correct>=0&&q.correct<4&&q.explanation.length>35);
 assert(c.reflectionPrompt&&c.rubric.length>=3);
}
assert(JSON.parse(read('data/editorial-core-v43.json')).stories.some(s=>Array.isArray(s.symbols)&&s.symbols.length));

// Functional smoke with private watchlist only in browser. No secret / user data in GitHub.
let view='marketoverview';
const state={get view(){return view}};
const events={},rendered=[],navTo=[];
const owner='test-account';
const rows=[{symbol:'MSFT'},{symbol:'BAYN.DE'}];
const quotes=[{symbol:'MSFT',asset_name:'Microsoft',currency:'USD',price:100,quote_date:'2026-10-30',source:'Verified close'},
 {symbol:'BAYN.DE',asset_name:'Bayer AG',currency:'EUR',price:50,quote_date:'2026-10-30',source:'Verified close'}];
const query=table=>{
 const q={
  select(){return q},eq(){return q},order(){return q},limit(){return Promise.resolve({data:rows,error:null})},
  in(){return Promise.resolve({data:quotes,error:null})},
  insert(){return Promise.resolve({error:null})}
 };
 return q;
};
const stockClient={from:query,functions:{invoke:async(_,{body})=>({data:body.action==='history'?{currency:'USD',points:[{date:'2026-10-29',price:98},{date:'2026-10-30',price:100}]}:{news:[{title:'New result',publisher:'Publisher',published:1793318400,url:'https://example.com/news'}]},error:null})}};
const window={addEventListener:(k,fn)=>{events[k]=fn},dispatchEvent(){},render:()=>rendered.push(view),
 FinanzPilotCloud:{user:owner,paperClient:stockClient},
 FinanzPilotNavigation:{route:x=>{view=x;navTo.push(x)}}};
const document={readyState:'loading',addEventListener(){},getElementById(){return null}};
const context=vm.createContext({window,document,state,fetch:async()=>({ok:true,json:async()=>daily}),console,Date,Intl,URL,Map,Set,Promise,Number,Math,String,Array});
vm.runInContext(read('market-v34.js'),context,{filename:'market-v34.js'});
const ui=window.FinanzPilotMarkets;
assert(ui);
await ui.refresh(true);
assert.equal(ui.watchlist.length,2);
await Promise.resolve();await Promise.resolve();
assert(ui.renderOverview().includes('data-fp34-chart="MSFT"'));
assert(!ui.renderOverview().includes('Woran du beim Chart denkst'));
assert(!ui.renderOverview().includes('Weitere aktuelle Schlagzeilen'));
ui.stockDetail('MSFT');
assert.equal(view,'marketdetail');
assert(ui.renderDetail().includes('Zur Aktie im Depot'));
assert(ui.renderDetail().includes('Aktuelle Nachrichten'));
ui.openNews('MSFT');
assert.equal(view,'marketnews');
assert(ui.renderNews().includes('Gesamtmarkt')&&ui.renderNews().includes('Meine Aktien')&&ui.renderNews().includes('Entdecken'));
assert(!nav.includes("markets:{label:'Märkte',description:'News, Kurse, Indizes"));
console.log('v34 QA: private watchlist charts, clean markets navigation, chart↔depot and company news, 3 news areas, source-based learning and fixed iOS bars.');
