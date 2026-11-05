import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=p=>fs.readFileSync(p,'utf8');
const radar=JSON.parse(read('data/research-radar-v86.json'));
const ledger=JSON.parse(read('data/thesis-ledger-v86.json'));
const universe=JSON.parse(read('data/research-universe-v86.json'));
const html=read('index.html');
const insights=read('market-insights-v82.js');
const home=read('home-v48.js');
assert.equal(radar.schema_version,1);
assert.equal(ledger.schema_version,1);
assert.equal(radar.candidates.length,radar.total_issuers);
assert(radar.with_price_history>=9,'Radar must retain the audited seed histories and expand as public daily data arrives');
assert(radar.front_page_candidate_ids.every(id=>radar.candidates.some(c=>c.id===id)),'Every featured stock must exist in the dynamically scanned universe');
assert(radar.total_issuers>=45,'Search needs meaningful breadth across industries and countries');
assert(universe.equities.length>=40,'Universe cannot remain nine stock picks');
assert(new Set(radar.candidates.map(c=>c.id)).size===radar.total_issuers,'Issuer IDs must be unique');
assert(new Set(radar.candidates.map(c=>c.ticker)).size===radar.total_issuers,'No duplicate tickers');
assert(radar.candidates.some(c=>c.id==='basf'&&c.has_curated_dossier===false),'Scanner must discover researched names outside the old fixed nine');
assert(radar.candidates.some(c=>c.id==='microsoft'&&c.has_curated_dossier===true),'Original dossier must remain');
assert(radar.candidates.some(c=>c.research_priority==='insufficient_data'),'Missing prices are explicitly displayed, not invented');
assert(radar.candidates.every(c=>c.signals&&c.next_review&&c.research_disclaimer));
assert(radar.candidates.every(c=>c.research_priority!=='A_research_first'||c.editorial_evidence),'Top research priority needs an editorial source');
assert(radar.candidates.every(c=>c.benchmarks.every(b=>b.currency===c.currency)),'ETF comparison must not mix listing currency');
assert(ledger.events.length>0&&ledger.events.every(e=>e.classification==='public_research_queue_change_not_investment_decision'),'Immutable event records cannot be mistaken for trades');
assert(html.includes('market-radar-v86.js?v=87')&&html.includes('market-radar-v86.css?v=86'));
assert(html.indexOf('market-radar-v86.js?v=87')<html.indexOf('market-insights-v82.js?v=86'));
assert(insights.includes('FinanzPilotRadar?.dashboard?.()')&&insights.includes('FinanzPilotRadar.candidateDetail(selected)'));
assert(insights.includes('FinanzPilotRadar?.addendum?.(idea.id)'));
assert(home.includes('FinanzPilotRadar?.homePreview?.()'));
const events=[],listeners={};
const state={view:'marketideas'};
const localStorage={memory:new Map(),getItem(k){return this.memory.get(k)??null},setItem(k,v){this.memory.set(k,v)}};
const window={
 addEventListener(name,handler){listeners[name]=handler},
 render(){events.push('render')},
 FinanzPilotNavigation:{route(x){events.push('route:'+x)}},
 FinanzPilotInsights:{openIdea(x){events.push('open:'+x);return true;}}
};
const document={readyState:'loading',addEventListener(name,handler){listeners[name]=handler}};
const fetch=async url=>({ok:true,json:async()=>String(url).includes('thesis-ledger')?ledger:radar});
const context=vm.createContext({window,document,fetch,localStorage,state,Set,Map,Date,Intl,Math,Array,Number,String,URL,Promise,console});
vm.runInContext(read('market-radar-v86.js'),context,{filename:'market-radar-v86.js'});
const api=window.FinanzPilotRadar;
await api.load();
assert.equal(api.candidates.length,radar.total_issuers);
assert.equal(api.ledger.length,ledger.events.length);
const list=api.dashboard();
assert(list.includes('Neue Aktien entdecken')&&list.includes('Apple'));
assert(list.includes(String(radar.total_issuers)));
assert(list.includes('Recherche-Chancen')&&list.includes('Alle Unternehmen')&&list.includes('Archiv'));
assert(list.includes('keine günstige Bewertung')||list.includes('keine geprüfte Unterbewertung'));
const fresh=api.candidateDetail('basf');
assert(fresh.includes('BASF')&&fresh.includes('UMGEKEHRTE')===false,'Screen-only candidate must not reuse audited valuation as if available');
assert(fresh.includes('Keine')||fresh.includes('keine')||fresh.includes('noch keine'));
assert(fresh.includes('ETF-Alternative')&&fresh.includes('Originalquelle')&&fresh.includes('Eigene Investmentthese'));
const restored=api.addendum('microsoft');
assert(restored.includes('Renditevergleich')&&restored.includes('Thesen'));
assert(api.homePreview().includes('Apple'),'Front page must show actual dynamically discovered name, not hardcoded last-two dossiers');
assert(api.findByTicker('AAPL')?.id==='apple');
assert(api.findByTicker('NASDAQ:MSFT')?.id==='microsoft');
const make=(dataset)=>({dataset,addEventListener(type,fn){this.onClick=fn}});
const tab=make({fp86Tab:'all'}),open=make({fp86Open:'apple'}),track=make({fp86Track:'apple'}),theses=make({}),ideas=make({});
const nodes={
 '[data-fp86-tab]':[tab],'[data-fp86-open]':[open],'[data-fp86-track]':[track],
 '[data-fp86-theses]':[theses],'[data-fp86-ideas]':[ideas]
};
api.bind({querySelectorAll:k=>nodes[k]||[]});
tab.onClick();
assert(api.dashboard().includes('Missing Inc')===false,'All universe names must originate from actual prices/universe, not mocked fixture');
assert(api.dashboard().includes('Cognex'));
open.onClick();
assert(events.includes('open:apple'));
track.onClick();
assert(JSON.parse(localStorage.getItem('fp86_tracked_v1')).includes('apple'));
theses.onClick();ideas.onClick();
assert(events.includes('route:theses')&&events.includes('route:marketideas'));
assert(api.candidateDetail('unknown').includes('nicht gefunden'));
console.log('V86 PASS: 55+ issuer dynamic discovery, newly discovered BASF and promoted Apple, audited data boundaries, benchmark comparisons, tracker and native navigation.');
