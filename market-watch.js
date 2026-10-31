/* FinanzPilot – personalized market watchlist and sourced chart/news. */
(function(){
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=(v,c)=>new Intl.NumberFormat('de-DE',{style:'currency',currency:/^[A-Z]{3}$/.test(c||'')?c:'USD'}).format(Number(v)||0);
const user=()=>window.FinanzPilotCloud?.user,client=()=>window.FinanzPilotCloud?.paperClient;
let list=[],quotes=[],selected=null,series=null,news=[],busy=false,notice='',cache={},loading=false;
const quote=s=>quotes.find(x=>x.symbol===s);
const renderNow=()=>{if(typeof state!=='undefined'&&state.view==='marketwatch')window.render?.()};
async function load(){
 if(!user()||!client()){list=[];quotes=[];selected=null;series=null;news=[];renderNow();return}
 if(loading)return;loading=true;const uid=user();
 try{
  const {data,error}=await client().from('fp_paper_watchlist').select('symbol,created_at').eq('user_id',uid).order('created_at',{ascending:false}).limit(500);
  if(error)throw error;if(user()!==uid)return;list=data||[];
  if(!selected&&list.length)selected=list[0].symbol;
  const symbols=[...new Set([...list.map(x=>x.symbol),...(selected?[selected]:[])])];
  if(symbols.length){const q=await client().from('fp_paper_quotes').select('symbol,asset_name,price,currency,quote_date,source').in('symbol',symbols);if(q.error)throw q.error;quotes=q.data||[]}else quotes=[];
  notice='';renderNow();if(selected)await select(selected);
 }catch(e){notice='Watchlist konnte nicht geladen werden: '+String(e.message||e);renderNow()}
 finally{loading=false;renderNow()}
}
function chart(points){
 const arr=(points||[]).filter(x=>Number.isFinite(Number(x.price))&&x.price>0);if(arr.length<2)return '<p>Derzeit kein historischer Chart verfügbar.</p>';
 const vals=arr.map(x=>Number(x.price)),low=Math.min(...vals),high=Math.max(...vals),range=Math.max(high-low,.0000001);
 const coords=vals.map((v,i)=>(16+688*i/(vals.length-1)).toFixed(1)+','+(190-157*(v-low)/range).toFixed(1)).join(' ');
 const change=(vals.at(-1)/vals[0]-1)*100,up=change>=0;
 return '<div class="fp-mw-chart"><div><b>'+money(vals.at(-1),series?.currency||quote(selected)?.currency)+'</b><span class="'+(up?'fp-depot-pos':'fp-depot-neg')+'">'+(up?'+':'')+change.toFixed(2).replace('.',',')+' %</span></div><svg role="img" aria-label="Historische Tagesschlusskurse für '+esc(selected)+'" viewBox="0 0 720 210"><polyline fill="none" stroke="'+(up?'#82deb5':'#e6a8a1')+'" stroke-width="3" points="'+coords+'"/></svg><small>'+esc(arr[0].date)+' bis '+esc(arr.at(-1).date)+' · Quelle: Yahoo Finance (inoffiziell) · unbereinigte, historische Schlusskurse</small></div>';
}
async function select(code){
 const id=String(code||'').toUpperCase();if(!/^[A-Z0-9][A-Z0-9.\-]{0,23}$/.test(id))return;
 selected=id;series=null;news=[];notice='';renderNow();if(!client())return;
 if(cache[id]&&Date.now()-cache[id].at<300000){series=cache[id].series;news=cache[id].news;renderNow();return}
 busy=true;
 try{
  const results=await Promise.allSettled([client().functions.invoke('finanzpilot-stock-lookup',{body:{action:'history',symbol:id}}),client().functions.invoke('finanzpilot-stock-lookup',{body:{action:'news',symbol:id}})]);
  if(selected!==id)return;
  const [h,n]=results;const errs=[];
  if(h.status==='fulfilled'&&!h.value.error&&!h.value.data?.error)series=h.value.data;else errs.push('Historischer Kurs nicht abrufbar');
  if(n.status==='fulfilled'&&!n.value.error&&!n.value.data?.error)news=n.value.data?.news||[];else errs.push('Nachrichten derzeit nicht verfügbar');
  cache[id]={at:Date.now(),series,news};notice=errs.join(' · ');
 }catch(e){notice='Kurs-/Newsabruf fehlgeschlagen: '+String(e.message||e)}
 finally{busy=false;renderNow()}
}
function open(symbol){
 selected=String(symbol||'').toUpperCase();series=null;news=[];notice='';
 window.FinanzPilotNavigation?.route('marketwatch');load();return true;
}
const url=s=>{try{const u=new URL(String(s));return u.protocol==='https:'?u.href:null}catch{return null}};
function render(){
 if(!user())return '<div class="fp-mw"><h1>Meine Aktien-Watchlist</h1><p>Zur persönlichen Watchlist bitte anmelden.</p><button class="btn" data-mw-login>Anmelden</button></div>';
 return '<div class="fp-mw"><header><span class="eyebrow">MÄRKTE · BEOBACHTETE AKTIEN</span><h1>Meine Watchlist</h1><p>Alle gemerkten Aktien, mit historischem Kurschart und Nachrichten zu jedem Unternehmen.</p><button class="btn secondary" data-mw-refresh>Aktualisieren</button></header>'+
 (list.length?'<div class="fp-mw-list">'+list.map(x=>{const q=quote(x.symbol);return '<button type="button" class="fp-mw-list-item '+(selected===x.symbol?'selected':'')+'" data-mw-stock="'+esc(x.symbol)+'"><span><b>'+esc(q?.asset_name||x.symbol)+'</b><small>'+esc(x.symbol)+'</small></span><span><b>'+(q?money(q.price,q.currency):'Kein Kurs')+'</b><small>Stand '+esc(q?.quote_date||'nicht verfügbar')+'</small></span></button>'}).join('')+'</div>':'<div class="fp-depot-empty"><p>Du hast noch keine Aktien gemerkt. Im Depot findest du die Aktiensuche.</p><button class="btn" data-mw-depot>Zum Depot</button></div>')+
 (selected?'<section class="fp-mw-detail"><div class="fp-mw-detail-head"><div><small>'+esc(selected)+'</small><h2>'+esc(quote(selected)?.asset_name||selected)+'</h2></div><button type="button" class="btn secondary" data-mw-trade="'+esc(selected)+'">Im Depot handeln →</button></div>'+
 (quote(selected)?'<p>Letzter registrierter Kurs: <b>'+money(quote(selected).price,quote(selected).currency)+'</b> · '+esc(quote(selected).quote_date)+' · '+esc(quote(selected).source||'Historischer Schlusskurs')+'</p>':'')+
 (series?chart(series.points):'<p>'+esc(busy?'Historische Kurse werden geladen …':'Noch kein Chart verfügbar.')+'</p>')+
 '<h2>Unternehmensnachrichten</h2><p>Diese externen Schlagzeilen werden bei Aufruf geladen. Sie sind nicht einzeln von der täglichen Redaktion geprüft. Quelle und Datum kontrollieren.</p>'+
 (news.length?'<div class="fp-mw-news">'+news.map(n=>'<article><small>'+esc(n.publisher)+' · '+(n.published?new Date(n.published*1000).toLocaleDateString('de-DE'):'Datum unbekannt')+'</small><h3>'+esc(n.title)+'</h3>'+(url(n.url)?'<a href="'+esc(url(n.url))+'" target="_blank" rel="noopener noreferrer">Originalquelle ansehen ↗</a>':'')+'</article>').join('')+'</div>':'<p>Noch keine passenden Nachrichten verfügbar. Auch das ist kein Handelssignal.</p>')+'</section>':'')+
 '<p class="fp-depot-message" role="status">'+esc(notice)+'</p></div>';
}
function bind(root=document){
 root.querySelector('[data-mw-login]')?.addEventListener('click',()=>window.FinanzPilotCloud?.openLogin?.());
 root.querySelector('[data-mw-refresh]')?.addEventListener('click',load);
 root.querySelectorAll('[data-mw-stock]').forEach(x=>x.addEventListener('click',()=>select(x.dataset.mwStock)));
 root.querySelector('[data-mw-depot]')?.addEventListener('click',()=>window.FinanzPilotNavigation?.route('depot'));
 root.querySelector('[data-mw-trade]')?.addEventListener('click',e=>window.FinanzPilotPortfolio?.pick?.(e.currentTarget.dataset.mwTrade));
}
window.FinanzPilotMarketWatch={render,bind,load,select,open,get watchlist(){return list},get selected(){return selected}};
window.addEventListener('fp-auth-change',load);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load();
})();
