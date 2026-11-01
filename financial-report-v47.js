/* FinanzPilot v47 – Source-based, sectioned financial statements.
   No portfolio actions and no invented metrics. */
(function(){
'use strict';
let active='',searchTerm='';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const date=d=>/^\d{4}-\d{2}-\d{2}$/.test(d||'')?d.slice(8,10)+'.'+d.slice(5,7)+'.'+d.slice(0,4):String(d||'unbekannt');
const safeUrl=s=>{try{const u=new URL(String(s));return u.protocol==='https:'?u.href:null}catch{return null}};
const fmt=n=>Number.isFinite(Number(n))?new Intl.NumberFormat('de-DE',{maximumFractionDigits:3}).format(Number(n)):'–';
const latest=(a,b)=>String(a?.period_end||'').localeCompare(String(b?.period_end||''))>=0?a:b;
const difference=m=>{
 if(m.previous===null||m.previous===undefined||!Number.isFinite(Number(m.previous))||!Number.isFinite(Number(m.value)))return '–';
 const change=Number(m.value)-Number(m.previous);
 if(m.kind==='ratio'||m.unit==='%')return (change>0?'+':'')+fmt(change)+' Pp.';
 if(Number(m.previous)===0||Math.sign(Number(m.previous))!==Math.sign(Number(m.value)))return (change>0?'+':'')+fmt(change)+' '+esc(m.unit)+' (absolut)';
 const pct=(change/Math.abs(Number(m.previous)))*100;
 return (pct>0?'+':'')+fmt(pct)+' %';
};
function sectionTable(section){
 const rows=section.metrics||[];
 if(!rows.length)return '<p class="fp47-missing">Für diesen Bereich wurden im betreffenden Quartal keine belastbaren Zahlen veröffentlicht. Keine geschätzten oder aus älteren Berichten kopierten Werte.</p>';
 return '<div class="fp47-table-scroll" tabindex="0" role="region" aria-label="'+esc(section.title)+' – Kennzahlentabelle, horizontal scrollbar">'+
 '<table class="fp47-kpi-table"><thead><tr><th scope="col">Kennzahl</th><th scope="col">Aktuell</th><th scope="col">Vergleich</th><th scope="col">Veränderung</th></tr></thead><tbody>'+
 rows.map(m=>{
 const forecast=m.kind==='forecast',derived=m.kind==='derived',isStock=m.kind==='stock',validPrev=m.previous!==null&&m.previous!==undefined&&Number.isFinite(Number(m.previous));
 return '<tr data-fp47-row="'+esc(m.label.toLocaleLowerCase('de-DE'))+'"><th scope="row">'+esc(m.label)+
 (forecast?'<span class="fp47-kind forecast">Prognose</span>':derived?'<span class="fp47-kind derived">Berechnet</span>':isStock?'<span class="fp47-kind stock">Stichtag</span>':'')+
 (m.note?'<small class="fp47-row-note">'+esc(m.note)+'</small>':'')+
 '<small class="fp47-row-period">'+esc(m.period||'')+'</small></th>'+
 '<td class="fp47-number"><strong>'+fmt(m.value)+'</strong> <small>'+esc(m.unit||'')+'</small></td>'+
 '<td class="fp47-number">'+(validPrev?'<strong>'+fmt(m.previous)+'</strong> <small>'+esc(m.unit||'')+'</small><small class="fp47-compare-date">'+esc(m.previous_period||'Vergleichsperiode')+'</small>':'<span class="fp47-no-value">Nicht angegeben</span>')+'</td>'+
 '<td class="fp47-number">'+(validPrev?difference(m):'–')+'</td></tr>';
 }).join('')+'</tbody></table></div>';
}
function blocks(r){
 return (r.report_sections||[]).map((section,i)=>
 '<details class="fp47-section" '+(i===0||i===1?'open':'')+' data-fp47-section="'+esc(section.id)+'"><summary>'+
 '<span><b>'+esc(section.title)+'</b><small>'+esc(section.description||'')+'</small></span>'+
 '<span class="fp47-section-count">'+(section.metrics?.length||0)+' Kennzahlen</span></summary>'+
 sectionTable(section)+'</details>').join('');
}
function render(props){
 const watch=Array.isArray(props.watch)?props.watch:[],records=Array.isArray(props.reports)?props.reports:[],loggedIn=!!props.loggedIn;
 if(!loggedIn)return '<div class="fp34 fp47-report"><h1>Finanzberichte & Kennzahlen</h1><p>Deine persönlichen Watchlist-Titel sind nach Anmeldung sichtbar. Die Berichte selbst basieren auf öffentlichen Originalveröffentlichungen.</p><button class="btn" data-fp34-login>Anmelden</button></div>';
 const list=watch.map(w=>({symbol:w.symbol,name:props.nameOf?.(w.symbol)||w.symbol,report:records.filter(r=>r.symbol===w.symbol).reduce((a,b)=>a?latest(a,b):b,null)}));
 const current=list.find(x=>x.symbol===active)||list[0];
 if(!current)return '<section class="fp34 fp47-report"><h1>Unternehmensberichte & Kennzahlen</h1><p>Deine Watchlist ist leer. Lege im Depot zuerst eine Aktie auf die Merkliste.</p><button type="button" class="btn secondary" data-fp34-depot>Zum Depot</button></section>';
 active=current.symbol;
 const r=current.report;
 let body='<div class="fp47-head"><span class="eyebrow">MÄRKTE · FINANZBERICHTE DEINER WATCHLIST</span><h1>Unternehmen wirklich verstehen</h1><p>Alle aus den zuletzt geprüften, veröffentlichten Berichten übernommenen Kennzahlen – mit genauer Vergleichsperiode, nachvollziehbarer Quelle, Unternehmensausblick und Einordnung. Kein Live-Fundamentaldatenfeed.</p><small>Letzte redaktionelle Dateiprüfung: '+esc(date(props.verifiedAt||props.generatedAt))+' · Aktualisieren lädt die vorhandene Datei neu, recherchiert aber keine neuen Zahlen.</small></div>'+
 '<div class="fp47-company-switch" role="group" aria-label="Unternehmen wählen">'+list.map(x=>'<button type="button" data-fp47-company="'+esc(x.symbol)+'" class="'+(x.symbol===current.symbol?'selected':'')+'" aria-pressed="'+(x.symbol===current.symbol)+'">'+esc(x.name)+' <small>'+esc(x.symbol)+'</small></button>').join('')+'</div>';
 if(!r)return '<section class="fp34 fp47-report">'+body+'<div class="fp47-unavailable"><h2>'+esc(current.name)+'</h2><p>Für diese Watchlist-Aktie liegt noch kein verifizierter umfangreicher Bericht im redaktionellen Datenbestand. Die tägliche Aufgabe soll neue Finanzberichte recherchieren. Zahlen anderer Titel oder Börsenplätze werden nicht stillschweigend übernommen.</p><button class="btn secondary" data-fp45-refresh>Datei neu laden</button></div></section>';
 const ov=r.report_overview||{},sections=r.report_sections||[],count=sections.reduce((a,s)=>a+(s.metrics?.length||0),0),limited=r.completeness==='eingeschraenkt';
 body+='<article class="fp47-report-body"><header class="fp47-company-head"><div><span class="eyebrow">'+(limited?'EINGESCHRÄNKTER BERICHT':'LETZTER VERIFIZIERTER BERICHT')+'</span><h2>'+esc(r.name)+'</h2><p>'+esc(r.period)+' · Ende '+esc(date(r.period_end))+' · veröffentlicht '+esc(date(r.published))+' · '+count+' verifizierte Datenpositionen</p>'+
 '<small>Geprüft: '+esc(date(r.verified_at))+' · Originalwährung '+esc(r.currency)+'</small></div><div class="fp47-report-actions"><button class="btn secondary" data-fp34-chart="'+esc(r.symbol)+'">Kurschart</button><button class="btn secondary" data-fp45-refresh>Berichtdaten neu laden</button></div></header>'+
 (limited?'<div class="fp47-critical" role="status"><b>Wichtige Berichtsgrenze</b><p>Das Unternehmen veröffentlichte zuletzt nur eingeschränkte Quartalsdaten. Die fehlenden Gewinn-, Bilanz- und Cashflowgrößen sind keine Nullen und werden nicht durch frühere Zahlen ersetzt.</p></div>':'')+
 '<section class="fp47-executive"><h3>Das Wichtigste verstehen</h3><p>'+esc(ov.summary||r.assessment||'')+'</p><div class="fp47-takeaways">'+
 '<div><h4>Was positiv auffällt</h4><ul>'+((ov.positives||[]).map(x=>'<li>'+esc(x)+'</li>').join('')||'<li>Noch keine ausreichend überprüfte positive Entwicklung.</li>')+'</ul></div>'+
 '<div><h4>Was kritisch bleibt</h4><ul>'+((ov.negatives||r.risks||[]).map(x=>'<li>'+esc(x)+'</li>').join('')||'<li>Weitere Berichtsdaten prüfen.</li>')+'</ul></div></div></section>'+
 '<div class="fp47-kpi-tools"><div><h3>Berichtszahlen im Detail</h3><p>'+count+' veröffentlichte oder ausdrücklich gekennzeichnet abgeleitete Werte in '+sections.length+' Bereichen.</p></div>'+
 '<label class="fp47-filter-label" for="fp47-kpi-filter">Kennzahl suchen<input id="fp47-kpi-filter" type="search" data-fp47-search placeholder="z. B. Umsatz, Cashflow, Schulden"></label></div>'+
 '<div class="fp47-sections">'+blocks(r)+'</div>'+
 '<section class="fp47-interpretation"><h3>Einordnung der Ergebnisse</h3><p>'+esc(r.assessment||'')+'</p>'+
 '<h4>Darauf bei der nächsten Veröffentlichung achten</h4><ul>'+((ov.watch||r.risks||[]).map(x=>'<li>'+esc(x)+'</li>').join(''))+'</ul></section>'+
 ((r.data_limitations||[]).length?'<details class="fp47-limitations"><summary>Definitionen, Datenlücken und Grenzen</summary><ul>'+r.data_limitations.map(t=>'<li>'+esc(t)+'</li>').join('')+'</ul>'+
 '<p><b>Wichtig:</b> Berichtetes Ergebnis, bereinigte Größen, Stichtagswerte, einzelne Quartale, kumulierte Zeiträume und eigene Rechenwerte werden nicht als identische Kennzahlen dargestellt. Kurse und Bewertungsmultiples sind keine Positionen des Geschäftsberichts.</p></details>':'')+
 '<section class="fp47-sources"><h3>Originalquellen & Prüfdatum</h3><p>Jede Kennzahl ist aus den angegebenen offiziellen Veröffentlichungen übernommen oder als eigene Berechnung gekennzeichnet.</p>'+
 (r.sources||[r.source]).map(s=>safeUrl(s?.url)?'<a href="'+esc(safeUrl(s.url))+'" target="_blank" rel="noopener noreferrer">'+esc(s.title||'Offizielle Finanzveröffentlichung')+'</a>':'').join('')+'</section></article>';
 return '<section class="fp34 fp47-report">'+body+'</section>';
}
function bind(root=document){
 root.querySelectorAll('[data-fp47-company]').forEach(b=>b.addEventListener('click',()=>{active=b.dataset.fp47Company;searchTerm='';window.render?.()}));
 const input=root.querySelector('[data-fp47-search]');
 if(input){
  input.value=searchTerm;
  const filter=()=>{
   searchTerm=String(input.value||'').toLocaleLowerCase('de-DE').trim();
   root.querySelectorAll('.fp47-section').forEach(section=>{
    const rows=[...section.querySelectorAll('[data-fp47-row]')];
    let shown=0;
    rows.forEach(row=>{const yes=!searchTerm||row.textContent.toLocaleLowerCase('de-DE').includes(searchTerm);row.hidden=!yes;if(yes)shown++});
    section.hidden=!!searchTerm&&shown===0;
    if(searchTerm&&shown)section.open=true;
   });
  };
  input.addEventListener('input',filter);
  if(searchTerm)filter();
 }
}
window.FinanzPilotFinancialReports={render,bind};
})();