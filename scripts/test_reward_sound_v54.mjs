import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=p=>fs.readFileSync(p,'utf8');
const audioJs=read('feedback-v52.js'),revealJs=read('celebrations-v53.js'),css=read('celebrations-v53.css');
const html=read('index.html');
assert(html.includes('feedback-v52.js?v=58')&&html.includes('celebrations-v53.js?v=58'));
assert(css.includes('.fp53-venue{')&&css.includes('pointer-events:none'));
assert(!css.includes('.fp53-card{')&&!revealJs.includes('fp53-card'),'No window/cards.');
assert(!revealJs.includes('fp53-close'),'No close button: disappears automatically.');
assert(revealJs.includes('dismissTimer=setTimeout(advance'),'Automatically closes and advances queue.');
assert(revealJs.includes('fp54-particle'),'Celebration uses lightweight, capped particles.');
assert(/@media\(prefers-reduced-motion:reduce\)/.test(css),'Motion reduction mandatory.');
const events={},storage={},calls={contexts:0,oscillators:0,resumes:0,maxVolume:0};
class AudioContext{
 constructor(){calls.contexts++;this.currentTime=0;this.state='suspended';this.destination={};}
 resume(){calls.resumes++;this.state='running';return Promise.resolve();}
 createOscillator(){calls.oscillators++;return{frequency:{setValueAtTime(){}},connect(){},start(){},stop(){},disconnect(){},onended:null}}
 createGain(){return{gain:{setValueAtTime(v){calls.maxVolume=Math.max(calls.maxVolume,v)},exponentialRampToValueAtTime(v){calls.maxVolume=Math.max(calls.maxVolume,v)}},connect(){},disconnect(){}}}
}
const doc={hidden:false,body:null,readyState:'loading',documentElement:{classList:{toggle(){}}},addEventListener(type,cb){events[type]=cb},getElementById(){return null}};
const win={webkitAudioContext:AudioContext,AudioContext:undefined,addEventListener(){},matchMedia(){return{matches:false,addEventListener(){}}}};
const ctx=vm.createContext({window:win,document:doc,localStorage:{getItem:key=>storage[key]||null,setItem:(key,value)=>storage[key]=value},Date,JSON,console,setTimeout:()=>1,clearTimeout(){}});
vm.runInContext(audioJs,ctx);
assert.equal(calls.contexts,0,'No audio initialized on page load.');
assert.equal(typeof events.pointerdown,'function','Unlock registered on original pointerdown.');
assert.equal(typeof events.touchstart,'function','Unlock on older iOS touch devices.');
events.pointerdown();
assert.equal(calls.contexts,1);
assert.equal(calls.resumes,1,'Resume inside user gesture.');
assert.equal(calls.oscillators,1,'Silent oscillator opens hardware on iPhone.');
assert.equal(win.FinanzPilotFeedback.audioStatus.state,'running');
events.pointerdown();
assert.equal(calls.oscillators,1,'Already running audio must not re-prime on every tap.');
assert.equal(win.FinanzPilotFeedback.tone('artifact'),true);
assert.equal(calls.oscillators,5,'Four distinct achievement notes after one prime.');
assert(calls.maxVolume>=.1,'Rewards must be audible, not near-silent.');
win.FinanzPilotFeedback.setPreferences({sound:false,motion:'off'});
assert.equal(win.FinanzPilotFeedback.tone('promotion',true),false);
assert.equal(calls.oscillators,5,'Muted audio must not play.');
assert(audioJs.includes('id="fp52-sound-test"')&&audioJs.includes('id="fp52-animation-test"'));
assert(audioJs.includes("preview?.('artifact')"),'User must be able to try a non-reward preview.');
assert(revealJs.includes('confirmed!==true'),'Unconfirmed awards must remain silent.');
assert(!/setInterval\s*\(|requestAnimationFrame\s*\(\s*function\s+loop/.test(audioJs+revealJs),'No perpetual loops.');
console.log('V54: user-gesture iOS AudioContext unlock, audible reward tones, test/preview controls, automatic non-blocking fullscreen-free achievements and reduced motion PASS.');
