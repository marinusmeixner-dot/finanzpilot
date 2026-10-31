import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read=p=>fs.readFileSync(p,'utf8');
const js=read('portfolio.js'),sql=read('supabase/paper_portfolio_v1.sql'),html=read('index.html');
assert(sql.includes('enable row level security'));
assert(sql.includes("v_user uuid := (select auth.uid())"),'RPC must use authenticated owner identity');
assert(sql.includes('for update'),'Wallet must be locked for atomic orders');
assert(sql.includes("if v_holdings<p_quantity"),'No naked paper short selling');
assert(sql.includes('v_balance<v_total'),'No overspending');
assert(sql.includes("quote_date<(now() at time zone 'Europe/Berlin')::date-7"),'No stale quote execution');
assert(sql.includes('grant execute on function public.fp_paper_execute'));
assert(!sql.includes('grant insert on public.fp_paper_trades'));
assert(!sql.includes('grant update on public.fp_paper_wallets'));
assert(html.includes('portfolio.js?v=34')&&html.includes('portfolio-v26.css?v=30'));
assert(html.includes('app.js?v=34')&&html.includes('ux-v15.js?v=34'));
assert(read('ux-v15.js').includes("['stockhub','Aktien & Analysen'"));
assert(read('ux-v15.js').includes("depot:{label:'Depot'"));
assert(read('sync.js').includes('get paperClient()'));

const quoteData=JSON.parse(read('data/prices.json'));
const q=q=>{
 const asset=quoteData.assets[q];return {symbol:q,asset_name:q,currency:asset.currency,price:asset.points.at(-1).c,quote_date:asset.asof,source:asset.source,adjusted:true};
};
const quotes=[q('MSFT'),q('SIEMENS')],wallets=[],tradeRows=[],watchRows=[];
let account='sample-user',calls=0;
const fakeClient={
 from(t){
  const data=t==='fp_paper_quotes'?quotes:t==='fp_paper_wallets'?wallets:t==='fp_paper_watchlist'?watchRows:tradeRows;
  const result=()=>Promise.resolve({data,error:null});
  const query={then(ok,fail){return result().then(ok,fail)},order(){return this},eq(){return this},in(){return this},limit(){return result()},range(){return result()}};
  return {select(){return query}};
 },
 async rpc(fn,p){
  if(fn==='fp_paper_claim_artifact_rewards')return {data:{bonus_added_eur:0},error:null};
  assert.equal(fn,'fp_paper_execute');
  calls++;
  const quote=quotes.find(q=>q.symbol===p.p_symbol);
  if(!quote)return {error:{message:'Quote missing'}};
  const total=Math.round(quote.price*p.p_quantity*100)/100;
  let wallet=wallets.find(w=>w.currency===quote.currency);
  if(!wallet){wallet={currency:quote.currency,balance:50000};wallets.push(wallet)}
  if(p.p_side==='BUY'&&wallet.balance<total)return {error:{message:'Insufficient cash'}};
  if(p.p_side==='SELL'){
   const held=tradeRows.filter(r=>r.symbol===p.p_symbol).reduce((v,r)=>v+(r.side==='BUY'?r.quantity:-r.quantity),0);
   if(held<p.p_quantity)return {error:{message:'No stock'}};
  }
  wallet.balance+=(p.p_side==='BUY'?-total:total);
  tradeRows.push({id:'id'+calls,symbol:p.p_symbol,side:p.p_side,quantity:p.p_quantity,currency:quote.currency,price:quote.price,total,quote_date:quote.quote_date,traded_at:new Date('2026-10-31T13:00:00Z').toISOString()});
  return {data:{symbol:p.p_symbol,side:p.p_side,quantity:p.p_quantity,price:quote.price,currency:quote.currency,quote_date:quote.quote_date,total,cash_remaining:wallet.balance},error:null};
 }
};
const window={FinanzPilotCloud:{get user(){return account},get paperClient(){return account?fakeClient:null},openLogin(){}},
 addEventListener(){},render(){},confirm(){return true},FinanzPilotCharts:{html(){return '<div>price chart</div>'}}};
const handlers={};
const document={readyState:'loading',hidden:false,addEventListener(k,fn){handlers[k]=fn}};
const RealDate=Date;
class FakeDate extends RealDate{constructor(...args){super(...(args.length?args:['2026-10-31T12:00:00Z']))}static now(){return RealDate.parse('2026-10-31T12:00:00Z')}}
const state={view:'depot'};
const ctx=vm.createContext({window,document,state,Date:FakeDate,Intl,Math,JSON,Number,String,URL,Event:class Event{},console});
vm.runInContext(js,ctx,{filename:'portfolio.js'});
const api=window.FinanzPilotPortfolio;
await api.load();
assert.equal(api.quotes.length,2);
assert.equal(api.currencyStats('USD').total,50000);
assert.equal(api.currencyStats('EUR').total,50000);
wallets.push({currency:'EUR',balance:50150});
assert.equal(api.currencyStats('EUR').earnedBonus,150,'Artifact bonus should be visible');
assert.equal(api.currencyStats('EUR').pnl,0,'Gifted play money must not be counted as portfolio profit');
wallets.pop();
assert(api.isFresh(api.quotes[0]));
assert(!api.isFresh({...api.quotes[0],quote_date:'2026-09-01'}));
assert(api.render().includes('Virtuellen Kauf'));
await api.trade();
assert.equal(calls,1);
assert.equal(api.trades.length,1);
assert.equal(api.calcPortfolio().positions[0].qty,1);
assert.equal(api.currencyStats('USD').cash,Math.round((50000-quotes[0].price)*100)/100);
assert.equal(api.currencyStats('EUR').total,50000,'No unverified FX conversion');
assert(api.render().includes('MSFT'));
const pnl=api.calcPortfolio([
{id:'1',symbol:'MSFT',currency:'USD',side:'BUY',quantity:2,price:100,total:200,traded_at:'2026-10-01'},
{id:'2',symbol:'MSFT',currency:'USD',side:'SELL',quantity:1,price:130,total:130,traded_at:'2026-10-02'}
]);
assert.equal(pnl.positions[0].qty,1);
assert.equal(pnl.positions[0].cost,100);
assert.equal(pnl.realized.USD,30);
account=null;
await api.load();
assert(api.render().includes('Zum virtuellen Depot anmelden'));
assert.equal(api.trades.length,0,'Signout must clear in-memory private portfolio data');
console.log('Virtual Depot v26: separate currencies, historical reference prices, server RPC, positions/PnL, no overspending or naked short selling and sign-out safety.');
