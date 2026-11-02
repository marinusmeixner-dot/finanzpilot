/* V55: one-time server XP/FP for fundamentals and real, server-funded level roadmap. */
(function(){
'use strict';
const FIRST=100,PER=100,MAX_LEVEL=100;
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const user=()=>window.FinanzPilotCloud?.user||null;
const client=()=>window.FinanzPilotCloud?.paperClient;
const levelPoints=n=>n%10===0?10:n%5===0?5:2;
const rank=n=>n>=50?'Marktstratege':n>=30?'Portfolio-Architekt':n>=20?'Finanzexperte':n>=10?'Analyst':n>=5?'Marktkenner':'Einsteiger';
let data=null,loadedUser=null,busy=false,claimBusy=false,lastFetch=0,lastError='',backfillRunning=false,backfillUser=null;
const cacheKey=id=>'finanzpilot_foundation_rewards_v55_'+id;
function claims(id){try{return JSON.parse(localStorage.getItem(cacheKey(id))||'{}')}catch{return {}}}
function mark(id,lesson){try{localStorage.setItem(cacheKey(id),JSON.stringify({...claims(id),[lesson]:true}))}catch{}}
function clearAccount(){data=null;loadedUser=null;lastFetch=0;lastError='';backfillUser=null}
function repaint(){if(typeof state!=='undefined'&&state.view==='levels')window.render?.()}
async function refresh(force=false){
 const id=user();if(!id||!client()){clearAccount();repaint();return null}
 if(claimBusy)return null;
 if(!force&&id===loadedUser&&Date.now()-lastFetch<30000)return data;
 claimBusy=true;lastError='';
 try{
  const {data:answer,error}=await client().rpc('fp_level_claim_v55');
  if(error)throw error;
  if(id!==user())return null;
  if(!answer?.ok||!Number.isInteger(answer.level))throw Error('Ungültige Antwort des Levelservers.');
  data=answer;loadedUser=id;lastFetch=Date.now();
  window.FinanzPilotHeader?.refresh?.(true);
  if(Number(answer.level_points_awarded)>0&&Array.isArray(answer.new_levels)&&answer.new_levels.length){
   const latest=answer.new_levels.at(-1);
   window.FinanzPilotCelebrations?.show?.('level',{confirmed:true,id:'level-awarded:'+id+':'+latest.level,title:'Level '+latest.level+' erreicht!',text:answer.new_levels.length>1?'Mehrere neu verdiente Levelprämien auf deinem Konto freigeschaltet.':'Deine Levelprämie wurde serverseitig gutgeschrieben.',value:'+'+answer.level_points_awarded+' FP'});
  }
  repaint();return answer;
 }catch(e){lastError=String(e.message||e);repaint();return null}
 finally{claimBusy=false}
}
async function awardFoundation(moduleId,title,celebrate=true){
 const id=user();if(!id||!client())return null;
 if(!/^[a-z0-9-]{4,80}$/.test(moduleId))return null;
 if(claims(id)[moduleId])return null;
 try{
  const {data:result,error}=await client().rpc('fp_foundation_complete_v55',{p_module_id:moduleId});
  if(error)throw error;
  if(id!==user())return null;
  if(!result?.ok||result.module_id!==moduleId)return null;
  mark(id,moduleId);
  if(result.awarded_now&&celebrate)window.FinanzPilotCelebrations?.show?.('basics',{confirmed:true,id:'foundations:'+id+':'+moduleId,title:title||'Grundlage gemeistert',text:'Grundlagenwissen erfolgreich abgeschlossen. Die Punkte sind deinem Konto gutgeschrieben.',value:'+'+result.xp_awarded+' XP · +'+result.fp_awarded+' FP'});
  window.FinanzPilotHeader?.refresh?.(true);
  if(celebrate)await refresh(true);
  return result;
 }catch(e){lastError='Grundlagenbelohnung konnte noch nicht bestätigt werden: '+String(e.message||e);repaint();return null}
}
async function backfill(){
 const id=user();if(!id||backfillRunning)return;
 const done=window.FinanzPilotJourney?.completed;
 if(!done||!Object.keys(done).length)return;
 backfillRunning=true;backfillUser=id;
 try{
  const known=claims(id);
  const modules=(window.FinanzPilotJourney?.modules||[]).filter(m=>done[m.id]&&!known[m.id]);
  let changed=false;
  for(const module of modules){
   if(id!==user())break;
   const res=await awardFoundation(module.id,module.title,false);
   if(!res)break; // stop on actual cloud failure; try again on next foreground use.
   if(res.awarded_now)changed=true;
  }
  if(id===user())await refresh(changed);
 }finally{backfillRunning=false}
}
function snapshot(){
 const xp=Math.max(0,Number(data?.xp)||0);
 const lvl=Math.max(1,Math.min(100,Number(data?.level)||1));
 return{xp,level:lvl,nextXp:lvl*PER,pointsEarned:Number(data?.level_points_awarded)||0,foundations:Number(data?.foundation_completed)||0,loading:claimBusy,error:lastError,authenticated:!!user()};
}
function render(){
 const st=snapshot(),xp=st.xp,lv=st.level,from=(lv-1)*PER,progress=lv===MAX_LEVEL?100:Math.max(0,Math.min(100,(xp-from)/PER*100));
 const end=Math.min(100,Math.max(25,lv+12));
 const tile=n=>{
  const isDone=n<lv,active=n===lv,fp=n>1?levelPoints(n):0;
  return '<div class="fp55-level'+(isDone?' completed':active?' current':' locked')+'" data-fp55-node="'+n+'">'+
   '<div class="fp55-level-circle">'+(isDone?'✓':n)+'</div><div class="fp55-level-data"><b>Level '+n+'</b><small>'+esc(rank(n))+' · '+(n-1)*PER+' XP</small>'+
   '<span>'+(n===1?'Start deiner Finanzreise':n%10===0?'Große Meilensteinprämie':n%5===0?'Bonus-Meilenstein':'Levelprämie')+'</span></div>'+
   '<strong class="fp55-level-prize">'+(n===1?'Start':'+ '+fp+' FP')+'</strong></div>';
 };
 return '<section class="fp55-levels">'+
 '<div class="fp55-hero"><span class="eyebrow">DEIN WEG ZUM FINANZEXPERTEN</span><h1>Level & Belohnungen</h1>'+
 '<p>Jede echte Lernleistung zählt. 100 XP bringen dich zum nächsten Level, die Levelprämien werden mit deinem Konto gespeichert und nur einmal vergeben.</p>'+
 '<div class="fp55-balance"><div><small>DEIN LEVEL</small><strong>'+lv+'</strong><span>'+esc(rank(lv))+'</span></div><div><small>VERIFIZIERTE XP</small><strong>'+xp+'</strong><span>'+(lv===MAX_LEVEL?'Maximallevel erreicht':(lv*PER-xp)+' XP bis Level '+(lv+1))+'</span></div></div>'+
 '<div class="fp55-bar" role="progressbar" aria-label="Fortschritt zum nächsten Level" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+Math.round(progress)+'"><span style="width:'+progress+'%"></span></div>'+
 (st.authenticated?'<p class="fp55-verified">Serverseitig bestätigt · '+st.foundations+' Grundlagen mit XP vergütet</p>':'<p class="fp55-verified">Für serverseitige XP und FP bitte dein kostenloses Konto anmelden. Lokal erarbeitete Grundlagen bleiben erhalten und können nach der Anmeldung angerechnet werden.</p>')+
 '</div><div class="fp55-schedule"><h2>Dein Belohnungspfad</h2><p>Normale Level: +2 FP. Jedes 5. Level: +5 FP. Jedes 10. Level: +10 FP. Dazu erscheinen besondere Rangbezeichnungen.</p>'+
 '<div class="fp55-timeline">'+Array.from({length:end},(_,i)=>tile(i+1)).join('')+'</div>'+
 (end<100?'<p class="fp55-fine">Der Pfad setzt sich nach Level '+end+' mit denselben Levelprämien bis Level 100 fort.</p>':'')+
 '</div><p class="fp55-fine">Grundlagenabschluss (angemeldetes Konto): +20 XP und +1 FP, einmal je Lektion. Spezialisierungslektionen vergeben ihre eigenen XP. Levelprämien werden separat und einmalig serverseitig verbucht.</p>'+
 (lastError?'<p class="fp55-error" role="alert">'+esc(lastError)+'</p>':'')+
 '<button class="btn secondary" type="button" data-fp55-reload>Level synchronisieren</button>'+
 '</section>';
}
function bind(root=document){root.querySelector('[data-fp55-reload]')?.addEventListener('click',()=>{refresh(true);backfill()});if(user()&&(!data||loadedUser!==user()||Date.now()-lastFetch>30000))refresh()}
function start(){
 window.addEventListener('fp-auth-change',()=>{clearAccount();refresh(true);backfill()});
 window.addEventListener('fp-cloud-progress-imported',()=>{backfill()});
 window.addEventListener('fp-progress-change',()=>{if(user()&&!backfillRunning)backfill()});
 window.addEventListener('fp-account-reset-applied',()=>{const id=user();if(id)try{localStorage.removeItem(cacheKey(id))}catch{}clearAccount()});
 window.addEventListener('fp-navigation',()=>{if(user()&&Date.now()-lastFetch>120000)refresh();});
 refresh();backfill();
}
window.FinanzPilotLevels={render,bind,refresh,awardFoundation,backfill,get status(){return snapshot()},get rank(){return rank(snapshot().level)}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();