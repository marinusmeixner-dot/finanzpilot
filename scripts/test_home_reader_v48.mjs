import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=p=>fs.readFileSync(p,'utf8');
const editorial=JSON.parse(read('data/editorial-core-v43.json'));
const legacy=JSON.parse(read('data/daily.json'));
const catalog=JSON.parse(read('data/specializations-v41.json'));
assert.equal(JSON.parse(read('version.json')).version,48);
assert(editorial.stories.length>=10);
assert(editorial.stories.every(s=>s.article?.sections?.length>=4));
const index=read('index.html');
for(const path of ['home-v48.js?v=48','home-v48.css?v=48','market-v34.js?v=48','app.js?v=48','lesson-view-v46.js?v=48'])assert(index.includes(path),path);
assert(read('app.js').includes("state.view==='home'&&window.FinanzPilotHome"));
assert(read('app.js').includes("FinanzPilotHome?.bind(root)"));
assert(read('market-v34.js').includes("function openEditorialStory(story)"));
const practices=catalog.skills.flatMap(x=>x.lessons).filter(x=>x.practice);
assert.equal(practices.length,24);
for(const l of practices)assert(Number.isFinite(l.practice.answer)&&Number.isFinite(l.practice.tolerance)&&l.practice.explanation.length>35);
assert(read('lesson-view-v46.js').includes('function feedback(lessonId,correct)'));
assert(read('learning-hub-v41.js').includes('FinanzPilotLessonView?.feedback?.(lesson,data.correct)'));
const events={},seen=[],win={
 addEventListener:(type,fn)=>events[type]=fn,dispatchEvent(){},
 render(){},FinanzPilotNavigation:{route:screen=>seen.push(screen)},
 FinanzPilotCloud:{user:null,paperClient:null},
 FinanzPilotStreak:{status:{day:1},open(){}},
 FinanzPilotProfile:{current:()=>({mastered:2,points:5,streak:1})},
 FinanzPilotJourney:{modules:[{id:'basic0',title:'Was ist ein Unternehmen?'},{id:'basic1',title:'Cashflow'}],completed:{basic0:Date.now()},firstIncomplete:()=>({id:'basic1',title:'Cashflow'}),start:()=>seen.push('journeycourse')},
 FinanzPilotStudy:{dueCount:()=>1}
};
const doc={readyState:'loading',addEventListener:(type,fn)=>events[type]=fn};
const state={view:'home'};
const testUrl=class{constructor(value){this.href=value;this.protocol=value.startsWith('https:')?'https:':'http:'}};
const webFetch=async url=>({ok:true,json:async()=>url.includes('editorial-core')?editorial:legacy});
const context=vm.createContext({window:win,document:doc,state,fetch:webFetch,URL:testUrl,Intl,Date,Math,console,Number});
vm.runInContext(read('market-v34.js'),context);
vm.runInContext(read('home-v48.js'),context);
await win.FinanzPilotHome.load(true);
assert(win.FinanzPilotHome.stories.length>=10);
assert(win.FinanzPilotHome.stories.every(x=>x.article?.sections.length>=4));
let page=win.FinanzPilotHome.render();
assert(page.includes('Weiter, wo du aufgehört hast'));
assert(page.includes('1 von 2 Grundlagenlektionen'));
assert(page.includes('1 fällige Wiederholungsfragen')||page.includes('1 bereits gelernte'));
assert(page.includes('data-fp48-read='));
assert(!page.includes('target="_blank"'));
const featured=win.FinanzPilotHome.stories[0];
let articleHandler;
const controls=[{dataset:{fp48Read:featured.id},addEventListener:(_,fn)=>articleHandler=fn}];
win.FinanzPilotHome.bind({querySelectorAll:selector=>selector==='[data-fp48-read]'?controls:[],querySelector:()=>null});
assert.equal(typeof articleHandler,'function');
articleHandler();
assert(seen.includes('marketarticle'),'Start news opens native in-app article');
const full=win.FinanzPilotMarkets.renderArticle();
assert(full.includes(featured.title));
assert(full.includes('Was du mitnehmen solltest'));
assert(full.includes('fp36-article-section'));
assert(!full.includes('Vollständiger Originalartikel hier nicht verfügbar'));
assert(win.FinanzPilotMarkets.openEditorialStory({title:'Incomplete',article:{sections:[]}})===false);
console.log('v48: Start progress, 10+ full editorial news, clickable native reader, no paywall links, 24 numeric lessons and server-feedback hook validated.');
