/* FinanzPilot V84 – auditierbarer Vergleich von Börsen-Schlusskurs, historischer Ertragskraft und Reverse-Bewertung. */
(function(){
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const n=(x,p=2)=>new Intl.NumberFormat('de-DE',{minimumFractionDigits:0,maximumFractionDigits:p}).format(x);
const yes=x=>typeof x==='number'&&Number.isFinite(x);
const limit=(x,min,max)=>Math.min(max,Math.max(min,x));
const external=x=>{try{const u=new URL(String(x));return u.protocol==='https:'?u.href:null}catch{return null}};
const link=(href,text)=>{const safe=external(href);return safe?'<a href="'+esc(safe)+'" target="_blank" rel="noopener noreferrer">'+esc(text)+' ↗</a>':''};
const fmt=(value,currency,p=2)=>n(value,p)+' '+(currency==='EUR'?'€':'USD');
const age=date=>{const ms=Date.parse(String(date||'')+'T12:00:00Z');return Number.isFinite(ms)?Math.max(0,Math.floor((Date.now()-ms)/86400000)):Infinity};
const config={
 microsoft:{pe:27,discount:10},nvidia:{pe:25,discount:10},amazon:{pe:25,discount:10},
 meta:{pe:20,discount:10},alphabet:{pe:20,discount:10},cgnx:{pe:25,discount:10},
 siemens:{pe:20,discount:10},aixtron:{pe:22,discount:10},kion:{pe:12,discount:10}
};
let stocks=[],loading=false,lastLoad=0,seen='',message='';
const edited=new Map();
function valid(rec){
 const q=rec?.quote,f=rec?.fundamentals;
 return !!rec?.id&&q&&f&&q.exchange&&['USD','EUR'].includes(q.currency)&&/^\d{4}-\d\d-\d\d$/.test(q.date)&&
 yes(q.close)&&q.close>0&&!!external(q.source_url)&&yes(f.shares_m)&&f.shares_m>0&&
 yes(f.eps_ttm)&&!!external(f.source_url)&&yes(f.operating_cf_m)&&yes(f.capex_m)&&
 yes(f.free_cf_m)&&yes(f.cash_m)&&yes(f.debt_m)&&Math.abs((f.operating_cf_m-f.capex_m)-f.free_cf_m)<=0.2;
}
function snapshot(id){return stocks.find(s=>s.id===id)||null;}
function derive(rec){
 if(!valid(rec))return null;
 const q=rec.quote,f=rec.fundamentals;
 const cap_m=q.close*f.shares_m;
 const fcf_yield_pct=100*f.free_cf_m/cap_m;
 const pe=f.eps_ttm>0?q.close/f.eps_ttm:null;
 const net_cash_m=f.cash_m-f.debt_m;
 const ev_m=cap_m-net_cash_m; // mechanical only; never print as audited EV.
 return {cap_m,pe,fcf_yield_pct,net_cash_m,ev_m,positive_fcf:f.free_cf_m>0};
}
function requiredEpsGrowth(price,eps,years,terminalPE,discountPct){
 if(![price,eps,years,terminalPE,discountPct].every(yes)||price<=0||eps<=0||years<=0||terminalPE<=0||discountPct<=-100)return null;
 const root=price*Math.pow(1+discountPct/100,years)/(eps*terminalPE);
 if(root<=0)return null;
 const result=100*(Math.pow(root,1/years)-1);
 return Number.isFinite(result)?result:null;
}
function projectedPrice(eps,years,growth,pe,discount){
 if(![eps,years,growth,pe,discount].every(yes)||eps<=0||years<1||growth<=-100||pe<=0||discount<=-100)return null;
 const val=eps*Math.pow(1+growth/100,years)*pe/Math.pow(1+discount/100,years);
 return Number.isFinite(val)?val:null;
}
function current(id){return edited.get(id)||config[id]||{pe:22,discount:10}}
function displayRatio(x,suffix='',digits=1){return x===null||!yes(x)?'nicht berechenbar':n(x,digits)+suffix;}
function reverseControls(id,rec,attrs){
 const f=rec.fundamentals,q=rec.quote,state=current(id),y=3,required=requiredEpsGrowth(q.close,f.eps_ttm,y,state.pe,state.discount);
 return '<section class="fp84-reverse" data-fp84-live="'+esc(id)+'">'+
 '<div class="fp84-section-header"><div><span class="eyebrow">UMGEKEHRTE BEWERTUNGSFRAGE</span><h3>Welches Gewinnwachstum müsste der heutige Kurs rechtfertigen?</h3></div><button type="button" data-fp84-reset="'+esc(id)+'">Zurücksetzen</button></div>'+
 '<p>Rechenannahme: Der Gewinn je Aktie wächst drei Jahre gleichmäßig. Danach gilt ein frei angenommenes End-KGV; dieser Wert wird mit einem hypothetischen Diskontsatz auf den Kursstichtag abgezinst. Wähle selbst die Annahmen.</p>'+
 '<div class="fp84-controls">'+
 '<label>Angenommenes End-KGV <strong data-fp84-pe-label>'+n(state.pe,0)+'×</strong><input type="range" min="8" max="55" step="1" value="'+state.pe+'" data-fp84-pe="'+esc(id)+'"></label>'+
 '<label>Gewünschter Diskontsatz <strong data-fp84-discount-label>'+n(state.discount,0)+' %</strong><input type="range" min="6" max="18" step="1" value="'+state.discount+'" data-fp84-discount="'+esc(id)+'"></label></div>'+
 '<div class="fp84-reverse-result"><small>Erforderliches EPS-Wachstum pro Jahr</small><strong data-fp84-required>'+displayRatio(required,' %',1)+'</strong>'+
 '<p>Dieser Wert bedeutet <strong>keine Wachstumsprognose und keine Kaufempfehlung</strong>. Er beschreibt nur, was in diesem Vereinfachungsmodell zum Börsenkurs vom '+esc(q.date)+' passen würde.</p></div>'+
 '<p class="fp84-formula">Formel: g = [Kurs × (1 + Diskontsatz)³ ÷ (historisches EPS × End-KGV)]^(1/3) − 1. Ausschüttungen, Aktienzahländerungen, Bilanzrisiken und Gewinnqualität werden darin nicht modelliert.</p>'+
 '</section>';
}
function metric(k,v){return '<div class="fp84-metric"><small>'+esc(k)+'</small><strong>'+v+'</strong></div>'}
function renderFor(id){
 const rec=snapshot(id);
 if(!rec)return '<section class="fp84-module fp84-empty"><h2>Kurs und Unternehmensbewertung</h2><p>'+esc(message||'Das datierte Kurs- und Kennzahlenpaket wird geprüft. Bis dahin wird keine Bewertung behauptet.')+'</p></section>';
 const m=derive(rec),q=rec.quote,f=rec.fundamentals,a=age(q.date),stale=a>4,cur=rec.quote.currency;
 const capBillions=m.cap_m/1000;
 const first='<section class="fp84-module" data-fp84-module="'+esc(id)+'">'+
 '<header><span class="eyebrow">AKTIENBEWERTUNG · VERIFIZIERTER KURSSTAND</span><h2>Was kostet die Aktie tatsächlich – und was ist eingepreist?</h2>'+
 '<p>Historischer Marktpreis und nachprüfbare Kennzahlen werden getrennt von Modellannahmen gezeigt. Kurse vom '+esc(q.date)+' sind <strong>keine Live-Kurse</strong>.</p></header>'+
 (stale?'<p class="fp84-stale" role="status">Der Kurs ist '+a+' Tage alt. Für eine aktuelle Investmententscheidung muss ein neuer Schlusskurs geprüft werden. Alle Vergleiche beziehen sich ausdrücklich auf diesen historischen Stichtag.</p>':'')+
 '<div class="fp84-quote"><div><small>'+esc(q.exchange)+' · Schlusskurs '+esc(q.date)+'</small><strong>'+fmt(q.close,cur)+'</strong><small>Keine Vor- oder Nachbörse</small></div>'+
 '<div class="fp84-quote-source">'+link(q.source_url,'Kursquelle')+'<p>Fundamentaldaten laut Sekundäranbieter – eigene Originalbericht-Prüfung noch offen.</p>'+link(f.source_url,'Kennzahlenquelle')+'</div></div>'+
 '<div class="fp84-metrics">'+
 metric('Börsenwert (Kurs × Aktien)',n(capBillions,2)+' Mrd. '+esc(cur))+
 metric('KGV · Gewinn je Aktie (TTM)',displayRatio(m.pe,'×',1))+
 metric('FCF-Rendite auf Börsenwert',displayRatio(m.fcf_yield_pct,' %',2))+
 metric('Verwässerter EPS-Wert (TTM)',fmt(f.eps_ttm,cur))+
 metric('Ausstehende Aktien',n(f.shares_m,2)+' Mio.')+
 metric('Netto-Cash (Cash − Schulden)',fmt(m.net_cash_m/1000,2).replace(/\s(USD|€)$/, ' Mrd. $1') )+
 '</div>'+
 '<div class="fp84-evidence"><h3>Was die Kennzahlen aussagen</h3>'+
 '<p><strong>Free Cashflow:</strong> '+fmt(f.free_cf_m/1000,cur)+' Mrd. ('+fmt(f.operating_cf_m/1000,cur)+' Mrd. operativer Cashflow − '+fmt(f.capex_m/1000,cur)+' Mrd. Sachanlageninvestitionen).'+(f.free_cf_m<0?' Aktuell negativ – ein FCF-Multiple ist nicht sinnvoll.':'')+'</p>'+
 '<p>'+esc(f.caution||'Gewinn, Cashflow und Schulden sind gesondert zu prüfen.')+'</p>'+
 '<p><strong>Bilanzbrücke:</strong> Cash und Schulden stammen aus aggregierten Konzernkennzahlen. Das ist noch keine auditierte EV-to-Equity-Überleitung, insbesondere bei Leasing, Banken- und Finanzierungsgeschäft.</p>'+
 '</div>';
 const ms=id==='microsoft'&&window.FinanzPilotValuation?.model?.(id);
 let peer='';
 if(ms){
  const years=ms.horizon_years||3,base=window.FinanzPilotValuation.epsValue(ms,'base');
  if(base){
   const arr=['bear','base','bull'].map(k=>{
    const v=window.FinanzPilotValuation.epsValue(ms,k),percent=v?(v.present/q.close-1)*100:null;
    return '<div><small>'+esc(ms.scenarios[k].label)+' · rein hypothetisch</small><strong>'+fmt(v.present,cur)+'</strong><span>'+displayRatio(percent,'% gegen Schlusskurs',1)+'</span></div>';
   }).join('');
   peer='<section class="fp84-msft"><span class="eyebrow">ABGLEICH MIT BEREITS VORHANDENEM GEWINNMODELL</span><h3>Microsoft: Kurs gegen drei vereinfachte EPS-Szenarien</h3>'+
    '<p>Das Modell verwendet das bereinigte EPS von 17,28 USD aus GJ 2026 statt des aktuellen GAAP-TTM-EPS von '+n(f.eps_ttm,2)+' USD. Historische Datenbasis, End-KGV und Diskontsatz unterscheiden sich bewusst; Modelle sind nicht austauschbar.</p>'+
    '<div class="fp84-msft-grid">'+arr+'</div>'+
    '<p class="fp84-warning">Die Ergebnisse sind weder faire Werte noch Kursziele. Nicht enthalten: neue Quartalszahlen in der EPS-Basis, Ausschüttungen, Verwässerung und der Cashflow-Brückenaudit.</p></section>';
  }
 }
 return first+reverseControls(id,rec,m)+peer+
 '<p class="fp84-disclaimer">Kennzahlenstand: '+esc(f.observed_date)+'; Börsenschluss: '+esc(q.date)+'. Historisches KGV ist nur ein rückwärtsgerichteter Quotient. Für eine fundierte Kauf-/Verkaufsaussage sind aktualisierte Unternehmensberichte, normalisierte Cashflows, Schuldenabgleich, Cashflow-Prognosen und Vergleichsmaßstäbe notwendig. Kein verbindlicher fairer Wert.</p></section>';
}
async function load(force=false){
 if(loading||(!force&&stocks.length&&Date.now()-lastLoad<120000))return;
 loading=true;message='';
 try{
  const r=await fetch('./data/market-valuations-v84.json?t='+Date.now(),{cache:'no-store'});
  if(!r.ok)throw Error('HTTP '+r.status);
  const d=await r.json();
  if(d.schema_version!==1||!Array.isArray(d.stocks))throw Error('Datenformat nicht erkannt');
  const usable=d.stocks.filter(valid);
  if(usable.length!==d.stocks.length||new Set(usable.map(x=>x.id)).size!==usable.length)throw Error('Eine Quelle oder ein Wert der Kursdaten ist ungültig');
  stocks=usable;lastLoad=Date.now();seen=d.asof||'';
 }catch(e){message='Keine ausreichend geprüften Kurs- und Kennzahldaten verfügbar: '+String(e.message||e);console.warn('Market value snapshot:',e);}
 finally{loading=false;if(typeof state!=='undefined'&&state.view==='marketidea')window.render?.()}
}
function refresh(section,rec){
 const state=current(rec.id),g=requiredEpsGrowth(rec.quote.close,rec.fundamentals.eps_ttm,3,state.pe,state.discount);
 const put=(key,t)=>{const el=section.querySelector(key);if(el)el.textContent=t};
 put('[data-fp84-pe-label]',n(state.pe,0)+'×');
 put('[data-fp84-discount-label]',n(state.discount,0)+' %');
 put('[data-fp84-required]',displayRatio(g,' %',1));
}
function bind(root=document){
 root.querySelectorAll('[data-fp84-module]').forEach(section=>{
  const id=section.dataset.fp84Module,rec=snapshot(id);if(!rec)return;
  const now=()=>current(id);
  section.querySelectorAll('[data-fp84-pe],[data-fp84-discount]').forEach(input=>input.addEventListener('input',()=>{
   const v=Number(input.value);if(!Number.isFinite(v))return;
   const state=now();
   edited.set(id,{pe:input.dataset.fp84Pe!==undefined?limit(v,8,55):state.pe,
    discount:input.dataset.fp84Discount!==undefined?limit(v,6,18):state.discount});
   refresh(section,rec);
  }));
  section.querySelector('[data-fp84-reset]')?.addEventListener('click',()=>{
   edited.delete(id);
   const initial=current(id),pe=section.querySelector('[data-fp84-pe]'),disc=section.querySelector('[data-fp84-discount]');
   if(pe)pe.value=String(initial.pe);if(disc)disc.value=String(initial.discount);
   refresh(section,rec);
  });
 });
}
window.FinanzPilotMarketValue={load,renderFor,bind,derive,requiredEpsGrowth,projectedPrice,snapshot,get stocks(){return stocks},get status(){return message}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>load(),{once:true});else load();
window.addEventListener('fp-navigation',()=>{if(typeof state!=='undefined'&&state.view==='marketidea'&&Date.now()-lastLoad>120000)load()});
})();
