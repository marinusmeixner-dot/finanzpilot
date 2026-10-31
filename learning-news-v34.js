/* FinanzPilot v34 – daily source-based learning news, separate from the market newsroom. */
(function(){
'use strict';
const DATA='./data/learning-news.json',KEY='finanzpilot_learning_news_v1';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Keep angle brackets safely escaped. 
const safe=x=>{try{let u=new URL(String(x));return u.protocol==='https:'?u.href:null}catch{return null}};
const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{return {}}};
let archive={date:'',cases:[]},progress=read(),openId=null,index=0,shown=false,error='',lastFetch=0;
const current=()=>archive.cases.find(x=>x.id===openId);
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(progress));window.dispatchEvent(new Event('fp-progress-change'))}catch{}};
const ui=()=>{if(typeof state!=='undefined'&&state.view==='learningnews')window.render?.()};
async function load(force=false){
 if(!force&&archive.cases.length&&Date.now()-lastFetch<180000)return;
 try{
  const r=await fetch(DATA+'?t='+Date.now(),{cache:'no-store'});if(!r.ok)throw Error(r.status);
  const j=await r.json();if(!Array.isArray(j.cases))throw Error('Falsches Lernformat');
  archive=j;error='';lastFetch=Date.now();
 }catch(e){error='Tagesmaterial derzeit nicht erreichbar. Zuletzt geladene Inhalte bleiben verfügbar.'}
 ui();
}
function render(){
 if(!archive.cases.length)return '<div class="fp34 fp34-learning"><h1>News verstehen</h1><p>'+esc(error||'Neue Lernnachrichten werden geladen …')+'</p></div>';
 const lesson=current();
 if(!lesson)return '<div class="fp34 fp34-learning"><span class="eyebrow">LERNEN · TAGESAKTUELLE FALLANALYSEN</span><h1>News wirklich verstehen</h1><p>Ausgewählte Nachrichten als analytische Lektionen, getrennt vom reinen Nachrichtenbereich. Hinterfrage Erwartungen, Zeiträume und Gegenargumente.</p><small>Redaktionsstand: '+esc(archive.date)+'</small><div class="fp34-learning-list">'+archive.cases.map(c=>'<button type="button" class="fp34-learning-card" data-fp34-lesson="'+esc(c.id)+'"><small>'+esc(c.published||'Stand prüfen')+' · '+esc(c.source||'Quelle')+'</small><strong>'+esc(c.title)+'</strong><p>'+esc(c.goal||'Fakten und Bewertung trennen')+'</p><span>'+(progress[c.id]?.done?'✓ Abgeschlossen':'Analyse beginnen')+'</span></button>').join('')+'</div></div>';
 const tasks=lesson.questions||[],q=tasks[index],saved=progress[lesson.id]||{answers:{}},a=saved.answers?.[index],done=index>=tasks.length;
 const link=safe(lesson.url);
 return '<div class="fp34 fp34-learning"><button type="button" class="btn secondary" data-fp34-learning-back>← Alle Lernnachrichten</button>'+
 '<span class="eyebrow">RESEARCH-LEKTION · '+esc(lesson.published||archive.date)+'</span><h1>'+esc(lesson.title)+'</h1>'+
 '<section class="fp34-learning-context"><h2>Was ist passiert?</h2><p>'+esc(lesson.facts||'')+'</p><h3>Warum ist das wichtig?</h3><p>'+esc(lesson.context||'')+'</p><h3>Was darf man daraus nicht voreilig schließen?</h3><p>'+esc(lesson.caveat||'')+'</p>'+
 (link?'<a href="'+esc(link)+'" target="_blank" rel="noopener noreferrer">Originalquelle · '+esc(lesson.source||'Bericht')+'</a>':'')+'</section>'+
 (!done?'<section class="fp34-learning-task"><small>Frage '+(index+1)+' von '+tasks.length+'</small><h2>'+esc(q.question)+'</h2><div class="fp34-learning-options">'+q.options.map((opt,i)=>'<button type="button" '+(a?'disabled':'data-fp34-answer="'+i+'"')+' class="'+(a&&i===q.correct?'correct':a&&i===a.choice?'incorrect':'')+'">'+esc(opt)+'</button>').join('')+'</div>'+
 (a?'<div class="fp34-learning-feedback"><strong>'+(a.correct?'Richtig eingeordnet':'Prüfe die Begründung')+'</strong><p>'+esc(q.explanation)+'</p><button class="btn" data-fp34-next>'+(index===tasks.length-1?'Reflexion öffnen':'Nächste Frage')+'</button></div>':'<p>Wähle die fachlich am besten begründete Aussage. Es geht nicht um Kursraten.</p>')+'</section>':
 '<section class="fp34-learning-task"><h2>Dein eigenes Analyseurteil</h2><p>'+esc(lesson.reflectionPrompt||'Formuliere deine These und was sie widerlegen könnte.')+'</p><textarea id="fp34-reflection" rows="6" maxlength="2500" placeholder="Meine These, die Datenbasis, ein Gegenargument und ein überprüfbares Widerlegungskriterium …">'+esc(saved.reflection||'')+'</textarea><button class="btn" data-fp34-save>Reflexion speichern und abschließen</button><p role="status">'+(saved.done?'Deine Reflexion ist gespeichert.':'Die Antwort bleibt auf deinem Gerät und wird bei aktiviertem Konto synchronisiert.')+'</p>'+
 '<details><summary>Bewertungsmaßstab und Musterargumentation</summary><ul>'+(lesson.rubric||[]).map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul><p>'+esc(lesson.sample||'')+'</p></details></section>')+
 '</div>';
}
function bind(root=document){
 root.querySelectorAll('[data-fp34-lesson]').forEach(b=>b.addEventListener('click',()=>{openId=b.dataset.fp34Lesson;index=0;ui()}));
 root.querySelector('[data-fp34-learning-back]')?.addEventListener('click',()=>{openId=null;index=0;ui()});
 root.querySelectorAll('[data-fp34-answer]').forEach(b=>b.addEventListener('click',()=>{
  const c=current(),q=c.questions[index],choice=Number(b.dataset.fp34Answer);if(!Number.isInteger(choice)||!q)return;
  const old=progress[c.id]||{answers:{}};old.answers={...old.answers,[index]:{choice,correct:choice===q.correct,at:Date.now()}};progress[c.id]=old;save();ui();
 }));
 root.querySelector('[data-fp34-next]')?.addEventListener('click',()=>{index++;ui()});
 root.querySelector('[data-fp34-save]')?.addEventListener('click',()=>{
  const answer=document.getElementById('fp34-reflection')?.value.trim()||'';
  if(answer.length<40){window.alert('Bitte begründe deine Einschätzung ausführlicher (mindestens 40 Zeichen).');return}
  const c=current(),old=progress[c.id]||{answers:{}};progress[c.id]={...old,reflection:answer,done:Date.now()};save();ui();
 });
}
window.FinanzPilotLearningNews={render,bind,load,get cases(){return archive.cases}};
window.addEventListener('fp-cloud-progress-imported',ev=>{if(ev.detail?.keys?.includes(KEY)){progress={...read(),...progress};ui()}});
window.addEventListener('fp-navigation',()=>{if(typeof state!=='undefined'&&state.view==='learningnews')load()});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>load(),{once:true});else load();
})();