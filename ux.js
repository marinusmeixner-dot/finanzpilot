/* FinanzPilot Navigation v6: klare Bereiche, letzter Ort, Kurzwege, Anzeige der Version. */
'use strict';
(()=>{
 const KEY='finanzpilot_navigation_v6';
 const VIEWS=new Set(['home','learn','markets','academy','academymarket','research','glossary','progress','foundations','academycourse','labcase','lesson']);
 const LABEL={home:'Start',learn:'Lernpfad',markets:'Marktüberblick',academy:'Intensivkurse',academycourse:'Kurs bearbeiten',academymarket:'Markturteil',research:'Aktienanalysen',glossary:'Finanzlexikon',progress:'Fortschritt',foundations:'Grundlagen',labcase:'Fallstudie',lesson:'Lektion'};
 const clean=v=>VIEWS.has(v)?v:'home';
 const resumeView=()=>last.resume||(last.view&&last.view!=='home'?last.view:null);
 const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
 const load=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}};
 let prevView='home',last=load(),scrollTimer=null,restoring=false;
 const group=v=>['lesson','labcase','foundations','learn'].includes(v)?'learn':['academy','academycourse'].includes(v)?'academy':v;
 const store=(view,scroll)=>{if(restoring)return;try{const old=load();const data={...old,view:clean(view),resume:view==='home'?old.resume:clean(view),scroll:Math.max(0,Math.floor(scroll||0)),updated_at:Date.now()};localStorage.setItem(KEY,JSON.stringify(data));}catch{}};
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
  if(typeof state==='undefined')return;
  const dest=clean(v);
  if(dest==='academycourse'&&!window.FinanzPilotAcademy){return}
  if(dest==='lesson'||dest==='labcase')v='learn';
  closeDrawer();chooseView(dest==='academycourse'?'academy':dest);store(dest,0);updateMenu();
 }
 function init(){
  if(typeof state==='undefined')return;
  if(window.FinanzPilotLab){
    window.FinanzPilotLab.renderHome=()=>{
      const stories=(typeof daily!=='undefined'&&Array.isArray(daily.stories))?daily.stories:[];
      const news=stories.slice(0,2).map(x=>`<article class="news-item"><div class="news-meta"><span>${esc(x.source||'Quelle')}</span><span>${esc(x.published||'')}</span></div><h3>${esc(x.title||'Meldung')}</h3><p>${esc(x.why||'')}</p></article>`).join('');
      return `<div class="fp-home-main"><div class="eyebrow">DEINE FINANZ-AKADEMIE</div><h1>Verstehen. Analysieren.<br>Selbst entscheiden.</h1><p>Ein klarer Lernpfad, echte Unternehmensanalysen und Marktübungen. Deinen zuletzt genutzten Bereich findest du jederzeit wieder.</p><div class="fp-highlight"><b>Vertiefende Kurse</b><b>Reale Geschäftszahlen</b><b>Marktanalysen</b></div></div><div class="fp-resume" id="fp-home-resume" ${!(resumeView())?'hidden':''}><div><b>Deine letzte Stelle</b><div><small>${esc(LABEL[resumeView()]||'Lernpfad')}</small></div></div><button type="button" data-hub-continue>Weiterlernen →</button></div><div class="section-title"><h2>Wohin möchtest du?</h2><small>Die Bereiche sind voneinander getrennt</small></div><div class="fp-home-hub"><button class="fp-home-link" data-hub-view="learn"><span class="fp-hub-icon">✧</span><b>Lernpfad & Fälle</b><small>Anspruchsvolle Übungen, Rechnen und Methoden</small></button><button class="fp-home-link" data-hub-view="academy"><span class="fp-hub-icon">▤</span><b>Intensivkurse</b><small>Aktien vollständig analysieren – Schritt für Schritt</small></button><button class="fp-home-link" data-hub-view="research"><span class="fp-hub-icon">⌁</span><b>Aktienanalysen</b><small>Unternehmen, Bewertungen und Geschäftsberichte</small></button><button class="fp-home-link" data-hub-view="markets"><span class="fp-hub-icon">◫</span><b>Märkte & News</b><small>Charts, Kursentwicklung, Nachrichten und Einschätzungen</small></button></div><div class="section-title"><h2>Aktuelle Meldungen</h2><small>Wichtige Themen, ohne den Start zu überladen</small></div><section class="card">${news||'<div class="empty">Sobald das Tagesupdate läuft, erscheinen hier die wichtigsten Nachrichten.</div>'}<button class="btn secondary" type="button" data-hub-view="markets" style="margin-top:15px">Zum Marktüberblick →</button></section>`;
    }
  }
  if(state.view==='home')render();
  document.getElementById('view-root')?.addEventListener('click',event=>{const b=event.target.closest('[data-hub-view],[data-hub-continue]');if(!b)return;if(b.hasAttribute('data-hub-continue'))route(resumeView()||'learn');else route(b.dataset.hubView)});

  document.querySelectorAll('[data-menu-open]').forEach(b=>b.addEventListener('click',()=>{document.body.classList.toggle('fp-menu-open');updateMenu()}));
  document.querySelectorAll('[data-menu-close]').forEach(b=>b.addEventListener('click',closeDrawer));
  document.querySelectorAll('[data-open-account]').forEach(b=>b.addEventListener('click',()=>{closeDrawer();document.getElementById('fp-account-button')?.click()}));
  document.getElementById('fp-back-last')?.addEventListener('click',()=>route(resumeView()||'learn'));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDrawer()});
  document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{closeDrawer();if(b.dataset.view){store(b.dataset.view,0);updateMenu()}}));
  const nav=load();const urlView=new URLSearchParams(location.hash.replace(/^#/,'')) .get('view');
  // Tiefe Kursschritte / Testfragen werden auf ihre übergeordneten Bereiche zurückgeführt.
  const proposed=clean(urlView||nav.view||'home');
  if(proposed!=='home'){
    const dest=['academycourse'].includes(proposed)?'academy':['labcase','lesson'].includes(proposed)?'learn':proposed;
    state.view=dest;render();
    if(nav.scroll>0&&dest===nav.view){restoring=true;requestAnimationFrame(()=>requestAnimationFrame(()=>{scrollTo(0,nav.scroll);restoring=false}))}
  }
  prevView=state.view;last=nav;
  const root=document.getElementById('view-root');
  if(root){new MutationObserver(()=>{if(typeof state==='undefined')return;const v=state.view;if(v!==prevView){prevView=v;store(v,0);last=load();}updateMenu()}).observe(root,{childList:true});}
  window.addEventListener('scroll',()=>{clearTimeout(scrollTimer);scrollTimer=setTimeout(()=>{if(typeof state==='undefined')return;store(state.view,scrollY)},250)},{passive:true});
  window.addEventListener('pagehide',()=>{if(typeof state!=='undefined')store(state.view,scrollY)});
  window.addEventListener('hashchange',()=>{const q=new URLSearchParams(location.hash.replace(/^#/,''));const v=q.get('view');if(v&&VIEWS.has(v)&&v!==state.view)route(v)});
  document.getElementById('fp-app-version')?.replaceChildren(document.createTextNode('Version 6.0 · 31.10.2026'));
  updateMenu();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
 window.FinanzPilotNavigation={route,updateMenu};
})();