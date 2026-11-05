import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=p=>fs.readFileSync(p,'utf8');
const editorial=JSON.parse(read('data/editorial-core-v43.json'));
const legacy=JSON.parse(read('data/daily.json'));
const briefing=JSON.parse(read('data/market-briefing.json'));
const ideas=JSON.parse(read('data/ideas.json'));
assert.equal(briefing.schema_version,1);
assert(briefing.highlights.length>=3);
assert(briefing.highlights.every(h=>legacy.stories.some(st=>st.id===h.story_id)||editorial.stories.some(st=>st.id===h.story_id)));
assert(ideas.ideas.length>=2);
const catalog=JSON.parse(read('data/specializations-v41.json'));
assert(JSON.parse(read('version.json')).version>=59,'App version must not regress below V59');
assert(editorial.stories.length>=10);
assert(editorial.stories.every(s=>s.article?.sections?.length>=4));
const index=read('index.html');
assert(/app\.js\?v=(?:8[2-9]|9\d|[1-9]\d\d)/.test(index),'Latest app routing bundle must load on iPhone');
assert(index.includes('lesson-view-v46.js?v=80'),'Unchanged lesson view must load');
for(const resource of ['home-v48.js','home-v48.css','market-v34.js'])assert(new RegExp(resource.replaceAll('.','\\.')+'\\?v=\\d+').test(index),'Missing versioned '+resource);
assert(read('app.js').includes("state.view==='home'&&window.FinanzPilotHome"));
assert(read('app.js').includes("FinanzPilotHome?.bind(root)"));
assert(read('market-v34.js').includes("function openEditorialStory(story)"));
const practices=catalog.skills.flatMap(x=>x.lessons).filter(x=>x.practice);
assert.equal(practices.length,46);
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
const webFetch=async url=>({ok:true,json:async()=>url.includes('editorial-core')?editorial:url.includes('market-briefing')?briefing:url.includes('ideas.json')?ideas:legacy});
const context=vm.createContext({window:win,document:doc,state,fetch:webFetch,URL:testUrl,Intl,Date,Math,console,Number});
vm.runInContext(read('market-v34.js'),context);
vm.runInContext(read('home-v48.js'),context);
await win.FinanzPilotHome.load(true);
assert(win.FinanzPilotHome.stories.length>=10);
assert(win.FinanzPilotHome.stories.every(x=>x.article?.sections.length>=4));
let page=win.FinanzPilotHome.render();
assert(page.includes('MARKTBRIEFING'),'Start must open with sourced market briefing');
assert(page.includes(briefing.title),'Briefing headline must be editorial data, not an invented live headline');
assert(page.includes('Die wichtigsten Entwicklungen'),'Show brief market developments');
assert(page.includes('Aktien auf dem Radar'),'Discoverable stock ideas');
assert(page.includes('AIXTRON')||page.includes('KION'),'Existing researched ideas must be visible');
assert(!page.includes('fp48-stats')&&!page.includes('fp48-circle'),'Remove oversized XP and progress dashboard from Start');
assert(!page.includes('Alle Nachrichten öffnen'),'Start should not duplicate the whole news feed');
assert(page.includes('Lernen fortsetzen'),'Keep one compact learning access point');
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
console.log('v81 Start: sourced briefing, short market overview, research ideas, watchlist, native full-article reader and no duplicate statistics validated.');
