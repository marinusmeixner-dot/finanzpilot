/* v46: four-step specialist teaching – earned rewards remain server-owned. */
(function(){
'use strict';
let selected='',page=0;
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels=['Verstehen','Beispiel lösen','Selbst erklären','Wissen prüfen'];
function open(id){if(selected!==id){selected=id;page=0}}
function render(skill,lesson,info={}){
 if(selected!==lesson.id)open(lesson.id);
 const done=Boolean(info.completed),step=Math.max(0,Math.min(3,page));
 const steps='<nav class="fp46-study-steps" aria-label="Lernphasen">'+labels.map((label,i)=>
  '<button type="button" data-fp46-study-step="'+i+'" class="'+(i===step?'active':'')+'" aria-current="'+(i===step?'step':'false')+'"><span>'+String(i+1)+'</span>'+label+'</button>').join('')+'</nav>';
 let content='';
 if(step===0)content='<section class="fp46-study-panel"><span class="eyebrow">01 · DIE IDEE VERSTEHEN</span><h3>Was steckt dahinter?</h3><p>'+esc(lesson.explanation)+'</p>'+
  '<div class="fp46-didactic-tip"><b>Dein Lernziel</b><p>'+esc(lesson.keyTakeaway||lesson.goal)+'</p></div>'+
  (lesson.pitfall?'<details class="fp46-mistake"><summary>Typischen Denkfehler erkennen</summary><p>'+esc(lesson.pitfall)+'</p></details>':'')+'</section>';
 if(step===1)content='<section class="fp46-study-panel"><span class="eyebrow">02 · AN EINEM FALL LERNEN</span><h3>Beispiel durchdenken</h3><p>'+esc(lesson.example)+'</p>'+
  (lesson.workedSteps?.length?'<ol class="fp46-worked-steps">'+lesson.workedSteps.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ol>':'')+
  '<p class="fp46-study-pause">Überlege selbst: Welche Zahl oder Annahme trägt die Schlussfolgerung?</p></section>';
 if(step===2)content='<section class="fp46-study-panel"><span class="eyebrow">03 · TRANSFER</span><h3>Wissen mit eigenen Worten erklären</h3>'+
  '<p class="fp46-transfer-task">'+esc(lesson.transferPrompt||'Erkläre die wichtigste Schlussfolgerung des Beispiels und eine mögliche Ausnahme.')+'</p>'+
  (window.FinanzPilotStudy?.noteWidget?.(lesson.id,lesson.title,lesson.transferPrompt)||'<p>Erkläre den Zusammenhang in eigenen Worten.</p>')+
  (lesson.transferHint?'<details class="fp46-transfer-hint"><summary>Prüfkriterien zur Erklärung</summary><p>'+esc(lesson.transferHint)+'</p></details>':'')+'</section>';
 if(step===3)content='<section class="fp41-question fp46-study-panel"><span class="eyebrow">04 · AKTIVES ABRUFEN</span><h3>'+esc(lesson.question)+'</h3><p>Versuche ohne Nachlesen zu antworten. Die Bewertung erfolgt weiterhin auf dem Server.</p>'+
  lesson.options.map((opt,i)=>'<button type="button" data-fp41-answer="'+i+'" '+(done?'disabled':'')+'><span>'+String.fromCharCode(65+i)+'</span>'+esc(opt)+'</button>').join('')+
  '<div class="fp41-answer-status">'+(done?'✓ Bereits bestanden. Erneutes Lesen vergibt keine doppelten XP.':'Falls du falsch liegst, lies die Erklärung erneut und versuche es noch einmal.')+'</div></section>';
 return '<div class="fp41-study fp46-stepper"><div class="eyebrow">'+esc(skill.title)+' · LEKTION '+lesson.sequence+' VON '+skill.lessons.length+'</div><h2>'+esc(lesson.title)+'</h2>'+
  '<p class="fp46-study-goal"><b>Danach kannst du:</b> '+esc(lesson.goal)+'</p>'+steps+content+
  '<div class="fp46-study-controls">'+(step>0?'<button type="button" class="btn secondary" data-fp46-study-step="'+(step-1)+'">← Vorheriger Lernschritt</button>':'')+
  (step<3?'<button type="button" class="btn" data-fp46-study-step="'+(step+1)+'">Weiter: '+labels[step+1]+' →</button>':'')+'</div>'+
  '<small class="fp46-study-foot">Notizen und Wiederholungen sind freiwillig und vergeben keine XP. Den offiziellen Abschluss prüft nur der Server.</small></div>';
}
function bind(root=document){
 root.querySelectorAll('[data-fp46-study-step]').forEach(b=>b.addEventListener('click',()=>{page=Math.max(0,Math.min(3,Number(b.dataset.fp46StudyStep)||0));window.render?.()}));
 window.FinanzPilotStudy?.bind?.(root);
}
window.FinanzPilotLessonView={open,render,bind,get page(){return page}};
})();
