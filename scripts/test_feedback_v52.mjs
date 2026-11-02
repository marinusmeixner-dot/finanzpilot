import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const code=fs.readFileSync('feedback-v52.js','utf8'),css=fs.readFileSync('feedback-v52.css','utf8'),index=fs.readFileSync('index.html','utf8');
assert(index.includes('feedback-v52.js?v=57')&&index.includes('feedback-v52.css?v=54'));
assert(code.includes('AudioContext')&&code.includes('webkitAudioContext'),'Must support Safari audio.');
assert(code.includes('prefers-reduced-motion'),'Must honor accessibility media query.');
assert(code.includes('fp52-sound-pref')&&code.includes('fp52-motion-pref'),'Must provide sound and motion controls.');
assert(!/setInterval\(|while\s*\(true\)|requestAnimationFrame\s*\(\s*function\s+loop/.test(code),'No perpetual effects loop.');
assert(!/https?:\/\//.test(code),'Sound is locally synthesized, no remote media or network dependency.');
assert(/@media\(prefers-reduced-motion:reduce\)/.test(css),'CSS must also enforce motion reduction.');
const events={},stored={},activeClasses={};
let contexts=0,oscillators=0;
class FakeAudioContext{
 constructor(){contexts++;this.currentTime=0;this.state='running';this.destination={};}
 createOscillator(){oscillators++;return{frequency:{setValueAtTime(){}},connect(){},start(){},stop(){},disconnect(){},onended:null}}
 createGain(){return{gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}}}
}
const doc={readyState:'loading',body:null,hidden:false,documentElement:{classList:{toggle(k,v){activeClasses[k]=v}}},addEventListener(n,h){events[n]=h},getElementById(){return null}};
const win={AudioContext:FakeAudioContext,addEventListener(n,h){events['window:'+n]=h},matchMedia(){return{matches:false,addEventListener(){}}},requestAnimationFrame:fn=>fn()};
const ctx=vm.createContext({window:win,document:doc,localStorage:{getItem:k=>stored[k]||null,setItem:(k,v)=>stored[k]=v},Date,JSON,console,setTimeout:()=>1,clearTimeout(){}});
vm.runInContext(code,ctx);
const feedback=win.FinanzPilotFeedback;
assert.equal(contexts,0,'No audio or oscillator on initial load.');
assert.equal(feedback.preferences.sound,true);
assert.equal(feedback.preferences.motion,'system');
feedback.notify('correct',{text:'Verified answer'});
assert.equal(contexts,1);
assert.equal(oscillators,2,'Lightweight two-note correct feedback.');
feedback.setPreferences({sound:false,motion:'off'});
assert.equal(feedback.preferences.sound,false);
assert.equal(activeClasses['fp52-motion'],false);
const previous=oscillators;
feedback.notify('reward',{text:'Bonus'});
assert.equal(oscillators,previous,'No sound if muted.');
assert(stored.finanzpilot_feedback_preferences_v52.includes('"sound":false'));
feedback.setPreferences({sound:true,motion:'on'});
assert.equal(activeClasses['fp52-motion'],true);
assert(!css.includes('infinite'),'Never use infinitely running CSS animation.');
assert(fs.readFileSync('missions-v51.js','utf8').includes("FinanzPilotCelebrations?.show?.('mission'"));
assert(fs.readFileSync('learning-hub-v41.js','utf8').includes("FinanzPilotCelebrations?.show?.(event"));
assert(fs.readFileSync('economy.js','utf8').includes("FinanzPilotCelebrations?.show?.('artifact'"));
console.log('V52 sound and motion: opt-in interactions, bounded oscillator nodes, user mute, reduced-motion controls, events and app-wide reward signaling PASS.');
