import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=p=>fs.readFileSync(p,'utf8');
const sql=read('supabase/paper_global_watchlist_v1.sql');
const server=read('supabase/functions/finanzpilot-stock-lookup/index.ts');
const portfolio=read('portfolio.js');
assert(sql.includes('fp_paper_watchlist'));
assert(sql.includes('enable row level security'));
assert(sql.includes('fp_paper_watch_owner_insert'));
assert(sql.includes('user_id=(select auth.uid())'));
assert(sql.includes("auth.role() <> 'service_role'"));
assert(sql.includes("grant execute on function public.fp_paper_register_verified_quote"));
assert(!sql.includes("grant execute on function public.fp_paper_register_verified_quote(text,text,text,numeric,date,text,boolean) to authenticated"));
assert(server.includes('verify_jwt')===false||read('version.json').includes('27'));
assert(server.includes('supported=new Set(["EQUITY","ETF"])'));
assert(server.includes('/v1/finance/search'));
assert(server.includes('/v8/finance/chart/'));
assert(server.includes('fp_paper_register_verified_quote'));
assert(server.includes('authenticate(req)'));
assert(server.includes('rawCurrency==="GBp"'));
assert(portfolio.includes("fp_paper_watchlist"));
assert(portfolio.includes("finanzpilot-stock-lookup"));
assert(portfolio.includes('async function searchStocks('));
assert(portfolio.includes('async function registerStock('));
assert(portfolio.includes('async function removeWatch('));
assert(portfolio.includes('Aktien weltweit suchen'));
assert(read('index.html').includes('portfolio.js?v=37'));
assert(read('index.html').includes('portfolio-v26.css?v=30'));
assert(JSON.parse(read('version.json')).version>=27,'The global search feature must remain available in newer versions');
const memory={},state={view:'depot'},events={};
let identity='test-user',rpcCalls=[],quotes=[{symbol:'MSFT',asset_name:'Microsoft',currency:'USD',price:521.90,quote_date:'2026-10-30',source:'historical',adjusted:true}],watch=[],wallets=[],trades=[];
const db={
 from(table){
   const data=()=>table==='fp_paper_quotes'?quotes:table==='fp_paper_watchlist'?watch:table==='fp_paper_wallets'?wallets:trades;
   const query={then(ok,fail){return Promise.resolve({data:data(),error:null}).then(ok,fail)},order(){return this},eq(){return this},in(){return this},limit(){return Promise.resolve({data:data(),error:null})}};
   return {select(){return query},async insert(row){if(table==='fp_paper_watchlist'){watch.push({...row,created_at:'2026-10-31'});return {error:null}}throw Error('No direct trade table writes')},delete(){return {eq(){return {eq:async(_,symbol)=>{watch=watch.filter(x=>x.symbol!==symbol);return {error:null}}}}}}};
 },
 functions:{async invoke(name,{body}){
   assert.equal(name,'finanzpilot-stock-lookup');
   rpcCalls.push(body.action);
   if(body.action==='search')return {data:{results:[{symbol:'ASML.AS',name:'ASML Holding',exchange:'Amsterdam',type:'EQUITY'}],provider:'Test'},error:null};
   if(body.action==='register'){const q={symbol:body.symbol,asset_name:'ASML Holding',currency:'EUR',price:920.25,quote_date:'2026-10-30',source:'historical',adjusted:false};quotes.push(q);return {data:{quote:q},error:null}}
   throw Error('Unexpected action');
 }},
 async rpc(name){if(name==='fp_paper_claim_artifact_rewards')return {data:{bonus_added_eur:0},error:null};throw Error('Trade RPC not used in lookup test')}
};
const window={FinanzPilotCloud:{get user(){return identity},get paperClient(){return identity?db:null}},addEventListener(){},render(){},confirm(){return true},FinanzPilotCharts:{html(){return ''}}};
const document={readyState:'loading',hidden:false,addEventListener(k,fn){events[k]=fn}};
const BaseDate=Date;
class FakeDate extends BaseDate{constructor(...args){super(...(args.length?args:['2026-10-31T12:00:00Z']))}static now(){return BaseDate.parse('2026-10-31T12:00:00Z')}}
const context=vm.createContext({window,document,state,Date:FakeDate,Intl,Math,JSON,Number,String,URL,Event:class Event{},console});
vm.runInContext(portfolio,context,{filename:'portfolio.js'});
const api=window.FinanzPilotPortfolio;
await api.load();
assert.equal(api.watchlist.length,0);
await api.searchStocks('ASML');
assert(api.render().includes('ASML Holding'));
await api.registerStock('ASML.AS',true,true);
assert.equal(api.watchlist.length,1);
assert.equal(api.watchlist[0].symbol,'ASML.AS');
assert.equal(api.quotes.some(q=>q.symbol==='ASML.AS'),true);
assert.equal(api.currencyStats('EUR').total,50000);
assert(api.render().includes('data-depot-symbol'));
assert(api.render().includes('ASML.AS'));
assert.deepEqual(rpcCalls,['search','register']);
await api.registerStock('SAP.DE',false,true);
assert(api.quotes.some(q=>q.symbol==='SAP.DE'),'New stock must be fetched before the Handel order form is rendered');
assert(api.render().includes('value="SAP.DE"'),'Handel should directly select the newly found symbol');
await api.removeWatch('ASML.AS');
assert.equal(api.watchlist.length,0);
identity=null;
await api.load();
assert.equal(api.watchlist.length,0);
assert(api.render().includes('Zum virtuellen Depot anmelden'));
console.log('v27 global watchlist: authenticated search, registered quote, EUR paper funds, private watchlist add/remove, logout clearing, source and RLS static safety pass');
