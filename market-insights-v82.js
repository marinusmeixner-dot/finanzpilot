/* FinanzPilot V82 · Quellengebundene Firmenkontexte, Aktienideen und Research-Detailseiten. */
(function(){
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const safe=s=>{try{const u=new URL(String(s));return u.protocol==='https:'?u.href:null}catch{return null}};
const fmt=n=>typeof n==='number'&&Number.isFinite(n)?new Intl.NumberFormat('de-DE',{maximumFractionDigits:2}).format(n):esc(n);
const day=s=>{const x=String(s||'').match(/^\d{4}-\d{2}-\d{2}/);return x?x[0]:String(s||'unbekannt')};
let profiles={},ideas=[],analyses=[],loaded=false,busy=false,selected='',filter='all',updatedAt='',lastLoad=0;
function profilesFor(story){
 const symbols=Array.isArray(story?.symbols)?story.symbols:[];
 const used=new Set(),out=[];
 for(const raw of symbols){
  const symbol=String(raw||'').toUpperCase(),p=profiles[symbol];
  if(!p||used.has(p.name))continue;
  used.add(p.name);out.push({...p,symbol});
 }
 return out;
}
function ideaFor(symbol){
 const s=String(symbol||'').toUpperCase();
 return ideas.find(x=>[x.symbol,x.ticker].some(t=>String(t||'').toUpperCase()===s||String(t||'').toUpperCase().split(':').at(-1)===s.split('.')[0]))||null;
}
function companyContext(story,full=false){
 if(!Array.isArray(story?.symbols)||!story.symbols.length)return '';
 const people=profilesFor(story);
 if(!people.length)return '<div class="fp82-context fp82-missing"><strong>Unternehmensprofil wird überprüft</strong><p>Für die genannten Börsenticker liegen noch keine vollständig redaktionell bestätigten Geschäftsprofile vor. Die Langfassung und die Originalquelle enthalten die Einordnung.</p></div>';
 return '<div class="fp82-company-set">'+people.slice(0,3).map(p=>{
  const lead=ideaFor(p.symbol)||window.FinanzPilotRadar?.findByTicker?.(p.symbol);
  return '<div class="fp82-context"><div class="fp82-context-meta"><strong>'+esc(p.name)+'</strong><span>'+esc(p.symbol)+' · '+esc(p.sector)+'</span></div>'+
    '<p>'+esc(p.business)+'</p>'+
    (full?'<p><strong>Wie verdient das Unternehmen Geld?</strong> '+esc(p.revenue)+'</p>':'')+
    (lead?'<button type="button" data-fp82-open-ticker="'+esc(lead.ticker)+'">Aktienanalyse zu '+esc(p.name)+' öffnen →</button>':'')+'</div>';
 }).join('')+'</div>';
}
function articleContext(story){
 return '<section class="fp82-article-context">'+
 (Array.isArray(story?.symbols)&&story.symbols.length?'<div class="fp82-context-heading"><span class="eyebrow">UNTERNEHMEN VERSTEHEN</span><h2>Wer steckt hinter der Nachricht?</h2></div>'+companyContext(story,true):'')+
 '<div class="fp82-story-impact"><div><small>WAS IST PASSIERT?</small><p>'+esc(story?.why||story?.article?.lead||'Die Einzelheiten stehen im vollständig recherchierten Artikel.')+'</p></div>'+
 '<div><small>WAS KÖNNTE DAS BEDEUTEN?</small><p>'+esc(story?.impact||'Aus einer einzelnen Nachricht folgt noch keine belastbare Kursprognose. Erwartungen und Bewertung sind gesondert zu prüfen.')+'</p></div></div>'+
 '<p class="fp82-editorial-note">Fakten, mögliche Auswirkungen und Investmenthypothesen sind getrennt zu beurteilen. Keine verifizierten aktuellen Kurse oder pauschalen Kaufempfehlungen.</p></section>';
}
function sourceLink(url,label){
 const link=safe(url);return link?'<a href="'+esc(link)+'" target="_blank" rel="noopener noreferrer">'+esc(label||'Originalquelle prüfen')+' ↗</a>':'';
}
function ideaCards(){
 return ideas.filter(x=>filter==='all'||filter==='report'&&analyses.some(a=>a.id===x.id)).map(x=>{
  const full=analyses.some(a=>a.id===x.id);
  return '<article class="fp82-idea-card"><div class="fp82-card-header"><span class="fp82-ticker">'+esc(x.ticker)+'</span><span>'+esc(day(x.date))+'</span></div>'+
   '<h3>'+esc(x.company)+'</h3><p class="fp82-industry">'+esc(x.sector)+'</p>'+
   '<p>'+esc(x.interest)+'</p>'+
   '<div class="fp82-idea-label">Wichtige Gegenargumente</div><p class="fp82-risk">'+esc(x.counter)+'</p>'+
   (window.FinanzPilotMarketValue?.summaryFor?.(x.id)||'')+
   '<div class="fp85-card-status">'+(window.FinanzPilotFairValue?.get?.(x.id)?.financial_status==='primary_ttm_reconciled'?'Cashflow aus Originalberichten geprüft':'Primärdatenabgleich steht aus')+'</div>'+
   '<div class="fp82-card-actions"><button type="button" class="btn secondary" data-fp82-idea="'+esc(x.id)+'">Investmentthese ansehen</button>'+
   (full?'<span class="fp82-evidence">Finanzdaten vorhanden</span>':'<span class="fp82-evidence">Vertiefung offen</span>')+'</div></article>';
 }).join('');
}
function renderIdeas(){
 const visible=ideas.filter(x=>filter==='all'||analyses.some(a=>a.id===x.id));
 return '<section class="fp82-ideas-page fp34">'+
 (window.FinanzPilotRadar?.dashboard?.()||'<p class="fp82-data-note">Der offene Aktienradar lädt – bis dahin bleiben alle bestehenden Unternehmensanalysen verfügbar.</p>')+
 '<details class="fp86-existing"><summary>Fundamentalanalysen und Bewertungsmodelle ('+ideas.length+' Unternehmen)</summary><div class="fp86-curated"><span class="eyebrow">MÄRKTE · VERTIEFTE ANALYSEN</span><h2>Bestehende Research-Dossiers</h2>'+
 '<p class="fp82-subtitle">Diese ausführlichen Untersuchungen sind von den automatisch gescreenten Kandidaten getrennt. Sie werden bei neuen Berichten nach Quellenlage aktualisiert.</p>'+
 '<div class="fp82-data-note">Research-Stand: '+esc(updatedAt||'noch unbekannt')+'. Die jeweiligen Originalquellen können älter sein. <strong>Beobachtung ist keine Kaufempfehlung.</strong></div>'+
 '<div class="fp82-filter" role="group" aria-label="Aktienideen filtern"><button type="button" data-fp82-filter="all" aria-pressed="'+(filter==='all')+'">Alle Ideen ('+ideas.length+')</button>'+
 '<button type="button" data-fp82-filter="report" aria-pressed="'+(filter==='report')+'">Mit ausführlichen Finanzdaten</button></div>'+
 (visible.length?'<div class="fp82-ideas-grid">'+ideaCards()+'</div>':'<p class="fp82-empty">Für diese Auswahl liegen derzeit keine veröffentlichten Analysen vor.</p>')+
 '<div class="fp82-method"><h2>Wie eine Aktie zum Kandidaten wird</h2><p>Unternehmensmodell, veröffentlichte Zahlen, Gründe für mögliches Wachstum, offene Risiken, konkrete Auslöser und eine nachvollziehbare Bewertung werden getrennt untersucht. Fehlen aktuelle Kurse oder Gewinnschätzungen, ist keine zuverlässige Aussage über einen günstigen Einstieg möglich.</p>'+
 '<button type="button" class="btn secondary" data-fp82-route="marketnews">Relevante Nachrichten ansehen</button></div></div></details></section>';
}
function selectedIdea(){return ideas.find(x=>x.id===selected)||null}
function renderIdea(){
 const idea=selectedIdea();
 if(!idea&&window.FinanzPilotRadar?.get?.(selected))return window.FinanzPilotRadar.candidateDetail(selected);
 if(!idea)return '<section class="fp34 fp82-ideas-page"><h1>Aktienanalyse nicht gefunden</h1><p>Die gesuchte Idee wurde möglicherweise überarbeitet oder aus der aktiven Liste entfernt.</p><button class="btn" data-fp82-route="marketideas">Zur Ideenübersicht</button></section>';
 const r=analyses.find(a=>a.id===idea.id),profilesOf=profilesFor({symbols:[idea.symbol?.split(':').at(-1),idea.ticker]});
 const p=profilesOf[0]||null,figures=Array.isArray(r?.figures)?r.figures:[];
 return '<section class="fp34 fp82-detail">'+
 '<div class="fp82-detail-top"><span class="eyebrow">INVESTMENTRESEARCH · '+esc(idea.ticker)+'</span><button type="button" class="fp82-back" data-fp82-route="marketideas">← Alle Aktienideen</button></div>'+
 '<h1>'+esc(idea.company)+'</h1><p class="fp82-industry">'+esc(idea.sector)+' · '+esc(idea.symbol||idea.ticker)+'</p>'+
 '<p class="fp82-detail-intro">'+esc(idea.interest)+'</p>'+
 '<div class="fp82-data-note"><strong>Analysestand '+esc(day(idea.date))+'</strong> · '+esc(idea.status||'Research in Bearbeitung')+'. Keine aktuellen Börsenkurse oder gesicherten Kursziele.</div>'+
 '<div class="fp82-detail-grid"><main>'+
  '<section class="fp82-section"><span class="eyebrow">01 · GESCHÄFTSMODELL</span><h2>Was macht das Unternehmen?</h2>'+
  '<p>'+esc(p?.business||r?.business||'Das vollständige Geschäftsmodell wird anhand der Originalberichte recherchiert.')+'</p>'+
  (p?'<p><strong>Wie entstehen Einnahmen?</strong> '+esc(p.revenue)+'</p>':'')+'</section>'+
  '<section class="fp82-section"><span class="eyebrow">02 · INVESTMENTTHESE</span><h2>Was macht die Aktie interessant?</h2><p>'+esc(idea.interest)+'</p>'+
  (r?.thesis?'<p>'+esc(r.thesis)+'</p>':'')+
  (idea.metric?'<div class="fp82-fact"><strong>Berichteter Ausgangspunkt</strong><p>'+esc(idea.metric)+'</p></div>':'')+
  '<p><strong>Als Nächstes prüfen:</strong> '+esc(idea.next||'Geschäftsentwicklung und Bewertung ergänzen.')+'</p></section>'+
  (r?'<section class="fp82-section"><span class="eyebrow">03 · FINANZZEUGNIS</span><h2>Was sagen die Zahlen?</h2>'+
    '<p class="fp82-muted">Veröffentlichte historische Kennzahlen; Zeitraum: '+esc(r.period||'Berichtsperiode prüfen')+'. Keine aktuellen Aktienkurse.</p>'+
    (figures.length?'<div class="fp82-metrics">'+figures.slice(0,6).map(f=>'<div><small>'+esc(f[0])+'</small><strong>'+fmt(f[1])+'</strong><small>'+esc(f[2]||'Einheit prüfen')+'</small></div>').join('')+'</div>':'<p>Keine vergleichbaren Finanzzahlen in diesem Datensatz.</p>')+
    (r.recent_update?.period?'<p><strong>Neuerer veröffentlichter Bericht:</strong> '+esc(r.recent_update.period)+'. Prüfe die neueren Zahlen, bevor du historische Kennzahlen hochrechnest.</p>':'')+
    sourceLink(r.source_url,'Original-Finanzbericht')+(r.recent_update?.source_url?' · '+sourceLink(r.recent_update.source_url,'Neuerer Bericht'):'')+
    '</section>':'')+
  '<section class="fp82-section"><span class="eyebrow">'+(r?'04':'03')+' · RISIKEN</span><h2>Was könnte die These widerlegen?</h2><p>'+esc(idea.counter)+'</p>'+
  (r?.risks?.length?'<ul>'+r.risks.map(s=>'<li>'+esc(s)+'</li>').join('')+'</ul>':'')+'</section>'+
  '<section class="fp82-section"><span class="eyebrow">BEWERTUNG · ENTSCHEIDUNG</span><h2>Ist die Aktie zu diesem Preis attraktiv?</h2>'+
  '<p>Unten siehst du einen überprüften Börsenschlusskurs und historische Gewinn- und Cashflowkennzahlen. Ein echtes Kaufurteil erfordert darüber hinaus nachhaltige zukünftige Cashflows, Kapitalstruktur-Abgleich und geeignete Vergleichswerte. Ein gutes Unternehmen ist nicht automatisch eine günstig bewertete Aktie.</p>'+
  '<p><strong>Aktueller Prüfstand:</strong> Der datierte Marktpreis ist bekannt; die Normalisierung der Cashflows, der Bilanz-Brückenaudit und die Schätzung zukünftiger Gewinne bleiben eigenständige Aufgaben.</p>'+
  '<div class="fp82-verdict">Status: <strong>Marktpreis und historische Bewertungskennzahlen geprüft – belastbarer fairer Wert noch offen</strong></div></section>'+
  (window.FinanzPilotFairValue?.renderFor?.(idea.id)||'')+
  (window.FinanzPilotMarketValue?.renderFor?.(idea.id)||'')+
  (window.FinanzPilotValuation?.renderFor?.(idea.id)||'')+
  (window.FinanzPilotRadar?.addendum?.(idea.id)||'')+
  '</main><aside><div class="fp82-aside"><h3>Research-Kompass</h3><p><strong>Worauf achten?</strong></p><p>'+esc(idea.next||'Die nächsten Geschäftsberichte und die Bewertungsannahmen.')+'</p>'+
    '<p><strong>Was spricht dagegen?</strong></p><p>'+esc(idea.counter)+'</p><div class="fp82-sources"><strong>Originalquellen</strong>'+
    sourceLink(idea.source,'Unternehmensmeldung')+(idea.supporting_source?sourceLink(idea.supporting_source,'Ergänzende Quelle'):'')+'</div>'+
    (idea.id==='kion'?'<button type="button" class="btn secondary" data-idea-course="kion-deep-valuation-2026">20-Stufen-Bewertungskurs</button>':'')+
    '<button type="button" class="btn secondary" data-fp82-route="marketnews">Zu den Nachrichten</button></div></aside></div>'+
 '</section>';
}
function openIdea(id){
 if(!ideas.some(x=>x.id===id)&&!window.FinanzPilotRadar?.get?.(id))return false;
 selected=id;
 try{localStorage.setItem('fp82_selected_idea',id)}catch{}
 window.FinanzPilotNavigation?.route?.('marketidea');
 return true;
}
async function load(force=false){
 if(busy||(!force&&loaded&&Date.now()-lastLoad<120000))return;
 busy=true;
 const urls=['./data/company-profiles-v82.json','./data/ideas.json','./data/research.json'];
 try{
 const out=await Promise.allSettled(urls.map(async (path)=>{const response=await fetch(path+'?t='+Date.now(),{cache:'no-store'});if(!response.ok)throw new Error(String(response.status));return response.json()}));
 const [companies,prospects,files]=out.map(x=>x.status==='fulfilled'?x.value:null);
 if(companies?.schema_version===1&&companies?.companies)profiles=companies.companies;
 if(Array.isArray(prospects?.ideas)){ideas=prospects.ideas.filter(x=>x.id&&x.company&&x.ticker&&x.interest&&x.counter&&safe(x.source));updatedAt=prospects.asof||'Datum prüfen';}
 if(Array.isArray(files?.analyses))analyses=files.analyses;
 loaded=true;lastLoad=Date.now();
 if(typeof state!=='undefined'&&['marketideas','marketidea','marketnews','marketarticle','home'].includes(state.view))window.render?.();
 }catch(e){console.warn('Research data:',e?.message||e)}
 finally{busy=false}
}
function bind(root=document){
 root.querySelectorAll('[data-fp82-idea]').forEach(b=>b.addEventListener('click',()=>openIdea(b.dataset.fp82Idea)));
 root.querySelectorAll('[data-fp82-open-ticker]').forEach(b=>b.addEventListener('click',()=>{const idea=ideaFor(b.dataset.fp82OpenTicker)||window.FinanzPilotRadar?.findByTicker?.(b.dataset.fp82OpenTicker);if(idea)openIdea(idea.curated_id||idea.id)}));
 root.querySelectorAll('[data-fp82-filter]').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.fp82Filter==='report'?'report':'all';window.render?.()}));
 root.querySelectorAll('[data-fp82-route]').forEach(b=>b.addEventListener('click',()=>window.FinanzPilotNavigation?.route?.(b.dataset.fp82Route)));
 window.FinanzPilotValuation?.bind?.(root);
 window.FinanzPilotMarketValue?.bind?.(root);
 window.FinanzPilotFairValue?.bind?.(root);
 window.FinanzPilotRadar?.bind?.(root);
}
try{selected=localStorage.getItem('fp82_selected_idea')||''}catch{}
window.FinanzPilotInsights={companyContext,articleContext,renderIdeas,renderIdea,openIdea,bind,load,ideaFor,get ideas(){return ideas;},get profiles(){return profiles;}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>load(),{once:true});else load();
window.addEventListener('fp-navigation',()=>{if(typeof state!=='undefined'&&['marketideas','marketidea'].includes(state.view)&&Date.now()-lastLoad>120000)load()});
})();