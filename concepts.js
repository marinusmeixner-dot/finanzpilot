/* FinanzPilot Trainingslabor v12: lernorientierte, datierte Fälle mit prüfbaren Antworten und gezielten Wiederholungen. */
'use strict';
window.FinanzPilotConcepts=(()=>{
 const STORAGE='finanzpilot_concepts_v1';
 const FULL={GuV:'Gewinn- und Verlustrechnung',EBIT:'Ergebnis vor Zinsen und Steuern (Earnings Before Interest and Taxes)',EBITDA:'Ergebnis vor Zinsen, Steuern und Abschreibungen',FCF:'Free Cashflow (freier Cashflow)',ROIC:'Return on Invested Capital (Rendite auf das investierte Kapital)',WACC:'Weighted Average Cost of Capital (gewichtete durchschnittliche Kapitalkosten)',EV:'Enterprise Value (Gesamtunternehmenswert)',KGV:'Kurs-Gewinn-Verhältnis',NOPAT:'Net Operating Profit After Taxes (operativer Gewinn nach Steuern)',DCF:'Discounted Cashflow (Barwert zukünftiger Zahlungsüberschüsse)',CFO:'Cash Flow from Operations (Cashflow aus laufender Geschäftstätigkeit)',CapEx:'Capital Expenditures (Sachinvestitionen)'};
 const abbreviations=text=>[...new Set((String(text||'').match(/\b(?:EBITDA|EBIT|FCF|ROIC|WACC|GuV|NOPAT|DCF|CFO|KGV|EV|CapEx)\b/g)||[]))].map(x=>'<li><b>'+x+'</b> = '+esc(FULL[x])+'</li>').join('');
 // Spell out the first occurrence of an abbreviation in visible lesson content.
 const explain=text=>{const seen=new Set();return esc(text).replace(/\b(?:EBITDA|EBIT|FCF|ROIC|WACC|GuV|NOPAT|DCF|CFO|KGV|EV|CapEx)\b/g,(abbr,pos,source)=>{if(seen.has(abbr))return abbr;seen.add(abbr);return /^\s*\(/.test(source.slice(pos+abbr.length))?abbr:abbr+' ('+esc(FULL[abbr])+')'})};
 const DATA_URL='./data/terminology.json';
 let content={modules:[]},dataReady=false,loadError='';
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const read=()=>{try{const v=JSON.parse(localStorage.getItem(STORAGE)||'{}');return v&&typeof v==='object'?v:{}}catch{return {}}};
 let data={sessions:{},reviews:{},active:null,...read()};
 const persist=(notify=true)=>{try{localStorage.setItem(STORAGE,JSON.stringify(data));if(notify)window.dispatchEvent(new Event('fp-progress-change'))}catch{}};
 const importCloud=event=>{
  if(!event.detail?.keys?.includes(STORAGE))return;
  const fromCloud=read();if(!fromCloud.sessions||!fromCloud.reviews)return;
  const local=data,active=local.active;
  const sessions={...fromCloud.sessions};
  for(const id of new Set([...Object.keys(local.sessions||{}),...Object.keys(fromCloud.sessions||{})])){
    const x=local.sessions?.[id]||{},y=fromCloud.sessions?.[id]||{};
    const newer=(Number(x.updatedAt)||0)>=(Number(y.updatedAt)||0)?x:y;
    sessions[id]={...y,...x,...newer,step:Math.max(0,Number(x.step)||0,Number(y.step)||0),
      bestScore:Math.max(0,Number(x.bestScore)||0,Number(y.bestScore)||0),
      answers:{...(y.answers||{}),...(x.answers||{})},drafts:{...(y.drafts||{}),...(x.drafts||{})},
      updatedAt:Math.max(Number(x.updatedAt)||0,Number(y.updatedAt)||0)};
  }
  // A remote background sync must never move an open lesson, dismiss its result
  // or steal focus. Only the learner's own buttons change the active page.
  data={...fromCloud,...local,sessions,reviews:{...fromCloud.reviews,...local.reviews},active};
  if(!active&&typeof state!=='undefined'&&state.view==='concepts')window.render?.();
 };
 window.addEventListener('fp-cloud-progress-imported',importCloud);
 const berlin=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const afterDays=(n)=>{const [y,m,d]=berlin().split('-').map(Number),x=new Date(Date.UTC(y,m-1,d+n));return x.toISOString().slice(0,10)};
 const module=id=>content.modules.find(m=>m.id===id);
 const session=id=>{if(!data.sessions[id])data.sessions[id]={step:0,answers:{},drafts:{},bestScore:0,updatedAt:Date.now()};return data.sessions[id]};
 const scoredSteps=m=>m.steps.filter(s=>s.type!=='read');
 const human=n=>Number(n).toLocaleString('de-DE',{minimumFractionDigits:0,maximumFractionDigits:1});
 const keysOf=a=>Array.isArray(a)?a.map(Number).sort((x,y)=>x-y):[];
 function calcInput(raw){
  const str=String(raw||'').trim();
  if(!str||str.length>85)return NaN;
  try{if(window.FinanzPilotMath?.calculate){const result=window.FinanzPilotMath.calculate(str);return Number.isFinite(result)?result:NaN}}catch{}
  if(!/^[+\-]?\d+(?:[.,]\d+)?$/.test(str))return NaN;
  return Number(str.replace(',','.'));
 }
 function grade(step,value){
  if(step.type==='read')return {correct:true,message:'Konzept gelesen'};
  if(step.type==='number'){
   const val=calcInput(value);
   if(!Number.isFinite(val))return {valid:false,message:'Bitte eine gültige Zahl oder Rechnung eingeben. Minus, Dezimalkomma und Klammern sind erlaubt.'};
   return {valid:true,correct:Math.abs(val-step.answer)<=(step.tolerance??.1),value:val};
  }
  if(step.type==='multi'){const x=keysOf(value),c=keysOf(step.correct);return {valid:true,correct:JSON.stringify(x)===JSON.stringify(c)}}
  if(step.type==='sequence'){const x=Array.isArray(value)?value.map(Number):[],c=step.correct||[];return {valid:x.length===step.options.length,correct:JSON.stringify(x)===JSON.stringify(c)}}
  if(step.type==='decision'){const v=Number(value);return {valid:Number.isInteger(v)&&v>=0&&v<step.options.length,correct:v===step.correct}}
  return {valid:false,message:'Unbekannter Aufgabentyp'};
 }
 function schedule(id,index,correct,reviewing=false){
  const key=id+':'+index,prev=data.reviews[key]||{interval:0,attempts:0};
  const interval=correct?(reviewing?Math.min(30,Math.max(3,(prev.interval||1)*2)):3):1;
  data.reviews[key]={due:afterDays(interval),interval,attempts:(prev.attempts||0)+1,lastCorrect:correct,updatedAt:Date.now()};
 }
 function stats(id){
  const m=module(id),s=session(id),total=scoredSteps(m).length,correct=Object.values(s.answers).filter(x=>x.correct&&x.type!=='read').length;
  return {completed:s.step>=m.steps.length,total,correct,best:Math.max(s.bestScore||0,correct),mastered:(s.bestScore||0)>=total};
 }
 function chart(v){
  if(!v||!Array.isArray(v.values))return '';
  const nums=v.values.map(Number),signed=nums.some(n=>n<0);
  const mx=Math.max(1,...nums.map(n=>Math.abs(n)));
  return '<div class="fp-training-chart"><small>Zahlen des Lehrmodells · '+esc(v.unit||'')+(signed?' · Nullachse mittig; negative Werte links':'')+'</small>'+
   nums.map((n,i)=>{const width=Math.max(1,Math.abs(n)/mx*(signed?48:100));
    return '<div class="fp-training-bar"><span>'+esc(v.labels[i]||'')+'</span><div class="'+(signed?'fp-training-signed':'')+'"><i class="'+(n<0?'fp-training-negative':'')+'" style="'+(signed?'left:'+(n<0?50-width:50)+'%;':'')+'width:'+width+'%"></i></div><b>'+human(n)+'</b></div>'}).join('')+'</div>';
 }
 function list(){
  const due=Object.entries(data.reviews).filter(([,r])=>r.due<=berlin()).length;
  return '<div class="fp-training"><div class="eyebrow">FACHBEGRIFFS-AKADEMIE · LERNSTUFEN</div><h1>Zusammenhänge wirklich verstehen.</h1><p class="fp-training-lead">Zehn aufeinander aufbauende Stufen mit derselben fiktiven Firma. Falsche Prüfungen müssen jetzt erneut richtig gelöst werden. Nach passenden Stufen warten in der Transferwerkstatt umfangreichere Firmenfälle.</p>'+
  '<div class="fp-training-summary"><span><b>'+content.modules.filter(m=>stats(m.id).mastered).length+' / '+content.modules.length+'</b> Stufen gemeistert</span><span><b>'+due+'</b> Wiederholungen fällig</span></div>'+
  (due?'<section class="fp-training-reviews"><h2>Wiederholen, bevor du es vergisst</h2><div>'+Object.entries(data.reviews).filter(([,r])=>r.due<=berlin()).map(([key])=>{const [id,index]=key.split(':');const m=module(id);return m?'<button data-training-review="'+esc(key)+'"><b>'+esc(m.title)+'</b><small>'+esc(m.steps[Number(index)]?.title||'')+' →</small></button>':''}).join('')+'</div></section>':'')+
  '<h2 class="fp-training-list-heading">Deine Lernstufen</h2><div class="fp-training-list">'+content.modules.map(m=>{
   const st=stats(m.id),s=session(m.id);
   return '<button type="button" class="fp-training-entry '+(m.prerequisite&&!stats(m.prerequisite).mastered?'fp-concept-locked':'')+'" data-training-open="'+esc(m.id)+'" '+(m.prerequisite&&!stats(m.prerequisite).mastered?'disabled':'')+'><div class="fp-training-icon">▤</div><div class="fp-training-entry-body"><strong>'+esc(m.title)+'</strong><small>'+esc(m.short)+'</small><div class="fp-training-entry-meta"><span>'+esc(m.difficulty)+'</span><span>'+m.minutes+' Minuten</span><span>'+Math.min(s.step,m.steps.length)+' / '+m.steps.length+' Schritte</span></div></div><span class="fp-training-entry-go">'+(st.completed?(st.mastered?'✓':'↻'):'›')+'</span></button>';
  }).join('')+'</div><p class="fp-training-fine">Deine Antworten bleiben lokal und werden nach erfolgreicher Anmeldung zusätzlich synchronisiert. Alle Zahlen haben einen Berichtszeitpunkt.</p></div>';
 }
 function chooseUI(step,draft){
  if(step.type==='number')return '<form id="fp-training-number-form" class="fp-training-number-form"><label for="fp-training-number-input">Dein Ergebnis ('+esc(step.unit||'')+')</label><input id="fp-training-number-input" name="value" type="text" inputmode="text" autocomplete="off" spellcheck="false" placeholder="z. B. -4,9 oder (845/930-1)*100" value="'+esc(draft??'')+'" />'+(window.FinanzPilotMath?.toolbar()||'')+(step.reasoningRequired?'<label for="fp-training-reason">'+esc(step.reasoningQuestion||'Begründe deinen Rechenweg.')+'</label><textarea id="fp-training-reason" rows="3" minlength="45" maxlength="1200" required placeholder="Was bedeutet das Ergebnis wirtschaftlich?">'+esc(data.active?.mode==='review'?data.active.reasoning||'':session(data.active.id).drafts[(data.active.mode==='review'?data.active.step:session(data.active.id).step)+':reasoning']||'')+'</textarea>':'')+'<button class="btn" type="submit">Ergebnis und Erklärung prüfen</button></form>';
  if(step.type==='multi'||step.type==='decision'){
   const values=Array.isArray(draft)?draft:[];
   return '<div class="fp-training-options">'+step.options.map((o,i)=>'<button type="button" class="fp-training-option '+(values.includes(i)?'selected':'')+'" data-training-option="'+i+'" aria-pressed="'+values.includes(i)+'"><span>'+((step.type==='multi')?(values.includes(i)?'☑':'□'):(values.includes(i)?'◉':'◯'))+'</span><span>'+esc(o)+'</span></button>').join('')+'</div><button type="button" class="btn" data-training-submit>Antwort prüfen</button>';
  }
  if(step.type==='sequence'){
   const order=Array.isArray(draft)&&draft.length===step.options.length?draft:step.options.map((_,i)=>i);
   return '<div class="fp-training-sort">'+order.map((id,i)=>'<div class="fp-training-sort-row"><b>'+(i+1)+'.</b><span>'+esc(step.options[id])+'</span><div><button aria-label="Einen Schritt nach oben" data-training-move="'+i+':-1" '+(!i?'disabled':'')+'>↑</button><button aria-label="Einen Schritt nach unten" data-training-move="'+i+':1" '+(i===order.length-1?'disabled':'')+'>↓</button></div></div>').join('')+'</div><button type="button" class="btn" data-training-submit>Reihenfolge prüfen</button>';
  }
  return '';
 }
 function questionView(){
  const active=data.active||{},m=module(active.id);if(!m)return list();
  const current=active.mode==='review'?active.step:session(m.id).step;
   const idx=active.mode==='course'&&Number.isInteger(active.previewStep)?Math.min(current,active.previewStep):current;
   if(active.mode==='course'&&idx<current){const past=m.steps[idx];return '<div class="fp-training-work fp37-preview"><div class="eyebrow">RÜCKBLICK · SEITE '+(idx+1)+' VON '+m.steps.length+'</div><h1>'+esc(m.title)+'</h1><div class="fp37-preview-box"><h2>'+esc(past.title)+'</h2><p>'+esc(past.text||past.prompt||'')+'</p>'+(past.insight?'<p><strong>Wichtig:</strong> '+esc(past.insight)+'</p>':'')+(past.method?'<p><strong>Lösungsweg:</strong> '+esc(past.method)+'</p>':'')+'</div><div class="fp37-step-actions">'+(idx>0?'<button type="button" class="btn secondary" data-training-step-back>← Vorherige Seite</button>':'')+'<button type="button" class="btn" data-training-step-next>Weiter →</button><button type="button" class="btn secondary" data-training-step-current>Zur aktuellen Aufgabe</button></div><small>Rückblick ist schreibgeschützt: Deine beantworteten Aufgaben und dein Fortschritt bleiben unverändert.</small></div>'}

  if(idx>=m.steps.length)return finished(m);
  const step=m.steps[idx],s=session(m.id),key=m.id+':'+idx;
  const answer=active.mode==='review'?active.reviewAnswer:s.answers[idx];
  const draft=(active.mode==='review'?active.draft:s.drafts[idx])??(step.type==='sequence'?step.options.map((_,i)=>i):step.type==='multi'||step.type==='decision'?[]:'');
  const solved=Boolean(answer),head=active.mode==='review'?'GEZIELTE WIEDERHOLUNG':'SCHRITT '+(idx+1)+' VON '+m.steps.length;
  return '<div class="fp-training-work"><button type="button" class="fp-training-back" data-training-list>← Zur Akademie</button><div class="fp-training-top"><div><div class="eyebrow">'+head+'</div><h1>'+explain(m.title)+'</h1><p>'+esc(m.domain)+' · '+esc(m.difficulty)+'</p></div><div class="fp-training-percent">'+Math.round(100*idx/m.steps.length)+' %</div></div><div class="fp-training-progress"><i style="width:'+(100*idx/m.steps.length)+'%"></i></div>'+
   (active.mode==='course'&&idx>0?'<div class="fp37-step-actions"><button type="button" class="btn secondary" data-training-step-back>← Vorherige Erklärung</button><small>Ohne Verlust deiner Antwort zurückblättern</small></div>':'')+'<section class="fp-training-case"><div class="fp-training-case-intro"><small>'+esc(step.type==='read'?'VERSTEHEN':step.type==='number'?'SELBST RECHNEN':step.type==='multi'?'MEHRERE AUSSAGEN PRÜFEN':step.type==='sequence'?'ANALYSEPROZESS ORDNEN':'ENTSCHEIDEN')+'</small><h2>'+explain(step.title)+'</h2><p>'+explain(step.text||step.prompt||'')+'</p>'+(abbreviations(m.title+' '+step.title+' '+(step.text||step.prompt||'')+' '+(step.insight||''))?'<details class="fp-training-definitions" open><summary>Abkürzungen ausgeschrieben</summary><ul>'+abbreviations(m.title+' '+step.title+' '+(step.text||step.prompt||'')+' '+(step.insight||''))+'</ul></details>':'')+'</div>'+chart(step.visual)+
   (step.type==='read'?'<div class="fp-training-insight"><b>Das solltest du mitnehmen</b><p>'+esc(step.insight||'')+'</p></div><button type="button" class="btn" data-training-continue>Verstanden · Weiter →</button>':
    solved?'<div class="fp-training-result '+(answer.correct?'correct':'incorrect')+'"><div class="fp-training-result-title">'+(answer.correct?'✓ Richtig eingeordnet':'↻ Noch nicht ganz – hier ist die Analyse')+'</div><p>'+esc(step.method||'')+'</p><button class="btn" type="button" '+(answer.correct?'data-training-continue':'data-training-retry')+'>'+(answer.correct?(active.mode==='review'?'Wiederholung abschließen':'Nächster Schritt →'):'Jetzt noch einmal selbst lösen →')+'</button>'+(answer.correct?'':'<button class="btn secondary" type="button" data-training-continue>'+(active.mode==='review'?'Wiederholung beenden':'Trotzdem weiter · später wiederholen')+'</button>')+'</div>':
    '<div class="fp-training-task"><div class="fp-training-task-title"><b>Deine Aufgabe</b><button type="button" data-training-hint aria-expanded="false">Hinweis anzeigen</button></div><p class="fp-training-hint" id="fp-training-hint" hidden>'+esc(step.hint||'Denke an Fakten, Prognosen und Gegenargumente.')+'</p>'+chooseUI(step,draft)+'<p class="fp-training-validation" id="fp-training-validation" role="alert"></p></div>')+
   '</section><footer class="fp-training-source"><span>Lehrmodell: '+esc(m.source.label)+'</span><a href="'+esc(m.source.url)+'" target="_blank" rel="noopener noreferrer">Fachlexikon öffnen ↗</a><span>Fiktive Zahlen, keine aktuellen Börsendaten oder Anlageempfehlung.</span></footer></div>';
 }
 function finished(m){
  const s=session(m.id),stat=stats(m.id),points=scoredSteps(m).length;
  return '<div class="fp-training-complete"><div class="fp-training-trophy">✧</div><div class="eyebrow">LERNSTUFE ABGESCHLOSSEN</div><h1>'+explain(m.title)+'</h1><div class="fp-training-score">'+stat.best+' / '+points+'</div><h2>'+(stat.mastered?'Lernstufe gemeistert':'Deine Analyse ist dokumentiert')+'</h2><p>'+ (stat.mastered?'Du hast die Fragen abgeschlossen. Die nächste Lernstufe baut auf deinem Verständnis auf; geplante Wiederholungen festigen es.':'Wiederhole die schwierigeren Fragen gezielt. Du kannst jederzeit zurück zur Übersicht.')+'</p><div class="fp-training-complete-actions"><button class="btn" data-training-list>Zur Akademie-Übersicht</button><button class="btn secondary" data-training-repeat="'+esc(m.id)+'">Stufe wiederholen</button><button class="btn secondary" data-training-skill>Skillbaum ansehen →</button>'+''+'</div><p class="fp-training-proof-note">Diese Lernstufen werden unabhängig von den Firmen-Praxisreihen gespeichert. Hier gibt es keine handelbaren Gegenstände oder virtuellen Guthaben.</p></div>';
 }
 function render(){
  if(!dataReady)return '<div class="fp-training"><h1>Trainingslabor</h1><p>'+esc(loadError||'Lernfälle werden geladen …')+'</p></div>';
  const active=data.active;
  return active?.mode==='review'?questionView():active?.mode==='course'&&module(active.id)?questionView():list();
 }
 function updateDraft(value){
  const act=data.active;if(!act)return;const s=session(act.id),idx=act.mode==='review'?act.step:s.step;
  if(act.mode==='review')act.draft=value;else s.drafts[idx]=value;
  persist(false);
 }
 function getDraft(){
  const a=data.active,s=session(a.id),idx=a.mode==='review'?a.step:s.step,step=module(a.id)?.steps[idx];
  return (a.mode==='review'?a.draft:s.drafts[idx])??(step?.type==='sequence'?step.options.map((_,i)=>i):step?.type==='multi'||step?.type==='decision'?[]:'');
 }
 function submit(){
  const a=data.active;if(!a)return;
  const m=module(a.id),s=session(a.id),idx=a.mode==='review'?a.step:s.step,step=m.steps[idx];
  const input=step.type==='number'?document.getElementById('fp-training-number-input')?.value:getDraft();
  if(step.reasoningRequired){const reason=document.getElementById('fp-training-reason')?.value.trim()||'';if(reason.length<45){document.getElementById('fp-training-validation').textContent='Begründe die Rechnung bitte in einem vollständigen Satz (mindestens 45 Zeichen).';return}if(a.mode==='review')a.reasoning=reason;else s.drafts[idx+':reasoning']=reason}
  if(step.type==='number')updateDraft(input);
  const check=grade(step,input);
  if(!check.valid){document.getElementById('fp-training-validation').textContent=check.message||'Bitte zuerst eine Antwort auswählen.';return}
  if(['multi','decision'].includes(step.type)&&(!Array.isArray(input)||input.length!==(step.type==='decision'?1:step.correct.length))){
    document.getElementById('fp-training-validation').textContent='Bitte '+(step.type==='decision'?'genau eine':'genau '+step.correct.length)+' Antwort'+(step.type==='decision'?'':'en')+' auswählen.';return;
  }
  const answer={type:step.type,correct:Boolean(check.correct),checkedAt:Date.now(),value:input};
  if(a.mode==='review'){a.reviewAnswer=answer;schedule(a.id,idx,answer.correct,true)}
  else{s.answers[idx]=answer;schedule(a.id,idx,answer.correct,false)}
  s.updatedAt=Date.now();persist();window.render?.();
 }
 function advance(){
  const a=data.active;if(a?.mode==='course'&&Number.isInteger(a.previewStep)){delete a.previewStep;window.render?.();return}if(!a)return;
  if(a.mode==='review'){data.active=null;persist();window.render?.();return}
  const m=module(a.id),s=session(a.id);if(!m)return;
  if(s.step>=m.steps.length){data.active=null;persist(false);window.render?.();queueMicrotask(()=>window.dispatchEvent(new Event('fp-progress-change')));return}
  s.step=Math.min(m.steps.length,s.step+1);
  if(s.step>=m.steps.length){
   const score=Object.values(s.answers).filter(x=>x.type!=='read'&&x.correct).length;
   s.bestScore=Math.max(s.bestScore||0,score);
   s.completedAt=Date.now();
  }
  s.updatedAt=Date.now();persist();window.render?.();
 }
 function open(id){
  const m=module(id);if(!m||(m.prerequisite&&!stats(m.prerequisite).mastered))return;
  session(id);data.active={id,mode:'course'};persist();window.render?.();window.scrollTo({top:0,behavior:'instant'});
 }
 function repeat(id){
  const s=session(id);s.step=0;s.answers={};s.drafts={};s.updatedAt=Date.now();data.active={id,mode:'course'};
  persist();window.render?.();window.scrollTo({top:0,behavior:'instant'});
 }
 function openReview(key){
  const idx=key.lastIndexOf(':'),id=key.slice(0,idx),step=Number(key.slice(idx+1));
  if(!module(id)||!Number.isInteger(step)||!module(id).steps[step])return;
  data.active={id,step,mode:'review',draft:null};persist();window.render?.();window.scrollTo({top:0,behavior:'instant'});
 }
 function bind(root=document){
  root.querySelectorAll('[data-training-open]').forEach(x=>x.addEventListener('click',()=>open(x.dataset.trainingOpen)));
  root.querySelectorAll('[data-training-repeat]').forEach(x=>x.addEventListener('click',()=>repeat(x.dataset.trainingRepeat)));
  root.querySelectorAll('[data-training-list]').forEach(x=>x.addEventListener('click',()=>{
   data.active=null;persist(false);window.render?.();window.scrollTo({top:0,behavior:'instant'});
   // Notify background synchronization only after the overview has been rendered.
   queueMicrotask(()=>window.dispatchEvent(new Event('fp-progress-change')));
  }));
  root.querySelectorAll('[data-training-review]').forEach(x=>x.addEventListener('click',()=>openReview(x.dataset.trainingReview)));
  root.querySelector('[data-training-skill]')?.addEventListener('click',()=>window.FinanzPilotNavigation?.route('skills'));
  root.querySelector('[data-training-verify]')?.addEventListener('click',async ev=>{
    const btn=ev.currentTarget,id=btn.dataset.trainingVerify;
    if(!window.FinanzPilotCloud?.user){window.FinanzPilotCloud?.openLogin?.();return}
    btn.disabled=true;btn.textContent='Prüfe Antworten auf dem Server …';
    try{
      const feedback=await window.FinanzPilotEconomy?.certifySaved(id);
      if(!feedback){btn.textContent='Prüfung gerade nicht verfügbar';return}
      if(feedback.errors){btn.textContent='Prüfung nicht vollständig. Bitte erneut versuchen.';return}
      if(feedback.verifiedCount===4)window.FinanzPilotNavigation?.route('inventory');
      else btn.textContent=feedback.verifiedCount+'/4 Antworten bestätigt – fehlende Aufgaben wiederholen';
    }catch(e){btn.textContent='Prüfung fehlgeschlagen – erneut versuchen'}
  });
  root.querySelectorAll('[data-training-option]').forEach(x=>x.addEventListener('click',()=>{
   const idx=Number(x.dataset.trainingOption),act=data.active,step=module(act.id).steps[act.mode==='review'?act.step:session(act.id).step];
   let draft=getDraft();if(!Array.isArray(draft))draft=[];
   draft=step.type==='decision'?[idx]:draft.includes(idx)?draft.filter(n=>n!==idx):[...draft,idx];
   updateDraft(draft);
   // Nur die Auswahl markieren, nicht die gesamte Lernseite und ihre Scrollposition neu aufbauen.
   root.querySelectorAll('[data-training-option]').forEach(btn=>{
    const on=draft.includes(Number(btn.dataset.trainingOption));
    btn.classList.toggle('selected',on);btn.setAttribute('aria-pressed',String(on));
    const mark=btn.querySelector('span');if(mark)mark.textContent=step.type==='multi'?(on?'☑':'□'):(on?'◉':'◯');
   });
  }));
  root.querySelectorAll('[data-training-move]').forEach(x=>x.addEventListener('click',()=>{
   const [index,delta]=x.dataset.trainingMove.split(':').map(Number),order=[...getDraft()],end=index+delta;
   if(end<0||end>=order.length)return;
   [order[index],order[end]]=[order[end],order[index]];
   updateDraft(order);const scrollY=window.scrollY;window.render?.();requestAnimationFrame(()=>window.scrollTo({top:scrollY,behavior:'instant'}));
  }));
  root.querySelector('#fp-training-number-input')?.addEventListener('input',ev=>updateDraft(ev.target.value));
  root.querySelector('#fp-training-reason')?.addEventListener('input',ev=>{const a=data.active;if(!a)return;const idx=a.mode==='review'?a.step:session(a.id).step;if(a.mode==='review')a.reasoning=ev.target.value;else session(a.id).drafts[idx+':reasoning']=ev.target.value;persist(false)});
  root.querySelector('#fp-training-number-form')?.addEventListener('submit',ev=>{ev.preventDefault();submit()});
  root.querySelectorAll('[data-training-submit]').forEach(x=>x.addEventListener('click',submit));
  root.querySelectorAll('[data-training-step-back]').forEach(b=>b.addEventListener('click',()=>{const a=data.active;if(a?.mode!=='course')return;const position=Number.isInteger(a.previewStep)?a.previewStep:session(a.id).step;a.previewStep=Math.max(0,position-1);window.render?.();window.scrollTo?.({top:0,behavior:'instant'})}));
  root.querySelectorAll('[data-training-step-next]').forEach(b=>b.addEventListener('click',()=>{const a=data.active;if(a?.mode!=='course')return;const current=session(a.id).step;a.previewStep=Math.min(current,(Number(a.previewStep)||0)+1);if(a.previewStep>=current)delete a.previewStep;window.render?.();window.scrollTo?.({top:0,behavior:'instant'})}));
  root.querySelectorAll('[data-training-step-current]').forEach(b=>b.addEventListener('click',()=>{if(data.active)delete data.active.previewStep;window.render?.();window.scrollTo?.({top:0,behavior:'instant'})}));
  root.querySelectorAll('[data-training-continue]').forEach(x=>x.addEventListener('click',advance));
  root.querySelectorAll('[data-training-retry]').forEach(x=>x.addEventListener('click',()=>{const a=data.active;if(!a)return;const idx=a.mode==='review'?a.step:session(a.id).step;if(a.mode==='review'){delete a.reviewAnswer;a.draft=null}else{delete session(a.id).answers[idx];delete session(a.id).drafts[idx]}persist();window.render?.()}));
  root.querySelector('[data-training-hint]')?.addEventListener('click',ev=>{const el=document.getElementById('fp-training-hint');if(el){el.hidden=!el.hidden;ev.target.setAttribute('aria-expanded',String(!el.hidden))}});
  window.FinanzPilotMath?.bind(root);
 }
 async function load(){
  try{const r=await fetch(DATA_URL+'?t='+Date.now(),{cache:'no-store'});if(!r.ok)throw Error('Lernfälle '+r.status);const d=await r.json();
   if(d.schema_version!==1||!Array.isArray(d.modules))throw Error('Ungültiges Kursformat');
   content=d;dataReady=true;loadError='';
  }catch(e){loadError='Daten nicht erreichbar. Bitte Verbindung prüfen und Seite neu laden.';dataReady=false}
  if(typeof state!=='undefined'&&state.view==='concepts')window.render?.();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load();
 return {render,bind,load,grade,stats,get data(){return data},get modules(){return content.modules},get achievements(){return Object.fromEntries(content.modules.map(m=>[m.id,stats(m.id).mastered]))}};
})();