/* FinanzPilot V53: purpose-built achievement reveals, never a navigation effect. */
(function(){
'use strict';
const KINDS={
 lesson:{eyebrow:'LEKTION BESTANDEN',glyph:'✓',tone:'lesson',style:'lesson',duration:2200},
 lessonUnlock:{eyebrow:'NEUE LEKTION',glyph:'◇',tone:'unlock',style:'unlock',duration:2100},
 skillUnlock:{eyebrow:'NEUER LERNPFAD',glyph:'✧',tone:'unlock',style:'unlock',duration:2350},
 skill:{eyebrow:'SKILL GEMEISTERT',glyph:'✦',tone:'skill',style:'skill',duration:2900},
 promotion:{eyebrow:'BEFÖRDERUNG ERREICHT',glyph:'♛',tone:'promotion',style:'promotion',duration:3400},
 artifact:{eyebrow:'ARTEFAKT HERGESTELLT',glyph:'◈',tone:'artifact',style:'artifact',duration:3400},
 shards:{eyebrow:'ARTEFAKTSCHERBEN',glyph:'❖',tone:'shards',style:'shards',duration:2600},
 mission:{eyebrow:'MISSION ERFÜLLT',glyph:'★',tone:'mission',style:'mission',duration:2500},
 streak:{eyebrow:'STREAK-MEILENSTEIN',glyph:'✶',tone:'streak',style:'streak',duration:2850},
 reward:{eyebrow:'BELOHNUNG ERHALTEN',glyph:'✦',tone:'reward',style:'reward',duration:2300},
 basics:{eyebrow:'GRUNDLAGE ABGESCHLOSSEN',glyph:'✓',tone:'lesson',style:'lesson',duration:2050}
};
const MAX_QUEUE=2;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let active=null,queue=[],dismissTimer=0,lastGesture=0,lastKey='',lastKeyAt=0;
const reduce=()=>!!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches||window.FinanzPilotFeedback?.preferences?.motion==='off';
const motionOn=()=>!reduce();
const allEvents=()=>active?[active,...queue]:queue.slice();
function mount(){
 if(!document.body)return null;
 let host=document.getElementById('fp53-celebration');
 if(host)return host;
 host=document.createElement('section');
 host.id='fp53-celebration';host.className='fp53-venue';host.hidden=true;host.setAttribute('aria-live','polite');host.setAttribute('aria-atomic','true');
 document.body.append(host);
 return host;
}
const recentInput=()=>Date.now()-lastGesture<12000;
function content(entry){
 const c=KINDS[entry.kind],d=entry.detail;
 // Decorative stars are capped at eight; no canvas, no assets, no perpetual animation.
 const sparks=motionOn()&&['skill','promotion','artifact','shards','mission','streak'].includes(entry.kind)
  ?'<div class="fp53-sparks" aria-hidden="true">'+Array.from({length:8},(_,i)=>'<i class="fp53-spark fp53-s'+i+'"></i>').join('')+'</div>':'';
 const extra=(d.value?'<span class="fp53-value">'+esc(d.value)+'</span>':'');
 return '<article class="fp53-card fp53-'+c.style+(motionOn()?' fp53-animate':'')+'" role="status">'+
  sparks+'<span class="fp53-shine" aria-hidden="true"></span>'+
  '<span class="fp53-emblem" aria-hidden="true"><span>'+c.glyph+'</span></span>'+
  '<div class="fp53-content"><span class="fp53-kicker">'+c.eyebrow+'</span>'+
  '<h2>'+esc(d.title||'Neuer Erfolg')+'</h2>'+
  (d.text?'<p>'+esc(d.text)+'</p>':'')+extra+'</div>'+
  '<button class="fp53-close" type="button" data-fp53-close aria-label="Erfolgsanimation schließen">×</button>'+
 '</article>';
}
function clear(){
 if(dismissTimer){clearTimeout(dismissTimer);dismissTimer=0}
 const root=document.getElementById('fp53-celebration');if(root){root.hidden=true;root.textContent=''}
 active=null;
}
function advance(){
 clear();
 if(queue.length){const next=queue.shift();present(next)}
}
function present(entry){
 if(document.hidden)return;
 const root=mount();if(!root)return;
 active=entry;
 root.innerHTML=content(entry);
 root.hidden=false;
 root.querySelector('[data-fp53-close]')?.addEventListener('click',advance);
 // Only synthesize after genuine input; no automatic streak tones at page load.
 if(entry.detail.sound!==false&&recentInput())window.FinanzPilotFeedback?.tone?.(KINDS[entry.kind].tone);
 dismissTimer=setTimeout(advance,motionOn()?KINDS[entry.kind].duration:1600);
}
function show(kind,detail={}){
 if(!Object.prototype.hasOwnProperty.call(KINDS,kind)||detail?.confirmed!==true)return false;
 if(document.hidden)return false;
 const key=typeof detail.id==='string'?kind+':'+detail.id:'';
 const now=Date.now();
 if(key&&key===lastKey&&now-lastKeyAt<15000)return false;
 if(key){lastKey=key;lastKeyAt=now;}
 const entry={kind,detail:{
  confirmed:true,
  title:String(detail.title||'').slice(0,82),
  text:String(detail.text||'').slice(0,185),
  value:String(detail.value||'').slice(0,80),
  sound:detail.sound!==false
 }};
 // A promotion replaces an adjacent skill-completion flourish, never stacks three overlays.
 if(kind==='promotion'&&active?.kind==='skill'){queue=[];clear();}
 if(active){if(queue.length>=MAX_QUEUE)queue.shift();queue.push(entry)}
 else present(entry);
 return true;
}
function stop(){queue=[];clear()}
document.addEventListener('pointerdown',()=>{lastGesture=Date.now()},{passive:true});
document.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')lastGesture=Date.now()});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});
window.addEventListener('fp-auth-change',stop);
window.FinanzPilotCelebrations={show,stop,mount,get active(){return active?.kind||null},get queued(){return allEvents().map(x=>x.kind)}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();