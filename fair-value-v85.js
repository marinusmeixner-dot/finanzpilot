/* FinanzPilot V85: primary-source fair-value audit, deterministic DCF scenario calculator. */
(function(){
'use strict';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const fmt=(x,p=2)=>new Intl.NumberFormat('de-DE',{maximumFractionDigits:p}).format(x);
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const url=x=>{try{const u=new URL(String(x));return u.protocol==='https:'?u.href:null}catch{return null}};
const link=(u,t)=>url(u)?'<a target="_blank" rel="noopener noreferrer" href="'+esc(u)+'">'+esc(t)+' ↗</a>':'';
const age=s=>{const d=Date.parse(String(s||'')+'T12:00:00Z');return Number.isFinite(d)?Math.max(0,Math.floor((Date.now()-d)/86400000)):Infinity};
const numberUnit=(n,c='USD')=>fmt(n/1000,2)+' Mrd. '+(c==='EUR'?'€':'USD');
const titles={primary_ttm_reconciled:'Cashflow aus Primärberichten abgeglichen',secondary_only:'Primärbericht-Abgleich noch offen'};
const bridge=(o)=>{
 if(o?.reported_ttm){const x=o.reported_ttm;if(![x.operating_cf_m,x.capex_m,x.free_cf_m].every(finite))return null;if(x.operating_cf_m<0||x.capex_m<0||Math.abs(x.operating_cf_m-x.capex_m-x.free_cf_m)>0.2)return null;return {operating_cf_m:x.operating_cf_m,capex_m:x.capex_m,fcf_m:x.free_cf_m};}
 if(!o?.ttm_bridge)return null;
 const a=o.ttm_bridge.operating_cash_m,b=o.ttm_bridge.capex_m;
 if(![a?.annual,a?.prior_ytd,a?.current_ytd,b?.annual,b?.prior_ytd,b?.current_ytd].every(finite))return null;
 const operating_cf_m=a.annual-a.prior_ytd+a.current_ytd;
 const capex_m=b.annual-b.prior_ytd+b.current_ytd;
 const fcf_m=operating_cf_m-capex_m;
 return operating_cf_m>=0&&capex_m>=0&&Number.isFinite(fcf_m)?{operating_cf_m,capex_m,fcf_m}:null;
};
function primaryValid(s){
 if(!s||typeof s.id!=='string'||!Array.isArray(s.primary_sources)||!s.primary_sources.length||!Array.isArray(s.gaps)||!s.gaps.length)return false;
 if(!s.primary_sources.every(r=>url(r.url)&&/^\d{4}-\d\d-\d\d$/.test(r.period_end)))return false;
 const b=bridge(s);
 if(s.financial_status==='primary_ttm_reconciled'&&!b)return false;
 const d=s.dcf;
 if(!d)return true;
 return d.type==='equity_fcf_proxy'&&b&&b.fcf_m>0&&s.balance&&finite(s.balance.diluted_weighted_shares_m)&&s.balance.diluted_weighted_shares_m>0&&
  finite(s.balance.cash_and_st_investments_m)&&finite(s.balance.debt_short_m)&&finite(s.balance.debt_long_m)&&d.years===5&&
  ['bear','base','bull'].every(k=>scenarioValid(d.cases[k]));
}
const scenarioValid=a=>!!a&&[a.annual_growth_pct,a.discount_pct,a.terminal_growth_pct,a.fcf_normalization_factor].every(finite)&&a.annual_growth_pct>-100&&a.discount_pct>0&&a.terminal_growth_pct<a.discount_pct&&a.fcf_normalization_factor>0&&a.fcf_normalization_factor<=5;
function dcfCashflow(initialFCF,shares,inputs,years=5){
 if(!finite(initialFCF)||initialFCF<=0||!finite(shares)||shares<=0||!scenarioValid(inputs)||years<1||years>10)return null;
 const growth=inputs.annual_growth_pct/100,discount=inputs.discount_pct/100,terminal=inputs.terminal_growth_pct/100;
 const normalizedFCF=initialFCF*inputs.fcf_normalization_factor;
 const cashflows=[];let pv=0;
 for(let t=1;t<=years;t++){
  const fcf=normalizedFCF*Math.pow(1+growth,t);
  const present=fcf/Math.pow(1+discount,t);
  cashflows.push({year:t,fcf_m:fcf,present_m:present});pv+=present;
 }
 const terminal_m=cashflows[years-1].fcf_m*(1+terminal)/(discount-terminal);
 const terminal_present_m=terminal_m/Math.pow(1+discount,years);
 const total_pv_m=pv+terminal_present_m;
 const per_share=total_pv_m/shares;
 return [pv,terminal_present_m,total_pv_m,per_share,normalizedFCF].every(finite)&&per_share>0?
 {cashflows,operating_pv_m:pv,terminal_present_m,terminal_m,equity_pv_m:total_pv_m,per_share,normalizedFCF,terminal_weight_pct:100*terminal_present_m/total_pv_m}:null;
}
let records=[],loading=false,loadedAt='',error='',lastLoad=0;const changes=new Map();
const get=id=>records.find(s=>s.id===id)||null;
const live=id=>changes.get(id)||get(id)?.dcf?.default||null;
function assumptionsTable(rec,computed){
 const q=window.FinanzPilotMarketValue?.snapshot?.(rec.id)?.quote;
 const val=q&&finite(q.close)?q.close:null;
 return '<div class="fp85-scenarios">'+['bear','base','bull'].map(k=>{
  const assumptions=rec.dcf.cases[k],calc=dcfCashflow(computed.fcf_m,rec.balance.diluted_weighted_shares_m,assumptions,rec.dcf.years);
  return '<article><strong>'+({bear:'Negativ',base:'Basis',bull:'Positiv'})[k]+'</strong>'+
  '<p>FCF-Wachstum '+fmt(assumptions.annual_growth_pct,1)+' % p.a. · Kapitalisierungszins '+fmt(assumptions.discount_pct,1)+' % · Endwachstum '+fmt(assumptions.terminal_growth_pct,1)+' % · FCF-Faktor '+fmt(assumptions.fcf_normalization_factor,2)+'×</p>'+
  '<div class="fp85-number">'+fmt(calc.per_share)+' USD je Aktie</div>'+
  (val!==null?'<small>Rechnerische Differenz zum datierten Schlusskurs '+fmt(val)+' USD: '+fmt((calc.per_share/val-1)*100,1)+' %</small>':'<small>Kein geprüfter Kursvergleich</small>')+
  '</article>';
 }).join('')+'</div>';
}
function modelDisplay(rec,ttm){
 const b=rec.balance,d=rec.dcf,current=live(rec.id),calc=dcfCashflow(ttm.fcf_m,b.diluted_weighted_shares_m,current,d.years);
 if(!calc)return '<p class="fp85-warning">Modellannahmen ungültig. Die Berechnung wurde zum Schutz vor irreführenden Zahlen gesperrt.</p>';
 const start=rec.id;
 const eqBridge=b.cash_and_st_investments_m-b.debt_short_m-b.debt_long_m;
 return '<section class="fp85-dcf" data-fp85-model="'+esc(start)+'">'+
 '<div class="fp85-heading"><div><span class="eyebrow">ILLUSTRATIVER EQUITY-DCF</span><h3>Fünfjährige Cashflow-Sensitivität</h3></div><button type="button" data-fp85-reset="'+esc(start)+'">Basiswerte</button></div>'+
 '<p>Ausgangspunkt '+numberUnit(ttm.fcf_m)+' (TTM-CFO minus Sachanlageninvestitionen). Die angenommene künftige Entwicklung ist nicht vom Unternehmen prognostiziert. Keine eigenständig validierte Fair-Value-Schätzung.</p>'+
 assumptionsTable(rec,ttm)+
 '<div class="fp85-controls">'+
 '<label>FCF-Wachstum pro Jahr <output data-fp85-growth-label>'+fmt(current.annual_growth_pct)+' %</output><input type="range" min="-5" max="30" step="1" value="'+current.annual_growth_pct+'" data-fp85-growth="'+esc(start)+'"></label>'+
 '<label>Eigenkapital-Diskontsatz <output data-fp85-rate-label>'+fmt(current.discount_pct)+' %</output><input type="range" min="7" max="15" step="0.5" value="'+current.discount_pct+'" data-fp85-rate="'+esc(start)+'"></label>'+
 '<label>Langfristiges Endwachstum <output data-fp85-terminal-label>'+fmt(current.terminal_growth_pct)+' %</output><input type="range" min="1" max="4.5" step="0.5" value="'+current.terminal_growth_pct+'" data-fp85-terminal="'+esc(start)+'"></label>'+
 '<label>Cashflow-Normalisierung <output data-fp85-factor-label>'+fmt(current.fcf_normalization_factor,2)+'×</output><input type="range" min="0.6" max="2.5" step="0.05" value="'+current.fcf_normalization_factor+'" data-fp85-factor="'+esc(start)+'"></label>'+
 '</div>'+
 '<div class="fp85-result"><div><small>Rechnerischer Equity-DCF je Aktie</small><strong data-fp85-value>'+fmt(calc.per_share)+' USD</strong></div>'+
 '<div><small>Anteil des Endwerts</small><strong data-fp85-tv>'+fmt(calc.terminal_weight_pct,1)+' %</strong></div></div>'+
 '<details><summary>Wie entsteht dieser Rechenwert?</summary><p>Jahr 1–5: normalisierter Cashflow × (1 + Wachstumsrate)^Jahr, anschließend jeweils mit (1 + Eigenkapital-Diskontsatz)^Jahr abzinsen. Endwert = FCF Jahr 5 × (1 + Endwachstum) ÷ (Diskontsatz − Endwachstum). Endwert auf heute abzinsen; Summe durch verwässerte Aktienzahl teilen.</p>'+
 '<div class="fp85-math">Barwert 5 FCF-Jahre: <strong data-fp85-pv>'+numberUnit(calc.operating_pv_m)+'</strong>. Abgezinster Endwert: <strong data-fp85-terminal-pv>'+numberUnit(calc.terminal_present_m)+'</strong>.</div></details>'+
 '<div class="fp85-equity-bridge"><h4>Bilanzbrücke – keine Doppelzählung</h4>'+
 '<p>Primärbeleg zum '+esc(b.period_end)+': Cash + kurzfristige Investments '+numberUnit(b.cash_and_st_investments_m)+
 ', Finanzschulden '+numberUnit(b.debt_short_m+b.debt_long_m)+', einfache Netto-Liquidität '+numberUnit(eqBridge)+
 '. Hinzu kommen u. a. ausgewiesene langfristige Leasingverbindlichkeiten von '+numberUnit(b.lease_liabilities_long_m)+'. '+esc(b.bridge_note)+'</p>'+
 '<p><strong>Wichtig:</strong> Dies ist ein Equity-Cashflow-DCF (nach Zinszahlungen). Anders als bei einem Unternehmenswert-(FCFF)-DCF darf die Netto-Liquidität hier <strong>nicht nochmals pauschal addiert</strong> werden. Eine echte EV→Equity-Brücke würde geprüften FCFF, WACC, Minderheiten, schuldenähnliche Verpflichtungen, nichtoperatives Cash und separate Investments verlangen.</p></div>'+
 '<p class="fp85-warning">'+esc(d.normalization_note)+' Die Diskontsatz- und Cashflowannahmen sind nicht unabhängig validiert; dadurch ist der Wert <strong>kein belastbares Kursziel</strong>.</p>'+
 '</section>';
}
function verified(rec,ttm){
 const m=window.FinanzPilotMarketValue?.snapshot?.(rec.id)?.fundamentals;
 const delta=m&&finite(m.free_cf_m)?Math.abs(m.free_cf_m-ttm.fcf_m):null;
 return '<div class="fp85-audit"><h3>Cashflow aus Originalquellen</h3>'+
 '<div class="fp85-audit-grid"><div><small>Operativer Cashflow (TTM)</small><strong>'+numberUnit(ttm.operating_cf_m)+'</strong></div>'+
 '<div><small>Sachanlagenausgaben (TTM)</small><strong>'+numberUnit(ttm.capex_m)+'</strong></div>'+
 '<div><small>Ermittelter FCF (TTM)</small><strong>'+numberUnit(ttm.fcf_m)+'</strong></div></div>'+
 '<p>Berechnung: '+(rec.reported_ttm?'Direkte TTM-Veröffentlichung des Unternehmens. ':'Jahresabschluss − entsprechender Vorjahres-Zwischenzeitraum + aktueller Zwischenzeitraum. ')+esc(rec.ttm_bridge?.explanation||rec.reported_ttm?.explanation||'Definition der originalen Cashflow-Rechnung prüfen.')+
 (delta===null?'':(delta<=5?' Abgleich mit Kurs-Snapshot: rundungsbedingt konsistent.':' <strong>Abweichung zum Marktdaten-Snapshot: '+numberUnit(delta)+'; keine Mischberechnung freigeben.</strong>'))+'</p>'+
 (rec.additional_adjustments?.company_defined_fcf_finance_lease_principal_m?'<p><strong>Unternehmens-FCF nach Finance-Leases:</strong> '+numberUnit(ttm.fcf_m-rec.additional_adjustments.company_defined_fcf_finance_lease_principal_m)+'. '+esc(rec.additional_adjustments.company_fcf_explanation)+'</p>':'')+
 '<div class="fp85-sources">'+rec.primary_sources.map(x=>link(x.url,x.label+' · '+x.period_end)).join('')+'</div></div>';
}
function renderFor(id){
 const r=get(id);
 if(!r)return '<section class="fp85-wrapper"><h2>Bewertungsprüfung</h2><p>'+(loading?'Primärdaten werden geladen …':esc(error||'Ein vollständiger Quellenabgleich steht noch aus.'))+'</p></section>';
 const ttm=bridge(r),status= r.financial_status==='primary_ttm_reconciled'?'Originalquellen-TTM bestätigt':'Primärquellen-Audit offen';
 const sample=window.FinanzPilotMarketValue?.snapshot?.(id)?.quote;
 return '<section class="fp85-wrapper"><header><span class="eyebrow">INVESTMENTRESEARCH · DATENAUDIT</span><h2>Was ist von dieser Bewertung wirklich geprüft?</h2>'+
 '<p>Für '+esc(r.company)+' wurde jeder Datenbaustein getrennt bewertet. Ein neues Marktpreisdatum aktualisiert niemals automatisch die Unternehmenszahlen oder die Modellannahmen.</p>'+
 '<div class="fp85-status">'+esc(status)+(sample?' · Börsenschluss '+esc(sample.date):'')+'</div></header>'+
 (ttm?verified(r,ttm):'<div class="fp85-pending"><strong>Noch keine freigegebene TTM-Berechnung aus Primärdokumenten.</strong><p>Die in der Marktübersicht gezeigten aggregierten Kennzahlen sind damit weiterhin ein vorläufiger Ausgangspunkt, keine nachprüfbare Bewertungsbasis.</p></div>')+
 (r.dcf&&ttm?modelDisplay(r,ttm):'<div class="fp85-pending"><h3>DCF-Kursziel bewusst gesperrt</h3><p>Ohne abgestimmte Aktienzahl, Zins- und Leasingverbindlichkeiten, normalisierten Free Cashflow und belastbaren Kapitalkostensatz ergibt sich kein fachlich tragfähiger fairer Wert. Die vorliegenden historischen Quotienten sind dafür nicht ausreichend.</p></div>')+
 '<details class="fp85-gaps"><summary>Was ist vor einer abgeschlossenen Bewertung noch offen? ('+r.gaps.length+')</summary><ul>'+r.gaps.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></details>'+
 '<p class="fp85-disclaimer">Recherchestand '+esc(loadedAt)+'. Die DCF-Szenarien enthalten ausschließlich hypothetische Prognosen; kein Nachweis von Unter- oder Überbewertung, keine persönliche Kauf- oder Verkaufsempfehlung.</p></section>';
}
async function load(force=false){
 if(loading||(!force&&records.length&&Date.now()-lastLoad<120000))return;loading=true;error='';
 try{
  const r=await fetch('./data/fair-value-audit-v85.json?t='+Date.now(),{cache:'no-store'});
  if(!r.ok)throw Error('HTTP '+r.status);
  const d=await r.json();
  if(d.schema_version!==1||!Array.isArray(d.records)||d.records.length===0||!d.records.every(primaryValid)||new Set(d.records.map(x=>x.id)).size!==d.records.length)throw Error('Ungültige Prüfregeln oder Primärdaten');
  records=d.records;loadedAt=d.created_at;lastLoad=Date.now();
 }catch(e){error='Die Primärdatenprüfung konnte nicht geladen werden: '+String(e?.message||e);console.warn('Fair-value audit:',e)}
 finally{loading=false;if(typeof state!=='undefined'&&['marketideas','marketidea'].includes(state.view))window.render?.()}
}
function sync(section,r){
 const x=changes.get(r.id)||r.dcf.default,t=bridge(r),c=dcfCashflow(t.fcf_m,r.balance.diluted_weighted_shares_m,x,r.dcf.years);
 if(!c)return;
 const put=(s,t)=>{const el=section.querySelector(s);if(el)el.textContent=t;};
 put('[data-fp85-growth-label]',fmt(x.annual_growth_pct)+' %');
 put('[data-fp85-rate-label]',fmt(x.discount_pct)+' %');
 put('[data-fp85-terminal-label]',fmt(x.terminal_growth_pct)+' %');
 put('[data-fp85-factor-label]',fmt(x.fcf_normalization_factor,2)+'×');
 put('[data-fp85-value]',fmt(c.per_share)+' USD');
 put('[data-fp85-tv]',fmt(c.terminal_weight_pct,1)+' %');
 put('[data-fp85-pv]',numberUnit(c.operating_pv_m));
 put('[data-fp85-terminal-pv]',numberUnit(c.terminal_present_m));
}
function bind(root=document){
 root.querySelectorAll('[data-fp85-model]').forEach(section=>{
  const r=get(section.dataset.fp85Model);if(!r?.dcf)return;
  const fields={"fp85Growth":"annual_growth_pct","fp85Rate":"discount_pct","fp85Terminal":"terminal_growth_pct","fp85Factor":"fcf_normalization_factor"};
  section.querySelectorAll('[data-fp85-growth],[data-fp85-rate],[data-fp85-terminal],[data-fp85-factor]').forEach(el=>el.addEventListener('input',()=>{
   const key=Object.keys(fields).find(k=>el.dataset[k]!==undefined),val=Number(el.value);
   if(!key||!finite(val))return;
   const state={...(changes.get(r.id)||r.dcf.default),[fields[key]]:val};
   if(!scenarioValid(state))return;
   changes.set(r.id,state);sync(section,r);
  }));
  section.querySelector('[data-fp85-reset]')?.addEventListener('click',()=>{
   changes.delete(r.id);
   const d=r.dcf.default;
   for(const [field,label] of [['growth','annual_growth_pct'],['rate','discount_pct'],['terminal','terminal_growth_pct'],['factor','fcf_normalization_factor']]){
    const el=section.querySelector('[data-fp85-'+field+']');if(el)el.value=String(d[label]);
   }sync(section,r);
  });
 });
}
window.FinanzPilotFairValue={load,renderFor,bind,bridge,dcfCashflow,get,snapshot:()=>records,get records(){return records}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>load(),{once:true});else load();
window.addEventListener('fp-navigation',()=>{if(typeof state!=='undefined'&&['marketidea','marketideas'].includes(state.view)&&Date.now()-lastLoad>120000)load()});
})();