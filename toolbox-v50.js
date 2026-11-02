/* FinanzPilot V50: useful, skill-earned analysis workbench. No game-currency mutations. */
(function(){
'use strict';
const REPORT_URL='./data/company-financials-v47.json?v=50';
const DEFS=[
 {id:'report',title:'Finanzbericht-Prüfer',skill:'berichte-lesen',tag:'Unternehmen',desc:'Veröffentlichte Zahlen der Watchlist nach Zeitraum und Quelle prüfen; ohne eigene Zahlen abzutippen.',fields:[['symbol','Bericht','select','SIE.DE']]},
 {id:'cashflow',title:'Cashflow-Brücke',skill:'cashflow-architekt',tag:'Finanzberichte',desc:'Gewinn, nicht zahlungswirksame Posten, Working Capital und Investitionen zu einem vereinfachten FCF verbinden.',fields:[['profit','Periodengewinn · Mio.','number','80'],['noncash','Nicht zahlungswirksame Korrekturen · Mio.','number','24'],['working','Working-Capital-Zahlungswirkung (+ Freisetzung / − Bindung) · Mio.','number','-18'],['capex','Ausgezahlte Investitionen · Mio.','number','30']]},
 {id:'dcf',title:'DCF-Sensitivitätslabor',skill:'unternehmenswert',tag:'Bewertung',desc:'Fünfjährige Free-Cashflow-Projektion und Endwert mit Diskontsatz, Wachstum und Verwässerung untersuchen.',fields:[['fcf','Ausgangs-FCF · Mio.','number','100'],['growth','FCF-Wachstum pro Jahr · %','number','5'],['wacc','Diskontierungszins · %','number','10'],['terminal','Langfristiges Wachstum · %','number','2'],['debt','Nettoschulden · Mio. (negativ = Nettokasse)','number','200'],['shares','Verwässerte Aktien · Mio.','number','50'],['price','Vergleichskurs · €','number','30']]},
 {id:'portfolio',title:'Depot-Stresstest',skill:'portfolio-architekt',tag:'Risikomanagement',desc:'Drei frei definierbare Positionen samt Gewichtung und Kursschock plus verbleibende Liquidität berechnen.',fields:[['capital','Depotgesamtwert · €','number','10000'],['w1','Gewicht Position A · %','number','40'],['r1','Schock Position A · %','number','-30'],['w2','Gewicht Position B · %','number','35'],['r2','Schock Position B · %','number','-15'],['w3','Gewicht Position C · %','number','15'],['r3','Schock Position C · %','number','5']]},
 {id:'trade',title:'Trade- und Stop-Planer',skill:'trade-risiko-plan',tag:'Handel',desc:'Positionsgröße nach Verlustrisiko, Kaufkapital, Gap-Risiko und erforderlicher Trefferquote planen.',fields:[['capital','Verfügbares Handelskapital · €','number','10000'],['risk','Maximal geplantes Verlustrisiko · %','number','1'],['entry','Einstiegskurs · €','number','50'],['stop','Geplanter Stop · €','number','46'],['target','Zielkurs · €','number','62'],['fee','Geschätzte gesamte Orderkosten · €','number','4'],['gap','Stress-Ausführung unter Stop · €','number','42']]},
 {id:'etf',title:'ETF-Kaufkraftlabor',skill:'realrendite-kaufkraft',tag:'ETFs',desc:'Rendite vor Modellkosten, angenommene Steuern und Inflation zu einer realen Nettorendite verbinden.',fields:[['capital','Anlagebetrag · €','number','10000'],['return','Angenommene Jahresrendite vor Modellkosten · %','number','8'],['fees','Modellkosten auf Startbetrag · %','number','0,2'],['tax','Hypothetischer effektiver Steuersatz auf positiven Gewinn · %','number','20'],['inflation','Angenommene Inflation · %','number','2']]},
 {id:'research',title:'Investmentthese-Audit',skill:'quellenfinder',tag:'Research',desc:'These, Primärquelle, Gegenargument und Falsifikationsregel strukturiert festhalten und wieder aufrufen.',fields:[['name','Unternehmen / Thema','text',''],['thesis','Meine überprüfbare These','textarea',''],['source','Primärquelle (HTTPS-Link)','url',''],['fact','Wichtigste belegte Kennzahl mit Zeitraum','textarea',''],['counter','Stärkstes Gegenargument','textarea',''],['trigger','Was würde meine These widerlegen?','textarea',''],['review','Nächste Überprüfung (JJJJ-MM-TT)','text','']]}
];
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(x,d=2)=>Number(x).toLocaleString('de-DE',{maximumFractionDigits:d,minimumFractionDigits:0});
const money=n=>fmt(n)+' €';
const user=()=>window.FinanzPilotCloud?.user||null;
const catalogue=()=>window.FinanzPilotLearningHub?.catalog?.skills||[];
const completions=()=>window.FinanzPilotLearningHub?.status?.lessons||[];
let reports=null,reportProblem='',active=null,output='',lastRaw=null,message='',reportLoading=false;
const def=id=>DEFS.find(x=>x.id===id);
function gate(id){
 const d=def(id);if(!d)return {available:false,reason:'Unbekanntes Werkzeug'};
 if(!user())return {available:false,reason:'Für einen überprüften Skillabschluss ist ein angemeldetes Konto nötig.'};
 const skill=catalogue().find(s=>s.id===d.skill);
 if(!skill)return {available:false,reason:'Skillkatalog wird geladen; bitte den Lernen-Tab kurz öffnen.'};
 const done=skill.lessons.length>0&&skill.lessons.every(l=>completions().some(v=>v.lesson_id===l.id&&!!v.completed_at));
 return {available:done,reason:done?'Freigeschaltet durch den geprüften Skill: '+skill.title:'Voraussetzung: Skill „'+skill.title+'“ vollständig abschließen ('+skill.lessons.filter(l=>completions().some(v=>v.lesson_id===l.id&&!!v.completed_at)).length+'/'+skill.lessons.length+' Lektionen).'};
}
const storageKey=()=>user()?'finanzpilot_toolkit_v50_'+String(user()).replace(/[^a-zA-Z0-9_-]/g,'').slice(0,90):null;
function history(){
 const k=storageKey();if(!k)return [];
 try{const list=JSON.parse(localStorage.getItem(k)||'[]');return Array.isArray(list)?list.filter(r=>r&&def(r.tool)&&typeof r.id==='string').slice(0,40):[]}catch{return []}
}
function save(id,values,summary){
 if(!gate(id).available)throw Error('Dieses Werkzeug wurde noch nicht freigeschaltet.');
 const k=storageKey();if(!k)throw Error('Bitte anmelden.');
 const trimmed=Object.fromEntries(Object.entries(values).map(([key,val])=>[key,String(val).slice(0,3000)]));
 const item={id:String(Date.now())+'-'+Math.floor(Math.random()*1000000),tool:id,savedAt:new Date().toISOString(),values:trimmed,summary:String(summary||'').slice(0,350)};
 const list=[item,...history()].slice(0,30);
 try{localStorage.setItem(k,JSON.stringify(list))}catch{throw Error('Der lokale Gerätespeicher ist voll oder deaktiviert.')}
 return item;
}
function parse(v,name,minimum=-1e12,maximum=1e12){
 const s=String(v==null?'':v).trim();if(!s||s.length>60)throw Error('Bitte „'+name+'“ ausfüllen.');
 const normalized=s.replace(/\s/g,'').replace(',','.');
 if(!/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(normalized))throw Error('„'+name+'“ muss eine Zahl sein (Dezimalkomma erlaubt).');
 const n=Number(normalized);if(!Number.isFinite(n)||n<minimum||n>maximum)throw Error('„'+name+'“ liegt außerhalb des zulässigen Bereichs.');
 return n;
}
function calc(id,v){
 const n=(key,min=-1e12,max=1e12)=>parse(v[key],key,min,max);
 let facts=[],caution='',math='',summary='';
 if(id==='cashflow'){
  const profit=n('profit'),noncash=n('noncash'),wc=n('working'),capex=n('capex',0);
  const cfo=profit+noncash+wc,fcf=cfo-capex;
  facts=[['Vereinfachter operativer Cashflow',cfo,'Mio.'],['Vereinfachter Free Cashflow',fcf,'Mio.'],['FCF im Verhältnis zum Gewinn',profit>0?fmt(fcf/profit*100)+' %':'Nicht sinnvoll bei Gewinn ≤ 0','']];
  math='Cashflow = Ergebnis + nicht zahlungswirksame Korrekturen + Working-Capital-Zahlungswirkung; FCF = Cashflow − CAPEX.';
  caution='Eine echte Kapitalflussrechnung enthält weitere Posten. Zahlungseffekte und Investitionen müssen aus derselben Periode stammen.';
  summary='FCF '+fmt(fcf)+' Mio.';
 }else if(id==='dcf'){
  const fcf=n('fcf',0),g=n('growth',-60,100)/100,w=n('wacc',1,60)/100,t=n('terminal',-10,20)/100,debt=n('debt'),shares=n('shares',0.000001),price=n('price',0.000001);
  if(w<=t+0.002)throw Error('Diskontierungszins muss mehr als 0,2 Prozentpunkte über dem ewigen Wachstum liegen.');
  const projected=Array.from({length:5},(_,i)=>fcf*Math.pow(1+g,i+1));
  const evBase=(rate)=>{if(rate<=t)return NaN;const pv=projected.reduce((a,x,i)=>a+x/Math.pow(1+rate,i+1),0);const terminal=projected[4]*(1+t)/(rate-t);return pv+terminal/Math.pow(1+rate,5)};
  const ev=evBase(w),equity=ev-debt,perShare=equity/shares,low=evBase(w+0.01),high=w-0.01>t?evBase(w-0.01):null;
  facts=[['Unternehmenswert (Modell)',fmt(ev)+' Mio.',''],['Eigenkapitalwert nach Nettoschulden',fmt(equity)+' Mio.',''],['Modellwert je Aktie',money(perShare),''],['Abstand zum Vergleichskurs',fmt((perShare/price-1)*100)+' %',''],['Bei Diskontzins +1 Prozentpunkt',money((low-debt)/shares),''],['Bei Diskontzins −1 Prozentpunkt',high==null?'Nicht zulässig':money((high-debt)/shares),'']];
  math='FCF1…5 = FCF0 × (1 + Wachstum)^Jahr; Barwert = Σ FCFt/(1 + WACC)^t; Endwert = FCF5 × (1 + g)/(WACC − g), auf heute abgezinst. Eigenkapitalwert = Unternehmenswert − Nettoschulden.';
  caution='Mechanisches Modell: Wachstum, Endwert, Verwässerung, WACC und Cashflow-Basis sind unsichere Annahmen. Keine Aktie wird automatisch als günstig eingestuft.';
  summary='Wert je Aktie '+money(perShare);
 }else if(id==='portfolio'){
  const capital=n('capital',0.01),w=[1,2,3].map(i=>n('w'+i,0,100)),r=[1,2,3].map(i=>n('r'+i,-100,1000));
  const total=w.reduce((a,x)=>a+x,0);if(total>100.00001)throw Error('Depotgewichte dürfen zusammen nicht über 100 % liegen.');
  const delta=w.reduce((a,x,i)=>a+x*r[i]/100,0),cash=Math.max(0,100-total);
  facts=[['Gesamtrendite im Szenario',fmt(delta)+' %',''],['Änderung des Depotwerts',money(capital*delta/100),''],['Neuer Depotwert',money(capital*(1+delta/100)),''],['Restliches Bargeld',fmt(cash)+' %',''],['Größtes Einzelgewicht',fmt(Math.max(...w))+' %','']];
  math='Depotveränderung = Σ(Positionsgewicht × angenommene Kursveränderung) / 100. Bargeld hat in diesem Szenario 0 % Rendite.';
  caution=(Math.max(...w)>=40?'Einzelgewicht von mindestens 40 %: Konzentrationsrisiko prüfen. ':'')+'Gleichzeitige Marktbewegungen, Handelskosten, Währung und Nachschusspflichten sind nicht separat modelliert.';
  summary='Depotveränderung '+fmt(delta)+' %';
 }else if(id==='trade'){
  const cap=n('capital',0.01),risk=n('risk',0.01,30),entry=n('entry',0.000001),stop=n('stop',0),target=n('target',0),fees=n('fee',0),gap=n('gap',0);
  if(stop>=entry||target<=entry||gap>stop)throw Error('Es muss gelten: Stressausführung ≤ Stop < Einstieg < Ziel.');
  const riskBudget=cap*risk/100,perShare=entry-stop;
  if(fees>=riskBudget)throw Error('Die Kosten verbrauchen bereits das gesamte Risikobudget.');
  const qty=Math.floor(Math.min((riskBudget-fees)/perShare,(cap-fees)/entry));
  if(qty<1)throw Error('Für das geplante Risiko und Kapital kann keine ganze Aktie gekauft werden.');
  const loss=qty*perShare+fees,gain=qty*(target-entry)-fees,gapLoss=qty*(entry-gap)+fees;
  if(gain<=0)throw Error('Das mögliche Kursziel deckt die eingegebenen Gebühren nicht.');
  facts=[['Maximal planbare ganze Aktien',qty,'Stück'],['Geplantes Risiko inklusive Kosten',money(loss),''],['Stressverlust bei Ausführungslücke',money(gapLoss),''],['Plangewinn am Ziel nach Kosten',money(gain),''],['Nominelles Chancen/Risiko-Verhältnis',fmt(gain/loss)+' : 1',''],['Trefferquote für Null-Erwartungswert',fmt(loss/(loss+gain)*100)+' %','']];
  math='Stückzahl = min(⌊(Risikobudget − Kosten) / (Einstieg − Stop)⌋, ⌊(Kapital − Kosten) / Einstieg⌋). Erwartungswert bei Verlust/Gewinn: p × Gewinn − (1−p) × Verlust.';
  caution='Stop-Market garantiert keinen Stoppreis. Kurslücken können den Verlust über das geplante Budget heben. Gebühren und Ausführungskosten sind hier pauschal modelliert.';
  summary=qty+' Stück; geplantes Risiko '+money(loss);
 }else if(id==='etf'){
  const cap=n('capital',0.01),gross=n('return',-99,1000),fee=n('fees',0,20),tax=n('tax',0,100),infl=n('inflation',-20,100);
  const preTax=cap*(1+gross/100)-cap*fee/100,profit=preTax-cap,paid=Math.max(0,profit)*tax/100,nominal=preTax-paid,real=nominal/(1+infl/100);
  facts=[['Wert vor modellierten Steuern',money(preTax),''],['Hypothetische Steuerzahlung',money(paid),''],['Nominaler Endwert',money(nominal),''],['Kaufkraft zum Startzeitpunkt',money(real),''],['Reale Nettorendite',fmt((real/cap-1)*100)+' %','']];
  math='Endwert vor Steuer = Startwert × (1 + Bruttorendite) − Startwert × Modellkosten; danach nur positive modellierte Gewinne besteuern; reale Kaufkraft = Endwert/(1 + Inflation).';
  caution='Einjähriges fiktives Modell. Keine Aussage zum geltenden Steuerrecht; tatsächliche ETF-Renditen enthalten oft Fondskosten bereits, dann darfst du sie NICHT noch einmal abziehen.';
  summary='Reale Nettorendite '+fmt((real/cap-1)*100)+' %';
 }else if(id==='research'){
  const fields=['name','thesis','source','fact','counter','trigger','review'];
  for(const k of fields)if(String(v[k]||'').length>3000)throw Error('Eingabe zu lang: '+k);
  const missing=['thesis','source','fact','counter','trigger','review'].filter(k=>!String(v[k]||'').trim());
  if(v.source&&(!/^https:\/\/[a-z0-9.-]+(?:\/|$)/i.test(String(v.source))||String(v.source).includes('@')))throw Error('Bitte eine überprüfbare HTTPS-Quellenadresse verwenden.');
  if(v.review&&!/^\d{4}-\d{2}-\d{2}$/.test(String(v.review)))throw Error('Prüfdatum im Format JJJJ-MM-TT angeben.');
  facts=[['Prüfschritte ausgefüllt',6-missing.length+' von 6',''],['Offene Fragen',missing.length,'']];
  math='Audit-Ablauf: klare These → Primärquelle mit Datenperiode → Gegenargument → messbare Widerlegung → nächster Prüfzeitpunkt.';
  caution=missing.length?'Offene Felder: '+missing.join(', ')+'. Die Bewertung wird nicht von einer KI als wahr bestätigt.':'Vollständigkeit ist keine inhaltliche Verifikation. Prüfe Quelle und Gegenargument eigenständig.';
  summary='Research-Audit '+(6-missing.length)+'/6';
 }else throw Error('Nicht unterstütztes Werkzeug.');
 return {facts,math,caution,summary};
}
function selectOptions(){
 return (reports?.companies||[]).map(c=>'<option value="'+esc(c.symbol)+'">'+esc(c.name)+' · '+esc(c.period)+'</option>').join('');
}
async function loadReports(){
 if(reportLoading||reports)return reports;
 reportLoading=true;
 try{const r=await fetch(REPORT_URL,{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);const j=await r.json();if(!Array.isArray(j.companies))throw Error('Ungültige Berichtsdatei');reports=j;reportProblem='';}
 catch(e){reportProblem='Berichte konnten nicht geladen werden.';}
 finally{reportLoading=false;if(typeof state!=='undefined'&&state.view==='career')window.render?.()}
 return reports;
}
function reportView(symbol){
 const c=reports?.companies?.find(x=>x.symbol===symbol);
 if(!c)throw Error('Bericht nicht verfügbar; bitte aktualisieren.');
 const sourceUrl=typeof c.source?.url==='string'&&/^https:\/\//i.test(c.source.url)?c.source.url:null;
 const blocks=(c.report_sections||[]).map(sec=>{
  const rows=(sec.metrics||[]).filter(m=>Number.isFinite(m.value)).map(m=>{
   const comparable=Number.isFinite(m.previous)&&m.previous!==0&&m.previous_period&&m.period&&m.period!==m.previous_period;
   const diff=comparable?(m.kind==='ratio'?fmt(m.value-m.previous)+' Prozentpunkte':m.kind==='stock'?fmt(m.value-m.previous)+' '+m.unit+' (Stichtage)':fmt((m.value/m.previous-1)*100)+' %'):'—';
   return '<tr><td>'+esc(m.label)+'</td><td>'+esc(fmt(m.value)+' '+(m.unit||''))+'</td><td>'+esc(comparable?fmt(m.previous)+' '+m.unit:'—')+'</td><td>'+esc(diff)+'</td></tr>';
  }).join('');
  return '<details class="fp50-report-section"><summary>'+esc(sec.title)+' · '+(sec.metrics?.length||0)+' Kennzahlen</summary><p>'+esc(sec.description||'')+'</p>'+(rows?'<div class="fp50-table-wrap"><table><thead><tr><th>Kennzahl</th><th>Berichtet</th><th>Vergleich</th><th>Veränderung</th></tr></thead><tbody>'+rows+'</tbody></table></div>':'<p>Für diesen Abschnitt fehlen belastbare veröffentlichte Werte.</p>')+'</details>';
 }).join('');
 return '<h3>'+esc(c.name)+' · '+esc(c.period)+'</h3><p>Veröffentlicht: '+esc(c.published||'unbekannt')+' · Redaktionell geprüft: '+esc(c.verified_at||reports.verified_at||'nicht vermerkt')+' · Währung '+esc(c.currency||'unbekannt')+'</p>'+
 '<p>'+esc(c.report_overview?.summary||c.assessment||'Nur tatsächlich im Bericht enthaltene Werte.')+'</p>'+
 (sourceUrl?'<p><a href="'+esc(sourceUrl)+'" target="_blank" rel="noopener noreferrer">Offizielle Primärquelle öffnen</a></p>':'')+
 '<p><b>Vergleiche:</b> Berichtsflussgrößen nur für passende Vorjahresperioden; Stichtagswerte sind KEIN Quartalswachstum. Aufklappen zeigt jeden hinterlegten Wert. Für fehlende Daten keine Zahl erfinden.</p>'+blocks+
 '<p class="fp50-warning">'+esc(c.data_limitations||'Datenauswahl ist nicht zwingend vollständig; alle veröffentlichten Detailtabellen zusätzlich im Original prüfen.')+'</p>';
}
function fieldsHtml(d){
 return d.fields.map(([key,label,type,val])=>{
  if(type==='select')return '<label>'+esc(label)+'<select name="'+esc(key)+'" class="fp50-input">'+(selectOptions()||'<option value="">Berichte werden geladen …</option>')+'</select></label>';
  if(type==='textarea')return '<label>'+esc(label)+'<textarea name="'+esc(key)+'" rows="3" maxlength="3000" class="fp50-input">'+esc(val)+'</textarea></label>';
  return '<label>'+esc(label)+'<input name="'+esc(key)+'" class="fp50-input" type="'+(type==='number'?'text':type==='url'?'url':'text')+'" inputmode="'+(type==='number'?'decimal':'text')+'" autocomplete="off" value="'+esc(val)+'" maxlength="3000"></label>';
 }).join('');
}
function htmlResult(a){
 return '<div class="fp50-result"><h3>Deine Auswertung</h3><div class="fp50-metrics">'+a.facts.map(([label,value,unit])=>'<div><small>'+esc(label)+'</small><b>'+esc(value)+esc(unit?' '+unit:'')+'</b></div>').join('')+'</div><p><b>Rechenweg:</b> '+esc(a.math)+'</p><p class="fp50-warning">'+esc(a.caution)+'</p></div>';
}
function render(){
 const available=DEFS.filter(x=>gate(x.id).available).length;
 let html='<section class="fp50-toolbox"><div class="fp50-heading"><span class="eyebrow">FREISCHALTBARE RESEARCH-ARBEITSPLÄTZE</span><h2>Deine Analysten-Werkzeuge</h2><p>Keine Platzhalter: Du kannst rechnen, echte veröffentlichte Finanzzahlen prüfen, eigene Annahmen testen und Analysen speichern. Freischaltung nur nach serverbestätigtem Skillabschluss.</p><small>'+available+' / '+DEFS.length+' Zusatzwerkzeuge freigeschaltet · Alles ohne kostenpflichtige API</small></div><div class="fp50-grid">';
 for(const d of DEFS){const g=gate(d.id);html+='<button type="button" class="fp50-card'+(d.id===active?' active':'')+'" data-fp50-open="'+esc(d.id)+'"><b>'+esc(d.title)+'</b><small>'+esc(d.desc)+'</small><span>'+esc(g.available?'Verfügbar ›':'Freischaltbedingung ansehen ›')+'</span></button>';}
 html+='</div>';
 if(active&&def(active)){
  const d=def(active),g=gate(active);
  html+='<article class="fp50-panel"><div class="fp50-panel-top"><div><small>'+esc(d.tag)+'</small><h3>'+esc(d.title)+'</h3></div><button type="button" class="btn secondary" data-fp50-close>Schließen</button></div>';
  if(!g.available)html+='<p>'+esc(g.reason)+'</p><button type="button" class="btn secondary" data-fp50-learn>Zum passenden Skill</button>';
  else html+='<p>'+esc(d.desc)+'</p>'+(d.id==='report'&&reportProblem?'<p>'+esc(reportProblem)+'</p>':'')+
   '<form class="fp50-form" data-fp50-form="'+esc(d.id)+'"><div class="fp50-fields">'+fieldsHtml(d)+'</div><button class="btn" type="submit">'+(d.id==='report'?'Bericht prüfen':'Auswerten')+'</button></form>'+
   '<div class="fp50-result-slot" id="fp50-result" aria-live="polite">'+(output||'')+'</div><p class="fp50-feedback" id="fp50-feedback" role="status"></p>'+
   (d.id!=='report'?'<div class="fp50-actions"><button class="btn secondary" type="button" data-fp50-save>Analyse lokal speichern</button><button class="btn secondary" type="button" data-fp50-copy>Ergebnis kopieren</button></div>':'');
  html+='</article>';
 }
 if(user()&&history().length){
  html+='<details class="fp50-history"><summary>Meine gespeicherten Analysen ('+history().length+')</summary><p>Nur auf diesem Gerät und für dieses Konto gespeichert. Keine automatische Cloud-Synchronisierung; mit „Kopieren“ kannst du Ergebnisse sichern.</p>';
  for(const item of history().slice(0,12))html+='<button type="button" data-fp50-restore="'+esc(item.id)+'">'+esc(def(item.tool).title)+' · '+esc(item.summary)+' · '+esc(item.savedAt.slice(0,10))+'</button>';
  html+='</details>';
 }
 return html+'<p class="fp50-note">Die Werkzeuge sind Analysehilfen, keine Renditegarantie und keine Kaufempfehlung. Angaben zu Unternehmensberichten sind datiert, modellierte Werte ausdrücklich hypothetisch. Keine XP, FP oder virtuellen Aktienorders durch Werkzeugnutzung.</p></section>';
}
function currentValues(root){
 const form=root.querySelector('[data-fp50-form]');if(!form)throw Error('Bitte ein Werkzeug öffnen.');
 const v={};for(const el of form.querySelectorAll('[name]'))v[el.name]=el.value;
 return v;
}
function setFeedback(s){const out=document.getElementById('fp50-feedback');if(out)out.textContent=String(s);}
function bind(root=document){
 root.querySelectorAll('[data-fp50-open]').forEach(b=>b.addEventListener('click',()=>{active=b.dataset.fp50Open;output='';lastRaw=null;if(active==='report')loadReports();window.render?.();document.querySelector('.fp50-panel')?.scrollIntoView?.({block:'start',behavior:'smooth'});}));
 root.querySelector('[data-fp50-close]')?.addEventListener('click',()=>{active=null;output='';lastRaw=null;window.render?.()});
 root.querySelector('[data-fp50-learn]')?.addEventListener('click',()=>window.FinanzPilotNavigation?.route?.('skilllessons'));
 const form=root.querySelector('[data-fp50-form]');
 form?.addEventListener('submit',e=>{
  e.preventDefault();try{setFeedback('');const v=currentValues(root);lastRaw=null;
   if(active==='report'){output=reportView(v.symbol);lastRaw={tool:active,values:v,summary:'Bericht '+v.symbol};}
   else{const a=calc(active,v);output=htmlResult(a);lastRaw={tool:active,values:v,summary:a.summary,plain:a.facts.map(row=>row[0]+': '+row[1]+(row[2]?' '+row[2]:'')).join('\n')+'\n'+a.math+'\n'+a.caution};}
   const out=document.getElementById('fp50-result');if(out)out.innerHTML=output;
  }catch(err){setFeedback(err.message||'Bitte Eingaben korrigieren.');}
 });
 root.querySelector('[data-fp50-save]')?.addEventListener('click',()=>{try{if(!lastRaw||lastRaw.tool!==active)throw Error('Bitte zuerst eine gültige Analyse berechnen.');save(active,lastRaw.values,lastRaw.summary);setFeedback('Analyse lokal gespeichert. Du findest sie unten unter „Meine gespeicherten Analysen“.');}catch(e){setFeedback(e.message)}});
 root.querySelector('[data-fp50-copy]')?.addEventListener('click',async()=>{if(!lastRaw?.plain){setFeedback('Bitte zuerst eine Analyse berechnen.');return}try{await navigator.clipboard.writeText(def(active).title+'\n'+lastRaw.plain);setFeedback('Analyse in die Zwischenablage kopiert.')}catch{setFeedback('Kopieren nicht verfügbar. Verwende die angezeigten Ergebnisse.')}});
 root.querySelectorAll('[data-fp50-restore]').forEach(b=>b.addEventListener('click',()=>{const saved=history().find(x=>x.id===b.dataset.fp50Restore);if(!saved||!gate(saved.tool).available)return;active=saved.tool;output='';lastRaw=null;window.render?.();const form=document.querySelector('[data-fp50-form]');if(!form)return;for(const el of form.querySelectorAll('[name]'))if(Object.prototype.hasOwnProperty.call(saved.values,el.name))el.value=saved.values[el.name];}));
}
window.FinanzPilotToolbox={render,bind,gate,calc,reportView,loadReports,save,history,get active(){return active},get tools(){return DEFS}};
})();
