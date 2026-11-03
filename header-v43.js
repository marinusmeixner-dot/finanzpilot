/* FinanzPilot v43: always-visible status for server-owned research currency and completed-learning XP. */
(function(){
'use strict';
const user=()=>window.FinanzPilotCloud?.user;
const client=()=>window.FinanzPilotCloud?.paperClient;
const stateNow=()=>typeof state!=='undefined'?state:{xp:0};
let specialXp=0,points=0,currentUser=null,lastFetch=0,busy=false,refreshAgain=false;
const officialXP=()=>user()?specialXp:(Number(stateNow().xp)||0);
const level=()=>{let lv=1,xp=officialXP();while(lv<100&&xp>=100*lv+10*lv*(lv-1))lv++;return lv;};
const pretty=n=>new Intl.NumberFormat('de-DE',{maximumFractionDigits:0}).format(Number(n)||0);
function paint(){
 const fp=document.getElementById('top-fp'),total=document.getElementById('top-depot');
 if(fp)fp.textContent=pretty(points);
 if(total){
  const p=window.FinanzPilotPortfolio?.status;
  const canShow=!!user()&&p?.loaded&&p.complete&&Number.isFinite(p.total);
  total.textContent=canShow?new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR',maximumFractionDigits:2}).format(p.total):'—';
  const parent=document.getElementById('fp43-depot-trigger');
  if(parent)parent.title=canShow?'Virtuelles Depot: Gesamtwert inklusive Kasse und bewerteten Aktienpositionen.':!user()?'Für den virtuellen Depotwert anmelden.':p?.unpriced?'Depotbewertung unvollständig: Kurs oder Wechselkurs fehlt.':'Virtueller Depotwert wird geladen.';
 }

}
async function refresh(force=false){
 const current=user();if(current!==currentUser){specialXp=0;points=0;currentUser=current;lastFetch=0}
 if(!current||!client()){paint();return}
 if(busy){if(force)refreshAgain=true;paint();return}
 if(!force&&Date.now()-lastFetch<45000){paint();return}
 busy=true;lastFetch=Date.now();
 try{
  const [p,x]=await Promise.all([
   client().from('fp_economy_accounts').select('research_points').eq('user_id',current).maybeSingle(),
   client().from('fp_specialization_profiles').select('xp').eq('user_id',current).maybeSingle()
  ]);
  if(p.error||x.error)throw p.error||x.error;
  if(current===user()){points=Number(p.data?.research_points)||0;specialXp=Number(x.data?.xp)||0}
 }catch(e){lastFetch=0;console.warn('FinanzPilot Status:',String(e.message||e))}
 finally{busy=false;paint();if(refreshAgain){refreshAgain=false;void refresh(true)}}
}
function init(){
 document.getElementById('fp43-fp-trigger')?.addEventListener('click',()=>window.FinanzPilotNavigation?.route('inventory'));
 document.getElementById('fp43-depot-trigger')?.addEventListener('click',()=>window.FinanzPilotNavigation?.route('depot'));
 window.addEventListener('fp-portfolio-loaded',paint);
 window.addEventListener('fp-auth-change',()=>{paint();refresh(true)});
 window.addEventListener('fp-streak-reward',()=>refresh(true));
 let refreshDepotTimer=0;
 window.addEventListener('fp-reward-confirmed',()=>{
  if(refreshDepotTimer)clearTimeout(refreshDepotTimer);
  refreshDepotTimer=setTimeout(()=>{refreshDepotTimer=0;if(user())window.FinanzPilotPortfolio?.load?.()},250);
 });
 window.addEventListener('fp-progress-change',()=>{paint();refresh()});
 window.addEventListener('fp-navigation',()=>refresh());
 window.addEventListener('focus',()=>refresh(true));
 paint();refresh(true);
}
window.FinanzPilotHeader={refresh,get level(){return level()},get xp(){return officialXP()},get fp(){return points}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
