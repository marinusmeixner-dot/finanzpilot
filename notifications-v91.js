/* FinanzPilot v91: consent-based iOS Web Push, isolated from learning/account state. */
(function(){
'use strict';
const API='https://oqhwgksunlffvknaspmx.supabase.co/functions/v1/finanzpilot-push';
const STORAGE='finanzpilot_push_prefs_v91';
const LABELS={news:'Wichtige Börsennachrichten',market:'Markt & neue Analysen',learning:'Lernen & Missionen',portfolio:'Depotmeldungen (virtuell)'};
const DEFAULTS={news:true,market:true,learning:true,portfolio:false};
let registration=null;
let prefs={...DEFAULTS};
try{prefs={...DEFAULTS,...JSON.parse(localStorage.getItem(STORAGE)||'{}')}}catch{}
const cloud=()=>window.FinanzPilotCloud;
const client=()=>cloud()?.reviewClient;
const supported=()=>isSecureContext&&('serviceWorker' in navigator)&&('PushManager' in window)&&('Notification' in window);
const el=id=>document.getElementById(id);
const save=()=>{try{localStorage.setItem(STORAGE,JSON.stringify(prefs))}catch{}};
const categories=()=>Object.keys(LABELS).filter(key=>prefs[key]);
const arrayBuffer=base64=>{
 const data=base64.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-base64.length%4)%4);
 return Uint8Array.from(atob(data),c=>c.charCodeAt(0));
};
const status=(message,active)=>{
 const target=el('fp91-push-status');
 if(target)target.textContent=message;
 if(typeof active==='boolean'){
  if(el('fp91-push-enable'))el('fp91-push-enable').hidden=active;
  if(el('fp91-push-disable'))el('fp91-push-disable').hidden=!active;
  if(el('fp91-push-test'))el('fp91-push-test').disabled=!active;
 }
};
const issue=e=>e?.message||String(e||'Unbekannter Fehler');
async function worker(){
 if(!supported())throw Error('Web-Push wird in dieser Umgebung nicht unterstützt. Öffne FinanzPilot über das Home-Bildschirm-Symbol auf einem aktuellen iPhone.');
 return registration||(registration=await navigator.serviceWorker.register('./sw.js',{scope:'./'}));
}
async function config(){
 const r=await fetch(API,{cache:'no-store'});
 const data=await r.json();
 if(!r.ok||!data.vapidPublicKey)throw Error(data.error||'Push-Server derzeit nicht erreichbar');
 return data.vapidPublicKey;
}
async function refresh(){
 if(!el('fp91-push-status'))return;
 if(!supported()){status('Nicht verfügbar: Auf dem iPhone die installierte Home-Bildschirm-App öffnen.',false);return}
 if(Notification.permission==='denied'){status('Benachrichtigungen wurden blockiert. Unter iPhone-Einstellungen → Mitteilungen → FinanzPilot wieder erlauben.',false);return}
 try{
  const reg=await worker(), sub=await reg.pushManager.getSubscription();
  if(!sub){status('Noch nicht aktiviert. Du entscheidest selbst, ob du Meldungen erhalten möchtest.',false);return}
  if(!client()||!cloud()?.user){status('Push ist auf diesem Gerät eingerichtet. Bitte bei FinanzPilot anmelden, um die Zustellung zu verwalten.',false);return}
  const {data,error}=await client().from('fp_push_subscriptions').select('enabled,categories').eq('endpoint',sub.endpoint).eq('user_id',cloud().user).maybeSingle();
  if(error)throw error;
  if(!data){status('Noch nicht für dein Konto registriert. Tippe auf Aktivieren.',false);return}
  if(Array.isArray(data.categories)){
    for(const name of Object.keys(LABELS)){prefs[name]=data.categories.includes(name);const box=el('fp91-push-'+name);if(box)box.checked=!!prefs[name]}save();
  }
  status(data.enabled?'Aktiv: Push-Benachrichtigungen sind für dein iPhone eingerichtet.':'Deaktiviert',!!data.enabled);
 }catch(e){status('Statusprüfung nicht möglich: '+issue(e),false)}
}
async function enable(){
 if(!client()||!cloud()?.user){status('Bitte zuerst bei FinanzPilot anmelden.');cloud()?.openLogin?.();return}
 if(!supported()){await refresh();return}
 if(!categories().length){status('Bitte mindestens eine Kategorie auswählen.');return}
 // Permission MUST be requested from the user-initiated click, never on page load.
 const request=Notification.permission==='default'?Notification.requestPermission():Promise.resolve(Notification.permission);
 try{
  const permission=await request;
  if(permission!=='granted'){status('Keine Berechtigung. Du kannst sie in den iPhone-Mitteilungseinstellungen ändern.',false);return}
  status('Dein iPhone wird registriert …');
  const key=await config();
  const reg=await worker();
  const sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:arrayBuffer(key)});
  const data=sub.toJSON();
  if(!data.keys?.p256dh||!data.keys?.auth)throw Error('iPhone lieferte keine vollständigen Push-Schlüssel');
  const {error}=await client().from('fp_push_subscriptions').upsert({
   user_id:cloud().user,endpoint:sub.endpoint,p256dh:data.keys.p256dh,auth:data.keys.auth,
   categories:categories(),enabled:true,updated_at:new Date().toISOString()
  },{onConflict:'endpoint'});
  if(error)throw error;
  save();status('Push ist aktiviert. Jetzt kannst du eine Testmeldung senden.',true);
 }catch(e){status('Aktivierung fehlgeschlagen: '+issue(e),false)}
}
async function disable(){
 try{
  const sub=await (await worker()).pushManager.getSubscription();
  if(sub&&client()&&cloud()?.user){
   const {error}=await client().from('fp_push_subscriptions').delete().eq('user_id',cloud().user).eq('endpoint',sub.endpoint);
   if(error)throw error;
  }
  if(sub)await sub.unsubscribe();
  status('Push ist auf diesem Gerät deaktiviert.',false);
 }catch(e){status('Deaktivierung fehlgeschlagen: '+issue(e))}
}
async function saveCategories(){
 save();
 if(!client()||!cloud()?.user)return;
 try{
  const sub=await (await worker()).pushManager.getSubscription();
  if(!sub)return;
  const {error}=await client().from('fp_push_subscriptions').update({categories:categories(),updated_at:new Date().toISOString()}).eq('endpoint',sub.endpoint).eq('user_id',cloud().user);
  if(error)throw error;
  status(categories().length?'Themenauswahl gespeichert.':'Alle Kategorien ausgeschaltet. Es werden keine Pushs versendet.',true);
 }catch(e){status('Themenauswahl lokal gespeichert, Cloud-Update fehlgeschlagen: '+issue(e))}
}
async function test(){
 if(!client())return status('Bitte zuerst anmelden.');
 const btn=el('fp91-push-test');
 if(btn)btn.disabled=true;
 try{
  const {data:{session},error}=await client().auth.getSession();
  if(error||!session?.access_token)throw Error('Bitte erneut anmelden');
  const r=await fetch(API,{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+session.access_token},body:JSON.stringify({action:'test'})});
  const d=await r.json();if(!r.ok||!d.ok)throw Error(d.error||'Testversand fehlgeschlagen');
  status(d.delivered>0?'Test-Push wurde an den Push-Dienst übergeben. Prüfe deine Mitteilungen.':'Test wurde eingereiht. Falls keine Mitteilung erscheint, Status später erneut prüfen.',true);
 }catch(e){status('Test fehlgeschlagen: '+issue(e),true)}
 finally{if(btn)btn.disabled=false}
}
function settingsHtml(){
 return '<section class="fp-push-panel" aria-label="Push-Benachrichtigungen">'+
 '<h2>Push-Benachrichtigungen</h2><p>Wichtige Neuigkeiten direkt aufs iPhone – auch wenn FinanzPilot geschlossen ist. Keine stündlichen Leerlaufmeldungen.</p>'+
 Object.entries(LABELS).map(([key,label])=>'<label class="fp-push-option"><span>'+label+'</span><input type="checkbox" id="fp91-push-'+key+'" '+(prefs[key]?'checked':'')+'></label>').join('')+
 '<p id="fp91-push-status" class="fp-push-status" role="status" aria-live="polite">Status wird geprüft …</p>'+
 '<div class="fp-push-actions"><button type="button" class="btn" id="fp91-push-enable">Benachrichtigungen aktivieren</button>'+
 '<button type="button" class="btn secondary" id="fp91-push-disable" hidden>Deaktivieren</button>'+
 '<button type="button" class="btn secondary" id="fp91-push-test" disabled>Testbenachrichtigung</button></div>'+
 '<small>Funktioniert auf iOS ab 16.4 mit zum Home-Bildschirm hinzugefügter App und angemeldetem FinanzPilot-Konto. Die Erlaubnis erscheint erst nach Tippen auf Aktivieren.</small></section>';
}
function bind(root=document){
 root.querySelector('#fp91-push-enable')?.addEventListener('click',enable);
 root.querySelector('#fp91-push-disable')?.addEventListener('click',disable);
 root.querySelector('#fp91-push-test')?.addEventListener('click',test);
 for(const name of Object.keys(LABELS))root.querySelector('#fp91-push-'+name)?.addEventListener('change',e=>{prefs[name]=e.currentTarget.checked;void saveCategories()});
 void refresh();
}
function init(){if(supported())void worker().catch(()=>{});window.addEventListener('fp-auth-change',()=>void refresh());}
window.FinanzPilotPush={settingsHtml,bind,enable,disable,refresh};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();