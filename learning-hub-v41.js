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
const routes=[['learn','Grundlagen'],['skilltree','Skillbaum'],['skilllessons','Skill-Lektionen'],['speciallessons','Speziallektionen']];
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
function tabs(active){
 return '<nav class="fp41-tabs" aria-label="Bereiche des Lernens">'+routes.map(([id,label])=>'<button type="button" class="fp41-tab'+(id===active?' active':'')+'" data-fp41-route="'+id+'" aria-current="'+(active===id?'page':'false')+'">'+escape(label)+'</button>').join('')+'</nav>';
}
function shell(active,content){
 return '<div class="fp41-root">'+tabs(active)+(notice?'<div class="fp41-notice" role="status">'+escape(notice)+'</div>':'')+content+'</div>';
}
function profileLine(){
 return '<div class="fp41-microprogress"><span><b>'+catalog.skills.filter(s=>mastered(s.id)).length+'</b> von '+catalog.skills.length+' Spezialisierungen</span>'+
 '<span><b>'+earnedXp()+'</b> Spezial-XP</span><span><b>'+points()+'</b> Forschungspunkte</span>'+
 (promotionsEarned()?'<span><b>'+promotionsEarned()+'</b> neue Beförderungen</span>':'')+'</div>';
}
function guest(){
 return '<div class="fp41-guest"><h2>Skillfortschritt kostenlos speichern</h2><p>Die Skillkarte ist sichtbar. Für Forschungspunkte, Lektionenkäufe und prüfbare Abschlüsse benötigst du ein kostenloses Konto. Bereits erworbene alte Lernstände werden dadurch nicht gelöscht.</p><button class="btn" type="button" data-fp41-login>Zum Konto</button></div>';
}
function home(){
 return shell('learn',(window.FinanzPilotJourney?.renderHome?.()||'<div class="fp41-loading">Grundlagen werden geladen</div>'));
}
function tree(){
 if(!catalog)return shell('skilltree','<div class="fp41-loading">Skill-Katalog wird geladen: '+escape(problem)+'</div>');
 const count=catalog.skills.filter(s=>mastered(s.id)).length;
 let body='<div class="fp41-intro"><span class="eyebrow">LERNE, WAS DICH WIRKLICH INTERESSIERT</span><h1>Dein Skillbaum</h1><p>Jede Fachrichtung baut vom ersten Überblick bis zu einer anspruchsvollen Fähigkeit auf. Wähle einen Skill mit Forschungspunkten aus, schalte seine Lektionen einzeln frei und bestehe alle Aufgaben. Erst dann ist der Skill erlernt.</p></div>'+profileLine()+
 '<p class="fp41-hint">Erlernte Skills: '+count+'. Nach fünf neuen Spezialisierungen ist eine Beförderung mit einer größeren Belohnung vorgesehen. Der bisherige Karrierefortschritt bleibt separat erhalten.</p>';
 if(!user())body+=guest();
 body+='<div class="fp41-branches">'+catalog.branches.map(branch=>{
 const list=catalog.skills.filter(x=>x.branch===branch.id);
 return '<section class="fp41-branch"><div class="fp41-branch-heading"><h2>'+escape(branch.title)+'</h2><p>'+escape(branch.description)+'</p></div>'+
 '<div class="fp41-branch-steps">'+list.map(s=>{
 const done=mastered(s.id),active=enrolled(s.id),ready=purchaseReady(s),missing=s.parent&&!mastered(s.parent)?titleOf(s.parent):null;
 const status=done?'✓ Erlernt':active?'Lernpfad freigeschaltet':ready?'Für 3 FP auswählbar':'Benötigt '+escape(missing);
 return '<button type="button" class="fp41-skill-node'+(done?' done':active?' selected':ready?' ready':' locked')+'" data-fp41-skill="'+escape(s.id)+'"><span class="fp41-skill-tier">'+s.tier+'</span><span class="fp41-skill-body"><strong>'+escape(s.title)+'</strong><small>'+escape(s.description)+'</small><em>'+status+'</em></span><span aria-hidden="true">›</span></button>';
 }).join('')+'</div><p class="fp41-capstone">Großes Kompetenzziel: '+escape(titleOf(branch.capstone))+'</p></section>';
 }).join('')+'</div>';
 return shell('skilltree',body);
}
function skillIndex(){
 if(!catalog)return shell('skilllessons','<div class="fp41-loading">Skill-Lektionen werden geladen.</div>');
 const current=currentSkill();
 let body='<div class="fp41-intro"><span class="eyebrow">FACHLICHE SPEZIALISIERUNGEN</span><h1>Deine Skill-Lektionen</h1><p>Jeder ausgewählte Skill besteht aus mehreren inhaltlich zusammenhängenden Lernaufgaben. Du kannst eine Erklärung jederzeit erneut lesen; die XP und Forschungspunkte werden nur nach bestandenem, serverseitig bestätigtem Abschluss vergeben.</p></div>'+profileLine();
 if(!user())body+=guest();
 if(!current){
  body+='<h2 class="fp41-small-heading">Wähle zuerst einen Skill aus</h2><div class="fp41-pick">'+catalog.skills.filter(s=>enrolled(s.id)||purchaseReady(s)).map(s=>'<button class="fp41-pick-item" type="button" data-fp41-skill="'+escape(s.id)+'"><strong>'+escape(s.title)+'</strong><small>'+(enrolled(s.id)?'Bereits ausgewählt':'Skill für 3 FP auswählen')+'</small></button>').join('')+'</div><button class="btn secondary" data-fp41-route="skilltree">Zum Skillbaum →</button>';
  return shell('skilllessons',body);
 }
 if(selectedLesson)return shell('skilllessons',body+renderLesson(current,selectedLesson));
 const done=mastered(current.id),selected=enrolled(current.id),ready=purchaseReady(current);
 body+='<div class="fp41-detail"><button class="btn secondary" data-fp41-route="skilltree">← Skillbaum</button><span class="eyebrow">'+escape(catalog.branches.find(b=>b.id===current.branch)?.title||'Spezialisierung')+' · AUFBAUSTUFE '+current.tier+'</span>'+
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
  body+='<button class="btn secondary" data-fp41-special-back>← Alle Spezialfälle</button><article class="fp41-special-detail"><h2>'+escape(item.title)+'</h2><p>'+escape(item.description)+'</p><h3>Dein Forschungsfall</h3><p>'+escape(item.case)+'</p><div class="fp41-case-steps"><h3>Arbeitsauftrag</h3><p>1. Trenne belegte Fakten und eigene Annahmen. 2. Erstelle mindestens ein negatives und ein positives Szenario. 3. Benenne, welche zusätzliche Information deine Entscheidung verändern könnte.</p><p>Dieser anspruchsvolle Spezialfall ist die erste inhaltliche Fassung. Eine geprüfte Freitextabgabe und besondere Vergütung folgen erst mit dem erweiterten Missionssystem.</p></div></article>';
  return shell('speciallessons',body);
 }}
 body+='<div class="fp41-special-list">'+catalog.special.map(s=>{
 const rank=promotionsEarned(),claim=claims.some(c=>c.module_id===s.artifact&&c.choice==='path');
 const eligible=s.unlock==='promotion'?rank>=s.minPromotion:claim;
 return '<article class="fp41-special'+(eligible?' eligible':' locked')+'"><span class="eyebrow">'+(s.unlock==='promotion'?'BEFÖRDERUNGSFALL':'ARTEFAKT-EXKLUSIV')+'</span><h2>'+escape(s.title)+'</h2><p>'+escape(s.description)+'</p><small>'+ (eligible?'✓ Zugang freigeschaltet':s.unlock==='promotion'?'Freischaltung ab '+s.minPromotion+'. neuer Beförderung':'Nur nach Freigabe durch das passende Artefakt')+'</small>'+
 '<button class="btn" data-fp41-special="'+escape(s.id)+'" '+(!eligible?'disabled':'')+'>'+(eligible?'Fall bearbeiten':'Noch gesperrt')+'</button></article>';
 }).join('')+'</div>';
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
 root.querySelectorAll('[data-fp41-route]').forEach(b=>b.addEventListener('click',()=>{
  selectedLesson='';selectedSpecial='';nav()?.route(b.dataset.fp41Route);if(b.dataset.fp41Route!=='learn')load();
 }));
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
window.FinanzPilotLearningHub={home,tree,skillIndex,specials,bind,load,pick,get catalog(){return catalog},get status(){return {enrollments,lessons,profiles,promotions,points:points(),problem,notice,busy}}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>load(),{once:true});else load();
})();
