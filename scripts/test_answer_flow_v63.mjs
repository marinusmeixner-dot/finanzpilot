import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=p=>fs.readFileSync(p,'utf8');
const main=read('index.html'),profile=read('profile-v42.js'),sound=read('feedback-v52.js'),
hub=read('learning-hub-v41.js'),journey=read('journey-v39.js'),special=read('lesson-view-v46.js'),
header=read('header-v43.js'),streak=read('streak-v40.js'),reveal=read('celebrations-v53.js'),css=read('ui-v43.css');
assert(main.includes('id="fp43-depot-trigger"')&&main.includes('id="top-depot"'),'Header shows total paper-portfolio wealth.');
assert(!main.includes('id="top-level"')&&!main.includes('id="fp52-settings-toggle"'),'No level or sound buttons in header.');
assert(main.includes('id="top-fp"')&&main.includes('id="fp-streak-trigger"'),'Keep FP and streak accessible.');
assert(header.includes('p.complete&&Number.isFinite(p.total)'),'Do not claim a total when positions are unpriced.');
assert(profile.includes('settingsHtml?.()')&&profile.includes('bindSettings?.(root)'),'Both sound and motion switches belong in profile.');
assert(sound.includes('role="switch" id="fp52-sound-pref"')&&sound.includes('role="switch" id="fp52-motion-pref"'),'Only two toggles.');
assert(!sound.includes('fp52-sound-test')&&!sound.includes('fp52-animation-test'),'No test button or demo UI.');
assert(sound.includes('answer:[[660,0,.080,.055]]')&&sound.includes('wrong:[[440,0,.095,.050]]'),'Plain single-note tones for answer confirmation.');
assert(css.includes('grid-template-rows:auto auto')&&css.includes('.fp60-depot-pill'),'Phone header has two practical rows.');
assert(streak.includes("show?.('streak'")&&streak.includes('data?.awarded_now'),'Every newly earned first-visit streak award has its animation.');
assert(reveal.includes('dismissTimer=setTimeout(advance'),'Every award automatically dismisses.');
assert(reveal.includes("level:{caption:'LEVEL AUFGESTIEGEN!'")&&reveal.includes("artifact:{caption:'NEUES ARTEFAKT'"),'Level and artifacts have distinct animations.');
assert(hub.includes("data-fp41-check")&&hub.includes("data-fp41-finish"),'Special lessons check and finish in separate steps.');
assert(!hub.includes("action('submit',selectedSkill,selectedLesson,null,Number(b.dataset.fp41Answer))"),'Selecting a specialist choice must not call RPC.');
assert(hub.includes("action('submit',selectedSkill,selectedLesson,null,choice)"),'Only explicit check triggers RPC.');
assert(hub.includes('pendingSuccess={lesson,kind:event'),'Store real reward for completion action.');
assert(hub.includes("show?.(done.kind,done.detail)"),'Only finishing skill lesson presents its earned animation.');
assert(journey.includes("function checkAnswer()")&&journey.includes("data-journey-check"),'Foundation checks only after a click.');
assert(journey.includes("data-journey-complete")&&journey.includes("page===3"),'Final question changes primary button to finish.');

const skills=JSON.parse(read('data/specializations-v41.json'));
const a=skills.skills[0],lesson=a.lessons[0];
const handlers={},window={
 addEventListener(){},render(){},
 FinanzPilotLearningHub:{catalog:skills},
 FinanzPilotStudy:{noteWidget:()=>'<p>notizen</p>',bind(){}}
};
const context=vm.createContext({window,document:{},Number,Math,Date});
vm.runInContext(special,context,{filename:'lesson-view-v46.js'});
const v=window.FinanzPilotLessonView;
v.open(lesson.id);
const button=(dataset={})=>({dataset,addEventListener(type,fn){if(type==='click')this.click=fn}});
const toLast=button({fp46StudyStep:'3'});
v.bind({querySelectorAll:selector=>selector==='[data-fp46-study-step]'?[toLast]:[],querySelector(){return null}});
toLast.click();
let html=v.render(a,lesson,{completed:false});
assert(html.includes('Antwort prüfen')&&html.includes('data-fp41-check disabled'),'Nothing selected => cannot submit.');
assert(!html.includes('data-fp41-finish'),'Cannot finish an unverified lesson.');
const pick=button({fp41Answer:'1'});
v.bind({querySelectorAll:selector=>selector==='[data-fp41-answer]'?[pick]:[],querySelector(){return null}});
pick.click();
assert.equal(v.chosen,1,'Selection stored provisionally; no RPC can occur here.');
html=v.render(a,lesson,{completed:false});
assert(html.includes('data-fp41-check ')&&!html.includes('data-fp41-check disabled'));
assert(html.includes('fp63-special-choice selected'),'Selection is visibly highlighted.');
v.feedback(lesson.id,false);
assert.equal(v.chosen,null,'A wrong server result clears the draft for a retry.');
html=v.render(a,lesson,{completed:false});
assert(html.includes('data-fp41-check disabled'),'After wrong answer user must choose again.');
v.feedback(lesson.id,true);
html=v.render(a,lesson,{completed:true});
assert(html.includes('data-fp41-finish')&&html.includes('Lektion abschließen'),'Verified lesson uses finish button.');
assert(!html.includes('data-fp41-check'),'No second, misleading server submission.');
console.log('V63 PASS: mobile portfolio header, two profile switches, plain tones, streak/level/artifact celebrations, explicit specialist choice/check/finish, idempotent server-owned award choreography.');
