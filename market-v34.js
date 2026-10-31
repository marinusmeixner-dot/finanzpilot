/* FinanzPilot v34: distinct Watchlist-Charts, three newsroom desks and a stock detail view. */
(function(){
'use strict';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safe=x=>{try{const u=new URL(String(x));return u.protocol==='https:'?u.href:null}catch{return null}};
const valid=s=>/^[A-Z0-9][A-Z0-9.\-]{0,23}$/.test(String(s||''));
const client=()=>window.FinanzPilotCloud?.paperClient;
const user=()=>window.FinanzPilotCloud?.user;
const currency=(n,c)=>{try{return new Intl.NumberFormat('de-DE',{style:'currency',currency:c||'USD'}).format(Number(n))}catch{return String(n)}};
let watch=[],quotes=[],editorial=[],feedDate='',active='',tab='general',newsFocus='',message='',busy=false,queued=false,lastRefresh=0;
const historyCache=new Map(),newsCache=new Map(),pending=new Map();
const q=s=>quotes.find(x=>x.symbol===s)||null;
const ui=()=>{if(typeof state!=='undefined'&&['marketoverview','marketdetail','marketnews'].includes(state.view))window.render?.()};
const alias={MSFT:['microsoft'],AMZN:['amazon','aws'],AAPL:['apple'],GOOGL:['alphabet','google'],GOOG:['alphabet','google'],NVDA:['nvidia'],META:['meta','facebook'],BAYN:['bayer'],'BAYN.DE':['bayer'],BYW:['baywa'],'BYW.MU':['baywa'],SAP:['sap'],KGX:['kion'],INTC:['intel']};
function matches(story,symbol){
 const s=String(symbol||'').toUpperCase(),base=s.split('.')[0],names=alias[s]||alias[base]||[];
 const syms=(story.symbols||[]).map(x=>String(x).toUpperCase());
 if(syms.includes(s)||syms.includes(base))return true;
 const name=(q(s)?.asset_name||'').toLowerCase(),title=String(story.title||'').toLowerCase();
 return [...names,...(name.length>5?[name]:[])].some(x=>title.includes(x));
}
async function fetchEditorial(force=false){
 if(!force&&editorial.length&&Date.now()-lastRefresh<120000)return;
 const response=await fetch('./data/daily.json?m='+Date.now(),{cache:'no-store'});
 if(!response.ok)throw Error('Redaktion '+response.status);
 const d=await response.json();if(!Array.isArray(d.stories))throw Error('Ungültiges Nachrichtenformat');
 editorial=d.stories;feedDate=d.date||'unbekannt';lastRefresh=Date.now();
}
const invoke=async(action,symbol)=>{const c=client();if(!c)throw Error('Bitte anmelden');const {data,error}=await c.functions.invoke('finanzpilot-stock-lookup',{body:{action,symbol}});if(error||data?.error)throw Error(error?.message||data?.error);return data};
function getAsset(symbol,type,force=false){
 const cache=type==='history'?historyCache:newsCache;
 const key=type+':'+symbol;
 const entry=cache.get(symbol);
 if(!force&&entry&&Date.now()-entry.time<300000)return Promise.resolve(entry.data);
 if(pending.has(key))return pending.get(key);
 const p=invoke(type,symbol).then(d=>{cache.set(symbol,{time:Date.now(),data:d});return d})
 .catch(e=>{cache.set(symbol,{time:Date.now()-260000,data:null,error:String(e.message||e)});return null})
 .finally(()=>{pending.delete(key);ui()});
 pending.set(key,p);return p;
}
async function refresh(force=false){
 if(busy){queued=true;return}
 busy=true;
 try{
  await fetchEditorial(force);
  if(!user()||!client()){watch=[];quotes=[];message='Melde dich an, damit deine privaten Watchlist-Charts angezeigt werden.';return}
  const uid=user();
  const rows=await client().from('fp_paper_watchlist').select('symbol,created_at').eq('user_id',uid).order('created_at',{ascending:false}).limit(500);
  if(rows.error)throw rows.error;if(uid!==user())return;
  watch=rows.data||[];const syms=[...new Set([...watch.map(x=>x.symbol),...(active?[active]:[])])];
  if(syms.length){
   const result=await client().from('fp_paper_quotes').select('symbol,asset_name,currency,price,quote_date,source').in('symbol',syms);
   if(result.error)throw result.error;quotes=result.data||[];
  }else quotes=[];
  message='';
  // Previously saved stocks appear immediately; historical charts hydrate asynchronously.
  hydrateCharts(watch.map(item=>item.symbol));
  if(typeof state!=='undefined'&&state.view==='marketnews'&&tab==='watch')loadWatchNews();
  if(active)getAsset(active,'history');
 }catch(e){message='Marktdaten konnten nicht aktualisiert werden: '+String(e.message||e)}
 finally{busy=false;ui();if(queued){queued=false;refresh(true)}}
}
async function hydrateCharts(symbols){
 for(let i=0;i<symbols.length;i+=4)await Promise.all(symbols.slice(i,i+4).map(symbol=>getAsset(symbol,'history')));
}
async function loadWatchNews(){
 // Provider data is requested when this section is opened, including newly added symbols.
 // No assumed background push or unsupported claim of daily chatbot access to private watchlists.
 for(let i=0;i<watch.length;i+=4)await Promise.all(watch.slice(i,i+4).map(item=>getAsset(item.symbol,'news')));
}
function points(symbol){const d=historyCache.get(symbol)?.data;return Array.isArray(d?.points)?d.points.filter(x=>Number(x.price)>0):[]}
function chart(symbol){
 const data=points(symbol);if(data.length<2)return '<div class="fp34-chart-empty">'+(pending.has('history:'+symbol)?'Kursverlauf wird geladen …':'Noch keine überprüfte historische Kursreihe verfügbar.')+'</div>';
 const vals=data.map(p=>Number(p.price)),lo=Math.min(...vals),hi=Math.max(...vals),rng=Math.max(hi-lo,0.00001);
 const coords=vals.map((v,i)=>(12+(i/(vals.length-1))*696).toFixed(1)+','+(191-158*(v-lo)/rng).toFixed(1)).join(' ');
 const change=(vals.at(-1)/vals[0]-1)*100;
 const last=data.at(-1), first=data[0];
 return '<div class="fp34-chart"><div class="fp34-chart-top"><strong>'+esc(currency(last.price,historyCache.get(symbol)?.data?.currency||q(symbol)?.currency))+'</strong><span class="'+(change>=0?'fp-depot-pos':'fp-depot-neg')+'">'+(change>=0?'+':'')+change.toFixed(2).replace('.',',')+' % im dargestellten Zeitraum</span></div>'+
 '<svg role="img" aria-label="Historischer Kursverlauf '+esc(symbol)+'" viewBox="0 0 720 210"><polyline fill="none" stroke="#82deb5" stroke-width="3.4" stroke-linejoin="round" stroke-linecap="round" points="'+coords+'"/></svg><small>'+esc(first.date)+' – '+esc(last.date)+' · historische Schlusskurse, keine Livekurse · Anbieter: Yahoo Finance (inoffiziell)</small></div>';
}
function renderOverview(){
 if(!user())return '<div class="fp34"><h1>Marktüberblick</h1><p>Hier erscheinen ausschließlich die Charts deiner Watchlist. Bitte melde dich für die private Watchlist an.</p><button class="btn" data-fp34-login>Anmelden</button></div>';
 return '<div class="fp34"><div class="fp34-head"><div><span class="eyebrow">MÄRKTE · DEINE TITEL</span><h1>Marktüberblick</h1><p>Alle gemerkten Aktien als Charts. Tippe auf einen Kursverlauf für Details.</p></div><button class="btn secondary" data-fp34-refresh>Aktualisieren</button></div>'+
 (message?'<p role="status">'+esc(message)+'</p>':'')+
 (watch.length?'<div class="fp34-chart-grid">'+watch.map(w=>'<button type="button" class="fp34-chart-card" data-fp34-chart="'+esc(w.symbol)+'"><div class="fp34-title"><span><strong>'+esc(q(w.symbol)?.asset_name||w.symbol)+'</strong><small>'+esc(w.symbol)+' · '+esc(q(w.symbol)?.quote_date||'Kursstand wird geladen')+'</small></span><span aria-hidden="true">›</span></div>'+chart(w.symbol)+'</button>').join('')+'</div>':'<div class="fp34-empty"><p>Deine Watchlist ist noch leer. Im Depot kannst du Aktien merken; sie erscheinen hier unmittelbar.</p><button class="btn secondary" data-fp34-depot>Zum Depot</button></div>')+'</div>';
}
function renderDetail(){
 const s=active||watch[0]?.symbol||'',name=q(s)?.asset_name||s;
 if(!s)return '<div class="fp34"><h1>Aktienchart</h1><p>Wähle zuerst eine Aktie aus deiner Watchlist.</p><button class="btn" data-fp34-overview>Zu den Charts</button></div>';
 return '<div class="fp34"><div class="fp34-head"><div><span class="eyebrow">AKTIENCHART · '+esc(s)+'</span><h1>'+esc(name)+'</h1><p>Stand '+esc(q(s)?.quote_date||'unbekannt')+' · '+esc(q(s)?.source||'historische Kursreihe')+'</p></div></div>'+
 '<section class="fp34-detail-chart">'+chart(s)+'</section><div class="fp34-actions"><button type="button" class="btn secondary" data-fp34-depot-stock="'+esc(s)+'">Zur Aktie im Depot</button><button type="button" class="btn" data-fp34-stock-news="'+esc(s)+'">Aktuelle Nachrichten</button></div>'+
 '<section class="fp34-request"><h2>Analyse oder Werkzeug anfordern</h2><p>Wähle eine Recherche für '+esc(name)+'. Die Anfrage wird als öffentliches GitHub-Issue vorbereitet und bei der nächsten Redaktionsprüfung bearbeitet. Keine privaten Depotinformationen eintragen.</p>'+
 '<label for="fp34-request-kind">Gewünschter Inhalt</label><select id="fp34-request-kind"><option value="Komplettanalyse">Vollständige Aktienanalyse</option><option value="DCF und Szenarien">Bewertungsmodell mit Szenarien</option><option value="Lernkurs">Interaktiver Research-Lernkurs</option><option value="Research-Werkzeug">Neues Analysewerkzeug oder Skill</option></select><button class="btn secondary" data-fp34-request="'+esc(s)+'">Anfrage auf GitHub vorbereiten</button></section></div>';
}
function newsCard(n,extra=''){
 const link=safe(n.url);return '<article class="fp34-news-card"><small>'+esc(n.source||n.publisher||'Nachrichtenanbieter')+' · '+esc(n.published||'Datum prüfen')+'</small><h3>'+esc(n.title||'Nachricht')+'</h3>'+
 (n.why?'<p>'+esc(n.why)+'</p>':'')+(extra?'<p>'+extra+'</p>':'')+
 (link?'<a href="'+esc(link)+'" target="_blank" rel="noopener noreferrer">Originalquelle öffnen</a>':'')+'</article>';
}
function stockNews(symbol){
 const editorialNews=editorial.filter(n=>matches(n,symbol));
 const external=newsCache.get(symbol)?.data?.news||[];
 const normalized=external.slice(0,7).map(n=>({title:n.title,source:n.publisher,published:n.published?new Date(n.published*1000).toLocaleDateString('de-DE'):'',url:n.url}));
 // An item is either explicitly editorial (with context) or a clearly labelled external headline.
 const seen=new Set();return [...editorialNews,...normalized].filter(n=>{const key=String(n.title||'').toLowerCase();if(!key||seen.has(key))return false;seen.add(key);return true});
}
function renderNews(){
 const tabs=[['general','Gesamtmarkt'],['watch','Meine Aktien'],['discover','Entdecken']];
 const navigation='<div class="fp34-news-tabs" role="group" aria-label="Nachrichtenbereich">'+tabs.map(([id,name])=>'<button type="button" class="'+(tab===id?'selected':'')+'" data-fp34-news-tab="'+id+'">'+name+'</button>').join('')+'</div>';
 let body='';
 if(tab==='general'){
  const general=editorial.filter(n=>!Array.isArray(n.symbols)||n.symbols.length===0||n.category==='Markt'||n.category==='Zinsen');
  body='<h2>Allgemeine Finanzmarktnachrichten</h2><p>Redaktionell datierte Nachrichten, keine Lernaufgaben.</p>'+(general.length?general.map(n=>newsCard(n)).join(''):'<p>Für den heutigen Tag liegen keine aktuellen redaktionellen Nachrichten vor.</p>');
 }else if(tab==='watch'){
  body='<h2>Nachrichten zu deiner Watchlist</h2><p>Nach Unternehmen sortiert. Redaktionelle Einordnung und zusätzliche externe Schlagzeilen werden getrennt kenntlich gemacht.</p>'+
  (watch.length?watch.map(w=>'<section class="fp34-news-company" id="fp34-news-'+esc(w.symbol)+'"><header><h3>'+esc(q(w.symbol)?.asset_name||w.symbol)+'</h3><button class="btn secondary" data-fp34-chart="'+esc(w.symbol)+'">Zum Chart</button></header>'+
   (stockNews(w.symbol).length?stockNews(w.symbol).map(n=>newsCard(n)).join(''):'<p>'+ (pending.has('news:'+w.symbol)?'Nachrichten werden geladen …':'Keine neuen Meldungen für diese Aktie verfügbar.')+'</p>')+'</section>').join(''):'<p>Merke zuerst Unternehmen in deinem Depot.</p>');
 }else{
  const candidates=editorial.filter(n=>Array.isArray(n.symbols)&&n.symbols.length&&n.symbols.some(s=>!watch.some(w=>w.symbol===s)));
  body='<h2>Interessante Aktien entdecken</h2><p>Unternehmensmeldungen der Redaktion, die nicht bereits in deiner Watchlist sind. Keine Kaufempfehlungen.</p>'+
    (candidates.length?candidates.slice(0,12).map(n=>{const s=n.symbols.find(x=>!watch.some(w=>w.symbol===x));return '<article class="fp34-discover"><div><strong>'+esc(s)+'</strong><small>Unternehmensmeldung · '+esc(n.published)+'</small></div>'+newsCard(n)+'<button class="btn secondary" data-fp34-add="'+esc(s)+'">Auf meine Watchlist</button></article>'}).join(''):'<p>Heute keine neuen recherchierten Unternehmen außerhalb deiner Watchlist.</p>');
 }
 return '<div class="fp34"><span class="eyebrow">MÄRKTE · NACHRICHTEN</span><h1>News</h1><p>Redaktioneller Stand: '+esc(feedDate||'wird geladen')+'. Neue Watchlist-Titel werden bei Aufruf zusätzlich direkt beim Anbieter abgefragt.</p>'+navigation+
 (message?'<p role="status">'+esc(message)+'</p>':'')+'<div class="fp34-news-body">'+body+'</div></div>';
}
function stockDetail(s){
 if(!valid(s))return;
 active=s;window.FinanzPilotNavigation?.route('marketdetail');
 getAsset(s,'history');ui();
}
function openNews(s){
 newsFocus=valid(s)?s:'';tab='watch';
 window.FinanzPilotNavigation?.route('marketnews');
 refresh();
 if(newsFocus)getAsset(newsFocus,'news').then(()=>{const el=document.getElementById('fp34-news-'+newsFocus);el?.scrollIntoView({block:'start'})});
}
async function addStock(s){
 if(!valid(s)||!user()||!client()){message='Zum Merken bitte anmelden.';ui();return}
 message='Prüfe das Wertpapier …';ui();
 try{
  const result=await invoke('register',s),key=result?.quote?.symbol;
  if(!key)throw Error('Kein verifizierter Kurs gefunden');
  if(!watch.some(w=>w.symbol===key)){const r=await client().from('fp_paper_watchlist').insert({user_id:user(),symbol:key});if(r.error&&r.error.code!=='23505')throw r.error}
  message=key+' wurde der Watchlist hinzugefügt.';
  tab='watch';newsFocus=key;
  window.dispatchEvent(new Event('fp-watchlist-changed'));
  await refresh(true);
  await getAsset(key,'news');
  ui();
 }catch(e){message='Nicht hinzugefügt: '+String(e.message||e);ui()}
}
function request(s){
 const kind=document.getElementById('fp34-request-kind')?.value||'Komplettanalyse';
 const title=(kind==='Research-Werkzeug'?'Skillwunsch: ':'Analysewunsch: ')+s+' – '+kind;
 const body='Ticker: '+s+'\nGewünschte Lernmethode / Funktion: '+kind+'\nBitte recherchieren, Quellen prüfen und den Inhalt im FinanzPilot-Lernbereich verknüpfen. Kein persönlicher Depotauszug.\n\nHinweis: Dieses Issue ist öffentlich. Die Redaktion bearbeitet es beim nächsten geplanten Lauf.';
 window.open('https://github.com/marinusmeixner-dot/finanzpilot/issues/new?title='+encodeURIComponent(title)+'&body='+encodeURIComponent(body),'_blank','noopener,noreferrer');
}
function bind(root=document){
 root.querySelectorAll('[data-fp34-chart]').forEach(b=>b.addEventListener('click',()=>stockDetail(b.dataset.fp34Chart)));
 root.querySelectorAll('[data-fp34-news-tab]').forEach(b=>b.addEventListener('click',()=>{tab=b.dataset.fp34NewsTab;newsFocus='';ui();if(tab==='watch')loadWatchNews()}));
 root.querySelectorAll('[data-fp34-stock-news]').forEach(b=>b.addEventListener('click',()=>openNews(b.dataset.fp34StockNews)));
 root.querySelectorAll('[data-fp34-add]').forEach(b=>b.addEventListener('click',()=>addStock(b.dataset.fp34Add)));
 root.querySelectorAll('[data-fp34-depot-stock]').forEach(b=>b.addEventListener('click',()=>window.FinanzPilotPortfolio?.focus?.(b.dataset.fp34DepotStock)));
 root.querySelectorAll('[data-fp34-request]').forEach(b=>b.addEventListener('click',()=>request(b.dataset.fp34Request)));
 root.querySelectorAll('[data-fp34-refresh]').forEach(b=>b.addEventListener('click',()=>refresh(true)));
 root.querySelector('[data-fp34-login]')?.addEventListener('click',()=>window.FinanzPilotCloud?.openLogin?.());
 root.querySelector('[data-fp34-depot]')?.addEventListener('click',()=>window.FinanzPilotNavigation?.route('depot'));
 root.querySelector('[data-fp34-overview]')?.addEventListener('click',()=>window.FinanzPilotNavigation?.route('marketoverview'));
}
window.FinanzPilotMarkets={renderOverview,renderDetail,renderNews,bind,refresh,stockDetail,openNews,get watchlist(){return watch},get active(){return active}};
window.addEventListener('fp-navigation',()=>{if(typeof state!=='undefined'&&['marketoverview','marketnews','marketdetail'].includes(state.view)){refresh();if(state.view==='marketnews'&&tab==='watch')loadWatchNews()}});
window.addEventListener('fp-watchlist-changed',()=>refresh(true));
window.addEventListener('fp-auth-change',()=>refresh(true));
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>refresh(),{once:true});else refresh();
})();