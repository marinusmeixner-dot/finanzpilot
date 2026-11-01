/* FinanzPilot v26 – broker-free virtual stock portfolio, immutable server-side order ledger. */
(function(){
 'use strict';
 const fmt=(value,currency='USD')=>new Intl.NumberFormat('de-DE',{style:'currency',currency,maximumFractionDigits:2}).format(Number(value)||0);
 const number=v=>new Intl.NumberFormat('de-DE',{maximumFractionDigits:2}).format(Number(v)||0);
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const initial=1000;
 let quotes=[],wallets=[],trades=[],fxRates=[],watchlist=[],searchResults=[],searchTerm='',searching=false,searchTicket=0,lookupBusy=false,symbol='MSFT',side='BUY',qty='0.25',orderMode='amount',orderAmount='50',fxRefreshAt=0,busy=false,loading=false,notice='',currentUser=null,hasLoaded=false;
 const user=()=>window.FinanzPilotCloud?.user||null;
 const client=()=>window.FinanzPilotCloud?.paperClient||null;
 const bySym=x=>quotes.find(q=>q.symbol===x);
 const jump=id=>{const fn=()=>document.getElementById?.(id)?.scrollIntoView?.({behavior:'smooth',block:'start'});if(typeof requestAnimationFrame==='function')requestAnimationFrame(fn);else fn()};
 const inspect=code=>window.FinanzPilotMarkets?.stockDetail(code);
 const timeBerlin=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const isFresh=q=>!!q&&q.quote_date<=timeBerlin()&&(Date.parse(timeBerlin()+'T12:00:00Z')-Date.parse(q.quote_date+'T12:00:00Z'))/864e5<=7;
 const round=x=>Math.round((Number(x)+Number.EPSILON)*100)/100;
 const fmtQty=n=>Number(n).toLocaleString('de-DE',{maximumFractionDigits:6});
 const rateFor=cur=>{
  if(cur==='EUR')return 1;
  const r=fxRates.find(x=>x.currency===cur);
  return r&&isFresh({quote_date:r.quote_date})?Number(r.eur_per_unit):null;
 };
 function calcPortfolio(xs=trades){
  const positions={};let realizedEUR=0;
  for(const t of xs.slice().sort((a,b)=>new Date(a.traded_at)-new Date(b.traded_at)||String(a.id).localeCompare(String(b.id)))){
   const p=positions[t.symbol]||(positions[t.symbol]={symbol:t.symbol,currency:t.currency,qty:0,cost:0,costEUR:0,realizedEUR:0});
   const n=Number(t.quantity),total=Number(t.total),totalEUR=Number(t.eur_total??(Number(t.total)*Number(t.fx_eur_per_unit||1)));
   if(t.side==='BUY'){p.qty+=n;p.cost=round(p.cost+total);p.costEUR=round(p.costEUR+totalEUR)}
   else{
    if(n>p.qty+1e-7)continue;
    const fraction=n/p.qty,removed=p.cost*fraction,removedEUR=p.costEUR*fraction;
    p.qty=Math.max(0,Number((p.qty-n).toFixed(6)));
    p.cost=round(p.cost-removed);p.costEUR=round(p.costEUR-removedEUR);
    if(p.qty===0){p.cost=0;p.costEUR=0}
    p.realizedEUR=round(p.realizedEUR+totalEUR-removedEUR);
    realizedEUR=round(realizedEUR+totalEUR-removedEUR);
   }
  }
  return {positions:Object.values(positions).filter(p=>p.qty>0.0000001),realizedEUR};
 }
 const holdings=s=>calcPortfolio().positions.find(p=>p.symbol===s)?.qty||0;
 function currencyStats(){
  const balance=Number(wallets.find(w=>w.currency==='EUR')?.balance??initial),all=calcPortfolio(),pos=all.positions;
  const marked=pos.filter(p=>!!bySym(p.symbol)&&rateFor(p.currency)!==null);
  const value=round(marked.reduce((s,p)=>s+p.qty*Number(bySym(p.symbol).price)*rateFor(p.currency),0));
  const invested=round(pos.reduce((s,p)=>s+p.costEUR,0));
  const moves=trades.reduce((sum,t)=>sum+(t.side==='BUY'?-Number(t.eur_total||0):Number(t.eur_total||0)),0);
  const earnedBonus=Math.max(0,round(balance-initial-moves));
  return {currency:'EUR',cash:balance,value,invested,total:round(balance+value),
   pnl:round(balance+value-initial-earnedBonus),earnedBonus,realized:all.realizedEUR||0,
   positionCount:pos.length,unpriced:marked.length!==pos.length};
 }

 function viewRefresh(){if(typeof state!=='undefined'&&state.view==='depot')window.render?.()}
 async function load(){
  if(!client()||!user()){quotes=[];wallets=[];trades=[];fxRates=[];watchlist=[];searchResults=[];currentUser=null;hasLoaded=false;viewRefresh();return}
  if(loading)return new Promise(resolve=>window.addEventListener('fp-portfolio-loaded',resolve,{once:true}));
  loading=true;const uid=user();
  if(currentUser&&currentUser!==uid){quotes=[];wallets=[];trades=[];fxRates=[];watchlist=[];searchResults=[];hasLoaded=false}
  currentUser=uid;
  try{
   const {error:bonusError}=await client().rpc('fp_paper_claim_artifact_rewards');if(bonusError)console.warn('Depot-Belohnungsabgleich:',bonusError.message);
   if(Date.now()-fxRefreshAt>3600000){
    try{await lookup('fx',{});fxRefreshAt=Date.now()}catch(e){console.warn('EZB-FX-Aktualisierung:',String(e.message||e))}
   }
   const [w,t,wl,fx]=await Promise.all([
    client().from('fp_paper_wallets').select('user_id,currency,balance,starting_balance').eq('user_id',uid),
    client().from('fp_paper_trades').select('id,symbol,currency,side,quantity,price,total,eur_total,fx_eur_per_unit,quote_date,source,traded_at').eq('user_id',uid).order('traded_at',{ascending:true}).limit(1000),
    client().from('fp_paper_watchlist').select('symbol,created_at').eq('user_id',uid).order('created_at',{ascending:false}).limit(500),
    client().from('fp_paper_fx_rates').select('currency,eur_per_unit,quote_date,source')
   ]);
   for(const result of [w,t,wl,fx])if(result.error)throw result.error;
   const defaultSymbols=['MSFT','NVDA','AAPL','AMZN','META','SIEMENS','KION','VWCE','SPY','QQQ','ACWI','AIXTRON','CGNX'];
   const wanted=[...new Set([...defaultSymbols,...(t.data||[]).map(x=>x.symbol),...(wl.data||[]).map(x=>x.symbol),symbol])];
   const q=await client().from('fp_paper_quotes').select('symbol,asset_name,currency,price,quote_date,source,adjusted').in('symbol',wanted.slice(0,900)).order('symbol');
   if(q.error)throw q.error;
   if(uid!==user())return;
   quotes=q.data||[];wallets=w.data||[];trades=t.data||[];fxRates=fx.data||[];watchlist=wl.data||[];hasLoaded=true;notice='';
   if(!bySym(symbol)&&quotes.length)symbol=quotes[0].symbol;
  }catch(e){notice='Depotdaten konnten nicht geladen werden: '+String(e.message||e)}
  finally{loading=false;viewRefresh();window.dispatchEvent?.(new Event('fp-portfolio-loaded'))}
 }
 async function trade(){
  if(busy||!client()||!user())return;
  const q=bySym(symbol),r=q&&rateFor(q.currency);
  if(!q||!isFresh(q)){notice='Der Referenzkurs ist veraltet oder nicht verfügbar. Kein virtueller Handel möglich.';viewRefresh();return}
  if(!r){notice='Für diese Handelswährung fehlt ein aktueller EZB-Referenzkurs. Bitte „Depot aktualisieren“ nutzen.';viewRefresh();return}
  const amount=Number(String(orderAmount).replace(',','.')),fraction=Number(String(qty).replace(',','.'));
  if(orderMode==='amount'&&(!Number.isFinite(amount)||amount<0.01||amount>100000)){
   notice='Bitte einen Eurobetrag von mindestens 0,01 € eingeben.';viewRefresh();return}
  if(orderMode==='shares'&&(!Number.isFinite(fraction)||fraction<.000001||fraction>10000||fraction!==Number(fraction.toFixed(6)))){
   notice='Gültige Stückzahl mit bis zu sechs Nachkommastellen eingeben.';viewRefresh();return}
  const n=orderMode==='amount'?Math.floor(amount/(Number(q.price)*r)*1e6)/1e6:fraction;
  if(n<.000001){notice='Für diesen Eurobetrag kann noch kein Bruchstück von 0,000001 Anteilen gekauft werden.';viewRefresh();return}
  const euros=round(Number(q.price)*r*n),stats=currencyStats();
  if(side==='BUY'&&euros>stats.cash){notice='Nicht genug virtuelles Euroguthaben.';viewRefresh();return}
  if(side==='SELL'&&n>holdings(symbol)+1e-7){notice='Du kannst nicht mehr Anteile verkaufen, als im Depot liegen.';viewRefresh();return}
  if(!window.confirm('Virtuelle '+(side==='BUY'?'Kauf-':'Verkaufs-')+'simulation: ungefähr '+fmtQty(n)+' Anteile '+q.symbol+' für '+fmt(euros,'EUR')+' zum Referenzschlusskurs '+q.quote_date+'. Keine echte Börsenorder. Fortfahren?'))return;
  busy=true;notice='Server prüft den virtuellen Auftrag …';viewRefresh();
  try{
   const params={p_symbol:symbol,p_side:side,p_quantity:orderMode==='shares'?fraction:null,p_amount_eur:orderMode==='amount'?amount:null};
   const {data,error}=await client().rpc('fp_paper_execute',params);
   if(error)throw error;
   await load();
   notice='Virtueller '+(side==='BUY'?'Kauf':'Verkauf')+' gespeichert: '+fmtQty(data.quantity)+' Anteile '+data.symbol+' für '+fmt(data.total_eur,'EUR')+'. Referenzkurs '+data.quote_date+' · kein Livehandel.';
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
   searchTerm=String(query||'').trim().slice(0,64);
   const ticket=++searchTicket;
   if(searchTerm.length<2){searchResults=[];notice='';searching=false;viewRefresh();return}
   searching=true;searchResults=[];notice='Suche nach Aktien und ETFs …';viewRefresh();
   try{const r=await lookup('search',{query:searchTerm});if(ticket!==searchTicket||!searchTerm)return;searchResults=r.results||[];notice=searchResults.length?(r.notice||'Suchergebnisse von '+r.provider+'.'):'Keine Treffer oder Suchdienst eingeschränkt. Du kannst ein bekanntes Börsensymbol direkt prüfen.'}
   catch(e){if(ticket!==searchTicket)return;notice='Aktiensuche vorübergehend nicht verfügbar: '+String(e.message||e)+'. Bekanntes Börsensymbol kann direkt geprüft werden.'}
   finally{if(ticket===searchTicket){searching=false;viewRefresh()}}
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
    if(goTrade)symbol=key;await load();if(saveToWatchlist)window.dispatchEvent?.(new Event('fp-watchlist-changed'));
    notice=(saveToWatchlist?'Watchlist gespeichert. ':'')+out.quote.asset_name+' ('+key+') · geprüfter Schlusskurs '+out.quote.quote_date+' · '+fmt(out.quote.price,out.quote.currency)+'. Kein Livepreis.';
   }catch(e){notice='Wertpapier konnte nicht hinzugefügt werden: '+String(e.message||e)}
   finally{lookupBusy=false;viewRefresh();if(!notice.startsWith('Wertpapier konnte'))jump(goTrade?'fp-depot-order-panel':'fp-depot-watchlist')}
 }
 async function removeWatch(code){
  try{const {error:e}=await client().from('fp_paper_watchlist').delete().eq('user_id',user()).eq('symbol',code);if(e)throw e;
   watchlist=watchlist.filter(x=>x.symbol!==code);window.dispatchEvent?.(new Event('fp-watchlist-changed'));notice=code+' aus deiner Watchlist entfernt. Depotpositionen bleiben erhalten.';viewRefresh();
  }catch(e){notice='Watchlist konnte nicht geändert werden: '+String(e.message||e);viewRefresh()}
 }
 const stat=(s,label,cur)=>'<div class="fp-depot-stat"><small>'+esc(label)+'</small><strong>'+fmt(s,cur)+'</strong></div>';
 function render(){
  if(!user())return '<section class="fp-depot"><div class="fp-depot-hero"><span class="eyebrow">PAPIERDEPOT · KEINE ECHTEN ORDERS</span><h1>Dein virtuelles Depot</h1><p>Übe Aktienkäufe, beobachte Kursentwicklungen und lerne aus Entscheidungen. Die Handelsdaten werden privat deinem Konto zugeordnet.</p></div><div class="fp-depot-empty"><h2>Zum virtuellen Depot anmelden</h2><p>Für sichere Käufe und Verkäufe ist dein kostenloses FinanzPilot-Konto erforderlich. Deine Lernfortschritte bleiben unangetastet.</p><button class="btn" data-depot-login>Anmelden →</button></div></section>';
  if(!hasLoaded&&!quotes.length)return '<section class="fp-depot"><h1>Dein virtuelles Depot</h1><p>'+esc(notice||'Deine virtuellen Handelsdaten werden geladen …')+'</p><button class="btn secondary" data-depot-reload>Erneut versuchen</button></section>';
  const q=bySym(symbol),price=Number(q?.price)||0,curr=q?.currency||'EUR',fx=q&&rateFor(curr);
  const amt=Number(String(orderAmount).replace(',','.'))||0;
  const n=orderMode==='amount'&&fx&&price?Math.floor(amt/(price*fx)*1e6)/1e6:Number(String(qty).replace(',','.'))||0;
  const total=fx?round(n*price*fx):0,stats=currencyStats(),own=holdings(symbol),fresh=isFresh(q);
  const valid=fx!==null&&fx>0&&n>=.000001&&n<=10000&&total>=.01&&(side!=='BUY'||total<=stats.cash)&&(side!=='SELL'||n<=own+1e-7);
  const books='<section class="fp-depot-wallet"><div class="fp-depot-wallet-title"><b>Dein gemeinsames Eurodepot</b><span>Einmaliges Startkapital: '+fmt(initial,'EUR')+(stats.earnedBonus?' · Belohnungen '+fmt(stats.earnedBonus,'EUR'):'')+'</span></div>'+
    '<div class="fp-depot-wallet-big"><small>Gesamtwert inklusive Kasse und Positionen</small><strong>'+fmt(stats.total,'EUR')+'</strong><span class="'+(stats.pnl>=0?'fp-depot-pos':'fp-depot-neg')+'">'+(stats.pnl>=0?'+':'')+fmt(stats.pnl,'EUR')+' ('+number(stats.pnl/initial*100)+' %)</span></div>'+
    '<div class="fp-depot-wallet-grid">'+stat(stats.cash,'Euro-Spielgeld verfügbar','EUR')+stat(stats.value,'Aktienwert umgerechnet','EUR')+stat(stats.realized,'Realisierte Kursdifferenz','EUR')+'</div>'+
    (stats.unpriced?'<small>Eine oder mehrere Positionen haben keinen verlässlichen aktuellen Kurs oder Umrechnungskurs; der Marktwert ist dann unvollständig.</small>':'')+'</section>';
  const pos=calcPortfolio().positions;
  const body=pos.length?pos.map(p=>{
   const quote=bySym(p.symbol),r=rateFor(p.currency),market=quote&&r?round(p.qty*Number(quote.price)*r):null;
   const diff=market===null?null:round(market-p.costEUR),pct=p.costEUR?diff/p.costEUR*100:0;
   return '<button type="button" data-depot-inspect="'+esc(p.symbol)+'" class="fp-depot-position"><span><b>'+esc(p.symbol)+'</b><small>'+esc(quote?.asset_name||'Kurs nicht verfügbar')+'</small></span>'+
    '<span><b>'+fmtQty(p.qty)+' Anteile</b><small>Kaufbasis '+fmt(p.costEUR,'EUR')+'</small></span><span class="fp-depot-position-value"><b>'+(market===null?'–':fmt(market,'EUR'))+'</b>'+
    '<small class="'+(diff===null?'':diff>=0?'fp-depot-pos':'fp-depot-neg')+'">'+(diff===null?'–':(diff>=0?'+':'')+fmt(diff,'EUR')+' / '+number(pct)+' %')+'</small></span></button>';
  }).join(''):'<div class="fp-depot-empty"><b>Dein Depot ist noch leer.</b><p>Du kannst auch 10 € oder einen anderen Eurobetrag in einen Bruchteil einer Aktie investieren.</p></div>';
  const rows=trades.slice().reverse().slice(0,80).map(t=>'<tr><td>'+esc(new Date(t.traded_at).toLocaleDateString('de-DE'))+'</td><td><b>'+esc(t.symbol)+'</b><small>'+esc(t.quote_date)+'</small></td><td><span class="'+(t.side==='BUY'?'fp-depot-buy':'fp-depot-sell')+'">'+(t.side==='BUY'?'Kauf':'Verkauf')+'</span></td><td>'+fmtQty(t.quantity)+'</td><td>'+fmt(t.price,t.currency)+'</td><td>'+fmt(t.eur_total,'EUR')+'</td></tr>').join('');
  const options=quotes.filter(x=>watchlist.some(w=>w.symbol===x.symbol)||trades.some(t=>t.symbol===x.symbol)||x.symbol===symbol||['MSFT','NVDA','AAPL','AMZN','META','SIEMENS','KION','VWCE'].includes(x.symbol)).map(x=>'<option value="'+esc(x.symbol)+'" '+(symbol===x.symbol?'selected':'')+'>'+esc(x.asset_name)+' · '+esc(x.symbol)+' ('+esc(x.currency)+')</option>').join('');
  return '<div class="fp-depot"><div class="fp-depot-hero"><span class="eyebrow">FINANZPILOT · VIRTUELLES AKTIENDEPOT</span><h1>Dein Depot</h1><p>Kaufe und verkaufe Wertpapiere mit Spielgeld, vergleiche Entscheidungen und trainiere deine Strategie. Keine realen Börsenorders, keine Anbindung an ein Bankkonto.</p><div class="fp-depot-topactions"><button class="btn secondary" data-depot-reload>Depot aktualisieren</button><small>Kursquelle: Yahoo Finance (teilweise inoffiziell), datierte Schlusskurse – keine Livepreise.</small></div></div><div class="fp-depot-wallets">'+books+'</div>'+
   '<section class="fp-depot-panel fp-depot-search"><header><h2>Aktien weltweit suchen</h2><small>Unternehmensname, ISIN oder Börsenkürzel</small></header>'+
  '<form id="fp-depot-search-form" class="fp-depot-search-form"><input name="query" type="search" maxlength="64" value="'+esc(searchTerm)+'" placeholder="z. B. Alphabet, SAP.DE, ASML.AS, BRK-B" aria-label="Aktie suchen"><button class="btn" type="submit" '+(searching?'disabled':'')+'>'+(searching?'Sucht …':'Suchen')+'</button></form>'+
  (searchResults.length?'<div class="fp-depot-search-results">'+searchResults.map(x=>'<div class="fp-depot-search-item fp34-tap-row" data-fp34-inspect="'+esc(x.symbol)+'" role="link" tabindex="0" aria-label="Chart von '+esc(x.name)+' öffnen"><span><b>'+esc(x.name)+'</b><small>'+esc(x.symbol)+' · '+esc(x.exchange)+' · '+esc(x.type)+'</small><small class="fp37-stock-price">'+(x.chart_verified&&Number(x.price)>0?fmt(x.price,x.currency||'EUR')+' · Schlusskurs '+esc(x.quote_date||''):'Kurs aktuell nicht verifiziert')+'</small><small class="fp36-search-chart '+(x.chart_verified?'verified':'unconfirmed')+'">'+(x.chart_verified?'Historischer Chart geprüft':'Kursreihe nicht bestätigt – nur Alternativvorschlag')+'</small></span><button type="button" class="btn secondary" data-depot-add="'+esc(x.symbol)+'">Merken</button><button type="button" class="btn" data-depot-pick="'+esc(x.symbol)+'">Handeln</button></div>').join('')+'</div>':'')+
  (/^[A-Za-z0-9][A-Za-z0-9.\-]{0,23}$/.test(searchTerm)?'<button type="button" class="btn secondary" data-depot-direct="'+esc(searchTerm.toUpperCase())+'">Börsensymbol '+esc(searchTerm.toUpperCase())+' direkt prüfen →</button>':'')+
  '<p class="fp-depot-warning">Weltweite Suche über einen kostenlosen, inoffiziellen Anbieter. Nicht jeder Börsenplatz, jede ISIN oder jede Aktie ist dort verfügbar. Gehandelt wird nur, wenn ein gültiger, datierter Schlusskurs geprüft werden konnte.</p></section>'+
  '<section class="fp-depot-panel" id="fp-depot-watchlist"><header><h2>Meine Watchlist</h2><small>'+watchlist.length+' gemerkte Werte</small></header>'+
  (watchlist.length?'<div class="fp-depot-search-results">'+watchlist.map(w=>{const x=bySym(w.symbol);return '<div class="fp-depot-search-item fp34-tap-row" data-fp34-inspect="'+esc(w.symbol)+'" role="link" tabindex="0"><span><b>'+esc(x?.asset_name||w.symbol)+'</b><small>'+esc(w.symbol)+(x?' · '+fmt(x.price,x.currency)+' · Stand '+esc(x.quote_date):' · Preis derzeit nicht verfügbar')+'</small></span><button type="button" class="btn secondary" data-depot-pick="'+esc(w.symbol)+'">Handeln</button><button type="button" class="btn secondary" data-depot-remove="'+esc(w.symbol)+'">Entfernen</button></div>'}).join('')+'</div>':'<p>Suche nach einem Unternehmen und tippe auf „Merken“.</p>')+'</section>'+
   '<section class="fp-depot-panel"><header><h2>Meine Positionen</h2><small>'+pos.length+' aktuelle Werte</small></header><div class="fp-depot-positions">'+body+'</div></section>'+
   '<section class="fp-depot-panel" id="fp-depot-order-panel"><header><h2>Virtuell handeln</h2><small>Ab 0,01 € und bis zu sechs Dezimalstellen · serverseitig geprüft</small></header><form id="fp-depot-order" class="fp-depot-order"><label>Wertpapier<select name="symbol" data-depot-symbol>'+options+'</select></label><div class="fp-depot-order-grid"><label>Aktion<select name="side" data-depot-side><option value="BUY" '+(side==='BUY'?'selected':'')+'>Virtuell kaufen</option><option value="SELL" '+(side==='SELL'?'selected':'')+'>Virtuell verkaufen</option></select></label><label>Auftrag nach<select name="mode" data-depot-order-mode><option value="amount" '+(orderMode==='amount'?'selected':'')+'>Eurobetrag</option><option value="shares" '+(orderMode==='shares'?'selected':'')+'>Anzahl Anteile</option></select></label>'+(orderMode==='amount'?'<label>Eurobetrag (€)<input name="amount" type="number" inputmode="decimal" min="0.01" max="100000" step="0.01" value="'+esc(orderAmount)+'" data-depot-amount required></label>':'<label>Anteile (auch Bruchstücke)<input name="quantity" type="number" inputmode="decimal" min="0.000001" max="10000" step="0.000001" value="'+esc(qty)+'" data-depot-qty required></label>')+'</div>'+
   (q?'<div class="fp-depot-order-preview"><div><span>Referenzpreis vom '+esc(q.quote_date)+'</span><b>'+fmt(price,curr)+'</b></div><div><span>Ungefähre Anteile</span><b>'+fmtQty(n)+'</b></div><div><span>Auftragswert in Euro</span><b>'+(fx?fmt(total,'EUR'):'EZB-Wechselkurs fehlt')+'</b></div><div><span>'+((side==='BUY')?'Freies Euroguthaben':'Im Depot vorhanden')+'</span><b>'+((side==='BUY')?fmt(stats.cash,'EUR'):fmtQty(own)+' Anteile')+'</b></div></div>':'')+
   '<p class="fp-depot-warning">'+(fresh?'Historischer Referenzschlusskurs, keine Echtzeit-Order.':'Referenzkurs ist veraltet. Bitte Kurs neu prüfen.')+' Fremdwährungen werden mit datierten EZB-Referenzkursen in Euro umgerechnet (ohne Gebühren).'+(q&&curr!=='EUR'?' Aktueller Faktor: '+(fx?number(fx)+' € je '+esc(curr):'nicht verfügbar')+'.':'')+' Dividenden, echte Gebühren und Steuern werden nicht simuliert.</p>'+
   '<button class="btn" type="submit" '+(!fresh||busy||!valid?'disabled':'')+'>'+(busy?'Prüfung läuft …':side==='BUY'?'Virtuellen Kauf bestätigen':'Virtuellen Verkauf bestätigen')+'</button></form><p role="status" class="fp-depot-message">'+esc(notice)+'</p></section>'+
   (q&&window.FinanzPilotCharts?'<div class="fp-depot-chart">'+(/^(MSFT|NVDA|AAPL|AMZN|META|SIEMENS|SPY|QQQ|ACWI|KION|AIXTRON|CGNX|VWCE)$/.test(q.symbol)?window.FinanzPilotCharts.html(q.symbol,q.asset_name+' · Schlusskurse'):'<div class="fp-depot-panel"><header><h2>'+esc(q.asset_name)+' – Referenzkurs</h2></header><p>'+fmt(q.price,q.currency)+' · Stand: '+esc(q.quote_date)+' · '+esc(q.source||'Kursquelle')+'</p><p>Für diesen neu gefundenen Börsenwert ist in der App noch keine historische Chartreihe gespeichert.</p><a href="https://finance.yahoo.com/quote/'+encodeURIComponent(q.symbol)+'/" target="_blank" rel="noopener noreferrer">Historischen Kursverlauf beim Anbieter ansehen ↗</a></div>')+'</div>':'')+
   '<section class="fp-depot-panel"><header><h2>Transaktionshistorie</h2><small>Deine echten virtuellen Buchungen, keine Musterorders</small></header>'+(trades.length?'<div class="fp-depot-table-scroll"><table><thead><tr><th>Datum</th><th>Wert</th><th>Aktion</th><th>Stück</th><th>Preis</th><th>Summe</th></tr></thead><tbody>'+rows+'</tbody></table></div>':'<p>Noch keine Käufe oder Verkäufe.</p>')+'</section>'+
   '<p class="fp-depot-fineprint">Einmaliges virtuelles Startkapital: 1.000 €. Alle Aktienkäufe, auch ausländische, werden aus demselben Eurobudget bezahlt. Bruchstücke bis 0,000001 Anteile sind möglich. Fremde Handelswährungen werden zu einem veröffentlichten, datierten EZB-Referenzkurs umgerechnet. Historische Referenzkurse (je nach Datenquelle adjustiert oder unbereinigt) bilden Ausführungskurse, Steuern, Ordergebühren, Dividenden und Kapitalmaßnahmen nicht vollständig ab; daher handelt es sich um ein Lernmodell und keine belastbare Renditeabrechnung.</p></div>';
 }
 function bind(root=document){
  root.querySelector('[data-depot-login]')?.addEventListener('click',()=>window.FinanzPilotCloud?.openLogin?.());
  root.querySelectorAll('[data-depot-reload]').forEach(b=>b.addEventListener('click',load));
  root.querySelectorAll('[data-depot-inspect]').forEach(b=>b.addEventListener('click',()=>inspect(b.dataset.depotInspect)));
  root.querySelectorAll('[data-fp34-inspect]').forEach(b=>{const open=e=>{if(e?.target?.closest?.('button'))return;inspect(b.dataset.fp34Inspect)};b.addEventListener('click',open);b.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.target.closest?.('button')){e.preventDefault();open(e)}})});
  root.querySelector('#fp-depot-search-form')?.addEventListener('submit',e=>{e.preventDefault();searchStocks(e.currentTarget.elements.query.value)});
  root.querySelector('#fp-depot-search-form input[name="query"]')?.addEventListener('input',e=>{if(e.target.value.trim())return;searchTicket++;searchTerm='';searchResults=[];notice='';searching=false;root.querySelector('.fp-depot-search .fp-depot-search-results')?.remove();root.querySelector('.fp-depot-search [data-depot-direct]')?.remove();});
  root.querySelectorAll('[data-depot-add]').forEach(b=>b.addEventListener('click',()=>registerStock(b.dataset.depotAdd,true,false)));
  root.querySelectorAll('[data-depot-pick]').forEach(b=>b.addEventListener('click',()=>registerStock(b.dataset.depotPick,false,true)));
  root.querySelectorAll('[data-depot-direct]').forEach(b=>b.addEventListener('click',()=>registerStock(b.dataset.depotDirect,true,true)));
  root.querySelectorAll('[data-depot-remove]').forEach(b=>b.addEventListener('click',()=>removeWatch(b.dataset.depotRemove)));
  root.querySelector('[data-depot-symbol]')?.addEventListener('change',ev=>{symbol=ev.target.value;viewRefresh()});
  root.querySelector('[data-depot-side]')?.addEventListener('change',ev=>{side=ev.target.value;viewRefresh()});
  root.querySelector('[data-depot-qty]')?.addEventListener('change',ev=>{qty=ev.target.value;viewRefresh()});
  root.querySelector('[data-depot-order-mode]')?.addEventListener('change',ev=>{orderMode=ev.target.value;viewRefresh()});
  root.querySelector('[data-depot-amount]')?.addEventListener('change',ev=>{orderAmount=ev.target.value;viewRefresh()});
  root.querySelector('#fp-depot-order')?.addEventListener('submit',ev=>{ev.preventDefault();const f=ev.currentTarget;symbol=f.elements.symbol.value;side=f.elements.side.value;orderMode=f.elements.mode.value;if(orderMode==='amount')orderAmount=f.elements.amount.value;else qty=f.elements.quantity.value;trade()});
 }
 async function pick(code){symbol=String(code||'').toUpperCase();window.FinanzPilotNavigation?.route('depot');await load();jump('fp-depot-order-panel')}
 async function focus(code){symbol=String(code||'').toUpperCase();window.FinanzPilotNavigation?.route('depot');await load();const rows=[...document.querySelectorAll('#fp-depot-watchlist [data-fp34-inspect],.fp-depot-positions [data-depot-inspect],[data-fp34-inspect]')];const row=rows.find(x=>x.dataset.fp34Inspect===symbol||x.dataset.depotInspect===symbol);if(row)row.scrollIntoView({behavior:'smooth',block:'center'});else jump('fp-depot-order-panel')}
 window.FinanzPilotPortfolio={render,bind,load,trade,pick,focus,searchStocks,registerStock,removeWatch,calcPortfolio,currencyStats,isFresh,get quotes(){return quotes},get trades(){return trades},get watchlist(){return watchlist}};
 window.addEventListener('fp-auth-change',load);
 window.addEventListener('fp-navigation',()=>{if(typeof state!=='undefined'&&state.view==='depot'&&user())load()});
 window.addEventListener('online',()=>{if(user())load()});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&user())load()});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load();
})();
