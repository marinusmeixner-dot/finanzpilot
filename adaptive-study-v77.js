/* FinanzPilot V77 — adaptive retrieval with objective evidence and transparent limits.
   Optional practice only. Never calls server reward RPCs or awards XP, FP, or cash. */
(function(){
'use strict';
const KEY='finanzpilot_adaptive_v77',DAY=86400000,STEPS=[.25,1,3,7,14,30,60,120];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const valid=id=>typeof id==='string'&&/^[\w-]{2,100}$/.test(id);
const owner=()=>String(window.FinanzPilotCloud?.user?.id||window.FinanzPilotCloud?.user||'');
const safeNumber=v=>Number.isFinite(Number(v))?Number(v):0;
let state={schema_version:1,attempts:{}},active=null,filter='due',variantBank=[],seq=0;
function read(){
 try{
  const src=JSON.parse(localStorage.getItem(KEY)||'{}');
  if(!src||typeof src!=='object'||Array.isArray(src))return {schema_version:1,attempts:{}};
  if(src.owner&&owner()&&src.owner!==owner())return {schema_version:1,attempts:{}};
  return {schema_version:1,owner:src.owner||owner()||null,attempts:src.attempts&&typeof src.attempts==='object'?src.attempts:{}};
 }catch{return {schema_version:1,attempts:{}}}
}
function hydrate(){state=read();active=null}
function save(){
 state.owner=owner()||state.owner||null;
 try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}
 try{window.dispatchEvent(new Event('fp-progress-change'))}catch{}
}
function records(id){
 const a=state.attempts[id];
 return Array.isArray(a)?a.filter(r=>r&&typeof r.id==='string'&&Number.isFinite(r.t)).sort((x,y)=>x.t-y.t||x.id.localeCompare(y.id)).slice(-24):[];
}
function schedule(id){
 let stage=0,dueAt=0,previousAt=0,last=null;
 for(const r of records(id)){
  const quality=Math.max(0,Math.min(4,safeNumber(r.quality)));
  if(quality>=3)stage=Math.min(STEPS.length-1,stage+1);
  else if(quality===2)stage=Math.max(0,stage);
  else stage=0;
  const span=quality<2?.25:quality===2?1:STEPS[stage];
  dueAt=r.t+span*DAY;previousAt=r.t;last=r;
 }
 return {stage,dueAt,last,previousAt,attempts:records(id)};
}
function knowledge(id){
 const s=schedule(id),history=s.attempts,objective=history.filter(r=>r.mode==='mcq'||r.mode==='numeric'||r.mode==='lesson');
 const tested=objective.length,correct=objective.filter(r=>r.ok).length;
 const last=history.at(-1),two=objective.slice(-2),delayed7=objective.filter(r=>r.delayDays>=7&&r.mode!=='lesson'),delayed30=objective.filter(r=>r.delayDays>=30&&r.mode!=='lesson');
 let label='Noch nicht überprüft';
 if(tested){label=last&&!last.ok?'Hier erneut üben':two.length===2&&two.every(r=>r.ok)&&two.some(r=>r.delayDays>=7)?'Längerfristig bestätigt':'Im Aufbau'}
 return {label,dueAt:s.dueAt,stage:s.stage,attempts:history.length,objectiveTested:tested,objectiveCorrect:correct,
  delayed7:{count:delayed7.length,correct:delayed7.filter(r=>r.ok).length},
  delayed30:{count:delayed30.length,correct:delayed30.filter(r=>r.ok).length},last};
}
function catalog(){
 const result=[];
 const hub=window.FinanzPilotLearningHub,c=hub?.catalog,progress=hub?.status?.lessons||[];
 const paid=new Set(progress.filter(x=>x?.completed_at).map(x=>x.lesson_id));
 for(const sk of c?.skills||[])for(const l of sk.lessons||[])if(paid.has(l.id))
  result.push({id:l.id,title:l.title,skill:sk.title,branch:sk.branch,type:'skill',lesson:l});
 const journey=window.FinanzPilotJourney,done=journey?.completed||journey?.state?.completed||{};
 for(const st of journey?.catalog?.stages||[])for(const l of st.modules||[])if(done[l.id])
  result.push({id:l.id,title:l.title,skill:st.title,branch:'basics',type:'foundation',lesson:l});
 return result;
}
function variants(item){
 const l=item.lesson,all=[];
 if(item.type==='foundation'){
  for(const [i,q] of (l.questions||[]).entries())if(q.options?.length>2&&Number.isInteger(q.correct))
    all.push({id:item.id+':q'+(i+1),type:'mcq',prompt:q.prompt,options:q.options,correct:q.correct,explanation:q.explanation,topic:item.title});
  if(l.challenge?.prompt&&l.challenge?.solution)
    all.push({id:item.id+':transfer',type:'reflection',prompt:l.challenge.prompt,
      solution:l.challenge.solution,steps:[],topic:item.title});
 }else{
  if(l.options?.length>2&&Number.isInteger(l.correct))all.push({id:item.id+':quiz',type:'mcq',
    prompt:l.question,options:l.options,correct:l.correct,explanation:l.explanation,pitfall:l.pitfall,
    steps:l.workedSteps||[],topic:l.title});
  if(l.practice&&Number.isFinite(Number(l.practice.answer)))all.push({id:item.id+':calc',type:'numeric',
    prompt:l.practice.prompt,answer:Number(l.practice.answer),tolerance:Number(l.practice.tolerance)||.001,
    unit:l.practice.unit||'',explanation:l.practice.explanation,steps:l.workedSteps||[],topic:l.title});
  if(l.transferPrompt)all.push({id:item.id+':transfer',type:'reflection',
    prompt:l.transferPrompt,solution:(l.workedSteps||[]).join(' ')+(l.pitfall?' Typischer Fehler: '+l.pitfall:''),
    steps:l.workedSteps||[],topic:l.title});
 }
 for(const extra of variantBank.filter(v=>v.lesson_id===item.id)){
  if(extra.type==='mcq'&&extra.options?.length===4&&Number.isInteger(extra.correct)&&extra.correct>=0&&extra.correct<=3)
   all.push({id:extra.id,type:'mcq',prompt:extra.prompt,options:extra.options,correct:extra.correct,
    explanation:extra.explanation,diagnosis:extra.diagnosis||[],steps:extra.steps||[],topic:item.title});
  if(extra.type==='numeric'&&Number.isFinite(extra.answer))
   all.push({id:extra.id,type:'numeric',prompt:extra.prompt,answer:extra.answer,
    unit:extra.unit||'',tolerance:extra.tolerance||.001,explanation:extra.explanation,steps:extra.steps||[],topic:item.title});
 }
 return all;
}
function selectVariant(item){
 const all=variants(item);if(!all.length)return null;
 const history=records(item.id),last=history.at(-1)?.variant;
 const used=new Map();for(const r of history)used.set(r.variant,(used.get(r.variant)||0)+1);
 return all.filter(v=>v.id!==last).sort((a,b)=>(used.get(a.id)||0)-(used.get(b.id)||0)||a.id.localeCompare(b.id))[0]||all[0];
}
function queue(now=Date.now()){
 const lessons=catalog();
 const indexed=lessons.map(item=>{const k=knowledge(item.id);const legacy=window.FinanzPilotStudy?.data?.reviews?.[item.id]?.dueAt;
  const dueAt=k.attempts?Number(k.dueAt)||0:Number(legacy)||0;
  return {...item,knowledge:k,dueAt,due:dueAt<=now};
 });
 indexed.sort((a,b)=>Number(b.due)-Number(a.due)||a.dueAt-b.dueAt||a.id.localeCompare(b.id));
 // Mix branches early instead of presenting a block of near-identical questions.
 const ordered=[],waiting=[...indexed],used=new Set();
 while(waiting.length){
  let index=waiting.findIndex(x=>!used.has(x.branch));
  if(index<0){used.clear();index=0}
  const [value]=waiting.splice(index,1);ordered.push(value);used.add(value.branch);
 }
 return ordered;
}
function dueCount(){return queue().filter(x=>x.due).length}
function record(id,detail){
 if(!valid(id)||!detail||!['mcq','numeric','reflection','lesson'].includes(detail.mode))return null;
 const old=records(id),last=old.at(-1),t=Date.now(),days=last?Math.max(0,(t-last.t)/DAY):0;
 const quality=Math.max(0,Math.min(4,Math.round(detail.quality)||0));
 const event={id:'at-'+t.toString(36)+'-'+(++seq).toString(36)+'-'+Math.random().toString(36).slice(2,9),
  t,variant:String(detail.variant||''),mode:detail.mode,ok:!!detail.ok,quality,
  confidence:Math.max(0,Math.min(3,Number(detail.confidence)||0)),hint:!!detail.hint,
  delayDays:Math.floor(days),errorType:String(detail.errorType||'').slice(0,30)};
 state.attempts[id]=[...old,event].slice(-24);save();return event;
}
function observeLesson(id,correct,phase){
 // Official server grades count only as initial context, never as long-term mastery.
 if(!valid(id)||typeof correct!=='boolean')return;
 const k=knowledge(id);
 if(k.objectiveTested>0&&k.last?.mode==='lesson'&&Date.now()-k.last.t<60000&&k.last.variant===String(phase||'lesson'))return;
 record(id,{mode:'lesson',ok:correct,variant:String(phase||'lesson'),quality:correct?2:0});
}
function stats(){
 const items=catalog(),k=items.map(x=>knowledge(x.id));
 const delayed7=k.flatMap(x=>records(items[k.indexOf(x)].id).filter(r=>r.mode!=='lesson'&&r.mode!=='reflection'&&r.delayDays>=7));
 const delayed30=delayed7.filter(r=>r.delayDays>=30);
 return {total:items.length,due:dueCount(),withEvidence:k.filter(x=>x.objectiveTested>0).length,
  seven:{total:delayed7.length,passed:delayed7.filter(r=>r.ok).length},
  thirty:{total:delayed30.length,passed:delayed30.filter(r=>r.ok).length}};
}
function hintText(item){
 if(item.type==='foundation')return item.lesson?.goal||'Prüfe die Einheit und den Zeitraum; leite die Antwort aus dem Beispiel ab.';
 return 'Prüfe Zeitraum, Definition und die entscheidende Annahme. '+String(item.lesson?.goal||'').slice(0,160);
}
function chosenOptions(v,n){
 const m=v.options?.length||0,rotation=m? (n*3+1)%m:0;
 return (v.options||[]).map((text,i)=>({text,i})).map((_,i)=>({text:v.options[(i+rotation)%m],i:(i+rotation)%m}));
}
function resultExplanation(a){
 const v=a.variant,selected=a.selected,wrong=v.type==='mcq'&&selected!==v.correct;
 const specific=wrong?String(v.diagnosis?.[selected]||'').trim():'';
 let msg='<div class="fp77-result '+(a.correct?'correct':'wrong')+'" role="status"><strong>'+(a.correct?'Richtig gelöst':'Hier liegt die Denkfalle')+'</strong>';
 if(wrong){
  msg+='<p>Du hast „'+esc(v.options[selected])+'“ gewählt. Fachlich korrekt ist „'+esc(v.options[v.correct])+'“.</p>';
  msg+='<p>'+(specific?esc(specific):'Vergleiche deine Schlussfolgerung mit der vollständigen Begründung und prüfe, welche Annahme in deiner Antwort nicht trägt.')+'</p>';
 }
 if(v.type==='numeric')msg+='<p>Ergebnis: <b>'+esc(v.answer)+' '+esc(v.unit||'')+'</b>. '+(a.correct?'Deine Rechnung passt.':'Prüfe Formel, Vorzeichen und Einheit.')+'</p>';
 msg+='<p>'+esc(v.explanation||v.solution||'')+'</p>';
 if(v.steps?.length)msg+='<details><summary>Rechen- und Denkweg Schritt für Schritt</summary><ol>'+v.steps.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ol></details>';
 if(v.pitfall)msg+='<p><b>Typischer Fehler:</b> '+esc(v.pitfall)+'</p>';
 if(a.confidence===3&&!a.correct)msg+='<p><b>Wissenslücke erkannt:</b> Du warst dir sicher, obwohl die Antwort nicht stimmte. Diese Aufgabe wird früher wiederholt.</p>';
 else if(a.confidence===1&&a.correct)msg+='<p>Deine Antwort war richtig, aber du warst unsicher. Das Thema bleibt deshalb noch im kurzen Wiederholungsabstand.</p>';
 msg+='<p class="fp77-scheduled">Nächste Wiederholung: '+esc(dueLabel(knowledge(a.item.id).dueAt))+' · keine zusätzlichen XP oder FP</p>';
 return msg+'</div>';
}
function dueLabel(time){
 return !time?'Jetzt':new Date(time).toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'});
}
function renderReview(){
 const items=queue(),due=items.filter(x=>x.due),all=filter==='all'?items:due;
 const s=stats();
 let html='<section class="fp46-review fp77-coach"><div class="fp46-review-head"><div><span class="eyebrow">DEIN ADAPTIVER WISSENSTRAINER</span><h2>Wissen anwenden, nicht Antworten merken</h2>'+
  '<p>Fragen aus verschiedenen Themen wechseln sich ab. Richtige Lösungen, Fehler, Sicherheit und Hilfen bestimmen den nächsten Übungstermin. Keine zusätzlichen XP oder FP.</p></div><span class="fp46-review-count">'+due.length+' fällig</span></div>'+
  '<div class="fp77-kpis"><span><strong>'+s.withEvidence+' / '+s.total+'</strong><small>Mit objektiver Prüfung</small></span>'+
  '<span><strong>'+(s.seven.total?s.seven.passed+' / '+s.seven.total:'–')+'</strong><small>Nach ≥7 Tagen richtig</small></span>'+
  '<span><strong>'+(s.thirty.total?s.thirty.passed+' / '+s.thirty.total:'–')+'</strong><small>Nach ≥30 Tagen richtig</small></span></div>'+
  '<small class="fp77-legend">Nur tatsächlich absolvierte, zeitversetzte und überprüfte Aufgaben zählen. Die Werte sind Beobachtungen, keine wissenschaftlich kalibrierte Wissenswahrscheinlichkeit.</small>'+
  '<div class="fp46-review-filters"><button type="button" data-fp77-filter="due" class="'+(filter==='due'?'active':'')+'">Heute fällig ('+due.length+')</button>'+
  '<button type="button" data-fp77-filter="all" class="'+(filter==='all'?'active':'')+'">Alle gelernten Themen ('+items.length+')</button></div>';
 if(active){
  const item=items.find(x=>x.id===active.item.id);
  if(!item){active=null;return html+'<p>Der Lernstand wurde geändert. Bitte erneut eine Aufgabe auswählen.</p></section>'}
  active.item=item;
  const v=active.variant;
  html+='<article class="fp46-review-card fp77-session"><small>'+esc(item.skill)+' · '+esc(knowledge(item.id).label)+'</small>'+
   '<h3>'+esc(item.title)+'</h3><p class="fp77-question">'+esc(v.prompt)+'</p>';
  if(active.stage==='ask'){
   if(v.type==='mcq'){
    html+='<div class="fp77-options">'+chosenOptions(v,records(item.id).length).map(o=>
     '<button type="button" data-fp77-choice="'+o.i+'" class="'+(active.selected===o.i?'selected':'')+'" aria-pressed="'+(active.selected===o.i)+'">'+esc(o.text)+'</button>').join('')+'</div>';
   }else if(v.type==='numeric'){
    html+='<label class="fp77-field">Dein Ergebnis<input data-fp77-number type="text" inputmode="decimal" placeholder="Zahl eingeben, z. B. −12,5" value="'+esc(active.input||'')+'"></label><small>'+esc(v.unit||'')+'</small>';
   }else{
    html+='<label class="fp77-field">Erkläre ohne Nachlesen<textarea data-fp77-draft rows="4" placeholder="Deine eigene Herleitung, Rechnung oder Gegenhypothese …">'+esc(active.draft||'')+'</textarea></label>';
   }
   html+='<div class="fp77-confidence"><b>Wie sicher bist du dir – vor der Lösung?</b>'+
    [1,2,3].map((n,i)=>'<button type="button" data-fp77-confidence="'+n+'" aria-pressed="'+(active.confidence===n)+'" class="'+(active.confidence===n?'selected':'')+'">'+['Unsicher','Eher sicher','Sehr sicher'][i]+'</button>').join('')+'</div>'+
    '<div class="fp77-actions"><button type="button" class="btn secondary" data-fp77-hint>'+(active.hint?'Hinweis angesehen':'Hinweis anzeigen')+'</button>'+
    '<button type="button" class="btn" data-fp77-check '+(active.confidence===null?'disabled':'')+'>'+(v.type==='reflection'?'Musterweg vergleichen':'Antwort prüfen')+'</button>'+
    '<button type="button" class="btn secondary" data-fp77-exit>Zur Übersicht</button></div>';
   if(active.hint)html+='<p class="fp77-hint"><b>Hinweis:</b> '+esc(hintText(item))+'</p>';
  }else if(active.stage==='reflection'){
   html+='<div class="fp77-result"><strong>Musterweg und Prüfkriterien</strong><p>'+esc(v.solution)+'</p>'+
    '<p><b>Deine Erklärung:</b> '+esc(active.draft||'Keine eigene Antwort eingegeben.')+'</p>'+
    '<p>Vergleiche selbst: Hast du den Zusammenhang, die entscheidenden Annahmen und einen möglichen Gegenfall korrekt erklärt? Freitext wird hier nicht automatisch bewertet.</p>'+
    '<div class="fp77-actions"><button type="button" class="btn secondary" data-fp77-self="0">Nicht erklärt</button>'+
    '<button type="button" class="btn secondary" data-fp77-self="1">Teilweise erklärt</button>'+
    '<button type="button" class="btn" data-fp77-self="2">Gut erklärt</button></div></div>';
  }else{
   html+=resultExplanation(active);
   html+='<div class="fp77-actions"><button type="button" class="btn" data-fp77-next>Nächste Aufgabe</button>'+
    '<button type="button" class="btn secondary" data-fp77-exit>Übersicht</button></div>';
  }
  html+='</article>';
 }else{
  if(!items.length)html+='<p class="fp46-review-empty">Schließe zunächst eine Grundlagen- oder Skill-Lektion ab. Danach entsteht dein persönlicher Lernplan.</p>';
  else if(!all.length)html+='<p class="fp46-review-empty">Aktuell sind keine Wiederholungen fällig. Mit „Alle gelernten Themen“ kannst du freiwillig weiterüben.</p>';
  else html+=all.slice(0,8).map(x=>'<article class="fp46-review-card fp77-item"><div><small>'+esc(x.skill)+' · '+esc(x.branch)+'</small>'+
   '<h3>'+esc(x.title)+'</h3><p>'+esc(x.knowledge.label)+(x.due?' · Jetzt wiederholen':' · Ab '+esc(dueLabel(x.dueAt)))+'</p></div>'+
   '<button class="btn secondary" type="button" data-fp77-start="'+esc(x.id)+'">Wissen prüfen</button></article>').join('');
 }
 return html+'</section>';
}
function start(id){
 const item=catalog().find(x=>x.id===id);
 if(!item)return false;
 const variant=selectVariant(item);if(!variant)return false;
 active={item,variant,selected:null,confidence:null,hint:false,input:'',draft:'',stage:'ask',correct:false};
 return true;
}
function objective(){
 if(!active||active.stage!=='ask'||active.confidence===null||active.variant.type==='reflection')return false;
 const v=active.variant,hasChoice=v.type==='mcq'&&Number.isInteger(active.selected);
 const n=Number(String(active.input||'').replace(/\s/g,'').replace(',','.'));
 const validNumeric=v.type==='numeric'&&String(active.input||'').trim()!==''&&Number.isFinite(n)&&/^[+-]?(?:\d+([.,]\d*)?|[.,]\d+)$/.test(String(active.input).trim());
 if(!hasChoice&&!validNumeric)return false;
 const correct=v.type==='mcq'?active.selected===v.correct:Math.abs(n-v.answer)<=Number(v.tolerance||.001);
 const q=correct?(active.hint?2:active.confidence===3?4:active.confidence===2?3:2):0;
 const errorType=correct?'':v.type==='numeric'?'arithmetic':v.diagnosis?.[active.selected]?'conceptual':'conceptual';
 record(active.item.id,{mode:v.type,variant:v.id,ok:correct,confidence:active.confidence,hint:active.hint,quality:q,errorType});
 active.correct=correct;active.stage='feedback';
 return true;
}
function reflect(rating){
 if(!active||active.stage!=='reflection'||![0,1,2].includes(rating))return false;
 record(active.item.id,{mode:'reflection',variant:active.variant.id,ok:rating===2,
  quality:rating===2&&!active.hint?2:rating===1?1:0,
  confidence:active.confidence,hint:active.hint});
 active.correct=rating===2;active.stage='feedback';
 return true;
}
function bind(root=document){
 const redraw=()=>window.render?.();
 root.querySelectorAll('[data-fp77-filter]').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.fp77Filter;active=null;redraw()}));
 root.querySelectorAll('[data-fp77-start]').forEach(b=>b.addEventListener('click',()=>{start(b.dataset.fp77Start);redraw()}));
 root.querySelectorAll('[data-fp77-choice]').forEach(b=>b.addEventListener('click',()=>{
  if(!active||active.stage!=='ask')return;
  active.selected=Number(b.dataset.fp77Choice);redraw();
 }));
 root.querySelectorAll('[data-fp77-confidence]').forEach(b=>b.addEventListener('click',()=>{
  if(!active||active.stage!=='ask')return;
  const input=root.querySelector('[data-fp77-number]'),draft=root.querySelector('[data-fp77-draft]');
  if(input)active.input=input.value;if(draft)active.draft=draft.value;
  active.confidence=Number(b.dataset.fp77Confidence);redraw();
 }));
 root.querySelector('[data-fp77-hint]')?.addEventListener('click',()=>{
  if(!active||active.stage!=='ask')return;
  const input=root.querySelector('[data-fp77-number]'),draft=root.querySelector('[data-fp77-draft]');
  if(input)active.input=input.value;if(draft)active.draft=draft.value;
  active.hint=true;redraw();
 });
 root.querySelector('[data-fp77-check]')?.addEventListener('click',()=>{
  if(!active||active.stage!=='ask'||active.confidence===null)return;
  const input=root.querySelector('[data-fp77-number]'),draft=root.querySelector('[data-fp77-draft]');
  if(input)active.input=input.value;if(draft)active.draft=draft.value;
  if(active.variant.type==='reflection'){active.stage='reflection';redraw();return}
  if(!objective()){const msg=root.querySelector('.fp77-session .fp77-question');if(msg)msg.setAttribute('aria-label','Bitte zuerst eine gültige Antwort eingeben oder auswählen.');return}
  redraw();
 });
 root.querySelectorAll('[data-fp77-self]').forEach(b=>b.addEventListener('click',()=>{reflect(Number(b.dataset.fp77Self));redraw()}));
 root.querySelector('[data-fp77-next]')?.addEventListener('click',()=>{
  const candidates=queue().filter(x=>x.due&&x.id!==active?.item?.id);
  if(candidates.length)start(candidates[0].id);else active=null;
  redraw();
 });
 root.querySelectorAll('[data-fp77-exit]').forEach(b=>b.addEventListener('click',()=>{active=null;redraw()}));
}
async function load(){
 try{
  const r=await fetch('./data/adaptive-variants-v77.json?v=77',{cache:'no-store'});
  if(r.ok){const x=await r.json();if(x.schema_version===1&&Array.isArray(x.variants))variantBank=x.variants}
 }catch(e){console.info('Adaptive extra practice variants unavailable; existing lesson questions remain usable.')}
}
hydrate();
window.FinanzPilotAdaptive={renderReview,bind,dueCount,queue,knowledge,stats,variants,selectVariant,start,objective,reflect,observeLesson,record,hydrate,load,
 get state(){return state},get active(){return active},get variantBank(){return variantBank}};
window.addEventListener('fp-cloud-progress-imported',e=>{if(e?.detail?.keys?.includes(KEY))hydrate()});
window.addEventListener('fp-auth-change',hydrate);
window.addEventListener('fp-account-reset-applied',()=>{state={schema_version:1,attempts:{}};active=null});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load();
})();