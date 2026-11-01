import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=p=>fs.readFileSync(p,'utf8');
const source=read('market-v34.js');
const edge=read('supabase/functions/finanzpilot-stock-lookup/index.ts');
const inbox=read('.github/workflows/issue-inbox.yml');
const markup=read('index.html'),css=read('market-v34.css');
assert.equal(JSON.parse(read('version.json')).version,36);
assert(markup.includes('market-v34.js?v=36')&&markup.includes('market-v34.css?v=36'));
assert(css.includes('.fp35-tooltip')&&css.includes('.fp35-ranges'));
for(const range of ['1mo','3mo','6mo','1y','5y','max'])assert(edge.includes('"'+range+'"'),'Missing backend chart range: '+range);
assert(edge.includes('"BYW.MU":"BYW.DE"'),'BayWa München must have an explicitly named Xetra history fallback');
assert(edge.includes('is_alternative_venue:alternative')&&edge.includes('venue_note:alternative'));
assert(edge.includes('action==="history"')&&edge.includes('String(body.range||"6mo")'));
assert(inbox.includes('issues:')&&inbox.includes('types: [opened, reopened, edited]'));
assert(inbox.includes('finanzpilot-wartet')&&inbox.includes('Analysewunsch:')&&inbox.includes('Skillwunsch:'));
let page='marketoverview';
const listeners={};const requests=[];
const client={
 from(){const q={select(){return q},eq(){return q},order(){return q},limit(){return Promise.resolve({data:[{symbol:'BYW.MU'}],error:null})},in(){return Promise.resolve({data:[{symbol:'BYW.MU',asset_name:'BayWa AG',currency:'EUR',price:7.68,quote_date:'2026-10-30',source:'Munich'}],error:null})}};return q},
 functions:{invoke:async(_,{body})=>{requests.push(body);return {data:body.action==='history'?{currency:'EUR',source_symbol:'BYW.DE',is_alternative_venue:true,venue_note:'Ersatzkursreihe Xetra BYW.DE, abweichender Handelsplatz',source:'Yahoo historical',points:[{date:'2026-10-28',price:7.30},{date:'2026-10-30',price:7.50}]}:{news:[]},error:null}}}
};
const win={FinanzPilotCloud:{user:'test',paperClient:client},FinanzPilotNavigation:{route:next=>page=next},
 addEventListener:(n,fn)=>{listeners[n]=fn},dispatchEvent(){},render(){},FinanzPilotPortfolio:{focus(){}}};
const document={readyState:'loading',addEventListener(){},getElementById(){return null}};
const context=vm.createContext({window:win,document,state:{get view(){return page}},fetch:async()=>({ok:true,json:async()=>({stories:[],date:'2026-11-01'})}),URL,Event:class Event{constructor(type){this.type=type}},console,Date,Intl,Map,Set,Promise,Number,Math,String,Array});
vm.runInContext(source,context,{filename:'market-v34.js'});
const api=win.FinanzPilotMarkets;await api.refresh(true);
await new Promise(resolve=>setTimeout(resolve,0));
let html=api.renderOverview();
assert(html.includes('data-fp35-scrub="BYW.MU"'),'BayWa should display an actual SVG graph');
assert(html.includes('Ersatzkursreihe Xetra BYW.DE'),'Alternate exchange must be disclosed');
assert(html.includes('fp35-tooltip'),'Interactive price tooltip missing');
assert(html.includes('data-fp35-range="5y"'),'Selectable multi-year range missing');
assert(!html.includes('<button type="button" class="fp34-chart-card"'),'Range buttons must not be nested inside clickable chart buttons');
const binds={};
const control={dataset:{fp35Symbol:'BYW.MU',fp35Range:'1y'},addEventListener:(name,fn)=>{binds[name]=fn}};
api.bind({querySelectorAll:selector=>selector==='[data-fp35-range]'?[control]:[],querySelector:()=>null});
assert(typeof binds.click==='function');binds.click();
await new Promise(resolve=>setTimeout(resolve,0));
html=api.renderOverview();
assert(html.includes('data-fp35-range="1y" data-fp35-symbol="BYW.MU" aria-pressed="true"'));
assert(requests.some(x=>x.action==='history'&&x.range==='1y'));
console.log('v35 QA: BayWa fallback provenance, interactive chart period, touch tooltip markup and Issue event queue verified.');
