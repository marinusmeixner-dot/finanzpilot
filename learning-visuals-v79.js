/* FinanzPilot V79 · Interactive educational visualizations.
 * Synthetic market samples; no trading signals, network calls or rewards.
 * Isolated to optional lesson examples; no mutation of official quiz state.
 */
(function(){
'use strict';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=(x,d=1)=>Number(x).toLocaleString('de-DE',{minimumFractionDigits:d,maximumFractionDigits:d});
const map={
 'was-ist-boerse':'chart','aktienpreis-wert':'chart',
 'orderbuch-liquiditaet-1':'chart','orderbuch-liquiditaet-2':'chart',
 'orderkosten-slippage-2':'chart','backtests-kritisch-1':'chart',
 'backtests-kritisch-3':'chart','trade-risiko-plan-3':'chart',
 'unternehmen-geschaeft':'flow','umsatz-kosten':'flow',
 'cashflow-einfach':'flow','wachstum-marge':'flow','rechnen-cashflow':'flow',
 'berichte-lesen-3':'flow','cashflow-architekt-1':'flow',
 'cashflow-architekt-2':'flow','cashflow-architekt-3':'flow',
 'quality-of-earnings-2':'flow','financial-statement-forensics-2':'flow',
 'working-capital-diagnose-1':'flow','working-capital-diagnose-3':'flow',
 'urteil-positionsrisiko':'risk','position-sizing-1':'risk',
 'position-sizing-3':'risk','trade-risiko-plan-1':'risk',
 'trade-risiko-plan-2':'risk','risiko-basis-3':'risk',
 'depot-stresstests-1':'risk',
 'anlagearten':'bond','zins-inflation-bewertung':'bond',
 'inflation-zinsen-2':'bond','zinskurve-szenarien-1':'bond',
 'zinskurve-szenarien-2':'bond','zinskurve-szenarien-3':'bond',
 'makro-risiken-1':'bond'
};
const labels={
 chart:['Kerzen und Charttechnik','Verändere einen Kurs und beobachte Kerzenkörper, Docht, Trend und gleitenden Durchschnitt.'],
 flow:['Umsatz, Gewinn und Cashflow','Verschiebe die Größen und verfolge, wie Ergebnis und tatsächliche Zahlungen auseinanderlaufen.'],
 risk:['Stop, Ziel und Positionsgröße','Verschiebe Einstieg, Stop und Ziel und berechne das Risiko eines beispielhaften Long-Trades.'],
 bond:['Warum Anleihekurse auf Zinsen reagieren','Ändere Marktrendite, Kupon und Restlaufzeit und beobachte den Barwert einer festen Anleihe.']
};
const slider=(key,label,min,max,value,step,unit)=>'<label class="fp79-slider"><span>'+esc(label)+' <output data-fp79-value="'+key+'">'+esc(value)+' '+esc(unit)+'</output></span><input type="range" min="'+min+'" max="'+max+'" step="'+step+'" value="'+value+'" data-fp79-control="'+key+'" aria-label="'+esc(label)+'"></label>';
function render(id){
 const kind=map[id];if(!kind)return '';
 let controls='';
 if(kind==='chart')controls='<label class="fp79-choice">Kursverlauf<select data-fp79-control="scenario"><option value="up">Aufwärtstrend</option><option value="side">Seitwärtsmarkt</option><option value="down">Abwärtstrend</option></select></label>'+
  '<div class="fp79-toggles"><label><input type="checkbox" data-fp79-control="ma" checked> Gleitender Durchschnitt (4)</label><label><input type="checkbox" data-fp79-control="zones" checked> Unterstützung/Widerstand</label><label><input type="checkbox" data-fp79-control="trend"> Trendlinie</label></div>'+
  slider('close','Ausgewählte Kerze: Schlusskurs verändern',-10,10,0,1,'Punkte')+
  '<small>Tippe auf eine Kerze, um Open, High, Low und Close zu sehen. Beispieldaten, keine echten Börsenkurse.</small>';
 if(kind==='flow')controls='<div class="fp79-slider-grid">'+
  slider('revenue','Umsatz',80,300,200,10,'Mio. €')+
  slider('costs','Ausgezahlte Betriebskosten',40,260,125,5,'Mio. €')+
  slider('deprec','Abschreibungen',0,40,20,5,'Mio. €')+
  slider('working','Veränderung Working Capital',-40,70,25,5,'Mio. €')+
  slider('capex','Investitionsauszahlungen',0,120,40,5,'Mio. €')+'</div>';
 if(kind==='risk')controls='<div class="fp79-slider-grid">'+
  slider('capital','Beispiel-Depotgröße',500,10000,5000,500,'€')+
  slider('percent','Risikobudget je Trade',.5,3,1,.5,'%')+
  slider('entry','Einstieg',40,160,100,1,'€')+
  slider('stop','Stop',30,170,93,1,'€')+
  slider('target','Kursziel',40,200,116,1,'€')+
  slider('gap','Zusätzlicher Ausführungsschlupf im Risikoszenario',0,8,2,1,'%')+'</div>';
 if(kind==='bond')controls='<div class="fp79-slider-grid">'+
  slider('coupon','Jährlicher Kupon',1,9,4,.5,'%')+
  slider('yield','Marktrendite',.5,14,6,.5,'%')+
  slider('years','Restlaufzeit',1,20,10,1,'Jahre')+'</div>';
 return '<details class="fp79-visual" data-fp79="'+kind+'" data-fp79-lesson="'+esc(id)+'">'+
 '<summary><span class="fp79-visual-icon" aria-hidden="true">◉</span><span><b>Interaktiv verstehen · '+esc(labels[kind][0])+'</b><small>Freiwillige Visualisierung · ohne zusätzliche Fragen oder XP</small></span></summary>'+
 '<div class="fp79-body"><p>'+esc(labels[kind][1])+'</p><div class="fp79-controls">'+controls+
 '</div><div class="fp79-output" data-fp79-output aria-live="polite"></div>'+
 '<small class="fp79-disclaimer">Didaktisches Modell mit vereinfachten Annahmen. Keine Prognose, Handelsberatung oder Live-Marktdaten.</small></div></details>';
}
function get(p,key){return Number(p.querySelector('[data-fp79-control="'+key+'"]')?.value??0)}
function setLabels(p){
 p.querySelectorAll('input[type="range"][data-fp79-control]').forEach(el=>{
  const o=p.querySelector('[data-fp79-value="'+el.dataset.fp79Control+'"]');
  if(o){const units={close:'Punkte',revenue:'Mio. €',costs:'Mio. €',deprec:'Mio. €',working:'Mio. €',capex:'Mio. €',capital:'€',percent:'%',entry:'€',stop:'€',target:'€',gap:'%',coupon:'%',yield:'%',years:'Jahre'};o.textContent=num(el.value,Number(el.step)%1?1:0)+' '+(units[el.dataset.fp79Control]||'')}
 });
}
function chartBars(scenario,selected,offset){
 const sample={up:[92,94,92,95,97,96,101,100,104,106,105,108,110,112],
 side:[101,103,100,98,99,101,104,102,100,98,99,101,103,102],
 down:[113,112,109,110,107,105,106,103,100,101,98,96,94,92]}[scenario]||[];
 return sample.map((b,i)=>{
  const open=i===0?b-2:sample[i-1]+(i%3===0?1:-1);
  const close=b+(i===selected?offset:0);
  return {open,close,high:Math.max(open,close)+2+(i%2),low:Math.min(open,close)-2-(i%3===0?1:0)};
 });
}
function chart(p){
 const scenario=p.querySelector('[data-fp79-control="scenario"]').value;
 const selected=Math.min(13,Math.max(0,Number(p.dataset.selected||0)));
 const bars=chartBars(scenario,selected,get(p,'close')),selectedBar=bars[selected];
 const min=Math.floor(Math.min(...bars.map(x=>x.low))-2),max=Math.ceil(Math.max(...bars.map(x=>x.high))+2);
 const y=v=>250-(v-min)/(max-min)*202,x=i=>55+i*46;
 let svg='<svg viewBox="0 0 740 308" role="img" aria-label="Interaktiver Beispiel-Candlestick-Chart mit 14 auswählbaren Kerzen. Keine echten Kursdaten." preserveAspectRatio="xMidYMid meet" class="fp79-chart-svg">';
 for(let i=0;i<=4;i++){const v=min+(max-min)*i/4;svg+='<line x1="37" x2="709" y1="'+y(v)+'" y2="'+y(v)+'" class="fp79-grid"/><text x="4" y="'+(y(v)+4)+'" class="fp79-axis">'+num(v,0)+'</text>'}
 for(let i=0;i<bars.length;i++){
  const b=bars[i],g=b.close>=b.open,upper=Math.min(y(b.open),y(b.close)),height=Math.max(2,Math.abs(y(b.open)-y(b.close)));
  svg+='<g tabindex="0" role="button" aria-label="Kerze '+(i+1)+' auswählen, Schlusskurs '+num(b.close)+'" data-fp79-candle="'+i+'">'+
   '<rect x="'+(x(i)-18)+'" y="29" width="36" height="237" class="fp79-hit"/>'+
   '<line x1="'+x(i)+'" y1="'+y(b.high)+'" x2="'+x(i)+'" y2="'+y(b.low)+'" class="fp79-wick '+(g?'up':'down')+'"/>'+
   '<rect x="'+(x(i)-9)+'" y="'+upper+'" width="18" height="'+height+'" class="fp79-candle '+(g?'up':'down')+(i===selected?' chosen':'')+'"/></g>'+
   '<text x="'+x(i)+'" y="280" text-anchor="middle" class="fp79-axis">'+(i+1)+'</text>';
 }
 if(p.querySelector('[data-fp79-control="zones"]').checked){
  const support=Math.min(...bars.map(b=>b.low)),resistance=Math.max(...bars.map(b=>b.high));
  svg+='<line x1="38" y1="'+y(resistance)+'" x2="709" y2="'+y(resistance)+'" class="fp79-resistance"/><line x1="38" y1="'+y(support)+'" x2="709" y2="'+y(support)+'" class="fp79-support"/>'+
   '<text x="698" y="'+(y(resistance)-5)+'" text-anchor="end" class="fp79-zone-label">Widerstand '+num(resistance)+'</text>'+
   '<text x="698" y="'+(y(support)+16)+'" text-anchor="end" class="fp79-zone-label">Unterstützung '+num(support)+'</text>';
 }
 if(p.querySelector('[data-fp79-control="ma"]').checked){
  const pts=bars.map((b,i)=>i<3?null:[x(i),y(bars.slice(i-3,i+1).reduce((s,k)=>s+k.close,0)/4)]).filter(Boolean);
  svg+='<polyline points="'+pts.map(pt=>pt.join(',')).join(' ')+'" class="fp79-ma"/>';
 }
 if(p.querySelector('[data-fp79-control="trend"]').checked){
  svg+='<line x1="'+x(0)+'" y1="'+y(bars[0].close)+'" x2="'+x(13)+'" y2="'+y(bars[13].close)+'" class="fp79-trend"/>';
 }
 svg+='<text x="372" y="301" text-anchor="middle" class="fp79-axis">14 synthetische Handelstage · Kerzen auswählen</text></svg>';
 const type=selectedBar.close>selectedBar.open?'positive Kerze (Schluss über Eröffnung)':selectedBar.close<selectedBar.open?'negative Kerze (Schluss unter Eröffnung)':'Doji (Schluss gleich Eröffnung)';
 return '<div class="fp79-figure">'+svg+'</div><div class="fp79-stats">'+
   [['Open',selectedBar.open],['High',selectedBar.high],['Low',selectedBar.low],['Close',selectedBar.close]].map(x=>'<span><small>'+x[0]+'</small><strong>'+num(x[1])+'</strong></span>').join('')+'</div>'+
   '<p class="fp79-insight"><strong>Kerze '+(selected+1)+':</strong> '+type+'. Die Dochte zeigen das höchste und niedrigste Niveau, der Körper Open und Close. '+(scenario==='up'?'Höhere Schlusskurse können einen Aufwärtstrend anzeigen.':scenario==='down'?'Fallende Schlusskurse können auf einen Abwärtstrend hinweisen.':'Seitwärtsbewegungen können eine Handelsspanne bilden.')+'</p>'+
   '<p class="fp79-explain">Unterstützung und Widerstand sind hier ausschließlich die Extrempunkte des gezeigten Beispiels – keine garantierten Umkehrpunkte. Der MA glättet die letzten 4 Schlusskurse; beim Verschieben der Kerze berechnet er sich neu.</p>';
}
function bar(label,value,minX,maxX,color){
 const w=600,scale=w/Math.max(1,maxX-minX),zero=60+(0-minX)*scale,start=60+(Math.min(value,0)-minX)*scale;
 const width=Math.max(1,Math.abs(value)*scale);
 return '<g><text x="3" y="15" class="fp79-bar-label">'+esc(label)+'</text><rect x="'+start+'" y="25" width="'+width+'" height="20" rx="3" class="'+color+'"/><line x1="'+zero+'" y1="20" x2="'+zero+'" y2="49" class="fp79-zero"/><text x="671" y="40" class="fp79-bar-value">'+num(value,0)+'</text></g>';
}
function flow(p){
 const revenue=get(p,'revenue'),costs=get(p,'costs'),deprec=get(p,'deprec'),wc=get(p,'working'),capex=get(p,'capex');
 const ebit=revenue-costs-deprec,ocf=ebit+deprec-wc,fcf=ocf-capex;
 const max=Math.max(300,Math.abs(fcf),Math.abs(ocf),Math.abs(ebit),revenue,costs,capex,Math.abs(wc))+15;
 const min=Math.min(-50,fcf-10,ocf-10,ebit-10);
 const rows=[['Umsatz',revenue,'fp79-positive'],['− Betriebskosten',-costs,'fp79-negative'],['EBIT',ebit,'fp79-highlight'],['Operativer Cashflow',ocf,'fp79-positive'],['− Investitionen',-capex,'fp79-negative'],['Free Cashflow',fcf,'fp79-highlight']];
 const svg='<svg viewBox="0 0 760 350" role="img" aria-label="Balkendiagramm für Umsatz, Betriebskosten, EBIT, operativen Cashflow und Free Cashflow" preserveAspectRatio="xMidYMid meet">'+rows.map((row,i)=>'<g transform="translate(0 '+(i*56+5)+')">'+bar(row[0],row[1],min,max,row[2]).replace('class="'+row[2]+'"','class="'+row[2]+'"')+'</g>').join('')+'</svg>';
 const diff=fcf-ebit;
 return '<div class="fp79-figure">'+svg+'</div>'+
  '<div class="fp79-stats">'+[['EBIT',ebit],['Operativer CF',ocf],['Free Cashflow',fcf]].map(x=>'<span><small>'+x[0]+'</small><strong>'+num(x[1],0)+' Mio. €</strong></span>').join('')+'</div>'+
  '<p class="fp79-insight"><strong>Rechenweg:</strong> EBIT = '+num(revenue,0)+' − '+num(costs,0)+' − '+num(deprec,0)+' = '+num(ebit,0)+' Mio. €. Operativer Cashflow ≈ EBIT + '+num(deprec,0)+' Abschreibungen − ('+num(wc,0)+') Working-Capital-Veränderung = '+num(ocf,0)+' Mio. €. Free Cashflow ≈ '+num(ocf,0)+' − '+num(capex,0)+' = <b>'+num(fcf,0)+' Mio. €</b>.</p>'+
  '<p class="fp79-explain">In diesem Modell werden Steuern, Zinsen, sonstige zahlungsunwirksame Positionen und andere Zahlungszeitpunkte bewusst auf null gesetzt. Ein positiver EBIT kann trotzdem zu negativem Free Cashflow führen. Verändertes Working Capital bindet bei positivem Wert Geld, bei negativem setzt es Geld frei. EBIT und Cashflow sind nicht austauschbar.</p>';
}
function risk(p){
 const capital=get(p,'capital'),percent=get(p,'percent'),entry=get(p,'entry'),stop=get(p,'stop'),target=get(p,'target'),gap=get(p,'gap');
 const valid=stop<entry&&target>entry;
 const ymin=Math.min(stop,entry,target)-12,ymax=Math.max(stop,entry,target)+12;
 const Y=v=>260-(v-ymin)/(ymax-ymin)*210;
 let svg='<svg viewBox="0 0 760 290" role="img" aria-label="Preisdiagramm mit Einstieg, Stop und Ziel. Bildungsbeispiel ohne echte Transaktion." preserveAspectRatio="xMidYMid meet"><rect x="60" y="38" width="650" height="226" class="fp79-risk-bg"/>';
 if(valid){svg+='<rect x="70" y="'+Y(target)+'" width="625" height="'+Math.max(0,Y(entry)-Y(target))+'" class="fp79-reward-area"/><rect x="70" y="'+Y(entry)+'" width="625" height="'+Math.max(0,Y(stop)-Y(entry))+'" class="fp79-loss-area"/>'}
 for(const [name,v,cls] of [['Ziel',target,'fp79-risk-target'],['Einstieg',entry,'fp79-risk-entry'],['Stop',stop,'fp79-risk-stop']]){
  svg+='<line x1="65" y1="'+Y(v)+'" x2="703" y2="'+Y(v)+'" class="'+cls+'"/><text x="692" y="'+(Y(v)-7)+'" text-anchor="end" class="fp79-zone-label">'+name+' '+num(v)+' €</text>';
 }
 svg+='</svg>';
 if(!valid)return '<div class="fp79-figure">'+svg+'</div><p class="fp79-warning" role="status">Für dieses Long-Beispiel muss der Stop unter dem Einstieg und das Ziel über dem Einstieg liegen. Passe die Regler an.</p>';
 const riskPerShare=entry-stop,rewardPerShare=target-entry,budget=capital*percent/100;
 const riskQty=Math.floor(budget/riskPerShare),cashQty=Math.floor(capital/entry),qty=Math.max(0,Math.min(riskQty,cashQty)),capitalUsed=qty*entry;
 const planLoss=qty*riskPerShare,planReward=qty*rewardPerShare,rr=rewardPerShare/riskPerShare;
 const actualExit=stop*(1-gap/100),gapLoss=qty*(entry-actualExit);
 return '<div class="fp79-figure">'+svg+'</div>'+
  '<div class="fp79-stats">'+[['Max. Stückzahl',qty],['Geplanter Verlust',num(planLoss,2)+' €'],['Chance/Risiko',num(rr,2)+':1'],['Kapitaleinsatz',num(capitalUsed,0)+' €']].map(x=>'<span><small>'+x[0]+'</small><strong>'+x[1]+'</strong></span>').join('')+'</div>'+
  '<p class="fp79-insight"><strong>Rechenweg:</strong> Risikobudget = '+num(capital,0)+' € × '+num(percent)+' % = '+num(budget,2)+' €. Risiko je Aktie = '+num(riskPerShare,2)+' €. Daraus höchstens '+riskQty+' Stück nach Risikobudget, bei verfügbarem Bargeld höchstens '+cashQty+'. Daher in diesem ungehebelten Beispiel <b>'+qty+' Stück</b>.</p>'+
  '<p class="fp79-explain">Bei Ausführung am Stop wären etwa '+num(planLoss,2)+' € Verlust möglich, beim Ziel etwa '+num(planReward,2)+' € Gewinn (vor Gebühren). Mit '+num(gap)+' % ungünstigerem tatsächlichem Stop-Ausführungskurs würde der Verlust auf <b>'+num(gapLoss,2)+' €</b> steigen. Ein Stop garantiert keinen Ausführungspreis; Gaps, Slippage und Gebühren sind reale Risiken.</p>';
}
function bondPrice(couponPct,yieldPct,years,face=1000){
 const c=face*couponPct/100,y=yieldPct/100;
 let price=0,weighted=0;
 for(let t=1;t<=years;t++){const cf=c+(t===years?face:0),pv=cf/Math.pow(1+y,t);price+=pv;weighted+=t*pv}
 const macaulay=weighted/price,modified=macaulay/(1+y);
 return {price,macaulay,modified};
}
function bond(p){
 const coupon=get(p,'coupon'),yieldPct=get(p,'yield'),years=get(p,'years');
 const v=bondPrice(coupon,yieldPct,years);
 const paths=Array.from({length:57},(_,i)=>({y:i*.25,p:bondPrice(coupon,i*.25,years).price}));
 const min=Math.min(...paths.map(x=>x.p))*.96,max=Math.max(...paths.map(x=>x.p))*1.04;
 const y=x=>258-(x-min)/(max-min)*205,x=rate=>55+rate/14*637;
 const pts=paths.map(t=>x(t.y)+','+y(t.p)).join(' ');
 const svg='<svg viewBox="0 0 760 310" role="img" aria-label="Kurve für den theoretischen Kurs einer festverzinslichen Anleihe in Abhängigkeit von der Marktrendite" preserveAspectRatio="xMidYMid meet">'+
  [0,3.5,7,10.5,14].map(rate=>'<line x1="'+x(rate)+'" y1="38" x2="'+x(rate)+'" y2="260" class="fp79-grid"/><text x="'+x(rate)+'" y="286" text-anchor="middle" class="fp79-axis">'+num(rate,1)+' %</text>').join('')+
  [min,(min+max)/2,max].map(price=>'<line x1="55" y1="'+y(price)+'" x2="698" y2="'+y(price)+'" class="fp79-grid"/><text x="0" y="'+(y(price)+5)+'" class="fp79-axis">'+num(price,0)+' €</text>').join('')+
  '<polyline points="'+pts+'" class="fp79-bond-line"/>'+
  '<circle cx="'+x(yieldPct)+'" cy="'+y(v.price)+'" r="7" class="fp79-bond-dot"/>'+
  '<text x="380" y="307" text-anchor="middle" class="fp79-axis">Marktrendite pro Jahr</text></svg>';
 const change=bondPrice(coupon,yieldPct+1,years).price-v.price;
 return '<div class="fp79-figure">'+svg+'</div>'+
  '<div class="fp79-stats">'+[['Theoretischer Kurs',num(v.price,2)+' €'],['Nominalwert','1.000 €'],['Modifizierte Duration',num(v.modified,2)+' Jahre'],['Bei +1 %-Punkt Zins',num(change,2)+' €']].map(k=>'<span><small>'+k[0]+'</small><strong>'+k[1]+'</strong></span>').join('')+'</div>'+
  '<p class="fp79-insight"><strong>Warum?</strong> Bei '+num(coupon)+' % Kupon zahlt diese beispielhafte Anleihe '+num(coupon*10,2)+' € pro Jahr. Wer eine Marktrendite von '+num(yieldPct)+' % verlangt, diskontiert alle zukünftigen Kupons und die Rückzahlung von 1.000 € auf heute. Daraus folgt ein theoretischer Kurs von <b>'+num(v.price,2)+' €</b>.</p>'+
  '<p class="fp79-explain">Steigen die Marktzinsen, sinkt der Barwert der festen Zahlungen; bei niedrigeren Zinsen steigt er. Die modifizierte Duration schätzt die prozentuale Kursempfindlichkeit bei kleinen Zinsänderungen. Modell: jährlicher fixer Kupon, Rückzahlung zum Nennwert, keine Ausfälle, Kosten, Steuern oder Kündigungsrechte.</p>';
}
function update(panel){
 setLabels(panel);
 const kind=panel.dataset.fp79,output=panel.querySelector('[data-fp79-output]');
 if(!output)return;
 output.innerHTML=kind==='chart'?chart(panel):kind==='flow'?flow(panel):kind==='risk'?risk(panel):bond(panel);
}
function bind(root=document){
 root.querySelectorAll('[data-fp79]').forEach(panel=>{
  if(panel.dataset.fp79Bound)return;
  panel.dataset.fp79Bound='1';
  panel.addEventListener('toggle',()=>{if(panel.open)update(panel)});
  panel.addEventListener('input',event=>{if(event.target.matches('[data-fp79-control]')){if(event.target.dataset.fp79Control==='scenario'){panel.dataset.selected='0';const close=panel.querySelector('[data-fp79-control="close"]');if(close)close.value=0}update(panel)}});
  panel.addEventListener('change',event=>{if(event.target.matches('[data-fp79-control]'))update(panel)});
  const select=event=>{
   const candle=event.target.closest('[data-fp79-candle]');
   if(!candle)return;
   panel.dataset.selected=candle.dataset.fp79Candle;
   const close=panel.querySelector('[data-fp79-control="close"]');if(close)close.value=0;
   update(panel);
  };
  panel.addEventListener('click',select);
  panel.addEventListener('keydown',event=>{
   if(event.key==='Enter'||event.key===' '){if(event.target.closest('[data-fp79-candle]')){event.preventDefault();select(event)}}
  });
  if(panel.open)update(panel);
 });
}
window.FinanzPilotVisuals={render,bind,update,bondPrice,chartBars,kindFor:id=>map[id]||null,ids:Object.keys(map)};
})();