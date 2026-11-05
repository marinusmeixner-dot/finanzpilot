/* FinanzPilot V89 · Source-first open research queue; not price-only opportunity hype. */
(function(){
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','&#39;':'&#39;',"'":'&#39;'}[c]));
const safe=x=>{try{const u=new URL(String(x));return u.protocol==='https:'?u.href:null}catch{return null}};
const link=(url,label)=>safe(url)?'<a href="'+esc(safe(url))+'" target="_blank" rel="noopener noreferrer">'+esc(label)+' ↗</a>':'';
const label={
  news_catalyst:'Aktuelle Nachricht überprüfen',
  fundamental_watch:'Unternehmenszahlen nachprüfen',
  old_catalyst:'Älteren Anlass neu bewerten',
  technical_only:'Nur Kurs-Screening',
  source_gap:'Kursdaten fehlen',
  archived:'Archivierte Beobachtung'
};
let items=[],front=[],asof='',counts={},loaded=false,loading=false,error='',lastLoad=0;
const index=new Map();
function get(id){return index.get(id)||null;}
function card(x){
 const fresh=x.review_kind==='news_catalyst';
 return '<article class="fp89-item">'+
 '<header><span class="fp89-ticker">'+esc(x.ticker)+'</span><span class="fp89-kind">'+esc(label[x.review_kind]||'Prüfung offen')+'</span></header>'+
 '<h3>'+esc(x.company)+'</h3>'+
 '<p class="fp89-why">'+esc(x.why_now||'Neuen Geschäftsbericht und Bewertungsgrundlage prüfen')+'</p>'+
 (fresh&&x.evidence_url?'<p class="fp89-date">Originalmeldung vom '+esc(x.evidence_date||'Datum prüfen')+'</p>'+link(x.evidence_url,'Originalmeldung'):'<p class="fp89-date">Keine neu belegte Unternehmensmeldung als Investmentthese</p>')+
 '<p class="fp89-next"><strong>Nächster Beleg:</strong> '+esc(x.next_checks?.[0]||'Geschäftsentwicklung unabhängig prüfen')+'</p>'+
 '<button type="button" data-fp89-open="'+esc(x.id)+'">Research und Alternativen prüfen</button></article>';
}
function summary(){
 if(!loaded)return '<section class="fp89-shell"><h3>Recherche nach neuen Chancen</h3><p>'+(loading?'Die quellengestützte Prüfliste wird geladen …':esc(error||'Die Prüfliste wird geladen.'))+'</p></section>';
 const presented=front.map(id=>get(id)).filter(x=>x&&x.bucket==='review_now').slice(0,6);
 return '<section class="fp89-shell"><div class="fp89-heading"><div><span class="eyebrow">QUELLENBASIERTE RESEARCH-WARTESCHLANGE</span><h3>Was sollte jetzt als Nächstes untersucht werden?</h3>'+
 '<p>Neue bestätigte Unternehmensmeldungen zuerst, laufende Fundamentalthesen danach. Kurstrends allein sind kein Kaufargument.</p></div>'+
 '<span class="fp89-date">'+esc(asof)+' · Recherche-Snapshot</span></div>'+
 '<div class="fp89-counts"><span><strong>'+items.length+'</strong> Unternehmen</span>'+
 '<span><strong>'+(counts.review_now||0)+'</strong> zuerst prüfen</span>'+
 '<span><strong>'+(counts.watch_and_verify||0)+'</strong> beobachten</span>'+
 '<span><strong>'+(counts.source_gap||0)+'</strong> Datenlücke</span></div>'+
 (presented.length?'<div class="fp89-grid">'+presented.map(card).join('')+'</div>':'<p class="fp89-note">Aktuell kein Unternehmen mit neuer geprüfter Meldung in der Recherchepriorität. Das ist kein Grund, einen Trade zu erzwingen.</p>')+
 '<p class="fp89-note">Das ist eine Arbeitsreihenfolge für Research, <strong>keine Rangliste vermeintlich unterbewerteter Aktien.</strong> Jede neue Firma erhält zunächst einen Prüfstatus. Die ETF-, Bewertungs- und Quellenvergleiche stehen in der jeweiligen Detailanalyse.</p></section>';
}
function detail(id){
 const x=get(id);if(!x)return '';
 return '<section class="fp89-diligence"><span class="eyebrow">WAS FEHLT BIS ZUM INVESTMENTURTEIL?</span><h3>Konkrete nächste Rechercheschritte</h3>'+
 '<p><strong>Rechercheauslöser:</strong> '+esc(label[x.review_kind]||'Prüfung offen')+'. '+esc(x.why_now||'')+'</p>'+
 (x.evidence_url?link(x.evidence_url,'Quellenmeldung'):'<p>Keine unabhängig verifizierte aktuelle Unternehmensmeldung vorhanden.</p>')+
 '<ol>'+x.next_checks.slice(0,3).map(y=>'<li>'+esc(y)+'</li>').join('')+'</ol>'+
 '<p><strong>Erste Gegenprüfung:</strong> '+esc(x.first_rejection||'Ertragsannahmen und faire Bewertung verifizieren')+'</p>'+
 '<p><strong>Alternativen:</strong> '+(x.alternatives?.etf_count?esc((x.alternatives.benchmark_names||[]).join(' · ')):'Noch kein währungsgleicher ETF-Vergleich')+
 ' · '+(x.alternatives?.peer_count||0)+' Unternehmen mit indikativem Vergleichsdatensatz.</p>'+
 '<p class="fp89-note">Die Recherche priorisiert das Auffinden von Informationen. Weder das technische Signal noch die Quellenreife beweisen eine erwartete Überrendite.</p></section>';
}
async function load(force=false){
 if(loading||(!force&&loaded&&Date.now()-lastLoad<120000))return;
 loading=true;error='';
 try{
  const response=await fetch('./data/opportunity-queue-v89.json?t='+Date.now(),{cache:'no-store'});
  if(!response.ok)throw Error('HTTP '+response.status);
  const data=await response.json();
  if(data.schema_version!==1||!Array.isArray(data.candidates)||!data.candidates.length||!Array.isArray(data.spotlight_ids))throw Error('Ungültige dynamische Research-Daten');
  if(new Set(data.candidates.map(x=>x.id)).size!==data.candidates.length)throw Error('Doppelte Firmen-IDs');
  if(data.spotlight_ids.some(id=>!data.candidates.some(x=>x.id===id)))throw Error('Unbekannte Research-Priorität');
  if(!data.candidates.every(x=>Array.isArray(x.next_checks)&&x.next_checks.length===3&&x.ticker&&x.company&&x.bucket))throw Error('Unvollständige Prüfschritte');
  items=data.candidates;front=data.spotlight_ids;asof=data.asof;counts=data.bucket_counts||{};
  index.clear();for(const x of items)index.set(x.id,x);
  loaded=true;lastLoad=Date.now();
 }catch(e){error='Research-Warteschlange nicht verfügbar: '+String(e?.message||e);console.warn('Research priority:',e)}
 finally{loading=false;if(typeof state!=='undefined'&&['marketideas','marketidea'].includes(state.view))window.render?.()}
}
function bind(root=document){
 root.querySelectorAll('[data-fp89-open]').forEach(button=>button.addEventListener('click',()=>{
  const id=button.dataset.fp89Open;if(get(id))window.FinanzPilotInsights?.openIdea?.(id);
 }));
}
window.FinanzPilotPriorities={load,summary,detail,bind,get,get items(){return items},get error(){return error}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>load(),{once:true});else load();
window.addEventListener('fp-navigation',()=>{if(typeof state!=='undefined'&&['marketideas','marketidea'].includes(state.view)&&Date.now()-lastLoad>120000)load()});
})();