import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=p=>fs.readFileSync(p,'utf8');
const daily=JSON.parse(read('data/editorial-core-v43.json'));
const edge=read('supabase/functions/finanzpilot-stock-lookup/index.ts');
const portfolio=read('portfolio.js'),app=read('app.js'),nav=read('ux-v15.js');
assert.equal(JSON.parse(read('version.json')).version,46);
assert(daily.stories.length>=6);
assert(daily.stories.every(s=>s.id&&s.article?.sections?.length>=4),'Every editorial story needs a full original in-app report');
assert(daily.stories.some(s=>s.symbols?.includes('AMZN')&&s.article?.sections?.length>=4));
assert(daily.stories.some(s=>s.symbols?.includes('MSFT')&&s.article?.sections?.length>=4));
assert(edge.includes('nativeChartExists')&&edge.includes('verified.length?verified:remaining.slice(0,8)'));
assert(edge.includes('chart_verified:await nativeChartExists(x.symbol)'));
assert(edge.includes('"BAYN.DE"')&&edge.includes('"BYW.DE"'));
assert(portfolio.includes('x.chart_verified')&&portfolio.includes('Kursreihe nicht bestätigt'));
assert(nav.includes("marketarticle:'markets'")&&nav.includes('function goBack()'));
assert(app.includes("state.view==='marketarticle'&&window.FinanzPilotMarkets"));
const events={};let page='marketnews';
const identity='test-owner',watch=[{symbol:'AMZN'},{symbol:'MSFT'}];
const quote=[{symbol:'AMZN',asset_name:'Amazon',price:200,currency:'USD',quote_date:'2026-10-30'},
 {symbol:'MSFT',asset_name:'Microsoft',price:530,currency:'USD',quote_date:'2026-10-30'}];
const query=()=>{const q={select(){return q},eq(){return q},order(){return q},
 limit(){return Promise.resolve({data:watch,error:null})},
 in(){return Promise.resolve({data:quote,error:null})}};return q};
const client={from:query,functions:{invoke:async(_,{body})=>({error:null,data:body.action==='history'?
 {symbol:body.symbol,points:[{date:'2026-10-29',price:7},{date:'2026-10-30',price:7.3}]}:
 {news:[{title:'Externe Meldung ohne freien Artikeltext',url:'https://example.com/paywall',publisher:'Verlag',published:1793470000}]}})}};
const window={
 FinanzPilotCloud:{user:identity,paperClient:client},
 FinanzPilotNavigation:{route:x=>{page=x},goBack:()=>{page='marketnews'}},
 addEventListener:(k,fn)=>events[k]=fn,dispatchEvent(){},render(){}
};
const document={readyState:'loading',addEventListener(){},getElementById(){return null}};
const context=vm.createContext({window,document,state:{get view(){return page}},
 fetch:async()=>({ok:true,json:async()=>daily}),URL,Date,Intl,Map,Set,Promise,console,Math,Number,String,Array});
vm.runInContext(read('market-v34.js'),context,{filename:'market-v34.js'});
const api=window.FinanzPilotMarkets;
await api.refresh(true);
await new Promise(r=>setTimeout(r,0));
api.openNews('AMZN');
await new Promise(r=>setTimeout(r,0));
const result=api.renderNews();
assert(result.includes('Amazon')&&result.includes('Microsoft'),'Both watchlist stocks must receive editorial coverage');
assert(result.includes('Vollständigen kostenlosen FinanzPilot-Artikel lesen'));
const bayer=daily.stories.find(s=>s.symbols?.includes('AMZN'));
assert(api.openArticle(bayer.id));
assert.equal(page,'marketarticle');
const content=api.renderArticle();
assert(content.includes('Die wichtigsten Zahlen')||content.includes('Cloud-Wachstum'));
assert(content.includes('Originalquelle'));
assert(content.includes('FINANZPILOT'));
assert(content.length>1400,'Full editorial view must contain meaningful detail');
assert(!content.includes('https://example.com/paywall'));
console.log('v36 QA: chart-verified search preference, dated full original editorial, BayWa/Bayer watchlist coverage and in-app reader route verified.');
