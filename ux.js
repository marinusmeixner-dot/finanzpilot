/* FinanzPilot Navigation v11: klare Bereiche, letzter Ort, Kurzwege, Anzeige der Version. */
'use strict';
(()=>{
 const KEY='finanzpilot_navigation_v6';
 const VIEWS=new Set(['home','learn','markets','academy','academymarket','research','glossary','progress','foundations','academycourse','labcase','lesson','skills']);
 const LABEL={home:'Start',learn:'Lernpfad',markets:'Marktüberblick',academy:'Intensivkurse',academycourse:'Kurs bearbeiten',academymarket:'Markturteil',research:'Aktienanalysen',glossary:'Finanzlexikon',progress:'Fortschritt',foundations:'Grundlagen',labcase:'Fallstudie',lesson:'Lektion',skills:'Skillbaum'};
 const clean=v=>VIEWS.has(v)?v:'home';
 const resumeView=()=>last.resume||(last.view&&last.view!=='home'?last.view:null);
 const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
 const load=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}};
 let prevView='home',last=load(),scrollTimer=null,restoring=false,routeBusy=false;
 const group=v=>['lesson','labcase','foundations','learn','glossary','skills'].includes(v)?'learn':['academy','academycourse'].includes(v)?'academy':v;
 const store=(view,scroll)=>{if(restoring)return;try{
   const old=load(),v=clean(view),positions={...(old.positions||{})};
   positions[v]=Math.max(0,Math.floor(Number(scroll)||0));
   const data={...old,view:v,resume:v==='home'?old.resume:v,positions,scroll:positions[v],updated_at:Date.now()};
   localStorage.setItem(KEY,JSON.stringify(data));last=data;
 }catch{}};
 function updateMenu(){
  if(typeof state==='undefined')return;
  const active=group(state.view);
  document.querySelectorAll('[data-view]').forEach(btn=>{let yes=btn.dataset.view===active;btn.classList.toggle('active',yes);if(yes)btn.setAttribute('aria-current','page');else btn.removeAttribute('aria-current')});
  const current=document.getElementById('fp-current-page');if(current)current.textContent=LABEL[state.view]||'Start';
  const continueBtn=document.getElementById('fp-back-last');if(continueBtn){continueBtn.hidden=!(resumeView()&&state.view==='home');continueBtn.textContent=`Weiter bei: ${LABEL[resumeView()]||'Lernpfad'} →`;}
  document.querySelectorAll('[data-menu-open]').forEach(el=>el.setAttribute('aria-expanded',String(document.body.classList.contains('fp-menu-open'))));
 }
 function closeDrawer(){document.body.classList.remove('fp-menu-open');updateMenu();}
 function route(v){
  if(typeof state==='undefined'||routeBusy)return;
  let dest=clean(v);
  if(dest==='lesson'||dest==='labcase')dest='learn';
  if(dest==='academycourse'&&!window.FinanzPilotAcademy)dest='academy';
  const old=state.view;
  store(old,window.scrollY);
  const targetY=Number(load().positions?.[dest]||0);
  routeBusy=true;
  closeDrawer();
  chooseView(dest);
  store(dest,targetY);
  routeBusy=false;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{restoring=true;window.scrollTo({top:targetY,behavior:'instant'});restoring=false}));
  updateMenu();
 }
 const NAV={
  learn:[['Lernpfad','learn'],['Skillbaum','skills'],['Intensivkurse','academy'],['Fachwissen','glossary']],
  academy:[['Aktienkatalog','research'],['Intensivkurse','academy'],['Eigene Marktthese','academymarket']],
  research:[['Aktienkatalog','research'],['Intensivkurse','academy'],['Eigene Marktthese','academymarket']],
  markets:[['Marktüberblick','markets'],['Mein Markturteil','academymarket']],
  progress:[['Lernfortschritt','progress'],['Konto','account']]
 };
 function tabsFor(view){return ['learn','lesson','labcase','glossary','foundations','skills'].includes(view)?NAV.learn:['academy','academycourse','research'].includes(view)?NAV.academy:['markets','academymarket'].includes(view)?NAV.markets:view==='progress'?NAV.progress:null}
 function decorate(){
  const root=document.getElementById('view-root');
  if(!root||typeof state==='undefined')return;
  const tabs=tabsFor(state.view);
  if(!tabs)return;
  let el=root.querySelector(':scope > .fp-context-tabs');
  if(!el){
    el=document.createElement('nav');el.className='fp-context-tabs';el.setAttribute('aria-label','Unterbereiche');
    root.prepend(el);
  }
  const key=tabs.map(x=>x.join(':')).join('|')+':'+state.view;
  if(el.dataset.renderKey===key)return;
  el.dataset.renderKey=key;
  el.innerHTML=tabs.map(([label,dest])=>`<button type="button" data-fp-tab="${dest}" class="${dest===state.view?'active':''}">${label}</button>`).join('');
 }
  function ensureStructure(){
  // Das HTML der bestehenden GitHub-Pages-App kann bei Cache-Updates noch alt sein.
  // Menü auf der Client-Seite bauen: keine persönlichen Daten, keine Abhängigkeit von DOM-Versionen.
  if(document.querySelector('.fp-drawer'))return;
  const sidebar=document.querySelector('.sidebar');
  if(sidebar)sidebar.innerHTML=`
    <div class="brand"><div class="brand-symbol">↗</div><div><b>FinanzPilot</b><small>DEIN WISSENSVORSPRUNG</small></div></div>
    <nav aria-label="Hauptbereiche">
      <div class="fp-nav-group"><div class="fp-nav-label">ÜBERSICHT</div><button class="nav-item active" data-view="home"><span>⌂</span> Startseite</button></div>
      <div class="fp-nav-group"><div class="fp-nav-label">LERNEN</div><button class="nav-item" data-view="learn"><span>✧</span> Lernpfad & Fälle</button><button class="nav-item" data-view="skills"><span>❖</span> Skillbaum & Meisterschaft</button><button class="nav-item" data-view="academy"><span>▤</span> Intensivkurse</button><button class="nav-item" data-view="glossary"><span>≡</span> Fachwissen & Lexikon</button></div>
      <div class="fp-nav-group"><div class="fp-nav-label">ANALYSIEREN</div><button class="nav-item" data-view="markets"><span>⌁</span> Marktüberblick</button><button class="nav-item" data-view="research"><span>◈</span> Aktienanalysen</button><button class="nav-item" data-view="academymarket"><span>◉</span> Mein Markturteil</button></div>
      <div class="fp-nav-group"><div class="fp-nav-label">DEIN BEREICH</div><button class="nav-item" data-view="progress"><span>▥</span> Lernfortschritt</button><button class="fp-side-aux" data-open-account type="button">Konto & Synchronisierung</button></div>
    </nav><div class="sidebar-bottom"><div class="small-heading">DEIN LERNSTAND</div><div class="side-level" id="side-level">Level 1 · Einsteiger</div><div class="progress-line"><span id="side-progress"></span></div><small id="side-xp">0 / 100 XP bis Level 2</small><div class="privacy-tag">Ohne Konto lokal · mit Konto synchronisiert</div><small class="fp-version" id="fp-app-version">Version 11.0</small></div>`;
  const bottom=document.querySelector('.bottom-nav');
  if(bottom)bottom.innerHTML=`<button data-view="home" class="active">⌂<small>Start</small></button><button data-view="learn">✧<small>Lernen</small></button><button data-view="markets">⌁<small>Märkte</small></button><button data-view="research">◈<small>Aktien</small></button><button data-view="progress">◉<small>Profil</small></button>`;
  const top=document.querySelector('.topbar');
  if(top){top.querySelector('.topbar-note')?.remove();top.querySelector('.mobile-logo')?.remove();top.insertAdjacentHTML('afterbegin',`<button class="fp-menu-trigger" type="button" data-menu-open aria-label="Menü öffnen" aria-expanded="false">☰</button><div class="mobile-logo">↗ <b>FinanzPilot</b><small style="font-size:10px;color:#a1bbc5;margin-left:5px">v11</small></div><div class="fp-topbar-left"><div class="fp-top-location"><span class="fp-location-root">FinanzPilot / </span><span id="fp-current-page">Start</span></div><small class="fp-version">LERNEN · ANALYSIEREN · VERSTEHEN</small></div>`)}
  document.body.insertAdjacentHTML('beforeend',`<div class="fp-menu-backdrop" data-menu-close></div><aside class="fp-drawer" aria-label="Alle Bereiche"><div class="fp-drawer-header"><b>FinanzPilot · Menü</b><button class="fp-drawer-close" type="button" data-menu-close aria-label="Menü schließen">×</button></div><div class="fp-drawer-nav"><div class="fp-nav-label">ÜBERSICHT</div><button class="nav-item" data-view="home">Startseite</button><div class="fp-nav-label">LERNEN</div><button class="nav-item" data-view="learn">Lernpfad & Fallstudien</button><button class="nav-item" data-view="skills">Verzweigter Skillbaum</button><button class="nav-item" data-view="academy">Intensivkurse</button><button class="nav-item" data-view="glossary">Fachwissen & Lexikon</button><div class="fp-nav-label">ANALYSIEREN</div><button class="nav-item" data-view="markets">Märkte & Charts</button><button class="nav-item" data-view="research">Aktienanalysen</button><button class="nav-item" data-view="academymarket">Eigenes Markturteil</button><div class="fp-nav-label">DEIN BEREICH</div><button class="nav-item" data-view="progress">Fortschritt & Ergebnisse</button><button class="nav-item" data-open-account>Konto & Synchronisierung</button></div></aside>`);
 }
 function init(){
  if(typeof state==='undefined')return;
  ensureStructure();
  if(window.FinanzPilotLab){
    window.FinanzPilotLab.renderHome=()=>{
      const stories=(typeof daily!=='undefined'&&Array.isArray(daily.stories))?daily.stories:[];
      const news=stories.slice(0,2).map(x=>`<article class="news-item"><div class="news-meta"><span>${esc(x.source||'Quelle')}</span><span>${esc(x.published||'')}</span></div><h3>${esc(x.title||'Meldung')}</h3><p>${esc(x.why||'')}</p></article>`).join('');
      return '<section class="fp-home-hero"><div class="eyebrow">FINANZPILOT · DEINE AKADEMIE</div><h1>Dein nächster Schritt zählt.</h1><p>Analysiere Unternehmen, entdecke neue Fähigkeiten und verstehe die Märkte. Alles an einem klaren Ort.</p></section>'+
      '<div class="fp-resume" '+(!resumeView()?'hidden':'')+'><div><small>Zuletzt geöffnet</small><b>'+esc(LABEL[resumeView()]||'Kursübersicht')+'</b></div><button type="button" data-hub-continue>Fortsetzen →</button></div>'+
      '<section class="fp-daily-actions"><div class="fp-section-row"><h2>Deine Akademie</h2><span>Wähle deinen Weg</span></div>'+
      '<div class="fp-home-list">'+[
        ['✧','Lernpfad','Lektionen, Fälle und Wiederholungen','learn'],
        ['❖','Skillbaum','Verzweigte Fähigkeiten und Meisterprüfungen','skills'],
        ['▤','Intensivkurse','Aktien vollständig bewerten','academy'],
        ['◈','Aktienresearch','Unternehmen und Zahlen analysieren','research'],
        ['⌁','Märkte & Charts','Aktuelle Nachrichten und Kursverläufe','markets'],
        ['≡','Fachwissen','Begriffe anhand echter Beispiele verstehen','glossary']
      ].map(x=>'<button class="fp-hub-row" data-hub-view="'+x[3]+'"><span class="fp-hub-row-icon">'+x[0]+'</span><span class="fp-hub-row-text"><b>'+x[1]+'</b><small>'+x[2]+'</small></span><span class="fp-hub-arrow">›</span></button>').join('')+'</div></section>'+
      '<section class="fp-home-news"><div class="fp-section-row"><h2>Das bewegt die Märkte</h2><button data-hub-view="markets" class="settings-btn">Alle News →</button></div><div class="fp-home-news-list">'+(news||'<p>Neue Nachrichten erscheinen nach dem nächsten Update.</p>')+'</div></section>';
    }
  }
  if(state.view==='home')render();decorate();
  document.getElementById('view-root')?.addEventListener('click',event=>{const b=event.target.closest('[data-hub-view],[data-hub-continue]');if(!b)return;if(b.hasAttribute('data-hub-continue'))route(resumeView()||'learn');else route(b.dataset.hubView)});

  document.querySelectorAll('[data-menu-open]').forEach(b=>b.addEventListener('click',()=>{document.body.classList.toggle('fp-menu-open');updateMenu()}));
  document.querySelectorAll('[data-menu-close]').forEach(b=>b.addEventListener('click',closeDrawer));
  document.querySelectorAll('[data-open-account]').forEach(b=>b.addEventListener('click',()=>{closeDrawer();document.getElementById('fp-account-button')?.click()}));
  document.getElementById('fp-back-last')?.addEventListener('click',()=>route(resumeView()||'learn'));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDrawer()});
  document.addEventListener('click',event=>{const btn=event.target.closest('[data-fp-tab],[data-view]');
    if(!btn)return;
    event.preventDefault();event.stopImmediatePropagation();
    const target=btn.dataset.fpTab||btn.dataset.view;
    if(target==='account'){document.getElementById('fp-account-button')?.click();return}
    route(target);
  },true);
  const nav=load();const urlView=new URLSearchParams(location.hash.replace(/^#/,'')) .get('view');
  // Tiefe Kursschritte / Testfragen werden auf ihre übergeordneten Bereiche zurückgeführt.
  const proposed=clean(urlView||nav.view||'home');
  if(proposed!=='home'){
    const dest=['labcase','lesson'].includes(proposed)?'learn':proposed;
    state.view=dest;render();
    const savedY=Number(nav.positions?.[dest]??(dest===nav.view?nav.scroll:0)??0);if(savedY>0){restoring=true;requestAnimationFrame(()=>requestAnimationFrame(()=>{scrollTo(0,savedY);restoring=false}))}
  }
  prevView=state.view;last=nav;
  const root=document.getElementById('view-root');
  if(root){new MutationObserver(()=>{if(typeof state==='undefined')return;const v=state.view;if(v!==prevView){prevView=v;const previous=load().positions?.[v]||0;store(v,previous)}decorate();updateMenu()}).observe(root,{childList:true});}
  window.addEventListener('scroll',()=>{clearTimeout(scrollTimer);scrollTimer=setTimeout(()=>{if(typeof state==='undefined')return;store(state.view,scrollY)},250)},{passive:true});
  window.addEventListener('pagehide',()=>{if(typeof state!=='undefined')store(state.view,scrollY)});
  window.addEventListener('hashchange',()=>{const q=new URLSearchParams(location.hash.replace(/^#/,''));const v=q.get('view');if(v&&VIEWS.has(v)&&v!==state.view)route(v)});
  document.getElementById('fp-app-version')?.replaceChildren(document.createTextNode('Version 11.0 · 31.10.2026'));
  updateMenu();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
 window.FinanzPilotNavigation={route,updateMenu};
})();