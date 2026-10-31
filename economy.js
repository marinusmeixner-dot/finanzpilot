(function makeEconomy(){
'use strict';
window.FinanzPilotEconomy=(()=>{
 const modules=[
  {id:'kion-nachfrage',symbol:'◈',name:'Industrie-Funke',lesson:'KION · Gewinn und Auftragseingang',kind:'Konzernanalyse',tool:'Auftragsqualität prüfen',path:'Industrie-Expedition'},
  {id:'aixtron-auftraege',symbol:'✧',name:'Silizium-Linse',lesson:'AIXTRON · KI und Bestellungen',kind:'Halbleiter',tool:'Anlagenzyklus-Lupe',path:'Halbleiter-Expedition'},
  {id:'alphabet-cloud',symbol:'⌘',name:'Cloud-Kompass',lesson:'Alphabet · Cloud und Wachstum',kind:'Technologie',tool:'Segmentkompass',path:'Cloud-Expedition'}
 ];
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const euro=cents=>(Number(cents||0)/100).toLocaleString('de-DE',{style:'currency',currency:'EUR'});
 const fmt=n=>Number(n).toLocaleString('de-DE',{maximumFractionDigits:2});
 const api=()=>window.FinanzPilotCloud;
 let account=null,claims=[],perks=[],ledger=[],verified=[],loading=false,error='',notice='',pending=null;
 const has=key=>perks.some(x=>x.perk_key===key);
 const logged=()=>!!api()?.user;
 const module=id=>modules.find(x=>x.id===id);
 const saved=()=>{try{return JSON.parse(localStorage.getItem('finanzpilot_training_v1')||'{}')}catch{return {}}};
 const expedition=()=>{try{return JSON.parse(localStorage.getItem('finanzpilot_expedition_v1')||'{}')||{}}catch{return {}}};
 function saveExpedition(id,index){
  const p=expedition(),completed=p.completed||{};completed[id+':'+index]=true;
  try{localStorage.setItem('finanzpilot_expedition_v1',JSON.stringify({...p,completed}));window.dispatchEvent(new Event('fp-progress-change'))}catch{}
 }
 async function refresh(redraw=true){
  if(!logged()){account=null;claims=[];perks=[];ledger=[];verified=[];loading=false;if(redraw&&typeof state!=='undefined'&&state.view==='inventory')window.render?.();return}
  loading=true;
  try{
   const rows=await Promise.all(['fp_economy_accounts','fp_reward_claims','fp_reward_perks','fp_reward_ledger','fp_verified_training'].map(t=>api().economyRead(t)));
   account=rows[0][0]||{research_points:0,virtual_euro_cents:0};claims=rows[1];perks=rows[2];ledger=rows[3];verified=rows[4];error='';updateTheme();
  }catch(e){error='Dein Inventar konnte nicht geladen werden: '+(e.message||e);account=null}
  finally{loading=false;if(redraw&&typeof state!=='undefined'&&state.view==='inventory')window.render?.()}
 }
 function stateOf(id){return claims.find(x=>x.module_id===id)||null}
 function itemList(){
  return `<section class="fp-inventory-section"><div class="fp-inventory-heading"><h2>Deine Forschungsartefakte</h2><p>Jedes Artefakt wird nur einmal vergeben. Nach einer Einlösung wird es verbraucht – deine erworbenen Rechte bleiben erhalten.</p></div><div class="fp-inventory-rows">`+
  modules.map(m=>{
   const cl=stateOf(m.id),count=verified.filter(x=>x.module_id===m.id).length;
   const headline=cl?(cl.choice?'Eingelöst: '+({tool:'Werkzeug',path:'Spezialkurs',cash:'150 € virtuelles Kapital'}[cl.choice]||cl.choice):'Einmalige Auswahl verfügbar'):`${count}/4 Antworten bestätigt`;
   return `<article class="fp-inventory-item ${cl&&!cl.choice?'fp-inventory-owned':''}"><span class="fp-inventory-symbol">${esc(m.symbol)}</span><div class="fp-inventory-item-body"><div class="fp-inventory-item-top"><b>${esc(m.name)}</b><small>${esc(m.kind)}</small></div><p>${esc(m.lesson)}</p><span class="fp-inventory-status">${esc(headline)}</span>${cl&&!cl.choice?`<button type="button" class="btn fp-inventory-choose" data-inventory-choose="${esc(m.id)}">Verwendung auswählen →</button>`:cl&&cl.choice?`<small class="fp-inventory-consumed">Deine Entscheidung wurde dauerhaft gespeichert.</small>`:`<button type="button" class="fp-inventory-study" data-view="training">Training öffnen →</button>`}</div></article>`;
  }).join('')+'</div></section>';
 }
 function choiceSection(){
  if(!pending)return '';
  const m=module(pending.id);if(!m)return '';
  const opts=[
   ['tool','Research-Werkzeug',m.tool,'Schaltet einen zusätzlichen interaktiven Finanzrechner für diese Unternehmensanalyse frei.'],
   ['path','Spezial-Expedition',m.path,'Schaltet einen eigenständigen dreiteiligen Forschungspfad frei.'],
   ['cash','Virtuelle Euro','150,00 €','Schreibt 150,00 € deinem virtuellen Depotkonto gut. Noch kein Aktienhandel.']
  ];
  return `<section class="fp-inventory-decision" id="fp-inventory-decision"><div class="eyebrow">ENTSCHEIDUNG · ${esc(m.name)}</div><h2>Wofür setzt du dein Artefakt ein?</h2><p>Du kannst genau eine Möglichkeit wählen. Andere Möglichkeiten mit diesem Gegenstand gehen dauerhaft verloren.</p><div class="fp-inventory-choices">${opts.map(([id,label,title,detail])=>`<button type="button" class="fp-inventory-choice ${pending.choice===id?'active':''}" data-inventory-select="${id}"><span class="fp-inventory-choice-mark">${pending.choice===id?'◉':'○'}</span><span><b>${esc(label)}</b><strong>${esc(title)}</strong><small>${esc(detail)}</small></span></button>`).join('')}</div><div class="fp-inventory-confirm"><button type="button" class="btn" data-inventory-confirm ${pending.choice?'':'disabled'}>Gegenstand endgültig einlösen</button><button type="button" class="settings-btn" data-inventory-cancel>Abbrechen</button></div><small>Diese Entscheidung ist nicht rückgängig zu machen. Sie kann bei schlechtem Internet nur einmal vom Server bestätigt werden.</small></section>`;
 }
 function ownedContent(){
  const special=perks.filter(x=>x.perk_key.startsWith('tool:')||x.perk_key.startsWith('path:'));
  if(!special.length)return '';
  return `<section class="fp-inventory-section"><div class="fp-inventory-heading"><h2>Freigeschaltete Extras</h2><p>Durch deine eigenen Entscheidungen dauerhaft verfügbar.</p></div><div class="fp-inventory-extras">`+special.map(x=>{
   const [type,id]=x.perk_key.split(':'),m=module(id);
   if(!m)return '';
   return `<button type="button" class="fp-inventory-extra" data-inventory-extra="${esc(x.perk_key)}"><span>${type==='tool'?'◈':'✦'}</span><div><b>${esc(type==='tool'?m.tool:m.path)}</b><small>${esc(m.lesson)}</small></div><span>›</span></button>`;
  }).join('')+'</div></section>';
 }
 const specialQuestions={
 'kion-nachfrage':[{title:'Absatz und Erwartungen',text:'KION meldet höhere operative Gewinne und gleichzeitig weniger neue Bestellungen. Welche Größe kann ein Frühindikator kommender Auslastung sein?',answers:['Vergangenes EBIT alleine','Auftragseingang und Segment-Backlog','Nur der Aktienkurs'],correct:1,why:'Auftragseingang und Backlog zeigen, wie viel zusätzliche Arbeit ein Unternehmen voraussichtlich abarbeiten kann. Noch keine sichere Umsatzprognose.'},{title:'Gewinnqualität',text:'Die Nettofinanzschulden steigen. Welche Analyse ist am besten?',answers:['FCF und Finanzierung sowie Leasingzusammenhänge prüfen','Besseres EBIT beweist ausreichende Liquidität','Schulden spielen bei EV-to-Equity keine Rolle'],correct:0,why:'FCF, finanzielle Verpflichtungen und Leasingfinanzierung beeinflussen die Belastbarkeit eines Unternehmenswerts.'},{title:'Bewertungsentscheidung',text:'Was gehört vor ein Kursziel nach einer Gewinnwarnung?',answers:['Sofortige technische Kursprognose','Drei geprüfte Szenarien mit neuem Cashflow und Kapitalbedarf','Kursziel unverändert lassen'],correct:1,why:'Aktualisierte Cashflows und Szenarien sind erforderlich. Ein historisches Hoch ist kein fairer Wert.'}],
 'aixtron-auftraege':[{title:'Auftragszyklus',text:'AIXTRON meldet wesentlich mehr Bestellungen als im Vorjahr. Was bleibt zunächst ungeklärt?',answers:['Zeitpunkt und Marge der späteren Umsätze','Ob Bestellungen überhaupt existieren','Ob die Auftragszahl größer als 0 ist'],correct:0,why:'Erst Auslieferung, Abnahme, Marge und Zahlung entscheiden über den tatsächlichen Geschäftswert.'},{title:'Operative Unsicherheit',text:'Welches Risiko verändert eine DCF-Prognose besonders?',answers:['Kursfarbe im Chart','Verschobene Maschinenabnahmen und schlechtere Marge','Anzahl der Artikel über das Unternehmen'],correct:1,why:'Kapitalbindung und Auslieferungszeit beeinflussen Cashflow und die Werthaltigkeit der Aufträge.'},{title:'Bull-These prüfen',text:'Welche Gegenprobe ist am sinnvollsten?',answers:['Nur das beste Szenario gewichten','Auftragsbestand, Vertragsbedingungen und Kundenmix prüfen','Nach positiven Schlagzeilen investieren'],correct:1,why:'Ein Auftragsanstieg ist relevant, muss aber hinsichtlich Qualität, Kunden und Preisdruck geprüft werden.'}],
 'alphabet-cloud':[{title:'Relative und absolute Größe',text:'Cloud wächst sehr schnell, ist aber nur Teil des Konzerns. Welche Zahl brauchst du?',answers:['Konkreter Segmentumsatz gegenüber Gesamterlösen','Nur die Wachstums-Prozentzahl','Aktuelle Anzahl der Suchanfragen'],correct:0,why:'Ein starkes Wachstum eines kleineren Segments kann den Konzernwert anders beeinflussen als gleiches Wachstum eines größeren Segments.'},{title:'Investitionen',text:'Cloud-Kapazität erfordert Rechenzentren. Welche weitere Größe ist entscheidend?',answers:['Nur Umsatzwachstum','CapEx und spätere Cashflows','Ein Twitter-Trend'],correct:1,why:'Rechenzentren binden Kapital. Der ökonomische Ertrag entsteht erst, wenn Cashflows langfristig den Kapitaleinsatz tragen.'},{title:'Aktienbewertung',text:'Ein zweistelliges Umsatzwachstum bedeutet…',answers:['Keine automatische Unterbewertung; Markterwartungen prüfen','Immer einen steigenden Aktienkurs','Einen sicheren Zielkurs'],correct:0,why:'Der Marktkurs kann hohe Erwartungen bereits berücksichtigen. Entscheidend ist die Differenz aus Erwartungen und realisiertem Geschäft.'}]
 };
 function specialPanel(){
  if(!pending?.special)return '';
  const [type,id]=pending.special.split(':'),m=module(id);if(!m)return '';
  if(type==='path'){
   const qs=specialQuestions[id]||[],solved=expedition().completed||{};
   return `<section class="fp-inventory-special" id="fp-inventory-special"><button class="fp-inventory-back" data-inventory-back>← Inventar</button><div class="eyebrow">SPEZIAL-EXPEDITION · ${esc(m.kind)}</div><h2>${esc(m.path)}</h2><p>Diese drei Prüfstationen hast du mit einem besonderen Artefakt freigeschaltet. Dein Fortschritt wird mit dem Lernstand gespeichert.</p><p class="fp-inventory-expedition-progress">${qs.filter((q,i)=>solved[id+':'+i]).length} / ${qs.length} Stationen gemeistert</p>${qs.map((q,i)=>`<details class="fp-inventory-expedition-step"><summary>${i+1}. ${esc(q.title)} ${solved[id+':'+i]?'✓':''}</summary><p>${esc(q.text)}</p><div>${q.answers.map((a,j)=>`<button type="button" data-expedition-answer="${esc(id)}:${i}:${j}">${esc(a)}</button>`).join('')}</div><p id="fp-expedition-feedback-${i}" class="fp-expedition-feedback" aria-live="polite"></p></details>`).join('')}</section>`;
  }
  return `<section class="fp-inventory-special" id="fp-inventory-special"><button class="fp-inventory-back" data-inventory-back>← Inventar</button><div class="eyebrow">SPEZIALWERKZEUG · ${esc(m.kind)}</div><h2>${esc(m.tool)}</h2><p>Berechne Kennzahlen mit eigenen Unternehmenswerten. Vorgegebene Werte sind nur Lernbeispiele und keine aktuellen Börsenkurse.</p><form id="fp-econ-tool-form"><label>Wert A<input type="text" inputmode="text" name="a" value="${id==='alphabet-cloud'?'30,7':id==='kion-nachfrage'?'8445':'274,9'}" required /></label><label>Wert B<input type="text" inputmode="text" name="b" value="${id==='alphabet-cloud'?'127,6':id==='kion-nachfrage'?'8522':'183,6'}" required /></label><button type="submit" class="btn">Verhältnis berechnen</button></form><div id="fp-econ-tool-result" aria-live="polite"></div><small>${id==='alphabet-cloud'?'A = Cloud-Umsatz, B = Konzernumsatz':id==='kion-nachfrage'?'A = Aufträge, B = Konzernumsatz':'A = Auftragseingang, B = Umsatz'} – für denselben Zeitraum.</small></section>`;
 }
 function shop(){
  const items=[['theme:mint','Analyse-Design „Mint“',150],['theme:gold','Analyse-Design „Gold“',200]];
  return `<section class="fp-inventory-section"><div class="fp-inventory-heading"><h2>Forschungspunkt-Werkstatt</h2><p>Rüste deinen Analystenbereich dauerhaft mit einem erspielten Farbstil aus. Kein Echtgeldkauf.</p></div><div class="fp-inventory-shop">${items.map(([key,label,price])=>`<div class="fp-inventory-shop-item"><div><b>${esc(label)}</b><small>${price} Forschungspunkte · dauerhaft</small></div>${has(key)?'<span>✓ Freigeschaltet</span>':`<button type="button" class="btn secondary" data-inventory-buy="${esc(key)}" ${!account||Number(account.research_points)<price?'disabled':''}>Freischalten</button>`}</div>`).join('')}</div></section>`;
 }
 function render(){
  if(!logged())return `<div class="fp-inventory-page"><div class="fp-inventory-hero"><div class="eyebrow">DEINE SPIELWIRTSCHAFT</div><h1>Inventar & Belohnungen</h1><p>Deine bisherigen Kurse bleiben ohne Konto verfügbar. Um seltene Gegenstände, Forschungspunkte und virtuelles Kapital geräteübergreifend sicher zu speichern, melde dich bei FinanzPilot an.</p><button type="button" class="btn" data-inventory-login>Mit Google oder E-Mail anmelden →</button></div></div>`;
  if(loading&&!account)return '<div class="fp-inventory-page"><h1>Inventar & Belohnungen</h1><p>Dein privates Inventar wird geladen …</p></div>';
  if(!account)return `<div class="fp-inventory-page"><h1>Inventar & Belohnungen</h1><p>${esc(error||'Deine Daten werden gerade geprüft.')}</p><button class="btn" data-inventory-reload>Erneut versuchen</button></div>`;
  return `<div class="fp-inventory-page"><div class="fp-inventory-hero"><div class="eyebrow">FINANZPILOT · VERIFIZIERTE SPIELBELOHNUNGEN</div><h1>Dein Forschungsinventar</h1><p>Jede Belohnung wird nur einmal vergeben. Alle Entscheidungen werden im privaten Konto gespeichert.</p><div class="fp-inventory-balances"><div><span>Forschungspunkte</span><b>${fmt(account.research_points||0)} FP</b></div><div><span>Depotguthaben · virtuell</span><b>${euro(account.virtual_euro_cents||0)}</b></div></div><small>Das Depotkapital ist nicht auszahlbar. Aktienhandel wird erst in einer späteren Etappe freigeschaltet.</small></div>${notice?`<div class="fp-inventory-notice" role="status">${esc(notice)}</div>`:''}${choiceSection()}${pending?.special?specialPanel():''}${itemList()}${ownedContent()}${shop()}<section class="fp-inventory-history"><details><summary>Belohnungsbuchungen anzeigen</summary><div>${ledger.slice().sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at))).slice(0,30).map(x=>`<div><span>${esc(x.event_type==='module_mastery'?'Kursabschluss':x.event_type==='item_redemption'?'Item eingelöst':'Freischaltung gekauft')}</span><small>${esc(String(x.created_at).slice(0,10))}</small><b>${x.points_delta?`${x.points_delta>0?'+':''}${x.points_delta} FP`:x.euro_cents_delta?'+'+euro(x.euro_cents_delta):'✓'}</b></div>`).join('')||'<p>Noch keine Buchungen</p>'}</div></details></section></div>`;
 }
 async function verify(id,index,raw,type){
  if(!logged())return {skipped:true};
  const m=module(id);if(!m||index<1||index>4)return {skipped:true};
  let answer=raw;
  if(type==='decision'&&Array.isArray(raw))answer=raw[0];
  if(type==='number'){
    try{answer=window.FinanzPilotMath?.calculate?window.FinanzPilotMath.calculate(String(raw)):Number(String(raw).replace(',','.'))}catch{return {error:'Rechnung nicht auswertbar'}}
  }
  if(type==='multi'&&Array.isArray(answer))answer=[...answer].sort((a,b)=>a-b);
  if(!['number','multi','sequence','decision'].includes(type))return {skipped:true};
  try{
   const out=await api().economyRpc('fp_submit_training_answer',{p_module:id,p_step:index,p_answer:answer});
   if(out.newReward){notice='Neue Belohnung verdient: +100 Forschungspunkte und ein neues Forschungsartefakt!';await refresh(false)}
   return out;
  }catch(e){notice='Serverprüfung nicht möglich: '+(e.message||'Netzwerkfehler');return {error:notice}}
 }
 async function certifySaved(id){
  const savedData=saved(),answers=savedData.sessions?.[id]?.answers||{};
  let verifiedCount=0,skipped=0,errors=0,awarded=false;
  const types=['number','multi','sequence','decision'];
  for(let i=1;i<=4;i++){
   const a=answers[i];if(!a?.correct){skipped++;continue}
   const r=await verify(id,i,a.value,types[i-1]);
   if(r?.correct){verifiedCount++;if(r.newReward)awarded=true}else errors++;
  }
  await refresh(false);
  verifiedCount=verified.filter(x=>x.module_id===id).length;
  if(!errors){notice=awarded?'Neues Forschungsartefakt und 100 Forschungspunkte freigeschaltet!':verifiedCount===4?'Dein Training ist serverseitig bestätigt. Das Artefakt lässt sich im Inventar einlösen.':'Du hast '+verifiedCount+'/4 geprüfte Antworten. Schließe die restlichen Aufgaben ab.'}
  if(typeof state!=='undefined'&&state.view==='inventory')window.render?.();
  return {verifiedCount,skipped,errors,awarded};
 }
 async function redeem(){
  if(!pending?.id||!pending.choice)return;
  const {id,choice}=pending,m=module(id);
  if(!m||!stateOf(id)||stateOf(id)?.choice){notice='Dieser Gegenstand ist nicht mehr verfügbar.';pending=null;window.render?.();return}
  const question=choice==='cash'?`Du vernichtest „${m.name}“ und erhältst einmalig 150,00 € virtuelles Depotguthaben.`:choice==='tool'?`Du vernichtest „${m.name}“ und schaltest dauerhaft „${m.tool}“ frei.`:`Du vernichtest „${m.name}“ und schaltest dauerhaft „${m.path}“ frei.`;
  if(!confirm(question+'\n\nDiese Wahl kann nicht rückgängig gemacht werden. Wirklich einlösen?'))return;
  const current=pending;pending=null;notice='Einlösung wird überprüft …';window.render?.();
  try{
   await api().economyRpc('fp_redeem_artifact',{p_module:current.id,p_choice:current.choice});
   notice='Einlösung erfolgreich: '+(current.choice==='cash'?'150,00 € virtuell gutgeschrieben':current.choice==='tool'?m.tool+' dauerhaft verfügbar':m.path+' dauerhaft verfügbar');
  }catch(e){notice='Einlösung fehlgeschlagen: '+(e.message||e)}
  await refresh();
 }
 async function buy(key){
  if(!logged())return;
  const name=key==='theme:mint'?'Mint':'Gold';
  const cost=key==='theme:mint'?150:200;
  if(!['theme:mint','theme:gold'].includes(key))return;
  if(!confirm(`Analysedesign „${name}“ für ${cost} Forschungspunkte dauerhaft freischalten?`))return;
  try{await api().economyRpc('fp_purchase_reward',{p_perk:key});notice='Analysedesign freigeschaltet.'}
  catch(e){notice='Kauf fehlgeschlagen: '+(e.message||e)}
  await refresh();
 }
 function updateTheme(){
  document.body.classList.toggle('fp-econ-mint',has('theme:mint')&&!has('theme:gold'));
  document.body.classList.toggle('fp-econ-gold',has('theme:gold'));
 }
 function bind(root=document){
  root.querySelectorAll('[data-inventory-login]').forEach(b=>b.addEventListener('click',()=>api()?.openLogin?.()));
  root.querySelectorAll('[data-inventory-reload]').forEach(b=>b.addEventListener('click',()=>refresh()));
  root.querySelectorAll('[data-inventory-choose]').forEach(b=>b.addEventListener('click',()=>{pending={id:b.dataset.inventoryChoose,choice:null};window.render?.();document.querySelector('#fp-inventory-decision')?.scrollIntoView({behavior:'smooth',block:'start'})}));
  root.querySelectorAll('[data-inventory-select]').forEach(b=>b.addEventListener('click',()=>{if(pending){pending.choice=b.dataset.inventorySelect;window.render?.();document.querySelector('#fp-inventory-decision')?.scrollIntoView({block:'nearest'})}}));
  root.querySelector('[data-inventory-cancel]')?.addEventListener('click',()=>{pending=null;window.render?.()});
  root.querySelector('[data-inventory-confirm]')?.addEventListener('click',redeem);
  root.querySelectorAll('[data-inventory-buy]').forEach(b=>b.addEventListener('click',()=>buy(b.dataset.inventoryBuy)));
  root.querySelectorAll('[data-inventory-extra]').forEach(b=>b.addEventListener('click',()=>{pending={special:b.dataset.inventoryExtra};window.render?.();document.querySelector('#fp-inventory-special')?.scrollIntoView({behavior:'smooth',block:'start'})}));
  root.querySelector('[data-inventory-back]')?.addEventListener('click',()=>{pending=null;window.render?.()});
  root.querySelectorAll('[data-expedition-answer]').forEach(b=>b.addEventListener('click',()=>{
   const [id,i,j]=b.dataset.expeditionAnswer.split(':');const q=specialQuestions[id]?.[Number(i)];const out=document.getElementById('fp-expedition-feedback-'+i);if(!q||!out)return;
   if(q.correct===Number(j))saveExpedition(id,i);
   out.textContent=(q.correct===Number(j)?'✓ Richtig und gespeichert. ':'Noch nicht. ')+q.why;
  }));
  root.querySelector('#fp-econ-tool-form')?.addEventListener('submit',ev=>{
   ev.preventDefault();const data=Object.fromEntries(new FormData(ev.currentTarget).entries());
   const a=Number(String(data.a).replace(',','.')),b=Number(String(data.b).replace(',','.'));
   const out=document.getElementById('fp-econ-tool-result');
   if(!out)return;
   if(!Number.isFinite(a)||!Number.isFinite(b)||a<0||b<=0){out.textContent='Bitte zwei gültige Werte eingeben (Wert B größer als null).';return}
   out.innerHTML=`<div class="fp-inventory-tool-number"><b>${fmt(a/b*100)} %</b><small>Wert A / Wert B × 100 · Für einen sinnvollen Vergleich müssen die Werte aus demselben Zeitraum stammen.</small></div>`;
  });
 }
 async function init(){
  if(logged())await refresh(false);
  window.addEventListener('fp-auth-change',async()=>{notice='';pending=null;await refresh();updateTheme()});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&logged())refresh(false)});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
 return{render,bind,refresh,verify,certifySaved,get account(){return account},get claims(){return claims},get perks(){return perks}};
})();
})();
