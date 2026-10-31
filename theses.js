/* FinanzPilot v23 – Private Investmentthesen, Quellen- und Modellcheck, unveraenderliche Revisionen. */
'use strict';
window.FinanzPilotTheses=(()=>{
 const KEY='finanzpilot_theses_v1';
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
 const read=()=>{try{const x=JSON.parse(localStorage.getItem(KEY)||'{}');return x&&typeof x==='object'?x:{}}catch{return{}}};
 let store={entries:[],draft:null,selected:null,...read()},mode=store.draft?'form':'list',status='',editingFrom=store.editingFrom||null;
 const entries=()=>Array.isArray(store.entries)?store.entries:[];
 const safeDate=x=>Number.isFinite(Number(x))?new Date(Number(x)).toLocaleDateString('de-DE',{day:'2-digit',month:'short',year:'numeric'}):'Unbekannt';
 const num=x=>{const s=String(x??'').trim().replace(/\s/g,'').replace(',','.');return s!==''&&/^-?\d+(?:\.\d+)?$/.test(s)?Number(s):null};
 const format=x=>Number.isFinite(x)?new Intl.NumberFormat('de-DE',{maximumFractionDigits:2}).format(x):'–';
 const makeId=()=>String(Date.now())+'-'+Math.random().toString(36).slice(2,10);
 const empty=()=>({company:'',ticker:'',stance:'Beobachten',horizon:'1–2 Jahre',sourceUrl:'',asof:'',thesis:'',evidence:'',assumptions:'',valuationMethod:'',bear:'',base:'',bull:'',bearWeight:'30',baseWeight:'50',bullWeight:'20',risk:'',invalidation:'',catalyst:''});
 function persist(){try{localStorage.setItem(KEY,JSON.stringify(store));window.dispatchEvent(new Event('fp-progress-change'));return true}catch{status='Speichern auf diesem Gerät fehlgeschlagen. Prüfe den verfügbaren Speicher.';return false}}
 const clean=f=>Object.fromEntries(Object.keys(empty()).map(k=>[k,String(f?.[k]??empty()[k]).slice(0,k==='thesis'||k==='evidence'||k==='risk'||k==='invalidation'||k==='assumptions'?2200:400)]));
 const validSource=x=>{try{const u=new URL(String(x));return u.protocol==='https:'&&!!u.hostname?.includes('.')}catch{return false}};
 function evaluate(input){
  const f=clean(input),probs=['bearWeight','baseWeight','bullWeight'].map(k=>num(f[k]));
  const targets=['bear','base','bull'].map(k=>num(f[k]));
  const weightsOK=probs.every(x=>x!==null&&x>=0&&x<=100)&&Math.abs(probs.reduce((a,b)=>a+b,0)-100)<.01;
  const targetsOK=targets.every(x=>x!==null&&x>=0);
  const ordered=targetsOK&&targets[0]<=targets[1]&&targets[1]<=targets[2];
  const weighted=weightsOK&&ordered?targets.reduce((s,v,i)=>s+v*probs[i]/100,0):null;
  const checks=[
   {label:'Quellen & Belege',passed:[validSource(f.sourceUrl),f.evidence.trim().length>=75&&/\d/.test(f.evidence)],
    improve:['Verlinke die ursprüngliche Unternehmensmeldung oder den Geschäftsbericht (HTTPS).','Nenne mindestens zwei datierte Kennzahlen und erkläre, was sie belegen.']},
   {label:'Bewertungsmodell',passed:[!!f.valuationMethod&&targetsOK&&ordered,weightsOK],
    improve:['Trage nachvollziehbare Bear-, Base- und Bull-Modellwerte je Aktie ein, mit Bear ≤ Base ≤ Bull und einer erklärten Methode.','Die drei Eintrittswahrscheinlichkeiten müssen exakt 100 % ergeben.']},
   {label:'Gegenargument & Widerlegung',passed:[f.risk.trim().length>=65,f.invalidation.trim().length>=45],
    improve:['Beschreibe das stärkste Gegenargument und warum es die These gefährdet.','Nenne ein beobachtbares Signal, bei dem du die These aufgeben oder ändern würdest.']},
   {label:'Investmentlogik',passed:[f.thesis.trim().length>=90,!!f.horizon&&!!f.stance&&!!f.ticker.trim()],
    improve:['Schreibe eine überprüfbare These mit mindestens zwei klaren Argumenten und erläutere die Verbindung zum Unternehmenswert.','Definiere Ticker, Zeithorizont und eine hypothetische Haltung.']},
   {label:'Annahmen & Beobachtung',passed:[f.assumptions.trim().length>=65,f.catalyst.trim().length>=35],
    improve:['Lege die zentralen Prognoseannahmen offen; beobachtete Zahlen sind nicht automatisch zukünftige Gewinne.','Formuliere einen konkreten nächsten Datenpunkt oder Auslöser für die erneute Analyse.']}
  ].map(c=>({...c,points:c.passed.filter(Boolean).length,missing:c.improve.filter((_,i)=>!c.passed[i])}));
  return {score:checks.reduce((n,c)=>n+c.points,0),max:10,checks,weighted,weightsOK,ordered,sourceSyntax:validSource(f.sourceUrl),calculatedAt:Date.now()};
 }
 function compare(entry){
  const parent=entries().find(x=>x.id===entry.revisionOf);if(!parent)return null;
  const old=parent.check?.score??evaluate(parent.input).score,delta=(entry.check?.score??0)-old;
  const a=num(entry.check?.weighted),b=num(parent.check?.weighted);
  return {parent,delta,valuationDelta:a!==null&&b!==null?a-b:null};
 }
 const latest=()=>entries().slice().sort((a,b)=>Number(b.createdAt)-Number(a.createdAt));
 function landing(){
  const all=latest(),withExternal=all.filter(x=>x.externalFeedback?.text).length;
  return '<div class="fp-theses"><div class="fp-theses-intro"><div class="eyebrow">AKTIEN · DEIN RESEARCH-ARCHIV</div><h1>Thesenjournal</h1><p>Formuliere eine Investmentidee, prüfe die Vollständigkeit und vergleiche deine späteren Revisionen. Alles bleibt privat im Gerät und bei Anmeldung in deinem eigenen FinanzPilot-Konto.</p><div class="fp-theses-metrics"><span><strong>'+all.length+'</strong> gespeicherte Versionen</span><span><strong>'+withExternal+'</strong> externe Bewertungen dokumentiert</span></div><div class="fp-theses-actions"><button class="btn" data-thesis-new>Neue Analyse erstellen →</button><button class="btn secondary" data-thesis-export>Verlauf sichern (JSON)</button></div></div>'+
   '<div class="fp-theses-divider"><h2>Dein Verlauf</h2><small>Neueste Version zuerst · kein automatischer Aktienkursvergleich</small></div>'+
   (all.length?'<div class="fp-theses-list">'+all.map(x=>'<button type="button" class="fp-theses-entry" data-thesis-view="'+esc(x.id)+'"><span><small>'+esc(safeDate(x.createdAt))+' · '+esc(x.input?.ticker||'')+'</small><strong>'+esc(x.input?.company||'Unternehmen')+'</strong><span>'+esc(x.input?.stance||'')+' · '+esc(x.input?.horizon||'')+'</span></span><span class="fp-theses-score"><b>'+(x.check?.score??0)+'/10</b><small>Formalia</small></span></button>').join('')+'</div>':'<div class="fp-theses-empty">Noch keine Analyse gespeichert. Starte mit einer eigenen Investmentthese oder übernimm deinen abgeschlossenen Bericht aus dem Investmentkomitee.</div>')+
   '<p class="fp-theses-disclaimer">Der automatische Check prüft Form und Rechenlogik, nicht die wirtschaftliche Richtigkeit deiner Annahmen. Echte KI-Kritik erfolgt nur nach deiner ausdrücklichen Übergabe an ChatGPT.</p></div>';
 }
 const row=(name,label,value,extra='')=>'<label>'+label+'<input type="text" name="'+name+'" value="'+esc(value)+'" '+extra+'></label>';
 const area=(name,label,value,placeholder,min=0)=>'<label>'+label+'<textarea name="'+name+'" rows="4" maxlength="2200" minlength="'+min+'" placeholder="'+esc(placeholder)+'">'+esc(value)+'</textarea></label>';
 function form(){
  const f=clean(store.draft||empty());
  return '<div class="fp-theses"><button class="fp-theses-back" data-thesis-home>‹ Alle Analysen</button><header class="fp-theses-intro"><span class="eyebrow">FACHLICHE INVESTMENTTHESE</span><h1>'+(editingFrom?'Analyse überarbeiten':'Neue Analyse')+'</h1><p>Deine Texte bleiben als Entwurf gespeichert. Ein Abschluss erzeugt eine neue, unveränderliche Version im Verlauf.</p></header>'+
   '<form id="fp-theses-form" class="fp-theses-form">'+
   '<section><h2>01 · Unternehmen und These</h2><div class="fp-theses-grid">'+row('company','Unternehmen',f.company,'required maxlength="100"')+row('ticker','Börsensymbol',f.ticker,'required maxlength="45"')+'</div>'+
   '<div class="fp-theses-grid"><label>Hypothetische Haltung<select name="stance">'+['Beobachten','Hypothetisch kaufen','Hypothetisch vermeiden'].map(x=>'<option '+(f.stance===x?'selected':'')+'>'+x+'</option>').join('')+'</select></label><label>Zeithorizont<select name="horizon">'+['6–12 Monate','1–2 Jahre','3–5 Jahre'].map(x=>'<option '+(f.horizon===x?'selected':'')+'>'+x+'</option>').join('')+'</select></label></div>'+
   area('thesis','Meine These und Argumentation',f.thesis,'Was ist meine Einschätzung, worauf stütze ich sie, und was dürfte der Markt falsch bewerten?',55)+
   area('evidence','Nachprüfbare Belege',f.evidence,'Zwei datierte Zahlen aus dem Bericht und ihre Bedeutung.',20)+
   row('sourceUrl','Originalquelle (HTTPS)',f.sourceUrl,'placeholder="https://..."')+row('asof','Datenstand / Berichtszeitpunkt',f.asof,'placeholder="z. B. Q3 2026"')+'</section>'+
   '<section><h2>02 · Bewertung und Szenarien</h2><p class="fp-theses-help">Optional ausfüllen, wenn du deine Modellannahmen bereits quantifizieren kannst. Ohne vollständige Daten gibt es bewusst keinen erfundenen Kurs.</p>'+
   row('valuationMethod','Bewertungsmethode',f.valuationMethod,'placeholder="z. B. DCF mit FCFF / EPS-Multiple"')+
   '<div class="fp-theses-grid fp-theses-three">'+row('bear','Bear · Wert je Aktie',f.bear,'inputmode="text" placeholder="z. B. 24,59"')+row('base','Base · Wert je Aktie',f.base,'inputmode="text"')+row('bull','Bull · Wert je Aktie',f.bull,'inputmode="text"')+'</div>'+
   '<div class="fp-theses-grid fp-theses-three">'+row('bearWeight','Bear (%)',f.bearWeight,'inputmode="text"')+row('baseWeight','Base (%)',f.baseWeight,'inputmode="text"')+row('bullWeight','Bull (%)',f.bullWeight,'inputmode="text"')+'</div>'+
   area('assumptions','Wichtigste Modellannahmen',f.assumptions,'Wachstum, Margen, Investitionsbedarf, Kapitalkosten und Unsicherheit erläutern.')+'</section>'+
   '<section><h2>03 · Widerlegung und Kontrolle</h2>'+area('risk','Stärkstes Gegenargument',f.risk,'Welches realistische Szenario würde die Investmentthese verschlechtern?')+
   area('invalidation','Wann wäre meine These widerlegt?',f.invalidation,'Welche messbare Entwicklung zwingt dich zum Umdenken?')+
   area('catalyst','Nächste Überprüfung',f.catalyst,'Welche Quartalszahlen, Kapitalrenditen oder anderen Fakten beobachtest du?')+
   '<div class="fp-theses-actions"><button class="btn" type="submit">Qualitätscheck durchführen & Version speichern →</button><button type="button" class="btn secondary" data-thesis-home>Zur Übersicht</button></div></section>'+
   '</form><div class="fp-theses-status" role="status" id="fp-theses-status">'+esc(status)+'</div></div>';
 }
 function timeline(entry){
  const series=entries().filter(e=>e.input?.ticker===entry.input?.ticker).slice().sort((a,b)=>Number(a.createdAt)-Number(b.createdAt)).slice(-12);
  if(series.length<2)return '';
  return '<section class="fp-theses-panel"><h2>Deine Entwicklung im Verlauf</h2><p class="fp-theses-help">Historische Formalia-Prüfung deiner Analysen zu '+esc(entry.input?.ticker)+'. Keine Aussage über tatsächliche Rendite oder Kursziele.</p><div class="fp-theses-history">'+series.map(e=>'<div class="fp-theses-history-row"><span>'+esc(safeDate(e.createdAt))+'</span><div class="fp-theses-history-track"><i style="width:'+Math.max(0,Math.min(100,(Number(e.check?.score)||0)*10))+'%"></i></div><b>'+Number(e.check?.score||0)+'/10</b></div>').join('')+'</div></section>';
 }
 function detail(){
  const x=entries().find(e=>e.id===store.selected);if(!x)return landing();
  const f=x.input,check=x.check||evaluate(f),comparison=compare(x);
  const report=check.checks.map(c=>'<article class="fp-theses-rubric"><div><strong>'+esc(c.label)+'</strong><b>'+c.points+'/2</b></div>'+(c.missing.length?'<p>'+c.missing.map(esc).join(' ')+'</p>':'<p>Die angegebenen formalen Kriterien sind erfüllt. Das beweist noch nicht, dass die Aussagen fachlich richtig sind.</p>')+'</article>').join('');
  return '<div class="fp-theses"><button class="fp-theses-back" data-thesis-home>‹ Thesenjournal</button><header class="fp-theses-intro"><span class="eyebrow">'+esc(f.ticker)+' · '+esc(safeDate(x.createdAt))+'</span><h1>'+esc(f.company)+'</h1><p>'+esc(f.stance)+' · '+esc(f.horizon)+'</p><div class="fp-theses-grade"><strong>'+check.score+' / '+check.max+'</strong><span><b>Formaler Qualitätscheck</b><small>Automatisches Prüfraster, keine KI- oder Aktienempfehlung</small></span></div></header>'+
   (comparison?'<div class="fp-theses-diff">Verglichen mit der vorherigen Version: '+(comparison.delta>=0?'+':'')+comparison.delta+' Formalia-Punkte'+(comparison.valuationDelta!==null?' · Modellwert '+(comparison.valuationDelta>=0?'+':'')+format(comparison.valuationDelta)+' je Aktie':'')+'.</div>':'')+
   '<section class="fp-theses-panel"><h2>Dein Investmenturteil</h2><p>'+esc(f.thesis)+'</p><h3>Belege</h3><p>'+esc(f.evidence||'Nicht angegeben')+'</p><h3>Gegenargument</h3><p>'+esc(f.risk||'Nicht angegeben')+'</p><h3>Widerlegungskriterium</h3><p>'+esc(f.invalidation||'Nicht angegeben')+'</p><h3>Nächster Prüfpunkt</h3><p>'+esc(f.catalyst||'Nicht angegeben')+'</p>'+(check.sourceSyntax?'<a href="'+esc(f.sourceUrl)+'" target="_blank" rel="noopener noreferrer">Eingetragene Quelle ansehen ↗</a>':'<small>Keine gültige HTTPS-Quelle hinterlegt.</small>')+'<p class="fp-theses-disclaimer">Eine angegebene Quelle wurde nicht automatisch gelesen oder verifiziert.</p></section>'+
   '<section class="fp-theses-panel"><h2>Bewertungsmodell</h2>'+(check.weighted===null?'<p>Kein vollständiges rechnerisch konsistentes Drei-Szenarien-Modell. Ohne gültige Werte und Wahrscheinlichkeiten wird kein erwarteter Modellwert dargestellt.</p>':'<div class="fp-theses-model"><span>Wahrscheinlichkeitsgewichteter hypothetischer Wert je Aktie</span><strong>'+format(check.weighted)+'</strong><small>In der angegebenen Aktienwährung · kein heutiger Börsenkurs oder Zielkurs</small></div>'+['bear','base','bull'].map((k,i)=>'<div class="fp-theses-scenario"><span>'+['Negativ','Basis','Positiv'][i]+' ('+esc(f[k+'Weight'])+' %)</span><b>'+format(num(f[k]))+'</b></div>').join(''))+'<p>Modellannahmen: '+esc(f.assumptions||'nicht dokumentiert')+'</p></section>'+
   '<section class="fp-theses-panel"><h2>Dein detaillierter Prüfbericht</h2><p class="fp-theses-help">Die Punkte messen nur nachweisbare Angaben, Quellenformat und Rechenkonsistenz. Sie prüfen weder die Wahrheit einer Quelle noch die Güte deiner Prognose.</p>'+report+'</section>'+
   timeline(x)+'<section class="fp-theses-panel"><h2>Vertiefte Prüfung durch ChatGPT</h2><p>Übertrage deine Analyse bewusst und lass Belege, Zahlen, Gegenhypothesen und Modellrisiken fachlich untersuchen. Ohne API kann die App dieses Urteil nicht selbst erzeugen.</p><button class="btn" data-thesis-copy>Prüfauftrag für ChatGPT kopieren</button><form id="fp-theses-external"><label>Erhaltenes KI-Feedback dokumentieren<textarea name="feedback" rows="5" maxlength="5000" placeholder="Füge die spätere Bewertung ein – sie wird nicht automatisch hierher übertragen.">'+esc(x.externalFeedback?.text||'')+'</textarea></label><button type="submit" class="btn secondary">KI-Feedback im Verlauf sichern</button></form></section>'+
   '<div class="fp-theses-actions"><button class="btn secondary" data-thesis-revise="'+esc(x.id)+'">Neue Version dieser Analyse erstellen</button></div><p class="fp-theses-status" id="fp-theses-status" role="status">'+esc(status)+'</p></div>';
 }
 function render(){if(mode==='form')return form();if(mode==='detail')return detail();return landing()}
 function create(input,revisionOf=null){
  const f=clean(input);if(!f.company.trim()||!f.ticker.trim()||f.thesis.trim().length<55)return{error:'Bitte Unternehmen, Ticker und eine nachvollziehbare These mit mindestens 55 Zeichen ausfüllen.'};
  const check=evaluate(f),e={id:makeId(),revisionOf,createdAt:Date.now(),updatedAt:Date.now(),input:f,check,externalFeedback:null};
  store.entries=[...entries(),e];store.selected=e.id;store.draft=null;store.draftAt=Date.now();store.editingFrom=null;editingFrom=null;mode='detail';status='Analyse lokal gespeichert. Bei angemeldetem Konto läuft der Abgleich automatisch.';persist();return e;
 }
 function draftFromCommittee(c,s,value){
  if(!c||!s?.memo)return false;
  const m=s.memo,model=s.model||{};
  const v=value&&!value.error?value:null;
  const currency=c.currency==='EUR'?'€':'USD';
  const nums=(c.kind==='dcf'?['revenue2026','adjEbit','reportedFcf','netDebt']:['revenue2026','operatingIncome','adjDilutedEPS','gaapEPS'])
   .filter(k=>Number.isFinite(Number(c.facts?.[k]))).map(k=>k+': '+format(c.facts[k])+' (Stand '+c.date+')').join('; ');
  store.draftAt=Date.now();store.draft=clean({...empty(),company:c.company,ticker:c.symbol,stance:m.stance||'Beobachten',horizon:m.horizon||'1–2 Jahre',thesis:m.thesis||'',risk:m.risk||'',invalidation:'',sourceUrl:c.source?.url||'',asof:c.source?.date||c.date,evidence:nums,valuationMethod:c.kind==='dcf'?'FCFF-DCF, je Aktie ('+currency+')':'Bereinigtes EPS × angenommenes P/E ('+currency+')',bear:v?String(v.targets[0]):'',base:v?String(v.targets[1]):'',bull:v?String(v.targets[2]):'',bearWeight:String(model.bear??30),baseWeight:String(model.base??50),bullWeight:String(model.bull??20),assumptions:'Annahmen aus meinem Investmentkomitee-Modell übernehmen und begründen: '+(c.kind==='dcf'?'WACC '+(model.wacc??10.5)+' %, Terminalwachstum '+(model.g??2)+' %. Leasing und Kapitalstruktur gesondert prüfen.':'Bereinigtes historisches EPS und Basis-KGV '+(model.pe??27)+'. Kein Forward-Kursziel.'),catalyst:''});
  editingFrom=null;store.editingFrom=null;mode='form';status='Entwurf aus dem Investmentkomitee übernommen. Prüfe insbesondere Widerlegungskriterium und nächsten Prüfpunkt.';persist();
  if(window.FinanzPilotNavigation?.route)window.FinanzPilotNavigation.route('theses');
  else{state.view='theses';window.render?.()}
  return true;
 }
 const prompt=e=>{
  const f=e.input,c=e.check;return 'Prüfe die folgende Investmentthese streng und quellenorientiert. Bewerte fachlich die tatsächliche Richtigkeit, nicht nur die Vollständigkeit. Prüfe alle Quellen/Zahlen unabhängig, unterscheide belegte Ist-Daten und Prognosen, untersuche DCF/Multiple, Kapitalstruktur, Risiken, Gegenargumente, WACC und Sensitivität. Gib 0–5 Punkte für Belegqualität, Modellplausibilität, Gegenargumente, Widerlegbarkeit und Entscheidungsrahmen; nenne konkrete Fehler und Verbesserungen. Trenne Marktpreis und hypothetischen Modellwert; keine garantierten Kursziele. \n\nUnternehmen: '+f.company+' ('+f.ticker+')\nHaltung: '+f.stance+' · Horizont '+f.horizon+'\nDatenstand: '+f.asof+'\nQuelle (noch nicht automatisch verifiziert): '+f.sourceUrl+'\nThese: '+f.thesis+'\nZahlen/Belege: '+f.evidence+'\nMethode: '+f.valuationMethod+'\nBear/Base/Bull: '+[f.bear,f.base,f.bull].join('/')+' · Gewichte: '+[f.bearWeight,f.baseWeight,f.bullWeight].join('/')+'\nAnnahmen: '+f.assumptions+'\nGegenargument: '+f.risk+'\nWiderlegungsbedingung: '+f.invalidation+'\nNächster Prüfpunkt: '+f.catalyst+'\nFormaler Vollständigkeitscheck (KEINE KI-Note): '+c.score+'/10. Die Analyse ist privat und wurde hier bewusst zur Prüfung kopiert.';
 };
 function bind(root=document){
  root.querySelectorAll('[data-thesis-export]').forEach(b=>b.addEventListener('click',()=>{try{
    const blob=new Blob([JSON.stringify({schema:1,exportedAt:new Date().toISOString(),entries:entries()},null,2)],{type:'application/json'});
    const link=document.createElement('a');const url=URL.createObjectURL(blob);
    link.href=url;link.download='finanzpilot-thesenjournal-'+new Date().toISOString().slice(0,10)+'.json';
    document.body.append(link);link.click();link.remove();URL.revokeObjectURL(url);
  }catch{status='Export fehlgeschlagen. Versuch es im Browser erneut.';window.render?.()}}));
  root.querySelectorAll('[data-thesis-new]').forEach(b=>b.addEventListener('click',()=>{editingFrom=null;store.editingFrom=null;store.draft=empty();store.draftAt=Date.now();mode='form';status='';persist();window.render?.()}));
  root.querySelectorAll('[data-thesis-home]').forEach(b=>b.addEventListener('click',()=>{mode='list';status='';window.render?.()}));
  root.querySelectorAll('[data-thesis-view]').forEach(b=>b.addEventListener('click',()=>{store.selected=b.dataset.thesisView;mode='detail';status='';persist();window.render?.()}));
  root.querySelectorAll('[data-thesis-revise]').forEach(b=>b.addEventListener('click',()=>{const e=entries().find(x=>x.id===b.dataset.thesisRevise);if(!e)return;editingFrom=e.id;store.editingFrom=e.id;store.draft={...e.input};store.draftAt=Date.now();mode='form';status='';persist();window.render?.()}));
  const f=root.querySelector('#fp-theses-form');
  f?.addEventListener('input',()=>{store.draft=Object.fromEntries(new FormData(f).entries());store.draftAt=Date.now();try{localStorage.setItem(KEY,JSON.stringify(store))}catch{}});
  f?.addEventListener('submit',ev=>{ev.preventDefault();const result=create(Object.fromEntries(new FormData(f).entries()),editingFrom);if(result.error){const alert=root.querySelector('#fp-theses-status');if(alert)alert.textContent=result.error;return}window.render?.();window.scrollTo(0,0)});
  root.querySelector('[data-thesis-copy]')?.addEventListener('click',async()=>{const e=entries().find(x=>x.id===store.selected);if(!e)return;try{await navigator.clipboard.writeText(prompt(e));status='Prüfauftrag kopiert. Öffne ChatGPT, füge ihn ein und übertrage die Bewertung anschließend bewusst zurück.'}catch{status='Kopieren fehlgeschlagen. Prüfe die Zwischenablage-Berechtigung.'}const el=root.querySelector('#fp-theses-status');if(el)el.textContent=status});
  root.querySelector('#fp-theses-external')?.addEventListener('submit',ev=>{ev.preventDefault();const x=entries().find(e=>e.id===store.selected);if(!x)return;const value=String(ev.currentTarget.elements.feedback.value||'').trim().slice(0,5000);if(value.length&&value.length<25){const el=root.querySelector('#fp-theses-status');if(el)el.textContent='Bitte das erhaltene Feedback ausführlicher dokumentieren.';return}
    x.externalFeedback=value?{text:value,at:Date.now(),origin:'Vom Nutzer aus ChatGPT übernommen'}:null;x.updatedAt=Date.now();persist();status=value?'Externes Feedback gespeichert.':'Externes Feedback-Feld geleert.';window.render?.()});
 }
 return{render,bind,evaluate,create,draftFromCommittee,prompt,get entries(){return entries()},get state(){return store}};
})();
