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
let selectedArticle=null;const articleRegistry=new Map();
const articleKey=n=>String(n.id||n.url||n.title||'').slice(0,400);

const historyCache=new Map(),newsCache=new Map(),pending=new Map(),ranges=new Map();
const WINDOWS=[['1mo','1M'],['3mo','3M'],['6mo','6M'],['1y','1J'],['5y','5J'],['max','MAX']];
const rangeOf=s=>ranges.get(s)||'6mo';
const q=s=>quotes.find(x=>x.symbol===s)||null;
const ui=()=>{if(typeof state!=='undefined'&&['marketoverview','marketdetail','marketnews','marketarticle'].includes(state.view))window.render?.()};
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
 const [coreResult,dailyResult]=await Promise.allSettled([
  fetch('./data/editorial-core-v43.json?v=44',{cache:'no-store'}),
  fetch('./data/daily.json?m='+Date.now(),{cache:'no-store'})
 ]);
 const read=async value=>{
  if(value.status!=='fulfilled'||!value.value?.ok)return null;
  try{return await value.value.json()}catch{return null}
 };
 const core=await read(coreResult),daily=await read(dailyResult);
 const vetted=x=>x&&Array.isArray(x.article?.sections)&&x.article.sections.length>=4&&
  x.article.sections.every(section=>section.heading&&Array.isArray(section.paragraphs)&&section.paragraphs.length);
 const stable=Array.isArray(core?.stories)?core.stories.filter(vetted):[];
 const fresh=Array.isArray(daily?.stories)?daily.stories.filter(vetted):[];
 const seen=new Set();
 editorial=[...fresh,...stable].filter(item=>{
  const id=String(item.id||item.url||item.title||'');if(!id||seen.has(id))return false;
  seen.add(id);return true
 });
 feedDate=daily?.date||core?.updated_at||'unbekannt';
 lastRefresh=Date.now();
 if(!editorial.length)message='Zurzeit konnten keine vollständig lesbaren und überprüften FinanzPilot-Nachrichten geladen werden.';
}
const invoke=async(action,symbol,range)=>{const c=client();if(!c)throw Error('Bitte anmelden');const {data,error}=await c.functions.invoke('finanzpilot-stock-lookup',{body:{action,symbol,...(action==='history'?{range}: {})}});if(error||data?.error)throw Error(error?.message||data?.error);return data};
function getAsset(symbol,type,force=false,range=rangeOf(symbol)){
 const cache=type==='history'?historyCache:newsCache,id=type==='history'?symbol+':'+range:symbol,key=type+':'+id;
 const entry=cache.get(id);
 if(!force&&entry&&Date.now()-entry.time<300000)return Promise.resolve(entry.data);
 if(pending.has(key))return pending.get(key);
 const p=invoke(type,symbol,range).then(data=>{cache.set(id,{time:Date.now(),data});return data})
 .catch(e=>{cache.set(id,{time:Date.now()-260000,data:null,error:String(e.message||e)});return null})
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
  const previouslyKnown=new Set(watch.map(x=>x.symbol));
  watch=rows.data||[];const newSymbols=watch.map(x=>x.symbol).filter(x=>!previouslyKnown.has(x));
  const syms=[...new Set([...watch.map(x=>x.symbol),...(active?[active]:[])])];
  if(syms.length){
   const result=await client().from('fp_paper_quotes').select('symbol,asset_name,currency,price,quote_date,source').in('symbol',syms);
   if(result.error)throw result.error;quotes=result.data||[];
  }else quotes=[];
  message='';
  // Previously saved stocks appear immediately; historical charts hydrate asynchronously.
  hydrateCharts(watch.map(item=>item.symbol));
  // A newly followed company also gets its own provider headlines immediately.
  // Company news comes exclusively from fully readable editorial articles.

  if(active)getAsset(active,'history');
 }catch(e){message='Marktdaten konnten nicht aktualisiert werden: '+String(e.message||e)}
 finally{busy=false;ui();if(queued){queued=false;refresh(true)}}
}
async function hydrateCharts(symbols){
 for(let i=0;i<symbols.length;i+=4)await Promise.all(symbols.slice(i,i+4).map(symbol=>getAsset(symbol,'history')));
}
async function hydrateNewStocks(){return}
async function loadWatchNews(){return}
function entryFor(s){return historyCache.get(s+':'+rangeOf(s))}
function points(s){return (entryFor(s)?.data?.points||[]).filter(x=>Number(x.price)>0&&Number.isFinite(Number(x.price)))}
function chart(s){
 const range=rangeOf(s),entry=entryFor(s),data=points(s);
 const controls='<div class="fp35-ranges" role="group" aria-label="Zeitraum">'+WINDOWS.map(([r,l])=>'<button type="button" data-fp35-range="'+r+'" data-fp35-symbol="'+esc(s)+'" aria-pressed="'+(r===range)+'" class="'+(r===range?'active':'')+'">'+l+'</button>').join('')+'</div>';
 if(data.length<2)return '<div class="fp34-chart">'+controls+'<div class="fp34-chart-empty">'+(pending.has('history:'+s+':'+range)?'Kursverlauf wird geladen …':esc(entry?.error||'Keine historischen Kursdaten für diesen Zeitraum verfügbar.'))+'</div></div>';
 const vals=data.map(x=>Number(x.price)),min=Math.min(...vals),max=Math.max(...vals),span=Math.max(max-min,.00001);
 const xy=vals.map((v,i)=>(12+696*i/(vals.length-1)).toFixed(1)+','+(190-157*(v-min)/span).toFixed(1)).join(' ');
 const first=data[0],last=data.at(-1),change=(last.price/first.price-1)*100,source=entry.data;
 return '<div class="fp34-chart" data-fp35-container="'+esc(s)+'">'+controls+
 '<div class="fp34-chart-top"><strong>'+esc(currency(last.price,source.currency||q(s)?.currency))+'</strong><span class="'+(change>=0?'fp-depot-pos':'fp-depot-neg')+'">'+(change>=0?'+':'')+change.toFixed(2).replace('.',',')+' % im Zeitraum</span></div>'+
 '<div class="fp35-plot"><svg data-fp35-scrub="'+esc(s)+'" role="img" tabindex="0" aria-label="Interaktiver Kursverlauf: Berühren oder Pfeiltasten verwenden" viewBox="0 0 720 210"><polyline fill="none" stroke="#82deb5" stroke-width="3.5" points="'+xy+'"/></svg><div class="fp35-crosshair"></div><output class="fp35-tooltip"></output></div>'+
 '<small>'+esc(first.date)+' – '+esc(last.date)+' · '+esc(source.source||'Historische Schlusskurse')+'</small>'+
 (source.is_alternative_venue?'<p class="fp35-venue-note">'+esc(source.venue_note)+'</p>':'')+'</div>';
}

