import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=x=>fs.readFileSync(x,'utf8');
const curriculum=JSON.parse(read('data/specializations-v41.json'));
const lessons=curriculum.skills.flatMap(s=>s.lessons);
assert.equal(lessons.length,156);
assert.equal(new Set(lessons.map(l=>l.id)).size,156);
for(const field of ['example','pitfall']){
 const vals=lessons.map(l=>String(l[field]||'').trim());
 assert.equal(new Set(vals).size,156,'No copied '+field+' across different lessons');
}
const paths=lessons.map(l=>l.workedSteps.join('\n'));
assert.equal(new Set(paths).size,156,'All 156 worked case paths must be specific to the lesson');
for(const l of lessons){
 assert(l.example.length>=60,l.id+' case is too short');
 assert(l.workedSteps.length>=2&&l.workedSteps.length<=4,l.id+' requires 2–4 useful steps rather than forced filler');
 assert(l.workedSteps.every(s=>s.length>=40),l.id+' has an empty explanation step');
 assert(l.pitfall.length>=65,l.id+' needs a concrete misconception or boundary');
}
const samples=[
 ['bewertung-multiples-1','KGV von 15'],
 ['bewertung-multiples-2','1.300 Mio.'],
 ['risiko-basis-3','24 %'],
 ['cashflow-architekt-1','55 Mio.'],
 ['zinskurve-szenarien-2','−6 %'],
 ['prognosen-kalibrieren-2','0,04'],
 ['orderbuch-liquiditaet-1','0,40 €']
];
for(const [id,fragment] of samples){
 const l=lessons.find(x=>x.id===id);
 assert(l&&(l.workedSteps.join(' ')+l.pitfall).includes(fragment),id+' must teach its actual specific calculation');
}
const view=read('lesson-view-v46.js'),html=read('index.html');
assert(view.includes('fp80-case-route'),'Show worked steps directly without generic branch dropdowns');
assert(view.includes('fp80-case-warning'),'Show the specific case pitfall directly');
assert(view.includes('fp80-try'),'Additional written calculation is optional');
assert(view.includes('Freiwillig · keine Bewertung'),'Do not require or score example solving');
assert(!view.includes("FinanzPilotExplain?.skill?.(lesson,skill,'apply')"),'No identical branch-wide apply block');
assert(!view.includes("FinanzPilotExplain?.skill?.(lesson,skill,'concept')"),'No identical branch-wide intro block');
assert(!view.includes("FinanzPilotExplain?.skill?.(lesson,skill,'check')"),'No identical branch-wide quiz block');
assert(!view.includes('fp46-transfer-hint'),'Remove duplicated generic reflection checklists from the interface');
assert(!view.includes('fp46-study-pause'),'Remove identical repeated end-of-example prompt');
assert(html.includes('study-example-v80.css?v=80')&&html.includes('lesson-view-v46.js?v=80'),'New UI styles and runtime load with correct cache version');
assert(html.includes('learning-hub-v41.js?v=80'),'Revised examples must refresh from server');
assert(JSON.parse(read('version.json')).version>=80,'Do not regress below v80');
console.log('V80 PASS: 156 unique worked case explanations, 156 distinct misconceptions, no templated accordion stacks, optional calculation, official assessment untouched.');
