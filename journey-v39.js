/* FinanzPilot v39 – a single, truly progressive curriculum.
 * No XP, career points or rewards are changed by this module.
 */
(function(){
'use strict';
const DATA='./data/journey-v39.json';
const STORAGE='finanzpilot_journey_v1';
const QUESTION_DATA='./data/journey-questions-v55.json';
let questionBankLoaded=false;
function reconcileQuestionSessions(){
 if(!questionBankLoaded)return;
 let changed=false;
 for(const m of all()){
  const p=state.lessons?.[m.id];if(!p||state.completed?.[m.id]||p.questionVersion===55)continue;
  p.answers={};p.page=Math.min(2,Number(p.page)||0);p.questionVersion=55;p.updatedAt=Date.now();changed=true;
 }
 if(changed)persist();
}

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// V59: Abbreviations appear plainly in lessons; explanations live in one optional
// per-lesson glossary. Never append parenthetical definitions to quiz answers.
const FP57_ACRONYMS={
 ETF:'Exchange Traded Fund – börsengehandelter Fonds. Bündelt mehrere Wertpapiere und wird wie eine Aktie gehandelt.',
 SaaS:'Software as a Service – Software als Dienstleistung, meist über ein laufendes Abonnement.',
 FCF:'Free Cashflow – frei verfügbarer Geldfluss nach den notwendigen Investitionsauszahlungen.',
 DCF:'Discounted Cashflow – Bewertungsverfahren, bei dem erwartete künftige Geldflüsse auf ihren heutigen Wert abgezinst werden.',
 EPS:'Earnings per Share – Gewinn je Aktie. Gesamtergebnis auf die einzelnen Aktien umgerechnet.',
 KGV:'Kurs-Gewinn-Verhältnis – Aktienkurs geteilt durch Gewinn je Aktie.',
 EBIT:'Earnings Before Interest and Taxes – Gewinn vor Zinsen und Steuern. Zeigt das Ergebnis vor Finanzierungs- und Steueraufwand.',
 EBITDA:'Earnings Before Interest, Taxes, Depreciation and Amortization – Ergebnis vor Zinsen, Steuern und Abschreibungen.',
 USD:'US-Dollar – Währung der Vereinigten Staaten von Amerika.',
 EUR:'Euro – Währung unter anderem in Deutschland.'
};
const terms=value=>esc(String(value??'')
 .replace(/\bKurs-Gewinn-Verhältnis\s*\(KGV\)/g,'KGV')
 .replace(/\bETF\s*\(Exchange Traded Fund\)/g,'ETF')
 .replace(/\bEBITDA-Ergebnisse\s*\(Ergebnis vor Zinsen, Steuern und Abschreibungen\)/g,'EBITDA-Ergebnisse'));
const openedGlossaries=new Set();
function acronymGlossary(module,preparation){
 const source=[module.title,module.goal,module.explain,module.example,
  ...(module.details||[]).flatMap(d=>[d.heading,d.text]),
  module.challenge?.prompt,module.challenge?.solution,preparation,
  ...(module.questions||[]).flatMap(q=>[q.prompt,q.explanation,...(q.options||[])])
 ].filter(Boolean).join(' ');
 const found=Object.keys(FP57_ACRONYMS).filter(code=>new RegExp('\\b'+code+'\\b','i').test(source));
 if(!found.length)return '';
 return '<details class="fp59-glossary" data-fp59-glossary'+(openedGlossaries.has(module.id)?' open':'')+'>'+
  '<summary>Abkürzungen erklären <span class="fp59-glossary-count">'+found.length+' Begriffe</span></summary>'+
  '<dl class="fp59-glossary-list">'+found.map(code=>
   '<div class="fp59-glossary-entry"><dt>'+esc(code)+'</dt><dd>'+esc(FP57_ACRONYMS[code])+'</dd></div>'
  ).join('')+'</dl></details>';
}
const QUIZ_PREP={"geld-wofuer":"Überschuss = Einnahmen minus Ausgaben; Nettovermögen = Konten und Besitz minus Schulden; liquide Mittel sind kurzfristig verfügbares Geld.","was-ist-boerse":"Der Kurs spiegelt Erwartungen: Gewinne können steigen und Kurse trotzdem fallen, wenn die Erwartungen höher lagen. Ein Aktien-Stückpreis allein zeigt weder Unternehmensgröße noch Bewertung.","anlagearten":"Ein Fonds reduziert das Risiko einzelner Firmen, nicht sämtliche Marktschwankungen. Kupon bedeutet feste Zinszahlung einer Anleihe. Wenn vergleichbare Marktzinsen steigen, fällt meist der Kurs älterer Anleihen.","unternehmen-geschaeft":"Bei Software-Abonnements zählen nicht nur neue Kunden, sondern auch Akquisekosten und Bindung. Hohe Rabatte und steigende Kündigungen können künftige Gewinne belasten.","umsatz-kosten":"Gewinn = Umsatz minus relevante Kosten. Fixkosten bleiben kurzfristig gleich, variable Kosten wachsen mit der Menge. Für neue Umsätze auch die zusätzlichen Kosten berücksichtigen.","cashflow-einfach":"Unbezahlte Rechnungen sind Forderungen und kein eingegangener Geldfluss. Freier Cashflow = operativer Cashflow minus Investitionsauszahlungen; Kredite sind Finanzierung und gehören nicht dazu.","wachstum-marge":"Marge = Gewinn geteilt durch Umsatz. Steigender Umsatz kann bei schneller steigenden Kosten trotzdem eine sinkende Marge ergeben. Prozent und Prozentpunkte unterscheiden.","aktienpreis-wert":"Fairer Wert ist eine begründete, unsichere Schätzung. Das DCF-Verfahren zinst zukünftige Geldflüsse ab: Ein höherer angenommener Zinssatz senkt bei gleichen Geldflüssen den heutigen Wert.","bewertungsvergleiche":"Das Kurs-Gewinn-Verhältnis vergleicht den Preis je Aktie mit dem Jahresgewinn je Aktie. Mehr Schulden, ungleiches Wachstum oder verzerrte Gewinne machen einfache Zahlenvergleiche unzuverlässig.","rechnen-veraenderung":"Prozentänderungen bauen auf dem jeweils neuen Ausgangswert auf. Rechne nacheinander mit Faktoren; ein Verlust erfordert für die Erholung einen höheren Prozentanstieg.","rechnen-marge":"EBIT bezeichnet Gewinn vor Zinsen und Steuern. EBIT-Marge = EBIT geteilt durch Umsatz mal 100. Der Unterschied von 18 zu 15 Prozent sind 3 Prozentpunkte, relativ 16,7 Prozent Rückgang.","rechnen-bewertung":"Das Kurs-Gewinn-Verhältnis nutzt Kurs geteilt durch Gewinn je Aktie. Gewinn je Aktie = Jahresgewinn durch Aktienzahl. Unterscheide berichtete Jahreswerte von noch unsicheren Prognosen.","analysieren-fragestellung":"Formuliere prüfbare Fragen zum Geschäftsmodell: Marge, Kosten, Kundenbindung und freier Geldfluss sind hilfreicher als bloße Hoffnungen auf einen Kursanstieg.","analysieren-quellen":"Wähle gleiche Zeiträume und Währungen. US-Dollar und Euro brauchen einen Wechselkurs mit Datum. Bereinigte EBITDA-Ergebnisse (Ergebnis vor Zinsen, Steuern und Abschreibungen) sind nicht direkt mit dem unbereinigten Gewinn gleichzusetzen.","analysieren-kurzbericht":"Trenne belegte Fakten von deinen Vermutungen; benenne fehlende Daten wie Forderungen, bevor du aus dem Wachstum eine Prognose machst.","urteil-fakt-vs-deutung":"Eine veröffentlichte Gewinnzahl ist eine Beobachtung; die Aussage zur Bewertung ist eine Deutung. Prüfe, ob der operative Cashflow den Gewinn bestätigt.","urteil-chancen-risiken":"Ein gutes Basis-, Chancen- und Risikoszenario nennt konkrete Bedingungen, die sich später an Zahlen überprüfen lassen.","urteil-these-protokoll":"Eine überprüfbare These nennt Ausgangswerte, einen Zeitpunkt und klare Gegenbelege. Ein Kursanstieg allein beweist deine ursprüngliche Geschäftsannahme nicht."};
function xpBadge(n){
 const signed=!!window.FinanzPilotCloud?.user,level=window.FinanzPilotLevels?.status;
 const xp=signed?(Number(level?.xp??window.FinanzPilotHeader?.xp)||0):null;
 return '<div class="fp57-earnings"><span><strong>+'+(6+2*n)+' XP</strong> für den ersten Abschluss</span>'+
 (xp!==null?'<span>Deine XP: <strong>'+xp+'</strong> · Level '+(Number(level?.level??window.FinanzPilotHeader?.level)||1)+'</span>':'<span>XP/FP nach Anmeldung gutschreiben</span>')+'</div>';
}

const read=()=>{try{const x=JSON.parse(localStorage.getItem(STORAGE)||'{}');return x&&typeof x==='object'?x:{}}catch{return{}}};
let data=null,loading=false,error='',state={completed:{},lessons:{},...read()},selectedId=String(read().selected||'');
const FOUNDATION=[[0,3,4],[0,1,4],[0,3,4],[0,1,3],[0,1,4],[0,2,4]];
const stageOf=number=>{const n=Number(number)-1,s=data?.stages?.[n];return s?{...s,modules:s.modules.filter((m,i)=>FOUNDATION[n].includes(i))}:null};
const all=()=>data?.stages?.flatMap((s,i)=>stageOf(i+1)?.modules||[])||[];
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
 '<p>Ein kompakter Einstieg: sechs Etappen mit je drei wichtigen Grundlagen. Für ausführliche Vertiefungen wählst du anschließend passende Skills im Skillbaum.</p>'+
 '<div class="fp39-start"><div class="fp39-mini-track"><span style="width:'+(done/total*100).toFixed(1)+'%"></span></div><small>'+done+' von '+total+' Lektionen abgeschlossen</small>'+
 '<button type="button" class="btn" data-journey-start>'+(done===0?'Mit Lektion 1 anfangen':done===total?'Lernweg wiederholen':'Weiterlernen: '+esc(next.title))+' →</button></div></div>'+
 '<section aria-label="Sechs Lernstufen" class="fp39-stage-grid">'+data.stages.map((raw,i)=>{const s=stageOf(i+1);
 const completed=s.modules.filter(m=>isDone(m.id)).length,here=i+1===now,locked=i>0&&!finishedStage(i);
 return '<button type="button" class="fp39-stage'+(here?' current':'')+(locked?' locked':'')+'" data-journey-stage="'+(i+1)+'" aria-label="Stufe '+(i+1)+': '+esc(s.title)+', '+completed+' von '+s.modules.length+' Lektionen abgeschlossen"><span class="fp39-stage-num">'+String(i+1).padStart(2,'0')+'</span><span class="fp39-stage-body"><strong>'+esc(s.title)+'</strong><span>'+esc(s.purpose)+'</span><small>'+completed+' / '+s.modules.length+' Lektionen'+(here?' · Als Nächstes':locked?' · Noch gesperrt':'')+'</small></span><span class="fp39-stage-chevron" aria-hidden="true">›</span></button>'
 }).join('')+'</section></div>';
}
function stage(n){
 const s=stageOf(n);if(!s)return '<div class="fp39-loading">Unbekannte Stufe</div>';
 const count=s.modules.filter(m=>isDone(m.id)).length;
 return '<div class="fp39-stage-page"><span class="eyebrow">ETAPPE '+n+' VON 6</span><h1>'+esc(s.title)+'</h1>'+
 '<p class="fp39-stage-purpose">'+esc(s.purpose)+'</p>'+
 '<div class="fp39-stage-goal"><b>Nach dieser Etappe kannst du:</b><p>'+esc(s.outcome)+'</p></div>'+xpBadge(n)+
 '<p class="fp39-small-progress">'+count+' von '+s.modules.length+' Lektionen abgeschlossen</p>'+
 '<div class="fp39-module-list">'+s.modules.map((m,i)=>{const done=isDone(m.id),locked=!canOpen(m.id),progress=locked?{page:0}:localSession(m.id),page=Math.min(5,Number(progress.page)||0);
 return '<button type="button" data-journey-open="'+esc(m.id)+'" class="fp39-module'+(done?' done':locked?' locked':'')+'" '+(locked?'disabled aria-disabled="true"':'')+'><span class="fp39-module-num">'+(done?'✓':locked?'🔒':String(i+1).padStart(2,'0'))+'</span><span><b>'+esc(m.title)+'</b><small>'+esc(m.goal)+'</small><em>'+(done?'Abgeschlossen':locked?'Erst die vorherige Lektion abschließen':page>0?'Begonnen · weiterlesen':'Jetzt beginnen')+'</em><small class="fp56-foundation-reward">+'+(6+2*n)+' XP'+(i===2?' · +1 FP Etappenbonus':'')+'</small></span><span aria-hidden="true">›</span></button>'
 }).join('')+'</div>'+
 '<div class="fp39-bottom-actions">'+
 (count===s.modules.length&&n<6?'<button class="btn" data-section-route="journey-'+(n+1)+'">Weiter zu Etappe '+(n+1)+' →</button>':'')+'</div></div>';
}
function lesson(){
 const m=current();if(!m||!canOpen(m.id))return '<div class="fp39-loading">Diese Lektion ist noch gesperrt. Schließe zuerst die vorherige Lektion ab.</div>';
 const n=stageNum(m.id),session=localSession(m.id),page=Math.max(0,Math.min(4,Number(session.page)||0));
 const questions=m.questions||[],answers=session.answers||{};
 const preparation=QUIZ_PREP[m.id]||'';
 const steps=['Erklärung','Beispiel','Frage 1','Frage 2','Abschluss'];
 const header='<div class="fp39-course-top"><span class="eyebrow">ETAPPE '+n+' · '+esc(stageOf(n)?.title)+' · '+esc(m.title)+'</span>'+
 '<span class="fp39-course-count">Seite '+(page+1)+' / 5</span></div>'+xpBadge(n)+
 '<div class="fp39-lesson-progress">'+steps.map((label,i)=>'<span class="'+(i<=page?'active':'')+'" title="'+esc(label)+'"></span>').join('')+'</div>'+
 '<h1>'+esc(m.title)+'</h1><p class="fp39-course-goal">'+esc(m.goal)+'</p>';
 let content='';
 if(page===0)content='<article class="fp39-reading"><span class="eyebrow">01 · VERSTEHEN</span><h2>Erst die Idee verstehen</h2><p>'+terms(m.explain)+'</p>'+(Array.isArray(m.details)?m.details.map(d=>'<section class="fp40-lesson-detail"><h3>'+esc(d.heading)+'</h3><p>'+terms(d.text)+'</p></section>').join(''):'')+'<div class="fp39-hint"><b>Dein Lernziel</b><p>'+esc(m.goal)+'</p></div></article>';
 if(page===1)content='<article class="fp39-reading"><span class="eyebrow">02 · BEISPIEL</span><h2>So sieht das im Alltag aus</h2><p>'+terms(m.example)+'</p>'+(m.challenge?'<section class="fp40-lesson-challenge"><h3>Jetzt selbst überlegen</h3><p>'+terms(m.challenge.prompt)+'</p><details><summary>Eine begründete Beispielantwort ansehen</summary><p>'+terms(m.challenge.solution)+'</p></details></section>':'')+'<div class="fp39-hint"><b>Verbindung zur Erklärung</b><p>Versuche, das Beispiel mit den gerade erklärten Grundlagen in eigenen Worten nachzuvollziehen. Die Fragen auf den nächsten Seiten prüfen genau diesen Zusammenhang.</p></div>'+(preparation?'<section class="fp57-bridge"><h3>Das brauchst du für die Fragen</h3><p>'+terms(preparation)+'</p></section>':'')+'</article>';
 if(page===2||page===3){
 const index=page-2,q=questions[index],a=answers[index],selected=a?.selected;
 content='<article class="fp39-reading"><span class="eyebrow">0'+(page+1)+' · VERSTÄNDNISCHECK</span><h2>'+terms(q.prompt)+'</h2><p>Wähle die fachlich beste Antwort. Bei Fehlern kannst du die Erklärung nochmals nachlesen und neu antworten.</p>'+(preparation?'<details class="fp57-bridge fp57-reminder"><summary>Begriffe und Verbindung zur Lektion wiederholen</summary><p>'+terms(preparation)+'</p></details>':'')+'<div class="fp39-choices">'+q.options.map((opt,i)=>'<button type="button" class="fp39-choice'+(selected===i?(a.correct?' correct':' wrong'):'')+'" data-journey-answer="'+i+'" '+(a?.correct?'disabled':'')+'><span>'+String.fromCharCode(65+i)+'</span>'+terms(opt)+'</button>').join('')+'</div>'+
 (a?'<div class="fp39-feedback '+(a.correct?'correct':'retry')+'"><b>'+(a.correct?'Richtig.':'Noch nicht. Du kannst es erneut versuchen.')+'</b><p>'+terms(q.explanation)+'</p></div>':'')+'</article>';
 }
 if(page===4)content='<article class="fp39-reading fp39-finish"><span class="eyebrow">05 · LEKTION ABSCHLIESSEN</span><h2>Wissen gesichert</h2><p>'+esc(m.goal)+'</p><p>Beide Verständnisfragen wurden richtig beantwortet. Die nächste Lektion knüpft an das Gelernte an; du kannst diese Erklärung jederzeit noch einmal öffnen.</p><p class="fp39-plain-note">Belohnung beim ersten Abschluss mit Konto: +'+(6+2*n)+' XP'+(stageOf(n)?.modules.at(-1)?.id===m.id?' und +1 FP für die abgeschlossene Etappe':'')+'. Die XP steigen mit dem Schwierigkeitsgrad der Etappe. Bereits gebuchte Altprämien bleiben erhalten; erneutes Lesen gibt keine Punkte.</p></article>';
 const canAdvance=page<2||(page===2||page===3)&&Boolean(answers[page-2]?.correct);
 return '<div class="fp39-lesson">'+header+acronymGlossary(m,preparation)+content+'<div class="fp39-lesson-buttons">'+
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
 // A correct answer is acknowledged by sound only. The larger animation belongs to the lesson finish.
 window.FinanzPilotFeedback?.tone?.(i===q.correct?'answer':'wrong');
 p.updatedAt=Date.now();persist();redraw();
}
function complete(){
 const m=current();if(!m)return;
 const p=localSession(m.id);
 if(p.page!==4||!m.questions.every((q,i)=>p.answers[i]?.correct))return;
 const firstFinish=!state.completed[m.id];state.completed[m.id]=Date.now();p.updatedAt=Date.now();persist();window.FinanzPilotStudy?.seed?.(m.id);
 // The lesson itself is completed locally and verified by two correct answers.
 // Celebrate this immediately on the user's completion tap; never wait for cloud latency.
 // Revisiting a finished lesson is celebratory but grants no new XP or FP.
 window.FinanzPilotCelebrations?.show?.('basics',{
  confirmed:true,id:'finish:'+m.id+':'+p.updatedAt,title:m.title||'Grundlage abgeschlossen',
  text:firstFinish?'Lektion geschafft! Deine Belohnung wird geprüft.':'Wiederholung abgeschlossen · keine zusätzlichen Punkte.'
 });
 if(firstFinish&&window.FinanzPilotCloud?.user){
  // Show EXACTLY the amount of server-awarded XP/FP, never optimistic amounts.
  // Previous completion animations must not be lost if the server is slow or offline.
  const account=window.FinanzPilotCloud.user;
  Promise.resolve(window.FinanzPilotLevels?.awardFoundation?.(m.id,m.title,false))
   .then(reward=>{
    if(account!==window.FinanzPilotCloud?.user||!reward?.awarded_now)return;
    window.FinanzPilotCelebrations?.show?.('reward',{
     confirmed:true,id:'foundation-paid:'+account+':'+m.id,title:'Deine Lernbelohnung',
     text:'Punkte für die abgeschlossene Grundlage gutgeschrieben.',
     value:'+'+Number(reward.xp_awarded||0)+' XP'+(Number(reward.fp_awarded)>0?' · +'+Number(reward.fp_awarded)+' FP':'')
    });
    window.FinanzPilotLevels?.refresh?.(true);
   }).catch(error=>console.warn('Grundlagenbelohnung bleibt zur Nachbuchung vorgemerkt:',String(error)));
 }
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
 root.querySelector('[data-fp59-glossary]')?.addEventListener('toggle',event=>{
  const m=current();if(!m)return;
  if(event.currentTarget.open)openedGlossaries.add(m.id);else openedGlossaries.delete(m.id);
 });
 root.querySelector('[data-journey-prev]')?.addEventListener('click',()=>{const x=current();if(x)showPage(localSession(x.id).page-1)});
 root.querySelector('[data-journey-next]')?.addEventListener('click',()=>{const x=current();if(!x)return;const p=localSession(x.id),page=p.page;if(page>=2&&!p.answers[page-2]?.correct)return;showPage(page+1)});
 root.querySelector('[data-journey-complete]')?.addEventListener('click',complete);
}
async function load(force=false){
 if(loading)return;
 if(data&&!force)return;
 loading=true;
 try{
  const res=await fetch(DATA+'?v=46',{cache:'no-store'});
  if(!res.ok)throw Error('HTTP '+res.status);
  const received=await res.json();
  if(received.schema_version!==1||received.stages?.length!==6||received.stages.some(s=>s.modules?.length!==6))throw Error('Ungültiger Lehrplan');
  data=received;error='';
  try{
   const response=await fetch(QUESTION_DATA+'?v=55',{cache:'no-store'});
   if(response.ok){const bank=await response.json();const selected=all();
    if(bank.schema_version===1&&selected.length===18&&selected.every(m=>Array.isArray(bank.questions?.[m.id])&&bank.questions[m.id].length===2&&bank.questions[m.id].every(q=>q.options?.length===4&&Number.isInteger(q.correct)))){
      selected.forEach(m=>{const origin=data.stages.flatMap(s=>s.modules).find(x=>x.id===m.id);if(origin)origin.questions=bank.questions[m.id]});
      questionBankLoaded=true;reconcileQuestionSessions();
    }
   }
  }catch(e){console.warn('FinanzPilot questions fallback:',e)}
 }catch(e){error='Lerninhalte sind derzeit nicht erreichbar. Bitte erneut laden.';console.warn('FinanzPilot Journey:',e)}
 finally{loading=false;redraw();window.FinanzPilotLevels?.backfill?.()}
}
window.addEventListener('fp-cloud-progress-imported',e=>{if(e?.detail?.keys?.includes(STORAGE)){state={completed:{},lessons:{},...read()};selectedId=String(state.selected||'');reconcileQuestionSessions();redraw()}});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>load(),{once:true});else load();
window.FinanzPilotJourney={renderHome:brief,renderFor,bind,load,open,start,complete,stageOf,firstIncomplete,get modules(){return all()},get catalog(){return data},get completed(){return state.completed},canOpen,get state(){return state}};
})();
