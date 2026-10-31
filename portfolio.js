/* FinanzPilot v26 – broker-free virtual stock portfolio, immutable server-side order ledger. */
(function(){
 'use strict';
 const fmt=(value,currency='USD')=>new Intl.NumberFormat('de-DE',{style:'currency',currency,maximumFractionDigits:2}).format(Number(value)||0);
 const number=v=>new Intl.NumberFormat('de-DE',{maximumFractionDigits:2}).format(Number(v)||0);
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const initial=50000;
 let quotes=[],wallets=[],trades=[],watchlist=[],searchResults=[],searchTerm='',searching=false,lookupBusy=false,symbol='MSFT',side='BUY',qty='1',busy=false,loading=false,notice='',currentUser=null,hasLoaded=false;
 const user=()=>window.FinanzPilotCloud?.user||null;
 const client=()=>window.FinanzPilotCloud?.paperClient||null;
 const bySym=x=>quotes.find(q=>q.symbol===x);
 const jump=id=>{const fn=()=>document.getElementById?.(id)?.scrollIntoView?.({behavior:'smooth',block:'start'});if(typeof requestAnimationFrame==='function')requestAnimationFrame(fn);else fn()};
 const inspect=code=>window.FinanzPilotMarketWatch?.open(code);
 const timeBerlin=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const isFresh=q=>!!q&&q.quote_date<=timeBerlin()&&(Date.parse(timeBerlin()+'T12:00:00Z')-Date.parse(q.quote_date+'T12:00:00Z'))/864e5<=7;
 const round=x=>Math.round((Number(x)+Number.EPSILON)*100)/100;
 function calcPortfolio(xs=trades){
  const positions={};const realized={USD:0,EUR:0};
  for(const t of xs.slice().sort((a,b)=>new Date(a.traded_at)-new Date(b.traded_at)||String(a.id).localeCompare(String(b.id)))){
   const p=positions[t.symbol]||(positions[t.symbol]={symbol:t.symbol,currency:t.currency,qty:0,cost:0,realized:0});
   const n=Number(t.quantity),px=Number(t.price),total=Number(t.total),avg=p.qty>0?p.cost/p.qty:0;
   if(t.side==='BUY'){p.qty+=n;p.cost=round(p.cost+total)}
   else{
    if(n>p.qty)continue;
    p.qty-=n;p.cost=round(p.cost-avg*n);
    if(!p.qty)p.cost=0;
    p.realized=round(p.realized+total-avg*n);
    realized[t.currency]=round((realized[t.currency]||0)+total-avg*n);
   }
  }
  return {positions:Object.values(positions).filter(p=>p.qty>0),realized};
 }
 const holdings=s=>calcPortfolio().positions.find(p=>p.symbol===s)?.qty||0;
 function currencyStats(cur){
  const balance=wallets.find(w=>w.currency===cur)?.balance??initial,all=calcPortfolio(),pos=all.positions.filter(p=>p.currency===cur);
  const marked=pos.filter(p=>!!bySym(p.symbol));
  const value=round(marked.reduce((s,p)=>s+p.qty*Number(bySym(p.symbol).price),0));
  const invested=round(pos.reduce((s,p)=>s+p.cost,0));
  const cashMoves=trades.filter(t=>t.currency===cur).reduce((sum,t)=>sum+(t.side==='BUY'?-Number(t.total):Number(t.total)),0);
  const earnedBonus=Math.max(0,round(Number(balance)-initial-cashMoves));
  return {currency:cur,cash:Number(balance),value,invested,total:round(Number(balance)+value),pnl:round(Number(balance)+value-initial-earnedBonus),earnedBonus,realized:all.realized[cur]||0,positionCount:pos.length,unpriced:pos.some(p=>!bySym(p.symbol))};
 }
 function viewRefresh(){if(typeof state!=='undefined'&&state.view==='depot')window.render?.()}
 async function load(){
  if(!client()||!user()){quotes=[];wallets=[];trades=[];watchlist=[];searchResults=[];currentUser=null;hasLoaded=false;viewRefresh();return}
  if(loading)return;
  loading=true;const uid=user();
  if(currentUser&&currentUser!==uid){quotes=[];wallets=[];trades=[];watchlist=[];searchResults=[];hasLoaded=false}
  currentUser=uid;
  try{
   const {error:bonusError}=await client().rpc('fp_paper_claim_artifact_rewards');if(bonusError)console.warn('Depot-Belohnungsabgleich:',bonusError.message);
   const [w,t,wl]=await Promise.all([
    client().from('fp_paper_wallets').select('user_id,currency,balance,starting_balance').eq('user_id',uid),
    client().from('fp_paper_trades').select('id,symbol,currency,side,quantity,price,total,quote_date,source,traded_at').eq('user_id',uid).order('traded_at',{ascending:true}).limit(1000),
    client().from('fp_paper_watchlist').select('symbol,created_at').eq('user_id',uid).order('created_at',{ascending:false}).limit(500)
   ]);
   for(const result of [w,t,wl])if(result.error)throw result.error;
   const defaultSymbols=['MSFT','NVDA','AAPL','AMZN','META','SIEMENS','KION','VWCE','SPY','QQQ','ACWI','AIXTRON','CGNX'];
   const wanted=[...new Set([...defaultSymbols,...(t.data||[]).map(x=>x.symbol),...(wl.data||[]).map(x=>x.symbol),symbol])];
   const q=await client().from('fp_paper_quotes').select('symbol,asset_name,currency,price,quote_date,source,adjusted').in('symbol',wanted.slice(0,900)).order('symbol');
   if(q.error)throw q.error;
   if(uid!==user())return;
   quotes=q.data||[];wallets=w.data||[];trades=t.data||[];watchlist=wl.data||[];hasLoaded=true;notice='';
   if(!bySym(symbol)&&quotes.length)symbol=quotes[0].symbol;
  }catch(e){notice='Depotdaten konnten nicht geladen werden: '+String(e.message||e)}
  finally{loading=false;viewRefresh()}
 }
 async function trade(){
  if(busy||!client()||!user())return;
  const q=bySym(symbol),n=Number(qty);
  if(!q||!isFresh(q)){notice='Der Referenzkurs ist veraltet oder nicht verfügbar. Kein virtueller Handel möglich.';viewRefresh();return}
  if(!Number.isInteger(n)||n<1||n>10000){notice='Bitte eine ganze Stückzahl zwischen 1 und 10.000 eingeben.';viewRefresh();return}
  const total=round(Number(q.price)*n),stats=currencyStats(q.currency);
  if(side==='BUY'&&total>stats.cash){notice='Nicht genügend virtuelles Guthaben.';viewRefresh();return}
  if(side==='SELL'&&n>holdings(symbol)){notice='Du kannst nicht mehr Anteile verkaufen, als im Depot liegen.';viewRefresh();return}
  if(!window.confirm('Virtuelle '+(side==='BUY'?'Kauf-':'Verkaufs-')+'simulation: '+n+' × '+q.symbol+' zu ungefähr '+fmt(total,q.currency)+' (Referenzschlusskurs '+q.quote_date+'). Keine echte Börsenorder. Fortfahren?'))return;
  busy=true;notice='Server prüft den virtuellen Auftrag …';viewRefresh();
  try{
   const {data,error}=await client().rpc('fp_paper_execute',{p_symbol:symbol,p_side:side,p_quantity:n});
   if(error)throw error;
   notice='Virtueller '+(side==='BUY'?'Kauf':'Verkauf')+' gespeichert: '+n+' × '+data.symbol+' zu '+fmt(data.price,data.currency)+' je Anteil am '+data.quote_date+'.';
   await load();notice='Virtueller Auftrag erfolgreich verbucht. Historischer Schlusskurs, kein Livehandel.';
  }catch(e){notice='Auftrag nicht ausgeführt: '+String(e.message||e)}
  finally{busy=false;viewRefresh()}
 }
 async function lookup(action,payload){
   if(!client()||!user())throw Error('Bitte anmelden');
   const response=await client().functions.invoke('finanzpilot-stock-lookup',{body:{action,...payload}});
   if(response.error)throw Error(response.data?.error||response.error.message||'Börsenanbieter nicht erreichbar');
   if(response.data?.error)throw Error(response.data.error);
   return response.data;
 }
 async function searchStocks(query){
   if(searching)return;
   searchTerm=String(query||'').trim().slice(0,64);
   if(searchTerm.length<2){notice='Bitte Unternehmensname oder Börsensymbol eingeben.';viewRefresh();return}
   searching=true;searchResults=[];notice='Suche nach Aktien und ETFs …';viewRefresh();
   try{const r=await lookup('search',{query:searchTerm});searchResults=r.results||[];notice=searchResults.length?'Suchergebnisse von '+r.provider+'.':'Keine Treffer oder Suchdienst eingeschränkt. Du kannst ein bekanntes Börsensymbol direkt prüfen.'}
   catch(e){notice='Aktiensuche vorübergehend nicht verfügbar: '+String(e.message||e)+'. Bekanntes Börsensymbol kann direkt geprüft werden.'}
   finally{searching=false;viewRefresh()}
 }
 async function registerStock(code,saveToWatchlist=false,goTrade=false){
   if(lookupBusy)return;
   lookupBusy=true;notice='Prüfe Börsenplatz, Typ, Währung und letzten Schlusskurs …';viewRefresh();
   try{
    const out=await lookup('register',{symbol:String(code).toUpperCase()});
    if(!out?.quote?.symbol)throw Error('Kein verifizierter Kurs gefunden');
    const key=out.quote.symbol;
    if(saveToWatchlist&&!watchlist.some(w=>w.symbol===key)){
      const {error:e}=await client().from('fp_paper_watchlist').insert({user_id:user(),symbol:key});
      if(e&&e.code!=='23505')throw e;
    }
    if(goTrade)symbol=key;await load();
    notice=(saveToWatchlist?'Watchlist gespeichert. ':'')+out.quote.asset_name+' ('+key+') · geprüfter Schlusskurs '+out.quote.quote_date+' · '+fmt(out.quote.price,out.quote.currency)+'. Kein Livepreis.';
   }catch(e){notice='Wertpapier konnte nicht hinzugefügt werden: '+String(e.message||e)}
   finally{lookupBusy=false;viewRefresh();if(!notice.startsWith('Wertpapier konnte'))jump(goTrade?'fp-depot-order-panel':'fp-depot-watchlist')}
 }
 async function removeWatch(code){
  try{const {error:e}=await client().from('fp_paper_watchlist').delete().eq('user_id',user()).eq('symbol',code);if(e)throw e;
   watchlist=watchlist.filter(x=>x.symbol!==code);notice=code+' aus deiner Watchlist entfernt. Depotpositionen bleiben erhalten.';viewRefresh();
  }catch(e){notice='Watchlist konnte nicht geändert werden: '+String(e.message||e);viewRefresh()}
 }
 const stat=(s,label,cur)=>'<div class="fp-depot-stat"><small>'+esc(label)+'</small><strong>'+fmt(s,cur)+'</strong></div>';
 function render(){
  if(!user())return '<section class="fp-depot"><div class="fp-depot-hero"><span class="eyebrow">PAPIERDEPOT · KEINE ECHTEN ORDERS</span><h1>Dein virtuelles Depot</h1><p>Übe Aktienkäufe, beobachte Kursentwicklungen und lerne aus Entscheidungen. Die Handelsdaten werden privat deinem Konto zugeordnet.</p></div><div class="fp-depot-empty"><h2>Zum virtuellen Depot anmelden</h2><p>Für sichere Käufe und Verkäufe ist dein kostenloses FinanzPilot-Konto erforderlich. Deine Lernfortschritte bleiben unangetastet.</p><button class="btn" data-depot-login>Anmelden →</button></div></section>';
  if(!hasLoaded&&!quotes.length)return '<section class="fp-depot"><h1>Dein virtuelles Depot</h1><p>'+esc(notice||'Deine virtuellen Handelsdaten werden geladen …')+'</p><button class="btn secondary" data-depot-reload>Erneut versuchen</button></section>';
  const q=bySym(symbol),n=Number(qty)||0,price=Number(q?.price)||0,total=round(n*price),curr=q?.currency||'USD',stats=currencyStats(curr),own=holdings(symbol),fresh=isFresh(q);
  const currencies=[...new Set(['EUR','USD',...wallets.map(w=>w.currency),...calcPortfolio().positions.map(p=>p.currency),...watchlist.map(w=>bySym(w.symbol)?.currency).filter(Boolean)])];
  const books=currencies.map(cur=>{const s=currencyStats(cur);const diff=s.pnl;return '<section class="fp-depot-wallet"><div class="fp-depot-wallet-title"><b>'+esc(cur)+'-Depot</b><span>Start: '+fmt(initial,cur)+(s.earnedBonus?' · Prämien +'+fmt(s.earnedBonus,cur):'')+'</span></div><div class="fp-depot-wallet-big"><small>Virtueller Depotwert inkl. Kasse</small><strong>'+fmt(s.total,cur)+'</strong><span class="'+(diff>=0?'fp-depot-pos':'fp-depot-neg')+'">'+(diff>=0?'+':'')+fmt(diff,cur)+' ('+number(diff/initial*100)+' %)</span></div><div class="fp-depot-wallet-grid">'+stat(s.cash,'Frei verfügbar',cur)+stat(s.value,'Aktienwert',cur)+stat(s.realized,'Realisierte Kursdifferenz',cur)+'</div>'+(s.unpriced?'<small>Mindestens eine Position besitzt keinen aktuellen Referenzkurs. Depotwert möglicherweise unvollständig.</small>':'')+'</section>'}).join('');
  const pos=calcPortfolio().positions;
  const body=pos.length?pos.map(p=>{const quote=bySym(p.symbol),market=quote?round(p.qty*Number(quote.price)):null,diff=market===null?null:round(market-p.cost),pct=p.cost?diff/p.cost*100:0;return '<button type="button" data-depot-inspect="'+esc(p.symbol)+'" class="fp-depot-position"><span><b>'+esc(p.symbol)+'</b><small>'+esc(quote?.asset_name||'Kurs nicht verfügbar')+'</small></span><span><b>'+p.qty+' Stück</b><small>Kaufbasis '+fmt(p.cost,p.currency)+'</small></span><span class="fp-depot-position-value"><b>'+(market===null?'–':fmt(market,p.currency))+'</b><small class="'+(diff===null?'':diff>=0?'fp-depot-pos':'fp-depot-neg')+'">'+(diff===null?'–':(diff>=0?'+':'')+fmt(diff,p.currency)+' / '+number(pct)+' %')+'</small></span></button>'}).join(''):'<div class="fp-depot-empty"><b>Dein Depot ist noch leer.</b><p>Wähle eine Aktie oder einen ETF und starte mit einer virtuellen Kaufentscheidung.</p></div>';
  const rows=trades.slice().reverse().slice(0,80).map(t=>'<tr><td>'+esc(new Date(t.traded_at).toLocaleDateString('de-DE'))+'</td><td><b>'+esc(t.symbol)+'</b><small>'+esc(t.quote_date)+'</small></td><td><span class="'+(t.side==='BUY'?'fp-depot-buy':'fp-depot-sell')+'">'+(t.side==='BUY'?'Kauf':'Verkauf')+'</span></td><td>'+t.quantity+'</td><td>'+fmt(t.price,t.currency)+'</td><td>'+fmt(t.total,t.currency)+'</td></tr>').join('');
  const options=quotes.filter(x=>watchlist.some(w=>w.symbol===x.symbol)||trades.some(t=>t.symbol===x.symbol)||x.symbol===symbol||['MSFT','NVDA','AAPL','AMZN','META','SIEMENS','KION','VWCE'].includes(x.symbol)).map(x=>'<option value="'+esc(x.symbol)+'" '+(symbol===x.symbol?'selected':'')+'>'+esc(x.asset_name)+' · '+esc(x.symbol)+' ('+esc(x.currency)+')</option>').join('');
  return '<div class="fp-depot"><div class="fp-depot-hero"><span class="eyebrow">FINANZPILOT · VIRTUELLES AKTIENDEPOT</span><h1>Dein Depot</h1><p>Kaufe und verkaufe Wertpapiere mit Spielgeld, vergleiche Entscheidungen und trainiere deine Strategie. Keine realen Börsenorders, keine Anbindung an ein Bankkonto.</p><div class="fp-depot-topactions"><button class="btn secondary" data-depot-reload>Depot aktualisieren</button><small>Kursquelle: Yahoo Finance (teilweise inoffiziell), datierte Schlusskurse – keine Livepreise.</small></div></div><div class="fp-depot-wallets">'+books+'</div>'+
   '<section class="fp-depot-panel fp-depot-search"><header><h2>Aktien weltweit suchen</h2><small>Unternehmensname, ISIN oder Börsenkürzel</small></header>'+
  '<form id="fp-depot-search-form" class="fp-depot-search-form"><input name="query" type="search" maxlength="64" value="'+esc(searchTerm)+'" placeholder="z. B. Alphabet, SAP.DE, ASML.AS, BRK-B" aria-label="Aktie suchen"><button class="btn" type="submit" '+(searching?'disabled':'')+'>'+(searching?'Sucht …':'Suchen')+'</button></form>'+
  (searchResults.length?'<div class="fp-depot-search-results">'+searchResults.map(x=>'<div class="fp-depot-search-item"><span><b>'+esc(x.name)+'</b><small>'+esc(x.symbol)+' · '+esc(x.exchange)+' · '+esc(x.type)+'</small></span><button type="button" class="btn secondary" data-depot-add="'+esc(x.symbol)+'">Merken</button><button type="button" class="btn" data-depot-pick="'+esc(x.symbol)+'">Handeln</button></div>').join('')+'</div>':'')+
  (/^[A-Za-z0-9][A-Za-z0-9.\-]{0,23}$/.test(searchTerm)?'<button type="button" class="btn secondary" data-depot-direct="'+esc(searchTerm.toUpperCase())+'">Börsensymbol '+esc(searchTerm.toUpperCase())+' direkt prüfen →</button>':'')+
  '<p class="fp-depot-warning">Weltweite Suche über einen kostenlosen, inoffiziellen Anbieter. Nicht jeder Börsenplatz, jede ISIN oder jede Aktie ist dort verfügbar. Gehandelt wird nur, wenn ein gültiger, datierter Schlusskurs geprüft werden konnte.</p></section>'+
  '<section class="fp-depot-panel" id="fp-depot-watchlist"><header><h2>Meine Watchlist</h2><small>'+watchlist.length+' gemerkte Werte</small></header>'+
  (watchlist.length?'<div class="fp-depot-search-results">'+watchlist.map(w=>{const x=bySym(w.symbol);return '<div class="fp-depot-search-item"><span><b>'+esc(x?.asset_name||w.symbol)+'</b><small>'+esc(w.symbol)+(x?' · '+fmt(x.price,x.currency)+' · Stand '+esc(x.quote_date):' · Preis derzeit nicht verfügbar')+'</small></span><button type="button" class="btn secondary" data-depot-inspect="'+esc(w.symbol)+'">Chart & News</button><button type="button" class="btn secondary" data-depot-pick="'+esc(w.symbol)+'">Handeln</button><button type="button" class="btn secondary" data-depot-remove="'+esc(w.symbol)+'">Entfernen</button></div>'}).join('')+'</div>':'<p>Suche nach einem Unternehmen und tippe auf „Merken“.</p>')+'</section>'+
   '<section class="fp-depot-panel"><header><h2>Meine Positionen</h2><small>'+pos.length+' aktuelle Werte</small></header><div class="fp-depot-positions">'+body+'</div></section>'+
   '<section class="fp-depot-panel" id="fp-depot-order-panel"><header><h2>Virtuell handeln</h2><small>Serverseitig geprüft · nur ganze Stücke</small></header><form id="fp-depot-order" class="fp-depot-order"><label>Wertpapier<select name="symbol" data-depot-symbol>'+options+'</select></label><div class="fp-depot-order-grid"><label>Aktion<select name="side" data-depot-side><option value="BUY" '+(side==='BUY'?'selected':'')+'>Virtuell kaufen</option><option value="SELL" '+(side==='SELL'?'selected':'')+'>Virtuell verkaufen</option></select></label><label>Stückzahl<input name="quantity" type="number" inputmode="numeric" min="1" max="10000" step="1" value="'+esc(qty)+'" data-depot-qty required></label></div>'+
   (q?'<div class="fp-depot-order-preview"><div><span>Referenzpreis vom '+esc(q.quote_date)+'</span><b>'+fmt(price,curr)+'</b></div><div><span>Geplanter Auftragswert</span><b>'+fmt(total,curr)+'</b></div><div><span>'+((side==='BUY')?'Verfügbare Kasse':'Im Depot verfügbar')+'</span><b>'+((side==='BUY')?fmt(stats.cash,curr):own+' Stück')+'</b></div></div>':'')+
   '<p class="fp-depot-warning">'+(fresh?'Dieser historische, ggf. adjustierte Tagesschlusskurs dient nur als Simulations-Referenz.':'Der letzte verfügbare Kurs ist älter als sieben Tage. Bis zur Aktualisierung werden keine neuen Aufträge angenommen.')+' Währungsumrechnungen und echte Gebühren/Dividenden werden nicht simuliert.</p>'+
   '<button class="btn" type="submit" '+(!fresh||busy||!Number.isInteger(n)||n<1||n>10000||(side==='BUY'&&total>stats.cash)||(side==='SELL'&&n>own)?'disabled':'')+'>'+(busy?'Prüfung läuft …':side==='BUY'?'Virtuellen Kauf bestätigen':'Virtuellen Verkauf bestätigen')+'</button></form><p role="status" class="fp-depot-message">'+esc(notice)+'</p></section>'+
   (q&&window.FinanzPilotCharts?'<div class="fp-depot-chart">'+(/^(MSFT|NVDA|AAPL|AMZN|META|SIEMENS|SPY|QQQ|ACWI|KION|AIXTRON|CGNX|VWCE)$/.test(q.symbol)?window.FinanzPilotCharts.html(q.symbol,q.asset_name+' · Schlusskurse'):'<div class="fp-depot-panel"><header><h2>'+esc(q.asset_name)+' – Referenzkurs</h2></header><p>'+fmt(q.price,q.currency)+' · Stand: '+esc(q.quote_date)+' · '+esc(q.source||'Kursquelle')+'</p><p>Für diesen neu gefundenen Börsenwert ist in der App noch keine historische Chartreihe gespeichert.</p><a href="https://finance.yahoo.com/quote/'+encodeURIComponent(q.symbol)+'/" target="_blank" rel="noopener noreferrer">Historischen Kursverlauf beim Anbieter ansehen ↗</a></div>')+'</div>':'')+
   '<section class="fp-depot-panel"><header><h2>Transaktionshistorie</h2><small>Deine echten virtuellen Buchungen, keine Musterorders</small></header>'+(trades.length?'<div class="fp-depot-table-scroll"><table><thead><tr><th>Datum</th><th>Wert</th><th>Aktion</th><th>Stück</th><th>Preis</th><th>Summe</th></tr></thead><tbody>'+rows+'</tbody></table></div>':'<p>Noch keine Käufe oder Verkäufe.</p>')+'</section>'+
   '<p class="fp-depot-fineprint">Dieses Übungsdepot startet unabhängig von Forschungspunkten und Belohnungen mit 50.000 EUR und 50.000 USD Spielgeld; bei weiteren von der Börsensuche unterstützten Währungen entsteht jeweils ein eigenes virtuelles Startkonto von 50.000 Einheiten. Die Währungen werden getrennt ausgewertet, weil ein geprüfter EUR/USD-Wechselkurs fehlt. Historische Referenzkurse (je nach Datenquelle adjustiert oder unbereinigt) bilden Ausführungskurse, Steuern, Ordergebühren, Dividenden und Kapitalmaßnahmen nicht vollständig ab; daher handelt es sich um ein Lernmodell und keine belastbare Renditeabrechnung.</p></div>';
 }
 function bind(root=document){
  root.querySelector('[data-depot-login]')?.addEventListener('click',()=>window.FinanzPilotCloud?.openLogin?.());
  root.querySelectorAll('[data-depot-reload]').forEach(b=>b.addEventListener('click',load));
  root.querySelectorAll('[data-depot-inspect]').forEach(b=>b.addEventListener('click',()=>inspect(b.dataset.depotInspect)));
  root.querySelector('#fp-depot-search-form')?.addEventListener('submit',e=>{e.preventDefault();searchStocks(e.currentTarget.elements.query.value)});
  root.querySelectorAll('[data-depot-add]').forEach(b=>b.addEventListener('click',()=>registerStock(b.dataset.depotAdd,true,false)));
  root.querySelectorAll('[data-depot-pick]').forEach(b=>b.addEventListener('click',()=>registerStock(b.dataset.depotPick,false,true)));
  root.querySelectorAll('[data-depot-direct]').forEach(b=>b.addEventListener('click',()=>registerStock(b.dataset.depotDirect,true,true)));
  root.querySelectorAll('[data-depot-remove]').forEach(b=>b.addEventListener('click',()=>removeWatch(b.dataset.depotRemove)));
  root.querySelector('[data-depot-symbol]')?.addEventListener('change',ev=>{symbol=ev.target.value;viewRefresh()});
  root.querySelector('[data-depot-side]')?.addEventListener('change',ev=>{side=ev.target.value;viewRefresh()});
  root.querySelector('[data-depot-qty]')?.addEventListener('change',ev=>{qty=ev.target.value;viewRefresh()});
  root.querySelector('#fp-depot-order')?.addEventListener('submit',ev=>{ev.preventDefault();const f=ev.currentTarget;symbol=f.elements.symbol.value;side=f.elements.side.value;qty=f.elements.quantity.value;trade()});
 }
 function pick(code){symbol=String(code||'').toUpperCase();window.FinanzPilotNavigation?.route('depot');load();jump('fp-depot-order-panel')}
 window.FinanzPilotPortfolio={render,bind,load,trade,pick,searchStocks,registerStock,removeWatch,calcPortfolio,currencyStats,isFresh,get quotes(){return quotes},get trades(){return trades},get watchlist(){return watchlist}};
 window.addEventListener('fp-auth-change',load);
 window.addEventListener('online',()=>{if(user())load()});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&user())load()});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load();
})();
