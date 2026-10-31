(function installFinanzPilotValuation(){
'use strict';
window.FinanzPilotValuation=(()=>{
 let data=null,fetching=null,selected='base',wacc=null,growth=null;
 const f=new Intl.NumberFormat('de-DE',{maximumFractionDigits:1});
 const euro=x=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR',maximumFractionDigits:2}).format(x);
 const fmt=x=>f.format(x);
 const esc=x=>String(x??'').replace(/[&<>"']/g,k=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[k]));
 const cases=()=>data?.model?.scenarios||[];
 const caseById=id=>cases().find(x=>x.id===id)||cases()[1]||cases()[0];
 function calc(s,w=s.wacc,g=s.g){
  if(!data||!s||w<=g||!Number.isFinite(w)||!Number.isFinite(g))return null;
  let revenue=data.model.base_revenue_2026;
  const rows=s.revenue_growth.map((grow,i)=>{revenue*=(1+grow/100);const ebit=revenue*s.ebit_margins[i]/100,fcff=ebit*(1-data.model.tax_rate/100)+s.depreciation[i]-s.capex[i]-s.working_capital_other[i];return{year:2027+i,revenue,ebit,fcff}});
  const rate=w/100,perpetual=g/100;
  const cashPV=rows.reduce((v,x,i)=>v+x.fcff/(1+rate)**(i+1),0);
  const terminalPV=rows.at(-1).fcff*(1+perpetual)/(rate-perpetual)/(1+rate)**rows.length;
  const enterprise=cashPV+terminalPV,eq=enterprise-data.model.capital_structure.net_debt_m;
  return{rows,enterprise,eq,price:eq/data.model.capital_structure.shares_m,terminalShare:terminalPV/enterprise*100,cashPV,terminalPV};
 }
 function chart(rows){
  if(!rows?.length)return '';
  const vals=rows.map(x=>x.fcff),mx=Math.max(...vals,1),w=560,h=155,p=29;
  const pts=vals.map((v,i)=>({x:p+i*(w-2*p)/(vals.length-1),y:h-p-v/mx*(h-2*p)}));
  const lines=pts.map((a,i)=>(i?'L':'M')+a.x.toFixed(2)+','+a.y.toFixed(2)).join(' ');
  return `<div class="fp-model-chart"><div class="top-label">Prognostizierter Free Cashflow to Firm · Mio. EUR</div><svg viewBox="0 0 ${w} ${h}" role="img" aria-label="FCFF-Prognose 2027 bis 2031"><path d="${lines}" stroke="#83e6c4" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>${pts.map((q,i)=>`<circle cx="${q.x}" cy="${q.y}" r="5" fill="#82e6c6"/><text x="${q.x}" y="${q.y-14}" text-anchor="middle" fill="#e2f1ee" font-size="12">${fmt(vals[i])}</text><text x="${q.x}" y="${h-5}" text-anchor="middle" fill="#a9c2cf" font-size="12">${rows[i].year}</text>`).join('')}</svg></div>`;
 }
 function build(){
  if(!data)return '<div class="fp-model-state">Bewertungsmodell wird geladen. Die ausgewiesenen Annahmen sind keine Marktfakten.</div>';
  const scenario=caseById(selected);
  if(!scenario)return '<div class="fp-model-state">Es liegen noch keine gültigen Szenarien vor.</div>';
  const w=wacc===null?scenario.wacc:wacc,gr=growth===null?scenario.g:growth;
  const val=calc(scenario,w,gr);
  if(!val)return '<p>Die langfristige Wachstumsrate muss niedriger als der Diskontsatz sein.</p>';
  const anchor=data.quote.price,delta=(val.price/anchor-1)*100;
  const base=cases().map(x=>({...x,target:calc(x).price}));
  const gridW=[9,10,10.5,11,12],gridG=[1,1.5,2,2.5,3];
  return `<div class="fp-model-cases" role="tablist" aria-label="Investment-Szenario">${base.map(x=>`<button type="button" role="tab" data-model-case="${esc(x.id)}" aria-selected="${selected===x.id}"><span>${esc(x.name)}</span><b>${euro(x.target)}</b></button>`).join('')}</div>
   <div class="fp-model-kpis"><div><span>Modellierter fairer Wert / Aktie</span><strong>${euro(val.price)}</strong></div><div><span>Relativ zum Xetra-Schluss ${fmt(anchor)} € · ${esc(data.quote.asof)}</span><strong class="${delta>=0?'pos':'neg'}">${delta>=0?'+':''}${fmt(delta)} %</strong></div></div>
   <p class="fp-model-driver">${esc(scenario.reason)}</p>
   <div class="fp-model-controls"><label>WACC / Diskontsatz <b>${fmt(w)} %</b><input type="range" min="8.5" max="13" step="0.5" value="${w}" data-model-wacc /></label><label>Terminalwachstum <b>${fmt(gr)} %</b><input type="range" min="0.5" max="3" step="0.5" value="${gr}" data-model-g /></label></div>
   <p class="fp-model-guide"><b>Wichtig:</b> Sinkt der WACC oder steigt das Terminalwachstum, steigt der Modellwert oft stark. Dieser Effekt bedeutet keine sichere Kurschance. ${fmt(val.terminalShare)} % des Unternehmenswerts stammen hier aus dem Endwert nach 2031.</p>
   ${chart(val.rows)}
   <details class="fp-model-details"><summary>Alle fünf Prognosejahre und Rechnungen anzeigen</summary><div class="fp-model-table-scroll"><table><thead><tr><th>Jahr</th><th>Umsatz (Mio. €)</th><th>EBIT-Marge</th><th>EBIT</th><th>FCFF</th></tr></thead><tbody>${val.rows.map((x,i)=>`<tr><td>${x.year}</td><td>${fmt(x.revenue)}</td><td>${fmt(scenario.ebit_margins[i])} %</td><td>${fmt(x.ebit)}</td><td>${fmt(x.fcff)}</td></tr>`).join('')}</tbody></table></div><p>Barwert fünf Jahre: ${fmt(val.cashPV)} Mio. € · Barwert Endwert: ${fmt(val.terminalPV)} Mio. € · EV: ${fmt(val.enterprise)} Mio. € · abzüglich Nettoschulden: ${fmt(data.model.capital_structure.net_debt_m)} Mio. € · geteilt durch ${fmt(data.model.capital_structure.shares_m)} Mio. Aktien.</p></details>
   <details class="fp-model-details"><summary>Wie empfindlich ist das Kursziel? Sensitivitätsmatrix</summary><div class="fp-model-table-scroll"><table class="fp-model-matrix"><thead><tr><th>WACC \\ g</th>${gridG.map(z=>`<th>${fmt(z)} %</th>`).join('')}</tr></thead><tbody>${gridW.map(z=>`<tr><th>${fmt(z)} %</th>${gridG.map(h=>`<td>${euro(calc(scenario,z,h).price)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p>Jede Zelle zeigt den Modellwert je Aktie bei anderen Diskont-/Wachstumsannahmen, während die operativen Annahmen des Szenarios unverändert bleiben.</p></details>
   <details class="fp-model-details"><summary>Quellen, Annahmen und wichtige Modellrisiken</summary><p>${esc(data.model.formula)}</p><p>${esc(data.model.warning)}</p><ul>${data.source_audit.map(s=>`<li><a target="_blank" rel="noopener noreferrer" href="${esc(s.url)}">${esc(s.title)} (${esc(s.date)})</a></li>`).join('')}</ul><p>Bewertungsdatum: ${esc(data.model.valuation_date)}. Alle Prognosejahre und WACC-Annahmen sind unabhängige Lernmodell-Annahmen und weder offizielle Unternehmensguidance noch validierter Analystenkonsens.</p></details>`;
 }
 function mount(root=document){
  const el=root.querySelector('#fp-valuation-model');
  if(!el)return;
  if(!data){if(!fetching){fetching=fetch('./data/kion_model.json?cb='+Date.now(),{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Daten '+r.status);return r.json()}).then(v=>{data=v;fetching=null;const target=document.querySelector('#fp-valuation-model');if(target)mount(document)}).catch(()=>{fetching=null;const target=document.querySelector('#fp-valuation-model');if(target)target.innerHTML='<div class="fp-model-state">Das Bewertungsmodell ist vorübergehend nicht erreichbar. Keine Ersatzkurse oder erfundenen Daten.</div>'})}return}
  el.innerHTML=build();
  el.querySelectorAll('[data-model-case]').forEach(b=>b.addEventListener('click',()=>{selected=b.dataset.modelCase;wacc=null;growth=null;mount(root)}));
  el.querySelector('[data-model-wacc]')?.addEventListener('input',ev=>{wacc=Number(ev.target.value);mount(root)});
  el.querySelector('[data-model-g]')?.addEventListener('input',ev=>{growth=Number(ev.target.value);mount(root)});
 }
 function summary(){return data?cases().map(s=>({name:s.name,target:calc(s)?.price})):[]}
 return{html:()=>'<div id="fp-valuation-model" class="fp-model"></div>',mount,summary,calculate:calc};
})();
})();
