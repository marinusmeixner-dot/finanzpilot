import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=p=>fs.readFileSync(p,'utf8');
const data=JSON.parse(read('data/fair-value-audit-v85.json'));
const prices=JSON.parse(read('data/market-valuations-v84.json'));
const ideas=JSON.parse(read('data/ideas.json')).ideas;
const html=read('index.html'),research=read('market-insights-v82.js');
assert.equal(data.schema_version,1);
assert.equal(data.records.length,9);
assert.equal(new Set(data.records.map(x=>x.id)).size,9);
assert(ideas.every(x=>data.records.some(r=>r.id===x.id)));
assert.equal(data.records.filter(x=>x.ttm_bridge).length,5);
assert.equal(data.records.filter(x=>x.reported_ttm).length,1);
assert.equal(data.records.filter(x=>x.financial_status==='primary_ttm_reconciled').length,6);
assert.equal(data.records.filter(x=>x.dcf).length,1,'No unaudited DCFs may be presented as fair values');
assert(data.records.every(r=>r.gaps.length>0&&r.primary_sources.every(s=>s.url.startsWith('https://'))));
assert(html.includes('fair-value-v85.js?v=85')&&html.includes('fair-value-v85.css?v=85'));
assert(html.includes('market-insights-v82.js?v=85')&&html.includes('manifest.webmanifest?v=85'));
assert(html.indexOf('valuation-v83.js?v=83')<html.indexOf('fair-value-v85.js?v=85'));
assert(html.indexOf('fair-value-v85.js?v=85')<html.indexOf('market-insights-v82.js?v=85'));
assert(research.includes('FinanzPilotFairValue?.renderFor?.(idea.id)'));
assert(research.includes('FinanzPilotFairValue?.bind?.(root)'));
const events={},state={view:'marketidea'};
const doc={readyState:'loading',addEventListener:(k,fn)=>events[k]=fn};
const w={addEventListener:(k,fn)=>events[k]=fn,render(){},FinanzPilotMarketValue:{snapshot:id=>prices.stocks.find(x=>x.id===id)}};
const context=vm.createContext({document:doc,window:w,state,fetch:async()=>({ok:true,json:async()=>data}),Date,Math,Number,String,Array,Intl,Set,Map,Promise,URL,console});
vm.runInContext(read('fair-value-v85.js'),context,{filename:'fair-value-v85.js'});
const api=w.FinanzPilotFairValue;
await api.load();
assert.equal(api.records.length,9);
const expected={
 microsoft:{cfo:195878,capex:135921,fcf:59957},
 nvidia:{cfo:134360,capex:7354,fcf:127006},
 alphabet:{cfo:179551,capex:159804,fcf:19747},
 amazon:{cfo:168300,capex:210657,fcf:-42357},
 meta:{cfo:133087,capex:104438,fcf:28649},
 aixtron:{cfo:391,capex:29.5,fcf:361.5}
};
for(const [id,e] of Object.entries(expected)){
 const r=api.get(id),b=api.bridge(r);
 assert.equal(b.operating_cf_m,e.cfo,id+' CFO TTM is period-reconciled');
 assert.equal(b.capex_m,e.capex,id+' Capex TTM is period-reconciled');
 assert.equal(b.fcf_m,e.fcf,id+' FCF TTM is a source-to-source difference');
 const page=api.renderFor(id);
 assert(page.includes('Cashflow aus Originalquellen'));
 assert(page.includes('TTM'));
 assert(page.includes(r.primary_sources[0].url));
 assert(page.includes('noch offen')||page.includes('gesperrt')||page.includes('kein'));
}
assert(api.renderFor('meta').includes('Unternehmens-FCF nach Finance-Leases'));
assert(api.renderFor('amazon').includes('Direkte TTM-Veröffentlichung'));
assert(api.renderFor('aixtron').includes('Mrd. €'),'AIXTRON audited cashflows retain EUR');
for(const id of ['siemens','kion','cgnx']){
 const r=api.get(id);assert.equal(api.bridge(r),null);
 const page=api.renderFor(id);
 assert(page.includes('DCF-Kursziel bewusst gesperrt'),'Missing source prerequisites must gate valuation for '+id);
 assert(page.includes('Primärquellen-Audit offen'));
 assert(page.includes(r.gaps[0]));
}
const ms=api.get('microsoft'),ttm=api.bridge(ms);
const result=api.dcfCashflow(ttm.fcf_m,ms.balance.diluted_weighted_shares_m,ms.dcf.default,5);
assert(result&&Number.isFinite(result.per_share)&&result.per_share>0);
const future=ttm.fcf_m*Math.pow(1.13,5);
const manual=Array.from({length:5},(_,i)=>ttm.fcf_m*Math.pow(1.13,i+1)/Math.pow(1.1,i+1)).reduce((a,b)=>a+b,0)
 +future*1.03/(.1-.03)/Math.pow(1.1,5);
