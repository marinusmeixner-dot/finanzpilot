/* FinanzPilot Start: sourced daily market briefing, concise news and investable research leads. */
(function(){
'use strict';
let stories=[],ideas=[],briefing=null,loading=false,lastLoad=0,error='';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const valid=s=>s&&Array.isArray(s.article?.sections)&&s.article.sections.length>=4&&s.article.sections.every(x=>x.heading&&Array.isArray(x.paragraphs)&&x.paragraphs.length);
const idOf=s=>String(s.id||s.url||s.title||'').slice(0,400);
function stamp(s){
 const m=String(s||'').match(/^(\d{2})\.(\d{2})\.(\d{4})/);
 if(m)return Date.UTC(Number(m[3]),Number(m[2])-1,Number(m[1]));
 const n=Date.parse(String(s||''));return Number.isFinite(n)?n:0;
}
const date=s=>{const n=stamp(s);return n?new Intl.DateTimeFormat('de-DE',{day:'2-digit',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(n)):String(s||'Datum unbekannt');};
const dayStamp=s=>{const m=String(s||'').match(/^(\d{4}-\d\d-\d\d)/);return m?Date.parse(m[1]+'T12:00:00Z'):stamp(s);};
const ageDays=s=>{const time=dayStamp(s);return time?Math.max(0,(Date.now()-time)/86400000):Infinity;};
const route=id=>window.FinanzPilotNavigation?.route?.(id);
const symbols=()=>new Set((window.FinanzPilotMarkets?.watchlist||[]).map(x=>String(x.symbol).toUpperCase()));
const matchWatch=s=>{const w=symbols();return (s.symbols||[]).some(x=>[...w].some(y=>y.split('.')[0]===String(x).toUpperCase().split('.')[0]));};
const storyById=id=>stories.find(x=>idOf(x)===id);
const latestDate=()=>stories.length?stories[0].published:null;
function usableBriefing(d){
 if(!d||d.schema_version!==1||!/^\d{4}-\d\d-\d\d$/.test(String(d.date||'')))return false;
 return typeof d.title==='string'&&d.title.length>12&&typeof d.summary==='string'&&d.summary.length>35&&Array.isArray(d.highlights);
}
async function load(force=false){
 if(loading||(!force&&lastLoad&&Date.now()-lastLoad<120000))return;
 loading=true;
 try{
  const paths=['./data/editorial-core-v43.json?v=48','./data/daily.json?v=48&t='+Date.now(),
   './data/market-briefing.json?t='+Date.now(),'./data/ideas.json?t='+Date.now()];
  const result=await Promise.allSettled(paths.map(async url=>{const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);return r.json();}));
  const data=result.map(r=>r.status==='fulfilled'?r.value:null),seen=new Set(),items=[];
  for(const part of data.slice(0,2))for(const s of part?.stories||[]){
   const id=idOf(s);if(!valid(s)||!id||seen.has(id))continue;seen.add(id);items.push(s);
  }
  items.sort((a,b)=>stamp(b.published)-stamp(a.published));
  stories=items;
  briefing=usableBriefing(data[2])?data[2]:null;
  ideas=Array.isArray(data[3]?.ideas)?data[3].ideas.filter(x=>x&&x.company&&x.ticker&&x.interest&&x.counter&&x.source&&x.date):[];
  error=stories.length?'':'Aktuell sind keine vollständig recherchierten Artikel verfügbar.';
  lastLoad=Date.now();
 }catch(e){error='Die redaktionellen Daten konnten nicht geladen werden.';console.warn('Start briefing:',e);}
 finally{loading=false;if(typeof state!=='undefined'&&state.view==='home')window.render?.();}
}
function progress(){
 const j=window.FinanzPilotJourney,all=j?.modules||[],done=all.filter(x=>!!j?.completed?.[x.id]).length;
 return {done,total:all.length||18,next:j?.firstIncomplete?.(),due:window.FinanzPilotStudy?.dueCount?.()||0};
}
function storyButton(s,label){
 return '<button type="button" data-fp48-read="'+esc(idOf(s))+'" class="fp81-story-link">'+esc(label||'Vollständige Einordnung lesen')+' <span aria-hidden="true">→</span></button>';
}
function highlights(){
 const refs=briefing?.highlights?.filter(x=>x&&x.story_id&&storyById(x.story_id)).slice(0,3)||[];
 const used=new Set(refs.map(x=>x.story_id));
 const rest=stories.filter(s=>!used.has(idOf(s))).slice(0,Math.max(0,3-refs.length));
 const list=[...refs.map(x=>({story:storyById(x.story_id),label:x.title,why:x.why,watch:x.watch})),
  ...rest.map(s=>({story:s,label:s.title,why:s.impact||s.why,watch:''}))];
 return list.map(({story:s,label,why,watch},i)=>'<article class="fp81-mover">'+
  '<div class="fp81-mover-top"><span class="fp81-index">0'+(i+1)+'</span><span>'+esc(s.category||'Finanzmarkt')+' · '+esc(date(s.published))+'</span></div>'+
  '<h3>'+esc(label||s.title)+'</h3>'+
  '<p><strong>Warum wichtig?</strong> '+esc(why||s.impact||s.why||'Hintergründe im Originalartikel.')+'</p>'+
  (watch?'<p class="fp81-watch"><strong>Darauf achten:</strong> '+esc(watch)+'</p>':'')+
  storyButton(s,'Zusammenhang verstehen')+'</article>').join('');
}
function ideaCards(){
 const recent=ideas.slice().sort((a,b)=>stamp(b.date)-stamp(a.date)).slice(0,2);
 if(!recent.length)return '<p class="fp81-muted">Es liegen noch keine ausreichend dokumentierten Aktienideen vor. Der Radar bleibt bis zur nächsten geprüften Analyse leer.</p>';
 return recent.map(x=>'<article class="fp81-idea">'+
  '<div class="fp81-idea-meta"><span class="fp81-symbol">'+esc(x.ticker)+'</span><span>Analyse: '+esc(date(x.date))+'</span></div>'+
  '<h3>'+esc(x.company)+'</h3><div class="fp81-sector">'+esc(x.sector||'Branche noch zu prüfen')+'</div>'+
  '<p>'+esc(x.interest)+'</p>'+
  '<details><summary>Was spricht dagegen?</summary><p>'+esc(x.counter)+'</p><p class="fp81-muted">'+esc(x.next||'Weitere Bewertung und Quellenprüfung erforderlich.')+'</p></details>'+
  (x.id==='kion'
   ?'<button type="button" class="fp81-story-link" data-idea-course="kion-deep-valuation-2026">Vertiefung öffnen →</button>'
   :'<button type="button" class="fp81-story-link" data-idea-request="'+esc(x.ticker)+'">Research anfordern →</button>')+
  '</article>').join('');
}
function render(){
 const p=progress(),latest=latestDate(),outdated=briefing&&ageDays(briefing.date)>1.9;
 const headline=briefing?.title||'Die wichtigsten Finanzmarktentwicklungen verstehen';
 const summary=briefing?.summary||'Die Redaktion prüft die wichtigsten Nachrichten und ihre Bedeutung für Wirtschaft, Branchen und Unternehmen. Bis zur nächsten vollständigen Ausgabe findest du hier die zuletzt geprüften Beiträge.';
 const overview=briefing?.interpretation||'Eine Nachricht ist noch keine Investmententscheidung. Prüfe immer Wirkung, Erwartungen und Unternehmensbewertung.';
 const watchArticles=stories.filter(matchWatch).slice(0,2);
 return '<section class="fp48-home fp81-home">'+
  '<header class="fp81-hero"><div class="fp81-hero-body"><span class="eyebrow">FINANZPILOT · MARKTBRIEFING</span>'+
  '<h1>'+esc(headline)+'</h1><p>'+esc(summary)+'</p>'+
  '<div class="fp81-dateline"><span>Redaktionsausgabe: <strong>'+esc(briefing?date(briefing.date):'noch offen')+'</strong></span>'+
  '<span>'+esc(outdated?'Frühere Ausgabe – neue Fakten bitte prüfen':briefing?'Stand der letzten redaktionellen Prüfung':'Noch kein bestätigtes Tagesbriefing')+'</span></div>'+
  '<div class="fp81-hero-actions"><button type="button" class="btn" data-fp48-action="news">Alle Marktnachrichten</button>'+
  '<button type="button" class="btn secondary" data-fp48-action="charts">Meine Marktübersicht</button></div></div></header>'+
  (outdated?'<div class="fp81-stale" role="status">Diese Marktübersicht stammt vom '+esc(date(briefing.date))+'. Neuere Entwicklungen können sie bereits überholt haben. Aktuelle Beiträge findest du unter News.</div>':'')+
  '<section class="fp81-brief"><div class="fp81-heading"><div><span class="eyebrow">WAS DEN MARKT BEWEGT</span><h2>Die wichtigsten Entwicklungen</h2><p>Ausgewählt nach Bedeutung, nicht nach Schlagzeilenlautstärke.</p></div></div>'+
  (highlights()?'<div class="fp81-movers">'+highlights()+'</div>':'<div class="fp81-empty">'+esc(error||'Die wichtigsten Meldungen werden geprüft. Keine unverifizierten Nachrichten als Ersatz.')+'</div>')+
  '<div class="fp81-readout"><div><span class="eyebrow">DIE EINORDNUNG</span><h3>Was bedeutet das für Anleger?</h3><p>'+esc(overview)+'</p></div>'+
  (briefing?.next_watch?'<div class="fp81-next"><strong>Als Nächstes beobachten</strong><p>'+esc(briefing.next_watch)+'</p></div>':'')+'</div></section>'+
  '<section class="fp81-radar"><div class="fp81-heading"><div><span class="eyebrow">INVESTMENTRADAR</span><h2>Aktien auf dem Radar</h2><p>Recherchierte Unternehmen mit nachvollziehbarer Chance und Gegenargument. Keine automatischen Kaufempfehlungen.</p></div>'+
  '<button type="button" class="btn secondary" data-fp48-action="ideas">Alle Aktienideen</button></div>'+
  '<div class="fp81-ideas">'+ideaCards()+'</div></section>'+
  (watchArticles.length?'<section class="fp81-watchlist"><div class="fp81-heading"><div><span class="eyebrow">DEINE WATCHLIST</span><h2>Neu zu deinen Aktien</h2></div>'+
  '<button type="button" class="btn secondary" data-fp48-watch-news>Alle Watchlist-News</button></div><div class="fp81-watch-grid">'+
  watchArticles.map(s=>'<article class="fp81-watch-item"><small>'+esc(date(s.published))+'</small><h3>'+esc(s.title)+'</h3>'+
    '<p>'+esc(s.impact||s.why||'')+'</p>'+storyButton(s,'Artikel öffnen')+'</article>').join('')+
  '</div></section>':'')+
  '<section class="fp81-bottom"><div><span class="eyebrow">WISSEN VERTIEFEN</span><h2>'+(p.due?'Wissen festigen':'Lernen, was hinter den Märkten steckt')+'</h2>'+
  '<p>'+(p.due?esc(p.due)+' Wiederholungen sind fällig.':p.next?'Nächste Lektion: '+esc(p.next.title)+'.':'Mit dem Lernpfad Finanzzahlen und Investmententscheidungen besser verstehen.')+'</p></div>'+
  '<button type="button" class="btn secondary" data-fp48-action="'+(p.due?'review':p.done===p.total?'tree':'continue')+'">Lernen fortsetzen →</button></section>'+
  '<p class="fp81-disclaimer">Redaktionelle Recherche, keine persönliche Anlageberatung. Aussagen und Daten sind mit Zeitstand zu lesen; keine Echtzeit-Kurse oder verbindlichen Kaufkurse.</p>'+
  '</section>';
}
function bind(root=document){
 root.querySelectorAll('[data-fp48-action]').forEach(b=>b.addEventListener('click',()=>{
  const id=b.dataset.fp48Action;
  if(id==='continue'){if(window.FinanzPilotJourney?.modules?.length)window.FinanzPilotJourney.start();else route('basics');}
  else route(({tree:'skilltree',review:'skilllessons',ideas:'academy',news:'marketnews',charts:'marketoverview'})[id]||'learn');
 }));
 root.querySelectorAll('[data-fp48-read]').forEach(b=>b.addEventListener('click',()=>{
  const s=storyById(b.dataset.fp48Read);
  if(!s||!window.FinanzPilotMarkets?.openEditorialStory?.(s)){error='Der Artikel konnte nicht geöffnet werden.';window.render?.();}
 }));
 root.querySelector('[data-fp48-watch-news]')?.addEventListener('click',()=>window.FinanzPilotMarkets?.openNews?.(''));
}
window.FinanzPilotHome={render,bind,load,get stories(){return stories;},get briefing(){return briefing;},get ideas(){return ideas;}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>load(),{once:true});else load();
window.addEventListener('fp-navigation',()=>{if(typeof state!=='undefined'&&state.view==='home'&&Date.now()-lastLoad>120000)load();});
window.addEventListener('fp-market-watchlist-ready',()=>{if(typeof state!=='undefined'&&state.view==='home')window.render?.();});
window.addEventListener('fp-auth-change',()=>{load(true);if(typeof state!=='undefined'&&state.view==='home')window.render?.();});
})();
