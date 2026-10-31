(function navV15(){
 'use strict';
 const KEY='finanzpilot_navigation_v6';
 const LEARNING_VIEWS=new Set(['learnpath','concepts','training','skills','glossary','foundations','academy','academycourse','labcase']);
 const ROOT_VIEWS=new Set(['home','learn','markets','research','progress']);
 const MAIN=['home','learn','markets','research','progress'];
 const GROUPS={
 home:{label:'Start',links:[['home','Tagesübersicht','Dein täglicher FinanzPilot']]},
 learn:{label:'Lernen',description:'Kurse, Wissen und deine Fähigkeiten',links:[['learnpath','Lernpfad','Lektionen und tägliche Übungen'],['concepts','Begriffs-Akademie','Finanzthemen vom EBIT bis zum eigenen Kursziel verstehen'],['training','Praxis-Trainingslabor','Unternehmen analysieren und mit Zahlen rechnen'],['skills','Skillbaum','Fähigkeiten und neue Meisterschaften entdecken'],['glossary','Fachbegriffe und Lexikon','Begriffe nachschlagen und vertiefen'],['foundations','Grundlagenwissen','Zusammenhänge und Modelle verständlich erklärt']]},
 markets:{label:'Märkte',description:'News, Kurse, Indizes und eigene Einschätzungen',links:[['marketoverview','Marktüberblick','Nachrichten, Indizes und Charts analysieren'],['academymarket','Mein Markturteil','Marktentwicklungen bewerten und Schlussfolgerungen prüfen']]},
 research:{label:'Aktien',description:'Unternehmen recherchieren und fundiert bewerten',links:[['researchcatalog','Aktienanalysen','Umfassende Einzelaktien- und Unternehmensrecherchen'],['academy','Aktien-Intensivkurse','Vollständige Bewertungsprozesse Schritt für Schritt']]},
 progress:{label:'Profil',description:'Dein Fortschritt, Karriere und Sammlerstücke',links:[['learningstats','Lernfortschritt','Ergebnisse, Lernhistorie und tägliche Fortschritte'],['career','Analystenkarriere & Werkzeuge','Ränge, Beförderungen und Research-Tools'],['inventory','Inventar & Belohnungen','Forschungspunkte, Artefakte und Spezialmissionen'],['account','Konto & Synchronisierung','Anmelden und Fortschritt sichern']]}
 };
 const PARENT={home:'home',learn:'learn',lesson:'learn',labcase:'learn',glossary:'learn',foundations:'learn',skills:'learn',training:'learn',concepts:'learn',learnpath:'learn',markets:'markets',marketoverview:'markets',academymarket:'markets',research:'research',researchcatalog:'research',academy:'research',academycourse:'research',progress:'progress',learningstats:'progress',career:'progress',inventory:'progress',account:'progress'};
 const ICON={
  home:'<path d="m3 10 9-7 9 7v10H3z"/><path d="M9 20v-7h6v7"/>',
  learn:'<path d="m3 4 9-2 9 2v16l-9 2-9-2z"/><path d="M12 2v20"/><path d="m6 9 4 1m4 0 4-1"/>',
  markets:'<path d="M3 17l6-6 4 3 7-8"/><path d="M15 6h5v5"/>',
  research:'<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M7 16l3-4 3 2 4-6"/>',
  progress:'<circle cx="12" cy="8" r="4"/><path d="M5 21a7 7 0 0 1 14 0"/>',
  menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
  close:'<path d="M5 5l14 14M19 5 5 19"/>',
  arrow:'<path d="m9 18 6-6-6-6"/>'
 };
 const icon=(key,size=21)=>'<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(ICON[key]||ICON.arrow)+'</svg>';
 const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
 const load=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{return {}}};
 let inRoute=false,restoring=false,previous='home',restoreTicket=0;
 const rootOf=view=>PARENT[view]||'home';
 const label=view=>Object.values(GROUPS).flatMap(g=>g.links).find(x=>x[0]===view)?.[1]||GROUPS[rootOf(view)].label;
 function persist(view,y){
  if(restoring||!Object.prototype.hasOwnProperty.call(PARENT,view))return;
  try{
   const old=load(),positions={...(old.positions||{})};
   // Hauptseiten immer am Anfang beginnen; nur in Lektionen und Detailansichten scrollen wir weiter.
   const point=ROOT_VIEWS.has(view)?0:Math.max(0,Math.floor(Number(y)||0));
   positions[view]=point;
   const resume=LEARNING_VIEWS.has(view)?view:(LEARNING_VIEWS.has(old.resume)?old.resume:'learnpath');
   localStorage.setItem(KEY,JSON.stringify({...old,view,resume,positions,scroll:point,updated_at:Date.now()}));
  }catch{}
 }
 function restoreScroll(view,at=0){
  const ticket=++restoreTicket;
  const destination=ROOT_VIEWS.has(view)?0:Math.max(0,Number(at)||0);
  restoring=true;
  // Safari/Standalone can restore stale scroll after DOMContentLoaded; override it on the next two paint frames.
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
   if(ticket!==restoreTicket||state.view!==view){restoring=false;return}
   window.scrollTo(0,destination);
   requestAnimationFrame(()=>{
    if(ticket===restoreTicket&&state.view===view)window.scrollTo(0,destination);
    restoring=false;
   });
  }));
 }
 const isHub=v=>MAIN.includes(v)&&v!=='home';
 function renderHub(v){
  if(!isHub(v))return '';
  const g=GROUPS[v];
  return '<section class="fp-tab-hub"><div class="fp-tab-hub-intro"><div class="eyebrow">DEIN FINANZPILOT</div><h1>'+esc(g.label)+'</h1><p>'+esc(g.description)+'</p></div><div class="fp-tab-hub-list">'+g.links.map(([id,name,desc],i)=>
   '<button type="button" class="fp-tab-hub-item" '+(id==='account'?'data-section-account':'data-section-route="'+esc(id)+'"')+'><span class="fp-tab-hub-number">'+String(i+1).padStart(2,'0')+'</span><span class="fp-tab-hub-copy"><strong>'+esc(name)+'</strong><small>'+esc(desc)+'</small></span><span class="fp-tab-hub-chevron">'+icon('arrow',18)+'</span></button>'
  ).join('')+'</div></section>';
 }
 function build(){
  const side=document.querySelector('.sidebar');
  if(side)side.innerHTML='<div class="brand"><div class="brand-symbol">↗</div><div><b>FinanzPilot</b><small>WISSEN & ANALYSE</small></div></div><nav class="fp-side-main" aria-label="Hauptnavigation">'+MAIN.map(id=>
   '<button type="button" class="fp-main-link" data-section-main="'+id+'">'+icon(id,20)+'<span>'+GROUPS[id].label+'</span></button>'
  ).join('')+'</nav><div class="sidebar-bottom"><div class="small-heading">DEIN LERNSTAND</div><div class="side-level" id="side-level">Level 1</div><div class="progress-line"><span id="side-progress"></span></div><small id="side-xp">0 / 100 XP</small><small class="fp-version" id="fp-app-version">FinanzPilot v19</small></div>';
  const bottom=document.querySelector('.bottom-nav');
  if(bottom)bottom.innerHTML=MAIN.map(id=>'<button type="button" data-section-main="'+id+'" aria-label="'+GROUPS[id].label+'">'+icon(id,22)+'<small>'+GROUPS[id].label+'</small></button>').join('');
  const top=document.querySelector('.topbar');
  if(top){
   top.querySelector('.topbar-note')?.remove();
   top.querySelector('.mobile-logo')?.remove();
   top.querySelector('.fp-menu-trigger')?.remove();
   top.querySelector('.fp-topbar-left')?.remove();
   top.insertAdjacentHTML('afterbegin','<div class="fp-mobile-brand"><span class="fp-brand-mark">↗</span><b>FinanzPilot</b></div>');
   top.querySelector('.pill.muted')?.classList.add('fp-small-date');
   top.querySelector('.pill.streak')?.classList.add('fp-small-streak');
  }

 }
 function header(){
  const root=document.getElementById('view-root');if(!root)return;
  const group=rootOf(state.view),hub=(group===state.view);
  root.querySelector(':scope > .fp-route-header')?.remove();
  root.querySelector(':scope > .fp-context-tabs')?.remove();
  root.querySelector(':scope > .fp-section-bar')?.remove();
  const existing=root.querySelector(':scope > .fp-tab-crumb');
  if(hub)existing?.remove();
  else if(!existing||existing.dataset.view!==state.view){
   existing?.remove();const el=document.createElement('div');el.className='fp-tab-crumb';el.dataset.view=state.view;
   el.innerHTML='<button type="button" data-section-up="'+group+'">‹ '+esc(GROUPS[group].label)+'-Übersicht</button><span>'+esc(label(state.view))+'</span>';
   root.prepend(el);
  }
  document.querySelectorAll('[data-section-main]').forEach(b=>{const on=b.dataset.sectionMain===group;b.classList.toggle('active',on);if(on)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
 }
 function route(to,remember=true){
  if(inRoute||!Object.prototype.hasOwnProperty.call(PARENT,to))return;
  if(to==='account'){window.FinanzPilotCloud?.openLogin?.();return}
  if(to==='lesson'||to==='labcase')to='learnpath';
  const old=state.view;if(old===to){if(ROOT_VIEWS.has(to))restoreScroll(to,0);return}
  persist(old,window.scrollY);
  const pos=load().positions||{},y=ROOT_VIEWS.has(to)?0:Number(pos[to]||0);
  inRoute=true;previous=to;chooseView(to);header();
  if(remember)persist(to,y);
  const hash='#view='+encodeURIComponent(to);if(location.hash!==hash)history.replaceState(null,'',location.pathname+location.search+hash);
  inRoute=false;
  window.dispatchEvent(new Event('fp-navigation'));
  restoreScroll(to,y);
 }
 function init(){
  if(typeof state==='undefined')return;
  build();
  const saved=load();
  const hash=new URLSearchParams(location.hash.replace(/^#/,'')),chosen=hash.get('view');
  const initial=Object.prototype.hasOwnProperty.call(PARENT,chosen)?chosen:Object.prototype.hasOwnProperty.call(PARENT,saved.view)?saved.view:'home';
  if(initial!=='home'&&initial!=='account')chooseView(initial);
  previous=state.view;header();
  if(!location.hash||!hash.get('view'))history.replaceState(null,'',location.pathname+location.search+'#view='+encodeURIComponent(initial));
  restoreScroll(initial,ROOT_VIEWS.has(initial)?0:Number(saved.positions?.[initial]||0));
  document.addEventListener('click',ev=>{
   const t=ev.target.closest('[data-section-main],[data-section-route],[data-section-up],[data-section-account],[data-hub-view],[data-hub-continue],[data-view]');
   if(!t)return;
   if(t.matches('[data-section-account]')){ev.preventDefault();ev.stopImmediatePropagation();window.FinanzPilotCloud?.openLogin?.();return}
   if(t.matches('[data-hub-continue]')){ev.preventDefault();ev.stopImmediatePropagation();const target=load().resume;route(LEARNING_VIEWS.has(target)?target:'learnpath');return}
   const dest=t.dataset.sectionMain||t.dataset.sectionRoute||t.dataset.sectionUp||t.dataset.hubView||t.dataset.view;
   if(dest){ev.preventDefault();ev.stopImmediatePropagation();route(dest)}
  },true);
  const root=document.getElementById('view-root');
  if(root)new MutationObserver(()=>{
    if(typeof state==='undefined')return;
    if(state.view!==previous){previous=state.view;persist(state.view,ROOT_VIEWS.has(state.view)?0:(load().positions?.[state.view]||0))}
    header();
  }).observe(root,{childList:true});
  let scrollTimer=null;
  window.addEventListener('scroll',()=>{if(restoring)return;clearTimeout(scrollTimer);scrollTimer=setTimeout(()=>persist(state.view,window.scrollY),200)},{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)persist(state.view,window.scrollY)});
  window.addEventListener('pagehide',()=>persist(state.view,window.scrollY));
  window.addEventListener('hashchange',()=>{
   const dest=new URLSearchParams(location.hash.replace(/^#/,'')) .get('view');
   if(dest&&Object.prototype.hasOwnProperty.call(PARENT,dest)&&dest!==state.view)route(dest);
  });
  if(window.FinanzPilotLab){
    const oldHome=window.FinanzPilotLab.renderHome;
    window.FinanzPilotLab.renderHome=()=>{
     const candidate=load().resume;
     const resume=LEARNING_VIEWS.has(candidate)?candidate:null;
     const acts=MAIN.filter(id=>id!=='home').map(id=>{
      const d={learn:'Lektionen, Übungen und Skillentwicklung',markets:'Nachrichten, Indizes und Chartanalyse',research:'Unternehmen, Bewertungen und große Kurse',progress:'Karriere, Auszeichnungen und dein Konto'}[id];
      return '<button type="button" class="fp-hub-row" data-hub-view="'+id+'"><span class="fp-hub-row-icon">'+icon(id,22)+'</span><span class="fp-hub-row-text"><b>'+GROUPS[id].label+'</b><small>'+d+'</small></span><span class="fp-hub-arrow">'+icon('arrow',17)+'</span></button>';
     }).join('');
     let news='';
     try{const d=(typeof daily!=='undefined'&&daily&&Array.isArray(daily.stories))?daily.stories:(Array.isArray(window.FinanzPilotLatestNews)?window.FinanzPilotLatestNews:[]);news=d.slice(0,2).map(x=>'<article class="news-item"><div class="news-meta"><span>'+esc(x.source||'Quelle')+'</span><span>'+esc(x.published||'')+'</span></div><h3>'+esc(x.title)+'</h3><p>'+esc(x.why||'')+'</p></article>').join('')}catch{}
     return '<div class="fp-home-hero"><div class="eyebrow">DEIN FINANZTRAINING</div><h1>Wissen, das sich auszahlt.</h1><p>Schärfe dein Urteilsvermögen, verstehe Unternehmen und erreiche neue Skills.</p></div>'+
      (resume&&resume!=='home'?'<div class="fp-resume"><div><small>Letzter Lernort</small><b>'+esc(label(resume))+'</b></div><button type="button" data-hub-continue>Fortsetzen →</button></div>':'')+
      '<section class="fp-daily-actions"><div class="fp-section-row"><h2>Wohin möchtest du?</h2><span>Vier klar getrennte Bereiche</span></div><div class="fp-home-list">'+acts+'</div></section>'+
      '<section class="fp-home-news"><div class="fp-section-row"><h2>Marktüberblick</h2><button type="button" data-hub-view="markets" class="settings-btn">Alle Nachrichten →</button></div><div class="fp-home-news-list">'+(news||'<p class="fp-home-news-summary">Aktuelle Berichte, Indizes und Charts findest du im Markt-Tab.</p>')+'</div></section>';
    };
    if(state.view==='home')render();
  }
  header();
  window.FinanzPilotNavigation={route,renderHub,isHub,parentOf:rootOf,sections:GROUPS,restoreScroll};if(isHub(state.view))render();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
