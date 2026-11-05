/* FinanzPilot v87 – analyst decision quality, alternative cost and thesis revision history. */
(function(){
'use strict';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const fmt=(n,places=1)=>typeof n==='number'&&Number.isFinite(n)?new Intl.NumberFormat('de-DE',{maximumFractionDigits:0,maximumFractionDigits:places}).format(n):'nicht belegt';
const source=(url,text)=>{try{const u=new URL(String(url));return u.protocol==='https:'?'<a href="'+esc(u.href)+'" target="_blank" rel="noopener noreferrer">'+esc(text)+' ↗</a>':''}catch{return ''}};
const statuses={
 source_based_watch:'Nach Quellenlage beobachten',
 financial_data_review:'Cashflow geprüft · Bewertung offen',
 financial_audit_pending:'Finanzdaten noch prüfen',
 editorial_screen:'Nachricht zuerst prüfen',
 technical_screen:'Noch keine Investmentthese',
 archived:'Archivierte These'
};
const labels={
 thesis_created:'Investmentthese dokumentiert',
 evidence_stage_changed:'Finanzdatenprüfung verändert',
 thesis_revised:'Investmentthese überarbeitet',
 archived:'These archiviert'
};
let items=[],events=[],stats={},asof='',loaded=false,loading=false,lastLoad=0,error='';
let filter='priority',compareA='microsoft',compareB='amazon';
const get=id=>items.find(x=>x.id===id||x.ticker===id)||null;
const sign=n=>typeof n==='number'&&Number.isFinite(n)?(n>0?'+':'')+fmt(n,1):'nicht belegt';
const value=(n,c)=>fmt(n,2)+(c==='EUR'?' €':' USD');
function badge(id){
 const x=get(id);if(!x)return '';
 return '<div class="fp87-badge"><strong>'+esc(statuses[x.research_stage]||'Einordnung offen')+'</strong>'+
 '<span>Quellenreife '+fmt(x.evidence_readiness?.value,0)+'/100 · keine Attraktivitätsnote</span></div>';
}
function factor(x){
 const criteria=x?.evidence_readiness?.criteria||[];
 return '<details class="fp87-factors"><summary>Welche Quellen wurden überprüft? '+fmt(x.evidence_readiness?.value,0)+'/100</summary>'+
 '<div>'+criteria.map(c=>'<div><span aria-label="'+(c.ready?'Nachweis vorhanden':'Nachweis fehlt')+'">'+(c.ready?'✓':'–')+'</span><p>'+esc(c.label)+'</p><small>'+c.points+' Gewichtungspunkte</small></div>').join('')+'</div>'+
 '<p class="fp87-caveat">Dies misst nur die Vollständigkeit der dokumentierten Belege. Eine gut dokumentierte Aktie kann trotzdem teuer oder riskant sein.</p></details>';
}
function scrutiny(x){
 if(!x)return '<p>Die Rechercheentscheidung wird geladen. Bis dahin gibt es kein Investmenturteil.</p>';
 return '<div class="fp87-decision"><span class="eyebrow">UNABHÄNGIGE RESEARCH-EINORDNUNG</span>'+
 '<h3>'+esc(statuses[x.research_stage]||'Bewertung offen')+'</h3>'+
 '<p>'+esc(x.decision)+'</p>'+
 (!x.thesis?'<p><strong>Noch keine Investmentthese:</strong> Eine Kurs- oder Nachrichtenauffälligkeit reicht allein nicht für eine Fundamentalaussage.</p>':'')+
 '<p class="fp87-no-buy">'+esc(x.conclusion)+'</p>'+
 factor(x)+
 '<div class="fp87-questions"><div><strong>Was würde die These stützen?</strong><p>'+esc(x.what_would_confirm)+'</p></div>'+
 '<div><strong>Was könnte sie widerlegen?</strong><p>'+esc(x.what_would_invalidate)+'</p></div></div>'+
 '<p class="fp87-caveat"><strong>Bewertung:</strong> '+esc(x.valuation_status.replaceAll('_',' '))+' · Keine vermeintlich geprüfte Sicherheitsmarge.</p>'+
 (x.original_idea_source?source(x.original_idea_source,'Originalunterlage zum Research'):'')+
 '</div>';
}
function alternatives(x){
 const p=x.financials||{},peers=x.peer_valuations||[],etfs=x.etf_alternatives||[];
 return '<section class="fp87-alternatives"><h3>Was wäre die Alternative?</h3>'+
 '<p>Die Entscheidung sollte eine vergleichbare Aktie und einen breit gestreuten ETF berücksichtigen – oder bewusst auf ein Investment verzichten.</p>'+
 '<div class="fp87-peer">'+
 '<h4>Andere analysierte Unternehmen'+(x.comparison_family?' · '+esc(x.comparison_family):'')+'</h4>'+
 (peers.length?'<div class="fp87-peers">'+peers.map(c=>'<button type="button" data-fp87-jump="'+esc(c.id)+'"><strong>'+esc(c.company)+'</strong><small>TTM-KGV '+fmt(c.ttm_pe)+' · FCF-Rendite '+(c.ttm_fcf_yield_pct===null?'nicht belegt':fmt(c.ttm_fcf_yield_pct)+' %')+'</small><small>Preisdaten: '+esc(c.price_date||'unbekannt')+'</small></button>').join('')+'</div>':
 '<p>Für diese Firma liegen noch keine methodisch ausreichend passenden börsennotierten Vergleichsunternehmen mit datierten Bewertungen vor.</p>')+
 '<p class="fp87-caveat">Historisches GAAP-KGV, unbereinigter FCF und unterschiedliche Geschäftsmodelle sind kein Ersatz für eine echte Peer-Bewertung.</p>'+
 '</div>'+
 '<div class="fp87-etf"><h4>Breit gestreute ETF-Alternativen</h4>'+
 (etfs.length?etfs.slice(0,3).map(e=>'<div><strong>'+esc(e.name)+' ('+esc(e.ticker)+')</strong>'+
 '<span>63 Handelstage: '+sign(e.return_63d_pct)+' % · Aktie relativ: '+sign(e.excess_return_pp)+' Prozentpunkte</span></div>').join(''):
 '<p>Für diesen Börsenplatz liegt kein sauberer währungsgleicher 63-Tage-ETF-Vergleich vor.</p>')+
 '<p class="fp87-caveat">Nur historische Kursentwicklung, keine erwartete Rendite. Diversifikation, ETFs-Kosten, Sektor-/Faktorengewichte, Währung und persönlicher Anlagehorizont werden nicht automatisch gleichgesetzt.</p></div>'+
 '</section>';
}
function revisions(id){
 const hist=events.filter(e=>e.issuer_id===id).slice(-7).reverse();
 return '<section class="fp87-revisions"><h3>Welche fundamentalen Einschätzungen haben sich verändert?</h3>'+
 (hist.length?'<div>'+hist.map(e=>'<article><small>'+esc(e.date||'Datum prüfen')+'</small><strong>'+esc(labels[e.event_type]||'Research aktualisiert')+'</strong>'+
 '<p>'+esc(e.thesis||'')+'</p>'+
 '<p><strong>Gegenargument:</strong> '+esc(e.counter_thesis||'nicht dokumentiert')+'</p>'+
 (e.evidence_url?source(e.evidence_url,'Quellenbeleg'):'')+'</article>').join('')+'</div>':
 '<p>Für dieses Unternehmen liegt noch keine dauerhaft dokumentierte fundamentale Investmentthese vor. Bisherige Kurs-/Screeningsignale dürfen nicht als Analystenurteil ausgegeben werden.</p>')+
 '<p class="fp87-caveat">Append-only-Verlauf veröffentlichter Researchrevisionen. Keine erfundenen Kauf- oder Verkaufszeitpunkte und keine Änderung privater Depotpositionen.</p></section>';
}
function candidateSection(id){
 const x=get(id);if(!x)return '';
 return '<section class="fp87-candidate-section">'+scrutiny(x)+alternatives(x)+revisions(x.id)+
 '<details class="fp87-gaps"><summary>Noch notwendige Prüfungen ('+(x.valuation_gaps||[]).length+')</summary>'+
 '<ul>'+(x.valuation_gaps||[]).map(g=>'<li>'+esc(g)+'</li>').join('')+'</ul></details></section>';
}
function mini(id){
 const x=get(id);if(!x)return '';
 return '<div class="fp87-mini"><strong>'+esc(statuses[x.research_stage]||'Offen')+'</strong>'+
 '<span>Quellenstand '+fmt(x.evidence_readiness?.value,0)+'/100</span>'+
 '<small>'+esc(x.conclusion)+'</small></div>';
}
function row(x){
 return '<article class="fp87-review-row"><div><strong>'+esc(x.company)+'</strong><span>'+esc(x.ticker)+' · '+esc(x.sector||'Branche prüfen')+'</span></div>'+
 '<div><strong>'+esc(statuses[x.research_stage]||'Offen')+'</strong><small>Quellenreife '+fmt(x.evidence_readiness?.value,0)+'/100</small></div>'+
 '<div><p>'+esc(x.decision)+'</p>'+
 '<button type="button" data-fp87-jump="'+esc(x.id)+'">Research und Gegenargumente öffnen</button></div></article>';
}
function board(){
 if(!loaded)return '<div class="fp87-panel"><h3>Fundamentalentscheidungen werden geladen</h3><p>'+esc(error||'Die Marktsignale können unabhängig weiter angezeigt werden.')+'</p></div>';
 let results=items.filter(x=>x.lifecycle!=='archived');
 if(filter==='priority')results=results.filter(x=>['source_based_watch','financial_data_review'].includes(x.research_stage))
  .sort((a,b)=>b.evidence_readiness.value-a.evidence_readiness.value);
 else if(filter==='unverified')results=results.filter(x=>!['source_based_watch','financial_data_review'].includes(x.research_stage));
 else if(filter==='full')results.sort((a,b)=>b.evidence_readiness.value-a.evidence_readiness.value);
 return '<section class="fp87-panel"><span class="eyebrow">RESEARCH-ENTSCHEIDUNG</span><h3>Was ist tatsächlich begründet?</h3>'+
 '<p>Die A-/B-/C-Priorität aus dem Kursradar beantwortet nur, welche Unternehmen man zuerst untersuchen sollte. Diese zweite Ebene prüft Quellen, Bilanz, Szenarien, Risiko und Alternativen.</p>'+
 '<div class="fp87-stats"><div><strong>'+items.length+'</strong><small>Firmen im offenen Research</small></div>'+
 '<div><strong>'+(stats.source_based_watch||0)+(stats.financial_data_review||0)+'</strong><small>Mit primär abgeglichenem Cashflow</small></div>'+
 '<div><strong>'+(stats.financial_audit_pending||0)+'</strong><small>Mit offener Bilanzprüfung</small></div></div>'+
 '<div class="fp87-controls"><button type="button" aria-pressed="'+(filter==='priority')+'" data-fp87-filter="priority">Mehr geprüft</button>'+
 '<button type="button" aria-pressed="'+(filter==='unverified')+'" data-fp87-filter="unverified">Prüfung fehlt</button>'+
 '<button type="button" aria-pressed="'+(filter==='full')+'" data-fp87-filter="full">Alle</button></div>'+
 '<div class="fp87-review-list">'+(results.length?results.map(row).join(''):'<p>Kein Titel erfüllt diese Quellenstufe. Das ist kein verstecktes Kaufsignal.</p>')+'</div>'+
 '<p class="fp87-caveat">Stand des zugrunde liegenden Radars: '+esc(asof||'unbekannt')+'. Quellenreife ist nicht Attraktivität. Keine Titel werden ohne unabhängigen fairen Wert als „billig“ oder „kaufen“ bewertet.</p></section>';
}
function option(x,selected){
 return '<option value="'+esc(x.id)+'"'+(x.id===selected?' selected':'')+'>'+esc(x.company)+' ('+esc(x.ticker)+')</option>';
}
function column(x){
 if(!x)return '<p>Für diese Auswahl liegen noch keine veröffentlichten Daten vor.</p>';
 const p=x.financials||{},perf=x.relative_performance||{},currency=p.currency||x.currency;
 return '<div class="fp87-compare-col"><h4>'+esc(x.company)+'</h4><p>'+esc(x.sector||'Branche prüfen')+'</p>'+
 '<dl>'+
 '<div><dt>Research-Status</dt><dd>'+esc(statuses[x.research_stage]||'Ungeprüft')+'</dd></div>'+
 '<div><dt>Quellenreife (keine Qualitätsnote)</dt><dd>'+fmt(x.evidence_readiness?.value,0)+'/100</dd></div>'+
 '<div><dt>Schlusskurs</dt><dd>'+(p.price!=null?value(p.price,currency):'nicht verifiziert')+'</dd></div>'+
 '<div><dt>Historisches KGV (TTM)</dt><dd>'+fmt(p.ttm_pe,1)+'</dd></div>'+
 '<div><dt>FCF-Rendite (TTM)</dt><dd>'+(p.ttm_fcf_yield_pct!=null?fmt(p.ttm_fcf_yield_pct,2)+' %':'nicht verifiziert')+'</dd></div>'+
 '<div><dt>Beobachtung seit Radarstart</dt><dd>'+(perf.adjusted_return_pct!=null?sign(perf.adjusted_return_pct)+' %':'noch zu kurz')+'</dd></div>'+
 '<div><dt>Gegenüber Welt-ETF seit Start</dt><dd>'+(perf.relative_to_benchmark_pp!=null?sign(perf.relative_to_benchmark_pp)+' %-Pkt.':'kein sauberer Vergleich')+'</dd></div>'+
 '</dl>'+
 '<p class="fp87-caveat">Schlusskurs: '+esc(p.price_date||'unbekannt')+' · Finanzdaten-Auslese: '+esc(p.fundamental_observed_date||'unbekannt')+'. '+(p.date_alignment_warning?'Später abgerufene Gewinnzahlen können beim Schlusskurs noch nicht bekannt gewesen sein. ':'')+'</p>'+
 '<p><strong>Was spricht dagegen?</strong> '+esc(x.what_would_invalidate)+'</p>'+
 (p.source_price?source(p.source_price,'Preisquelle'):'')+
 '</div>';
}
function comparison(){
 if(!loaded)return '<div class="fp87-panel"><h3>Vergleich wird geladen</h3><p>'+esc(error||'Verifizierte Daten fehlen noch.')+'</p></div>';
 const options=items.filter(x=>x.lifecycle!=='archived');
 const a=get(compareA)||options[0],b=get(compareB)||options.find(x=>x.id!==a?.id);
 const same=a&&b&&a.currency===b.currency;
 return '<section class="fp87-panel"><span class="eyebrow">ENTSCHEIDUNGEN IM VERGLEICH</span><h3>Einzelaktie oder Alternative?</h3>'+
 '<p>Zwei Kandidaten nach Bilanznachweis, historischem KGV, Cashflow und relativer ETF-Entwicklung vergleichen. Ohne fairen Wert entsteht bewusst kein automatischer Sieger.</p>'+
 '<div class="fp87-compare-selectors"><label>Unternehmen A<select data-fp87-compare="a">'+options.map(x=>option(x,a?.id)).join('')+'</select></label>'+
 '<label>Unternehmen B<select data-fp87-compare="b">'+options.map(x=>option(x,b?.id)).join('')+'</select></label></div>'+
 (!same?'<p class="fp87-warning">Unterschiedliche Notierungswährungen: keine direkte absolute Kurs- oder Renditevergleichsaussage ohne Wechselkursabgleich. Prozent-KGV und Quellenreife sind nur als isolierte Kennzahlen lesbar.</p>':'')+
 '<div class="fp87-columns">'+column(a)+column(b)+'</div>'+
 '<h4>Als dritte Option: breit gestreut statt Einzelrisiko</h4>'+
 (a?alternatives(a):'')+
 '<p class="fp87-caveat">Die Daten allein rechtfertigen weder Kauf noch Verkauf. Langfristige Geschäftsmodellqualität, Cashflow-Normalisierung, persönliche Risikotragfähigkeit und Einstiegspreis sind separate Entscheidungen.</p></section>';
}
async function load(force=false){
 if(loading||(!force&&loaded&&Date.now()-lastLoad<120000))return;
 loading=true;error='';try{
 const urls=['./data/research-decisions-v87.json','./data/investment-thesis-events-v87.json'];
 const [d,h]=await Promise.all(urls.map(async p=>{const r=await fetch(p+'?t='+Date.now(),{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);return r.json()}));
 if(d.schema_version!==1||h.schema_version!==1||!Array.isArray(d.rows)||!Array.isArray(h.events))throw Error('Ungültige Bewertungsdaten');
 if(new Set(d.rows.map(x=>x.id)).size!==d.rows.length)throw Error('Doppelte Research-Einträge');
 items=d.rows;events=h.events;asof=d.asof;stats=d.status_counts||{};lastLoad=Date.now();loaded=true;
 }catch(e){error='Die Bewertungsschicht konnte nicht geladen werden: '+String(e?.message||e);console.warn('Research decision layer:',e)}
 finally{loading=false;if(typeof state!=='undefined'&&['marketideas','marketidea'].includes(state.view))window.render?.()}
}
function bind(root=document){
 root.querySelectorAll('[data-fp87-filter]').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.fp87Filter;window.render?.()}));
 root.querySelectorAll('[data-fp87-jump]').forEach(b=>b.addEventListener('click',()=>window.FinanzPilotInsights?.openIdea?.(b.dataset.fp87Jump)));
 root.querySelectorAll('[data-fp87-compare]').forEach(s=>s.addEventListener('change',()=>{
  if(s.dataset.fp87Compare==='a')compareA=s.value;else compareB=s.value;
  window.render?.();
 }));
}
window.FinanzPilotDecisions={load,bind,get,badge,mini,candidateSection,board,comparison,revisions,alternatives,researchOnly:id=>{const x=get(id);return x?scrutiny(x)+revisions(x.id):'';},
 get items(){return items},get events(){return events},get error(){return error}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>load(),{once:true});else load();
window.addEventListener('fp-navigation',()=>{if(typeof state!=='undefined'&&['marketideas','marketidea'].includes(state.view)&&Date.now()-lastLoad>120000)load()});
})();