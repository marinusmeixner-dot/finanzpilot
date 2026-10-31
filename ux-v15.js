(function navV15(){
 'use strict';
 const KEY='finanzpilot_navigation_v6';
 const MAIN=['home','learn','markets','research','progress'];
 const GROUPS={
  home:{label:'Start',links:[['home','Tagesübersicht','Weitermachen, neue Inhalte und Tagesnachrichten']]},
  learn:{label:'Lernen',links:[['learn','Lernpfad','Lerne in aufeinander aufbauenden Lektionen'],['training','Trainingslabor','Anspruchsvolle Praxisfälle mit Rechnungen'],['skills','Skillbaum','Fertigkeiten, Abhängigkeiten und Meisterprüfungen'],['glossary','Fachbegriffe','Finanzsprache und wichtige Konzepte verstehen'],['foundations','Grundlagenwissen','Grundwissen für vertiefende Kurse']]},
  markets:{label:'Märkte',links:[['markets','Marktüberblick','Aktuelle Nachrichten, Indizes und Charts'],['academymarket','Mein Markturteil','Eigene Schlüsse ziehen und vergleichen']]},
  research:{label:'Aktien',links:[['research','Aktienkatalog','Unternehmen und Analysen entdecken'],['academy','Intensivkurse','Vollständige Unternehmens- und Bewertungsprozesse']]},
  progress:{label:'Profil',links:[['progress','Lernfortschritt','Deine Ergebnisse und Lernhistorie'],['career','Analystenkarriere','Ränge und freigeschaltete Research-Werkzeuge'],['inventory','Inventar & Belohnungen','Forschungspunkte, Items und Spezialwege'],['account','Konto & Datensicherung','Google-Login, Datenschutz und Fortschrittssync']]}
 };
 const PARENT={home:'home',learn:'learn',lesson:'learn',labcase:'learn',glossary:'learn',foundations:'learn',skills:'learn',training:'learn',markets:'markets',academymarket:'markets',research:'research',academy:'research',academycourse:'research',progress:'progress',career:'progress',inventory:'progress',account:'progress'};
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
 let inRoute=false,restoring=false,previous='home',menuOpen=false;
 const rootOf=view=>PARENT[view]||'home';
 const label=view=>Object.values(GROUPS).flatMap(g=>g.links).find(x=>x[0]===view)?.[1]||GROUPS[rootOf(view)].label;
 function persist(view,y){
  if(restoring)return;
  try{const x=load(),pos={...(x.positions||{})};
   pos[view]=Math.max(0,Math.floor(Number(y)||0));
   localStorage.setItem(KEY,JSON.stringify({...x,view,resume:view==='home'?x.resume:view,positions:pos,scroll:pos[view],updated_at:Date.now()}));
  }catch{}
 }
 function closeMenu(){
  const dlg=document.getElementById('fp-section-overlay');
  if(dlg){dlg.hidden=true;dlg.setAttribute('aria-hidden','true')}
  menuOpen=false;document.body.classList.remove('fp-section-is-open');
 }
 function menu(){
  const group=rootOf(state.view),data=GROUPS[group],dlg=document.getElementById('fp-section-overlay');
  if(!dlg)return;
  dlg.querySelector('[data-section-title]').textContent=data.label+' · Bereiche';
  dlg.querySelector('[data-section-intro]').textContent='Wähle einen Bereich. Alles hier gehört zum Tab „'+data.label+'“.';
  dlg.querySelector('[data-section-list]').innerHTML=data.links.filter(x=>x[0]!=='account').map(([view,name,description])=>
   '<button type="button" class="fp-section-option '+(view===state.view?'selected':'')+'" data-section-route="'+esc(view)+'"><span class="fp-section-text"><strong>'+esc(name)+'</strong><small>'+esc(description)+'</small></span><span class="fp-section-arrow">'+icon('arrow',18)+'</span></button>'
  ).join('')+(group==='progress'?'<button type="button" class="fp-section-option" data-section-account><span class="fp-section-text"><strong>Konto & Datensicherung</strong><small>Google-Anmeldung, automatische Synchronisierung und Sicherung</small></span><span class="fp-section-arrow">'+icon('arrow',18)+'</span></button>':'');
  dlg.hidden=false;dlg.setAttribute('aria-hidden','false');menuOpen=true;document.body.classList.add('fp-section-is-open');
  dlg.querySelector('[data-section-close]')?.focus();
 }
 function build(){
  const side=document.querySelector('.sidebar');
  if(side)side.innerHTML='<div class="brand"><div class="brand-symbol">↗</div><div><b>FinanzPilot</b><small>WISSEN & ANALYSE</small></div></div><nav class="fp-side-main" aria-label="Hauptnavigation">'+MAIN.map(id=>
   '<button type="button" class="fp-main-link" data-section-main="'+id+'">'+icon(id,20)+'<span>'+GROUPS[id].label+'</span></button>'
  ).join('')+'</nav><div class="sidebar-bottom"><div class="small-heading">DEIN LERNSTAND</div><div class="side-level" id="side-level">Level 1</div><div class="progress-line"><span id="side-progress"></span></div><small id="side-xp">0 / 100 XP</small><small class="fp-version" id="fp-app-version">FinanzPilot v15</small></div>';
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
  document.body.insertAdjacentHTML('beforeend',
   '<div id="fp-section-overlay" class="fp-section-overlay" role="presentation" hidden aria-hidden="true"><section class="fp-section-sheet" role="dialog" aria-modal="true" aria-labelledby="fp-section-title"><div class="fp-section-header"><div><small>DEINE NAVIGATION</small><h2 data-section-title id="fp-section-title">Bereiche</h2></div><button type="button" data-section-close aria-label="Menü schließen">'+icon('close',22)+'</button></div><p data-section-intro></p><div class="fp-section-list" data-section-list></div></section></div>');
 }
 function header(){
  const root=document.getElementById('view-root');if(!root)return;
  let head=root.querySelector(':scope > .fp-section-bar');
  if(!head){head=document.createElement('div');head.className='fp-section-bar';root.prepend(head)}
  const main=rootOf(state.view),isRoot=main===state.view;
  const html='<div class="fp-section-position"><small>'+esc(GROUPS[main].label)+'</small><strong>'+esc(label(state.view))+'</strong></div><button type="button" class="fp-section-open" data-section-open aria-label="Bereiche innerhalb '+GROUPS[main].label+' öffnen">'+icon('menu',18)+' <span>Bereiche</span></button>'+
   (!isRoot?'<button type="button" class="fp-section-up" data-section-up="'+main+'" aria-label="Zur '+GROUPS[main].label+'-Übersicht">‹ '+esc(GROUPS[main].label)+'</button>':'');
  if(head.innerHTML!==html)head.innerHTML=html;
  root.querySelector(':scope > .fp-route-header')?.remove();
  root.querySelector(':scope > .fp-context-tabs')?.remove();
  document.querySelectorAll('[data-section-main]').forEach(b=>{
   const active=b.dataset.sectionMain===main;
   b.classList.toggle('active',active);
   if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
  });
 }
 function route(to,remember=true){
  if(inRoute||!Object.prototype.hasOwnProperty.call(PARENT,to))return;
  if(to==='account'){window.FinanzPilotCloud?.openLogin?.();return}
  if(to==='lesson'||to==='labcase')to='learn';
  const old=state.view;if(old===to){closeMenu();return}
  persist(old,window.scrollY);
  const pos=load().positions||{},y=Number(pos[to]||0);
  inRoute=true;closeMenu();chooseView(to);header();
  if(remember)persist(to,y);
  const hash='#view='+encodeURIComponent(to);if(location.hash!==hash)history.replaceState(null,'',location.pathname+location.search+hash);
  inRoute=false;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{restoring=true;window.scrollTo({top:y,behavior:'instant'});restoring=false}));
 }
 function init(){
  if(typeof state==='undefined')return;
  build();
  const saved=load();
  const hash=new URLSearchParams(location.hash.replace(/^#/,'')),chosen=hash.get('view');
  const initial=Object.prototype.hasOwnProperty.call(PARENT,chosen)?chosen:Object.prototype.hasOwnProperty.call(PARENT,saved.view)?saved.view:'home';
  if(initial!=='home'&&initial!=='account')chooseView(initial);
  previous=state.view;header();
  const y=Number(saved.positions?.[initial]||0);if(y>0)requestAnimationFrame(()=>requestAnimationFrame(()=>window.scrollTo(0,y)));
  document.addEventListener('click',ev=>{
   const t=ev.target.closest('[data-section-main],[data-section-open],[data-section-close],[data-section-route],[data-section-up],[data-section-account],[data-hub-view],[data-hub-continue],[data-view]');
   if(!t)return;
   if(t.matches('[data-section-open]')){ev.preventDefault();ev.stopImmediatePropagation();menu();return}
   if(t.matches('[data-section-close]')){ev.preventDefault();ev.stopImmediatePropagation();closeMenu();return}
   if(t.matches('[data-section-account]')){ev.preventDefault();ev.stopImmediatePropagation();closeMenu();window.FinanzPilotCloud?.openLogin?.();return}
   if(t.matches('[data-hub-continue]')){ev.preventDefault();ev.stopImmediatePropagation();route(saved.resume||'learn');return}
   const dest=t.dataset.sectionMain||t.dataset.sectionRoute||t.dataset.sectionUp||t.dataset.hubView||t.dataset.view;
   if(dest){ev.preventDefault();ev.stopImmediatePropagation();route(dest)}
  },true);
  const dlg=document.getElementById('fp-section-overlay');
  dlg?.addEventListener('click',ev=>{if(ev.target===dlg)closeMenu()});
  document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&menuOpen)closeMenu()});
  const root=document.getElementById('view-root');
  if(root)new MutationObserver(()=>{
    if(typeof state==='undefined')return;
    if(state.view!==previous){const old=previous;previous=state.view;persist(old,load().positions?.[old]||0)}
    header();
  }).observe(root,{childList:true});
  let scrollTimer=null;
  window.addEventListener('scroll',()=>{clearTimeout(scrollTimer);scrollTimer=setTimeout(()=>persist(state.view,window.scrollY),180)},{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)persist(state.view,window.scrollY)});
  window.addEventListener('pagehide',()=>persist(state.view,window.scrollY));
  window.addEventListener('hashchange',()=>{
   const dest=new URLSearchParams(location.hash.replace(/^#/,'')) .get('view');
   if(dest&&Object.prototype.hasOwnProperty.call(PARENT,dest)&&dest!==state.view)route(dest);
  });
  if(window.FinanzPilotLab){
    const oldHome=window.FinanzPilotLab.renderHome;
    window.FinanzPilotLab.renderHome=()=>{
     const resume=load().resume;
     const acts=MAIN.filter(id=>id!=='home').map(id=>{
      const d={learn:'Lektionen, Übungen und Skillentwicklung',markets:'Nachrichten, Indizes und Chartanalyse',research:'Unternehmen, Bewertungen und große Kurse',progress:'Karriere, Auszeichnungen und dein Konto'}[id];
      return '<button type="button" class="fp-hub-row" data-hub-view="'+id+'"><span class="fp-hub-row-icon">'+icon(id,22)+'</span><span class="fp-hub-row-text"><b>'+GROUPS[id].label+'</b><small>'+d+'</small></span><span class="fp-hub-arrow">'+icon('arrow',17)+'</span></button>';
     }).join('');
     let news='';
     try{const d=window.FinanzPilotLatestNews;if(Array.isArray(d))news=d.slice(0,2).map(x=>'<article class="news-item"><h3>'+esc(x.title)+'</h3><p>'+esc(x.why)+'</p></article>').join('')}catch{}
     return '<div class="fp-home-hero"><div class="eyebrow">DEIN FINANZTRAINING</div><h1>Wissen, das sich auszahlt.</h1><p>Schärfe dein Urteilsvermögen, verstehe Unternehmen und erreiche neue Skills.</p></div>'+
      (resume&&resume!=='home'?'<div class="fp-resume"><div><small>Letzter Lernort</small><b>'+esc(label(resume))+'</b></div><button type="button" data-hub-continue>Fortsetzen →</button></div>':'')+
      '<section class="fp-daily-actions"><div class="fp-section-row"><h2>Wohin möchtest du?</h2><span>Vier klar getrennte Bereiche</span></div><div class="fp-home-list">'+acts+'</div></section>'+
      '<section class="fp-home-news"><div class="fp-section-row"><h2>Marktüberblick</h2><button type="button" data-hub-view="markets" class="settings-btn">Zu den Nachrichten →</button></div><p class="fp-home-news-summary">Aktuelle Berichte, Indizes und Charts findest du im Markt-Tab.</p></section>';
    };
    if(state.view==='home')render();
  }
  header();
  window.FinanzPilotNavigation={route,openSectionMenu:menu,parentOf:rootOf};
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
