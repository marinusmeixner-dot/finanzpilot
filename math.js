/* FinanzPilot Rechenparser: Grundrechenarten und Klammern, bewusst ohne eval. */
'use strict';
window.FinanzPilotMath = (()=>{
 function calculate(raw){
  const src=String(raw??'').trim().replace(/\s+/g,'').replace(/−/g,'-').replace(/×|·/g,'*').replace(/÷|:/g,'/').replace(/,/g,'.').replace(/%$/,'');
  if(!src||src.length>180||!/^[\d.()+\-*/^]+$/.test(src))throw Error('Bitte eine Zahl oder Rechnung mit +, −, ×, ÷ und Klammern eingeben.');
  let i=0;
  const take=c=>src[i]===c?(i++,true):false;
  function atom(){if(take('+'))return atom();if(take('-'))return -atom();if(take('(')){const x=add();if(!take(')'))throw Error('Es fehlt eine schließende Klammer.');return x;}const start=i;while(i<src.length&&/[\d.]/.test(src[i]))i++;if(start===i)throw Error('Die Rechnung enthält ein ungültiges Zeichen.');const n=Number(src.slice(start,i));if(!Number.isFinite(n))throw Error('Bitte eine gültige Zahl eingeben.');return n}
  function power(){let x=atom();if(take('^'))x=Math.pow(x,power());return x}
  function mult(){let x=power();while(i<src.length){if(take('*'))x*=power();else if(take('/')){const d=power();if(d===0)throw Error('Division durch null ist nicht definiert.');x/=d;}else break}return x}
  function add(){let x=mult();while(i<src.length){if(take('+'))x+=mult();else if(take('-'))x-=mult();else break}return x}
  const out=add();if(i!==src.length||!Number.isFinite(out))throw Error('Die Rechnung konnte nicht ausgewertet werden.');return out;
 }
 function toolbar(){return '<div class="math-toolbar" aria-label="Rechenzeichen"><span>Rechenzeichen:</span>'+['−','+','×','÷','(',')'].map(s=>`<button type="button" class="math-key" data-math-key="${s}" aria-label="${s} einfügen">${s}</button>`).join('')+'</div>'}
 function bind(scope=document){scope.querySelectorAll('.math-toolbar').forEach(bar=>{const wrap=bar.parentElement;const input=wrap?.querySelector('input');if(!input)return;bar.querySelectorAll('[data-math-key]').forEach(btn=>btn.addEventListener('click',()=>{const k=btn.dataset.mathKey;const start=input.selectionStart??input.value.length,end=input.selectionEnd??start;input.value=input.value.slice(0,start)+k+input.value.slice(end);input.focus();input.setSelectionRange(start+k.length,start+k.length)}))})}
 return {calculate,toolbar,bind};
})();