import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=p=>fs.readFileSync(p,'utf8');
const sql=read('supabase/paper_budget_fractional_v40.sql'),streakSQL=read('supabase/streak_rewards_v40.sql');
const front=read('portfolio.js'),streak=read('streak-v40.js'),edge=read('supabase/functions/finanzpilot-stock-lookup/index.ts');
assert.equal(JSON.parse(read('version.json')).version,48);
assert(sql.includes('starting_balance=1000')&&sql.includes('drop function if exists public.fp_paper_execute(text,text,integer)'));
assert(sql.includes('p_amount_eur numeric default null')&&sql.includes('trunc(p_amount_eur/v_price_eur,6)'));
assert(sql.includes('v_balance<v_eur_total')&&sql.includes('v_holdings<v_q'));
assert(sql.includes('fx_eur_per_unit')&&sql.includes('eur_total'));
assert(sql.includes('private.fp_paper_migration_audit'));
assert(streakSQL.includes('primary key(user_id,checkin_date)'));
assert(streakSQL.includes("at time zone 'Europe/Berlin'"));
assert(streakSQL.includes('v_day:=least(30,coalesce(v_prev,0)+1)'));
assert(streakSQL.includes("v_euros integer:=1000"));
assert(streakSQL.includes('v_milestone:=10')&&streakSQL.includes('v_milestone:=20')&&streakSQL.includes('v_milestone:=30'));
assert(streakSQL.includes('pg_advisory_xact_lock'));
assert(streakSQL.includes('grant execute on function public.fp_streak_checkin() to authenticated'));
assert(edge.includes('www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml'));
assert(edge.includes('if(action==="fx")return send(await refreshFx())'));
assert(front.includes("orderMode='amount'"));
assert(front.includes('data-depot-order-mode')&&front.includes('data-depot-amount'));
assert(front.includes("p_amount_eur:orderMode==='amount'?amount:null"));
assert(!front.includes('50.000 EUR und 50.000 USD'));
assert(streak.includes("paperClient.rpc('fp_streak_checkin')"));
assert(streak.includes("fp-streak-trigger"));
assert(streak.includes('fp40-streak-count'));
const html=read('index.html');
assert(html.includes('streak-v40.js?v=41')&&html.includes('streak-v40.css?v=40'));
assert(html.includes('portfolio.js?v=44'));
const mem={},events={};
let identity='u1',num=0;
const quotes=[
{symbol:'MSFT',asset_name:'Microsoft',currency:'USD',price:520,quote_date:'2026-10-30',source:'Historical'},
{symbol:'SIEMENS',asset_name:'Siemens',currency:'EUR',price:250,quote_date:'2026-10-30',source:'Historical'}
];
const wallets=[],trades=[],watch=[],fx=[
{currency:'USD',eur_per_unit:.8950948801,quote_date:'2026-10-30',source:'ECB'},
{currency:'EUR',eur_per_unit:1,quote_date:'2026-10-30',source:'ECB'}
];
const db={
 from(table){
  const data=()=>table==='fp_paper_wallets'?wallets:table==='fp_paper_trades'?trades:table==='fp_paper_quotes'?quotes:table==='fp_paper_watchlist'?watch:fx;
  const query={then(ok,fail){return Promise.resolve({data:data(),error:null}).then(ok,fail)},select(){return this},eq(){return this},in(){return this},order(){return this},limit(){return Promise.resolve({data:data(),error:null})}};
  return query;
 },
 functions:{invoke:async(name,{body})=>({data:{asof:'2026-10-30',currencies:['EUR','USD']},error:null})},
 async rpc(name,params){
  if(name==='fp_paper_claim_artifact_rewards')return {data:{bonus_added_eur:0},error:null};
  if(name!=='fp_paper_execute')throw Error('unexpected RPC '+name);
  const quote=quotes.find(x=>x.symbol===params.p_symbol),rate=fx.find(x=>x.currency===quote.currency).eur_per_unit;
  const q=Number(params.p_quantity??Math.floor(params.p_amount_eur/(quote.price*rate)*1e6)/1e6);
  const totalEUR=Math.round(quote.price*rate*q*100)/100,total=Math.round(quote.price*q*100)/100;
  let wallet=wallets.find(x=>x.currency==='EUR');
  if(!wallet){wallet={currency:'EUR',balance:1000,starting_balance:1000};wallets.push(wallet)}
  if(params.p_side==='BUY'&&wallet.balance<totalEUR)return{data:null,error:{message:'Not enough EUR'}};
  if(params.p_side==='SELL'&&trades.reduce((sum,t)=>sum+(t.side==='BUY'?1:-1)*Number(t.quantity),0)<q)return{data:null,error:{message:'Insufficient holdings'}};
  wallet.balance=Math.round((wallet.balance+(params.p_side==='BUY'?-totalEUR:totalEUR))*100)/100;
  trades.push({id:'new'+(++num),symbol:params.p_symbol,currency:quote.currency,side:params.p_side,quantity:q,price:quote.price,total,eur_total:totalEUR,fx_eur_per_unit:rate,quote_date:quote.quote_date,traded_at:'2026-11-01T12:00:00Z'});
  return {data:{symbol:params.p_symbol,quantity:q,price:quote.price,total_eur:totalEUR,quote_date:quote.quote_date,currency:quote.currency},error:null};
 }
};
const win={FinanzPilotCloud:{get user(){return identity},get paperClient(){return db}},addEventListener(){},dispatchEvent(){},render(){},
 confirm(){return true},FinanzPilotCharts:{html(){return '<div></div>'}}};
const doc={readyState:'loading',hidden:false,addEventListener(k,fn){events[k]=fn}};
class FakeDate extends Date{constructor(...args){super(...(args.length?args:['2026-11-01T12:00:00Z']))}static now(){return Date.parse('2026-11-01T12:00:00Z')}}
const context=vm.createContext({window:win,document:doc,state:{view:'depot'},Date:FakeDate,Intl,Math,JSON,Number,String,URL,
 Event:class Event{},console});
vm.runInContext(front,context);
const api=win.FinanzPilotPortfolio;await api.load();
assert.equal(api.currencyStats().cash,1000);
assert(api.render().includes('Einmaliges virtuelles Startkapital: 1.000 €'));
assert(api.render().includes('Eurobetrag'));
assert(api.render().includes('data-depot-amount'));
await api.trade();
assert.equal(api.trades.length,1);
assert(api.trades[0].quantity>0&&api.trades[0].quantity<1,'50 € should buy a fraction of $520 MSFT');
assert(api.trades[0].eur_total>0&&api.trades[0].eur_total<=50);
assert(api.currencyStats().cash<1000);
assert.equal(api.currencyStats().earnedBonus,0);
assert(api.render().includes('Anteile'));
identity=null;await api.load();assert.equal(api.trades.length,0);
console.log('v40: single EUR paper budget, FX-priced fractional order, secure streak ledger and logout clearing verified.');
