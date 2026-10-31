/* FinanzPilot Skillbaum – erste stabile Ausbaustufe: vorhandenes Können auswerten, kein erfundenes XP.
 * Freischaltungen = Meister-Prüfungen; öffentliches Lernmaterial bleibt zugänglich.
 */
'use strict';
window.FinanzPilotSkills=(()=>{
 const NODES=[
  {id:'scout',title:'Markt-Scout',sub:'Der Einstieg',x:460,y:75,icon:'✦',parents:[],kind:'Grundlagen',target:'learn',need:'Erste ETF- oder Risikolektion abschließen',has:p=>p.base.etf||p.base.risk},
  {id:'ledger',title:'Bilanzspäher',sub:'Unternehmen verstehen',x:180,y:215,icon:'▤',parents:['scout'],kind:'Bilanz',target:'learn',need:'Lektion zu Quartalszahlen bestehen',has:p=>p.base.earnings},
  {id:'charts',title:'Chart-Scout',sub:'Kurse hinterfragen',x:460,y:215,icon:'⌁',parents:['scout'],kind:'Charts',target:'learn',need:'Fallstudie Ausbruch & Volumen bestehen',has:p=>p.lab.breakout},
  {id:'risk',title:'Risiko-Wächter',sub:'Risiken erkennen',x:740,y:215,icon:'◇',parents:['scout'],kind:'Risiko',target:'learn',need:'Risiko-Lektion bestehen',has:p=>p.base.risk},
  {id:'cashflow',title:'Cashflow-Sucher',sub:'Gewinn ≠ Kasse',x:120,y:375,icon:'◈',parents:['ledger'],kind:'Bilanz',target:'academy',need:'Microsoft-Finanzanalyse abschließen',has:p=>p.academy['microsoft-full-fy25']>=8},
  {id:'quality',title:'Gewinn-Prüfer',sub:'Zahlen normalisieren',x:305,y:375,icon:'◎',parents:['ledger'],kind:'Bilanz',target:'academy',need:'Alphabet-Quartalsanalyse abschließen',has:p=>p.academy['alphabet-q3-2026-cashflow-valuation']>=10},
  {id:'signals',title:'Signalprüfer',sub:'Fehlsignale erkennen',x:460,y:375,icon:'◉',parents:['charts'],kind:'Charts',target:'markets',need:'Chart-Fall und Marktinterpretation anwenden',has:p=>p.lab.breakout&&p.base.emotion},
  {id:'rates',title:'Zinsnavigator',sub:'Makro erforschen',x:630,y:375,icon:'⌘',parents:['charts'],kind:'Makro',target:'learn',need:'Leitzins-Lektion bestehen',has:p=>p.base.rates},
  {id:'portfolio',title:'Diversifizierer',sub:'Klumpenrisiken',x:795,y:375,icon:'⬡',parents:['risk'],kind:'Risiko',target:'learn',need:'Diversifikation-Lektion bestehen',has:p=>p.base.diversify},
  {id:'valuations',title:'Renditeschmied',sub:'Komplette Bewertung',x:215,y:550,icon:'✧',parents:['cashflow','quality'],kind:'Bewertung',target:'academy',need:'KION-Bewertung komplett bestehen',has:p=>p.academy['kion-deep-valuation-2026']>=22},
  {id:'catalysts',title:'Thesejäger',sub:'Erwartungen prüfen',x:535,y:550,icon:'✷',parents:['signals','rates'],kind:'Research',target:'research',need:'Bewertungs- und Quartalslektion abschließen',has:p=>p.base.valuation&&p.base.earnings},
  {id:'portfolio2',title:'Risikoarchitekt',sub:'Risiken steuern',x:795,y:550,icon:'♜',parents:['portfolio'],kind:'Risiko',target:'learn',need:'Risiko- und ETF-Lektion bestehen',has:p=>p.base.risk&&p.base.etf},
  {id:'master',title:'Szenarioarchitekt',sub:'Meisterprüfung',x:465,y:710,icon:'✺',parents:['valuations','catalysts','portfolio2'],kind:'Meisterschaft',target:'academy',need:'KION- und Alphabet-Kurse plus Risiko-Nachweise',has:p=>p.academy['kion-deep-valuation-2026']>=22&&p.academy['alphabet-q3-2026-cashflow-valuation']>=10&&p.base.risk}
 ];
 const byId=Object.fromEntries(NODES.map(n=>[n.id,n]));
 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const local=k=>{try{return JSON.parse(localStorage.getItem(k)||'{}')||{}}catch{return {}}};
 function evidence(){
  const a=local('finanzpilot_v1'),l=local('finanzpilot_lab_v3'),k=local('finanzpilot_academy_v4');
  return {base:a.completed||{},lab:l.completed||{},academy:k.completed||{}};
 }
 function levels(){
  const p=evidence(),learned=Object.fromEntries(NODES.map(n=>[n.id,Boolean(n.has(p))]));
  return Object.fromEntries(NODES.map(n=>[n.id,{
    mastered:learned[n.id],
    available:!learned[n.id]&&n.parents.every(parent=>learned[parent]),
    prerequisites:n.parents.filter(parent=>!learned[parent]).map(parent=>byId[parent].title)
  }]));
 }
 const edges=NODES.flatMap(n=>n.parents.map(parent=>[byId[parent],n]));
 const CENTER=76;
 const rankNames=['Kursfunke','Bilanzspäher','Renditeschmied','Thesejäger','Risikoarchitekt','Szenarioarchitekt','Kapitalnavigator'];
 function rank(count){return rankNames[Math.min(rankNames.length-1,Math.floor(count/2))]}
 function render(){
  const status=levels(),completed=NODES.filter(n=>status[n.id].mastered).length,ready=NODES.filter(n=>status[n.id].available).length;
  return '<div class="fp-skills-screen">'+
   '<div class="fp-skill-intro"><div class="eyebrow">DEIN WISSENSNETZ</div><h1>Wissen eröffnet Wege.</h1><p>Ein echter verzweigter Skillbaum: Du kannst jeden Knoten erkunden. Abschlüsse öffnen neue Meister-Herausforderungen; die Kurse selbst bleiben frei erreichbar.</p>'+
   '<div class="fp-skill-totals"><span><b>'+completed+' / '+NODES.length+'</b> beherrscht</span><span><b>'+ready+'</b> neue Prüfungen</span><span><b>'+escape(rank(completed))+'</b> aktueller Wissensrang</span></div></div>'+
   '<div class="fp-skill-legend"><span><i class="mastered"></i> Beherrscht</span><span><i class="available"></i> Erreichbar</span><span><i class="locked"></i> Voraussetzung fehlt</span></div>'+
   '<div class="fp-skill-scroll" id="fp-skill-scroll" role="region" aria-label="Interaktiver Skillbaum, horizontal verschiebbar" tabindex="0">'+
   '<div class="fp-skill-map" style="width:920px;height:815px">'+
   '<svg viewBox="0 0 920 815" aria-hidden="true" preserveAspectRatio="xMidYMid meet">'+
    edges.map(([a,b])=>'<path class="fp-skill-edge'+(status[a.id].mastered?' lit':'')+'" d="M'+a.x+','+(a.y+35)+' C'+a.x+','+(a.y+95)+' '+b.x+','+(b.y-95)+' '+b.x+','+(b.y-39)+'"/>').join('')+
   '</svg>'+
   NODES.map(n=>{const s=status[n.id],cl=s.mastered?'mastered':s.available?'available':'locked';
    return '<button type="button" class="fp-skill-node '+cl+'" data-skill-node="'+n.id+'" style="left:'+n.x+'px;top:'+n.y+'px" aria-label="'+escape(n.title)+': '+(s.mastered?'beherrscht':s.available?'erreichbar':'gesperrt')+'"><span class="fp-skill-emblem">'+n.icon+'</span><b>'+escape(n.title)+'</b><small>'+escape(n.sub)+'</small><span class="fp-node-state">'+(s.mastered?'✓ Beherrscht':s.available?'✦ Prüfbar':'🔒 Gesperrt')+'</span></button>';
   }).join('')+'</div></div>'+
   '<section id="fp-skill-details" class="fp-skill-details" aria-live="polite"><div class="fp-skill-detail-default"><h2>Wähle einen Knoten</h2><p>Berühre einen Skill auf der Karte, um seine Voraussetzungen, Ziele und den passenden Kurs zu sehen.</p></div></section>'+
   '<div class="fp-skill-hint"><b>Als Nächstes geplant:</b> Spezialkurse, persönliche Relikte, freischaltbare Research-Werkzeuge und eine Analystenkarriere. Diese Belohnungen werden erst mit der späteren sicheren Spielwirtschaft aktiviert.</div></div>';
 }
 function details(id){
  const n=byId[id],area=document.getElementById('fp-skill-details');if(!n||!area)return;
  const s=levels()[id],state=s.mastered?'Bereits gemeistert':s.available?'Jetzt prüfbar':'Noch gesperrte Meisterschaft';
  area.innerHTML='<div class="fp-skill-detail-top"><div><div class="eyebrow">'+escape(n.kind)+'</div><h2>'+escape(n.title)+'</h2><small>'+escape(state)+'</small></div><span class="fp-skill-detail-icon">'+n.icon+'</span></div>'+
   '<p><b>Dein Ziel:</b> '+escape(n.need)+'</p>'+
   (s.prerequisites.length?'<p><b>Fehlende Voraussetzung:</b> '+escape(s.prerequisites.join(', '))+'</p>':'')+
   '<div class="fp-skill-detail-actions"><button type="button" class="btn" data-skill-learn="'+escape(n.target)+'">Passende Inhalte öffnen →</button><button type="button" class="settings-btn" data-skill-close>Schließen</button></div>';
  area.scrollIntoView({block:'nearest',behavior:'smooth'});
 }
 function bind(root=document){
  root.querySelectorAll('[data-skill-node]').forEach(b=>b.addEventListener('click',()=>details(b.dataset.skillNode)));
  root.querySelectorAll('[data-skill-learn]').forEach(b=>b.addEventListener('click',()=>window.FinanzPilotNavigation?.route(b.dataset.skillLearn)));
  root.querySelectorAll('[data-skill-close]').forEach(b=>b.addEventListener('click',()=>{const a=document.getElementById('fp-skill-details');if(a)a.innerHTML='<h2>Wähle einen Knoten</h2><p>Öffne einen beliebigen Skill, um seine Anforderungen zu sehen.</p>'}));
  const scroll=root.querySelector('#fp-skill-scroll');if(scroll){try{scroll.scrollLeft=Number(sessionStorage.getItem('fp-skill-scroll-x')||0)}catch{}scroll.addEventListener('scroll',()=>{try{sessionStorage.setItem('fp-skill-scroll-x',String(scroll.scrollLeft))}catch{}},{passive:true})}
 }
 return {render,bind,evidence,levels};
})();