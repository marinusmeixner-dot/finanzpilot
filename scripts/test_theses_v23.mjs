import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=p=>fs.readFileSync(p,'utf8');
const src=read('theses.js');
const cases=JSON.parse(read('data/investment-committee.json')).cases;
const memory={},sent=[],state={view:'research'};
const localStorage={getItem:k=>memory[k]??null,setItem:(k,v)=>memory[k]=String(v)};
const doc={readyState:'loading',addEventListener(){},querySelectorAll(){return []}};
const window={dispatchEvent(e){sent.push(e.type)},render(){},FinanzPilotNavigation:{route(v){state.view=v}}};
const context=vm.createContext({window,document:doc,localStorage,state,URL,Date,Intl,Math,JSON,Number,String,
 Event:class Event{constructor(type){this.type=type}}});
vm.runInContext(src,context,{filename:'theses.js'});
const api=window.FinanzPilotTheses;
const weak=api.evaluate({ticker:'ABC',company:'Test AG',bear:'12',base:'20',bull:'30',bearWeight:'40',baseWeight:'50',bullWeight:'30'});
assert.equal(weak.weighted,null,'Never show a model value for weights >100%');
assert.equal(weak.weightsOK,false);
assert(!weak.sourceSyntax,'Missing sources must not be treated as verified');
const strong={
 company:'Test AG',ticker:'TEST',stance:'Beobachten',horizon:'1–2 Jahre',
 sourceUrl:'https://example.org/annual-report',asof:'FY2026',
 thesis:'Die Kapitalrendite könnte nach der Expansion über dem WACC liegen. Meine These hängt aber von der künftig tatsächlich verfügbaren freien Liquidität ab.',
 evidence:'Bericht FY2026: 500 Mio. Euro Umsatz, 90 Mio. Euro EBIT und 72 Mio. Euro operativer Cashflow. Der Einmaleffekt ist gesondert zu prüfen.',
 valuationMethod:'DCF',bear:'12',base:'20',bull:'30',bearWeight:'30',baseWeight:'50',bullWeight:'20',
 assumptions:'Für den Base Case erwarte ich Umsatzwachstum von 7 Prozent, stabile operative Margen und eine Diskontierung mit 10 Prozent WACC.',
 risk:'Ein Großkunde könnte abspringen und dadurch das Umsatzwachstum, die Cashflow-Marge und die Bewertung nachhaltig verschlechtern.',
 invalidation:'Ich würde die These aufgeben, falls zwei aufeinanderfolgende Quartale mit sinkendem operativem Cashflow gemeldet werden.',
 catalyst:'Beim Quartalsbericht im Januar 2027 überprüfe ich Kapitalbindung, EBIT-Marge und Managementerwartungen.'
};
const first=api.create(strong);
assert(first.id&&first.check.score===10);
assert(Math.abs(first.check.weighted-19.6)<1e-8);
assert.equal(api.entries.length,1);
const second=api.create({...strong,base:'22',bull:'35',thesis:strong.thesis+' Ich werde künftig einen Bewertungsabschlag für Zyklizität berücksichtigen.'},first.id);
assert.equal(api.entries.length,2,'Revision must preserve original version');
assert.equal(api.entries[0].id,first.id,'Historical analysis must be immutable');
assert.equal(api.entries[0].input.base,'20');
assert.equal(second.revisionOf,first.id);
assert(api.render().includes('Verglichen mit der vorherigen Version'));
assert(api.render().includes('Formaler Qualitätscheck'));
assert(api.prompt(first).includes('nicht nur die Vollständigkeit'),'AI prompt must request true fact verification');
assert(api.prompt(first).includes('Formaler Vollständigkeitscheck'));
assert.equal(api.draftFromCommittee(cases[1],{
 memo:{stance:'Beobachten',thesis:strong.thesis,risk:strong.risk},
 model:{bear:30,base:50,bull:20,pe:27}
},{targets:[345.60,466.56,587.52]}),true);
assert.equal(state.view,'theses','Import stays in Aktien tab');
assert.equal(api.state.draft.ticker,'NASDAQ:MSFT');
assert.equal(api.state.draft.bearWeight,'30');
assert(api.state.draft.valuationMethod.includes('EPS'));
assert(sent.includes('fp-progress-change'));
assert(api.draftFromAcademy({symbol:'NASDAQ:GOOGL',symbol_name:'Alphabet',source_url:'https://example.org/alph',date:'2026-10-31'},null,strong.thesis));
assert(api.state.draft.ticker==='NASDAQ:GOOGL');
assert(read('academy.js').includes('data-academy-action="thesis-journal"'));
const sync=read('sync.js');
assert(sync.includes("'finanzpilot_theses_v1'"));
assert(sync.includes("key==='finanzpilot_theses_v1'"));
assert(sync.includes('function mergeTheses('));
const begin=sync.indexOf('  function mergeTheses('),end=sync.indexOf('  function mergePayload(',begin);
const helpers="const isObject=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);";
const merge=vm.runInNewContext(helpers+sync.slice(begin,end)+'\nmergeTheses',{Map,Date,JSON,Math,Number,Array,Set});
const cloud={entries:[first,second],draft:null,draftAt:0};
const local={entries:[{...second,updatedAt:second.updatedAt+10000,externalFeedback:{text:'External review with verified references',at:Date.now()}}],draft:{ticker:'TEST'},draftAt:Date.now()};
const merged=merge(local,cloud);
assert.equal(merged.entries.length,2);
assert(merged.entries.find(x=>x.id===second.id).externalFeedback,'Newer review must survive sync');
assert(merged.entries.some(x=>x.id===first.id),'Earlier version must survive sync');
assert(merged.draft?.ticker==='TEST');
assert(read('ux-v15.js').includes("theses:'stockhub'"));
assert(read('app.js').includes("state.view==='theses'"));
assert(read('investment-committee.js').includes("data-ic-to-journal"));
assert(read('index.html').includes('theses.js?v=24'));
assert(read('index.html').includes('theses-v23.css?v=24'));
console.log('Thesis Journal v23: rubric, model math, revisions, labels, committee import and private cloud merge verified.');
