/* FinanzPilot v16: großräumige Skill-Landkarte; Karriere-Kern-IDs/levels() bleiben unverändert. */
'use strict';
window.FinanzPilotSkillWorld=(()=>{
 const legacy=window.FinanzPilotSkills;
 const KEY='finanzpilot_skillmap_v2', W=2540,H=1840;
 const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const TOPICS=[
 ['guv','GuV','Gewinn verstehen'],['margen','Margen','Ertragsqualität'],['bilanz','Bilanz','Vermögenslage'],['working','Working Capital','Liquidität'],['fcf','Free Cashflow','Cash Conversion'],
 ['roic','ROIC','Kapitaleffizienz'],['wacc','WACC','Kapitalkosten'],['enterprise','Equity Bridge','Unternehmenswert'],['multiples','Multiples','Peer-Vergleich'],['szenarien','Investmentthese','Bewertung']
 ];
 const ORIGINAL=[
  ['scout','Markt-Scout','Fundament',1250,85,'learn',[]],
  ['ledger','Bilanzspäher','Berichte',570,240,'training',['scout']],
  ['charts','Chart-Scout','Preisbewegungen',990,240,'learn',['scout']],
  ['risk','Risiko-Wächter','Risikokontrolle',1510,240,'learn',['scout']],
  ['rates','Zinsnavigator','Makro',1920,240,'learn',['charts']],
  ['cashflow','Cashflow-Sucher','Geldströme',360,420,'academy',['ledger']],
  ['quality','Gewinn-Prüfer','Erträge',690,420,'training',['ledger']],
  ['signals','Signalprüfer','Chartkritik',1070,420,'markets',['charts']],
  ['portfolio','Diversifizierer','Portfolio',1520,420,'learn',['risk']],
  ['catalysts','Thesejäger','Research',1920,420,'training',['signals','rates']],
  ['valuations','Renditeschmied','Bewertung',575,620,'academy',['cashflow','quality']],
  ['portfolio2','Risikoarchitekt','Kontrolle',1540,620,'learn',['portfolio']],
  ['master','Szenarioarchitekt','Meisterstück',1120,805,'academy',['valuations','catalysts','portfolio2']]
 ];
 const descriptions={scout:'Grundlagen der Kapitalmärkte',ledger:'Unternehmenszahlen kritisch lesen',charts:'Charts nicht nur nach Form beurteilen',risk:'Kapitalverluste und Unsicherheit',rates:'Zinsen, Makrotrends und Bewertungsfaktoren',cashflow:'Liquidität und Cashflow statt nur Gewinn',quality:'Gewinne bereinigen und vergleichen',signals:'Fehl- und Ausbruchssignale kritisch prüfen',portfolio:'Klumpenrisiken erkennen',catalysts:'Markterwartungen und Ereignisse bewerten',valuations:'Vollständige Unternehmensbewertung',portfolio2:'Portfolio und Risiko planen',master:'Ein konsistentes Szenariomodell erstellen'};
 const nodes=ORIGINAL.map(([id,name,sub,x,y,target,requires])=>({id,name,sub,x,y,target,requires,kind:'core'}));
 TOPICS.forEach(([id,name,sub],i)=>{
  const x=190+i*236;
  const prev=i?TOPICS[i-1][0]:null;
  nodes.push({id:'p-'+id+'-1',name:name+' · Entdecken',sub:'Zusammenhang verstehen',x,y:1060,target:'concepts',requires:i?['p-'+prev+'-3']:['scout'],kind:'concept',concept:id,level:1});
  nodes.push({id:'p-'+id+'-2',name:name+' · Anwenden',sub:'Rechnen & abwägen',x,y:1225,target:'concepts',requires:['p-'+id+'-1'],kind:'concept',concept:id,level:2});
  nodes.push({id:'p-'+id+'-3',name:name+' · Meistern',sub:'Prüfung bestehen',x,y:1390,target:'concepts',requires:['p-'+id+'-2'],kind:'concept',concept:id,level:3});
  nodes.push({id:'x-'+id,name:name+'-Experte',sub:'Meisterabzeichen',x,y:1580,target:'concepts',requires:['p-'+id+'-3',i<5?'ledger':'valuations'],kind:'bridge',concept:id,level:3});
 });
 const byId=Object.fromEntries(nodes.map(x=>[x.id,x]));
 const edges=nodes.flatMap(n=>n.requires.map(id=>[byId[id],n]).filter(x=>x[0]));
 const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{return {}}};
 let view={z:0.68,x:470,y:170,...read()},selection=null,gesture=null;
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const concepts=()=>{try{return JSON.parse(localStorage.getItem('finanzpilot_concepts_v1')||'{}')||{}}catch{return {}}};
 function fullLevels(){
  const base=legacy.levels(),p=concepts(),result={};
  nodes.forEach(n=>{
   let mastered=false;
   if(n.kind==='core')mastered=!!base[n.id]?.mastered;
   else{
    const s=p.sessions?.[n.concept],a=s?.answers||{},best=Number(s?.bestScore)||0;
    mastered=n.level===1?!!a[1]?.correct:n.level===2?!!a[1]?.correct&&!!a[2]?.correct:best>=3||!!p.completed?.[n.concept];
    if(n.kind==='bridge')mastered=mastered&&n.requires.slice(1).every(k=>!!base[k]?.mastered);
   }
   result[n.id]={mastered,available:false,requires:n.requires};
  });
  nodes.forEach(n=>{
   const q=result[n.id];
   q.available=!q.mastered&&n.requires.every(k=>result[k]?.mastered);
   q.missing=n.requires.filter(k=>!result[k]?.mastered).map(k=>byId[k]?.name||k);
  });
  return result;
 }
 const icon=n=>n.kind==='core'?'◈':n.kind==='bridge'?'✦':n.level===3?'◆':n.level===2?'⬡':'◇';
 function mini(status){
  const pw=210,ph=155,sx=pw/W,sy=ph/H;
  return '<svg class="fp-world-mini" viewBox="0 0 '+pw+' '+ph+'" aria-hidden="true">'+
   edges.map(([a,b])=>'<path d="M'+(a.x*sx).toFixed(2)+','+(a.y*sy).toFixed(2)+' L'+(b.x*sx).toFixed(2)+','+(b.y*sy).toFixed(2)+'" stroke="#597780" stroke-width=".6" opacity=".7"/>').join('')+
   nodes.map(n=>'<circle cx="'+(n.x*sx).toFixed(2)+'" cy="'+(n.y*sy).toFixed(2)+'" r="'+(n.kind==='core'?2.1:1.5)+'" fill="'+(status[n.id].mastered?'#7be9bc':status[n.id].available?'#e9c27f':'#597684')+'"/>').join('')+
   '<rect class="fp-world-mini-viewport" x="0" y="0" width="50" height="50" fill="#93eacb" fill-opacity=".13" stroke="#8bf2ca" stroke-width="1.5" rx="2"/></svg>';
 }
 function render(){
  const st=fullLevels(),done=nodes.filter(n=>st[n.id].mastered).length,core=ORIGINAL.filter(x=>st[x[0]].mastered).length;
  return '<div class="fp-skill-world"><div class="fp-world-hero"><div class="eyebrow">WISSENSWELT · 8 FÄHIGKEITSBEREICHE</div><h1>Deine Fähigkeiten wachsen mit.</h1><p>Eine große Lernkarte mit Kernskills, zehn aufeinander aufbauenden Fachwegen und Meisterabzeichen. Berühre Knoten für die Voraussetzungen; wische, zoome mit zwei Fingern oder nutze die Zoom-Tasten.</p><div class="fp-world-stats"><span><b>'+done+'/'+nodes.length+'</b> Fähigkeiten</span><span><b>'+core+'/13</b> bewährte Kernskills</span><span><b>'+nodes.filter(n=>st[n.id].available).length+'</b> nächste Schritte</span></div></div>'+
   '<div class="fp-world-toolbar"><div class="fp-world-legend"><span>● Meisterschaft</span><span>◌ Prüfbar</span><span>○ Später</span></div><div class="fp-world-zooms"><button type="button" data-world-zoom="-1" aria-label="Verkleinern">−</button><span data-world-scale>68 %</span><button type="button" data-world-zoom="1" aria-label="Vergrößern">+</button><button type="button" data-world-fit>Übersicht</button></div></div>'+
   '<div class="fp-world-viewport" id="fp-world-viewport" role="region" tabindex="0" aria-label="Zoom- und verschiebbare Skillkarte"><div class="fp-world-stage" id="fp-world-stage"><div class="fp-world-map" id="fp-world-map" style="width:'+W+'px;height:'+H+'px">'+
   '<svg class="fp-world-lines" viewBox="0 0 '+W+' '+H+'" aria-hidden="true">'+edges.map(([a,b])=>'<path class="'+(st[a.id].mastered?'lit':'')+'" d="M'+a.x+','+a.y+' C'+a.x+','+(a.y+90)+' '+b.x+','+(b.y-90)+' '+b.x+','+b.y+'"/>').join('')+'</svg>'+
   '<div class="fp-world-band" style="top:940px"><span>BEGRIFFS-AKADEMIE · ZEHN VERTIEFUNGEN</span></div>'+
   nodes.map(n=>{const status=st[n.id],cl=status.mastered?'mastered':status.available?'available':'locked';return '<button type="button" data-world-node="'+n.id+'" class="fp-world-node '+cl+' '+n.kind+'" style="left:'+n.x+'px;top:'+n.y+'px" aria-label="'+e(n.name)+' · '+(status.mastered?'beherrscht':status.available?'erreichbar':'Voraussetzungen fehlen')+'"><span class="fp-world-icon">'+icon(n)+'</span><strong>'+e(n.name)+'</strong><small>'+e(n.sub)+'</small><em>'+(status.mastered?'✓ Beherrscht':status.available?'✧ Bereit':'◇ Offen')+'</em></button>'}).join('')+'</div></div></div>'+
   '<div class="fp-world-map-footer"><div class="fp-world-map-minimap" data-world-mini aria-label="Miniaturkarte zur Orientierung">'+mini(st)+'</div><p>Ziehe die Karte oder tippe auf die Miniatur zur Navigation. Kernskills bleiben Grundlage deiner bisherigen Karriere – neue Vertiefungen ergänzen sie, ohne Ränge zurückzusetzen.</p></div>'+
   '<section id="fp-world-detail" class="fp-world-detail" aria-live="polite"><h2>Wähle eine Fähigkeit</h2><p>Nach dem Antippen siehst du den Lernweg, Status und die noch fehlenden Voraussetzungen.</p></section></div>';
 }
 function detail(id){
  const n=byId[id],box=document.getElementById('fp-world-detail');if(!n||!box)return;
  const st=fullLevels()[id],course=n.kind==='core'?descriptions[id]:n.concept.toUpperCase()+' – Stufe '+n.level;
  box.innerHTML='<div class="fp-world-detail-top"><div><div class="eyebrow">'+(n.kind==='core'?'KARIERRE-KERNSKILL':'WISSENSVERTIEFUNG')+'</div><h2>'+e(n.name)+'</h2></div><strong>'+icon(n)+'</strong></div><p>'+e(course)+'</p>'+
   '<p><b>Status:</b> '+(st.mastered?'✓ Bereits nachgewiesen':st.available?'Jetzt erlernbar':'Noch gesperrte Meisterprüfung')+'</p>'+
   (st.missing.length?'<p><b>Vorher nötig:</b> '+e(st.missing.join(' · '))+'</p>':'')+
   '<button class="btn" type="button" data-world-course="'+e(n.target)+'">Passenden Lernbereich öffnen →</button>';
 }
 function bind(root=document){
  const viewport=root.querySelector('#fp-world-viewport'),stage=root.querySelector('#fp-world-stage'),map=root.querySelector('#fp-world-map');
  if(!viewport||!stage||!map)return;
  let z=clamp(Number(view.z)||.68,.35,1.85);
  function save(){view={z,x:viewport.scrollLeft,y:viewport.scrollTop};try{localStorage.setItem(KEY,JSON.stringify(view))}catch{}}
  function miniUpdate(){
   const rect=root.querySelector('.fp-world-mini-viewport');if(!rect)return;
   rect.setAttribute('x',String(viewport.scrollLeft/(W*z)*210));
   rect.setAttribute('y',String(viewport.scrollTop/(H*z)*155));
   rect.setAttribute('width',String(Math.min(210,viewport.clientWidth/(W*z)*210)));
   rect.setAttribute('height',String(Math.min(155,viewport.clientHeight/(H*z)*155)));
  }
  function scale(n,px=viewport.clientWidth/2,py=viewport.clientHeight/2){
   const old=z;z=clamp(n,.35,1.85);
   const cx=(viewport.scrollLeft+px)/old,cy=(viewport.scrollTop+py)/old;
   stage.style.width=(W*z)+'px';stage.style.height=(H*z)+'px';map.style.transform='scale('+z+')';map.style.transformOrigin='0 0';
   viewport.scrollLeft=cx*z-px;viewport.scrollTop=cy*z-py;
   const l=root.querySelector('[data-world-scale]');if(l)l.textContent=Math.round(z*100)+' %';
   miniUpdate();save();
  }
  stage.style.width=(W*z)+'px';stage.style.height=(H*z)+'px';map.style.transform='scale('+z+')';map.style.transformOrigin='0 0';
  viewport.scrollLeft=Number(view.x)||0;viewport.scrollTop=Number(view.y)||0;scale(z,0,0);
  root.querySelectorAll('[data-world-zoom]').forEach(b=>b.addEventListener('click',()=>scale(z+(Number(b.dataset.worldZoom)>0?.18:-.18))));
  root.querySelector('[data-world-fit]')?.addEventListener('click',()=>{const desired=Math.min(viewport.clientWidth/W,viewport.clientHeight/H);scale(Math.max(.35,desired),0,0);viewport.scrollLeft=Math.max(0,(W*z-viewport.clientWidth)/2);viewport.scrollTop=0;miniUpdate();save()});
  root.querySelectorAll('[data-world-node]').forEach(b=>b.addEventListener('click',()=>{selection=b.dataset.worldNode;detail(selection)}));
  root.querySelector('[data-world-mini]')?.addEventListener('click',event=>{const svg=event.currentTarget.querySelector('svg');if(!svg)return;const box=svg.getBoundingClientRect(),x=(event.clientX-box.left)/box.width,y=(event.clientY-box.top)/box.height;
   viewport.scrollLeft=x*W*z-viewport.clientWidth/2;viewport.scrollTop=y*H*z-viewport.clientHeight/2;miniUpdate();save()});
  root.querySelector('#fp-world-detail')?.addEventListener('click',ev=>{const b=ev.target.closest('[data-world-course]');if(b)window.FinanzPilotNavigation?.route(b.dataset.worldCourse)});
  viewport.addEventListener('scroll',()=>{miniUpdate();save()},{passive:true});
  viewport.addEventListener('wheel',ev=>{if(!ev.ctrlKey&&!ev.metaKey)return;ev.preventDefault();const r=viewport.getBoundingClientRect();scale(z*(ev.deltaY>0?.92:1.08),ev.clientX-r.left,ev.clientY-r.top)},{passive:false});
  viewport.addEventListener('keydown',ev=>{if(ev.key==='+'||ev.key==='='){ev.preventDefault();scale(z+.15)}else if(ev.key==='-'){ev.preventDefault();scale(z-.15)}});
  const dist=t=>Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY);
  viewport.addEventListener('touchstart',ev=>{if(ev.touches.length===2)gesture={d:dist(ev.touches),z}}, {passive:true});
  viewport.addEventListener('touchmove',ev=>{if(!gesture||ev.touches.length!==2)return;ev.preventDefault();const rect=viewport.getBoundingClientRect();
   scale(gesture.z*dist(ev.touches)/gesture.d,(ev.touches[0].clientX+ev.touches[1].clientX)/2-rect.left,(ev.touches[0].clientY+ev.touches[1].clientY)/2-rect.top);
  },{passive:false});
  viewport.addEventListener('touchend',ev=>{if(ev.touches.length<2)gesture=null},{passive:true});
  if(selection)detail(selection);
  miniUpdate();
 }
 return{render,bind,fullLevels,get count(){return nodes.length},get nodes(){return nodes},get edges(){return edges}};
})();
const old=window.FinanzPilotSkills;
window.FinanzPilotSkills={...old,render:window.FinanzPilotSkillWorld.render,bind:window.FinanzPilotSkillWorld.bind,fullLevels:window.FinanzPilotSkillWorld.fullLevels};