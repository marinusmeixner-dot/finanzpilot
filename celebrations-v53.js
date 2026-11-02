/* V54: floating, automatic, nonblocking achievement choreography (no modal or card). */
(function(){
'use strict';
const KINDS={
 lesson:{caption:'LEKTION BESTANDEN',icon:'✓',tone:'lesson',duration:2600,level:2},
 basics:{caption:'GRUNDLAGE ABGESCHLOSSEN',icon:'✓',tone:'lesson',duration:2600,level:2},
 lessonUnlock:{caption:'LEKTION FREIGESCHALTET',icon:'◇',tone:'unlock',duration:2000,level:1},
 skillUnlock:{caption:'SKILL FREIGESCHALTET',icon:'✧',tone:'unlock',duration:2250,level:2},
 skill:{caption:'SKILL GEMEISTERT',icon:'✦',tone:'skill',duration:2650,level:2},
 promotion:{caption:'BEFÖRDERUNG!',icon:'♛',tone:'promotion',duration:3100,level:3},
 shards:{caption:'ARTEFAKTSCHERBEN',icon:'◆',tone:'shards',duration:2150,level:2},
 artifact:{caption:'NEUES ARTEFAKT',icon:'◈',tone:'artifact',duration:3100,level:3},
 mission:{caption:'MISSION GESCHAFFT',icon:'★',tone:'mission',duration:2400,level:2},
 streak:{caption:'STREAK-MEILENSTEIN',icon:'✶',tone:'streak',duration:2450,level:2},
 level:{caption:'LEVEL AUFGESTIEGEN!',icon:'⬆',tone:'level',duration:2800,level:3},
 reward:{caption:'BELOHNUNG',icon:'✦',tone:'reward',duration:2100,level:2}
};
const escape=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const prefersReduced=()=>!!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches||window.FinanzPilotFeedback?.preferences?.motion==='off';
let active=null,queue=[],dismissTimer=0,seen=new Map(),lastGesture=0;
const MAX_QUEUE=4; // Bounded: lesson, server XP/FP, possible level-up and shard rewards must all survive.
function mount(){
 if(!document.body)return null;
 let host=document.getElementById('fp53-celebration');
 if(host)return host;
 host=document.createElement('section');host.id='fp53-celebration';host.className='fp53-venue';
 host.hidden=true;host.setAttribute('aria-live','polite');host.setAttribute('aria-atomic','true');
 document.body.append(host);return host;
}
function html(item){
 const k=KINDS[item.kind],d=item.detail;
 const reduced=prefersReduced();
 const count=reduced?0:k.level===3?12:k.level===2?8:0;
 const spark=Array.from({length:count},(_,i)=>'<i class="fp54-particle fp54-p'+i+'" aria-hidden="true"></i>').join('');
 // The celebration has no background frame, dialog, close button, focus capture or blocking surface.
 return '<div class="fp54-scene fp54-'+item.kind+(reduced?' fp54-reduced':' fp54-motion')+'" role="status">'+
 '<div class="fp54-aura" aria-hidden="true"></div><div class="fp54-particles" aria-hidden="true">'+spark+'</div>'+
 '<div class="fp54-rings" aria-hidden="true"><i></i><i></i></div>'+
 '<div class="fp54-icon" aria-hidden="true">'+k.icon+'</div>'+
 '<div class="fp54-caption">'+k.caption+'</div>'+
 '<div class="fp54-title">'+escape(d.title||'Erfolg freigeschaltet')+'</div>'+
 (d.text?'<div class="fp54-detail">'+escape(d.text)+'</div>':'')+
 (d.value?'<span class="fp54-value">'+escape(d.value)+'</span>':'')+
 (d.demo?'<span class="fp54-demo">VORSCHAU · KEINE BELOHNUNG</span>':'')+
 '</div>';
}
function clear(){
 if(dismissTimer){clearTimeout(dismissTimer);dismissTimer=0;}
 const host=document.getElementById('fp53-celebration');
 if(host){host.hidden=true;host.textContent='';}
 active=null;
}
function advance(){
 clear();
 if(queue.length&&!document.hidden)present(queue.shift());
 else queue.length=0;
}
function present(item){
 if(document.hidden)return;
 const host=mount();if(!host)return;
 active=item;host.innerHTML=html(item);host.hidden=false;
 // The audio context is unlocked inside the original tap before async Supabase RPC resolves.
 if(item.detail.sound!==false && (item.detail.demo||Date.now()-lastGesture<60000))window.FinanzPilotFeedback?.tone?.(KINDS[item.kind].tone);
 dismissTimer=setTimeout(advance,prefersReduced()?1400:KINDS[item.kind].duration);
}
function show(kind,detail={}){
 if(!Object.prototype.hasOwnProperty.call(KINDS,kind)||detail.confirmed!==true||document.hidden)return false;
 const id=typeof detail.id==='string'?kind+':'+detail.id:'',now=Date.now();
 for(const [key,at] of seen){if(now-at>60000)seen.delete(key);}
 if(id&&seen.has(id))return false;
 if(id){seen.set(id,now);if(seen.size>40)seen.delete(seen.keys().next().value);}
 const entry={kind,detail:{title:String(detail.title||'').slice(0,85),text:String(detail.text||'').slice(0,150),value:String(detail.value||'').slice(0,50),sound:detail.sound!==false,demo:detail.demo===true}};
 if(kind==='promotion'&&active?.kind==='skill'){queue.length=0;clear();}
 if(active){if(queue.length===MAX_QUEUE)queue.shift();queue.push(entry);}else present(entry);
 return true;
}
function preview(kind='artifact'){
 if(!KINDS[kind])kind='artifact';
 const demo={artifact:['Datenprisma entdeckt!','ARTEFAKT'],basics:['Grundlage gemeistert','LEKTION GESCHAFFT'],lesson:['Lektion bestanden','LEKTION GESCHAFFT'],level:['Levelaufstieg!','LEVEL ERREICHT'],streak:['Tagesbesuch bestätigt','STREAK GEHALTEN']};
 const [title,value]=demo[kind]||['Neue Auszeichnung','ERFOLG'];
 return show(kind,{confirmed:true,demo:true,id:'preview-'+Date.now(),title,text:'Vorschau ohne echte XP, FP oder Auszahlungen.',value});
}
function stop(){queue.length=0;clear();}
document.addEventListener('pointerdown',()=>{lastGesture=Date.now()},{passive:true});
document.addEventListener('touchstart',()=>{lastGesture=Date.now()},{passive:true});
document.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')lastGesture=Date.now()});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});
// An auth refresh must not erase an earned achievement mid-animation. A genuine sign-out
// may clear stale account-specific overlays; current interactions remain nonblocking.
window.addEventListener('fp-auth-change',()=>{if(!window.FinanzPilotCloud?.user)stop()});
window.FinanzPilotCelebrations={show,preview,stop,mount,get active(){return active?.kind||null},get queued(){return [active,...queue].filter(Boolean).map(x=>x.kind)}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();