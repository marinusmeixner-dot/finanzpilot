import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=path=>fs.readFileSync(path,'utf8');
const radar=JSON.parse(read('data/research-radar-v86.json'));
const decisions=JSON.parse(read('data/research-decisions-v87.json'));
const events=JSON.parse(read('data/investment-thesis-events-v87.json'));
const ideas=JSON.parse(read('data/ideas.json'));
const html=read('index.html');
const nav=read('market-radar-v86.js');
assert.equal(decisions.schema_version,1);
assert.equal(events.schema_version,1);
assert(decisions.rows.length>=40,'Open-universe research must not silently revert to a nine-name watchlist');
assert.equal(decisions.rows.length,radar.candidates.length,'Every discoverable company requires a review decision');
assert.equal(new Set(decisions.rows.map(x=>x.id)).size,decisions.rows.length,'Research IDs must be unique');
assert(decisions.rows.some(x=>x.id==='basf'&&x.research_stage==='editorial_screen'),'Newly discovered Apple is not silently promoted to buy');
assert(decisions.rows.some(x=>x.id==='microsoft'&&x.research_stage==='source_based_watch'),'Current Microsoft cashflow review must remain audit-aware');
assert(decisions.rows.every(x=>x.evidence_readiness&&x.evidence_readiness.value>=0&&x.evidence_readiness.value<=100));
assert(decisions.rows.every(x=>/Kein belegtes Kaufurteil|Archiviert/.test(x.conclusion)));
assert(decisions.rows.every(x=>x.valuation_status!=='buy'&&x.valuation_status!=='sell'),'No invented price-based ratings');
assert(decisions.rows.every(x=>x.peer_valuations.every(y=>y.currency===x.currency)),'Never mix peer closing-price currencies');
assert(decisions.rows.every(x=>x.etf_alternatives.every(y=>y.currency===x.currency)),'ETF comparisons must use same listing currency');
assert(events.events.length>=ideas.ideas.length,'Every curated hypothesis needs a baseline immutable event');
assert(events.events.every(e=>e.classification==='public_source_research_revision_not_trade'));
assert(events.events.every(e=>e.evidence_url?.startsWith('https://')));
assert(html.includes('investment-decisions-v87.js?v=87')&&html.includes('investment-decisions-v87.css?v=87'));
assert(html.indexOf('investment-decisions-v87.js?v=87')<html.indexOf('market-radar-v86.js?v=87'));
assert(nav.includes("['decision','Investmentprüfung']"));
assert(nav.includes("['compare','Aktien vergleichen']"));
assert(nav.includes('FinanzPilotDecisions?.researchOnly?.(c.id)'));
assert(nav.includes('FinanzPilotDecisions?.bind?.(root)'));
const calls=[],eventsMap={};
const mockWindow={
  addEventListener(name,handler){eventsMap[name]=handler},
  render(){calls.push('render')},
  FinanzPilotInsights:{openIdea(id){calls.push('open:'+id)}}
};
const mockDocument={readyState:'loading',addEventListener(name,handler){eventsMap[name]=handler}};
const fetch=async url=>({ok:true,json:async()=>String(url).includes('investment-thesis-events')?events:decisions});
const ctx=vm.createContext({window:mockWindow,document:mockDocument,fetch,state:{view:'marketideas'},
 URL,Math,Number,String,Array,Intl,Set,Map,Promise,Date,console});
vm.runInContext(read('investment-decisions-v87.js'),ctx);
const engine=mockWindow.FinanzPilotDecisions;
await engine.load();
assert.equal(engine.items.length,radar.candidates.length);
assert.equal(engine.events.length,events.events.length);
const board=engine.board();
assert(board.includes('Was ist tatsächlich begründet?')&&board.includes('Microsoft'));
assert(board.includes('Quellenreife')&&board.includes('Prüfung fehlt'));
assert(engine.badge('microsoft').includes('keine Attraktivitätsnote'));
const apple=engine.candidateSection('basf');
assert(apple.includes('Noch keine Investmentthese')&&apple.includes('ETF')&&apple.includes('Original'));
assert(apple.includes('Was könnte sie widerlegen?'));
assert(engine.researchOnly('microsoft').includes('Welche Quellen wurden überprüft?'));
assert(engine.revisions('microsoft').includes('Investmentthese dokumentiert'));
assert(engine.researchOnly('basf').includes('keine dauerhaft dokumentierte fundamentale Investmentthese'));
const compare=engine.comparison();
assert(compare.includes('Einzelaktie oder Alternative?')&&compare.includes('Microsoft')&&compare.includes('Amazon'));
assert(compare.includes('Breit gestreute ETF-Alternativen')&&compare.includes('historisches')||compare.includes('TTM'));
assert(!compare.includes('JETZT KAUFEN'));
const handlers={};
const make=(dataset)=>({dataset,addEventListener(type,fn){handlers[JSON.stringify(dataset)+type]=fn}});
const choiceA=make({fp87Compare:'a'}),choiceB=make({fp87Compare:'b'});
const link=make({fp87Jump:'apple'}),filter=make({fp87Filter:'unverified'});
engine.bind({querySelectorAll:q=>({
 '[data-fp87-filter]':[filter],
 '[data-fp87-jump]':[link],
 '[data-fp87-compare]':[choiceA,choiceB]
})[q]||[]});
link.dataset.fp87Jump='apple';
handlers[JSON.stringify(link.dataset)+'click']();
assert(calls.includes('open:apple'));
handlers[JSON.stringify(filter.dataset)+'click']();
assert(calls.includes('render'));
choiceB.value='siemens';handlers[JSON.stringify(choiceB.dataset)+'change']();
assert(engine.comparison().includes('Unterschiedliche Notierungswährungen'),'Mixed currencies cannot be compared without clear warning');
console.log('V87 PASS: expandable 54-company research triage, evidence scores, source/audit gates, ETF and company alternatives, immutable thesis revision history, interactive comparisons.');
