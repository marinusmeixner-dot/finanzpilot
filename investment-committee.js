/* FinanzPilot v21 · Investmentkomitee: persönliche, prüfbare Investmentthesen. */
'use strict';
window.FinanzPilotInvestmentCommittee=(()=>{
 const KEY='finanzpilot_investment_committee_v1';
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;',"'":'&#39;'}[c]));
 const raw=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{return {}}};
 let data={cases:[],stages:[]},research={kion:null},saved={sessions:{},active:null,...raw()},ready=false,error='',draft=null;
 const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(saved));window.dispatchEvent(new Event('fp-progress-change'))}catch{}};
 const money=(v,c)=>new Intl.NumberFormat('de-DE',{style:'currency',currency:c,maximumFractionDigits:2}).format(v);
 const number=v=>new Intl.NumberFormat('de-DE',{maximumFractionDigits:2}).format(Number(v));
 const caseBy=id=>data.cases.find(c=>c.id===id);
 const session=id=>saved.sessions[id]||(saved.sessions[id]={step:0,answers:{},model:null,memo:null,completed:false,updatedAt:0});
 const touch=s=>{s.updatedAt=Date.now();persist()};
 const modelDefaults=()=>({bear:30,base:50,bull:20,wacc:10.5,g:2,pe:27});
 const config=c=>({...modelDefaults(),...(session(c.id).model||{})});
 const steps=c=>data.stages.length||8;
 const current=()=>caseBy(saved.active);
 function dcf(s,model,wacc=s.wacc,g=s.g){
  if(!(wacc>g)&&wacc!==0)return null;
  const discount=wacc/100,growth=g/100;
  if(!(discount>growth))return null;
  let rev=model.base_revenue_2026,flows=[];
  for(let i=0;i<s.revenue_growth.length;i++){
   rev*=1+s.revenue_growth[i]/100;
   const EBIT=rev*s.ebit_margins[i]/100;
   const FCFF=EBIT*(1-model.tax_rate/100)+s.depreciation[i]-s.capex[i]-s.working_capital_other[i];
   flows.push(FCFF);
  }
  const pv=flows.reduce((sum,v,i)=>sum+v/Math.pow(1+discount,i+1),0);
  const terminal=flows[flows.length-1]*(1+growth)/(discount-growth)/Math.pow(1+discount,flows.length);
  const ev=pv+terminal;
  return {value:(ev-model.capital_structure.net_debt_m)/model.capital_structure.shares_m,ev,terminalShare:ev?100*terminal/ev:0,flows};
 }
 function calculate(c,m=config(c)){
  const p=['bear','base','bull'].map(x=>Number(m[x]));
  if(p.some(x=>!Number.isFinite(x)||x<0||x>100)||Math.abs(p.reduce((a,b)=>a+b,0)-100)>.001)return{error:'Die Wahrscheinlichkeiten müssen zusammen genau 100 % ergeben.'};
  let targets=[],details=[];
  if(c.kind==='dcf'){
   const model=research.kion?.model;
   if(!model)return{error:'Das KION-Modell ist noch nicht geladen.'};
   const w=Number(m.wacc),g=Number(m.g);
   if(!Number.isFinite(w)||!Number.isFinite(g)||w<=g||w<7||w>15||g<0||g>4)return{error:'WACC muss zwischen 7 und 15 % liegen und größer als das Terminalwachstum (0–4 %) sein.'};
   for(const s of model.scenarios){
    const result=dcf(s,model,s.id==='base'?w:s.wacc,s.id==='base'?g:s.g);
    if(!result||!Number.isFinite(result.value))return{error:'Ungültige DCF-Annahmen.'};
    targets.push(result.value);
    details.push({name:s.name,id:s.id,reason:s.reason,terminalShare:result.terminalShare,wacc:s.id==='base'?w:s.wacc,g:s.id==='base'?g:s.g,flows:result.flows});
   }
  }else{
   const pE=Number(m.pe),eps=Number(c.model.eps);
   if(!Number.isFinite(pE)||pE<14||pE>45)return{error:'Das Basis-Multiple muss zwischen 14 und 45 liegen.'};
   const mult=[c.model.options[0].multiple,pE,c.model.options[2].multiple];
   targets=mult.map(v=>v*eps);
   details=c.model.options.map((s,i)=>({name:s.name,id:['bear','base','bull'][i],reason:s.why,multiple:mult[i]}));
  }
  const weighted=targets.reduce((v,t,i)=>v+t*p[i]/100,0);
  if(targets.some(v=>!Number.isFinite(v)))return{error:'Modellwerte sind nicht berechenbar.'};
  const quote=c.quote?.price;
  return{targets,details,weights:p,weighted,relative:quote?100*(weighted/quote-1):null,quote,method:c.kind,asof:c.quote?.date||null};
 }
 function chart(c,vals){
  const max=Math.max(...vals.map(x=>Math.abs(x)),1);
  return '<div class="fp-ic-bars" role="img" aria-label="Drei Szenarienwerte als Balkendiagramm">'+vals.map((v,i)=>'<div class="fp-ic-bar-row"><span>'+['Negativ','Basis','Positiv'][i]+'</span><div class="fp-ic-track"><i style="width:'+Math.max(3,Math.abs(v)/max*100)+'%"></i></div><b>'+money(v,c.currency)+'</b></div>').join('')+'</div>';
 }
 function breadcrumbs(){return '<button type="button" class="fp-ic-back" data-ic-back>← Investmentkomitee</button>'}
 function listing(){
  const n=data.cases.filter(c=>session(c.id).completed).length;
  return '<div class="fp-ic"><div class="fp-ic-hero"><div class="eyebrow">EIGENE INVESTMENTENTSCHEIDUNGEN</div><h1>Investmentkomitee</h1><p>Zwei vollständige Research-Fälle: Originalzahlen verstehen, selbst rechnen, Widersprüche erkennen, Szenarien modellieren und ein überprüfbares Investmenturteil formulieren.</p><div class="fp-ic-count"><strong>'+n+' / '+data.cases.length+'</strong> Investmentberichte abgeschlossen</div></div><div class="fp-ic-cases">'+
  data.cases.map(c=>{const s=session(c.id);return '<button class="fp-ic-case" data-ic-open="'+esc(c.id)+'"><span class="fp-ic-case-label">'+esc(c.level)+' · '+esc(c.symbol)+'</span><strong>'+esc(c.company)+'</strong><small>'+esc(c.summary)+'</small><span class="fp-ic-case-end"><span>'+Math.min(s.step,8)+'/8 Etappen · '+esc(c.duration)+'</span><b>'+(s.completed?'✓ Wiederholen':'Weiter →')+'</b></span></button>'}).join('')+'</div><p class="fp-ic-disclaimer">'+esc(data.user_notice)+'</p></div>';
 }
 function question(type,question,options,selected){
  return '<div class="fp-ic-options">'+options.map((a,i)=>'<button type="button" data-ic-choice="'+i+'" aria-pressed="'+(Array.isArray(selected)&&selected.includes(i))+'" class="'+(Array.isArray(selected)&&selected.includes(i)?'chosen':'')+'"><span>'+(type==='critical'?(Array.isArray(selected)&&selected.includes(i)?'☑':'□'):(Array.isArray(selected)&&selected.includes(i)?'◉':'○'))+'</span>'+esc(a)+'</button>').join('')+'</div>';
 }
 function evidence(c){
  return '<div class="fp-ic-evidence"><span>Primärquelle · '+esc(c.source.date)+'</span><a href="'+esc(c.source.url)+'" target="_blank" rel="noopener noreferrer">'+esc(c.source.title)+' ↗</a><p>'+esc(c.facts.units)+'</p></div>';
 }
 function modelPanel(c){
  const m=config(c),v=calculate(c,m);
  const preset='<div class="fp-ic-weights"><label>Negativ (%)<input type="text" inputmode="decimal" data-ic-weight="bear" value="'+esc(m.bear)+'"></label><label>Basis (%)<input type="text" inputmode="decimal" data-ic-weight="base" value="'+esc(m.base)+'"></label><label>Positiv (%)<input type="text" inputmode="decimal" data-ic-weight="bull" value="'+esc(m.bull)+'"></label></div>';
  const controls=c.kind==='dcf'?'<div class="fp-ic-weights"><label>Basis-WACC (%)<input type="text" inputmode="decimal" data-ic-driver="wacc" value="'+esc(m.wacc)+'"></label><label>Terminalwachstum (%)<input type="text" inputmode="decimal" data-ic-driver="g" value="'+esc(m.g)+'"></label></div>':
   '<div class="fp-ic-weights"><label>Basis-P/E auf bereinigtes FY2026-EPS<input type="text" inputmode="decimal" data-ic-driver="pe" value="'+esc(m.pe)+'"></label></div>';
  return '<p>Stelle deine Annahmen ein. Die Wahrscheinlichkeiten müssen zusammen 100 % ergeben. Die Ergebnisse sind <b>modellierte Werte, keine garantierten Kursziele</b>.</p>'+
    '<div class="fp-ic-model">'+preset+controls+'<div id="fp-ic-model-output">'+(v.error?'<p class="fp-ic-error">'+esc(v.error)+'</p>':modelResult(c,v))+'</div></div><button class="btn" type="button" data-ic-model-save>Mein Szenariomodell festhalten →</button><p class="fp-ic-hint">'+(c.kind==='dcf'?'KION: 5-Jahres-FCFF-DCF; das Basis-WACC und g kannst du ändern. Die übrigen zwei Szenarien stammen aus dem gespeicherten Research-Modell.':'Microsoft: Bereinigtes verwässertes EPS FY2026 (17,28 USD) × angenommene historische Multiples. Kein vollständiger DCF, kein Forward-Preis und kein aktueller Börsenkurs.')+'</p>';
 }
 function modelResult(c,v){
  return '<div class="fp-ic-model-result"><span>Wahrscheinlichkeitsgewichteter Modellwert je Aktie</span><strong>'+money(v.weighted,c.currency)+'</strong><small>'+ (v.relative!==null?'Gegenüber dem historischen '+esc(c.quote.date)+'-Kurs '+money(v.quote,c.currency)+': '+(v.relative>=0?'+':'')+number(v.relative)+' %':'Kein aktueller Marktkurs hinterlegt: kein verlässlicher Kursabstand berechenbar')+'</small></div>'+
   chart(c,v.targets)+'<div class="fp-ic-scenario-cards">'+v.details.map((d,i)=>'<div><b>'+esc(d.name)+'</b><strong>'+money(v.targets[i],c.currency)+'</strong><small>'+number(v.weights[i])+' % Gewichtung</small><p>'+esc(d.reason)+'</p></div>').join('')+'</div>'+
   '<p class="fp-ic-hint">'+(c.kind==='dcf'?'Endwert-Anteil im Basismodell: '+number(v.details[1].terminalShare)+' %. Leasing-Cashflows und Equity Bridge sind weiterhin zentrale Risikofaktoren.':'Jedes Multiple ist eine unbelegte Szenarioannahme, kein Markt-Konsens. Historisches bereinigtes EPS ist keine Prognose.')+'</p>';
 }
 function stage(){
  const c=current();if(!c)return listing();
  const s=session(c.id),i=Math.min(7,Math.max(0,s.step));
  const ev=evidence(c),f=c.facts;
  const nums=c.exercises;
  let t='',body='',heading=data.stages[i],tag=['QUELLENARBEIT','RECHNEN','RECHNEN','KRITIK','ANALYSEPROZESS','BEWERTUNG','SENSITIVITÄT','INVESTMENTURTEIL'][i];
  if(i===0){
   t='Prüfe zuerst das Unternehmen statt einen Kurs.';
   body='<p>'+esc(c.summary)+'</p><div class="fp-ic-facts">'+(c.kind==='dcf'?[
    ['Umsatz 9M 2026',number(f.revenue2026)+' Mio. €'],['bereinigtes EBIT 9M',number(f.adjEbit)+' Mio. €'],['9M-FCF (bes. Definition)',number(f.reportedFcf)+' Mio. €'],['Nettoschulden 30.09.',number(f.netDebt)+' Mio. €']]:
    [['Umsatz FY2026',number(f.revenue2026)+' Mio. $'],['Operatives Ergebnis',number(f.operatingIncome)+' Mio. $'],['Bereinigtes EPS',money(f.adjDilutedEPS,'USD')],['GAAP-EPS',money(f.gaapEPS,'USD')]]).map(x=>'<div><span>'+esc(x[0])+'</span><b>'+esc(x[1])+'</b></div>').join('')+'</div><p><b>Leitfrage:</b> '+esc(c.thesisQuestion)+'</p><button class="btn" data-ic-next>Originalzahlen verstanden →</button>';
  }else if(i===1||i===2){
   const q=nums[i-1];t=q.title;
   body='<p>'+esc(q.prompt)+'</p><div class="fp-ic-mini-chart">'+(c.kind==='dcf'?chartSimple(['Umsatz 9M25','Umsatz 9M26','Aufträge 9M25','Aufträge 9M26'],[f.revenue2025,f.revenue2026,f.order2025,f.order2026],'Mio. €'):chartSimple(['Umsatz FY25','Umsatz FY26','Operatives Ergebnis FY26'],[f.revenue2025,f.revenue2026,f.operatingIncome],'Mio. USD'))+'</div><form id="fp-ic-calc"><label>Dein Ergebnis (%)<input name="answer" type="text" inputmode="text" autocomplete="off" placeholder="z. B. -4,92 oder 17,79" value="'+esc(draft?.type==='calc'&&draft.step===i?draft.value:'')+'"></label><button class="btn" type="submit">Berechnung prüfen →</button></form><p class="fp-ic-hint">Tipp: '+esc(q.hint)+'</p>';
  }else if(i===3||i===4||i===6){
   const q=i===3?c.critical:i===4?c.decision:c.postModel;
   const type=i===3?'critical':'decision';
   t=i===3?'Kennzahlen richtig einordnen':i===4?'Nächsten Analyseschritt wählen':'Dein Modell auf Belastbarkeit prüfen';
   body='<p>'+esc(q.prompt)+'</p>'+question(type,q.prompt,q.options,draft?.type==='choice'&&draft.step===i?draft.value:[])+'<button class="btn" data-ic-validate>Meine Entscheidung prüfen →</button>';
  }else if(i===5){
   t='Entwickle deine eigenen Bewertungsannahmen';
   body=modelPanel(c);
  }else{
   t='Schreibe deine eigene Investmentthese';
   const memo=s.memo||{};
   const v=calculate(c,s.model||config(c));
   body='<p>Wähle eine Haltung und dokumentiere das stärkste Argument, ein Gegenargument und ein klares Signal, bei dem du deine These ändern würdest. Es gibt keine automatisch „richtige“ Kaufempfehlung.</p>'+
    (v.error?'':'<div class="fp-ic-model-result"><span>Dein gespeicherter Modellwert</span><strong>'+money(v.weighted,c.currency)+'</strong><small>'+(v.relative===null?'Ohne aktuellen Kurs nicht als Kaufchance interpretieren':number(v.relative)+' % zum datierten historischen Preis; nicht garantiert')+'</small></div>')+
    '<form id="fp-ic-thesis"><label>Deine Haltung<select name="stance">'+['Beobachten','Hypothetisch kaufen','Hypothetisch vermeiden'].map(x=>'<option '+(memo.stance===x?'selected':'')+'>'+x+'</option>').join('')+'</select></label>'+
    '<label>Investmentthese und zwei Belege<textarea name="thesis" rows="4" minlength="55" maxlength="1800" required placeholder="These: ... Beleg 1: ... Beleg 2: ...">'+esc(memo.thesis||'')+'</textarea></label>'+
    '<label>Stärkstes Gegenargument und konkretes Widerlegungskriterium<textarea name="risk" rows="4" minlength="45" maxlength="1800" required placeholder="Mein größtes Risiko ist ... Ich würde meine Meinung ändern, wenn ...">'+esc(memo.risk||'')+'</textarea></label>'+
    '<label>Zeithorizont<select name="horizon">'+['6–12 Monate','1–2 Jahre','3–5 Jahre'].map(x=>'<option '+(memo.horizon===x?'selected':'')+'>'+x+'</option>').join('')+'</select></label>'+
    '<button class="btn" type="submit">Analyse abschließen und speichern →</button></form>';
  }
  const feedback=draft?.feedback&&draft.step===i?'<div class="fp-ic-feedback '+(draft.feedback.correct?'correct':'incorrect')+'"><strong>'+(draft.feedback.correct?'✓ Fachlich korrekt':'Noch nicht korrekt')+'</strong><p>'+esc(draft.feedback.method)+'</p><button class="btn" data-ic-'+(draft.feedback.correct?'next':'retry')+'>'+(draft.feedback.correct?'Nächste Etappe →':'Erneut selbst lösen →')+'</button></div>':'';
  if(draft?.feedback&&draft.step===i&&i!==5&&i!==7){
    // Hide the answer form after checking to prevent duplicate submissions.
    body=feedback;
  }
  return '<div class="fp-ic">'+breadcrumbs()+'<div class="fp-ic-heading"><span class="eyebrow">'+esc(c.company)+' · '+esc(tag)+'</span><h1>'+esc(t)+'</h1><p>Etappe '+(i+1)+' von 8 · '+esc(c.symbol)+'</p><div class="fp-ic-progress"><i style="width:'+(i/8*100)+'%"></i></div></div><section class="fp-ic-panel"><h2>'+esc(heading)+'</h2>'+body+'<p role="alert" id="fp-ic-validation"></p></section>'+ev+'<aside class="fp-ic-disclaimer">Quellengebundene historische Finanzzahlen und Modellannahmen werden ausdrücklich getrennt. Diese Übung ist keine personalisierte Kaufempfehlung.</aside></div>';
 }
 function chartSimple(labels,values,unit){
  const max=Math.max(...values,1);
  return '<div class="fp-ic-bars"><small>'+esc(unit)+' · Berichtszeiträume siehe Quelle</small>'+labels.map((x,i)=>'<div class="fp-ic-bar-row"><span>'+esc(x)+'</span><div class="fp-ic-track"><i style="width:'+Math.max(2,values[i]/max*100)+'%"></i></div><b>'+number(values[i])+'</b></div>').join('')+'</div>';
 }
 function completed(){
  const c=current();if(!c)return listing();
  const s=session(c.id),v=calculate(c,s.model||config(c)),m=s.memo||{};
  return '<div class="fp-ic">'+breadcrumbs()+'<div class="fp-ic-finish"><div class="eyebrow">DEIN RESEARCH-BERICHT</div><h1>'+esc(c.company)+' · Investmenturteil</h1><p>Du hast alle Etappen durchlaufen. Diese Bewertung bleibt als deine persönliche, überprüfbare Investmentthese gespeichert.</p><div class="fp-ic-facts"><div><span>Modellierter Wahrscheinlichkeitswert</span><b>'+(!v.error?money(v.weighted,c.currency):'Nicht verfügbar')+'</b></div><div><span>Haltung</span><b>'+esc(m.stance||'Nicht festgelegt')+'</b></div><div><span>Horizont</span><b>'+esc(m.horizon||'–')+'</b></div><div><span>Bewertungsstand</span><b>'+esc(c.date)+'</b></div></div><h2>Deine These</h2><p>'+esc(m.thesis)+'</p><h2>Gegenargument & Widerlegung</h2><p>'+esc(m.risk)+'</p><div class="fp-ic-review"><h3>Qualitätscheck vor einem echten Investmenturteil</h3>'+c.review.map(r=>'<div>◇ '+esc(r)+'</div>').join('')+'</div><p><b>KI-Feedback ist nicht automatisch erfolgt.</b> Du kannst den Bericht ausdrücklich in ChatGPT überprüfen lassen; bis dahin ist er nur gespeichert.</p><div class="fp-ic-actions"><button class="btn" data-ic-copy>Bericht für KI-Feedback kopieren</button><button class="btn secondary" data-ic-revise>Analyse neu prüfen</button></div><p id="fp-ic-validation" role="status"></p></div>'+evidence(c)+'</div>';
 }
 function render(){if(!ready)return '<div class="fp-ic"><h1>Investmentkomitee</h1><p>'+esc(error||'Lade Research-Fälle …')+'</p></div>';if(!saved.active)return listing();return session(saved.active).completed?completed():stage()}
 function move(){const c=current();if(!c)return;const s=session(c.id);s.step=Math.min(7,s.step+1);draft=null;touch(s);window.render?.();window.scrollTo({top:0,behavior:'instant'})}
 function grade(quiz,answer){
  if(quiz.answer!==undefined){const x=Number(String(answer).replace(',','.'));return {valid:Number.isFinite(x),correct:Number.isFinite(x)&&Math.abs(x-quiz.answer)<=(quiz.tolerance||.1),method:quiz.method}}
  if(Array.isArray(quiz.correct)){const a=Array.isArray(answer)?[...answer].map(Number).sort((x,y)=>x-y):[];const b=[...quiz.correct].sort((x,y)=>x-y);return{valid:a.length===b.length,correct:JSON.stringify(a)===JSON.stringify(b),method:quiz.method}}
  return{valid:Array.isArray(answer)&&answer.length===1,correct:answer?.[0]===quiz.correct,method:quiz.method};
 }
 function submit(quiz,answer){
  const c=current();if(!c)return;const s=session(c.id),check=grade(quiz,answer);
  if(!check.valid){message('Bitte erst eine vollständige Antwort eingeben.');return}
  s.answers[s.step]={correct:check.correct,answer,at:Date.now()};
  draft={step:s.step,type:'feedback',feedback:check};
  touch(s);window.render?.();
 }
 function message(text){const x=document.getElementById('fp-ic-validation');if(x)x.textContent=text}
 function repaintModel(){
  const c=current();if(!c)return;
  const box=document.getElementById('fp-ic-model-output');if(!box)return;
  const v=calculate(c,draft?.model||config(c));
  box.innerHTML=v.error?'<p class="fp-ic-error">'+esc(v.error)+'</p>':modelResult(c,v);
 }
 function gatherModel(){
  const c=current();if(!c)return;
  const p={...config(c)};
  document.querySelectorAll('[data-ic-weight],[data-ic-driver]').forEach(input=>{
   const k=input.dataset.icWeight||input.dataset.icDriver;
   const raw=String(input.value).trim().replace(',','.');
   p[k]=raw===''?NaN:Number(raw);
  });
  draft={step:5,type:'model',model:p};repaintModel();
 }
 function memoText(c,s){const m=s.memo||{},v=calculate(c,s.model||config(c));
  return 'Investmentkomitee – '+c.company+' ('+c.symbol+')\nBewertungsstand: '+c.date+'\nQuelle: '+c.source.url+'\nModell: '+c.kind+'; Gewichteter Wert: '+(v.error?'nicht berechenbar':money(v.weighted,c.currency))+'\n'+(c.quote?'Historischer Kurs '+c.quote.date+': '+money(c.quote.price,c.currency)+'\n':'Kein aktueller Kurs hinterlegt\n')+
   'Haltung: '+m.stance+'\nZeithorizont: '+m.horizon+'\nThese: '+m.thesis+'\nGegenargument/Widerlegung: '+m.risk+
   '\n\nBitte bewerte streng: Belegqualität, Annahmen, Kapitalstruktur/Free Cashflow, Gegenargument, Falsifizierbarkeit und Modellrisiken (je 0–5). Recherchiere aktuelle Quellen, nenne Fehler und begründete Verbesserungsvorschläge. Keine garantiert erzielbaren Kursziele.';
 }
 function bind(root=document){
  root.querySelectorAll('[data-ic-open]').forEach(b=>b.addEventListener('click',()=>{saved.active=b.dataset.icOpen;draft=null;persist();window.render?.();window.scrollTo(0,0)}));
  root.querySelectorAll('[data-ic-back]').forEach(b=>b.addEventListener('click',()=>{saved.active=null;draft=null;persist();window.render?.();window.scrollTo(0,0)}));
  root.querySelectorAll('[data-ic-next]').forEach(b=>b.addEventListener('click',()=>{if(draft?.feedback&&draft.feedback.correct===false)return;move()}));
  root.querySelectorAll('[data-ic-retry]').forEach(b=>b.addEventListener('click',()=>{const s=session(saved.active);delete s.answers[s.step];draft=null;touch(s);window.render?.()}));
  root.querySelectorAll('[data-ic-choice]').forEach(b=>b.addEventListener('click',()=>{
   const c=current(),s=session(c.id),i=s.step,q=i===3?c.critical:i===4?c.decision:c.postModel,n=Number(b.dataset.icChoice);
   const prior=draft?.type==='choice'&&draft.step===i?draft.value:[];
   const selected=i===3?(prior.includes(n)?prior.filter(x=>x!==n):[...prior,n]):[n];
   draft={type:'choice',step:i,value:selected};window.render?.();
  }));
  root.querySelector('#fp-ic-calc')?.addEventListener('submit',ev=>{ev.preventDefault();const c=current(),s=session(c.id);submit(c.exercises[s.step-1],ev.currentTarget.elements.answer.value)});
  root.querySelector('[data-ic-validate]')?.addEventListener('click',()=>{
   const c=current(),s=session(c.id),q=s.step===3?c.critical:s.step===4?c.decision:c.postModel;
   submit(q,draft?.type==='choice'&&draft.step===s.step?draft.value:[]);
  });
  root.querySelectorAll('[data-ic-weight],[data-ic-driver]').forEach(b=>b.addEventListener('input',gatherModel));
  root.querySelector('[data-ic-model-save]')?.addEventListener('click',()=>{
   const c=current(),s=session(c.id),p=draft?.type==='model'?draft.model:config(c),v=calculate(c,p);
   if(v.error){message(v.error);return}
   s.model={...p};s.answers[5]={correct:true,at:Date.now(),result:v.weighted};touch(s);move();
  });
  root.querySelector('#fp-ic-thesis')?.addEventListener('submit',ev=>{
   ev.preventDefault();const c=current(),s=session(c.id),f=ev.currentTarget;
   const thesis=String(f.elements.thesis.value).trim(),risk=String(f.elements.risk.value).trim();
   if(thesis.length<55||risk.length<45){message('Bitte zwei nachvollziehbare Belege und ein falsifizierbares Gegenargument angeben.');return}
   s.memo={stance:String(f.elements.stance.value),horizon:String(f.elements.horizon.value),thesis,risk,savedAt:Date.now()};
   s.answers[7]={correct:true,at:Date.now()};s.completed=true;s.step=8;touch(s);window.render?.();window.scrollTo(0,0);
  });
  root.querySelector('[data-ic-revise]')?.addEventListener('click',()=>{const s=session(saved.active);s.completed=false;s.step=5;draft=null;touch(s);window.render?.()});
  root.querySelector('[data-ic-copy]')?.addEventListener('click',async()=>{
   const c=current(),txt=memoText(c,session(c.id));
   try{await navigator.clipboard.writeText(txt);message('Bericht kopiert. Öffne ChatGPT und füge ihn zur fachlichen Bewertung ein.')}catch{message('Kopieren nicht möglich. Öffne ChatGPT und übertrage deine These manuell.')}
  });
 }
 async function load(){
  try{
   const [main,kion]=await Promise.all([fetch('./data/investment-committee.json?u='+Date.now(),{cache:'no-store'}),fetch('./data/kion_model.json?u='+Date.now(),{cache:'no-store'})]);
   if(!main.ok||!kion.ok)throw Error('HTTP '+main.status+'/'+kion.status);
   data=await main.json();research.kion=await kion.json();
   if(data.schema!==1||!Array.isArray(data.cases)||!research.kion?.model?.scenarios)throw Error('Ungültige Modelldaten');
   ready=true;error='';
  }catch(e){error='Investmentdaten vorübergehend nicht erreichbar. Bitte Verbindung prüfen.';ready=false}
  if(typeof state!=='undefined'&&state.view==='investmentcommittee')window.render?.();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load();
 return{render,bind,load,grade,calculate,dcf,get cases(){return data.cases},get progress(){return saved}};
})();