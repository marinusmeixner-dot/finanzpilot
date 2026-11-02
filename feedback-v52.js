/* V54 – reliable iOS/WebKit audio unlock and audible, original achievement jingles. */
(function(){
'use strict';
const KEY='finanzpilot_feedback_preferences_v52';
const read=()=>{try{const x=JSON.parse(localStorage.getItem(KEY)||'{}');return{sound:x.sound!==false,motion:['system','on','off'].includes(x.motion)?x.motion:'system'}}catch{return{sound:true,motion:'system'}}};
let prefs=read(),audio=null,lastTone=0,lastStatus='',toastTimer=0,unlockAttempted=false;
const reduced=()=>!!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
const motion=()=>prefs.motion!=='off'&&!reduced();
function updateMotion(){
 document.documentElement?.classList?.toggle('fp52-motion',motion());
 document.documentElement?.classList?.toggle('fp52-static',!motion());
}
function updateToggle(root=document){
 const sound=root.querySelector?.('#fp52-sound-pref'),animation=root.querySelector?.('#fp52-motion-pref');
 if(sound)sound.checked=prefs.sound;
 if(animation)animation.checked=prefs.motion!=='off';
}
function write(){try{localStorage.setItem(KEY,JSON.stringify(prefs))}catch{}updateMotion();updateToggle();}
function context(){
 if(!prefs.sound)return null;
 if(audio?.state==='closed')audio=null;
 if(!audio){
  const Constructor=window.AudioContext||window.webkitAudioContext;
  if(!Constructor){lastStatus='WebAudio ist in diesem Browser nicht verfügbar.';return null}
  try{audio=new Constructor({latencyHint:'interactive'})}catch{try{audio=new Constructor()}catch{lastStatus='Audio konnte nicht initialisiert werden.';return null}}
 }
 return audio;
}
function unlock(){
 if(!prefs.sound||document.hidden)return false;
 const ctx=context();if(!ctx)return false;
 if(unlockAttempted&&ctx.state==='running')return true;
 unlockAttempted=true;
 try{
  // iOS Safari requires audio to be primed and resumed within the ORIGINAL touch/click.
  // A near-silent 1ms oscillator unlocks the hardware before an awaited RPC resolves.
  if(ctx.state==='suspended'||ctx.state==='interrupted')ctx.resume?.().catch?.(()=>{});
  const o=ctx.createOscillator(),g=ctx.createGain(),t=ctx.currentTime;
  g.gain.setValueAtTime(.00001,t);
  o.connect(g);g.connect(ctx.destination);
  o.start(t);o.stop(t+.004);
  o.onended=()=>{o.disconnect();g.disconnect()};
  lastStatus=ctx.state==='running'?'Tonwiedergabe bereit.':'Audiowiedergabe wird freigeschaltet …';
  return true;
 }catch{lastStatus='Das Gerät hat die Audiowiedergabe blockiert.';return false}
}
const NOTES={
 tap:[[470,0,.045,.045]],
 correct:[[740,0,.085,.060]],
 answer:[[740,0,.085,.060]], // Standard, soft 85 ms confirmation; not a jingle.
 wrong:[[450,0,.11,.055]], // Neutral 110 ms lower failure cue; not an alarm.
 lesson:[[523,0,.11,.08],[659,.12,.14,.09],[784,.29,.19,.11]],
 unlock:[[392,0,.11,.08],[494,.13,.12,.085],[659,.27,.19,.12]],
 skill:[[392,0,.11,.085],[523,.12,.12,.09],[659,.26,.13,.10],[784,.40,.22,.12]],
 promotion:[[392,0,.13,.09],[494,.14,.13,.095],[588,.29,.15,.11],[784,.46,.28,.13]],
 artifact:[[392,0,.12,.09],[587,.14,.14,.11],[740,.30,.15,.11],[988,.49,.26,.14]],
 shards:[[475,0,.09,.07],[610,.11,.13,.085],[740,.27,.16,.10]],
 mission:[[523,0,.12,.09],[659,.14,.13,.095],[784,.29,.20,.11]],
 streak:[[440,0,.11,.08],[554,.13,.14,.095],[740,.30,.22,.115]],
 reward:[[540,0,.1,.09],[675,.12,.13,.11],[900,.28,.22,.12]],
 level:[[440,0,.12,.09],[660,.15,.16,.11],[880,.34,.22,.13]],
 retry:[[450,0,.11,.055]],
 error:[[450,0,.11,.055]]
};
function tone(kind,force=false){
 if(!prefs.sound||document.hidden)return false;
 const now=Date.now();if(!force&&now-lastTone<55)return false;
 const ctx=context();if(!ctx)return false;
 if(ctx.state==='suspended'||ctx.state==='interrupted')ctx.resume?.().catch?.(()=>{});
 const notes=NOTES[kind]||NOTES.reward;
 try{
  const t=ctx.currentTime+.016;
  for(const [hz,offset,length,volume] of notes){
   const o=ctx.createOscillator(),g=ctx.createGain(),when=t+offset;
   o.type='sine';o.frequency.setValueAtTime(hz,when);
   g.gain.setValueAtTime(.0001,when);
   g.gain.exponentialRampToValueAtTime(Math.min(.15,volume),when+(['correct','answer','wrong','retry','error'].includes(kind)? .006:.018));
   g.gain.exponentialRampToValueAtTime(.0001,when+length);
   o.connect(g);g.connect(ctx.destination);
   o.start(when);o.stop(when+length+.018);
   o.onended=()=>{try{o.disconnect();g.disconnect()}catch{}};
  }
  lastTone=now;lastStatus=ctx.state==='running'?'Ton abgespielt.':'Ton eingeplant – Audio noch nicht freigegeben.';
  return true;
 }catch{lastStatus='Audioausgabe fehlgeschlagen.';return false;}
}
function flash(kind,label){
 const root=document.getElementById('fp52-feedback');if(!root||!label)return;
 if(toastTimer)clearTimeout(toastTimer);
 root.textContent=String(label).slice(0,160);
 root.className='fp52-toast fp52-'+(kind==='error'?'error':'success');
 root.hidden=false;
 toastTimer=setTimeout(()=>{root.hidden=true},1600);
}
function notify(kind,detail={}){
 if(!['correct','answer','wrong','reward','level','retry','error'].includes(kind))return;
 tone(kind);
 const label=typeof detail==='string'?detail:detail.text;if(label)flash(kind,label);
}
// Settings live in Profil. The two switches are the only sound/motion controls;
 // no header speaker, preview buttons, demos or test sounds.
function settingsHtml(){
 return '<section class="fp60-preferences" aria-label="Ton und Animationen">'+
 '<h2>Ton & Animationen</h2><p>Entscheide unabhängig voneinander, ob Erfolgsanimationen und kurze Antworttöne angezeigt beziehungsweise abgespielt werden.</p>'+
 '<label class="fp60-switch-row" for="fp52-sound-pref"><span><strong>Töne</strong><small>Antworten und verdiente Belohnungen</small></span>'+
 '<input type="checkbox" role="switch" id="fp52-sound-pref" '+(prefs.sound?'checked':'')+'></label>'+
 '<label class="fp60-switch-row" for="fp52-motion-pref"><span><strong>Animationen</strong><small>Erhaltene XP, FP, Level, Streak und weitere Erfolge</small></span>'+
 '<input type="checkbox" role="switch" id="fp52-motion-pref" '+(prefs.motion!=='off'?'checked':'')+'></label>'+
 '</section>';
}
function bindSettings(root=document){
 root.querySelector?.('#fp52-sound-pref')?.addEventListener('change',event=>{
  prefs.sound=!!event.currentTarget.checked;write();
  if(prefs.sound)unlock();
 });
 root.querySelector?.('#fp52-motion-pref')?.addEventListener('change',event=>{
  prefs.motion=event.currentTarget.checked?'on':'off';write();
  if(!motion())window.FinanzPilotCelebrations?.stop?.();
 });
 updateToggle(root);
}
function mount(){
 if(!document.body||document.getElementById('fp52-feedback'))return;
 const toast=document.createElement('div');toast.id='fp52-feedback';toast.className='fp52-toast';
 toast.hidden=true;toast.setAttribute('role','status');document.body.append(toast);
}
// Unlock on every explicit user touch/keyboard gesture while enabled; not on page load.
document.addEventListener('pointerdown',unlock,{capture:true,passive:true});
document.addEventListener('touchstart',unlock,{capture:true,passive:true});
document.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')unlock()},{capture:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&audio?.state==='running')audio.suspend?.().catch?.(()=>{})});
window.matchMedia?.('(prefers-reduced-motion: reduce)')?.addEventListener?.('change',updateMotion);
window.FinanzPilotFeedback={tone,notify,unlock,mount,settingsHtml,bindSettings,
 get audioStatus(){return{state:audio?.state||'uninitialized',unlockAttempted,lastStatus}},
 get preferences(){return{...prefs}},
 setPreferences(next){prefs={sound:next.sound===undefined?prefs.sound:next.sound!==false,
 motion:['system','on','off'].includes(next.motion)?next.motion:prefs.motion};write()}
};
updateMotion();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();