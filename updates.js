(function installUpdateWatcher(){
'use strict';
const CURRENT_VERSION=29,PATH='./version.json';
let checking=false,updating=false,lastChecked=0;
async function check(force=false){
 if(checking||updating||!navigator.onLine)return;
 if(!force&&Date.now()-lastChecked<45000)return;
 checking=true;lastChecked=Date.now();
 try{
  const r=await fetch(PATH+'?nocache='+Date.now(),{cache:'no-store'});
  if(!r.ok)throw Error('Version '+r.status);
  const v=await r.json(),newVersion=Number(v.version);
  if(!Number.isInteger(newVersion)||newVersion<=CURRENT_VERSION)return;
  updating=true;
  try{const close=window.FinanzPilotCloud?.sync?.();if(close)await Promise.race([close,new Promise(res=>setTimeout(res,6500))]);}catch{}
  let next=new URL('./',location.href);
  next.searchParams.set('v',String(newVersion));
  if(location.hash)next.hash=location.hash;
  location.replace(next.href);
 }catch(e){console.info('[FinanzPilot] versionscheck skipped',e.message||e)}
 finally{checking=false}
}
function start(){
 setTimeout(()=>check(true),1500);
 window.addEventListener('pageshow',()=>check(true));
 window.addEventListener('focus',()=>check());
 window.addEventListener('online',()=>check(true));
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)check(true)});
 setInterval(()=>{if(!document.hidden)check()},180000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.FinanzPilotUpdate={check,currentVersion:CURRENT_VERSION};
})();
