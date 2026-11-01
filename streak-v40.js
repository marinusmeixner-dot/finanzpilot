/* FinanzPilot v40: authenticated server-side calendar streak, not lesson streak.
   Daily check-in grants tiny simulated currency/research rewards; never real money.
*/
(function(){
 'use strict';
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const euro=n=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(Number(n)||0);
 const dayBerlin=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 let result=null,userId=null,busy=false,error='',pending=null;
 const connected=()=>window.FinanzPilotCloud?.user&&window.FinanzPilotCloud?.paperClient;
 const trigger=()=>document.getElementById('fp-streak-trigger');
 function reflect(){
  const num=document.getElementById('top-streak');if(num)num.textContent=String(result?.day||0);
  trigger()?.setAttribute('aria-label',result?'Streak: '+result.day+' von 30 Tagen. Belohnungen öffnen.':'Streak und tägliche Belohnungen öffnen');
  if(document.getElementById('fp-streak-dialog')?.open)draw();
 }
 function week(){
  const rows=result?.recent||[],byDate=new Map(rows.map(x=>[x.date,x]));
  const time=Date.parse(dayBerlin()+'T12:00:00Z');
  return Array.from({length:7},(_,i)=>{
   const iso=new Date(time-(6-i)*86400000).toISOString().slice(0,10),row=byDate.get(iso);
   return '<div class="fp40-streak-day'+(row?' achieved':'')+'" aria-label="'+esc(iso)+(row?', Besuchstag bestätigt':', kein bestätigter Besuch')+'">'+
    '<span>'+new Intl.DateTimeFormat('de-DE',{weekday:'short',timeZone:'Europe/Berlin'}).format(new Date(iso+'T12:00:00Z'))+'</span>'+
    '<b>'+(row?'✓':'·')+'</b></div>';
  }).join('');
 }
 function panelHtml(){
  const day=Math.min(30,Number(result?.day)||0),signed=Boolean(connected());
  const next=day<10?10:day<20?20:day<30?30:null;
  const goal=next===10?'+100 € virtuelles Depotgeld & +15 Forschungspunkte':next===20?'+125 € & +20 Forschungspunkte':next===30?'+150 € & +30 Forschungspunkte':'Alle drei großen Meilensteine erreicht';
  return '<div class="fp40-streak-head"><div><span class="eyebrow">FINANZPILOT · BESUCHSSERIE</span><h2>Deine Streak</h2><p>Einmal täglich FinanzPilot öffnen. Maximal 30 Tage werden angezeigt.</p></div><button type="button" class="fp40-streak-close" data-fp40-streak-close aria-label="Schließen">×</button></div>'+
   '<div class="fp40-streak-count"><strong>'+day+'</strong><span> / 30 Tage</span></div>'+(Number(result?.promotion_count)>0?'<p class="fp41-streak-promotion">Deine '+Number(result.promotion_count)+' neue(n) Beförderung(en) verbessern die tägliche Belohnung um +'+euro(result.daily_euro_bonus)+' und +'+Number(result.daily_points_bonus)+' Forschungspunkte.</p>':'')+
   '<div class="fp40-streak-week" aria-label="Besuche der letzten sieben Tage">'+week()+'</div>'+
   (result?'<div class="fp40-streak-today"><b>Heutige Belohnung '+(result.awarded_now?'erhalten':'bereits verbucht')+'</b>'+
    '<p>+'+euro(result.today_euros)+' Depotgeld · +'+Number(result.today_points)+' Forschungspunkte'+
    (result.milestone?' · Meilenstein Tag '+result.milestone:'')+'</p><small>Depotguthaben und Punkte werden im Profil und im Inventar geführt.</small></div>':
    '<div class="fp40-streak-today"><b>'+(signed?'Tagesbesuch wird geprüft':'Für Belohnungen anmelden')+'</b><p>Jeder bestätigte Besuchstag bringt +10 € virtuelles Depotgeld und +1 Forschungspunkt.</p></div>')+
   '<div class="fp40-streak-milestones"><h3>Deine Meilensteine</h3><div class="fp40-streak-milestone-list">'+[
    [10,'Große 10-Tage-Belohnung','+100 € und +15 zusätzliche Forschungspunkte'],
    [20,'20-Tage-Belohnung','+125 € und +20 zusätzliche Forschungspunkte'],
    [30,'30-Tage-Abschluss','+150 € und +30 zusätzliche Forschungspunkte']
   ].map(([n,title,desc])=>'<div class="'+(day>=n?'achieved':'')+'"><span>'+n+'</span><div><b>'+title+'</b><small>'+desc+'</small></div><span>'+(day>=n?'✓':'○')+'</span></div>').join('')+'</div>'+
   '<p class="fp40-streak-next">'+(next?'Nächste größere Belohnung an Tag '+next+': '+goal:'Maximale Streak erreicht. Neue Tage verlängern die Anzeige nicht über 30; kleine Tagesbelohnungen werden weiter einmal täglich gutgeschrieben.')+'</p></div>'+
   (error?'<p class="fp40-streak-error" role="status">'+esc(error)+'</p>':'')+
   (!signed?'<button type="button" class="btn" data-fp40-streak-login>Zum kostenlosen Konto anmelden</button>':'')+
   '<p class="fp40-streak-disclaimer">Nur Spielgeld, keine echten Einzahlungen. Nach einem ausgelassenen Kalendertag beginnt die Besuchsserie wieder bei Tag 1. Bereits verdiente Punkte und Gegenstände bleiben erhalten. Belohnungen werden serverseitig nur einmal je Kalendertag vergeben.</p>';
 }
 function draw(){
  const dialog=document.getElementById('fp-streak-dialog');if(!dialog)return;
  dialog.innerHTML='<div class="fp40-streak-panel">'+panelHtml()+'</div>';
  dialog.querySelector('[data-fp40-streak-close]')?.addEventListener('click',()=>dialog.close());
  dialog.querySelector('[data-fp40-streak-login]')?.addEventListener('click',()=>{dialog.close();window.FinanzPilotCloud?.openLogin?.()});
 }
 function open(){
  let dialog=document.getElementById('fp-streak-dialog');
  if(!dialog){dialog=document.createElement('dialog');dialog.id='fp-streak-dialog';dialog.className='fp40-streak-dialog';document.body.append(dialog);
   dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
  }
  draw();if(!dialog.open)dialog.showModal?.();
 }
 async function checkin(){
  if(!connected()){
   result=null;userId=null;error='';reflect();return;
  }
  if(busy)return pending;
  if(userId===window.FinanzPilotCloud.user&&result?.today===dayBerlin()){reflect();return result}
  busy=true;userId=window.FinanzPilotCloud.user;error='';
  pending=(async()=>{
   try{
    const {data,error:rpcError}=await window.FinanzPilotCloud.paperClient.rpc('fp_streak_checkin');
    if(rpcError)throw rpcError;
    if(userId!==window.FinanzPilotCloud.user)return;
    result=data;
    if(data?.awarded_now){
     window.dispatchEvent?.(new Event('fp-streak-reward'));
     if(typeof state!=='undefined'&&state.view==='depot')window.FinanzPilotPortfolio?.load?.();
     if(typeof state!=='undefined'&&state.view==='inventory')window.FinanzPilotEconomy?.refresh?.();
    }
   }catch(e){error='Die Tagesbelohnung konnte nicht bestätigt werden: '+String(e.message||e)}
   finally{busy=false;reflect()}
  })();
  return pending;
 }
 function init(){
  trigger()?.addEventListener('click',open);
  window.addEventListener('fp-auth-change',checkin);
  window.addEventListener('focus',()=>{if(result?.today!==dayBerlin())checkin()});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&result?.today!==dayBerlin())checkin()});
  checkin();
 }
 window.FinanzPilotStreak={open,checkin,get status(){return result}};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
