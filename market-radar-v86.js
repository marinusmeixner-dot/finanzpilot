/* FinanzPilot v86 · Dynamic equity idea discovery, ETF comparisons and thesis-monitor history. */
(function(){
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const fmt=(n,p=1)=>typeof n==='number'&&Number.isFinite(n)?new Intl.NumberFormat('de-DE',{maximumFractionDigits:p}).format(n):'–';
const pct=(n,unit=' %')=>typeof n==='number'&&Number.isFinite(n)?(n>0?'+':'')+fmt(n,1)+unit:'noch offen';
const safe=u=>{try{const x=new URL(String(u));return x.protocol==='https:'?x.href:null}catch{return null}};
const link=(u,label)=>safe(u)?'<a href="'+esc(safe(u))+'" target="_blank" rel="noopener noreferrer">'+esc(label)+' ↗</a>':'';
const priority={
 A_research_first:'Vertiefte Recherche sinnvoll',
 B_watchlist:'Beobachten und prüfen',
 C_screen_only:'Nur Screening-Signal',
 insufficient_data:'Kursreihe fehlt',
 archived:'Archivierte These'
};
let candidates=[],ledger=[],benchmarkInfo=[],front=[],meta={},view='priority',loaded=false,busy=false,lastLoad=0,error='';
let tracked=new Set();
try{const x=JSON.parse(localStorage.getItem('fp86_tracked_v1')||'[]');if(Array.isArray(x))tracked=new Set(x.filter(y=>typeof y==='string').slice(0,300))}catch{}
function saveTracked(){try{localStorage.setItem('fp86_tracked_v1',JSON.stringify([...tracked]))}catch{}}
function get(id){return candidates.find(c=>c.id===id||c.curated_id===id||c.ticker===id)||null}
function findByTicker(ticker){
 const t=String(ticker||'').toUpperCase().split(':').at(-1);
 return candidates.find(c=>c.ticker===t||c.ticker.split('.')[0]===t?.split('.')[0])||null;
}
function sourceContext(c){
 if(c.editorial_evidence){
  const e=c.editorial_evidence;
  return '<div class="fp86-source"><strong>Veröffentlichte FinanzPilot-Recherche · '+esc(e.date||'Datum prüfen')+'</strong><p>'+esc(e.title||'Unternehmensmeldung')+'</p>'+link(e.url,'Originalquelle des Artikels')+'</div>';
 }
 return '<div class="fp86-source fp86-unproven"><strong>Unternehmens-Katalysator noch nicht belegt</strong><p>Der Algorithmus hat bislang nur eine Marktkurs-Konstellation identifiziert. Ohne Unternehmensbericht, Ergebnis- oder Auftragsdaten entsteht daraus keine Investmentthese.</p></div>';
}
function perf(c){
 const m=c.signals||{};
 return m.status==='history_available'?
 '<div class="fp86-kpis">'+
 '<div><small>21 Handelstage</small><strong>'+pct(m.return_21d_pct)+'</strong></div>'+
 '<div><small>63 Handelstage</small><strong>'+pct(m.return_63d_pct)+'</strong></div>'+
 '<div><small>Zum globalen ETF (63 Tage)</small><strong>'+pct(m.relative_63d_pp,' %-Punkte')+'</strong></div>'+
 '<div><small>Schlusskursreihe vom</small><strong>'+esc(m.asof||'unbekannt')+'</strong></div>'+
 '</div>':'<p class="fp86-no-price">Es liegt noch keine ausreichend lange Kursreihe vor. Keine Performance- oder Marktvergleichsaussage möglich.</p>';
}
function sourceTag(c){
 if(c.editorial_evidence)return Number.isFinite(c.editorial_age_days)&&c.editorial_age_days>35?
  'Älterer redaktioneller Anlass – neue Zahlen prüfen':'Nachvollziehbarer redaktioneller Anlass';
 return c.unverified_discovery_hint?'Ungeprüfter Hinweis – keine Investmentthese':'Noch kein belegter Unternehmensanlass';
}
function catalyst(c){
 const e=c.editorial_evidence;
 if(!e)return '<div class="fp88-catalyst fp88-catalyst-unchecked"><strong>Warum auf dem Radar?</strong><p>Aktuell nur Kurs- und Branchen-Screening. Ein belastbarer Geschäftskatalysator und eine Bewertung müssen unabhängig recherchiert werden.</p></div>';
 const old=Number.isFinite(c.editorial_age_days)&&c.editorial_age_days>35;
 return '<div class="fp88-catalyst"><strong>'+(old?'Älterer recherchierter Anlass':'Warum jetzt prüfen?')+'</strong>'+
 '<p>'+esc(e.title||'Unternehmensmeldung')+'</p>'+
 '<small>Veröffentlicht: '+esc(e.date||'Datumsprüfung nötig')+(old?' · Nicht mehr als neues Ereignis gewertet':'')+'</small>'+
 link(e.url,'Beleg der redaktionellen Meldung')+'</div>';
}
function card(c){
 const p=c.research_priority,ready=c.signals?.status==='history_available';
 const badge='<span class="fp86-status fp86-status-'+esc(p)+'">'+esc(priority[p]||'Recherche offen')+'</span>';
 const k=ready?'<div class="fp86-pills"><span>63 Tage '+pct(c.signals.return_63d_pct)+'</span>'+
 '<span>vs. Welt-ETF '+pct(c.signals.relative_63d_pp,' pp')+'</span></div>':'<div class="fp86-pills"><span>Kursdaten werden geprüft</span></div>';
 const blurb=c.risks||'Risiko, Geschäftsmodell, Bilanz und aktuelle Bewertung sind noch eigenständig zu prüfen.';
 return '<article class="fp86-card">'+
 '<div class="fp86-card-top"><span class="fp86-symbol">'+esc(c.ticker)+'</span>'+badge+'</div>'+
 '<h3>'+esc(c.company)+'</h3><p class="fp86-sector">'+esc(c.sector||'Branche prüfen')+' · '+esc(c.currency||'Währung prüfen')+'</p>'+
 k+(window.FinanzPilotDecisions?.badge?.(c.id)||'')+'<p class="fp86-proof">'+esc(sourceTag(c))+'</p>'+catalyst(c)+
 '<p class="fp86-risk"><strong>Gegenprüfung:</strong> '+esc(blurb)+'</p>'+
 '<div class="fp86-actions"><button type="button" data-fp86-open="'+esc(c.id)+'">'+(c.has_curated_dossier?'Analyse ansehen':'Recherche ansehen')+'</button>'+
 '<button type="button" class="fp86-soft" aria-pressed="'+tracked.has(c.id)+'" data-fp86-track="'+esc(c.id)+'">'+(tracked.has(c.id)?'Gemerkt ✓':'Merken')+'</button></div></article>';
}
function benchmark(c){
 const rows=(c.benchmarks||[]).filter(x=>x.return_63d_pct!=null).slice(0,4);
 if(!rows.length)return '<p>Für eine saubere vergleichbare ETF-Rendite fehlen noch passende, datierte Kursreihen derselben Währung.</p>';
 return '<div class="fp86-compare-grid">'+rows.map(b=>'<div class="fp86-compare-item"><strong>'+esc(b.name)+'</strong>'+
 '<span>'+pct(b.return_63d_pct)+'</span><small>Aktie gegenüber ETF: '+pct(b.excess_return_pp,' %-Punkte')+'</small></div>').join('')+'</div>'+
 '<p class="fp86-caveat">Renditen über die letzten 63 Handelstage auf Basis vom Anbieter bereinigter Tageskurse derselben Notierungswährung. Keine Währungsumrechnung; historische Rendite, Risiko, Indexgewichtung und ETF-Kosten können sich unterscheiden. Kein Kaufsignal.</p>';
}
function peerComparison(c){
 const same=candidates.filter(x=>x.id!==c.id&&x.sector===c.sector&&x.currency===c.currency&&x.signals?.status==='history_available').slice(0,3);
 if(!same.length)return '';
 return '<div class="fp86-peer"><h3>Andere Unternehmen derselben Branche</h3>'+
 '<div class="fp86-peer-rows">'+same.map(x=>'<button type="button" data-fp86-open="'+esc(x.id)+'"><span>'+esc(x.company)+'</span><strong>'+pct(x.signals.return_63d_pct)+'</strong></button>').join('')+'</div>'+
 '<p class="fp86-caveat">Ein Vergleich der Kursentwicklung ist noch kein fairer Bewertungsvergleich. Margen, Verschuldung und Geschäftsmodell müssen zusätzlich vergleichbar sein.</p></div>';
}
function history(c){
 const matches=ledger.filter(e=>e.ticker===c.ticker).slice(-8).reverse();
 const performance=c.since_first_screen;
 return '<section class="fp86-history"><h3>Thesenverlauf: Was hat sich seit der ersten Beobachtung verändert?</h3>'+
 (performance?'<div class="fp86-scoreboard"><div><small>Seit '+esc(performance.first_seen)+'</small><strong>'+pct(performance.adjusted_return_pct)+'</strong></div>'+
 '<div><small>Passender ETF</small><strong>'+pct(performance.benchmark_return_pct)+'</strong></div>'+
 '<div><small>Relative Entwicklung</small><strong>'+pct(performance.relative_to_benchmark_pp,' %-Punkte')+'</strong></div></div>'+
 '<p class="fp86-caveat">Öffentliche Beobachtungsperformance ab erstem Radar-Signal, kein Kaufzeitpunkt und keine Depotperformance.</p>':'<p>Eine vergleichbare Performance seit Erstbeobachtung liegt noch nicht vor.</p>')+
 (matches.length?'<div class="fp86-events">'+matches.map(e=>'<div class="fp86-event"><span>'+esc(e.date)+'</span><strong>'+esc(({entered_radar:'Erstmals im Radar',priority_changed:'Research-Priorität verändert',new_editorial_evidence:'Neue redaktionelle Quelle',archived:'Archiviert'})[e.event_type]||e.event_type)+'</strong><small>'+esc(priority[e.priority]||'')+'</small>'+(e.evidence_url?' '+link(e.evidence_url,'Beleg'):'')+'</div>').join('')+'</div>':'<p>Noch kein gespeicherter Rechercheverlauf.</p>')+
 '</section>';
}
function rowsForView(){
 if(view==='all')return candidates.filter(x=>x.lifecycle!=='archived');
 if(view==='tracked')return candidates.filter(x=>tracked.has(x.id));
 if(view==='archived')return candidates.filter(x=>x.lifecycle==='archived');
 if(['history','decision','compare'].includes(view))return [];
 const selected=new Set(front);
 return candidates.filter(c=>selected.has(c.id)&&c.lifecycle!=='archived');
}
function dashboard(){
 const results=rowsForView();
 const tabs=[['priority','Recherche-Chancen'],['decision','Investmentprüfung'],['compare','Aktien vergleichen'],['all','Alle Unternehmen'],['tracked','Gemerkt'],['history','Thesenverlauf'],['archived','Archiv']];
 return '<section class="fp86-dashboard"><div class="fp86-hero"><span class="eyebrow">INVESTMENTRESEARCH · DYNAMISCHER MARKTSCAN</span>'+
 '<h2>Neue Aktien entdecken – unabhängig von deiner Watchlist</h2>'+
 '<p>Der Radar sucht laufend in mehreren Branchen und Märkten nach Unternehmen, die weitere Analyse verdienen. Ein technisches Signal ist keine günstige Bewertung. Neue Unternehmen beginnen ausdrücklich als Prüfkandidaten.</p>'+
 '<div class="fp86-stats"><div><strong>'+meta.total_issuers+'</strong><small>Unternehmen im Suchuniversum</small></div>'+
 '<div><strong>'+meta.with_price_history+'</strong><small>Mit ausreichender Historie</small></div>'+
 '<div><strong>'+meta.research_priority_count+'</strong><small>Hohe Research-Priorität</small></div>'+
 '<div><strong>'+meta.missing_quote_count+'</strong><small>Kursdaten noch offen</small></div></div>'+
 '<p class="fp86-date">Kursstand der Radarreihe: '+esc(meta.asof||'noch nicht verfügbar')+' · keine Realtime-Daten</p></div>'+
 (view==='priority'?(window.FinanzPilotPriorities?.summary?.()||''):'')+
 '<div class="fp86-tabs" role="group" aria-label="Aktienradar durchsuchen">'+tabs.map(([k,label])=>'<button type="button" data-fp86-tab="'+k+'" aria-pressed="'+(view===k)+'">'+label+'</button>').join('')+'</div>'+
 (view==='history'?renderHistoryBoard():view==='decision'?(window.FinanzPilotDecisions?.board?.()||'<p>Investmentprüfung lädt …</p>'):view==='compare'?(window.FinanzPilotDecisions?.comparison?.()||'<p>Aktienvergleich lädt …</p>'):results.length?'<div class="fp86-grid">'+results.slice(0,view==='all'?120:50).map(card).join('')+'</div>':'<p class="fp86-empty">In dieser Ansicht gibt es derzeit keine geprüften Einträge. Die Radarhistorie wird beim nächsten sachlichen Signalwechsel ergänzt.</p>')+
 '<div class="fp86-method"><h3>Warum erscheint eine Aktie hier?</h3><p>Der Scanner berücksichtigt 50-/200-Tage-Trends, 63-Tage-Relative Performance, historische Schwankungen und – falls vorhanden – eine maximal 35 Tage alte, veröffentlichte, redaktionell eingeordnete Unternehmensmeldung. Eine A-Priorität heißt ausschließlich <strong>„zuerst recherchieren“</strong>, nicht „kaufen“. ETF-Alternativen, Cashflow, reale Verschuldung und Bewertung müssen separat geprüft werden.</p><p>Das Ausgangsuniversum ist offen: neue Unternehmen aus der gepflegten Unternehmensliste und veröffentlichten Berichten werden ergänzt. Bei fehlender Kursreihe zeigt die App bewusst keinen erfundenen Score.</p></div></section>';
}
function renderHistoryBoard(){
 const rows=ledger.slice(-40).reverse();
 return '<div class="fp86-history-board"><h3>Öffentliches, unveränderlich angehängtes Research-Protokoll</h3>'+
 '<p>Zeigt, wann Unternehmen erstmals erschienen, ihre technische Research-Priorität wechselte oder eine neue geprüfte Nachricht vorlag. Persönliche Investmentthesen bleiben davon getrennt.</p>'+
 (rows.length?rows.map(e=>'<div class="fp86-history-row"><strong>'+esc(e.company)+'</strong><span>'+esc(e.date)+'</span><span>'+esc(({entered_radar:'Aufgenommen',priority_changed:'Priorität geändert',new_editorial_evidence:'Quelle ergänzt',archived:'Archiviert'})[e.event_type]||'Überprüft')+'</span>'+
 '<small>'+esc(priority[e.priority]||e.priority)+'</small>'+(e.evidence_url?link(e.evidence_url,'Originalquelle'):'')+'</div>').join(''):'<p>Noch kein bestätigter historischer Zustandswechsel.</p>')+
 '</div>';
}
function candidateDetail(id){
 const c=get(id);if(!c)return '<section class="fp86-dashboard"><h2>Research-Kandidat nicht gefunden</h2><p>Der Titel wurde möglicherweise neu einsortiert. Zurück zum Aktienradar.</p><button type="button" data-fp86-ideas>Zur Übersicht</button></section>';
 return '<section class="fp86-detail"><div class="fp86-detail-head"><span class="eyebrow">NEUER RESEARCH-KANDIDAT · '+esc(c.ticker)+'</span>'+
 '<button type="button" class="fp86-back" data-fp86-ideas>← Aktienideen</button></div>'+
 '<h1>'+esc(c.company)+'</h1><p>'+esc(c.sector)+' · '+esc(c.currency)+' · '+esc(priority[c.research_priority]||'Weitere Prüfung nötig')+'</p>'+
 '<div class="fp86-warning">Dies ist eine automatisch erkannte Research-Konstellation, <strong>noch keine vollständige Fundamentalanalyse oder Kaufempfehlung</strong>. Unternehmensmeldungen sind von Prognosen zu unterscheiden; keine Kursziele ohne Quellenprüfung.</div>'+
 '<section class="fp86-section"><h2>Was hat die Aktie auffällig gemacht?</h2>'+perf(c)+sourceContext(c)+
 '<p><strong>Fachliche nächste Prüfung:</strong> '+esc(c.next_review)+'</p></section>'+
 (window.FinanzPilotDecisions?.researchOnly?.(c.id)||'')+
 (window.FinanzPilotPriorities?.detail?.(c.id)||'')+
 '<section class="fp86-section"><h2>Welche ETF-Alternative gibt es?</h2>'+benchmark(c)+'</section>'+
 peerComparison(c)+
 '<section class="fp86-section"><h2>Was fehlt für ein tatsächliches Investmenturteil?</h2>'+
 '<ol><li>Geschäftsmodell, Marktstellung und Ertragsquellen aus dem aktuellen Geschäftsbericht prüfen</li>'+
 '<li>Operativen Cashflow, Investitionen und Nettoschulden aus Primärquellen abstimmen</li>'+
 '<li>Bewertung gegenüber tatsächlichem Aktienkurs und vergleichbaren Unternehmen nachvollziehen</li>'+
 '<li>Negativ-, Basis- und Positivszenario und Gründe für eine widerlegte These festhalten</li></ol>'+
 '<div class="fp86-actions"><button type="button" data-fp86-theses="'+esc(c.id)+'">Eigene Investmentthese erfassen</button>'+
 '<button type="button" class="fp86-soft" data-fp86-track="'+esc(c.id)+'">'+(tracked.has(c.id)?'Aus Merkliste lösen':'Für Research merken')+'</button></div></section>'+
 history(c)+'</section>';
}
function addendum(id){
 const c=get(id);
 if(!c)return '';
 return '<section class="fp86-addendum"><span class="eyebrow">MARKTVERGLEICH UND LAUFENDE THESENKONTROLLE</span>'+
 '<h2>Ist diese Aktie interessanter als die Alternativen?</h2>'+
 '<p>Die Kombination aus tatsächlichen Finanzkennzahlen, Bewertung, Wettbewerbsvergleich und ETF-Alternative ist entscheidend. Die technische Research-Priorität ist getrennt vom Unternehmens- und Investmenturteil.</p>'+
 '<p class="fp86-statusline"><strong>Research-Priorität:</strong> '+esc(priority[c.research_priority]||'offen')+' · '+esc(sourceTag(c))+'</p>'+
 (window.FinanzPilotDecisions?.researchOnly?.(c.id)||'')+
 '<h3>Renditevergleich mit ETFs</h3>'+benchmark(c)+peerComparison(c)+history(c)+
 '<div class="fp86-actions"><button type="button" data-fp86-theses="'+esc(c.id)+'">Eigene Investmentthese und Revisionen</button>'+
 '<button type="button" class="fp86-soft" data-fp86-track="'+esc(c.id)+'">'+(tracked.has(c.id)?'Gemerkt ✓':'Für Research merken')+'</button></div></section>';
}
function homePreview(){
 const picks=front.map(id=>candidates.find(x=>x.id===id)).filter(Boolean).slice(0,2);
 if(!picks.length)return '';
 return '<section class="fp86-home-preview"><div><span class="eyebrow">DYNAMISCHE AKTIENRECHERCHE</span><h2>Neue Unternehmen auf dem Radar</h2><p>Screening, kein Kaufsignal · Kursstand '+esc(meta.asof||'wird geprüft')+'</p></div>'+
 '<div class="fp86-home-items">'+picks.map(x=>'<div><strong>'+esc(x.company)+'</strong><span>'+esc(x.ticker)+' · '+esc(priority[x.research_priority])+'</span><button type="button" data-fp86-open="'+esc(x.id)+'">Research prüfen →</button></div>').join('')+'</div>'+
 '<button type="button" class="fp86-home-all" data-fp86-ideas>Alle Research-Kandidaten ansehen</button></section>';
}
async function load(force=false){
 if(busy||(!force&&loaded&&Date.now()-lastLoad<120000))return;
 busy=true;lastLoad=Date.now();
 try{
  const paths=['./data/research-radar-v86.json','./data/thesis-ledger-v86.json'];
  const results=await Promise.all(paths.map(async p=>{const r=await fetch(p+'?t='+Date.now(),{cache:'no-store'});if(!r.ok)throw Error(p+': '+r.status);return r.json()}));
  const [radar,history]=results;
  if(radar.schema_version!==1||!Array.isArray(radar.candidates)||!Array.isArray(history.events)||history.schema_version!==1)throw Error('Ungültige Datenstruktur');
  candidates=radar.candidates.filter(c=>c&&c.id&&c.ticker&&c.company&&c.signals);
  ledger=history.events;front=radar.front_page_candidate_ids||[];
  benchmarkInfo=radar.benchmark_universe||[];
  meta={total_issuers:radar.total_issuers,with_price_history:radar.with_price_history,
    research_priority_count:radar.research_priority_count,missing_quote_count:radar.missing_quote_count,asof:radar.asof};
  loaded=true;error='';
 }catch(e){error=String(e.message||e);console.warn('Dynamic research radar:',e)}
 finally{busy=false;if(typeof state!=='undefined'&&['marketideas','marketidea','home'].includes(state.view))window.render?.()}
}
function bind(root=document){
 window.FinanzPilotDecisions?.bind?.(root);
 window.FinanzPilotPriorities?.bind?.(root);
 root.querySelectorAll('[data-fp86-tab]').forEach(b=>b.addEventListener('click',()=>{view=b.dataset.fp86Tab;window.render?.()}));
 root.querySelectorAll('[data-fp86-open]').forEach(b=>b.addEventListener('click',()=>window.FinanzPilotInsights?.openIdea?.(b.dataset.fp86Open)));
 root.querySelectorAll('[data-fp86-track]').forEach(b=>b.addEventListener('click',()=>{
  const id=b.dataset.fp86Track;
  if(tracked.has(id))tracked.delete(id);else tracked.add(id);
  saveTracked();window.render?.();
 }));
 root.querySelectorAll('[data-fp86-ideas]').forEach(b=>b.addEventListener('click',()=>window.FinanzPilotNavigation?.route?.('marketideas')));
 root.querySelectorAll('[data-fp86-theses]').forEach(b=>b.addEventListener('click',()=>{
  const c=get(b.dataset.fp86Theses);
  const course=c?{symbol:c.ticker,symbol_name:c.company,
    source_url:c.editorial_evidence?.url||'',date:c.editorial_evidence?.date||c.signals?.asof||''}:null;
  const draft=c?'Ungeprüfte Recherchehypothese zu '+c.company+': Zunächst Geschäftsmodell, Cashflows, Bewertungsniveau und mögliche Gegenargumente unabhängig prüfen. Die relative Kursentwicklung ist noch kein Investitionsargument.':'';
  if(!course||!window.FinanzPilotTheses?.draftFromAcademy?.(course,null,draft))
   window.FinanzPilotNavigation?.route?.('theses');
 }));
}
window.FinanzPilotRadar={load,bind,dashboard,candidateDetail,addendum,homePreview,get,findByTicker,
 get candidates(){return candidates},get ledger(){return ledger},get error(){return error}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>load(),{once:true});else load();
window.addEventListener('fp-navigation',()=>{if(typeof state!=='undefined'&&['marketideas','marketidea','home'].includes(state.view)&&Date.now()-lastLoad>120000)load()});
})();