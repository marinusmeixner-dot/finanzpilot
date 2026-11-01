/* v44: compact verified header status for research points and Level */
(function(){
'use strict';
let latestUser=null,inflight=false,lastRefresh=0;
const number=n=>Math.max(0,Number(n)||0);
function draw(points,level){
 const p=document.getElementById('fp44-fp-count'),l=document.getElementById('fp44-level-count');
 if(p)p.textContent=new Intl.NumberFormat('de-DE',{maximumFractionDigits:0}).format(points);
 if(l)l.textContent=String(level);
}
function currentLevel(){
 const xp=number(typeof state!=='undefined'?state.xp:0);
 const extra=number(window.FinanzPilotLearningHub?.status?.profiles?.[0]?.xp);
 return Math.floor((xp+extra)/100)+1;
}
async function refresh(force=false){
 const id=window.FinanzPilotCloud?.user,c=window.FinanzPilotCloud?.paperClient;
 draw(number(window.FinanzPilotEconomy?.account?.research_points??window.FinanzPilotLearningHub?.status?.points),currentLevel());
 if(!id||!c){latestUser=null;if(!id)draw(0,currentLevel());return}
 if(inflight||!force&&id===latestUser&&Date.now()-lastRefresh<30000)return;
 inflight=true;
 try{
  const {data,error}=await c.from('fp_economy_accounts').select('research_points').eq('user_id',id).maybeSingle();
  if(error)throw error;
  if(id!==window.FinanzPilotCloud?.user)return;
  latestUser=id;lastRefresh=Date.now();
  draw(number(data?.research_points),currentLevel());
 }catch(e){console.warn('FP-Anzeige:',String(e.message||e))}
 finally{inflight=false}
}
function init(){
 document.querySelectorAll('[data-fp44-go]').forEach(button=>button.addEventListener('click',()=>{
  window.FinanzPilotNavigation?.route(button.dataset.fp44Go);
 }));
 for(const kind of ['fp-auth-change','fp-progress-change','fp-streak-reward','fp-account-reset-applied','fp-navigation']){
  window.addEventListener(kind,()=>refresh(kind!=='fp-navigation'));
 }
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
 refresh();
}
window.FinanzPilotHeaderProgress={refresh};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();