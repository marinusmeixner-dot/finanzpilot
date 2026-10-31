/* Quellenbasierte Aktienanalysen: historische datierte Unternehmenskennzahlen und nachvollziehbare Rechenschritte, keine erfundenen Kursziele. */
'use strict';
window.FinanzPilotResearch=(()=>{
 let research={analyses:[]},selected=localStorage.getItem('fp_research_selected_v7')||null,answers=JSON.parse(localStorage.getItem('fp_research_answers_v1')||'{}');
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fmt=n=>typeof n==='number'?n.toLocaleString('de-DE',{maximumFractionDigits:2}):esc(n);
 function cards(){const items=research.analyses||[];return `<section class="fp-research-section"><div class="section-title"><h2>Aktien im Detail analysieren</h2><small>Originalzahlen statt bloßer Kursprognosen</small></div><div class="fp-research-cards">${items.map(x=>`<article class="fp-stock-card"><span class="tag">${esc(x.ticker)}</span><h3>${esc(x.company)}</h3><p>${esc(x.summary)}</p><small>${esc(x.period)}</small><button class="btn secondary" data-fp-stock="${esc(x.id)}">Fundamentalanalyse und Fragen →</button></article>`).join('')}</div></section>`}
 function metrics(x){
   const arr=Array.isArray(x.figures)?x.figures:[];
   const val=(label)=>{const row=arr.find(v=>v[0]===label);return row?Number(row[1]):NaN};
   const p=(n)=>Number.isFinite(n)?n.toLocaleString('de-DE',{maximumFractionDigits:1})+' %':'nicht verfügbar';
   const rows=[];
   if(x.id==='microsoft'){
      rows.push(['Umsatzwachstum FY2026 ggü. FY2025',p((val('Umsatz FY2026')/val('Umsatz FY2025')-1)*100),'Umsatzvergleich aus den veröffentlichten Geschäftsberichten']);
      rows.push(['Operative Marge FY2026',p(val('Operativer Gewinn FY2026')/val('Umsatz FY2026')*100),'Operativer Gewinn dividiert durch Umsatz']);
   }else if(x.id==='nvidia'){
      rows.push(['Umsatzwachstum FY2026 ggü. FY2025',p((val('Umsatz FY2026')/val('Umsatz FY2025')-1)*100),'Historischer Umsatzvergleich']);
      rows.push(['Operative Marge FY2026',p(val('Operativer Gewinn FY2026')/val('Umsatz FY2026')*100),'Operativer Gewinn dividiert durch Umsatz']);
   }else if(x.id==='alphabet'){
      const revenue=val('Konzernumsatz Q3 2026'),operating=val('Operativer Konzerngewinn Q3 2026'),cloud=val('Google-Cloud-Umsatz Q3 2026');
      const ocf=val('Operating Cashflow Q3 2026'),capex=val('Sachanlageinvestitionen Q3 2026');
      rows.push(['Operative Konzernmarge Q3 2026',p(operating/revenue*100),'Operativer Gewinn / Umsatz; kein Segmentwert']);
      rows.push(['Cloud-Anteil am Konzernumsatz',p(cloud/revenue*100),'Cloud-Umsatz / Konzernumsatz, Q3 2026']);
      rows.push(['Free Cashflow Q3 2026',(Number.isFinite(ocf)&&Number.isFinite(capex)?(ocf-capex).toLocaleString('de-DE')+' Mio. USD':'nicht verfügbar'),'Operating Cashflow minus Sachanlageinvestitionen; negativer Wert möglich']);
   }else if(x.id==='siemens'){
      rows.push(['Umsatzwachstum FY2025 ggü. FY2024',p((val('Umsatz FY2025')/val('Umsatz FY2024')-1)*100),'Umsatzvergleich, kein aktuelles Geschäftsjahr']);
      rows.push(['FCF im Verhältnis zum Umsatz FY2025',p(val('Free Cashflow FY2025')/val('Umsatz FY2025')*100),'Nur eine Näherung, da der angegebene FCF gerundet ist']);
   }
   return rows.map(z=>`<div class="fp-metric-insight"><span>${esc(z[0])}</span><strong>${esc(z[1])}</strong><small>${esc(z[2])}</small></div>`).join('');
 }
 function researchMethod(x){return `<article class="card" style="margin-top:16px"><div class="top-label">ANALYSE · VERSTEHEN STATT RATEN</div><h2 style="margin:10px 0 16px">Was sagen die Zahlen?</h2><div class="fp-metrics-insights">${metrics(x)}</div><p class="footnote" style="margin-top:14px">Diese Kennzahlen sind aus den oben genannten Berichtszeiträumen berechnet. Sie sagen allein nichts darüber aus, ob der heutige Börsenkurs günstig ist.</p><h3 style="margin:20px 0 10px">Bewertung: was noch fehlt</h3><p>Für ein belastbares Kauf- oder Verkaufsurteil brauchen wir den aktuellen Börsenkurs mit Zeitstempel, Gewinn- und Cashflow-Schätzungen, Nettofinanzschulden, Peer-Vergleiche sowie optimistische und pessimistische Szenarien. Solange diese Daten fehlen, vergeben wir bewusst kein erfundenes Kursziel.</p><h3 style="margin:20px 0 10px">Drei Szenarien prüfen</h3><ul class="fp-stock-list"><li><b>Optimistisch:</b> Nachfrage und Kapitalrendite entwickeln sich besser als vom Markt erwartet.</li><li><b>Basisszenario:</b> Wachstum und Profitabilität liegen ungefähr im Rahmen der Erwartungen; die Bewertung bleibt entscheidend.</li><li><b>Pessimistisch:</b> Margendruck, Wettbewerb oder höhere Kapitalkosten drücken die erwarteten freien Cashflows.</li></ul><p class="footnote">Im längeren Analysekurs vertiefst du die Bewertungsmethoden mit Rechenaufgaben.</p></article>`}
 function render(){if(!selected)return '<div class="eyebrow">AKTIEN · ANALYSEN</div><h1>Unternehmen verstehen.</h1><p class="footnote">Wähle ein Unternehmen. Die Berichte zeigen historische, datierte Kennzahlen; keine aktuellen Kurse oder gesicherten Kauf- bzw. Verkaufssignale.</p>'+cards()+'<section class="card" style="margin-top:18px"><h3>Vertiefen</h3><p>Für vollständige Bewertungsmodelle, Multiples und Szenarien nutze die Intensivkurse.</p><button class="btn secondary" data-research-course style="margin-top:12px">Zu den Intensivkursen →</button></section>';const x=research.analyses.find(a=>a.id===selected)||research.analyses[0];if(!x)return `<div class="empty">Der recherchierte Aktienkatalog wird geladen. Keine aktuellen Zahlen erfinden.</div>`;
 return `<div class="fp-research-top"><button class="settings-btn" data-research-back>← Alle Aktienanalysen</button><span class="tag">Historische Unternehmensdaten</span></div><div class="eyebrow" style="margin-top:24px">AKTIENRECHERCHE · ${esc(x.ticker)} · ${esc(x.period)}</div><h1>${esc(x.company)} wirklich verstehen.</h1><p class="footnote">Alle Finanzdaten unten stammen aus einem datierten Unternehmensbericht. Der eigene Chart zeigt – sobald die Daten verfügbar sind – verzögerte Kursverläufe, nicht dieselbe Berichtsperiode.</p><div class="fp-research-layout"><section><article class="card"><div class="top-label">GESCHÄFTSMODELL</div><h2 style="margin:12px 0">Wo wird Geld verdient?</h2><p>${esc(x.business)}</p><div class="fp-report-grid">${x.figures.map(f=>`<div><small>${esc(f[0])}</small><strong>${fmt(f[1])}</strong><small>${esc(f[2])}</small></div>`).join('')}</div>${x.recent_update?`<div class="fp-recent-update"><div class="top-label">NEUER QUARTALSBERICHT</div><h3>${esc(x.recent_update.period)}</h3><ul>${x.recent_update.facts.map(row=>`<li>${esc(row[0])}: <b>${fmt(row[1])}</b></li>`).join("")}</ul><p>${esc(x.recent_update.note)}</p><a href="${esc(x.recent_update.source_url)}" target="_blank" rel="noopener noreferrer">Offiziellen Quartalsbericht öffnen ↗</a></div>`:""}<p class="fp-subtle">Quelle: <a href="${esc(x.source_url)}" target="_blank" rel="noopener noreferrer">${esc(x.source)} ↗</a></p></article><article class="card" style="margin-top:16px"><h2>Fundamentale Investmentthese</h2><p style="margin-top:12px">${esc(x.thesis)}</p><h3 style="margin-top:18px">Was könnte schiefgehen?</h3><ul class="fp-stock-list">${x.risks.map(z=>`<li>${esc(z)}</li>`).join('')}</ul><h3>Systematischer Prüfprozess</h3><ol class="fp-stock-list">${x.methods.map(z=>`<li>${esc(z)}</li>`).join('')}</ol></article>${researchMethod(x)}<article class="card" style="margin-top:16px"><div class="top-label">AKTIV LERNEN</div><h2 style="margin:10px 0">Zahlen prüfen, nicht raten</h2>${x.questions.map((q,qi)=>`<div class="fp-stock-q"><p><b>${qi+1}. ${esc(q.q)}</b></p><div class="fp-stock-options">${q.choices.map((v,i)=>`<button data-research-answer="${qi}:${i}" class="${answers[x.id+':'+qi]===i?'selected':''}">${String.fromCharCode(65+i)} · ${esc(v)}</button>`).join('')}</div><div class="fp-stock-feedback" id="fp-stock-feedback-${qi}">${Number.isInteger(answers[x.id+':'+qi])?`<div class="${answers[x.id+':'+qi]===q.correct?'result':'result bad'}"><b>${answers[x.id+':'+qi]===q.correct?'Richtig begründet.':'Noch nicht – vergleiche deine Rechnung.'}</b>${esc(q.why)}</div>`:''}</div></div>`).join('')}</article></section><aside>${window.FinanzPilotCharts?.html(x.symbol,x.company+' · Kursverlauf')||''}<section class="card" style="margin-top:16px"><div class="top-label">WICHTIG</div><h3 style="margin:10px 0">Befund ≠ Kaufempfehlung</h3><p>Ein gutes Unternehmen kann trotzdem eine überteuerte Aktie sein. Dein Urteil benötigt Marktkurs, Gewinnschätzungen, Bewertungsvergleich und Risiken.</p><button class="btn" data-research-course style="margin-top:15px">Mehrstufigen Analysekurs öffnen →</button></section></aside></div>`}

 function paint(toTop=false){const root=document.getElementById('view-root');if(!root||state.view!=='research')return;root.innerHTML=render();bind();bindCards(root);window.FinanzPilotCharts?.mount();if(toTop)window.scrollTo({top:0,behavior:'instant'});}
 function showList(){selected=null;localStorage.removeItem('fp_research_selected_v7');paint(true)}
 function bind(){
   document.querySelectorAll('[data-research-back]').forEach(b=>b.addEventListener('click',showList));
   document.querySelectorAll('[data-research-course]').forEach(b=>b.addEventListener('click',()=>(window.FinanzPilotNavigation?window.FinanzPilotNavigation.route('academy'):window.chooseView?.('academy'))));
   document.querySelectorAll('[data-research-answer]').forEach(b=>b.addEventListener('click',()=>{
     const [qi,opt]=b.dataset.researchAnswer.split(':').map(Number),x=research.analyses.find(a=>a.id===selected);
     if(!x)return;answers[x.id+':'+qi]=opt;localStorage.setItem('fp_research_answers_v1',JSON.stringify(answers));window.dispatchEvent(new Event('fp-progress-change'));
     const y=window.scrollY;paint();window.scrollTo({top:y,behavior:'instant'});
   }));
 }
 function bindCards(root=document){root.querySelectorAll('[data-fp-stock]').forEach(b=>b.addEventListener('click',()=>{
   selected=b.dataset.fpStock;localStorage.setItem('fp_research_selected_v7',selected);
   if(state.view!=='research'){state.view='research';window.render?.();window.scrollTo({top:0,behavior:'instant'})}
   else paint(true);
 }))}
 async function load(){try{const r=await fetch('./data/research.json?c='+Date.now(),{cache:'no-store'});if(r.ok){const obj=await r.json();if(Array.isArray(obj.analyses))research=obj}}catch{}
   if(['academy','research'].includes(state.view))window.render?.();
 }
  document.addEventListener('DOMContentLoaded',load,{once:true});
 return {cards,render,bind,bindCards,load};
})();