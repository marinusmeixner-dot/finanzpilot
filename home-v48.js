/* FinanzPilot v48 – modern home with actual, freely readable editorial articles. */
(function(){
'use strict';
let stories=[],loading=false,lastLoad=0,error='',filter='all';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const valid=s=>s&&Array.isArray(s.article?.sections)&&s.article.sections.length>=4&&s.article.sections.every(x=>x.heading&&Array.isArray(x.paragraphs)&&x.paragraphs.length);
const idOf=s=>String(s.id||s.url||s.title||'').slice(0,400);
function stamp(s){const m=String(s||'').match(/^(\d{2})\.(\d{2})\.(\d{4})/);if(m)return Date.UTC(Number(m[3]),Number(m[2])-1,Number(m[1]));const n=Date.parse(String(s||''));return Number.isFinite(n)?n:0}
const date=s=>{const n=stamp(s);return n?new Intl.DateTimeFormat('de-DE',{day:'2-digit',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(n)):String(s||'Datum unbekannt')};
const readTime=s=>Math.max(2,Math.ceil([s.article?.lead,...(s.article?.sections||[]).flatMap(x=>x.paragraphs||[]),s.article?.conclusion].join(' ').split(/\s+/).filter(Boolean).length/170))+' Min. Lesezeit';
const route=id=>window.FinanzPilotNavigation?.route?.(id);
const user=()=>window.FinanzPilotCloud?.user;
const symbols=()=>new Set((window.FinanzPilotMarkets?.watchlist||[]).map(x=>String(x.symbol).toUpperCase()));
const matchWatch=s=>{const w=symbols();return (s.symbols||[]).some(x=>[...w].some(y=>y.split('.')[0]===String(x).toUpperCase().split('.')[0]))};
async function load(force=false){
 if(loading||(!force&&stories.length&&Date.now()-lastLoad<120000))return;
 loading=true;
 try{
  const sources=['./data/editorial-core-v43.json?v=48','./data/daily.json?v=48&t='+Date.now()];
  const result=await Promise.allSettled(sources.map(async url=>{const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);return r.json()}));
  const seen=new Set(),all=[];
  for(const r of result)if(r.status==='fulfilled')for(const s of r.value?.stories||[]){const id=idOf(s);if(!valid(s)||!id||seen.has(id))continue;seen.add(id);all.push(s)}
  all.sort((a,b)=>stamp(b.published)-stamp(a.published));
  if(all.length){stories=all;error=''}else error='Momentan sind keine vollständigen Artikel verfügbar.';
  lastLoad=Date.now();
 }catch(e){error='Die Nachrichten konnten nicht aktualisiert werden.';console.warn('Home news:',e)}
 finally{loading=false;if(typeof state!=='undefined'&&state.view==='home')window.render?.()}
}
function progress(){
 const j=window.FinanzPilotJourney;const all=j?.modules||[],done=all.filter(x=>!!j?.completed?.[x.id]).length;
 const p=window.FinanzPilotProfile?.current?.()||{};
 return {done,total:all.length||18,next:j?.firstIncomplete?.(),skills:Number(p.mastered)||0,fp:Number(p.points)||0,streak:Number(p.streak)||0,due:window.FinanzPilotStudy?.dueCount?.()||0};
}
function card(s){
 return '<article class="fp48-news-card"><button type="button" data-fp48-read="'+esc(idOf(s))+'" aria-label="'+esc('Artikel lesen: '+s.title)+'">'+
 '<span class="fp48-news-meta">'+esc(s.category||'Wirtschaft')+' · '+esc(date(s.published))+' · '+esc(readTime(s))+'</span><h3>'+esc(s.title)+'</h3>'+
 '<p>'+esc(s.article?.lead||s.why||'')+'</p><span class="fp48-read-more">Vollständig in FinanzPilot lesen →</span></button></article>';
}
function render(){
 const p=progress(),pct=Math.round(100*p.done/p.total),next=p.next,lead=stories[0];
 const list=stories.filter(s=>filter==='all'||filter==='watch'&&matchWatch(s)||filter==='market'&&(!s.symbols?.length||['Markt','Wirtschaft','Zinsen'].includes(s.category))).slice(0,6);
 return '<section class="fp48-home">'+
 '<header class="fp48-hero"><div><span class="eyebrow">DEIN FINANZPILOT</span><h1>Dein nächster Schritt.</h1><p>Lernen, Finanzmärkte verstehen und Entscheidungen fundiert treffen.</p><small>'+esc(new Intl.DateTimeFormat('de-DE',{weekday:'long',day:'numeric',month:'long',timeZone:'Europe/Berlin'}).format(new Date()))+'</small></div><div class="fp48-circle"><b>'+pct+'%</b><small>Grundlagen</small></div></header>'+
 '<div class="fp48-daily-grid"><article class="fp48-next"><span class="eyebrow">WEITERLERNEN</span><h2>'+(p.done===p.total?'Bereit für die Vertiefung?':p.done?'Weiter, wo du aufgehört hast.':'Beginne mit dem Fundament.')+'</h2><p>'+(p.done===p.total?'Im Skillbaum warten neue Fachrichtungen.':next?'Nächste Lektion: <b>'+esc(next.title)+'</b>.':'Starte mit deiner ersten Grundlagenlektion.')+'</p><div class="fp48-progress-track"><span style="width:'+pct+'%"></span></div><small>'+p.done+' von '+p.total+' Grundlagenlektionen abgeschlossen</small><button class="btn" data-fp48-action="'+(p.done===p.total?'tree':'continue')+'">'+(p.done===p.total?'Skillbaum öffnen':'Jetzt weiterlernen')+' →</button></article>'+
 '<article class="fp48-focus"><span class="eyebrow">DEIN TAGESFOKUS</span><h2>Wissen sichern.</h2><p>'+(p.due?p.due+' bereits gelernte Inhalte sind zur Wiederholung fällig.':'Wissen anwenden statt nur auswendig lernen. Übe oder erkunde deinen nächsten Skill.')+'</p><button class="btn secondary" data-fp48-action="'+(p.due?'review':'skills')+'">'+(p.due?'Wiederholungen öffnen':'Skills ansehen')+' →</button></article></div>'+
 '<nav class="fp48-stats" aria-label="Lernstatus"><button data-fp48-action="profile"><b>'+p.skills+'</b><span>Skills erlernt</span></button><button data-fp48-action="inventory"><b>'+p.fp+' FP</b><span>Forschungspunkte</span></button><button data-fp48-action="streak"><b>'+p.streak+'/30</b><span>Streak-Tage</span></button></nav>'+
 '<section class="fp48-news"><div class="fp48-section-heading"><div><span class="eyebrow">FINANZWELT VERSTEHEN</span><h2>Nachrichten, die du komplett lesen kannst.</h2><p>Eigenständige FinanzPilot-Artikel mit verständlichen Erklärungen und Quellen. Alle Artikel öffnen direkt in der App.</p></div><button class="btn secondary" data-fp48-action="news">Alle News</button></div>'+
 (lead?'<div class="fp48-featured"><button type="button" data-fp48-read="'+esc(idOf(lead))+'"><span class="eyebrow">AUS DER REDAKTION · '+esc(date(lead.published))+'</span><h3>'+esc(lead.title)+'</h3><p>'+esc(lead.article?.lead||lead.why||'')+'</p><span>Vollständigen Artikel lesen →</span></button></div>':'')+
 '<div class="fp48-news-tabs" role="group" aria-label="Nachrichten filtern">'+[['all','Alle'],['market','Wirtschaft & Märkte'],['watch','Meine Watchlist']].map(([id,name])=>'<button data-fp48-filter="'+id+'" aria-pressed="'+(filter===id)+'" class="'+(filter===id?'active':'')+'">'+name+'</button>').join('')+'</div>'+
 (list.length?'<div class="fp48-news-grid">'+list.map(card).join('')+'</div>':'<div class="fp48-news-empty">'+esc(error||(!stories.length?'Die vollständigen Artikel werden geladen …':filter==='watch'?'Zu deiner Watchlist sind aktuell keine passenden vollständigen Artikel vorhanden.':'Keine Beiträge für diese Auswahl.'))+'</div>')+
 '<div class="fp48-news-footer"><small>Das echte Veröffentlichungsdatum steht bei jeder Meldung. Es werden keine kostenpflichtigen Originaltexte kopiert.</small><button type="button" data-fp48-action="news">Alle Nachrichten öffnen →</button></div></section>'+
 '<section class="fp48-discover"><div><span class="eyebrow">WISSEN ANWENDEN</span><h2>Deine nächsten Werkzeuge.</h2><p>Verbinde Lerninhalte mit echten Geschäftsberichten und Kursverläufen.</p></div><div class="fp48-tools">'+[['financials','▤','Finanzberichte','Kennzahlen deiner Watchlist'],['charts','⌁','Aktiencharts','Historische Kursverläufe'],['tree','✧','Skillbaum','Weitere Fähigkeiten']].map(([id,icon,title,detail])=>'<button type="button" data-fp48-action="'+id+'"><span>'+icon+'</span><b>'+title+'</b><small>'+detail+'</small></button>').join('')+'</div></section></section>';
}
function bind(root=document){
 root.querySelectorAll('[data-fp48-action]').forEach(b=>b.addEventListener('click',()=>{
  const id=b.dataset.fp48Action;
  if(id==='continue'){if(window.FinanzPilotJourney?.modules?.length)window.FinanzPilotJourney.start();else route('basics')}
  else if(id==='streak')window.FinanzPilotStreak?.open?.();
  else route(({tree:'skilltree',skills:'skilllessons',review:'skilllessons',profile:'progress',inventory:'inventory',news:'marketnews',financials:'marketfinancials',charts:'marketoverview'})[id]||'learn');
 }));
 root.querySelectorAll('[data-fp48-filter]').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.fp48Filter;window.render?.()}));
 root.querySelectorAll('[data-fp48-read]').forEach(b=>b.addEventListener('click',()=>{
  const s=stories.find(x=>idOf(x)===b.dataset.fp48Read);
  if(!s||!window.FinanzPilotMarkets?.openEditorialStory?.(s)){error='Der Artikel konnte nicht geöffnet werden.';window.render?.()}
 }));
}
window.FinanzPilotHome={render,bind,load,get stories(){return stories},get filter(){return filter}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>load(),{once:true});else load();
window.addEventListener('fp-navigation',()=>{if(typeof state!=='undefined'&&state.view==='home'&&Date.now()-lastLoad>120000)load()});
})();