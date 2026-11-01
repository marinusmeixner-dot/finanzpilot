/* FinanzPilot v43: always-visible status for server-owned research currency and completed-learning XP. */
(function(){
'use strict';
const user=()=>window.FinanzPilotCloud?.user;
const client=()=>window.FinanzPilotCloud?.paperClient;
const stateNow=()=>typeof state!=='undefined'?state:{xp:0};
let specialXp=0,points=0,currentUser=null,lastFetch=0,busy=false;
const level=()=>Math.floor(((Number(stateNow().xp)||0)+specialXp)/100)+1;
const pretty=n=>new Intl.NumberFormat('de-DE',{maximumFractionDigits:0}).format(Number(n)||0);
function paint(){
 const fp=document.getElementById('top-fp'),lv=document.getElementById('top-level');
 if(fp)fp.textContent=pretty(points);
 if(lv)lv.textContent=String(level());
}
async function refresh(force=false){
 const current=user();if(current!==currentUser){specialXp=0;points=0;currentUser=current;lastFetch=0}
 if(!current||!client()){paint();return}
 if(busy||(!force&&Date.now()-lastFetch<45000)){paint();return}
 busy=true;lastFetch=Date.now();
 try{
  const [p,x]=await Promise.all([
   client().from('fp_economy_accounts').select('research_points').eq('user_id',current).maybeSingle(),
   client().from('fp_specialization_profiles').select('xp').eq('user_id',current).maybeSingle()
  ]);
  if(p.error||x.error)throw p.error||x.error;
  if(current===user()){points=Number(p.data?.research_points)||0;specialXp=Number(x.data?.xp)||0}
 }catch(e){console.warn('FinanzPilot Status:',String(e.message||e))}
 finally{busy=false;paint()}
}
function init(){
 document.getElementById('fp43-fp-trigger')?.addEventListener('click',()=>window.FinanzPilotNavigation?.route('inventory'));
 document.getElementById('fp43-level-trigger')?.addEventListener('click',()=>window.FinanzPilotNavigation?.route('learningstats'));
 window.addEventListener('fp-auth-change',()=>refresh(true));
 window.addEventListener('fp-streak-reward',()=>refresh(true));
 window.addEventListener('fp-progress-change',()=>{paint();refresh()});
 window.addEventListener('fp-navigation',()=>refresh());
 window.addEventListener('focus',()=>refresh(true));
 paint();refresh(true);
}
window.FinanzPilotHeader={refresh,get level(){return level()},get xp(){return (Number(stateNow().xp)||0)+specialXp},get fp(){return points}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
