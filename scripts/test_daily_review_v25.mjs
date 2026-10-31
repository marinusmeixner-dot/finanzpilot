import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=p=>fs.readFileSync(p,'utf8');
const dataset=JSON.parse(read('data/daily-challenges.json'));
assert.equal(dataset.schema_version,1);
assert(dataset.tasks.length>=2);
assert(dataset.tasks.every(t=>t.id&&t.date===dataset.date&&t.question?.length>=40&&t.rubric?.length>=3&&t.source_url?.startsWith('https://')));
const sql=read('supabase/review_submissions_v1.sql');
assert(sql.includes('enable row level security'));
assert(sql.includes('auth.uid()'));
assert(sql.includes('consent is true'));
assert(sql.includes('grant insert(task_id,task_date,kind,task_title,question,rubric,answer,consent)'));
assert(!sql.includes('grant update'));
const state={view:'dailyreview'},memory={},events={},handlers={},sent=[];
const localStorage={getItem:k=>memory[k]??null,setItem:(k,v)=>{memory[k]=String(v)}};
let userId='private-user-1';let rows=[];
const client={
 from(table){assert.equal(table,'fp_review_submissions');return {
   select(){return {order(){return {limit:async()=>({data:[...rows],error:null})}}}},
   insert(body){sent.push(body);return {select(){return {single:async()=>{
     const row={...body,id:'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',created_at:'2026-10-31T15:10:00Z',eligible_after:'2026-11-01',status:'pending',feedback:null,reviewed_at:null};
     rows.push(row);return {data:row,error:null};
   }}}}},
   delete(){return {eq:async(id,value)=>{rows=rows.filter(r=>r[id]!==value);return {error:null}}}}
 }}
};
const cloud={get user(){return userId},get reviewClient(){return userId?client:null},openLogin(){}};
const window={FinanzPilotCloud:cloud,addEventListener(k,fn){events[k]=fn},render(){},FinanzPilotNavigation:{route(v){state.view=v}}};
const document={readyState:'loading',hidden:false,addEventListener(k,fn){handlers[k]=fn},querySelectorAll(){return []}};
const context=vm.createContext({window,document,localStorage,state,console,fetch:async()=>({ok:true,json:async()=>dataset}),navigator:{onLine:true},Event:class Event{constructor(type){this.type=type}},Date,Intl,URL,JSON,Math,Number,String,Array});
vm.runInContext(read('daily-review.js'),context,{filename:'daily-review.js'});
const api=window.FinanzPilotDailyReview;
await api.load();
assert.equal(api.tasks.length,2);
assert.equal(rows.length,0,'App must never auto-submit private responses');
assert(api.render().includes('Tagesherausforderungen'));
assert(api.render().includes('Privat'));
const content='Alphabet meldete 127,577 Mrd. USD Umsatz. Negativer Quartals-FCF kann bei Cloudwachstum und hohem CapEx auftreten. Ich fordere daher Belege über ROIC, WACC und nachhaltigen FCF sowie mehrere Gegenhypothesen statt eines sicheren Kursziels.';
await api.submit(api.tasks[0],content);
assert.equal(sent.length,1);
assert.equal(sent[0].consent,true);
assert.equal(sent[0].answer,content);
assert.equal(rows.length,1);
assert(api.render().includes('Bewertung ausstehend'));
rows[0].status='reviewed';rows[0].reviewed_at='2026-11-01T09:30:00Z';
rows[0].feedback={score:17,max_score:20,summary:'Fundierte Argumentation',strengths:['FCF differenziert'],errors:['WACC noch unklar'],counterpoints:['CapEx-Risiko'],next_steps:['Modell prüfen'],sample_answer:'FCF nach Investitionen ist entscheidend.',sources:[]};
await api.refresh();
assert(api.render().includes('Fachliche Bewertung erhalten'));
assert(api.render().includes('WACC noch unklar'));
assert(api.render().includes('17 / 20'));
api.useMarketOpinion({date:dataset.date},'Ein anderer ausdrücklich gespeicherter Marktcheck-Entwurf');
assert.equal(state.view,'dailyreview');
assert(api.drafts[api.tasks[0].id].includes('Marktcheck-Entwurf'));
assert.equal(api.useMarketOpinion({date:'2025-01-01'},'Nicht passende Aufgabe'),false,'Never attach stale text to newer task');
userId=null;
await assert.rejects(()=>api.submit(api.tasks[1],content));
assert.equal(rows.length,1);
assert(read('app.js').includes("state.view==='dailyreview'"));
assert(read('ux-v15.js').includes("dailyreview:'markets'"));
assert(read('academy.js').includes('data-academy-opinion="daily"'));
assert(!read('academy.js').includes('data-academy-opinion="github"'));
assert(read('sync.js').includes('get reviewClient()'));
assert(read('index.html').includes('daily-review.js?v=25'));
console.log('Daily review v25: sourced tasks, opt-in only, private queue, status transition, archived feedback and stale-task isolation OK');
