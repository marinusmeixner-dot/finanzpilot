(function makeCareer(){
 'use strict';
 window.FinanzPilotCareer=(()=>{
  const SOURCE='./data/career.json',UI_KEY='finanzpilot_career_ui_v1';
  let content=null,problem='',selected=null,result=null;
  const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const read=k=>{try{return JSON.parse(localStorage.getItem(k)||'{}')||{}}catch{return {}}};
  const ui=read(UI_KEY);
  selected=typeof ui.selected==='string'?ui.selected:null;
  const fmt=(n,d=1)=>Number(n).toLocaleString('de-DE',{minimumFractionDigits:d,maximumFractionDigits:d});
  const money=n=>Number(n).toLocaleString('de-DE',{style:'currency',currency:'EUR',minimumFractionDigits:2,maximumFractionDigits:2});
  const mastery=()=>window.FinanzPilotSkills?.levels()||{};
  const prog=()=>{const k=read('finanzpilot_academy_v4'),t=read('finanzpilot_training_v1');return {course:k.completed||{},train:Object.fromEntries(Object.entries(t.sessions||{}).map(([id,x])=>[id,Number(x.bestScore)||0]))}};
  function status(){
   const skills=mastery(),count=Object.values(skills).filter(x=>x.mastered).length;
   const ranks=content?.ranks||[];
   const rankIndex=Math.max(0,ranks.findLastIndex(x=>count>=x.minSkills));
   const rank=ranks[rankIndex]||{id:'kursfunke',name:'Kursfunke',minSkills:0};
   const next=ranks[rankIndex+1]||null;
   const progress=prog();
   const unlockedTool=tool=>{
    const missing=[];
    if(tool.minRank>rankIndex)missing.push('Karriererang '+ranks[tool.minRank].name);
    for(const req of tool.required||[])if(!skills[req]?.mastered)missing.push('Skill '+(req==='ledger'?'Bilanzspäher':req==='cashflow'?'Cashflow-Sucher':req==='quality'?'Gewinn-Prüfer':req==='portfolio2'?'Risikoarchitekt':req==='valuations'?'Renditeschmied':req));
    if(tool.requiredTraining&&progress.train[tool.requiredTraining.id]<tool.requiredTraining.minScore)missing.push('Praxisreihe '+tool.requiredTraining.id+' mit '+tool.requiredTraining.minScore+'/4');
    return {available:missing.length===0,missing};
   };
   const collected=item=>{
    const courses=Object.entries(item.requiredCourses||{}).every(([id,step])=>Number(progress.course[id]||0)>=step);
    const trains=Object.entries(item.requiredTraining||{}).every(([id,n])=>Number(progress.train[id]||0)>=n);
    const nodes=(item.requiredSkills||[]).every(id=>skills[id]?.mastered);
    return courses&&trains&&nodes;
   };
   return{skills,count,rankIndex,rank,next,unlockedTool,collected};
  }
  const levelsHtml=st=>{
   const limit=st.next?.minSkills??st.count;
   const start=st.rank.minSkills||0;
   const frac=st.next?Math.max(0,Math.min(100,(st.count-start)/Math.max(1,limit-start)*100)):100;
   return `<div class="fp-career-levels">
     <div class="fp-career-rank-top"><span class="fp-career-rank-emblem fp-premium-medal">${window.FinanzPilotIcons?.emblem('rank',st.rankIndex)||'✦'}</span><div><small>DEINE ANALYSTENKARRIERE · STUFE ${st.rankIndex+1}</small><h1>${esc(st.rank.name)}</h1><p>${esc(st.rank.description||'')}</p></div></div>
     <div class="fp-career-progress"><div><b>${st.count} von ${Object.keys(st.skills).length} Skills nachgewiesen</b><span>${st.next?'Nächste Beförderung: '+esc(st.next.name)+' bei '+st.next.minSkills+' Skills':'Alle Karriere-Grundränge erreicht'}</span></div><div class="fp-career-progress-track"><i style="width:${frac}%"></i></div></div>
     <div class="fp-career-rank-benefit"><strong>Freigeschaltet</strong><span>${esc(st.rank.perks?.join(' · ')||'Grundfunktionen')}</span></div>
     <details class="fp-career-all-ranks"><summary>Alle Beförderungen und Voraussetzungen ansehen</summary><div>${content.ranks.map((r,i)=>`<div class="fp-career-rank-row ${i<=st.rankIndex?'earned':''}"><span>${i<=st.rankIndex?'✓':'○'}</span><b>${esc(r.name)}</b><small>ab ${r.minSkills} Skills</small></div>`).join('')}</div></details></div>`;
  };
  const toolMenu=st=>`<section class="fp-career-section"><div class="fp-career-section-title"><h2>Dein Werkzeugkasten</h2><p>Verdiene Analysewerkzeuge durch Skills und Karriereränge. Die grundlegenden Lerninhalte bleiben immer frei.</p></div><div class="fp-career-rows">${content.tools.map(t=>{const g=st.unlockedTool(t);return `<button type="button" class="fp-career-row ${selected===t.id?'active':''}" data-career-select="${esc(t.id)}"><span class="fp-career-row-icon">${g.available?'◈':'♧'}</span><span class="fp-career-row-copy"><b>${esc(t.title)}</b><small>${esc(t.description)}</small></span><span class="fp-career-row-state">${g.available?'Frei ›':'Gesperrt ›'}</span></button>`}).join('')}</div></section>`;
  const awards=st=>`<section class="fp-career-section"><div class="fp-career-section-title"><h2>Meisterurkunden & Kursabzeichen</h2><p>Diese dauerhaften Leistungsnachweise bleiben erhalten. Verbrauchbare Gegenstände findest du ausschließlich im Inventar.</p></div><div class="fp-career-awards">${content.collectibles.map(item=>{const earned=st.collected(item);return `<div class="fp-career-award ${earned?'earned':'locked'}"><div class="fp-career-award-icon fp-premium-medal ${earned?'':'fp-unearned'}">${window.FinanzPilotIcons?.emblem(item.id)||esc(item.symbol)}</div><div><b>${esc(item.name)}</b><small>${esc(earned?item.category:item.description)}</small><span>${earned?'✓ Freigeschaltet':'Noch nicht verdient'}</span></div></div>`}).join('')}</div></section>`;
  const field=(key,name,value='')=>`<label>${esc(name)}<input type="text" inputmode="text" autocomplete="off" spellcheck="false" name="${esc(key)}" value="${esc(value)}" required /></label>`;
  const toolsView=(id)=>{
   const t=content.tools.find(x=>x.id===id);if(!t)return '';
   const gate=status().unlockedTool(t);
   if(!gate.available)return `<section class="fp-career-tool-panel"><div class="eyebrow">${esc(t.category)}</div><h3>${esc(t.title)}</h3><p>${esc(t.description)}</p><div class="fp-career-lock"><b>Für dieses Werkzeug fehlt noch:</b><ul>${gate.missing.map(s=>`<li>${esc(s)}</li>`).join('')}</ul></div><div class="fp-career-tool-actions"><button class="btn secondary" type="button" data-view="training">Training öffnen →</button><button class="btn secondary" type="button" data-view="skills">Skillbaum ansehen →</button></div></section>`;
   let inputs='',note='';
   if(t.action==='margin'){
    inputs=field('revenue','Umsatz aktuell · Mio. €','8522')+field('previous','Umsatz Vorjahr · Mio. €','8200,4')+field('ebit','Bereinigtes EBIT · Mio. €','632,5');
    note='Berechnet Umsatzwachstum und operative EBIT-Marge. EBIT und Umsatz müssen aus demselben Berichtszeitraum stammen.';
   }else if(t.action==='orders'){
    inputs=field('orders','Auftragseingang · Mio. €','274,9')+field('revenue','Umsatz · Mio. €','183,6');
    note='Book-to-Bill zeigt das Verhältnis aus neuen Aufträgen zu Umsatz. Hohe Werte sind keine Garantie für Umsatz oder Gewinn.';
   }else if(t.action==='safety'){
    inputs=field('fair','Dein geschätzter fairer Wert · €','58,20')+field('price','Beobachteter Kurs · €','33,27')+field('discount','Gewünschte Sicherheitsmarge · %','25');
    note='Vergleiche dein eigenes Kursziel mit dem Preis. Schätzfehler im Fair Value können selbst eine große rechnerische Sicherheitsmarge zunichtemachen.';
   }else if(t.action==='risk'){
    inputs=field('w1','Gewichtung Position A · %','60')+field('r1','Kursveränderung Position A · %','-20')+field('w2','Gewichtung Position B · %','30')+field('r2','Kursveränderung Position B · %','10');
    note='Die übrige Gewichtung bleibt in diesem vereinfachten Modell unverzinstes Bargeld. Kein Prognosemodell.';
   }else if(t.action==='peer'){
    inputs=field('price','Beobachteter Aktienkurs · €','33,27')+field('shares','Aktienanzahl · Mio. Stück','131,1')+field('debt','Nettoverschuldung · Mio. €','1196')+field('ebit','Bereinigtes EBIT · Mio. €','845')+field('multiple','Selbst gewähltes EV/EBIT-Multiple · ×','8');
    note='Vergleiche die aktuell implizierte Bewertung mit einer selbst gewählten Bewertungsannahme. Ohne belastbare Peer-Daten ist das Multiple nur ein Rechenszenario.';
   }else if(t.action==='committee'){
    inputs=field('bear','Negativszenario · €','24,59')+field('base','Basisszenario · €','58,20')+field('bull','Positivszenario · €','94,65')+field('pb','Wahrscheinlichkeit Negativ · %','30')+field('pbase','Wahrscheinlichkeit Basis · %','50')+field('pbull','Wahrscheinlichkeit Positiv · %','20')+field('price','Vergleichskurs · €','33,27');
    note='Du selbst vergibst Gewichte für drei begründete Schätzungen. Die Wahrscheinlichkeiten müssen zusammen genau 100 % ergeben. Die Kursziele sind historische KION-Modellannahmen, keine aktuellen Prognosen.';
   }else if(t.action==='dcf'){
    return `<section class="fp-career-tool-panel"><button type="button" class="fp-career-panel-close" data-career-close>← Werkzeugliste</button><div class="eyebrow">${esc(t.category)}</div><h3>${esc(t.title)}</h3><p>${esc(t.description)}</p><div class="fp-career-warning">KION-Fallstudie mit datierten historischen Kursen und eigenständigen Prognoseannahmen. Kein sicheres oder aktuelles Kauf-/Verkaufssignal.</div>${window.FinanzPilotValuation?.html()||'<p>Das Bewertungsmodell wird geladen.</p>'}</section>`;
   }
   return `<section class="fp-career-tool-panel"><button type="button" class="fp-career-panel-close" data-career-close>← Werkzeugliste</button><div class="eyebrow">${esc(t.category)}</div><h3>${esc(t.title)}</h3><p>${esc(note)}</p><div class="fp-career-warning">Die vorbelegten Zahlen sind ausschließlich datierte Lernbeispiele. Ändere sie für deine eigene Analyse.</div><form id="fp-career-calc" data-career-calc="${esc(t.action)}" class="fp-career-tool-form">${inputs}<button class="btn" type="submit">Berechnen →</button></form><div id="fp-career-result" class="fp-career-result" aria-live="polite">${result&&result.tool===t.id?result.html:''}</div></section>`;
  };
  function render(){
   if(!content)return '<section class="fp-career-loading"><h1>Analystenkarriere</h1><p>'+esc(problem||'Ränge und Werkzeuge werden geladen …')+'</p></section>';
   const st=status(),earned=content.collectibles.filter(x=>st.collected(x)).length,unlocked=content.tools.filter(x=>st.unlockedTool(x).available).length;
   return `<div class="fp-career-page">${levelsHtml(st)}<div class="fp-career-stats"><div><b>${unlocked}/${content.tools.length}</b><small>Research-Werkzeuge</small></div><div><b>${earned}/${content.collectibles.length}</b><small>Sammlerstücke</small></div></div>${toolMenu(st)}${selected?toolsView(selected):''}${awards(st)}<section class="fp41-career-link"><h3>Neue Spezialisierungskarriere</h3><p>Zusätzlich zu deinen bestehenden Kursnachweisen zählt jede fünf erfolgreich bestandenen neuen Spezialisierungen als ein geprüfter Beförderungsmeilenstein. Die neue Streak berücksichtigt diese Beförderungen bereits.</p><p>Neue Beförderungen: ${window.FinanzPilotLearningHub?.status?.profiles?.[0]?.promotion_count||0}. Der Skillbaum und alle spezialisierten Kurse sind ausschließlich im Bereich <strong>Lernen</strong> zu finden.</p></section><p class="fp-career-foot">Deine bisher erworbenen Karriereabzeichen und Forschungswerkzeuge bleiben erhalten. Sie werden bei der späteren Zusammenführung nicht gelöscht.</p></div>`;
  }
  function numberOf(v){
   const s=String(v||'').trim();
   if(!s||s.length>100)return NaN;
   try{return window.FinanzPilotMath?.calculate?window.FinanzPilotMath.calculate(s):Number(s.replace(',','.'))}catch{return NaN}
  }
  function evaluate(type,values){
   const n=k=>numberOf(values[k]);
   if(type==='margin'){
    const a=n('revenue'),prev=n('previous'),ebit=n('ebit');
    if(!(a>0&&prev>0&&Number.isFinite(ebit)))throw Error('Umsatz und Vorjahresumsatz müssen größer als null sein.');
    const growth=(a/prev-1)*100,margin=ebit/a*100;
    return `<div class="fp-career-output"><h4>Dein Margenprofil</h4><div><span>Umsatzwachstum</span><b>${fmt(growth)} %</b></div><div><span>Operative EBIT-Marge</span><b>${fmt(margin)} %</b></div><p>(Umsatz aktuell / Vorjahr − 1) × 100 · EBIT / Umsatz × 100. Ertragskraft und zukünftige Nachfrage getrennt bewerten.</p></div>`;
   }
   if(type==='orders'){
    const orders=n('orders'),revenue=n('revenue');
    if(!(orders>=0&&revenue>0))throw Error('Auftragseingang darf nicht negativ und Umsatz muss größer als null sein.');
    const ratio=orders/revenue;
    return `<div class="fp-career-output"><h4>Book-to-Bill</h4><div><span>Neue Aufträge je 1 € Umsatz</span><b>${fmt(ratio,2)}×</b></div><p>${ratio>=1?'Der Auftragseingang übersteigt den Umsatz. Prüfe dennoch Lieferfristen, Stornos, Marge und Cashflow.':'Die Bestellungen liegen unter dem Umsatz. Prüfe Saisonmuster, Segmentmix und Auftragsbestand.'}</p></div>`;
   }
   if(type==='safety'){
    const fair=n('fair'),price=n('price'),discount=n('discount');
    if(!(fair>0&&price>0&&discount>=0&&discount<100))throw Error('Fair Value und Kurs müssen positiv, die Sicherheitsmarge zwischen 0 und unter 100 % sein.');
    const safety=(fair-price)/fair*100,upside=(fair/price-1)*100,threshold=fair*(1-discount/100);
    return `<div class="fp-career-output"><h4>Bewertung und Sicherheitsmarge</h4><div><span>Schätzwert minus Kurs / Schätzwert</span><b>${fmt(safety)} %</b></div><div><span>Rechnerisches Kurspotenzial</span><b>${fmt(upside)} %</b></div><div><span>Preisgrenze für ${fmt(discount)} % Sicherheitsmarge</span><b>${money(threshold)}</b></div><p>Der Fair Value ist eine Annahme. Eine positive Differenz ist keine sichere Kursprognose.</p></div>`;
   }
   if(type==='risk'){
    const w1=n('w1'),w2=n('w2'),r1=n('r1'),r2=n('r2');
    if(![w1,w2,r1,r2].every(Number.isFinite)||w1<0||w2<0||w1+w2>100||r1< -100||r2< -100||r1>1000||r2>1000)throw Error('Gewichte müssen zusammen höchstens 100 % ergeben; Preisveränderungen mindestens −100 % und höchstens +1.000 %.');
    const result=(w1*r1+w2*r2)/100;
    return `<div class="fp-career-output"><h4>Portfoliostress im Beispiel</h4><div><span>Gewichtete Depotveränderung</span><b>${fmt(result)} %</b></div><div><span>Veränderung bei 10.000 €</span><b>${money(10000*result/100)}</b></div><div><span>Bargeldanteil</span><b>${fmt(100-w1-w2)} %</b></div><p>Hohe Einzelgewichte erzeugen Klumpenrisiken. Dieses Beispiel ignoriert Korrelationen, Gebühren und Währungsbewegungen.</p></div>`;
   }
   if(type==='peer'){
    const price=n('price'),shares=n('shares'),debt=n('debt'),ebit=n('ebit'),mult=n('multiple');
    if(![price,shares,debt,ebit,mult].every(Number.isFinite)||price<=0||shares<=0||ebit<=0||mult<=0||mult>150)throw Error('Kurs, Aktienzahl, EBIT und Multiple müssen positiv sein.');
    const enterprise=price*shares+debt,marketMultiple=enterprise/ebit,peerPrice=(mult*ebit-debt)/shares;
    return `<div class="fp-career-output"><h4>Bewertungsprüfung</h4><div><span>Impliziter EV / EBIT</span><b>${fmt(marketMultiple,2)}×</b></div><div><span>Preis bei ${fmt(mult)}× EV/EBIT</span><b>${money(peerPrice)}</b></div><div><span>Rechnerische Differenz zum Kurs</span><b>${fmt((peerPrice/price-1)*100)} %</b></div><p>EV = Kurs × Aktienzahl + Nettoverschuldung. Vergleichswert = (Multiple × EBIT − Nettoverschuldung) / Aktienzahl. Das gewählte Multiple ist ohne dokumentierten Peer-Vergleich keine objektive Markteinschätzung.</p></div>`;
   }
   if(type==='committee'){
    const bear=n('bear'),base=n('base'),bull=n('bull'),p1=n('pb'),p2=n('pbase'),p3=n('pbull'),price=n('price');
    if(![bear,base,bull,p1,p2,p3,price].every(Number.isFinite)||[bear,base,bull,price].some(x=>x<=0)||[p1,p2,p3].some(x=>x<0||x>100)||Math.abs(p1+p2+p3-100)>0.05)throw Error('Alle Kurswerte müssen positiv sein und die drei Wahrscheinlichkeiten genau 100 % ergeben.');
    const expected=(bear*p1+base*p2+bull*p3)/100,variance=(p1*(bear-expected)**2+p2*(base-expected)**2+p3*(bull-expected)**2)/100;
    return `<div class="fp-career-output"><h4>Erwartungswert deines Szenariomodells</h4><div><span>Gewichtetes Research-Kursziel</span><b>${money(expected)}</b></div><div><span>Abstand zum Vergleichskurs</span><b>${fmt((expected/price-1)*100)} %</b></div><div><span>Szenariostreuung · Standardabweichung</span><b>${money(Math.sqrt(variance))}</b></div><p>Gewichteter Wert = Σ Kursziel × subjektive Wahrscheinlichkeit. Die Streuung beschreibt nur diese drei von dir gewählten Werte; sie ist weder Kursvolatilität noch ein statistisch bestätigtes Konfidenzintervall.</p></div>`;
   }
   throw Error('Werkzeug nicht verfügbar.');
  }
  function bind(root=document){
   root.querySelectorAll('[data-career-select]').forEach(b=>b.addEventListener('click',()=>{
    selected=b.dataset.careerSelect;result=null;
    try{localStorage.setItem(UI_KEY,JSON.stringify({selected}))}catch{}
    window.render?.();
    document.querySelector('.fp-career-tool-panel')?.scrollIntoView({behavior:'smooth',block:'start'});
   }));
   root.querySelector('[data-career-close]')?.addEventListener('click',()=>{
    selected=null;result=null;try{localStorage.setItem(UI_KEY,JSON.stringify({selected:null}))}catch{}window.render?.();
   });
   root.querySelector('#fp-career-calc')?.addEventListener('submit',ev=>{
    ev.preventDefault();
    const form=ev.currentTarget,values=Object.fromEntries(new FormData(form).entries());
    const output=document.getElementById('fp-career-result');
    if(!output)return;
    try{const html=evaluate(form.dataset.careerCalc,values);result={tool:selected,html};output.innerHTML=html}
    catch(e){output.textContent=e.message||'Bitte die Zahlen prüfen.'}
   });
   if(content&&selected==='dcf'){const tool=content.tools.find(t=>t.id==='dcf');if(tool&&status().unlockedTool(tool).available)window.FinanzPilotValuation?.mount(root)}
  }
  async function load(){
   try{const r=await fetch(SOURCE+'?v='+Date.now(),{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);const v=await r.json();
    if(v.schema_version!==1||!Array.isArray(v.ranks)||!Array.isArray(v.tools)||!Array.isArray(v.collectibles))throw Error('Ungültige Karrieredaten');
    content=v;problem='';
   }catch(e){problem='Karrieredaten derzeit nicht verfügbar. Bitte neu laden.'}
   if(typeof state!=='undefined'&&state.view==='career')window.render?.();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load();
  return{render,bind,status,toolGate:id=>{const tool=content?.tools?.find(x=>x.id===id);return tool?status().unlockedTool(tool):null},evaluate,load,get config(){return content}};
 })();
})();
