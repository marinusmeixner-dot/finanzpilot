/* FinanzPilot V52 – tiny GPU-friendly motion + original synthesized UI feedback.
 * No playback before user action; no remote media; OS motion preference honored. */
(function(){
 'use strict';
 const KEY='finanzpilot_feedback_preferences_v52';
 const defaultPrefs=()=>({sound:true,motion:'system'});
 function read(){
  try{const s=JSON.parse(localStorage.getItem(KEY)||'{}');return {sound:s.sound!==false,motion:['system','on','off'].includes(s.motion)?s.motion:'system'};}
  catch{return defaultPrefs()}
 }
 let prefs=read(),audio=null,lastNav=0,lastChime=0,feedbackTimer=null;
 const preferredReduced=()=>!!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
 const motion=()=>prefs.motion!=='off'&&!preferredReduced();
 function updateMotion(){
  document.documentElement?.classList?.toggle('fp52-motion',motion());
  document.documentElement?.classList?.toggle('fp52-static',!motion());
 }
 function write(){
  try{localStorage.setItem(KEY,JSON.stringify(prefs))}catch{}
  updateMotion();updateToggle();
 }
 const iconOn='<svg viewBox="0 0 24 24" aria-hidden="true" width="19" height="19" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15 9a5 5 0 0 1 0 6"/><path d="M18 6a9 9 0 0 1 0 12"/></svg>';
 const iconOff='<svg viewBox="0 0 24 24" aria-hidden="true" width="19" height="19" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="m16 9 5 6m0-6-5 6"/></svg>';
 function updateToggle(){
  const button=document.getElementById('fp52-audio-toggle');
  if(!button)return;
  button.innerHTML=prefs.sound?iconOn:iconOff;
  button.setAttribute('aria-pressed',String(prefs.sound));
  button.setAttribute('aria-label',prefs.sound?'App-Töne ausschalten':'App-Töne einschalten');
  button.title=prefs.sound?'Töne eingeschaltet – zum Ausschalten tippen':'Töne ausgeschaltet – zum Einschalten tippen';
  const sound=document.getElementById('fp52-sound-pref');if(sound)sound.checked=prefs.sound;
  const select=document.getElementById('fp52-motion-pref');if(select)select.value=prefs.motion;
 }
 function audioContext(){
  if(!prefs.sound||typeof window.AudioContext!=='function'&&typeof window.webkitAudioContext!=='function')return null;
  if(!audio){try{const Ctor=window.AudioContext||window.webkitAudioContext;audio=new Ctor({latencyHint:'interactive'});}catch{return null}}
  if(audio.state==='suspended')audio.resume?.().catch?.(()=>{});
  return audio;
 }
 function tone(kind){
  if(!prefs.sound)return false;
  const now=Date.now();
  if(now-lastChime<115)return false;
  const context=audioContext();if(!context||context.state==='closed')return false;
  lastChime=now;
  try{
   const t=context.currentTime+0.008;
   const notes={
    tap:[[470,0,.027,.014]],
    correct:[[610,0,.075,.035],[815,.075,.12,.042]],
    reward:[[540,0,.09,.045],[675,.09,.1,.047],[900,.19,.16,.05]],
    level:[[440,0,.10,.035],[660,.10,.13,.042],[880,.23,.2,.045]],
    retry:[[310,0,.11,.035]],
    error:[[260,0,.14,.025]]
   }[kind]||[];
   for(const [frequency,offset,duration,volume] of notes){
    const oscillator=context.createOscillator(),gain=context.createGain();
    oscillator.type=kind==='error'||kind==='retry'?'sine':'sine';
    oscillator.frequency.setValueAtTime(frequency,t+offset);
    gain.gain.setValueAtTime(0.0001,t+offset);
    gain.gain.exponentialRampToValueAtTime(Math.min(.055,volume),t+offset+.012);
    gain.gain.exponentialRampToValueAtTime(.0001,t+offset+duration);
    oscillator.connect(gain);gain.connect(context.destination);
    oscillator.start(t+offset);oscillator.stop(t+offset+duration+.014);
    oscillator.onended=()=>{try{oscillator.disconnect();gain.disconnect()}catch{}};
   }
   return true;
  }catch{return false}
 }
 function flash(kind,text){
  const root=document.getElementById('fp52-feedback');
  if(!root||!text)return;
  if(feedbackTimer)clearTimeout(feedbackTimer);
  root.textContent=String(text).slice(0,170);
  root.className='fp52-toast fp52-'+(kind==='level'?'level':kind==='reward'?'reward':kind==='error'?'error':'success');
  root.hidden=false;
  if(motion()){root.classList.remove('fp52-visible');void root.offsetWidth;root.classList.add('fp52-visible')}
  feedbackTimer=setTimeout(()=>{root.hidden=true;root.classList.remove('fp52-visible');},kind==='reward'||kind==='level'?3100:1800);
 }
 function notify(kind,detail={}){
  if(!['correct','reward','level','retry','error'].includes(kind))return;
  tone(kind);
  const label=typeof detail==='string'?detail:detail.text;
  if(label)flash(kind,label);
 }
 function audioToggle(){prefs.sound=!prefs.sound;write();if(prefs.sound)tone('correct')}
 function settingsPanel(){
  const host=document.getElementById('fp52-settings');
  if(!host)return;
  if(host.hidden){
   host.hidden=false;
   document.getElementById('fp52-motion-pref')?.focus?.();
  }else host.hidden=true;
 }
 function mount(){
  if(!document.body||document.getElementById('fp52-audio-toggle'))return;
  const toolbar=document.querySelector('.header-right');
  if(toolbar){
   const button=document.createElement('button');
   button.type='button';button.id='fp52-audio-toggle';button.className='fp52-audio-toggle';button.addEventListener('click',audioToggle);
   toolbar.prepend(button);
   const settings=document.createElement('button');
   settings.type='button';settings.id='fp52-settings-toggle';settings.className='fp52-settings-toggle';settings.textContent='⚙';settings.title='Darstellung & Töne';
   settings.setAttribute('aria-label','Animationen und Töne einstellen');
   settings.addEventListener('click',settingsPanel);toolbar.prepend(settings);
  }
  const panel=document.createElement('div');
  panel.id='fp52-settings';panel.className='fp52-settings';panel.hidden=true;
  panel.innerHTML='<div class="fp52-settings-head"><strong>Darstellung & Töne</strong><button type="button" data-fp52-close aria-label="Einstellungen schließen">×</button></div>'+
   '<label><input type="checkbox" id="fp52-sound-pref"> Kurze Bestätigungstöne</label>'+
   '<label>Animationen<select id="fp52-motion-pref"><option value="system">Systemeinstellung beachten</option><option value="on">An</option><option value="off">Aus</option></select></label>'+
   '<p>Alle Töne entstehen lokal durch kurze Signale nach einer Bedienung. Keine Musik, Downloads oder automatische Wiedergabe. Die iPhone-Einstellung „Bewegung reduzieren“ hat immer Vorrang.</p>';
  document.body.append(panel);
  panel.querySelector('[data-fp52-close]')?.addEventListener('click',()=>{panel.hidden=true});
  panel.querySelector('#fp52-sound-pref')?.addEventListener('change',e=>{prefs.sound=e.target.checked;write();if(prefs.sound)tone('correct')});
  panel.querySelector('#fp52-motion-pref')?.addEventListener('change',e=>{prefs.motion=e.target.value;write()});
  const toast=document.createElement('div');toast.id='fp52-feedback';toast.className='fp52-toast';toast.hidden=true;toast.setAttribute('role','status');toast.setAttribute('aria-live','polite');document.body.append(toast);
  updateToggle();
 }
 function onClick(event){
  const target=event.target?.closest?.('button');
  if(!target||target.disabled)return;
  if(target.matches('#fp52-audio-toggle,#fp52-settings-toggle,.fp52-settings button'))return;
  if(target.matches('[data-section-main],[data-section-route],[data-fp41-route],[data-fp51-tab],[data-section-back],[data-fp41-skill],[data-fp42-node],[data-fp51-route]')){
   if(Date.now()-lastNav<80)return;
   lastNav=Date.now();tone('tap');
  }
 }
 document.addEventListener('click',onClick,{passive:true});
 window.addEventListener('fp-navigation',()=>{
  if(!motion())return;
  const root=document.getElementById('view-root');
  if(!root)return;
  root.classList.remove('fp52-view-enter');
  if(window.requestAnimationFrame)window.requestAnimationFrame(()=>root.classList.add('fp52-view-enter'));
  else root.classList.add('fp52-view-enter');
 });
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&audio?.state==='running')audio.suspend?.().catch?.(()=>{})});
 const query=window.matchMedia?.('(prefers-reduced-motion: reduce)');
 query?.addEventListener?.('change',updateMotion);
 window.FinanzPilotFeedback={notify,tone,mount,get preferences(){return {...prefs}},setPreferences(next){prefs={sound:next.sound!==false,motion:['system','on','off'].includes(next.motion)?next.motion:'system'};write()}};
 updateMotion();
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
