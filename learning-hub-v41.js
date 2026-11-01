/* FinanzPilot v41: four cohesive Lernen areas and real specialization purchases.
 * The legacy career/artifact inventory is preserved separately until verified migration.
 */
(function(){
'use strict';
const URI='./data/specializations-v41.json';
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nav=()=>window.FinanzPilotNavigation;
const client=()=>window.FinanzPilotCloud?.paperClient;
const user=()=>window.FinanzPilotCloud?.user;
const routes=[['basics','Grundlagen'],['skilltree','Skillbaum'],['skilllessons','Skill-Lektionen'],['speciallessons','Speziallektionen']];
let catalog=null,problem='',busy=false,loadedFor=null,fetching=false,notice='',selectedSkill='',selectedLesson='',selectedSpecial='';
let enrollments=[],lessons=[],profiles=[],promotions=[],accounts=[],claims=[];
const redraw=()=>window.render?.();
const currentSkill=()=>catalog?.skills?.find(s=>s.id===selectedSkill);
const bySkill=id=>catalog?.skills?.find(s=>s.id===id);
const skillLessons=id=>catalog?.skills?.find(x=>x.id===id)?.lessons||[];
const mastered=id=>{const ls=skillLessons(id);return !!ls.length&&ls.every(x=>lessons.some(r=>r.lesson_id===x.id&&r.completed_at))};
const enrolled=id=>enrollments.some(e=>e.skill_id===id);
const unlocked=id=>lessons.some(l=>l.lesson_id===id);
const completed=id=>lessons.some(l=>l.lesson_id===id&&l.completed_at);
const purchaseReady=s=>!s.parent||mastered(s.parent);
const lessonAvailable=(s,l)=>enrolled(s.id)&&(l.sequence===1||completed(s.lessons[l.sequence-2].id));
const points=()=>Number(accounts[0]?.research_points)||0;
const earnedXp=()=>Number(profiles[0]?.xp)||0;
const promotionsEarned=()=>Number(profiles[0]?.promotion_count)||0;
const titleOf=id=>bySkill(id)?.title||id;
const MAP_W=2060,MAP_H=1875,MAP_CX=1000,MAP_NODE_W=300;
const mapX=[190,640,1090,1540],mapY=[295,605,915,1260,1575];
const nodePos=s=>{const x=mapX[catalog.branches.findIndex(b=>b.id===s.branch)],y=mapY[Math.min(4,s.tier-1)];if(s.tier!==4)return {x,y,w:MAP_NODE_W};const siblings=catalog.skills.filter(q=>q.branch===s.branch&&q.tier===4),i=siblings.findIndex(q=>q.id===s.id);return {x:x+[-145,0,145][Math.min(2,Math.max(0,i))],y,w:136};};
let selectedMap='',mapZoom=.74,mapLeft=420,mapTop=0;
function shell(active,content){
 return '<div class="fp42-learn-sub">'+
 (notice?'<div class="fp41-notice" role="status">'+escape(notice)+'</div>':'')+content+'</div>';
}
function home(){
 const items=[
  ['basics','Grundlagen','18 kurze Einstiegsmodule in sechs übersichtlichen Etappen. Lerne zuerst die wichtigsten Zusammenhänge.','book-open','01'],
  ['skilltree','Skillbaum','Ein echter verzweigter Kompetenzbaum. Wähle deine Fachrichtung und arbeite dich zu großen Fähigkeiten vor.','network','02'],
  ['skilllessons','Skill-Lektionen','Die vertiefenden Kurse zu deinen ausgewählten Skills – mit eigenen Aufgaben, XP und Freischaltungen.','graduation-cap','03'],
  ['speciallessons','Speziallektionen','Besondere mehrteilige Firmenfälle und Herausforderungen, freischaltbar über Beförderungen und Artefakte.','gem','04']
 ];
 return '<section class="fp42-learn-home"><div class="fp42-learn-intro"><span class="eyebrow">DEINE FINANZAUSBILDUNG</span><h1>Lernen</h1><p>Starte mit dem kurzen Fundament und vertiefe anschließend die Themen, die dich interessieren. Jeder abgeschlossene Skill bringt dich fachlich und in deiner Karriere weiter.</p></div>'+
 '<div class="fp42-learn-index">'+items.map(([id,title,description,icon,num])=>'<button type="button" class="fp42-learn-entry fp-tab-hub-item" data-fp41-route="'+id+'"><span class="fp-tab-hub-number">'+num+'</span><span class="fp-tab-hub-copy"><strong>'+title+'</strong><small>'+description+'</small></span><span class="fp-tab-hub-chevron" aria-hidden="true">›</span></button>').join('')+'</div></section>';
}
function basics(){
 return shell('basics',window.FinanzPilotJourney?.renderHome?.()||'<div class="fp41-loading">Die Grundlagen werden geladen.</div>');
}
function mapNode(s){
 const {x,y,w}=nodePos(s),done=mastered(s.id),active=enrolled(s.id),ready=purchaseReady(s);
 const cls=done?'done':active?'selected':ready?'ready':'locked';
 return '<button type="button" class="fp42-map-node '+cls+(w<200?' compact':'')+(selectedMap===s.id?' focused':'')+'" style="left:'+x+'px;top:'+y+'px;width:'+w+'px" data-fp42-node="'+escape(s.id)+'" aria-label="'+escape(s.title)+', '+(done?'erlernt':active?'ausgewählt':ready?'freischaltbar':'Voraussetzung fehlt')+'">'+
 '<span class="fp42-map-symbol">'+(done?'✓':s.tier)+'</span><strong>'+escape(s.title)+'</strong><small>'+escape(s.description)+'</small><em>'+(done?'✓ Erlernt':active?'Lernweg aktiv':ready?'Für 3 FP auswählbar':'Voriger Skill fehlt')+'</em></button>';
}
function skillDetail(){
 if(!selectedMap)return '<div class="fp42-detail-empty"><h3>Wähle einen Skill</h3><p>Tippe auf einen Knoten in der Karte. Hier siehst du, was du lernst, welche Voraussetzungen fehlen und wie du zu den Lektionen kommst.</p></div>';
 const s=bySkill(selectedMap);if(!s)return '';
 const done=mastered(s.id),active=enrolled(s.id),ready=purchaseReady(s);
 return '<div class="fp42-skill-detail"><span class="eyebrow">SKILL · '+escape(catalog.branches.find(b=>b.id===s.branch)?.title||'Finanzwissen')+'</span>'+
 '<h3>'+escape(s.title)+'</h3><p>'+escape(s.description)+'</p>'+
 (s.parent?'<div class="fp42-detail-condition"><b>Vorheriger Skill</b><span>'+escape(titleOf(s.parent))+(mastered(s.parent)?' ✓': ' · noch gesperrt')+'</span></div>':
 '<div class="fp42-detail-condition"><b>Einstieg</b><span>Ohne vorherigen Spezialskill möglich</span></div>')+
 '<div class="fp42-detail-condition"><b>Deine Lektionen</b><span>'+s.lessons.filter(l=>completed(l.id)).length+' / '+s.lessons.length+' abgeschlossen</span></div>'+
 '<div class="fp42-detail-condition"><b>Freischaltung</b><span>'+(done?'Skill bereits erlernt':active?'Lernpfad aktiv':ready?'3 Forschungspunkte':'Vorherigen Skill abschließen')+'</span></div>'+
 '<div class="fp42-detail-reward">Bei Abschluss: <b>Skill + '+s.rewardPoints+' Forschungspunkte</b>, dazu individuelle Lern-XP</div>'+
 '<button type="button" class="btn" data-fp42-open="'+escape(s.id)+'">Zu den Skill-Lektionen →</button></div>';
}
function mapLines(){
 const edges=[];
 for(const s of catalog.skills){
  const to=nodePos(s),tx=to.x+to.w/2,ty=to.y;
  if(!s.parent){edges.push('<path class="fp42-line" d="M'+MAP_CX+',160 C'+MAP_CX+',240 '+tx+',210 '+tx+','+ty+'" />');continue}
  const from=bySkill(s.parent);if(!from)continue;const p=nodePos(from),fx=p.x+p.w/2,fy=p.y+(p.w<200?168:145);
  edges.push('<path class="fp42-line'+(mastered(s.parent)?' lit':'')+'" d="M'+fx+','+fy+' C'+fx+','+(fy+90)+' '+tx+','+(ty-75)+' '+tx+','+ty+'" />');
 }
 return edges.join('');
}
function tree(){
 if(!catalog)return shell('skilltree','<div class="fp41-loading">Skill-Katalog wird geladen: '+escape(problem)+'</div>');
 const count=catalog.skills.filter(s=>mastered(s.id)).length;
 let body='<div class="fp41-intro"><span class="eyebrow">DEIN WEG ZUM ANALYSTEN</span><h1>Skillbaum</h1><p>Verzweige dich in vier Fachrichtungen. Jede führt über zusammenhängende Kompetenzen zu einem großen Skill. Tippe auf einen Knoten, um Voraussetzungen und die passenden Lektionen zu sehen. Die Karte lässt sich verschieben und zoomen.</p></div>'+profileLine();
 if(!user())body+=guest();
 body+='<div class="fp42-map-toolbar"><div class="fp42-map-legend"><span>● Erlernt</span><span>◉ Ausgewählt</span><span>◇ Freischaltbar</span><span>○ Gesperrt</span></div><div class="fp42-map-controls"><button type="button" data-fp42-zoom="-1" aria-label="Verkleinern">−</button><span data-fp42-scale>'+Math.round(mapZoom*100)+' %</span><button type="button" data-fp42-zoom="1" aria-label="Vergrößern">+</button><button type="button" data-fp42-fit>Übersicht</button></div></div>'+
 '<div class="fp42-map-layout"><div class="fp42-map-col"><div id="fp42-map-viewport" class="fp42-map-viewport" tabindex="0" aria-label="Verschiebbarer und zoombarer Skillbaum">'+
 '<div id="fp42-map-stage" class="fp42-map-stage" style="width:'+(MAP_W*mapZoom)+'px;height:'+(MAP_H*mapZoom)+'px"><div id="fp42-map-plane" class="fp42-map-plane" style="width:'+MAP_W+'px;height:'+MAP_H+'px;transform:scale('+mapZoom+')">'+
 '<svg class="fp42-map-lines" viewBox="0 0 '+MAP_W+' '+MAP_H+'" aria-hidden="true">'+mapLines()+'</svg>'+
 '<div class="fp42-tree-root"><div class="fp42-tree-root-icon">◎</div><strong>Dein Finanzwissen</strong><small>Vier verschiedene Spezialisierungen</small></div>'+
 catalog.branches.map((b,i)=>'<div class="fp42-tree-branch-title" style="left:'+(mapX[i])+'px;top:228px;width:'+MAP_NODE_W+'px">'+escape(b.title)+'</div>').join('')+
 catalog.skills.map(mapNode).join('')+
 '</div></div></div><div class="fp42-map-caption">Mit einem Finger verschieben · mit den Tasten zoomen · Knoten antippen</div></div>'+
 '<aside class="fp42-map-detail" id="fp42-skill-detail" aria-live="polite">'+skillDetail()+'</aside></div>'+
 '<p class="fp41-hint">'+count+' von '+catalog.skills.length+' neuen Skills erlernt. Alle drei abgeschlossenen Spezialisierungen ist eine Beförderung möglich.</p>';
 return shell('skilltree',body);
}
function bindMap(root){
 const vp=root.querySelector('#fp42-map-viewport'),stage=root.querySelector('#fp42-map-stage'),plane=root.querySelector('#fp42-map-plane');
 if(!vp||!stage||!plane)return;
 let z=Math.max(.4,Math.min(1.5,mapZoom));
 function zoom(n,x=vp.clientWidth/2,y=vp.clientHeight/2){
  const old=z;z=Math.max(.38,Math.min(1.6,n));
  const cx=(vp.scrollLeft+x)/old,cy=(vp.scrollTop+y)/old;
  stage.style.width=(MAP_W*z)+'px';stage.style.height=(MAP_H*z)+'px';plane.style.transform='scale('+z+')';
  vp.scrollLeft=Math.max(0,cx*z-x);vp.scrollTop=Math.max(0,cy*z-y);
  mapZoom=z;mapLeft=vp.scrollLeft;mapTop=vp.scrollTop;
  const indicator=root.querySelector('[data-fp42-scale]');if(indicator)indicator.textContent=Math.round(z*100)+' %';
 }
 vp.scrollLeft=mapLeft;vp.scrollTop=mapTop;
 root.querySelectorAll('[data-fp42-zoom]').forEach(btn=>btn.addEventListener('click',()=>zoom(z+(Number(btn.dataset.fp42Zoom)>0?.15:-.15))));
 root.querySelector('[data-fp42-fit]')?.addEventListener('click',()=>{
  zoom(Math.max(.38,Math.min(vp.clientWidth/MAP_W, vp.clientHeight/MAP_H)));
  vp.scrollLeft=Math.max(0,(MAP_W*z-vp.clientWidth)/2);vp.scrollTop=0;mapLeft=vp.scrollLeft;mapTop=0;
 });
 vp.addEventListener('scroll',()=>{mapLeft=vp.scrollLeft;mapTop=vp.scrollTop},{passive:true});
 let start=null;
 vp.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'||e.target.closest('button'))return;
  start={x:e.clientX,y:e.clientY,left:vp.scrollLeft,top:vp.scrollTop};vp.classList.add('dragging');vp.setPointerCapture?.(e.pointerId);
 });
 vp.addEventListener('pointermove',e=>{if(!start)return;vp.scrollLeft=start.left-(e.clientX-start.x);vp.scrollTop=start.top-(e.clientY-start.y)});
 const stop=()=>{start=null;vp.classList.remove('dragging')};
 vp.addEventListener('pointerup',stop);vp.addEventListener('pointercancel',stop);
 vp.addEventListener('wheel',e=>{if(!e.ctrlKey&&!e.metaKey)return;e.preventDefault();const r=vp.getBoundingClientRect();zoom(z*(e.deltaY>0?.90:1.1),e.clientX-r.left,e.clientY-r.top)},{passive:false});
 let gesture=null;
 const distance=t=>Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY);
 vp.addEventListener('touchstart',e=>{if(e.touches.length===2)gesture={z,d:distance(e.touches)}},{passive:true});
 vp.addEventListener('touchmove',e=>{if(!gesture||e.touches.length!==2)return;e.preventDefault();zoom(gesture.z*distance(e.touches)/gesture.d)},{passive:false});
 vp.addEventListener('touchend',e=>{if(e.touches.length<2)gesture=null},{passive:true});
 root.querySelectorAll('[data-fp42-node]').forEach(btn=>btn.addEventListener('click',()=>{
  selectedMap=btn.dataset.fp42Node;
  root.querySelectorAll('[data-fp42-node]').forEach(n=>n.classList.toggle('focused',n.dataset.fp42Node===selectedMap));
  const detail=root.querySelector('#fp42-skill-detail');if(detail)detail.innerHTML=skillDetail();
  if(window.innerWidth<800)detail?.scrollIntoView?.({behavior:'smooth',block:'nearest'});
 }));
 root.querySelector('#fp42-skill-detail')?.addEventListener('click',e=>{
  const btn=e.target.closest('[data-fp42-open]');if(btn)pick(btn.dataset.fp42Open);
 });
}
function profileLine(){
 return '<div class="fp41-microprogress"><span><b>'+catalog.skills.filter(s=>mastered(s.id)).length+'</b> von '+catalog.skills.length+' Spezialisierungen</span>'+
 '<span><b>'+earnedXp()+'</b> Spezial-XP</span><span><b>'+points()+'</b> Forschungspunkte</span>'+
 (promotionsEarned()?'<span><b>'+promotionsEarned()+'</b> neue Beförderungen</span>':'')+'</div>';
}
function guest(){
 return '<div class="fp41-guest"><h2>Skillfortschritt kostenlos speichern</h2><p>Die Skillkarte ist sichtbar. Für Forschungspunkte, Lektionenkäufe und prüfbare Abschlüsse benötigst du ein kostenloses Konto. Bereits erworbene alte Lernstände werden dadurch nicht gelöscht.</p><button class="btn" type="button" data-fp41-login>Zum Konto</button></div>';
}
function skillIndex(){
 if(!catalog)return shell('skilllessons','<div class="fp41-loading">Skill-Lektionen werden geladen.</div>');
 const current=currentSkill();
 let body='<div class="fp41-intro"><span class="eyebrow">FACHLICHE SPEZIALISIERUNGEN</span><h1>Deine Skill-Lektionen</h1><p>Jeder ausgewählte Skill besteht aus mehreren inhaltlich zusammenhängenden Lernaufgaben. Du kannst eine Erklärung jederzeit erneut lesen; die XP und Forschungspunkte werden nur nach bestandenem, serverseitig bestätigtem Abschluss vergeben.</p></div>'+profileLine();
 if(!user())body+=guest();
 if(!current){
  body+='<h2 class="fp41-small-heading">Wähle zuerst einen Skill aus</h2><div class="fp41-pick">'+catalog.skills.map(s=>'<button class="fp41-pick-item" type="button" data-fp41-skill="'+escape(s.id)+'"><strong>'+escape(s.title)+'</strong><small>'+(mastered(s.id)?'✓ Erlernt':enrolled(s.id)?'Lernpfad ausgewählt':purchaseReady(s)?'Für 3 FP auswählbar':'Gesperrt · benötigt '+titleOf(s.parent))+'</small></button>').join('')+'</div><button class="btn secondary" data-fp41-route="skilltree">Zum Skillbaum →</button>';
  return shell('skilllessons',body);
 }
 if(selectedLesson)return shell('skilllessons',body+renderLesson(current,selectedLesson));
 const done=mastered(current.id),selected=enrolled(current.id),ready=purchaseReady(current);
 body+='<div class="fp41-detail"><button type="button" class="btn secondary" data-fp43-all-skills>Alle Skill-Lektionen anzeigen</button><span class="eyebrow">'+escape(catalog.branches.find(b=>b.id===current.branch)?.title||'Spezialisierung')+' · AUFBAUSTUFE '+current.tier+'</span>'+
 '<h2>'+escape(current.title)+'</h2><p>'+escape(current.description)+'</p>'+
 (current.parent?'<p class="fp41-precondition">Vorheriger Skill: '+escape(titleOf(current.parent))+(mastered(current.parent)?' ✓':', noch nicht abgeschlossen')+'</p>':'')+
 '<div class="fp41-detail-status">'+(done?'Skill erlernt · Abschlussbelohnung erhalten':selected?'Lernpfad freigeschaltet':ready?'Noch nicht gewählt · Kosten 3 Forschungspunkte':'Noch gesperrt')+'</div>'+
 (!selected?'<button class="btn" data-fp41-enroll="'+escape(current.id)+'" '+(!ready||!user()?'disabled':'')+'>Skill für 3 Forschungspunkte auswählen</button>':'')+'</div>';
 body+='<div class="fp41-lesson-list">'+current.lessons.map(l=>{
 const available=lessonAvailable(current,l),open=unlocked(l.id),done=completed(l.id);
 return '<article class="fp41-lesson-card'+(done?' done':available?' ready':' locked')+'"><span class="eyebrow">LEKTION '+l.sequence+' VON '+current.lessons.length+'</span><h3>'+escape(l.title)+'</h3><p>'+escape(l.explanation)+'</p><div class="fp41-lesson-info"><span>'+l.xp+' XP bei Abschluss</span><span>'+(done?'✓ Abgeschlossen':open?'Bereit zum Lernen':available?'1 FP oder 10 € Spielgeld':'Vorherige Lektion erst abschließen')+'</span></div>'+
 (open?'<button class="btn" type="button" data-fp41-open="'+escape(l.id)+'">'+(done?'Wiederholen':'Lektion öffnen')+' →</button>':
 available?'<div class="fp41-buy-actions"><button class="btn secondary" data-fp41-buy="'+escape(l.id)+'" data-fp41-currency="research">Für 1 FP freischalten</button><button class="btn secondary" data-fp41-buy="'+escape(l.id)+'" data-fp41-currency="euro">Für 10 € Spielgeld</button></div>':
 '<button class="btn secondary" disabled>Gesperrt</button>')+'</article>';
 }).join('')+'</div>'+
 (done?'<div class="fp41-earned"><strong>Skill erlernt!</strong><p>Der Abschluss wurde gespeichert und die vorgesehenen Forschungspunkte wurden gutgeschrieben.</p></div>':'');
 return shell('skilllessons',body);
}
function renderLesson(skill,id){
 const l=skill.lessons.find(x=>x.id===id);
 if(!l)return '<div class="fp41-loading">Die Lektion existiert nicht.</div>';
 const done=completed(id);
 return '<div class="fp41-study"><button type="button" class="btn secondary" data-fp41-lesson-back>← Alle Lektionen dieses Skills</button>'+
 '<div class="eyebrow">'+escape(skill.title)+' · LEKTION '+l.sequence+'</div><h2>'+escape(l.title)+'</h2>'+
 '<div class="fp41-reading"><h3>Den Zusammenhang verstehen</h3><p>'+escape(l.explanation)+'</p><h3>Beispiel aus der Praxis</h3><p>'+escape(l.example)+'</p></div>'+
 '<section class="fp41-question"><span class="eyebrow">WISSENSCHECK</span><h3>'+escape(l.question)+'</h3>'+
 l.options.map((opt,i)=>'<button type="button" data-fp41-answer="'+i+'" '+(done?'disabled':'')+'><span>'+String.fromCharCode(65+i)+'</span>'+escape(opt)+'</button>').join('')+
 '<div class="fp41-answer-status">'+(done?'✓ Bereits erfolgreich abgeschlossen. Du kannst die Erklärung jederzeit wiederholen.':'Die Antwort wird vom Server geprüft. Du kannst bei einem Fehler erneut versuchen.')+'</div></section></div>';
}
function specials(){
 if(!catalog)return shell('speciallessons','<div class="fp41-loading">Spezialfälle werden geladen.</div>');
 let body='<div class="fp41-intro"><span class="eyebrow">AUSSERGEWÖHNLICHE FORSCHUNGSAUFTRÄGE</span><h1>Individuelle Speziallektionen</h1><p>Diese Fälle gehören absichtlich nicht zu einem ganzen Skill. Sie verbinden mehrere bereits erlernte Fachgebiete zu einer einzigen anspruchsvollen Entscheidung mit realistischeren Zielkonflikten. Zugang gibt es nur durch passende Beförderungen oder Artefakte.</p></div>';
 if(selectedSpecial){const item=catalog.special.find(x=>x.id===selectedSpecial);if(item){
  body+='<button class="btn secondary" data-fp41-special-back>← Alle Spezialfälle</button><article class="fp41-special-detail"><h2>'+escape(item.title)+'</h2><p>'+escape(item.description)+'</p><h3>Dein Forschungsfall</h3><p>'+escape(item.case)+'</p>'+(item.sections||[]).map((section,i)=>'<section class="fp41-case-section"><span class="eyebrow">PHASE '+(i+1)+' VON '+item.sections.length+'</span><h3>'+escape(section.heading)+'</h3>'+section.paragraphs.map(p=>'<p>'+escape(p)+'</p>').join('')+'</section>').join('')+'<div class="fp41-case-steps"><h3>Arbeitsauftrag</h3><p>1. Trenne belegte Fakten und eigene Annahmen. 2. Erstelle mindestens ein negatives und ein positives Szenario. 3. Benenne, welche zusätzliche Information deine Entscheidung verändern könnte.</p><p>Dieser anspruchsvolle Spezialfall ist die erste inhaltliche Fassung. Eine geprüfte Freitextabgabe und besondere Vergütung folgen erst mit dem erweiterten Missionssystem.</p></div></article>';
  return shell('speciallessons',body);
 }}
 body+='<div class="fp41-special-list">'+catalog.special.map(s=>{
 const rank=promotionsEarned(),claim=claims.some(c=>c.module_id===s.artifact&&c.choice==='path');
 const eligible=s.unlock==='promotion'?rank>=s.minPromotion:claim;
 return '<article class="fp41-special'+(eligible?' eligible':' locked')+'"><span class="eyebrow">'+(s.unlock==='promotion'?'BEFÖRDERUNGSFALL':'ARTEFAKT-EXKLUSIV')+'</span><h2>'+escape(s.title)+'</h2><p>'+escape(s.description)+'</p><small>'+ (eligible?'✓ Zugang freigeschaltet':s.unlock==='promotion'?'Freischaltung ab '+s.minPromotion+'. neuer Beförderung':'Nur nach Freigabe durch das passende Artefakt')+'</small>'+
 '<button class="btn" data-fp41-special="'+escape(s.id)+'" '+(!eligible?'disabled':'')+'>'+(eligible?'Fall bearbeiten':'Noch gesperrt')+'</button></article>';
 }).join('')+'</div>';
 body+='<details class="fp42-legacy-cases"><summary>Bereits vorhandene Fallstudien und Intensivkurse</summary><p>Deine älteren Unternehmensfälle mit KION, AIXTRON und Alphabet, die Transferwerkstatt und die langen Bewertungslehrgänge bleiben erhalten. Sie gehören in den Lernbereich und sind keine eigenen Profilkarten.</p><div class="fp42-legacy-links">'+[['training','Vorhandene Unternehmensfälle'],['transfer','Transferwerkstatt'],['academy','Intensivkurse zur Aktienbewertung']].map(([id,name])=>'<button type="button" class="btn secondary" data-section-route="'+id+'">'+name+' →</button>').join('')+'</div></details>';
 return shell('speciallessons',body);
}
async function load(force=false){
 if(!catalog||force){
  try{const r=await fetch(URI+'?v=41',{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);
  const j=await r.json();if(!Array.isArray(j.skills)||j.skills.length<4)throw Error('Katalog unvollständig');catalog=j;problem='';
  }catch(e){problem=String(e.message||e);return}
 }
 if(!user()){enrollments=[];lessons=[];profiles=[];promotions=[];accounts=[];claims=[];loadedFor=null;return}
 if(fetching)return;
 if(!force&&loadedFor===user())return;
 fetching=true;
 const id=user();
 try{
  const tables=['fp_specialization_enrollments','fp_specialization_lessons','fp_specialization_profiles','fp_specialization_promotions','fp_economy_accounts','fp_reward_claims'];
  const rows=await Promise.all(tables.map(table=>client().from(table).select('*').eq('user_id',id)));
  for(const r of rows)if(r.error)throw r.error;
  if(id!==user())return;
  [enrollments,lessons,profiles,promotions,accounts,claims]=rows.map(x=>x.data||[]);
  loadedFor=id;problem='';
 }catch(e){problem='Fortschritt konnte nicht geladen werden: '+String(e.message||e)}
 finally{fetching=false;redraw()}
}
function pick(id){
 if(!bySkill(id))return;
 selectedSkill=id;selectedLesson='';
 nav()?.route('skilllessons');redraw();
}
async function action(kind,skill,lesson,payment,answer){
 if(busy||!user())return;
 busy=true;notice='Auftrag wird geprüft …';redraw();
 try{
  const {data,error}=await client().rpc('fp_specialization_action',{
   p_action:kind,p_skill_id:skill,p_lesson_id:lesson||null,p_payment:payment||null,
   p_answer:Number.isInteger(answer)?answer:null
  });
  if(error)throw error;
  notice=data?.message||'Gespeichert.';
  if(kind==='submit'&&data?.correct===false)notice='Noch nicht richtig. Lies die Erklärung erneut und versuche es wieder.';
  if(kind==='submit'&&data?.correct===true&&data?.promotion)notice+=' Beförderung Nr. '+data.promotion+' erreicht! Forschungspunkte und virtuelles Depotgeld wurden gutgeschrieben.';
  await load(true);window.FinanzPilotEconomy?.refresh?.(false);
 }catch(e){notice='Nicht ausgeführt: '+String(e.message||e)}
 finally{busy=false;redraw()}
}
function bind(root=document){
 bindMap(root);
 root.querySelectorAll('[data-fp41-route]').forEach(b=>b.addEventListener('click',()=>{
  selectedLesson='';selectedSpecial='';if(b.dataset.fp41Route==='skilllessons')selectedSkill='';nav()?.route(b.dataset.fp41Route);if(!['learn','basics'].includes(b.dataset.fp41Route))load();
 }));
 root.querySelector('[data-fp43-all-skills]')?.addEventListener('click',()=>{selectedSkill='';selectedLesson='';redraw()});
 root.querySelectorAll('[data-fp41-skill]').forEach(b=>b.addEventListener('click',()=>pick(b.dataset.fp41Skill)));
 root.querySelectorAll('[data-fp41-enroll]').forEach(b=>b.addEventListener('click',()=>action('enroll',b.dataset.fp41Enroll)));
 root.querySelectorAll('[data-fp41-buy]').forEach(b=>b.addEventListener('click',()=>action('unlock',selectedSkill,b.dataset.fp41Buy,b.dataset.fp41Currency)));
 root.querySelectorAll('[data-fp41-open]').forEach(b=>b.addEventListener('click',()=>{selectedLesson=b.dataset.fp41Open;redraw()}));
 root.querySelectorAll('[data-fp41-answer]').forEach(b=>b.addEventListener('click',()=>action('submit',selectedSkill,selectedLesson,null,Number(b.dataset.fp41Answer))));
 root.querySelector('[data-fp41-lesson-back]')?.addEventListener('click',()=>{selectedLesson='';redraw()});
 root.querySelectorAll('[data-fp41-special]').forEach(b=>b.addEventListener('click',()=>{selectedSpecial=b.dataset.fp41Special;redraw()}));
 root.querySelector('[data-fp41-special-back]')?.addEventListener('click',()=>{selectedSpecial='';redraw()});
 root.querySelectorAll('[data-fp41-login]').forEach(b=>b.addEventListener('click',()=>window.FinanzPilotCloud?.openLogin?.()));
}
window.addEventListener('fp-auth-change',()=>{loadedFor=null;load(true)});
window.addEventListener('fp-streak-reward',()=>{loadedFor=null;load(true)});
window.FinanzPilotLearningHub={home,basics,tree,skillIndex,specials,bind,load,pick,get catalog(){return catalog},get status(){return {enrollments,lessons,profiles,promotions,points:points(),problem,notice,busy}}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>load(),{once:true});else load();
})();
