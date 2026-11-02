/* FinanzPilot V51 – Server-synchronisierte tägliche Missionen, Wiederholungen und Wochenfälle. */
(function(){
'use strict';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const client=()=>window.FinanzPilotCloud?.paperClient||null;
const account=()=>window.FinanzPilotCloud?.user||null;
const nav=()=>window.FinanzPilotNavigation;
let data=null,loadedUser=null,loadedAt=0,loading=false,working=false,error='',notice='',selected='daily',version=0;
const todayLocal=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const dateDisplay=s=>{try{return new Date(String(s)+'T12:00:00Z').toLocaleDateString('de-DE',{day:'2-digit',month:'long',year:'numeric',timeZone:'UTC'});}catch{return String(s||'')}};
const rows=(kind)=>Array.isArray(data?.[kind])?data[kind]:[];
const sum=(items)=>items.filter(r=>r.resolved===true).length;
const succeeded=(items)=>items.filter(r=>r.correct===true).length;
const reward=kind=>(rows('recent_rewards').some(r=>r.mission_kind===kind&&r.period_key===(kind==='daily'?'d:'+data?.date:kind==='weekly'?'w:'+data?.week_start:'r:'+data?.date)));
const currentStatus=()=>({date:data?.date,week:data?.week_start,daily:rows('daily').length,weekly:rows('weekly').length,reviews:rows('reviews').length,completed:sum(rows('daily')),weeklyCompleted:sum(rows('weekly')),points:Number(data?.totals?.points_earned)||0,authenticated:!!account(),error});
async function load(force=false){
 const id=account();
 if(!id||!client()){data=null;loadedUser=null;error='';notice='';return}
 if(loading)return;
 if(!force&&id===loadedUser&&data?.date===todayLocal()&&Date.now()-loadedAt<30000)return;
 const stamp=++version;loading=true;error='';
 try{
  const {data:response,error:rpcError}=await client().rpc('fp_missions_dashboard_v51');
  if(rpcError)throw rpcError;
  if(stamp!==version||id!==account())return;
  if(!response||!Array.isArray(response.daily)||!Array.isArray(response.weekly)||!Array.isArray(response.reviews))throw Error('Der Missionsserver hat unvollständige Daten geliefert.');
  data=response;loadedUser=id;loadedAt=Date.now();
 }catch(e){if(id===account())error='Missionen konnten nicht synchronisiert werden: '+String(e.message||e)}
 finally{loading=false;if(typeof state!=='undefined'&&state.view==='missions')window.render?.()}
}
function rowLabel(r,kind){
 const steps=kind==='weekly'?'SCHRITT '+r.step+' VON '+rows('weekly').length:kind==='review'?'WISSEN AUFFRISCHEN':String(r.topic||'FINANZWISSEN').toLocaleUpperCase('de-DE');
 return '<span class="fp51-topic">'+esc(steps)+'</span>';
}
function entry(r,kind,i){
 const isDone=r.resolved===true,bad=isDone&&!r.correct;
 const locked=kind==='weekly'&&rows('weekly').slice(0,i).some(q=>q.resolved!==true);
 const attempt=Number(r.tries)||0;
 const state=isDone?(r.correct?'✓ Richtig':'Abgeschlossen – erneut lernen'):attempt===1?'Noch ein Versuch':'Offen';
 const options=(r.options||[]).map((option,index)=>{
  const wasSelected=Number(r.selected_index)===index;
  const reveal=isDone&&Number(r.correct_index)===index;
  const cls=(reveal?' right':isDone&&wasSelected&&!r.correct?' wrong':'');
  return '<button type="button" class="fp51-option'+cls+'" data-fp51-question="'+esc(r.id)+'" data-fp51-choice="'+index+'" '+(isDone||locked||working?'disabled':'')+'><span>'+String.fromCharCode(65+index)+'</span><b>'+esc(option)+'</b></button>';
 }).join('');
 return '<article class="fp51-question'+(isDone?' finished':'')+(locked?' gated':'')+'" data-fp51-item="'+esc(r.id)+'">'+
 '<div class="fp51-question-top">'+rowLabel(r,kind)+'<span class="fp51-question-status">'+esc(locked?'Vorherigen Schritt beantworten':state)+'</span></div>'+
 '<h3>'+esc(r.title)+'</h3>'+
 (kind==='weekly'&&r.context?'<div class="fp51-case-context">'+esc(r.context)+'</div>':'')+
 '<p class="fp51-prompt">'+esc(r.question)+'</p>'+
 (locked?'<p class="fp51-subtle">Der vorherige Teil der Fallstudie baut das notwendige Wissen auf.</p>':'<div class="fp51-options">'+options+'</div>')+
 (attempt===1&&!isDone?'<p class="fp51-try">Noch nicht richtig. Du erhältst einen zweiten Versuch, bevor die Lösung angezeigt wird.</p>':'')+
 (isDone?'<p class="fp51-explain"><b>'+esc(r.correct?'Richtig erklärt':'Lösung und Erklärung')+':</b> '+esc(r.explanation||'Sieh dir die richtige Lösung noch einmal an.')+'</p>':'')+
 (bad?'<p class="fp51-subtle">Du kannst die Aufgabe in einer späteren Wiederholung erneut trainieren. Für diese Aufgabe ist die aktuelle Bewertung abgeschlossen.</p>':'')+
 '</article>';
}
function blockTitle(kind,items,title,detail){
 const progress=items.length?Math.round(sum(items)/items.length*100):0;
 return '<div class="fp51-section-title"><div><span class="eyebrow">'+esc(kind==='daily'?'JEDEN TAG':kind==='weekly'?'DIESE WOCHE':'NACH DEINEM LERNFORTSCHRITT')+'</span><h2>'+esc(title)+'</h2><p>'+esc(detail)+'</p></div><strong>'+sum(items)+' / '+items.length+'</strong></div>'+
 '<div class="fp51-meter" role="progressbar" aria-valuemin="0" aria-valuemax="'+items.length+'" aria-valuenow="'+sum(items)+'"><span style="width:'+progress+'%"></span></div>';
}
function weeklyEnd(){
 const start=data?.week_start; if(!/^\d{4}-\d{2}-\d{2}$/.test(String(start)))return '';
 const end=new Date(start+'T12:00:00Z');end.setUTCDate(end.getUTCDate()+6);
 return end.toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'UTC'});
}
function dailyPage(){
 const q=rows('daily');
 return blockTitle('daily',q,'Deine Tagesmissionen','Drei kurze Aufgaben aus verschiedenen Bereichen – neue Auswahl jeden Tag nach Berliner Zeit.')+
 '<div class="fp51-rewardline"><b>1 FP</b> bei vollständig richtig gelösten drei Tagesfragen · '+(reward('daily')?'✓ Heute gutgeschrieben':'Einmal pro Kalendertag')+'</div>'+
 q.map((r,i)=>entry(r,'daily',i)).join('')+
 '<p class="fp51-subtle">Jede Frage hat höchstens zwei Versuche. Die Antworten werden direkt vom Server bewertet; ein erneutes Laden bringt keine Extra-Punkte.</p>';
}
function reviewPage(){
 const q=rows('reviews');
 return blockTitle('review',q,'Wissen überprüfen','Fragen zu bereits vollständig gemeisterten Skills werden zeitversetzt erneut vorgelegt.')+
 '<div class="fp51-rewardline"><b>1 FP</b> für zwei vollständig richtig gelöste, fällige Wiederholungen · '+(reward('review')?'✓ Gutgeschrieben':'Nur wenn zwei passende Wiederholungen fällig sind')+'</div>'+
 (q.length?q.map((r,i)=>entry(r,'review',i)).join(''):'<div class="fp51-empty"><h3>Gerade keine Wiederholungen fällig</h3><p>Schließe neue Skills vollständig ab. Danach erscheinen hier passende Fragen. Bereits überprüfte Inhalte werden abhängig von deinen bisherigen Wiederholungen später erneut abgefragt.</p><button class="btn secondary" type="button" data-fp51-route="skilllessons">Zu meinen Skill-Lektionen</button></div>')+
 '<p class="fp51-subtle">Die Wiederholungsintervalle beginnen mit einem Tag, werden später auf drei und sieben Tage ausgeweitet. Nur passende nachgewiesene Skills zählen.</p>';
}
function weeklyPage(){
 const q=rows('weekly');
 return blockTitle('weekly',q,'Wochen-Challenge: Finanzfallstudie','Fünf aufeinander aufbauende Prüfschritte: erst rechnen, dann Bilanz, Risiko und Investmenturteil verbinden.')+
 '<div class="fp51-week-meta"><span>Woche ab '+esc(dateDisplay(data?.week_start))+'</span><span>Abgabeschluss Sonntag, '+esc(weeklyEnd())+'</span></div>'+
 '<div class="fp51-rewardline"><b>3 FP</b> für alle fünf richtig gelösten Schritte · '+(reward('weekly')?'✓ Diese Woche gutgeschrieben':'Einmal je Kalenderwoche')+'</div>'+
 q.map((r,i)=>entry(r,'weekly',i)).join('')+
 '<p class="fp51-subtle">Rechenbeispiele der Fallstudien sind ausdrücklich fiktiv. Die Aufgabe ist kein Börsenhandel und löst keine Depotransaktionen aus.</p>';
}
function render(){
 if(!account())return '<section class="fp51-missions"><div class="fp51-hero"><span class="eyebrow">DEIN FINANZTRAINING</span><h1>Missionen & Wiederholungen</h1><p>Tagesquiz, Wissenswiederholung und große Wochenaufgabe – Fortschritt und Forschungspunkte werden mit deinem Konto synchronisiert.</p></div><div class="fp51-empty"><h2>Konto verbinden</h2><p>Zum servergeprüften Lösen und zur geräteübergreifenden Synchronisierung dieser Missionen benötigst du dein kostenloses FinanzPilot-Konto.</p><button class="btn" type="button" data-fp51-login>Bei FinanzPilot anmelden</button><button class="btn secondary" type="button" data-fp51-route="dailyreview">Freitext-Herausforderungen ansehen</button></div></section>';
 if(!data)return '<section class="fp51-missions"><div class="fp51-hero"><h1>Missionen & Wiederholungen</h1><p>'+(loading?'Dein synchronisierter Lernstand wird geladen …':error?esc(error):'Dein Missionsplan wird abgerufen …')+'</p></div><button type="button" class="btn secondary" data-fp51-refresh>Erneut laden</button></section>';
 const daily=rows('daily'),weekly=rows('weekly'),review=rows('reviews');
 return '<section class="fp51-missions"><div class="fp51-hero"><span class="eyebrow">DEIN FINANZTRAINING · SYNCHRONISIERT</span><h1>Missionen & Wiederholungen</h1><p>Kurze tägliche Tests, gezielte Wiederholung bereits erlernter Inhalte und eine zusammenhängende Wochen-Fallstudie. Lösungen und Belohnungen werden auf dem Server geprüft.</p><div class="fp51-hero-stats"><div><b>'+sum(daily)+'/3</b><small>Heute gelöst</small></div><div><b>'+sum(weekly)+'/5</b><small>Wochenfall</small></div><div><b>'+sum(review)+'</b><small>Wiederholt</small></div><div><b>'+esc(data.totals?.points_earned||0)+'</b><small>FP durch Missionen</small></div></div><button type="button" class="btn secondary fp51-refresh" data-fp51-refresh>Fortschritt synchronisieren</button></div>'+
 (error?'<p class="fp51-error" role="alert">'+esc(error)+'</p>':'')+
 (notice?'<p class="fp51-notice" role="status">'+esc(notice)+'</p>':'')+
 '<nav class="fp51-tabs" aria-label="Missionsarten">'+[['daily','Täglich',sum(daily)+' / '+daily.length],['review','Wiederholen',sum(review)+' / '+review.length],['weekly','Wöchentlich',sum(weekly)+' / '+weekly.length]].map(([id,label,num])=>'<button type="button" data-fp51-tab="'+id+'" class="'+(selected===id?'active':'')+'" aria-pressed="'+(selected===id)+'">'+esc(label)+'<small>'+esc(num)+'</small></button>').join('')+'</nav>'+
 '<div class="fp51-content">'+(selected==='daily'?dailyPage():selected==='review'?reviewPage():weeklyPage())+'</div>'+
 '<section class="fp51-advanced"><span class="eyebrow">FÜR FORTGESCHRITTENE</span><h2>Schwierigere Forschungsmissionen</h2><p>Untersuche echte datierte Unternehmenszahlen, entwickle ein eigenes Marktszenario und verteidige deine Aussagen schriftlich mit Originalquellen. Deine freiwillige Einreichung kann am folgenden Redaktionstag fachlich bewertet werden.</p><button type="button" class="btn secondary" data-fp51-route="dailyreview">Aktuelle Research-Herausforderungen öffnen</button></section>'+
 '<p class="fp51-footer">Die Missionen aktualisieren sich nach der Berliner Kalenderzeit automatisch beim nächsten Öffnen. Forschungspunkte werden nur nach erfolgreicher Serverbewertung einmalig gebucht. Alle Ergebnisse sind deinem FinanzPilot-Konto zugeordnet; keine lokalen Ersatz-Belohnungen.</p></section>';
}
async function submit(id,index){
 if(working||!data||!account())return;
 const current=[...rows('daily'),...rows('reviews'),...rows('weekly')].find(x=>x.id===id);
 if(!current||current.resolved||index<0||index>=current.options?.length)return;
 const kind=current.mission_kind;
 if(kind==='weekly'&&rows('weekly').slice(0,rows('weekly').indexOf(current)).some(q=>!q.resolved))return;
 working=true;error='';notice='';
 try{
  const identity=account(),{data:result,error:err}=await client().rpc('fp_missions_submit_v51',{p_question_id:id,p_index:index});
  if(err)throw err;
  if(identity!==account())return;
  if(!result?.dashboard||!Array.isArray(result.dashboard.daily))throw Error('Der Server hat keine bestätigte Ergebnisübersicht zurückgegeben.');
  data=result.dashboard;loadedAt=Date.now();loadedUser=identity;
  if(result.points_awarded>0){window.FinanzPilotCelebrations?.show?.('mission',{confirmed:true,id:'mission:'+kind+':'+id,title:kind==='weekly'?'Wochenfall gemeistert':kind==='review'?'Wissen gefestigt':'Tagesmission erfüllt',text:'Alle erforderlichen Antworten wurden bestätigt. Die Forschungspunkte sind gutgeschrieben.',value:'+'+result.points_awarded+' FP'});notice='Mission abgeschlossen: +'+result.points_awarded+' Forschungspunkte wurden serverseitig gutgeschrieben.';window.FinanzPilotEconomy?.refresh?.(false);window.FinanzPilotLearningHub?.load?.(true);}
  else if(result.correct){window.FinanzPilotFeedback?.tone?.('answer');notice='Richtig – deine Antwort ist auf dem Server gespeichert.';}
  else {window.FinanzPilotFeedback?.tone?.('wrong');notice=result.resolved?'Bewertet. Die Musterlösung wird jetzt angezeigt.' :'Noch nicht richtig – ein zweiter Versuch ist möglich.';}
 }catch(e){error='Antwort wurde nicht bestätigt: '+String(e.message||e)}
 finally{working=false;if(typeof state!=='undefined'&&state.view==='missions')window.render?.()}
}
function bind(root=document){
 root.querySelector('[data-fp51-login]')?.addEventListener('click',()=>window.FinanzPilotCloud?.openLogin?.());
 root.querySelector('[data-fp51-refresh]')?.addEventListener('click',()=>load(true));
 root.querySelectorAll('[data-fp51-route]').forEach(b=>b.addEventListener('click',()=>nav()?.route(b.dataset.fp51Route)));
 root.querySelectorAll('[data-fp51-tab]').forEach(b=>b.addEventListener('click',()=>{selected=b.dataset.fp51Tab;notice='';window.render?.()}));
 root.querySelectorAll('[data-fp51-choice]').forEach(b=>b.addEventListener('click',()=>submit(b.dataset.fp51Question,Number(b.dataset.fp51Choice))));
 if(account()&&(!data||loadedUser!==account()||data.date!==todayLocal()||Date.now()-loadedAt>60000))load(true);
}
window.addEventListener('fp-auth-change',()=>{version++;data=null;loadedUser=null;error='';notice='';load(true)});
window.addEventListener('fp-navigation',()=>{if(typeof state!=='undefined'&&state.view==='missions')load()});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&typeof state!=='undefined'&&state.view==='missions'&&data?.date!==todayLocal())load(true)});
window.FinanzPilotMissions={render,bind,load,submit,get status(){return currentStatus()},get dashboard(){return data}};
})();
