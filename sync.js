/* FinanzPilot: kostenlose Anmeldung und privater Lernstand (Supabase Auth + RLS).
   Nur öffentliche, für Browser bestimmte Project URL + Publishable Key eingebettet.
   Alle alten localStorage-Einträge bleiben erhalten; eine Cloud-Kopie wird zusammengeführt.
*/
'use strict';
(()=>{
  const PROJECT_URL = 'https://oqhwgksunlffvknaspmx.supabase.co';
  const PUBLISHABLE_KEY = 'sb_publishable_hXOPhMFpAD0RVAky9eonSQ_yiFoZps6';
  const CLOUD_TABLE = 'finanzpilot_progress';
  const KEYS = ['finanzpilot_v1','finanzpilot_lab_v3','finanzpilot_academy_v4','fp_research_answers_v1'];
  const escapeHtml = x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let client=null, user=null, enabled=false, ready=false, busy=false, timer=null, canAnalyze=false, lastStatus='Lokal gespeichert';
  const localObject=k=>{try{const x=JSON.parse(localStorage.getItem(k)||'{}');return x&&typeof x==='object'&&!Array.isArray(x)?x:{}}catch{return {}}};
  const snapshot=()=>Object.fromEntries(KEYS.map(k=>[k,localObject(k)]));
  const isObject=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
  const nonEmpty=o=>isObject(o)&&Object.keys(o).length>0;
  const union=(arr1,arr2,limit=400)=>[...new Set([...(Array.isArray(arr1)?arr1:[]),...(Array.isArray(arr2)?arr2:[])])].slice(-limit);
  const unionRecords=(x,y,limit=200)=>{const r=[...(Array.isArray(x)?x:[]),...(Array.isArray(y)?y:[])],seen=new Set();return r.filter(o=>{const k=JSON.stringify(o);if(seen.has(k))return false;seen.add(k);return true}).slice(-limit)};
  const anyMax=(a,b)=>Math.max(0,Number(a)||0,Number(b)||0);
  function merge(main,remote){
    const a=isObject(main)?main:{},b=isObject(remote)?remote:{};
    const out={...b,...a};
    for(const k of Object.keys(b))if(!(k in out))out[k]=b[k];
    out.completed={...(b.completed||{}),...(a.completed||{})};
    for(const k of new Set([...Object.keys(b.completed||{}),...Object.keys(a.completed||{})])){
      const av=a.completed?.[k],bv=b.completed?.[k];
      if(typeof av==='number'||typeof bv==='number')out.completed[k]=anyMax(av,bv);
      else if(isObject(av)||isObject(bv))out.completed[k]=!av?bv:!bv?av:(Number(av.score)>Number(bv.score)?av:bv);
      else out.completed[k]=Boolean(av||bv);
    }
    out.mistakes={...(b.mistakes||{}),...(a.mistakes||{})};
    for(const k of new Set([...Object.keys(a.mistakes||{}),...Object.keys(b.mistakes||{})]))out.mistakes[k]=anyMax(a.mistakes?.[k],b.mistakes?.[k]);
    out.attempts={...(b.attempts||{}),...(a.attempts||{})};
    for(const k of new Set([...Object.keys(a.attempts||{}),...Object.keys(b.attempts||{})]))out.attempts[k]=anyMax(a.attempts?.[k],b.attempts?.[k]);
    out.history=unionRecords(b.history,a.history,400);
    out.seenDates=union(b.seenDates,a.seenDates,400);
    out.savedOpinions=unionRecords(b.savedOpinions,a.savedOpinions,100);
    out.readNews={...(b.readNews||{}),...(a.readNews||{})};
    out.answers={...(b.answers||{}),...(a.answers||{})};
    out.seen={...(b.seen||{}),...(a.seen||{})};
    out.xp=anyMax(a.xp,b.xp);
    return out;
  }
  function mergePayload(local,remote){
    const out={};
    for(const key of KEYS){const a=local?.[key]||{}, b=remote?.[key]||{};
      if(key==='fp_research_answers_v1')out[key]={...(isObject(b)?b:{}),...(isObject(a)?a:{})};
      else out[key]=merge(a,b);
    }
    return out;
  }
  function saveLocal(payload){
    let changed=false;
    for(const k of KEYS){const incoming=payload[k]||{};if(JSON.stringify(localObject(k))!==JSON.stringify(incoming)){
      try{localStorage.setItem(k,JSON.stringify(incoming));changed=true}catch{}
    }}
    return changed;
  }
  function setStatus(message){lastStatus=message;const x=document.getElementById('fp-account-state');if(x)x.textContent=message;const b=document.getElementById('fp-account-button');if(b){b.textContent=user?'Konto · synchronisiert':'Konto / Login';b.title=user?.email||message}}
  const statusMessage=e=>{
    const code=String(e?.code||'').toLowerCase(),msg=String(e?.message||'');
    if(code==='email_address_not_authorized'||/email address not authorized/i.test(msg))return 'Der kostenlose E-Mail-Versand erlaubt nur Projekt-Teamadressen. Bitte den Administrator um die Einrichtung eines SMTP-Dienstes.';
    if(code==='over_email_send_rate_limit'||/rate limit exceeded/i.test(msg))return 'Das E-Mail-Limit des Projekts ist erreicht (Standard: 2 E-Mails pro Stunde). Bitte nicht immer wieder registrieren; die Einrichtung eines eigenen Mailversands ist nötig.';
    if(code==='invalid_credentials'||/invalid login credentials/i.test(msg))return 'E-Mail/Passwort stimmen nicht überein oder das Konto wurde noch nicht bestätigt. Prüfe bestehende Anmeldung statt erneut zu registrieren.';
    return msg||'Unbekannter Fehler';
  };
  function accountPanel(){
    if(document.getElementById('fp-account-dialog'))return;
    const button=document.createElement('button');button.id='fp-account-button';button.className='settings-btn fp-account-trigger';button.type='button';button.textContent='Konto / Login';
    document.querySelector('.header-right')?.append(button);
    const modal=document.createElement('div');modal.id='fp-account-dialog';modal.className='fp-account-overlay';modal.hidden=true;
    modal.innerHTML=`<section class="fp-account-window" role="dialog" aria-modal="true" aria-label="FinanzPilot Konto"><div class="fp-account-title"><h2>Dein FinanzPilot-Konto</h2><button id="fp-account-close" class="settings-btn" type="button" aria-label="Schließen">✕</button></div><p id="fp-account-state" aria-live="polite">Lokal gespeichert</p><div id="fp-account-guest"><p>Dein Lernstand bleibt ohne Konto lokal erhalten. Mit einem bestätigten Konto können Ergebnisse synchronisiert werden. Die Anmeldung ist freiwillig.</p><form id="fp-account-form"><label>E-Mail-Adresse<input id="fp-account-email" type="email" name="email" autocomplete="username" required maxlength="254" /></label><label>Passwort<input id="fp-account-password" type="password" name="password" autocomplete="current-password" required minlength="6" /></label><div class="fp-account-actions"><button class="btn" type="submit">Anmelden</button><button class="btn secondary" id="fp-account-signup" type="button">Neues Konto erstellen</button></div></form><div class="fp-mail-help"><strong>Keine Bestätigungs-E-Mail erhalten?</strong><p>Der eingebaute Supabase-Mailversand ist auf Teamadressen und sehr wenige Nachrichten begrenzt. Du kannst solange ohne Login weiterlernen und unten ein Backup speichern. Bei einer bereits registrierten Adresse bitte anmelden, statt erneut ein Konto anzulegen.</p><a href="https://supabase.com/dashboard/project/oqhwgksunlffvknaspmx/auth/providers" target="_blank" rel="noopener">Mail-Einstellungen öffnen ↗</a></div></div><div id="fp-account-signed" hidden><p>Angemeldet als <strong id="fp-account-user"></strong>. Dein Lernstand wird automatisch und verschlüsselt übertragen.</p><label class="fp-account-consent"><input id="fp-account-analysis" type="checkbox" /> Erlaube persönliche Lernstand-Analysen durch meinen verbundenen ChatGPT-Finanzcoach.</label><p>Ohne Freigabe werden deine Lernstatistiken nicht für ChatGPT-Auswertungen verwendet. Sie werden nicht auf GitHub veröffentlicht.</p><div class="fp-account-actions"><button id="fp-account-save" class="btn" type="button">Jetzt synchronisieren</button><button id="fp-account-logout" class="settings-btn" type="button">Abmelden</button></div></div><div class="fp-account-footer"><button class="settings-btn" id="fp-account-backup" type="button">Alle Lernstände als Backup speichern</button><small>Bei Kontowechsel oder Safari-Datenlöschung ist ein zusätzliches Backup sinnvoll.</small></div></section>`;
    document.body.append(modal);
    button.addEventListener('click',()=>{modal.hidden=false;document.getElementById('fp-account-email')?.focus()});
    document.getElementById('fp-account-close').addEventListener('click',()=>modal.hidden=true);
    modal.addEventListener('click',e=>{if(e.target===modal)modal.hidden=true});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)modal.hidden=true});
    document.getElementById('fp-account-form').addEventListener('submit',async e=>{e.preventDefault();await signIn()});
    document.getElementById('fp-account-signup').addEventListener('click',signUp);
    document.getElementById('fp-account-save').addEventListener('click',()=>sync(true));
    document.getElementById('fp-account-logout').addEventListener('click',async()=>{if(!client)return;await client.auth.signOut();user=null;ready=false;setStatus('Abgemeldet – Lernstand weiterhin lokal erhalten');showAccount()});
    document.getElementById('fp-account-analysis').addEventListener('change',toggleAnalysis);
    document.getElementById('fp-account-backup').addEventListener('click',()=>{
      const blob=new Blob([JSON.stringify({version:1,exported_at:new Date().toISOString(),progress:snapshot()},null,2)],{type:'application/json'});
      const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='finanzpilot-alle-fortschritte.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),3000);
    });
  }
  function showAccount(){
    const guest=document.getElementById('fp-account-guest'),signed=document.getElementById('fp-account-signed');
    if(guest)guest.hidden=Boolean(user);if(signed)signed.hidden=!user;
    if(user){document.getElementById('fp-account-user').textContent=user.email||'angemeldet';document.getElementById('fp-account-analysis').checked=canAnalyze}
    setStatus(user?(ready?'Lernstand in der Cloud gespeichert':'Anmeldung erkannt – synchronisiere …'):'Ohne Konto: nur auf diesem Gerät gespeichert');
  }
  const credentials=()=>({email:document.getElementById('fp-account-email').value.trim(),password:document.getElementById('fp-account-password').value});
  async function signIn(){if(!client){setStatus('Anmeldung zurzeit nicht erreichbar. Deine Daten bleiben lokal.');return}setStatus('Anmeldung wird geprüft …');try{const {error}=await client.auth.signInWithPassword(credentials());if(error)throw error;setStatus('Angemeldet. Fortschritte werden abgeglichen …')}catch(e){setStatus('Anmeldung: '+statusMessage(e))}}
  async function signUp(){if(!client){setStatus('Anmeldung zurzeit nicht erreichbar.');return}
    const {email,password}=credentials();if(!email||password.length<6){setStatus('Bitte E-Mail und Passwort mit mindestens sechs Zeichen eintragen.');return}
    setStatus('Registrierung wird geprüft …');try{const {data,error}=await client.auth.signUp({email,password,options:{emailRedirectTo:'https://marinusmeixner-dot.github.io/finanzpilot/'}});if(error)throw error;
      if(data?.session){setStatus('Konto angelegt. Synchronisierung startet …')}
      else if(data?.user && Array.isArray(data.user.identities)&&data.user.identities.length===0){setStatus('Diese Adresse ist möglicherweise bereits registriert. Es wurde keine neue Bestätigungs-E-Mail zugesichert. Bitte mit deinem bisherigen Passwort anmelden oder später den Mailversand prüfen.');}
      else setStatus('Registrierung angenommen, Versand der E-Mail ist NICHT bestätigt. Der kostenlose Supabase-Mailversand funktioniert nur eingeschränkt; schau auch im Spamordner nach. Bis zur Bestätigung bleibt dein Fortschritt lokal.');
    }catch(e){setStatus('Registrierung: '+statusMessage(e))}
  }
  async function toggleAnalysis(e){if(!client||!user)return;const next=e.target.checked;
    const {error}=await client.from(CLOUD_TABLE).update({allow_coach_analysis:next}).eq('user_id',user.id);
    if(error){e.target.checked=!next;setStatus('Freigabe konnte nicht gespeichert werden: '+statusMessage(error))}else{canAnalyze=next;setStatus(next?'Analysefreigabe aktiviert':'Analysefreigabe ausgeschaltet')}
  }
  async function signedIn(session){if(!session?.user){user=null;ready=false;canAnalyze=false;showAccount();return}
    if(user?.id===session.user.id&&ready)return;user=session.user;ready=false;showAccount();await sync(true)
  }
  async function sync(force=false){if(!client||!user||busy)return;if(!force&&!ready)return;
    busy=true;setStatus('Lernstand wird abgeglichen …');
    try{
      // Niemals den Lernstand eines anderen Accounts in einen neuen Account hochladen.
      try{const owner=localStorage.getItem('finanzpilot_account_owner');if(owner&&owner!==user.id){
        localStorage.setItem('finanzpilot_user_backup_'+owner,JSON.stringify(snapshot()));
        KEYS.forEach(k=>localStorage.removeItem(k));
      }}catch{}
      const local=snapshot();const {data,error}=await client.from(CLOUD_TABLE).select('progress_data,allow_coach_analysis').eq('user_id',user.id).maybeSingle();if(error)throw error;
      const merged=mergePayload(local,data?.progress_data||{});
      const changed=saveLocal(merged);
      canAnalyze=Boolean(data?.allow_coach_analysis);
      const {error:writeError}=await client.from(CLOUD_TABLE).upsert({user_id:user.id,progress_data:merged,updated_at:new Date().toISOString()},{onConflict:'user_id'});
      if(writeError)throw writeError;
      ready=true;showAccount();setStatus('Lernstand gespeichert und synchronisiert · '+new Date().toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'}));try{localStorage.setItem('finanzpilot_account_owner',user.id)}catch{}
      if(changed){
        // Alte Appmodule lesen ihre Zustände einmal beim Start ein. Nach der Zusammenführung aktualisieren wir die Ansicht sicher.
        setStatus('Fortschritte übernommen – Ansicht wird aktualisiert …');
        location.reload();
      }
    }catch(e){setStatus('Cloud-Sync fehlgeschlagen: '+statusMessage(e)+'. Lokale Daten bleiben unverändert.');ready=false}
    finally{busy=false}
  }
  function schedule(){if(!user||!ready||busy)return;clearTimeout(timer);timer=setTimeout(()=>sync(false),1200)}
  function init(){accountPanel();if(!window.supabase?.createClient){setStatus('Login-Bibliothek nicht erreichbar. Lokales Lernen funktioniert weiterhin.');return}
    try{client=window.supabase.createClient(PROJECT_URL,PUBLISHABLE_KEY,{auth:{autoRefreshToken:true,persistSession:true,detectSessionInUrl:true}})}catch(e){setStatus('Login nicht verfügbar: '+statusMessage(e));return}
    client.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_OUT'){user=null;ready=false;showAccount()}else if(event==='SIGNED_IN'||event==='INITIAL_SESSION'){setTimeout(()=>signedIn(session),0)}});
    window.addEventListener('fp-progress-change',schedule);
    window.addEventListener('storage',event=>{if(KEYS.includes(event.key))schedule()});
    window.addEventListener('pagehide',()=>{if(user&&ready)clearTimeout(timer)});
    client.auth.getSession().then(({data,error})=>{if(error){setStatus('Anmeldung nicht verfügbar: '+statusMessage(error));return}signedIn(data?.session)}).catch(()=>{});
  }
  window.FinanzPilotCloud={get user(){return user?.id||null},get ready(){return ready},sync:()=>sync(true),backup:snapshot};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();