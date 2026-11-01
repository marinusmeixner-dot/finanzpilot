/* v43 Artifact Forge: genuine server-verified shards and four-slot craft inventory. */
(function(){
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&#39;'}[c]));
const names={compass:'Finanzkompass',prism:'Forschungsprisma',lens:'Analystenlinse',codex:'Wissenskodex',beacon:'Marktleuchte',orbit:'Portfolio-Orbit'};
const effects={xp_5:'+5 % XP für zukünftige bestandene Skill-Lektionen',fp_5:'+5 % Forschungspunkte bei zukünftigen Skillabschlüssen',xp_fp_3:'+3 % XP und +3 % FP bei zukünftigen Skillabschlüssen'};
let shards=0,crafted=[],oldActive=0,loading=false,error='',feedback='',loadedFor=null;
const user=()=>window.FinanzPilotCloud?.user;
const client=()=>window.FinanzPilotCloud?.paperClient;
const show=()=>{if(typeof state!=='undefined'&&state.view==='inventory')window.render?.()};
async function refresh(){
 if(!user()||!client()){shards=0;crafted=[];oldActive=0;loadedFor=null;show();return}
 if(loading)return;
 loading=true;const id=user();
 try{
  const [a,b,c]=await Promise.all([
   client().from('fp_artifact_shards').select('shards').eq('user_id',id).maybeSingle(),
   client().from('fp_crafted_artifacts').select('id,kind,effect,tier,created_at,redeemed_at,redeemed_for').eq('user_id',id).order('created_at',{ascending:false}).limit(120),
   client().from('fp_reward_claims').select('choice').eq('user_id',id)
  ]);
  if(a.error||b.error||c.error)throw a.error||b.error||c.error;
  if(id!==user())return;
  shards=Number(a.data?.shards)||0;crafted=b.data||[];oldActive=(c.data||[]).filter(x=>!x.choice).length;error='';loadedFor=id;
 }catch(e){error='Scherbeninventar konnte nicht geladen werden: '+String(e.message||e)}
 finally{loading=false;show()}
}
function render(){
 const active=crafted.filter(x=>!x.redeemed_at).length+oldActive;
 return '<section class="fp43-shard-page"><div class="fp43-shard-head"><span class="eyebrow">ARTEFAKTWERKSTATT</span><h2>Aus Scherben werden Artefakte</h2><p>Für jede Beförderung nach drei neu erlernten Skills erhältst du drei Scherben. Drei Scherben ergeben ein zufälliges Artefakt. Es kann dir künftig beim Lernen einen kleinen Vorteil geben – oder einmalig eingetauscht werden.</p></div>'+
 '<div class="fp43-shard-balances"><div><small>Scherben</small><b>'+shards+'</b></div><div><small>Aktive Artefakte</small><b>'+active+' / 4</b></div><div><small>Nächste Herstellung</small><b>3 Scherben</b></div></div>'+
 '<button type="button" class="btn" data-fp43-craft '+(loading||shards<3||active>=4?'disabled':'')+'>Zufälliges Artefakt herstellen</button>'+
 '<p class="fp43-shard-caption">Der Server wählt den Effekt erst bei der Herstellung aus. Du kannst höchstens vier aktive Artefakte besitzen. Alte, noch nicht eingelöste Forschungsartefakte zählen mit. Beim Einlösen endet der Besitzbonus endgültig.</p>'+
 (error?'<p class="fp43-shard-error" role="status">'+esc(error)+'</p>':'')+(feedback?'<p class="fp43-shard-feedback" role="status">'+esc(feedback)+'</p>':'')+
 '<div class="fp43-craft-grid">'+crafted.map(a=>'<article class="fp43-craft-card '+(a.redeemed_at?'redeemed':'')+'"><div class="eyebrow">'+(a.redeemed_at?'BEREITS EINGELÖST':'AKTIV · LEVEL '+a.tier)+'</div><h3>'+esc(names[a.kind]||a.kind)+'</h3><p>'+esc(effects[a.effect]||a.effect)+'</p>'+
 (a.redeemed_at?'<small>Eingelöst gegen '+(a.redeemed_for==='cash'?'75 € Spielgeld':'8 Forschungspunkte')+'</small>':
 '<div class="fp43-craft-choices"><button class="btn secondary" type="button" data-fp43-exchange="'+esc(a.id)+'" data-fp43-choice="cash">Für 75 € tauschen</button><button class="btn secondary" type="button" data-fp43-exchange="'+esc(a.id)+'" data-fp43-choice="points">Für 8 FP tauschen</button></div>')+
 '</article>').join('')+'</div></section>';
}
async function rpc(name,args){
 if(!client())throw Error('Für die Werkstatt anmelden.');
 const {data,error:e}=await client().rpc(name,args);
 if(e)throw e;
 await refresh();
 window.FinanzPilotEconomy?.refresh?.(false);
 window.FinanzPilotLearningHub?.load?.(true);
 window.FinanzPilotHeader?.refresh?.();
 return data;
}
function bind(root=document){
 root.querySelector('[data-fp43-craft]')?.addEventListener('click',async e=>{
  if(!window.confirm('Drei Scherben verwenden und einen zufälligen dauerhaften Lernvorteil herstellen?'))return;
  e.currentTarget.disabled=true;
  try{const d=await rpc('fp_craft_artifact');feedback='Artefakt hergestellt: '+(names[d.kind]||d.kind)+'. '+effects[d.effect]}catch(err){feedback='Herstellung nicht abgeschlossen: '+String(err.message||err)}
  show()
 });
 root.querySelectorAll('[data-fp43-exchange]').forEach(b=>b.addEventListener('click',async()=>{
  const choice=b.dataset.fp43Choice;
  if(!window.confirm('Artefakt dauerhaft aufgeben und '+(choice==='cash'?'75 € virtuelles Depotgeld':'8 Forschungspunkte')+' erhalten?'))return;
  try{await rpc('fp_exchange_crafted_artifact',{p_id:b.dataset.fp43Exchange,p_choice:choice});feedback='Artefakt eingetauscht.'}catch(e){feedback='Tausch fehlgeschlagen: '+String(e.message||e)}
  show()
 }));
}
window.addEventListener('fp-auth-change',refresh);
window.addEventListener('fp-navigation',()=>{if(typeof state!=='undefined'&&state.view==='inventory'&&user()&&loadedFor!==user())refresh()});
window.FinanzPilotArtifacts={render,bind,refresh,get shards(){return shards},get active(){return crafted.filter(x=>!x.redeemed_at).length+oldActive}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh,{once:true});else refresh();
})();
