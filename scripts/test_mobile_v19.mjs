import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync('sync.js','utf8');
const css=fs.readFileSync('mobile-layout-v19.css','utf8');
const markup=fs.readFileSync('index.html','utf8');
assert(markup.includes('mobile-layout-v19.css?v=19'));
assert(markup.includes('sync.js?v=19'));
assert(markup.includes('content="black"'));
assert(css.includes('env(safe-area-inset-top'));
assert(css.includes('position:sticky!important'));
assert(css.includes('min-height:100dvh'));
assert(source.includes("'fp-navigation'"));
assert(source.includes("lastSyncAt"));
assert(source.includes("afterUpload!==JSON.stringify(merged)"));
assert(source.includes("clearTimeout(retryTimer)"));

const registry=new Map(),eventListeners={},windowListeners={};
function createElement(tag){
 const handlers={};
 let id='',inner='';
 const el={
  tagName:tag,style:{},dataset:{},hidden:false,checked:false,value:'',textContent:'',
  get id(){return id},set id(v){id=v;registry.set(v,el)},
  get innerHTML(){return inner},
  set innerHTML(html){inner=String(html);for(const found of inner.matchAll(/\bid="([^"]+)"/g)){if(!registry.has(found[1])){const child=createElement('div');child.id=found[1]}}},
  setAttribute(){},addEventListener(type,fn){handlers[type]=fn},
  click(){handlers.click?.({currentTarget:el,preventDefault(){}})},
  append(){},
  focus(){},
  querySelector(){return null}
 };
 return el;
}
const body={append(el){if(el.id)registry.set(el.id,el)}};
const doc={readyState:'loading',hidden:false,body,
 getElementById:id=>registry.get(id)||null,
 querySelector:s=>s==='.header-right'?{append(el){if(el.id)registry.set(el.id,el)}}:null,
 createElement,
 addEventListener:(event,fn)=>eventListeners[event]=fn
};
let writes=0,reads=0,reloads=0,authChanged=null;
let cloudData=null;
const user={id:'signed-test-user',email:'example@example.com'};
const session={user,access_token:'test-token'};
const db={
 from(table){assert.equal(table,'finanzpilot_progress');return{
  select(){return{eq(){return{async maybeSingle(){reads++;return {data:cloudData,error:null}}}}}},
  async upsert(data){writes++;cloudData={progress_data:data.progress_data,allow_coach_analysis:false};return {error:null}},
  update(){return{eq:async()=>({error:null})}}
 }}
};
const client={
 auth:{onAuthStateChange:fn=>{authChanged=fn},
  getSession:async()=>({data:{session},error:null})},
 from:db.from
};
const win={
 supabase:{createClient:()=>client},
 addEventListener:(event,fn)=>windowListeners[event]=fn,
 dispatchEvent(){},
 location:{}
};
const memory={
 finanzpilot_v1:JSON.stringify({xp:20,completed:{intro:true},history:[],seenDates:[]})
};
const storage={
 getItem:k=>memory[k]??null,
 setItem:(k,v)=>{memory[k]=String(v)},
 removeItem:k=>{delete memory[k]}
};
const network={onLine:true};
const context=vm.createContext({
 window:win,document:doc,localStorage:storage,navigator:network,
 location:{reload(){reloads++},href:'https://example.com'},Event:class Event{constructor(type){this.type=type}},
 Date,JSON,Math,Number,Object,Set,Promise,console,
 setTimeout,clearTimeout,setInterval:()=>null,
 fetch:async()=>({ok:true}),URL
});
vm.runInContext(source,context,{filename:'sync.js'});
assert.equal(typeof eventListeners.DOMContentLoaded,'function');
eventListeners.DOMContentLoaded();
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
await wait(60);
assert(win.FinanzPilotCloud.user==='signed-test-user','Supabase login must resolve');
assert.equal(win.FinanzPilotCloud.ready,true,'Initial sync must complete');
assert(writes>=1&&reads>=1,'Initial sync must read and write cloud data');
assert(['success','pending'].includes(doc.getElementById('fp-quick-sync').dataset.syncState));
if(reloads)assert.equal(doc.getElementById('fp-quick-sync').dataset.syncState,'pending','Cloud import reload is still pending');
const oldWrites=writes;
memory.finanzpilot_v1=JSON.stringify({...JSON.parse(memory.finanzpilot_v1),xp:44});
windowListeners['fp-progress-change']();
assert.equal(doc.getElementById('fp-quick-sync').dataset.syncState,'pending');
windowListeners['fp-navigation']();
await wait(80);
assert(writes>oldWrites,'Navigation must flush pending progress');
assert.equal(JSON.parse(memory.finanzpilot_v1).xp,44);
assert.equal(doc.getElementById('fp-quick-sync').dataset.syncState,'success');
network.onLine=false;
windowListeners.offline();
assert.equal(doc.getElementById('fp-quick-sync').dataset.syncState,'offline');
await win.FinanzPilotCloud.sync();
assert.equal(doc.getElementById('fp-quick-sync').dataset.syncState,'offline');
network.onLine=true;
windowListeners.online();
await wait(80);
assert.equal(doc.getElementById('fp-quick-sync').dataset.syncState,'success');
authChanged('SIGNED_OUT',null);
assert.equal(win.FinanzPilotCloud.user,null);
assert.equal(doc.getElementById('fp-quick-sync').dataset.syncState,'guest');
assert.equal(JSON.parse(memory.finanzpilot_v1).xp,44,'Logout must keep local progress');
console.log('Mobile v19 OK: notch-safe header, authenticated sync, navigation-triggered save, offline/online recovery, logout data retention.');