function renderOverview(){
 if(!user())return '<div class="fp34"><h1>Marktüberblick</h1><p>Hier erscheinen ausschließlich die Charts deiner Watchlist. Bitte melde dich für die private Watchlist an.</p><button class="btn" data-fp34-login>Anmelden</button></div>';
 return '<div class="fp34"><div class="fp34-head"><div><span class="eyebrow">MÄRKTE · DEINE TITEL</span><h1>Marktüberblick</h1><p>Alle gemerkten Aktien als Charts. Tippe auf einen Kursverlauf für Details.</p></div><button class="btn secondary" data-fp34-refresh>Aktualisieren</button></div>'+
 (message?'<p role="status">'+esc(message)+'</p>':'')+
 (watch.length?'<div class="fp34-chart-grid">'+watch.map(w=>'<article class="fp34-chart-card"><button type="button" class="fp35-chart-header" data-fp34-chart="'+esc(w.symbol)+'"><span class="fp34-title"><span><strong>'+esc(q(w.symbol)?.asset_name||w.symbol)+'</strong><small>'+esc(w.symbol)+' · '+esc(q(w.symbol)?.quote_date||'Kursstand wird geladen')+'</small></span><span aria-hidden="true">›</span></span></button>'+chart(w.symbol)+'</article>').join('')+'</div>':'<div class="fp34-empty"><p>Deine Watchlist ist noch leer. Im Depot kannst du Aktien merken; sie erscheinen hier unmittelbar.</p><button class="btn secondary" data-fp34-depot>Zum Depot</button></div>')+'</div>';
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
 const link=safe(n.url),id=articleKey(n);articleRegistry.set(id,n);
 return '<article class="fp34-news-card"><small>'+esc(n.source||n.publisher||'Nachrichtenanbieter')+' · '+esc(n.published||'Datum prüfen')+'</small>'+
 '<button class="fp36-news-title" type="button" data-fp36-read="'+esc(id)+'"><h3>'+esc(n.title||'Nachricht')+'</h3><small>Vollständigen kostenlosen FinanzPilot-Artikel lesen →</small></button>'+
 (n.why?'<p>'+esc(n.why)+'</p>':'')+(extra?'<p>'+extra+'</p>':'')+
 (link?'<a href="'+esc(link)+'" target="_blank" rel="noopener noreferrer">Originalquelle öffnen</a>':'')+'</article>';
}
function openArticle(id){
 const item=articleRegistry.get(id);if(!item)return false;
 selectedArticle=item;window.FinanzPilotNavigation?.route('marketarticle');return true;
}
const simpleTerms={EBIT:'Operativer Gewinn vor Zinsen und Steuern',EBITDA:'Operatives Ergebnis vor Zinsen, Steuern und Abschreibungen',Cashflow:'Tatsächliche Geldbewegungen eines Unternehmens',Kapitalkosten:'Erwartete Rendite, die Geldgeber für das Risiko verlangen',Marge:'Gewinn als Anteil am Umsatz',Umsatz:'Wert der verkauften Leistungen in einer Periode',Bilanz:'Vermögen und Finanzierung an einem Stichtag',BIP:'Bruttoinlandsprodukt: Wert aller produzierten Güter und Leistungen'};
function friendlyParagraph(p){let value=esc(p);let used=new Set();return value.replace(/\b(EBITDA|EBIT|Cashflow|Kapitalkosten|Marge|Umsatz|Bilanz|BIP)\b/g,word=>{if(used.has(word))return word;used.add(word);return '<strong class="fp37-article-key">'+word+'</strong>'})}
function glossaryFor(n){const content=(n.article?.sections||[]).flatMap(x=>x.paragraphs||[]).join(' ')+' '+(n.article?.lead||'');const terms=Object.entries(simpleTerms).filter(([word])=>new RegExp('\\b'+word+'\\b','i').test(content));return terms.length?'<details class="fp37-article-glossary"><summary>Begriffe einfach erklärt ('+terms.length+')</summary><dl>'+terms.map(([word,meaning])=>'<div><dt>'+esc(word)+'</dt><dd>'+esc(meaning)+'</dd></div>').join('')+'</dl></details>':''}
function renderArticle(){
 const n=selectedArticle;if(!n)return '<div class="fp34"><h1>Artikel nicht gefunden</h1><button type="button" class="btn" data-fp36-article-back>← Zurück</button></div>';
 const link=safe(n.url),article=n.article;
 const common='<div class="fp36-article-meta">'+esc(n.source||n.publisher||'Quelle')+' · '+esc(n.published||'Datum unbekannt')+'</div>';
 let body='';
 if(article?.sections?.length){
  body='<div class="fp37-one-minute"><small>DAS WICHTIGSTE IN EINER MINUTE</small><p>'+friendlyParagraph(article.lead||'')+'</p></div>'+
  article.sections.map(section=>'<section class="fp36-article-section"><h2>'+esc(section.heading||'')+'</h2>'+
   (Array.isArray(section.paragraphs)?section.paragraphs:[]).map(p=>'<p>'+friendlyParagraph(p)+'</p>').join('')+'</section>').join('')+
  '<section class="fp36-article-conclusion"><h2>Was du mitnehmen solltest</h2><p>'+friendlyParagraph(article.conclusion||'')+'</p></section>'+glossaryFor(n);
 }else if(n.why||n.impact){
  body='<div class="fp36-article-limited">Dieser Beitrag ist eine eigene, quellengestützte FinanzPilot-Einordnung. Der vollständige Originalartikel des Anbieters wird hier nicht kopiert.</div>'+
   '<section class="fp36-article-section"><h2>Bekannte Fakten und Ausgangslage</h2><p>'+esc(n.why||'')+'</p></section>'+
   '<section class="fp36-article-section"><h2>Finanzielle Bedeutung und offene Fragen</h2><p>'+esc(n.impact||'')+'</p></section>'+
   '<section class="fp36-article-section"><h2>Was noch geprüft werden muss</h2><p>Für ein eigenes Urteil sind Originalzahlen, Berichtszeiträume, Gegenargumente, mögliche Risiken und die Erwartungen im Aktienkurs entscheidend. Ein einzelner Nachrichtenbericht reicht nicht als Kauf- oder Verkaufsempfehlung.</p></section>';
 }else{
  const ticker=watch.find(w=>matches({title:n.title||'',symbols:n.symbols||[]},w.symbol))?.symbol;
  const similar=ticker?editorial.filter(x=>matches(x,ticker)&&x.article).slice(0,3):[];
  body='<div class="fp36-article-limited"><h2>Externe Schlagzeile</h2><p>Zu dieser Meldung sind nur Überschrift, Anbieter und Veröffentlichungszeitpunkt abrufbar. Der vollständige Verlagsartikel ist nicht zur Nachveröffentlichung freigegeben. FinanzPilot umgeht keine Bezahlschranken und erfindet keinen Artikeltext.</p></div>'+
  (similar.length?'<section class="fp36-article-section"><h2>Passende redaktionelle Hintergrundberichte</h2>'+similar.map(x=>{const k=articleKey(x);articleRegistry.set(k,x);return '<button type="button" class="fp36-related" data-fp36-read="'+esc(k)+'">'+esc(x.title)+' →</button>'}).join('')+'</section>':'<p>Es liegt noch keine eigenständig recherchierte Langfassung zu dieser einzelnen Schlagzeile vor.</p>');
 }
 return '<div class="fp34 fp36-article"><button type="button" class="btn secondary" data-fp36-article-back>← Zurück</button>'+
 '<span class="eyebrow">FINANZPILOT · '+(article?.sections?.length?'EIGENER HINTERGRUNDBERICHT':'QUELLEN &amp; EINORDNUNG')+'</span><h1>'+esc(n.title||'Nachricht')+'</h1>'+common+body+
 (link?'<div class="fp36-article-source"><strong>Originalquelle</strong><p>Überprüfe für weitere Einzelheiten den Originalbericht. Dieser kann extern zugangsbeschränkt sein.</p><a href="'+esc(link)+'" target="_blank" rel="noopener noreferrer">Zur Veröffentlichung von '+esc(n.source||n.publisher||'Anbieter')+'</a></div>':'')+'</div>';
}

