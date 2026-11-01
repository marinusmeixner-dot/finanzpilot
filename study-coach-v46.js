/* FinanzPilot v46 – retrieval practice, self-explanation and distributed review.
   Learning support only: NO XP, FP, cash or skill grants. */
(function(){
'use strict';
const KEY='finanzpilot_study_v46';
const day=86400000,spacing=[1,3,7,14,30,45,60];
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const valid=id=>typeof id==='string'&&/^[\w-]{2,100}$/.test(id);
function read(){try{const d=JSON.parse(localStorage.getItem(KEY)||'{}');return d&&typeof d==='object'?{notes:d.notes||{},reviews:d.reviews||{}}:{notes:{},reviews:{}}}catch{return {notes:{},reviews:{}}}}
let db=read(),showAnswer='',reviewFilter='due';
function save(){localStorage.setItem(KEY,JSON.stringify(db));window.dispatchEvent(new Event('fp-progress-change'))}
function hydrate(){db=read()}
function seed(id){
 if(!valid(id)||db.reviews[id])return;
 db.reviews[id]={step:0,dueAt:Date.now()+day,updatedAt:Date.now(),last:'start'};
 save();
}
function note(id,value){
 if(!valid(id))return;
 const clean=String(value||'').trim().slice(0,1600);
 db.notes[id]={text:clean,updatedAt:Date.now()};save();
}
function recall(id,remembered){
 if(!valid(id))return;
 const previous=db.reviews[id]||{step:0},step=remembered?Math.min(spacing.length-1,Math.max(0,Number(previous.step)||0)+1):0;
 db.reviews[id]={step,dueAt:Date.now()+spacing[step]*day,updatedAt:Date.now(),last:remembered?'remembered':'retry'};
 showAnswer='';save();
}
function lessonPool(){
 const result=[];
 const c=window.FinanzPilotLearningHub?.catalog,progress=window.FinanzPilotLearningHub?.status?.lessons||[];
 for(const skill of c?.skills||[])for(const lesson of skill.lessons||[]){
  const done=progress.some(x=>x.lesson_id===lesson.id&&x.completed_at);
  if(done)result.push({id:lesson.id,type:'skill',title:lesson.title,skill:skill.title,question:lesson.question,choices:lesson.options,correct:lesson.correct,explain:lesson.explanation});
 }
 const journey=window.FinanzPilotJourney,j=journey?.catalog;
 for(const stage of j?.stages||[])for(const m of stage.modules||[]){
  if(!journey.state?.completed?.[m.id])continue;
  const first=m.questions?.[0];
  if(first)result.push({id:m.id,type:'basics',title:m.title,skill:'Grundlagen',question:first.prompt,choices:first.options,correct:first.correct,explain:first.explanation});
 }
 return result;
}
function queue(){
 const pool=lessonPool();
 const now=Date.now();
 return pool.map(l=>({...l,review:db.reviews[l.id]||null,due:!(db.reviews[l.id])||Number(db.reviews[l.id].dueAt)<=now}))
 .sort((a,b)=>(a.due===b.due?(a.review?.dueAt||0)-(b.review?.dueAt||0):a.due?-1:1));
}
function dueCount(){return queue().filter(x=>x.due).length}
function reviewWidget(){
 const items=queue(),due=items.filter(x=>x.due),show=(reviewFilter==='all'?items:due).slice(0,6);
 return '<section class="fp46-review"><div class="fp46-review-head"><div><span class="eyebrow">WISSEN LANGFRISTIG SICHERN</span><h2>Wiederholen statt nur abhaken</h2><p>Kurze aktive Abruffragen aus deinen bereits bestandenen Lektionen. Du schätzt selbst ein, ob du die Antwort wirklich wusstest. Keine zusätzlichen XP oder FP.</p></div><span class="fp46-review-count">'+due.length+' fällig</span></div>'+
 '<div class="fp46-review-filters"><button type="button" data-fp46-filter="due" class="'+(reviewFilter==='due'?'active':'')+'">Heute fällig ('+due.length+')</button><button type="button" data-fp46-filter="all" class="'+(reviewFilter==='all'?'active':'')+'">Alle gelernten Inhalte ('+items.length+')</button></div>'+
 (show.length?show.map(l=>{
 const revealed=showAnswer===l.id,when=l.review?.dueAt;
 return '<article class="fp46-review-card"><small>'+esc(l.skill)+' · '+(l.due?'Jetzt wiederholen':'Wiederholung '+(when?new Date(when).toLocaleDateString('de-DE'):'geplant'))+'</small>'+
 '<h3>'+esc(l.title)+'</h3><p>'+esc(l.question)+'</p>'+
 (revealed?'<div class="fp46-review-solution"><b>Richtige Antwort: '+esc(l.choices[l.correct])+'</b><p>'+esc(l.explain)+'</p></div><div class="fp46-review-rating"><button type="button" class="btn secondary" data-fp46-recall="'+esc(l.id)+'" data-fp46-known="0">Nicht sicher – erneut üben</button><button type="button" class="btn" data-fp46-recall="'+esc(l.id)+'" data-fp46-known="1">Ohne Hilfe gewusst</button></div>':
 '<button type="button" class="btn secondary" data-fp46-reveal="'+esc(l.id)+'">Antwort überprüfen</button>')+'</article>';
 }).join(''):'<p class="fp46-review-empty">'+(items.length?'Heute ist keine Wiederholung fällig. Komm morgen wieder.':'Schließe zunächst eine Grundlagen- oder Skill-Lektion ab. Danach erhältst du Wiederholungsfragen.')+'</p>')+
 '<small class="fp46-review-foot">Wiederholungsabstände: zunächst nach 1 Tag, bei sicheren Antworten schrittweise länger. Schwierige Themen bleiben häufiger sichtbar. Selbstbewertung ist kein bestandener Skilltest.</small></section>';
}
function noteWidget(id,topic,refPrompt){
 const draft=db.notes[id]?.text||'';
 return '<section class="fp46-reflection"><span class="eyebrow">DEINE EIGENE ERKLÄRUNG</span><h3>Kannst du es ohne Abschreiben erklären?</h3>'+
 '<p>'+esc(refPrompt||('Erkläre mit eigenen Worten, warum '+topic+' wichtig ist. Welches Gegenbeispiel könnte deine Erklärung widerlegen?'))+'</p>'+
 '<textarea id="fp46-note" data-fp46-note="'+esc(id)+'" rows="4" maxlength="1600" placeholder="Meine Erklärung, eigene Rechnung oder offene Frage …">'+esc(draft)+'</textarea>'+
 '<div class="fp46-reflection-actions"><button type="button" class="btn secondary" data-fp46-save="'+esc(id)+'">Notiz speichern</button><small>Privates Lernjournal · kein benoteter Test</small></div></section>';
}
function bind(root=document){
 root.querySelectorAll('[data-fp46-reveal]').forEach(b=>b.addEventListener('click',()=>{showAnswer=b.dataset.fp46Reveal;window.render?.()}));
 root.querySelectorAll('[data-fp46-recall]').forEach(b=>b.addEventListener('click',()=>{recall(b.dataset.fp46Recall,b.dataset.fp46Known==='1');window.render?.()}));
 root.querySelectorAll('[data-fp46-filter]').forEach(b=>b.addEventListener('click',()=>{reviewFilter=b.dataset.fp46Filter;showAnswer='';window.render?.()}));
 root.querySelectorAll('[data-fp46-save]').forEach(b=>b.addEventListener('click',()=>{const v=root.querySelector('[data-fp46-note]');if(v?.dataset.fp46Note===b.dataset.fp46Save){note(b.dataset.fp46Save,v.value);b.textContent='Gespeichert ✓'}}));
}
window.FinanzPilotStudy={seed,recall,note,reviewWidget,noteWidget,bind,dueCount,queue,hydrate,get data(){return db}};
window.addEventListener('fp-account-reset-applied',()=>{db={notes:{},reviews:{}};showAnswer=''});
window.addEventListener('fp-auth-change',hydrate);
window.addEventListener('fp-cloud-progress-imported',e=>{if(e?.detail?.keys?.includes(KEY))hydrate()});
})();
