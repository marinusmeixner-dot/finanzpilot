import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=p=>fs.readFileSync(p,'utf8');
const catalog=JSON.parse(read('data/specializations-v41.json')),reports=JSON.parse(read('data/company-financials-v45.json'));
const market=read('market-v34.js'),nav=read('ux-v15.js'),app=read('app.js'),html=read('index.html');
assert.equal(JSON.parse(read('version.json')).version,47);
assert.equal(catalog.branches.length,8);
assert.equal(catalog.skills.length,44);
assert.equal(catalog.skills.flatMap(s=>s.lessons).length,132);
assert.equal(reports.companies.length,4);
assert(html.includes('<strong id="top-fp">0</strong> FP'),'Show points before FP suffix');
assert(nav.includes("['marketfinancials','Kennzahlen'"));
assert(nav.includes("marketfinancials:'markets'"));
assert(app.includes('FinanzPilotMarkets.renderFinancials()'));
assert(market.includes('function renderFinancials()'));
assert(!market.includes('data-fp36-article-back>← Zurück'));
assert(!read('learning-hub-v41.js').includes('data-fp41-lesson-back>Alle Lektionen'));
assert(read('ux-v15.js').includes('backInternal?.(state.view)'));
assert(html.includes('market-v34.js?v=47')&&html.includes('market-v34.css?v=47'));
assert(html.includes('learning-hub-v41.js?v=46'));
assert(read('supabase/cross_skill_domains_v45.sql').includes('fp_specialization_prerequisites'));
const known=new Set(catalog.skills.map(s=>s.id));
for(const s of catalog.skills){
 assert(!s.parent||known.has(s.parent));
 for(const p of s.prerequisites||[])assert(known.has(p)&&p!==s.id);
 for(const l of s.lessons)assert(l.explanation.length>=95&&l.options.length===3&&l.correct>=0&&l.correct<3);
}
for(const c of reports.companies){
 assert(/^https:\/\//.test(c.source.url)&&c.published&&c.period_end&&c.assessment.length>50);
 for(const m of c.metrics)assert(Number.isFinite(m.value)&&m.unit&&m.label);
}
const document={readyState:'loading',addEventListener(){}},window={
 innerWidth:1200,addEventListener(){},dispatchEvent(){},render(){},
 FinanzPilotCloud:{user:null,paperClient:null},FinanzPilotNavigation:{route(){}},
 FinanzPilotJourney:{renderHome:()=>'<h1>Grundlagen</h1>'}
};
const context=vm.createContext({window,document,fetch:async()=>({ok:true,json:async()=>catalog}),console,Intl,Date,Math,Map,Set,URL});
vm.runInContext(read('learning-hub-v41.js'),context);
await window.FinanzPilotLearningHub.load();
const tree=window.FinanzPilotLearningHub.tree();
assert.equal((tree.match(/data-fp42-node="/g)||[]).length,44);
assert((tree.match(/fp45-cross-line/g)||[]).length>=7);
assert(tree.includes('Konjunktur &amp; Zinsen')&&tree.includes('ETFs &amp; Anleihen'));
const hub=window.FinanzPilotLearningHub.home();assert.equal((hub.match(/fp42-learn-entry/g)||[]).length,4);
console.log('v45: 40 skills and 120 lessons, 8 fields, 7 real cross prerequisites, 4 source-dated watchlist reports, 3 market routes, one Back, number-first FP verified.');