function stockNews(symbol){
 // Publish only fully readable, independently authored and source-dated articles.
 // External headline metadata from a paywalled publisher is NOT a free article.
 return editorial.filter(n=>matches(n,symbol)&&Array.isArray(n.article?.sections)&&n.article.sections.length>=4);
}

function renderNews(){
 const tabs=[['general','Gesamtmarkt'],['watch','Meine Aktien'],['discover','Entdecken']];
 const navigation='<div class="fp34-news-tabs" role="group" aria-label="Nachrichtenbereich">'+tabs.map(([id,name])=>'<button type="button" class="'+(tab===id?'selected':'')+'" data-fp34-news-tab="'+id+'">'+name+'</button>').join('')+'</div>';
 let body='';
 if(tab==='general'){
  const general=editorial.filter(n=>!Array.isArray(n.symbols)||n.symbols.length===0||['Markt','Zinsen','Wirtschaft'].includes(n.category));
  body='<h2>Allgemeine Finanzmarktnachrichten</h2><p>Redaktionell datierte Nachrichten, keine Lernaufgaben.</p>'+(general.length?general.map(n=>newsCard(n)).join(''):'<p>Für den heutigen Tag liegen keine aktuellen redaktionellen Nachrichten vor.</p>');
 }else if(tab==='watch'){
  body='<h2>Nachrichten zu deiner Watchlist</h2><p>Nach Unternehmen sortierte, vollständig und kostenlos lesbare FinanzPilot-Beiträge. Keine Paywall-Meldungen.</p>'+
  (watch.length?watch.map(w=>'<section class="fp34-news-company" id="fp34-news-'+esc(w.symbol)+'"><header><h3>'+esc(q(w.symbol)?.asset_name||w.symbol)+'</h3><button class="btn secondary" data-fp34-chart="'+esc(w.symbol)+'">Zum Chart</button></header>'+
   (stockNews(w.symbol).length?stockNews(w.symbol).map(n=>newsCard(n)).join(''):'<p>'+ 'Für diese Aktie liegt noch kein vollständig frei lesbarer FinanzPilot-Artikel vor. Neue Watchlist-Titel werden automatisch in die private Redaktionswarteschlange aufgenommen und stündlich geprüft. Sobald ein geprüfter Artikel veröffentlicht wurde, erscheint er hier nach dem Aktualisieren. Für eine vollständige Aktienanalyse ist weiterhin eine ausdrückliche Anfrage nötig.'+'</p>')+'</section>').join(''):'<p>Merke zuerst Unternehmen in deinem Depot.</p>');
 }else{
  const candidates=editorial.filter(n=>Array.isArray(n.article?.sections)&&n.article.sections.length>=4&&Array.isArray(n.symbols)&&n.symbols.length&&n.symbols.some(s=>!watch.some(w=>w.symbol===s)));
  body='<h2>Interessante Aktien entdecken</h2><p>Unternehmensmeldungen der Redaktion, die nicht bereits in deiner Watchlist sind. Keine Kaufempfehlungen.</p>'+
    (candidates.length?candidates.slice(0,12).map(n=>{const s=n.symbols.find(x=>!watch.some(w=>w.symbol===x));return '<article class="fp34-discover"><div><strong>'+esc(s)+'</strong><small>Unternehmensmeldung · '+esc(n.published)+'</small></div>'+newsCard(n)+'<button class="btn secondary" data-fp34-add="'+esc(s)+'">Auf meine Watchlist</button></article>'}).join(''):'<p>Heute keine neuen recherchierten Unternehmen außerhalb deiner Watchlist.</p>');
 }
 return '<div class="fp34"><span class="eyebrow">MÄRKTE · NACHRICHTEN</span><h1>News</h1><p>Redaktioneller Stand: '+esc(feedDate||'wird geladen')+'. Hier stehen ausschließlich vollständig in FinanzPilot lesbare redaktionelle Artikel. Schlagzeilen ohne eigenen vollständigen FinanzPilot-Bericht werden nicht als Artikel angezeigt. Frei lesbare, selbst geschriebene Hintergrundberichte mit Originalquellen findest du direkt hier.</p><button type="button" class="btn secondary" data-fp38-news-refresh>Neuigkeiten aktualisieren</button>'+navigation+
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
 if(newsFocus)Promise.resolve().then(()=>document.getElementById('fp34-news-'+newsFocus)?.scrollIntoView({block:'start'}));
}
async function addStock(s){
 if(!valid(s)||!user()||!client()){message='Zum Merken bitte anmelden.';ui();return}
 message='Prüfe das Wertpapier …';ui();
 try{
  const result=await invoke('register',s),key=result?.quote?.symbol;
  if(!key)throw Error('Kein verifizierter Kurs gefunden');
  if(!watch.some(w=>w.symbol===key)){const r=await client().from('fp_paper_watchlist').insert({user_id:user(),symbol:key});if(r.error&&r.error.code!=='23505')throw r.error}
  message=key+' wurde der Watchlist hinzugefügt und für die stündliche redaktionelle Recherche vorgemerkt.';
  tab='watch';newsFocus=key;
  window.dispatchEvent(new Event('fp-watchlist-changed'));
  await refresh(true);

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

 root.querySelectorAll('[data-fp35-range]').forEach(b=>b.addEventListener('click',()=>{
  const symbol=b.dataset.fp35Symbol,range=b.dataset.fp35Range;if(!WINDOWS.some(x=>x[0]===range))return;
  ranges.set(symbol,range);ui();getAsset(symbol,'history',false,range);
 }));
 root.querySelectorAll('[data-fp35-scrub]').forEach(svg=>{
  const symbol=svg.dataset.fp35Scrub,root=svg.closest('[data-fp35-container]');
  const box=root?.querySelector('.fp35-tooltip'),line=root?.querySelector('.fp35-crosshair');
  const show=i=>{const a=points(symbol);if(!a.length||!box||!line)return;
   i=Math.max(0,Math.min(i,a.length-1));const p=a[i],left=100*i/(a.length-1);
   box.textContent=p.date+' · '+currency(p.price,entryFor(symbol)?.data?.currency||q(symbol)?.currency);
   box.style.left=left+'%';line.style.left=left+'%';box.classList.add('visible');line.classList.add('visible');
   svg.dataset.fp35Index=String(i);
  };
  const move=x=>{const r=svg.getBoundingClientRect();if(r.width)show(Math.round(Math.max(0,Math.min(1,(x-r.left)/r.width))*(points(symbol).length-1)))};
  svg.addEventListener('pointerdown',e=>move(e.clientX));
  svg.addEventListener('pointermove',e=>move(e.clientX));
  svg.addEventListener('touchstart',e=>{if(e.touches?.[0])move(e.touches[0].clientX)},{passive:true});
  svg.addEventListener('touchmove',e=>{if(e.touches?.[0])move(e.touches[0].clientX)},{passive:true});
  svg.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();show(Number(svg.dataset.fp35Index??(points(symbol).length-1))+(e.key==='ArrowRight'?1:-1))}});
  svg.addEventListener('pointerleave',()=>{box?.classList.remove('visible');line?.classList.remove('visible')});
 });

 root.querySelectorAll('[data-fp34-news-tab]').forEach(b=>b.addEventListener('click',()=>{tab=b.dataset.fp34NewsTab;newsFocus='';ui();if(tab==='watch')loadWatchNews()}));
 root.querySelectorAll('[data-fp36-read]').forEach(b=>b.addEventListener('click',()=>openArticle(b.dataset.fp36Read)));
 root.querySelector('[data-fp36-article-back]')?.addEventListener('click',()=>window.FinanzPilotNavigation?.goBack?.());
 root.querySelectorAll('[data-fp34-stock-news]').forEach(b=>b.addEventListener('click',()=>openNews(b.dataset.fp34StockNews)));
 root.querySelectorAll('[data-fp34-add]').forEach(b=>b.addEventListener('click',()=>addStock(b.dataset.fp34Add)));
 root.querySelectorAll('[data-fp34-depot-stock]').forEach(b=>b.addEventListener('click',()=>window.FinanzPilotPortfolio?.focus?.(b.dataset.fp34DepotStock)));
 root.querySelectorAll('[data-fp34-request]').forEach(b=>b.addEventListener('click',()=>request(b.dataset.fp34Request)));
 root.querySelectorAll('[data-fp37-news-request]').forEach(b=>b.addEventListener('click',()=>{const symbol=b.dataset.fp37NewsRequest;window.open('https://github.com/marinusmeixner-dot/finanzpilot/issues/new?title='+encodeURIComponent('Analysewunsch: Frei lesbarer Hintergrundartikel '+symbol)+'&body='+encodeURIComponent('Bitte für '+symbol+' einen vollständigen eigenständig verfassten FinanzPilot-Nachrichtenartikel mit frei zugänglicher Quelle, verständlichen Erklärungen und Gegenargumenten erstellen.'),'_blank','noopener,noreferrer')}));
 root.querySelectorAll('[data-fp34-refresh]').forEach(b=>b.addEventListener('click',()=>refresh(true)));
 root.querySelectorAll('[data-fp38-news-refresh]').forEach(b=>b.addEventListener('click',()=>refresh(true)));
 root.querySelector('[data-fp34-login]')?.addEventListener('click',()=>window.FinanzPilotCloud?.openLogin?.());
 root.querySelector('[data-fp34-depot]')?.addEventListener('click',()=>window.FinanzPilotNavigation?.route('depot'));
 root.querySelector('[data-fp34-overview]')?.addEventListener('click',()=>window.FinanzPilotNavigation?.route('marketoverview'));
}
window.FinanzPilotMarkets={renderOverview,renderDetail,renderNews,renderArticle,openArticle,bind,refresh,stockDetail,openNews,get watchlist(){return watch},get active(){return active}};
window.addEventListener('fp-navigation',()=>{if(typeof state!=='undefined'&&['marketoverview','marketnews','marketdetail'].includes(state.view)){refresh();if(state.view==='marketnews'&&tab==='watch')loadWatchNews()}});
window.addEventListener('fp-watchlist-changed',()=>refresh(true));
window.addEventListener('fp-auth-change',()=>refresh(true));
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>refresh(),{once:true});else refresh();
})();