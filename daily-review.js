/* FinanzPilot v25 – private daily challenge inbox, RLS-backed next-day assessment. */
(function(){
 'use strict';
 const DATA='./data/daily-challenges.json';
 const DRAFT_KEY='finanzpilot_daily_review_drafts_v1';
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
 const berlin=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const safeUrl=s=>{try{const u=new URL(String(s||''));return u.protocol==='https:'?u.href:'#'}catch{return'#'}};
 const local=()=>{try{return JSON.parse(localStorage.getItem(DRAFT_KEY)||'{}')||{}}catch{return{}}};
 let data=null,items=[],drafts=local(),active=null,error='',busy=false,loaded=false,lastUser=null,latestUpdate=0,loadError='';
 const account=()=>window.FinanzPilotCloud?.user||null;
 const client=()=>window.FinanzPilotCloud?.reviewClient||null;
 const taskList=()=>Array.isArray(data?.tasks)?data.tasks:[];
 const task=id=>taskList().find(x=>x.id===id);
 const response=id=>items.find(x=>x.task_id===id);
 function update(){if(typeof state!=='undefined'&&state.view==='dailyreview')window.render?.()}
 function remember(id,txt){drafts[id]=String(txt||'').slice(0,5000);try{localStorage.setItem(DRAFT_KEY,JSON.stringify(drafts))}catch{}}
 function requestAccount(){window.FinanzPilotCloud?.openLogin?.()}
 async function refresh(){
   if(!account()||!client()){items=[];lastUser=null;update();return []}
   const who=account();if(lastUser&&lastUser!==who)items=[];
   lastUser=who;try{
    const {data:rows,error:e}=await client().from('fp_review_submissions').select('id,task_id,task_date,kind,task_title,question,rubric,answer,status,feedback,created_at,eligible_after,reviewed_at').order('created_at',{ascending:false}).limit(120);
    if(e)throw e;
    if(account()!==who)return items;
    items=rows||[];error='';latestUpdate=Date.now();update();return items;
   }catch(e){error='Statusabruf fehlgeschlagen: '+String(e.message||e);update();return items}
 }
 async function load(){if(loaded)return;loaded=true;
  try{const res=await fetch(DATA+'?t='+Date.now(),{cache:'no-store'});if(!res.ok)throw Error('HTTP '+res.status);
   const d=await res.json();if(d?.schema_version!==1||!Array.isArray(d.tasks))throw Error('Ungültiges Aufgabenformat');
   data=d;loadError='';
  }catch(e){loadError='Tagesaufgaben konnten nicht geladen werden: '+String(e.message||e)}
  update();await refresh();
 }
 const section=(label,contents)=>'<section class="fp-daily-review-block"><h2>'+esc(label)+'</h2>'+contents+'</section>';
 function feedbackBox(r){
  if(r.status==='pending')return '<div class="fp-daily-pending"><b>Bewertung ausstehend</b><p>Zur Prüfung ab '+esc(r.eligible_after||'dem folgenden Redaktionstag')+'. Falls die tägliche Aufgabe ausfällt, bleibt der Status ausstehend.</p></div>';
  if(r.status==='failed')return '<div class="fp-daily-pending"><b>Bewertung ausgefallen</b><p>Die Redaktion muss diese Einreichung erneut prüfen. Deine ursprüngliche Antwort bleibt gespeichert.</p></div>';
  const f=r.feedback||{};
  const lines=(key,title)=>Array.isArray(f[key])&&f[key].length?'<h3>'+esc(title)+'</h3><ul>'+f[key].map(t=>'<li>'+esc(t)+'</li>').join('')+'</ul>':'';
  return '<div class="fp-daily-feedback"><div class="fp-daily-feedback-head"><b>Fachliche Bewertung erhalten</b>'+(typeof f.score==='number'&&Number.isFinite(f.score)?'<strong>'+esc(f.score)+' / '+esc(f.max_score||20)+'</strong>':'')+'</div><p>'+esc(f.summary||'Der Prüfbericht wurde hinterlegt.')+'</p>'+
   lines('strengths','Was gelungen ist')+lines('errors','Was fachlich noch nicht stimmt')+lines('counterpoints','Gegenargumente')+lines('next_steps','Nächste Lernschritte')+
   (f.sample_answer?'<h3>Verbesserte Musterbegründung</h3><p>'+esc(f.sample_answer)+'</p>':'')+
   (Array.isArray(f.sources)&&f.sources.length?'<h3>Geprüfte Quellen</h3>'+f.sources.map(s=>{const url=safeUrl(typeof s==='string'?s:s.url);return url!=='#'?'<p><a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">'+esc((typeof s==='string'?s:s.title)||url)+'</a></p>':''}).join(''):'')+
   '<small>Geprüft am '+esc(r.reviewed_at?new Date(r.reviewed_at).toLocaleString('de-DE'):'unbekannt')+'. Bewertungen sind Lernfeedback, keine Anlageberatung.</small></div>';
 }
 function taskCard(t){
  const sub=response(t.id),stale=t.date!==berlin();
  return '<article class="fp-daily-card"><div class="fp-daily-card-meta"><span>'+esc(t.kind==='market'?'MARKTCHECK':t.kind==='research'?'AKTIEN-RESEARCH':'LERNCHALLENGE')+'</span><span>'+esc(t.date)+(stale?' · Archivaufgabe':'')+'</span></div>'+
   '<h2>'+esc(t.title)+'</h2><p>'+esc(t.context||'')+'</p><div class="fp-daily-question"><b>Deine Aufgabe</b><p>'+esc(t.question)+'</p></div>'+
   (t.source_url&&safeUrl(t.source_url)!=='#'?'<p class="fp-daily-source"><a href="'+esc(safeUrl(t.source_url))+'" target="_blank" rel="noopener noreferrer">Originalquelle: '+esc(t.source||'Bericht')+' ('+esc(t.source_date||t.date)+')</a></p>':'')+
   (sub?'<div class="fp-daily-submitted"><b>Deine Antwort vom '+esc(new Date(sub.created_at).toLocaleDateString('de-DE'))+'</b><p>'+esc(sub.answer)+'</p>'+feedbackBox(sub)+'<button type="button" class="btn secondary" data-daily-withdraw="'+esc(sub.id)+'">Einreichung und Bewertung löschen</button></div>':
    active===t.id?'<form data-daily-form="'+esc(t.id)+'" class="fp-daily-form"><label for="fp-daily-answer">Deine eigene Einschätzung (mindestens 60 Zeichen)</label><textarea id="fp-daily-answer" name="answer" rows="9" maxlength="5000" minlength="60" required placeholder="Zahlen und Quellen nennen, Rechnungen zeigen, These, Risiken und Widerlegung erklären …">'+esc(drafts[t.id]||'')+'</textarea><div class="fp-daily-rubric"><b>Prüfkriterien</b><ul>'+(t.rubric||[]).map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></div>'+
    '<label class="fp-daily-consent"><input type="checkbox" name="consent" required><span>Ich möchte meinen Text privat über mein angemeldetes FinanzPilot-Konto an die tägliche ChatGPT-Lernredaktion senden. Meine Antwort wird nur zur Bewertung gelesen, nicht auf GitHub veröffentlicht. Die Bewertung soll frühestens am folgenden Redaktionstag erscheinen.</span></label>'+
    '<div class="fp-daily-actions"><button class="btn" type="submit" '+(busy?'disabled':'')+'>Privat zur morgigen Bewertung einreichen</button><button type="button" class="btn secondary" data-daily-cancel>Entwurf behalten</button></div></form>':
   '<button type="button" class="btn secondary" data-daily-open="'+esc(t.id)+'">'+(drafts[t.id]?'Entwurf fortsetzen':'Freitextantwort verfassen')+' →</button>')+'</article>';
 }
 function render(){
  const pending=items.filter(x=>x.status==='pending').length,reviewed=items.filter(x=>x.status==='reviewed').length;
  return '<div class="fp-daily-review"><header class="fp-daily-hero"><span class="eyebrow">TÄGLICHES FINANZTRAINING</span><h1>Deine Tagesherausforderungen</h1><p>Aktuelle Unternehmenszahlen verstehen, eine eigene Marktthese begründen und am Folgetag private Rückmeldung bekommen. Kein kostenpflichtiger KI-Dienst in der App.</p><div class="fp-daily-stats"><span><b>'+pending+'</b> ausstehend</span><span><b>'+reviewed+'</b> bewertet</span><span><b>'+esc(data?.date||'–')+'</b> Redaktionsstand</span></div></header>'+
   (loadError?'<p class="fp-daily-error">'+esc(loadError)+'</p>':'')+
   (!account()?'<div class="fp-daily-notice"><b>Für die private Bewertung anmelden</b><p>Du kannst Aufgaben lesen und einen Entwurf speichern. Für die Abgabe und den vertraulichen Bewertungsverlauf ist ein FinanzPilot-Konto erforderlich.</p><button class="btn" type="button" data-daily-login>Anmelden →</button></div>':'<div class="fp-daily-notice"><b>Deine Antworten sind privat.</b> Die tägliche Redaktion sieht nur ausdrücklich eingereichte Texte. <button type="button" class="btn secondary" data-daily-refresh>Bewertungen abrufen</button></div>')+
   section('Aktuelle Aufgaben',taskList().length?taskList().map(taskCard).join(''):'<p>Aktuell kein veröffentlichtes Aufgabenpaket. Die Redaktion ergänzt es bei ihrem nächsten erfolgreichen Lauf.</p>')+
   section('Dein früheres Feedback',items.filter(x=>!task(x.task_id)).length?items.filter(x=>!task(x.task_id)).map(r=>'<article class="fp-daily-history"><div><b>'+esc(r.task_title)+'</b><span>'+esc(r.task_date)+'</span></div>'+feedbackBox(r)+'<button type="button" class="btn secondary" data-daily-withdraw="'+esc(r.id)+'">Einreichung und Feedback löschen</button></article>').join(''):'<p>Noch keine früheren Bewertungen. Eingereichte Aufgaben bleiben hier nach dem täglichen Themenwechsel sichtbar.</p>')+
   '<p class="fp-daily-privacy">Keine Antwort wird automatisch veröffentlicht. Einreichungen kannst du jederzeit löschen. Erhaltenes Feedback ist eine Lernhilfe – es ersetzt keine Anlageberatung. Die Bewertung am Folgetag ist nur möglich, wenn die tägliche Redaktion erfolgreich läuft.</p><p class="fp-daily-error" role="status" id="fp-daily-error">'+esc(error)+'</p></div>';
 }
 async function submit(t,answer){
  if(!client()||!account())throw Error('Bitte melde dich zuerst bei deinem FinanzPilot-Konto an.');
  if(!navigator.onLine)throw Error('Offline: Dein Entwurf bleibt auf dem Gerät.');
  if(!t||String(answer).trim().length<60||String(answer).trim().length>5000)throw Error('Die Antwort muss zwischen 60 und 5000 Zeichen enthalten.');
  const {data:row,error:e}=await client().from('fp_review_submissions').insert({task_id:t.id,task_date:t.date,kind:t.kind,task_title:t.title,question:t.question,rubric:t.rubric||[],answer:String(answer).trim(),consent:true}).select('id,status,task_id,eligible_after,created_at').single();
  if(e)throw e;
  delete drafts[t.id];try{localStorage.setItem(DRAFT_KEY,JSON.stringify(drafts))}catch{}
  active=null;await refresh();return row;
 }
 function useMarketOpinion(t,txt){
  const market=taskList().find(x=>x.kind==='market'&&(x.date===t?.date||x.title===t?.title))||taskList().find(x=>x.kind==='market');
  if(!market)return false;
  remember(market.id,txt);active=market.id;
  if(window.FinanzPilotNavigation?.route)window.FinanzPilotNavigation.route('dailyreview');
  else{state.view='dailyreview';update()}
  return true;
 }
 function bind(root=document){
  root.querySelector('[data-daily-login]')?.addEventListener('click',requestAccount);
  root.querySelector('[data-daily-refresh]')?.addEventListener('click',refresh);
  root.querySelectorAll('[data-daily-open]').forEach(el=>el.addEventListener('click',()=>{active=el.dataset.dailyOpen;update()}));
  root.querySelectorAll('[data-daily-cancel]').forEach(el=>el.addEventListener('click',()=>{active=null;update()}));
  root.querySelectorAll('form[data-daily-form]').forEach(form=>{
    const id=form.dataset.dailyForm;
    form.querySelector('textarea')?.addEventListener('input',ev=>remember(id,ev.target.value));
    form.addEventListener('submit',async ev=>{
      ev.preventDefault();if(busy)return;
      const t=task(id);if(!t)return;
      if(!form.elements.consent.checked){error='Bitte der privaten Prüfung ausdrücklich zustimmen.';update();return}
      busy=true;error='';const answer=form.elements.answer.value;remember(id,answer);
      try{await submit(t,answer)}catch(e){error='Einreichung nicht bestätigt: '+String(e.message||e)+'. Dein Text bleibt als Entwurf erhalten.';if(String(e.code||'')==='23505')await refresh()}
      finally{busy=false;update()}
    });
  });
  root.querySelectorAll('[data-daily-withdraw]').forEach(el=>el.addEventListener('click',async()=>{
   if(!window.confirm('Diese private Einreichung und ihr Feedback wirklich endgültig löschen?'))return;
   try{const {error:e}=await client().from('fp_review_submissions').delete().eq('id',el.dataset.dailyWithdraw);if(e)throw e;await refresh()}
   catch(e){error='Löschen fehlgeschlagen: '+String(e.message||e);update()}
  }));
 }
 window.FinanzPilotDailyReview={render,bind,load,refresh,submit,useMarketOpinion,get tasks(){return taskList()},get reviews(){return items},get drafts(){return drafts}};
 window.addEventListener('fp-auth-change',refresh);
 window.addEventListener('online',()=>{if(account())refresh()});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&account()&&Date.now()-latestUpdate>60000)refresh()});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load();
})();
