/* FinanzPilot v83: financial scenarios with dated source facts and visibly hypothetical assumptions. */
(function(){
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const external=s=>{try{const u=new URL(s);return u.protocol==='https:'?u.href:null}catch{return null}};
const number=(x,places=1)=>new Intl.NumberFormat('de-DE',{maximumFractionDigits:places,minimumFractionDigits:0}).format(x);
const signed=n=>(n>0?'+':'')+number(n,1);
const sourceLink=(url,label)=>{const safe=external(url);return safe?'<a href="'+esc(safe)+'" target="_blank" rel="noopener noreferrer">'+esc(label)+' ↗</a>':''};
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const range=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
const dateAge=iso=>{const n=Date.parse(String(iso||'')+'T12:00:00Z');return Number.isFinite(n)?Math.max(0,Math.floor((Date.now()-n)/86400000)):Infinity;};
const modelOkay=m=>m&&typeof m.id==='string'&&m.baseline&&finite(m.baseline.revenue_m)&&m.baseline.revenue_m>0&&m.horizon_years>=1&&m.horizon_years<=7&&['year','quarter','nine_months'].includes(m.baseline.period_kind)&&['EUR','USD'].includes(m.baseline.currency)&&Object.values(m.scenarios||{}).length===3&&['bear','base','bull'].every(k=>m.scenarios[k]&&finite(m.scenarios[k].growth_pct)&&finite(m.scenarios[k].margin_pct)&&m.scenarios[k].growth_pct>-100);
let models=[],loading=false,lastLoad=0,updated='',status='';
const chosen=new Map();
function model(id){return models.find(x=>x.id===id)||null}
function evaluate(m,growth_pct,margin_pct){
 if(!modelOkay(m)||!finite(growth_pct)||!finite(margin_pct)||growth_pct<=-100||Math.abs(growth_pct)>200||Math.abs(margin_pct)>100)return null;
 const projected_revenue_m=m.baseline.revenue_m*Math.pow(1+growth_pct/100,m.horizon_years);
 const projected_profit_m=projected_revenue_m*margin_pct/100;
 return Number.isFinite(projected_revenue_m)&&Number.isFinite(projected_profit_m)?
 {projected_revenue_m,projected_profit_m,model_years:m.horizon_years,margin_pct,growth_pct}:null;
}
function epsValue(m,scenarioName,overrideDiscount){
 const v=m?.valuation,assumptions=v?.case_assumptions?.[scenarioName];
 if(v?.type!=='discounted_earnings_multiple'||!assumptions||!finite(v.eps)||v.eps<=0)return null;
 const discount=overrideDiscount??v.discount_pct;
 if(!finite(discount)||discount<=-100||!finite(assumptions.eps_growth_pct)||assumptions.eps_growth_pct<=-100||!finite(assumptions.terminal_pe)||assumptions.terminal_pe<=0)return null;
 const future_eps=v.eps*Math.pow(1+assumptions.eps_growth_pct/100,m.horizon_years);
 const present= future_eps*assumptions.terminal_pe/Math.pow(1+discount/100,m.horizon_years);
 return Number.isFinite(present)?{present,future_eps,discount_pct:discount}:null;
}
function displayCurrency(m,value,places=1){return number(value,places)+' Mio. '+(m.baseline.currency==='EUR'?'€':'USD');}
function inlineCard(m,k){
 const c=m.scenarios[k],v=evaluate(m,c.growth_pct,c.margin_pct);
 if(!v)return '';
 return '<div class="fp83-case fp83-case-'+k+'"><div class="fp83-case-head"><strong>'+esc(c.label)+'</strong><small>'+esc(c.thesis)+'</small></div>'+
 '<dl><div><dt>Umsatzwachstum p. a.</dt><dd>'+signed(c.growth_pct)+' %</dd></div>'+
 '<div><dt>Angenommene operative Marge</dt><dd>'+number(c.margin_pct)+' %</dd></div>'+
 '<div><dt>Umsatz (gleicher Zeitraum)</dt><dd>'+displayCurrency(m,v.projected_revenue_m)+'</dd></div>'+
 '<div><dt>'+esc(m.baseline.profit_label||'Operativer Modellgewinn')+'</dt><dd>'+displayCurrency(m,v.projected_profit_m)+'</dd></div></dl></div>';
}
function valuationSection(m){
 const v=m.valuation;
 if(v?.type!=='discounted_earnings_multiple')return '<div class="fp83-valuation-bridge"><strong>Ein Aktienkursziel ist noch nicht seriös berechenbar.</strong><p>Umsatz- und Gewinnszenarien ersetzen keine Bewertung: Es fehlen mindestens aktuelle Börsenkurse, die Kapitalstruktur, eine verlässliche Aktienzahl und die Prüfung nachhaltiger freier Cashflows. Aus den obigen operativen Szenarien entsteht ausdrücklich <strong>kein</strong> Wert je Aktie.</p></div>';
 const cases=['bear','base','bull'].map(k=>{
  const x=epsValue(m,k),p=v.case_assumptions[k];
  return '<div class="fp83-pe-case"><strong>'+esc(m.scenarios[k].label)+'</strong><small>EPS-Wachstum '+signed(p.eps_growth_pct)+' % p. a. · angenommenes KGV '+number(p.terminal_pe,0)+'</small><span>'+number(x?.present??0,2)+' '+esc(m.baseline.currency)+' / Aktie</span></div>';
 }).join('');
 return '<section class="fp83-valuation-bridge"><span class="eyebrow">ILLUSTRATIVES MULTIPLE-MODELL</span>'+
 '<h3>Was wäre das Gewinnpotenzial je Aktie wert?</h3>'+
 '<p>Ausgangspunkt: '+number(v.eps,2)+' '+esc(m.baseline.currency)+' je Aktie ('+esc(v.eps_period)+', '+esc(v.eps_kind)+'). Angenommen wird ein Gewinnwachstum je Szenario über '+m.horizon_years+' Jahre, anschließend ein hypothetisches KGV und '+number(v.discount_pct)+' % jährlicher Abschlag auf den Endwert.</p>'+
 '<div class="fp83-pe-grid">'+cases+'</div>'+
 '<p class="fp83-formula">Beispiel-Formel: berichtetes bereinigtes EPS × (1 + jährliches EPS-Wachstum)³ × End-KGV ÷ (1 + Diskontsatz)³.</p>'+
 '<p class="fp83-caution">Die Werte sind <strong>kein Kursziel und kein fairer Wert</strong>. Insbesondere fehlen ein verifizierter aktueller Aktienkurs, zukünftige Ausschüttungen und die unabhängige Prüfung von Cashflows und Verwässerung. '+esc(v.limitations||'')+'</p>'+
 sourceLink(v.source_url,'Quelle des Ausgangs-EPS')+'</section>';
}
function customCard(m){
 const mState=chosen.get(m.id)||{growth:m.scenarios.base.growth_pct,margin:m.scenarios.base.margin_pct};
 const expected=evaluate(m,mState.growth,mState.margin);
 return '<section class="fp83-custom" data-fp83-live="'+esc(m.id)+'"><div class="fp83-custom-head"><div><span class="eyebrow">INTERAKTIVE SENSITIVITÄT</span><h3>Teste deine eigenen Annahmen</h3></div><button type="button" data-fp83-reset="'+esc(m.id)+'">Basiswerte</button></div>'+
 '<p>Wie verändern Wachstum und Marge das operative Ergebnis? Die Regler ändern nur dein Beispiel, nicht die veröffentlichten Unternehmenszahlen.</p>'+
 '<div class="fp83-sliders"><label>Jährliches Umsatzwachstum <output data-fp83-g-label>'+signed(mState.growth)+' %</output>'+
 '<input type="range" min="-30" max="50" step="1" value="'+mState.growth+'" data-fp83-growth="'+esc(m.id)+'"></label>'+
 '<label>Angenommene operative Marge <output data-fp83-m-label>'+number(mState.margin,1)+' %</output>'+
 '<input type="range" min="-10" max="80" step="0.5" value="'+mState.margin+'" data-fp83-margin="'+esc(m.id)+'"></label></div>'+
 '<div class="fp83-live-result"><div><small>Modell-Umsatz</small><strong data-fp83-revenue>'+displayCurrency(m,expected.projected_revenue_m)+'</strong></div>'+
 '<div><small>Modell-Ergebnis</small><strong data-fp83-profit>'+displayCurrency(m,expected.projected_profit_m)+'</strong></div></div></section>';
}
function renderFor(id){
 const m=model(id);
 if(!m)return '<section class="fp83-module fp83-loading"><h2>Drei Szenarien und Bewertung</h2><p>'+(loading?'Die redaktionellen Modelle werden geladen …':status||'Für dieses Unternehmen liegt noch kein geprüftes Zahlenmodell vor.')+'</p></section>';
 const b=m.baseline,margin=finite(b.operating_income_m)?(b.operating_income_m/b.revenue_m*100):null;
 const aged=dateAge(b.source_published),stale=aged>100;
 return '<section class="fp83-module" data-fp83-module="'+esc(m.id)+'">'+
 '<header class="fp83-heading"><div><span class="eyebrow">FINANZPILOT · SZENARIORESEARCH</span><h2>Was müsste passieren, damit die Aktie interessant wird?</h2>'+
 '<p>Unabhängige finanzielle Modellrechnung für '+esc(m.company)+'. Die drei möglichen Entwicklungen sind <strong>frei gewählte, keine vom Unternehmen prognostizierten Annahmen</strong>.</p></div></header>'+
 (stale?'<div class="fp83-stale" role="status">Datenprüfung nötig: Die zugrunde liegende Veröffentlichung ist '+aged+' Tage alt. Jüngere Quartalszahlen könnten vorliegen; keine aktuelle Bewertung ableiten.</div>':'')+
 '<div class="fp83-baseline"><div><span class="eyebrow">VERIFIZIERTER AUSGANGSPUNKT</span><h3>'+esc(b.period)+'</h3>'+
 '<p><strong>Umsatz:</strong> '+displayCurrency(m,b.revenue_m)+'</p>'+
 '<p><strong>'+esc(b.profit_label)+':</strong> '+(finite(b.operating_income_m)?displayCurrency(m,b.operating_income_m):'Nicht vergleichbar veröffentlicht')+'</p>'+
 '<p><strong>Berichtete Vergleichsmarge:</strong> '+(margin!==null?number(margin,1)+' %':'nicht aus den verfügbaren Daten ableitbar')+'</p></div>'+
 '<div class="fp83-source"><small>Primärquelle · veröffentlicht '+esc(b.source_published)+'</small>'+
 sourceLink(b.source_url,'Originalbericht')+(b.secondary_source_url?sourceLink(b.secondary_source_url,'Weitere Originalquelle'):'')+
 '<p>'+esc(b.source_note)+'</p></div></div>'+
 '<h3 class="fp83-subheading">Drei denkbare Entwicklungen über '+m.horizon_years+' Jahre</h3>'+
 '<p class="fp83-caption">Verglichen wird immer dieselbe Berichtsperiode wie im Ausgangsjahr (z. B. Q3 mit Q3, 9 Monate mit 9 Monaten). <strong>Keine Jahreshochrechnung aus Quartalszahlen.</strong> Umsatz = berichteter Umsatz × (1 + Wachstum)³; Modellgewinn = Modellumsatz × angenommene Marge.</p>'+
 '<div class="fp83-cases">'+['bear','base','bull'].map(k=>inlineCard(m,k)).join('')+'</div>'+
 customCard(m)+valuationSection(m)+
 '<div class="fp83-checks"><div><h3>Was könnte die These stützen?</h3><ul>'+m.drivers.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></div>'+
 '<div><h3>Was muss vor einem Investment geprüft werden?</h3><ul>'+m.checks.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></div></div>'+
 '<p class="fp83-legal">Stand der zugrunde liegenden Originalzahlen: '+esc(b.source_published)+'. Redaktionsstand: '+esc(updated)+'. Keine Echtzeitbewertung, keine persönliche Anlageberatung. Die operative Szenarioanalyse ist nur ein Baustein der Bewertung.</p></section>';
}
async function load(force=false){
 if(loading||(!force&&models.length&&Date.now()-lastLoad<120000))return;
 loading=true;status='';
 try{
  const r=await fetch('./data/valuation-scenarios-v83.json?t='+Date.now(),{cache:'no-store'});
  if(!r.ok)throw Error('HTTP '+r.status);
  const obj=await r.json();
  if(obj.schema_version!==1||!Array.isArray(obj.models))throw Error('Szenariodaten ungültig');
  const good=obj.models.filter(modelOkay);
  if(good.length!==obj.models.length||new Set(good.map(x=>x.id)).size!==good.length)throw Error('Modelldaten unvollständig oder IDs doppelt');
  models=good;updated=obj.created_at;lastLoad=Date.now();
 }catch(e){status='Es konnten keine überprüften Szenariodaten geladen werden. '+String(e.message||e);console.warn('Valuation models:',e)}
 finally{loading=false;if(typeof state!=='undefined'&&state.view==='marketidea')window.render?.()}
}
function refreshNode(section,m){
 const x=chosen.get(m.id),v=evaluate(m,x.growth,x.margin);if(!v)return;
 const put=(query,t)=>{const el=section.querySelector(query);if(el)el.textContent=t};
 put('[data-fp83-g-label]',signed(x.growth)+' %');put('[data-fp83-m-label]',number(x.margin,1)+' %');
 put('[data-fp83-revenue]',displayCurrency(m,v.projected_revenue_m));
 put('[data-fp83-profit]',displayCurrency(m,v.projected_profit_m));
}
function bind(root=document){
 root.querySelectorAll('[data-fp83-module]').forEach(section=>{
  const id=section.dataset.fp83Module,m=model(id);if(!m)return;
  const current=()=>chosen.get(id)||{growth:m.scenarios.base.growth_pct,margin:m.scenarios.base.margin_pct};
  section.querySelectorAll('[data-fp83-growth],[data-fp83-margin]').forEach(control=>control.addEventListener('input',()=>{
   const old=current(),v=Number(control.value);
   if(!Number.isFinite(v))return;
   const updatedState={growth:control.dataset.fp83Growth!==undefined?range(v,-30,50):old.growth,
     margin:control.dataset.fp83Margin!==undefined?range(v,-10,80):old.margin};
   chosen.set(id,updatedState);refreshNode(section,m);
  }));
  section.querySelector('[data-fp83-reset]')?.addEventListener('click',()=>{
   chosen.delete(id);
   const init=current();
   const g=section.querySelector('[data-fp83-growth]'),margin=section.querySelector('[data-fp83-margin]');
   if(g)g.value=String(init.growth);if(margin)margin.value=String(init.margin);
   chosen.set(id,init);refreshNode(section,m);
  });
 });
}
window.FinanzPilotValuation={renderFor,load,bind,evaluate,epsValue,model,get models(){return models},get status(){return status}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>load(),{once:true});else load();
window.addEventListener('fp-navigation',()=>{if(typeof state!=='undefined'&&state.view==='marketidea'&&Date.now()-lastLoad>120000)load()});
})();
