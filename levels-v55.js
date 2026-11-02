/* V55: one-time server XP/FP for fundamentals and real, server-funded level roadmap. */
(function(){
'use strict';
const MAX_LEVEL=100;
const threshold=n=>100*(n-1)+10*(n-1)*(n-2);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const user=()=>window.FinanzPilotCloud?.user||null;
const client=()=>window.FinanzPilotCloud?.paperClient;
const levelPoints=n=>n%10===0?2:n%5===0?1:0;
const levelEuros=n=>n===1?0:n%10===0?12:n%5===0?8:5;
const fromXp=xp=>{let n=1;while(n<MAX_LEVEL&&Number(xp)>=threshold(n+1))n++;return n};
const cash=n=>Number(n||0).toLocaleString('de-DE',{style:'currency',currency:'EUR',maximumFractionDigits:0});
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
  const freshLevels=Array.isArray(answer.new_levels)?answer.new_levels:[];
  for(const reached of freshLevels){
   const lvl=Number(reached.level)||1,earned=Number(reached.points)||0,euros=Number(reached.euros)||0;
   window.FinanzPilotCelebrations?.show?.('level',{confirmed:true,
    id:'level-awarded:'+id+':'+lvl,title:'Level '+lvl+' erreicht!',
    text:earned>0?'Meilenstein geschafft: Depotguthaben und seltene Forschungspunkte erhalten.':'Dein Lernen hat sich ausgezahlt: eine weitere Depotprämie.',
    value:'+'+cash(euros)+(earned>0?' · +'+earned+' FP':'')});
  }
  const retroCash=Number(answer.level_euros_awarded||0)-freshLevels.reduce((sum,l)=>sum+Number(l.euros||0),0);
  if(retroCash>0){
   window.FinanzPilotCelebrations?.show?.('reward',{confirmed:true,id:'level-cash-backfill:'+id+':'+answer.level,title:'Alte Levelprämien nachgetragen',text:'Bereits erreichte Level haben ihre einmaligen Depotprämien erhalten.',value:'+'+cash(retroCash)});
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
  if(result.awarded_now&&celebrate)window.FinanzPilotCelebrations?.show?.('basics',{confirmed:true,id:'foundations:'+id+':'+moduleId,title:title||'Grundlage gemeistert',text:'Grundlagenwissen erfolgreich abgeschlossen. Die Punkte sind deinem Konto gutgeschrieben.',value:'+'+result.xp_awarded+' XP'+(Number(result.fp_awarded)>0?' · +'+result.fp_awarded+' FP':'')});
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
 const xp=Math.max(0,Number(data?.xp??window.FinanzPilotHeader?.xp)||0);
 const lvl=Math.max(1,Math.min(100,Number(data?.level)||fromXp(xp)));
 return{xp,level:lvl,verified:Boolean(data),nextXp:data?.next_xp??(lvl>=MAX_LEVEL?null:threshold(lvl+1)),pointsEarned:Number(data?.level_points_awarded)||0,foundations:Number(data?.foundation_completed)||0,loading:claimBusy,error:lastError,authenticated:!!user()};
}
function render(){
 const st=snapshot(),xp=st.xp,lv=st.level,from=threshold(lv),to=st.nextXp??threshold(lv+1),progress=lv===MAX_LEVEL?100:Math.max(0,Math.min(100,(xp-from)/(to-from)*100));
 const end=100;
 const tile=n=>{
  const isDone=n<lv,active=n===lv,fp=n>1?levelPoints(n):0,euros=levelEuros(n);
  return '<div class="fp55-level'+(isDone?' completed':active?' current':' locked')+'" data-fp55-node="'+n+'">'+
   '<div class="fp55-level-circle">'+(isDone?'✓':n)+'</div><div class="fp55-level-data"><b>Level '+n+'</b><small>'+esc(rank(n))+' · '+threshold(n)+' XP insgesamt</small>'+
   '<span>'+(n===1?'Start deiner Finanzreise':n%10===0?'Großer Meilenstein':n%5===0?'Kleiner Meilenstein':'Depotguthaben')+'</span></div>'+
   '<strong class="fp55-level-prize">'+(n===1?'Start':('+'+cash(euros)+(fp>0?' · +'+fp+' FP':'')))+'</strong></div>';
 };
 return '<section class="fp55-levels">'+
 '<div class="fp55-hero"><span class="eyebrow">DEIN WEG ZUM FINANZEXPERTEN</span><h1>Level & Belohnungen</h1>'+
 '<p>Jede echte Lernleistung zählt. Schwierige Lektionen bringen mehr XP, für höhere Level brauchst du schrittweise mehr. Forschungspunkte bleiben selten, dafür erhält jedes Level eine kleine virtuelle Depotprämie.</p>'+
 '<div class="fp55-balance"><div><small>DEIN LEVEL</small><strong>'+lv+'</strong><span>'+esc(rank(lv))+'</span></div><div><small>VERIFIZIERTE XP</small><strong>'+xp+'</strong><span>'+(lv===MAX_LEVEL?'Maximallevel erreicht':(st.nextXp-xp)+' XP bis Level '+(lv+1))+'</span></div></div>'+
 '<div class="fp55-bar" role="progressbar" aria-label="Fortschritt zum nächsten Level" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+Math.round(progress)+'"><span style="width:'+progress+'%"></span></div>'+
 (st.authenticated?(st.verified?'<p class="fp55-verified">Serverseitig bestätigt · '+st.foundations+' Grundlagen mit XP vergütet</p>':'<p class="fp55-verified">XP aus deiner oberen Levelanzeige · Serverabgleich läuft</p>'):'<p class="fp55-verified">Für serverseitige XP und FP bitte dein kostenloses Konto anmelden. Lokal erarbeitete Grundlagen bleiben erhalten und können nach der Anmeldung angerechnet werden.</p>')+
 '</div><div class="fp55-schedule"><h2>Dein Belohnungspfad</h2><p>Jedes normale Level: +5 € virtuelles Depotgeld. Jedes 5. Level: +8 € und +1 FP. Jedes 10. Level: +12 € und +2 FP. Alles einmalig, niemals echtes Geld.</p>'+
 '<div class="fp55-timeline">'+Array.from({length:end},(_,i)=>tile(i+1)).join('')+'</div>'+
 (end<100?'<p class="fp55-fine">Der Pfad setzt sich nach Level '+end+' mit denselben Levelprämien bis Level 100 fort.</p>':'')+
 '</div><p class="fp55-fine">Grundlagen: je nach Etappe 8, 10, 12, 14, 16 oder 18 XP pro erstmals abgeschlossener Lektion. Nur der Abschluss der dritten Lektion einer Etappe vergibt 1 FP. Speziallektionen bringen entsprechend ihrer Schwierigkeit mehr XP. Bereits verbuchte Altprämien bleiben erhalten.</p>'+
 (lastError?'<p class="fp55-error" role="alert">'+esc(lastError)+'</p>':'')+
 '<button class="btn secondary" type="button" data-fp55-reload>Level synchronisieren</button>'+
 '</section>';
}
function bind(root=document){root.querySelector('[data-fp55-reload]')?.addEventListener('click',()=>{refresh(true);backfill()});if(user()&&(!data||loadedUser!==user()||Date.now()-lastFetch>30000))refresh()}
function start(){
 window.addEventListener('fp-auth-change',()=>{clearAccount();refresh(true);backfill()});
 window.addEventListener('fp-cloud-progress-imported',()=>{backfill()});
 window.addEventListener('fp-account-reset-applied',()=>{const id=user();if(id)try{localStorage.removeItem(cacheKey(id))}catch{}clearAccount()});
 window.addEventListener('fp-navigation',()=>{if(user()&&Date.now()-lastFetch>120000)refresh();});
 refresh();backfill();
}
window.FinanzPilotLevels={render,bind,refresh,awardFoundation,backfill,get status(){return snapshot()},get rank(){return rank(snapshot().level)}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();