/* FinanzPilot v39 – a single, truly progressive curriculum.
 * No XP, career points or rewards are changed by this module.
 */
(function(){
'use strict';
const DATA='./data/journey-v39.json';
const STORAGE='finanzpilot_journey_v1';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read=()=>{try{const x=JSON.parse(localStorage.getItem(STORAGE)||'{}');return x&&typeof x==='object'?x:{}}catch{return{}}};
let data=null,loading=false,error='',state={completed:{},lessons:{},...read()},selectedId=String(read().selected||'');
const stageOf=number=>data?.stages?.[Number(number)-1]||null;
const all=()=>data?.stages?.flatMap(s=>s.modules)||[];
const course=id=>all().find(m=>m.id===id);
const isDone=id=>Boolean(state.completed?.[id]);
const canOpen=id=>{const ix=all().findIndex(m=>m.id===id);return ix>=0&&(ix===0||isDone(all()[ix-1].id))};
const finishedStage=n=>{const s=stageOf(n);return !!s&&s.modules.every(m=>isDone(m.id))};
const completedCount=()=>all().filter(x=>isDone(x.id)).length;
const firstIncomplete=()=>all().find(m=>!isDone(m.id))||all().at(-1);
const stageNum=id=>data?.stages?.findIndex(s=>s.modules.some(m=>m.id===id))+1||1;
const current=()=>course(selectedId);
const localSession=id=>{
 if(!state.lessons[id])state.lessons[id]={page:0,answers:{},updatedAt:Date.now()};
 return state.lessons[id];
};
function persist(){
 try{localStorage.setItem(STORAGE,JSON.stringify(state));window.dispatchEvent(new Event('fp-progress-change'))}catch{}
}
function redraw(){if(typeof window.render==='function')window.render()}
function go(to){window.FinanzPilotNavigation?.route(to)}
function start(){
 const next=firstIncomplete();if(!next)return;
 go('journey-'+stageNum(next.id));
 open(next.id); // open the next lesson immediately, leaving its stage in the Back history
}
function open(id){
 if(!course(id)||!canOpen(id))return false;
 selectedId=id;state.selected=id;
 localSession(id);persist();
 go('journeycourse');
 redraw();
}
function brief(){
 if(!data)return '<div class="fp39-loading">Der neue Lehrplan wird geladen. '+esc(error)+'</div>';
 const total=all().length,done=completedCount(),next=firstIncomplete(),now=stageNum(next?.id);
 return '<div class="fp39-home"><div class="fp39-intro"><div class="eyebrow">DEIN LERNWEG</div><h1>Finanzen Schritt für Schritt lernen.</h1>'+
 '<p>Wir beginnen bei null. Jede Etappe bereitet die nächste vor. Wähle die erste offene Lektion und arbeite dich von dort weiter.</p>'+
 '<div class="fp39-start"><div class="fp39-mini-track"><span style="width:'+(done/total*100).toFixed(1)+'%"></span></div><small>'+done+' von '+total+' Lektionen abgeschlossen</small>'+
 '<button type="button" class="btn" data-journey-start>'+(done===0?'Mit Lektion 1 anfangen':done===total?'Lernweg wiederholen':'Weiterlernen: '+esc(next.title))+' →</button></div></div>'+
 '<section aria-label="Sechs Lernstufen" class="fp39-stage-grid">'+data.stages.map((s,i)=>{
 const completed=s.modules.filter(m=>isDone(m.id)).length,here=i+1===now,locked=i>0&&!finishedStage(i);
 return '<button type="button" class="fp39-stage'+(here?' current':'')+(locked?' locked':'')+'" data-journey-stage="'+(i+1)+'" aria-label="Stufe '+(i+1)+': '+esc(s.title)+', '+completed+' von '+s.modules.length+' Lektionen abgeschlossen"><span class="fp39-stage-num">'+String(i+1).padStart(2,'0')+'</span><span class="fp39-stage-body"><strong>'+esc(s.title)+'</strong><span>'+esc(s.purpose)+'</span><small>'+completed+' / '+s.modules.length+' Lektionen'+(here?' · Als Nächstes':locked?' · Noch gesperrt':'')+'</small></span><span class="fp39-stage-chevron" aria-hidden="true">›</span></button>'
 }).join('')+'</section><details class="fp39-optional"><summary>Weitere Inhalte und Werkzeuge</summary><p>Diese Angebote ergänzen den Lernweg, sind aber nicht für den Einstieg nötig.</p><div class="fp39-extras">'+[
 ['concepts','Kennzahlen-Akademie'],['transfer','Transferwerkstatt'],['training','Praxislabor'],['learningnews','Nachrichten analysieren'],['skills','Skillbaum'],['glossary','Begriffe nachschlagen'],['stockhub','Aktienresearch & Werkzeuge']
 ].map(([id,name])=>'<button type="button" class="btn secondary" data-section-route="'+id+'">'+name+'</button>').join('')+'</div></details></div>';
}
function stage(n){
 const s=stageOf(n);if(!s)return '<div class="fp39-loading">Unbekannte Stufe</div>';
 const count=s.modules.filter(m=>isDone(m.id)).length;
 return '<div class="fp39-stage-page"><span class="eyebrow">ETAPPE '+n+' VON 6</span><h1>'+esc(s.title)+'</h1>'+
 '<p class="fp39-stage-purpose">'+esc(s.purpose)+'</p>'+
 '<div class="fp39-stage-goal"><b>Nach dieser Etappe kannst du:</b><p>'+esc(s.outcome)+'</p></div>'+
 '<p class="fp39-small-progress">'+count+' von '+s.modules.length+' Lektionen abgeschlossen</p>'+
 '<div class="fp39-module-list">'+s.modules.map((m,i)=>{const done=isDone(m.id),locked=!canOpen(m.id),progress=locked?{page:0}:localSession(m.id),page=Math.min(5,Number(progress.page)||0);
 return '<button type="button" data-journey-open="'+esc(m.id)+'" class="fp39-module'+(done?' done':locked?' locked':'')+'" '+(locked?'disabled aria-disabled="true"':'')+'><span class="fp39-module-num">'+(done?'✓':locked?'🔒':String(i+1).padStart(2,'0'))+'</span><span><b>'+esc(m.title)+'</b><small>'+esc(m.goal)+'</small><em>'+(done?'Abgeschlossen':locked?'Erst die vorherige Lektion abschließen':page>0?'Begonnen · weiterlesen':'Jetzt beginnen')+'</em></span><span aria-hidden="true">›</span></button>'
 }).join('')+'</div>'+
 (s.related?.length?'<details class="fp39-optional"><summary>Passende weiterführende Kurse (optional)</summary><p>Die Spezialkurse ergänzen diese Etappe. Sie ersetzen nicht die sechs aufeinanderfolgenden Lektionen.</p><div class="fp39-extras">'+s.related.map(r=>'<button class="btn secondary" type="button" data-section-route="'+esc(r.view)+'">'+esc(r.label)+'</button>').join('')+'</div></details>':'')+
 '<div class="fp39-bottom-actions"><button class="btn secondary" data-section-route="learn">Alle sechs Etappen</button>'+
 (count===s.modules.length&&n<6?'<button class="btn" data-section-route="journey-'+(n+1)+'">Weiter zu Etappe '+(n+1)+' →</button>':'')+'</div></div>';
}
function lesson(){
 const m=current();if(!m||!canOpen(m.id))return '<div class="fp39-loading">Diese Lektion ist noch gesperrt. Schließe zuerst die vorherige Lektion ab.</div>';
 const n=stageNum(m.id),session=localSession(m.id),page=Math.max(0,Math.min(4,Number(session.page)||0));
 const questions=m.questions||[],answers=session.answers||{};
 const steps=['Erklärung','Beispiel','Frage 1','Frage 2','Abschluss'];
 const header='<div class="fp39-course-top"><span class="eyebrow">ETAPPE '+n+' · '+esc(stageOf(n)?.title)+' · '+esc(m.title)+'</span>'+
 '<span class="fp39-course-count">Seite '+(page+1)+' / 5</span></div>'+
 '<div class="fp39-lesson-progress">'+steps.map((label,i)=>'<span class="'+(i<=page?'active':'')+'" title="'+esc(label)+'"></span>').join('')+'</div>'+
 '<h1>'+esc(m.title)+'</h1><p class="fp39-course-goal">'+esc(m.goal)+'</p>';
 let content='';
 if(page===0)content='<article class="fp39-reading"><span class="eyebrow">01 · VERSTEHEN</span><h2>Erst die Idee verstehen</h2><p>'+esc(m.explain)+'</p>'+(Array.isArray(m.details)?m.details.map(d=>'<section class="fp40-lesson-detail"><h3>'+esc(d.heading)+'</h3><p>'+esc(d.text)+'</p></section>').join(''):'')+'<div class="fp39-hint"><b>Dein Lernziel</b><p>'+esc(m.goal)+'</p></div></article>';
 if(page===1)content='<article class="fp39-reading"><span class="eyebrow">02 · BEISPIEL</span><h2>So sieht das im Alltag aus</h2><p>'+esc(m.example)+'</p>'+(m.challenge?'<section class="fp40-lesson-challenge"><h3>Jetzt selbst überlegen</h3><p>'+esc(m.challenge.prompt)+'</p><details><summary>Eine begründete Beispielantwort ansehen</summary><p>'+esc(m.challenge.solution)+'</p></details></section>':'')+'<div class="fp39-hint"><b>Verbindung zur Erklärung</b><p>Versuche, das Beispiel mit den gerade erklärten Grundlagen in eigenen Worten nachzuvollziehen. Die Fragen auf den nächsten Seiten prüfen genau diesen Zusammenhang.</p></div></article>';
 if(page===2||page===3){
 const index=page-2,q=questions[index],a=answers[index],selected=a?.selected;
 content='<article class="fp39-reading"><span class="eyebrow">0'+(page+1)+' · VERSTÄNDNISCHECK</span><h2>'+esc(q.prompt)+'</h2><p>Wähle die fachlich beste Antwort. Bei Fehlern kannst du die Erklärung nochmals nachlesen und neu antworten.</p><div class="fp39-choices">'+q.options.map((opt,i)=>'<button type="button" class="fp39-choice'+(selected===i?(a.correct?' correct':' wrong'):'')+'" data-journey-answer="'+i+'" '+(a?.correct?'disabled':'')+'><span>'+String.fromCharCode(65+i)+'</span>'+esc(opt)+'</button>').join('')+'</div>'+
 (a?'<div class="fp39-feedback '+(a.correct?'correct':'retry')+'"><b>'+(a.correct?'Richtig.':'Noch nicht. Du kannst es erneut versuchen.')+'</b><p>'+esc(q.explanation)+'</p></div>':'')+'</article>';
 }
 if(page===4)content='<article class="fp39-reading fp39-finish"><span class="eyebrow">05 · LEKTION ABSCHLIESSEN</span><h2>Wissen gesichert</h2><p>'+esc(m.goal)+'</p><p>Beide Verständnisfragen wurden richtig beantwortet. Die nächste Lektion knüpft an das Gelernte an; du kannst diese Erklärung jederzeit noch einmal öffnen.</p><p class="fp39-plain-note">Der neue Lernweg dokumentiert den Abschluss, vergibt aber noch keine zusätzlichen XP oder Artefakte. Das gemeinsame Belohnungssystem ist derzeit in Planung.</p></article>';
 const canAdvance=page<2||(page===2||page===3)&&Boolean(answers[page-2]?.correct);
 return '<div class="fp39-lesson">'+header+content+'<div class="fp39-lesson-buttons">'+
 (page>0?'<button type="button" class="btn secondary" data-journey-prev>← Vorherige Seite</button>':'')+
 (page<4?'<button type="button" class="btn" data-journey-next '+(!canAdvance?'disabled':'')+'>'+(page===1?'Zu den Fragen':'Weiter')+' →</button>':
 '<button type="button" class="btn" data-journey-complete>Lektion abschließen →</button>')+
 '</div><small class="fp39-lesson-note">Zurückblättern verändert keine richtige Antwort und löscht keinen Fortschritt.</small></div>';
}
function renderFor(view){
 if(view==='learn')return brief();
 if(/^journey-[1-6]$/.test(view))return stage(Number(view.slice(-1)));
 if(view==='journeycourse')return lesson();
 return '';
}
function showPage(page){
 const m=current();if(!m)return;
 const p=localSession(m.id);p.page=Math.max(0,Math.min(4,page));p.updatedAt=Date.now();persist();redraw();
 if(typeof window.scrollTo==='function')window.scrollTo({top:0,behavior:'instant'});
}
function answer(choice){
 const m=current(),p=m&&localSession(m.id);if(!m||!p)return;
 const page=Math.max(0,Math.min(4,Number(p.page)||0));
 if(page<2||page>3)return;
 const q=m.questions[page-2],i=Number(choice);
 if(!Number.isInteger(i)||i<0||i>=q.options.length||p.answers[page-2]?.correct)return;
 p.answers[page-2]={selected:i,correct:i===q.correct,updatedAt:Date.now()};
 p.updatedAt=Date.now();persist();redraw();
}
function complete(){
 const m=current();if(!m)return;
 const p=localSession(m.id);
 if(p.page!==4||!m.questions.every((q,i)=>p.answers[i]?.correct))return;
 state.completed[m.id]=Date.now();p.updatedAt=Date.now();persist();
 const n=stageNum(m.id);
 selectedId='';state.selected='';persist();
 if(!window.FinanzPilotNavigation?.goBack?.())go('journey-'+n);
 redraw();
}
function bind(root=document){
 root.querySelectorAll('[data-journey-start]').forEach(b=>b.addEventListener('click',start));
 root.querySelectorAll('[data-journey-stage]').forEach(b=>b.addEventListener('click',()=>go('journey-'+b.dataset.journeyStage)));
 root.querySelectorAll('[data-journey-open]').forEach(b=>b.addEventListener('click',()=>open(b.dataset.journeyOpen)));
 root.querySelectorAll('[data-journey-answer]').forEach(b=>b.addEventListener('click',()=>answer(b.dataset.journeyAnswer)));
 root.querySelector('[data-journey-prev]')?.addEventListener('click',()=>{const x=current();if(x)showPage(localSession(x.id).page-1)});
 root.querySelector('[data-journey-next]')?.addEventListener('click',()=>{const x=current();if(!x)return;const p=localSession(x.id),page=p.page;if(page>=2&&!p.answers[page-2]?.correct)return;showPage(page+1)});
 root.querySelector('[data-journey-complete]')?.addEventListener('click',complete);
}
async function load(force=false){
 if(loading)return;
 if(data&&!force)return;
 loading=true;
 try{
  const res=await fetch(DATA+'?v=40',{cache:'no-store'});
  if(!res.ok)throw Error('HTTP '+res.status);
  const received=await res.json();
  if(received.schema_version!==1||received.stages?.length!==6||received.stages.some(s=>s.modules?.length!==6))throw Error('Ungültiger Lehrplan');
  data=received;error='';
 }catch(e){error='Lerninhalte sind derzeit nicht erreichbar. Bitte erneut laden.';console.warn('FinanzPilot Journey:',e)}
 finally{loading=false;redraw()}
}
window.addEventListener('fp-cloud-progress-imported',e=>{if(e?.detail?.keys?.includes(STORAGE)){state={completed:{},lessons:{},...read()};selectedId=String(state.selected||'');redraw()}});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>load(),{once:true});else load();
window.FinanzPilotJourney={renderHome:brief,renderFor,bind,load,open,start,complete,stageOf,firstIncomplete,get modules(){return all()},get completed(){return state.completed},canOpen,get state(){return state}};
})();
