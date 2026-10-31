(function installFinanzPilotIdeas(){
'use strict';
window.FinanzPilotIdeas=(()=>{
 let ideas=null;
 const esc=s=>String(s??'').replace(/[&<>"']/g,k=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[k]));
 function html(){
  if(!ideas?.length)return '<section class="card fp-watchlist"><div class="top-label">RESEARCH WATCHLIST</div><h2>Welche Aktien könnten interessant sein?</h2><p>Recherchierte Ideen werden geladen. Keine automatischen Kaufempfehlungen.</p></section>';
  return `<section class="fp-ideas"><div class="section-title"><div><h2>Research-Watchlist</h2><small>Ungewöhnliche Geschäftsmodelle · echte Unternehmenszahlen · keine Kaufempfehlungen</small></div></div><div class="fp-ideas-grid">${ideas.map(x=>`<article class="fp-idea"><div class="fp-idea-top"><span class="tag">${esc(x.ticker)}</span><span class="fp-idea-date">${esc(x.date||'')}</span></div><h3>${esc(x.company)}</h3><p class="fp-idea-sector">${esc(x.sector)}</p><p>${esc(x.interest)}</p><details><summary>Risiko, nächste Frage und Originalquelle</summary><p><b>Gegenthese:</b> ${esc(x.counter)}</p><p><b>Zahl/Fakt:</b> ${esc(x.metric)}</p><p><b>Nächste Prüfung:</b> ${esc(x.next)}</p><a href="${esc(x.source)}" target="_blank" rel="noopener noreferrer">Originalquelle öffnen ↗</a></details>${x.id==='kion'?'<button class="btn secondary" data-idea-course="kion-deep-valuation-2026">20-Schritte-Kurs öffnen →</button>':'<button class="btn secondary" data-idea-request="'+esc(x.ticker)+'">Ausführliche Analyse anfordern →</button>'}<small class="fp-idea-status">${esc(x.status)}</small></article>`).join('')}</div></section>`;
 }
 async function load(){
  try{const r=await fetch('./data/ideas.json?cb='+Date.now(),{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);const d=await r.json();ideas=Array.isArray(d.ideas)?d.ideas:[]}
  catch{ideas=[]}
  if(typeof state!=='undefined'&&state.view==='academy')window.render?.();
 }
 document.addEventListener('click',ev=>{
  const btn=ev.target.closest('[data-idea-course],[data-idea-request]');if(!btn)return;
  ev.preventDefault();
  if(btn.dataset.ideaCourse){
    const id=btn.dataset.ideaCourse;
    window.FinanzPilotAcademy?.openCourse(id);
  }else{
    window.FinanzPilotNavigation?.route('academy');
    setTimeout(()=>{const e=document.querySelector('#academy-request-form [name="ticker"]');if(e){e.value=btn.dataset.ideaRequest;e.focus()}},0);
  }
 });
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load();
 return{html};
})();
})();