assert(Math.abs(result.equity_pv_m-manual)<0.0001,'Five-year present value + terminal value must tie out');
assert(Math.abs(result.per_share-manual/7446)<1e-8);
const bear=api.dcfCashflow(ttm.fcf_m,7446,ms.dcf.cases.bear,5);
const bull=api.dcfCashflow(ttm.fcf_m,7446,ms.dcf.cases.bull,5);
assert(bear.per_share<result.per_share&&result.per_share<bull.per_share);
assert(api.dcfCashflow(-50,7446,ms.dcf.default)===null);
assert(api.dcfCashflow(500,7446,{annual_growth_pct:10,discount_pct:3,terminal_growth_pct:4,fcf_normalization_factor:1})===null);
const page=api.renderFor('microsoft');
for(const x of ['Fünfjährige Cashflow-Sensitivität','Barwert','Bilanzbrücke','keine Doppelzählung','3','data-fp85-growth','data-fp85-factor','Endwert'])assert(page.includes(x),x);
assert(page.includes('29,03')||page.includes('29,028')||page.includes('29,02'),'Cash − debt bridge not displayed or mathematically wrong');
assert(page.includes('kein belastbares Kursziel'));
assert(!page.includes('Jetzt kaufen'));
const ev=api.get('microsoft').balance;
assert.equal(ev.cash_and_st_investments_m-ev.debt_short_m-ev.debt_long_m,29028);
const handlers={},els={};
const make=(tag,value)=>({dataset:{[tag]:'microsoft'},value:String(value),addEventListener:(type,fn)=>handlers[tag+':'+type]=fn});
const controls={
 '[data-fp85-growth]':make('fp85Growth',ms.dcf.default.annual_growth_pct),
 '[data-fp85-rate]':make('fp85Rate',ms.dcf.default.discount_pct),
 '[data-fp85-terminal]':make('fp85Terminal',ms.dcf.default.terminal_growth_pct),
 '[data-fp85-factor]':make('fp85Factor',ms.dcf.default.fcf_normalization_factor)
};
for(const selector of ['growth','rate','terminal','factor','value','tv','pv','terminal-pv'])els['[data-fp85-'+selector+(selector.endsWith('-pv')||['value','tv','pv'].includes(selector)?'':'-label')+']']={textContent:''};
const reset={addEventListener:(type,fn)=>handlers['reset:'+type]=fn};
const section={dataset:{fp85Model:'microsoft'},querySelectorAll:()=>Object.values(controls),querySelector:k=>k==='[data-fp85-reset]'?reset:controls[k]??els[k]??null};
api.bind({querySelectorAll:()=>[section]});
controls['[data-fp85-growth]'].value='18';handlers['fp85Growth:input']();
assert(els['[data-fp85-growth-label]'].textContent.includes('18'));
controls['[data-fp85-factor]'].value='1.5';handlers['fp85Factor:input']();
assert(els['[data-fp85-factor-label]'].textContent.includes('1,5'));
handlers['reset:click']();
assert.equal(Number(controls['[data-fp85-growth]'].value),ms.dcf.default.annual_growth_pct);
assert.equal(Number(controls['[data-fp85-factor]'].value),1);
console.log('V85 PASS: nine explicit issuer audit gates; six primary reconstructed or issuer-reported TTM cashflows; Microsoft equity-CF PV, terminal, share bridge and sliders; no unsupported fair values.');
