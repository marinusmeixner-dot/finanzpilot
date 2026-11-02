/* V54 – reliable iOS/WebKit audio unlock and audible, original achievement jingles. */
(function(){
'use strict';
const KEY='finanzpilot_feedback_preferences_v52';
const read=()=>{try{const x=JSON.parse(localStorage.getItem(KEY)||'{}');return{sound:x.sound!==false,motion:['system','on','off'].includes(x.motion)?x.motion:'system'}}catch{return{sound:true,motion:'system'}}};
let prefs=read(),audio=null,lastTone=0,lastStatus='',toastTimer=0,unlockAttempted=false;
const reduced=()=>!!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
const motion=()=>prefs.motion!=='off'&&!reduced();
const iconOn='<svg viewBox="0 0 24 24" aria-hidden="true" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15 9a5 5 0 0 1 0 6"/><path d="M18 6a9 9 0 0 1 0 12"/></svg>';
const iconOff='<svg viewBox="0 0 24 24" aria-hidden="true" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="m16 9 5 6m0-6-5 6"/></svg>';
function updateMotion(){
 document.documentElement?.classList?.toggle('fp52-motion',motion());
 document.documentElement?.classList?.toggle('fp52-static',!motion());
}
function updateToggle(){
 const b=document.getElementById('fp52-settings-toggle');
 if(b){b.innerHTML=prefs.sound?iconOn:iconOff;b.title='Erfolgsanimationen & Töne · '+(prefs.sound?'Ton an':'Ton aus');}
 const x=document.getElementById('fp52-sound-pref');if(x)x.checked=prefs.sound;
 const y=document.getElementById('fp52-motion-pref');if(y)y.value=prefs.motion;
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
 correct:[[1030,0,.072,.070]],
 answer:[[1030,0,.072,.070]], // One clean, high 72ms confirmation ping, not a jingle.
 wrong:[[710,0,.090,.067]], // A slightly lower, single 90ms error ping; no dramatic buzzer.
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
 retry:[[710,0,.090,.067]],
 error:[[710,0,.090,.067]]
};
function tone(kind,force=false){
 if(!prefs.sound||document.hidden)return false;
 const now=Date.now();if(!force&&now-lastTone<45)return false;
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
function soundTest(){
 if(!prefs.sound){prefs.sound=true;write()}
 unlock();
 // Test is initiated directly by user touch; force immediate start irrespective of previous tone.
 const played=tone('answer',true);
 const s=document.getElementById('fp52-audio-status');
 if(s)s.textContent=played?'Testsignal gestartet. Kein Ton? Medienlautstärke prüfen und beim iPhone den Lautlosmodus testweise ausschalten.':'Audio konnte nicht gestartet werden. Töne sind möglicherweise vom Gerät blockiert.';
}
function panelToggle(){
 const p=document.getElementById('fp52-settings');if(!p)return;
 p.hidden=!p.hidden;
 if(!p.hidden)document.getElementById('fp52-sound-test')?.focus?.();
}
function mount(){
 if(!document.body)return;
 if(document.getElementById('fp52-settings-toggle'))return;
 const toolbar=document.querySelector('.header-right');
 if(toolbar){
  const b=document.createElement('button');b.type='button';b.id='fp52-settings-toggle';b.className='fp52-settings-toggle';
  b.setAttribute('aria-label','Erfolgsanimationen und Töne einstellen');b.addEventListener('click',panelToggle);toolbar.prepend(b);
 }
 const settings=document.createElement('div');settings.id='fp52-settings';settings.className='fp52-settings';settings.hidden=true;
 settings.innerHTML='<div class="fp52-settings-head"><strong>Erfolge & Töne</strong><button type="button" data-fp52-close aria-label="Einstellungen schließen">×</button></div>'+
 '<label><input type="checkbox" id="fp52-sound-pref"> Erfolgs- und Bestätigungstöne</label>'+
 '<button type="button" class="fp52-test-button" id="fp52-sound-test">▶ Richtig-Ton testen</button>'+ 
 '<button type="button" class="fp52-test-button fp52-test-wrong" id="fp52-sound-wrong-test">▶ Falsch-Ton testen</button>'+ 

 '<p id="fp52-audio-status" class="fp52-audio-status" role="status">Tippe auf „Ton testen“, um die Audiowiedergabe auf deinem iPhone zu prüfen.</p>'+
 '<label>Animationen<select id="fp52-motion-pref"><option value="system">Systemeinstellung beachten</option><option value="on">An</option><option value="off">Aus</option></select></label>'+
 '<button type="button" class="fp52-test-button fp52-demo-button" id="fp52-animation-test">✦ Belohnungsanimation ansehen</button>'+
 '<button type="button" class="fp52-test-button fp52-demo-button" id="fp52-lesson-animation-test">✓ Lektionsabschluss testen</button>'+
 '<p>Die Vorschau vergibt keine Punkte. Belohnungseffekte laufen von selbst aus, ohne Fenster. Bei fehlendem Ton die Medienlautstärke und den iPhone-Lautlosmodus prüfen.</p>';
 document.body.append(settings);
 settings.querySelector('[data-fp52-close]')?.addEventListener('click',()=>{settings.hidden=true});
 settings.querySelector('#fp52-sound-pref')?.addEventListener('change',e=>{prefs.sound=e.target.checked;write();if(prefs.sound)unlock()});
 settings.querySelector('#fp52-motion-pref')?.addEventListener('change',e=>{prefs.motion=e.target.value;write()});
 settings.querySelector('#fp52-sound-test')?.addEventListener('click',soundTest);
 settings.querySelector('#fp52-sound-wrong-test')?.addEventListener('click',()=>{if(!prefs.sound){prefs.sound=true;write()}unlock();const played=tone('wrong',true);const el=document.getElementById('fp52-audio-status');if(el)el.textContent=played?'Kurzer Fehlerton abgespielt.':'Das Gerät blockiert die Audioausgabe.'});
 settings.querySelector('#fp52-lesson-animation-test')?.addEventListener('click',()=>{
  settings.hidden=true;window.FinanzPilotCelebrations?.preview?.('basics');
 });
 settings.querySelector('#fp52-animation-test')?.addEventListener('click',()=>{
  if(prefs.sound)unlock();
  settings.hidden=true;window.FinanzPilotCelebrations?.preview?.('artifact');
 });
 const toast=document.createElement('div');toast.id='fp52-feedback';toast.className='fp52-toast';toast.hidden=true;toast.setAttribute('role','status');document.body.append(toast);
 updateToggle();
}
// Unlock on every explicit user touch/keyboard gesture while enabled; not on page load.
document.addEventListener('pointerdown',unlock,{capture:true,passive:true});
document.addEventListener('touchstart',unlock,{capture:true,passive:true});
document.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')unlock()},{capture:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&audio?.state==='running')audio.suspend?.().catch?.(()=>{})});
window.matchMedia?.('(prefers-reduced-motion: reduce)')?.addEventListener?.('change',updateMotion);
window.FinanzPilotFeedback={tone,notify,unlock,mount,test:soundTest,get audioStatus(){return{state:audio?.state||'uninitialized',unlockAttempted,lastStatus}},get preferences(){return{...prefs}},setPreferences(next){prefs={sound:next.sound!==false,motion:['system','on','off'].includes(next.motion)?next.motion:'system'};write()}};
updateMotion();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();