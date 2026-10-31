/* FinanzPilot: kostenlose Anmeldung und privater Lernstand (Supabase Auth + RLS).
   Nur öffentliche, für Browser bestimmte Project URL + Publishable Key eingebettet.
   Alle alten localStorage-Einträge bleiben erhalten; eine Cloud-Kopie wird zusammengeführt.
*/
'use strict';
(()=>{
  const PROJECT_URL = 'https://oqhwgksunlffvknaspmx.supabase.co';
  const PUBLISHABLE_KEY = 'sb_publishable_hXOPhMFpAD0RVAky9eonSQ_yiFoZps6';
  const CLOUD_TABLE = 'finanzpilot_progress';
  const APP_URL = 'https://marinusmeixner-dot.github.io/finanzpilot/';
  const KEYS = ['finanzpilot_v1','finanzpilot_lab_v3','finanzpilot_academy_v4','fp_research_answers_v1','finanzpilot_training_v1','finanzpilot_concepts_v1','finanzpilot_transfer_v1','finanzpilot_investment_committee_v1','finanzpilot_theses_v1','finanzpilot_expedition_v1'];
  const escapeHtml = x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let client=null, user=null, enabled=false, ready=false, busy=false, timer=null, retryTimer=null, canAnalyze=false, lastStatus='Lokal gespeichert', recoveryMode=false, dirty=false, accessToken=null, lastRemote={}, pendingAgain=false, lastSyncAt=0, retryCount=0;
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
  function mergeTraining(main,remote){
    const a=isObject(main)?main:{},b=isObject(remote)?remote:{};
    const out={...b,...a,sessions:{},reviews:{}};
    for(const id of new Set([...Object.keys(b.sessions||{}),...Object.keys(a.sessions||{})])){
      const localSession=a.sessions?.[id],cloudSession=b.sessions?.[id];
      const newer=!localSession?cloudSession:!cloudSession?localSession:(Number(localSession.updatedAt)||0)>=(Number(cloudSession.updatedAt)||0)?localSession:cloudSession;
      const bestScore=anyMax(localSession?.bestScore,cloudSession?.bestScore);
      out.sessions[id]={...newer,bestScore,completedAt:Math.max(Number(localSession?.completedAt)||0,Number(cloudSession?.completedAt)||0)};
    }
    for(const key of new Set([...Object.keys(b.reviews||{}),...Object.keys(a.reviews||{})])){
      const l=a.reviews?.[key],c=b.reviews?.[key];
      out.reviews[key]=!l?c:!c?l:(Number(l.updatedAt)||0)>=(Number(c.updatedAt)||0)?l:c;
    }
    out.active=Object.prototype.hasOwnProperty.call(a,'active')?a.active:(b.active??null);
    return out;
  }
  function mergeConcepts(main,remote){
    const a=isObject(main)?main:{},b=isObject(remote)?remote:{};
    const merged=mergeTraining(a,b);
    const sessions=merged.sessions||{};
    for(const id of new Set([...Object.keys(a.sessions||{}),...Object.keys(b.sessions||{})])){
      const x=a.sessions?.[id]||{},y=b.sessions?.[id]||{};
      const latest=(Number(x.updatedAt)||0)>=(Number(y.updatedAt)||0)?x:y;
      const ans={...y.answers,...x.answers};
      for(const idx of new Set([...Object.keys(y.answers||{}),...Object.keys(x.answers||{})])){
        const lx=x.answers?.[idx],ry=y.answers?.[idx];
        ans[idx]=lx?.correct?lx:ry?.correct?ry:(latest.answers?.[idx]??lx??ry);
      }
      sessions[id]={...latest,answers:ans,step:Math.max(Number(x.step)||0,Number(y.step)||0),
        bestScore:Math.max(Number(x.bestScore)||0,Number(y.bestScore)||0,Object.values(ans).filter(t=>t?.correct).length),
        completedAt:Math.max(Number(x.completedAt)||0,Number(y.completedAt)||0),
        drafts:{...y.drafts,...x.drafts},
        updatedAt:Math.max(Number(x.updatedAt)||0,Number(y.updatedAt)||0)};
    }
    return {...merged,sessions};
  }
  function mergeInvestmentCommittee(local,remote){
    const a=isObject(local)?local:{},b=isObject(remote)?remote:{};
    const sessions={};
    for(const id of new Set([...Object.keys(a.sessions||{}),...Object.keys(b.sessions||{})])){
      const x=a.sessions?.[id]||{},y=b.sessions?.[id]||{};
      const latest=(Number(x.updatedAt)||0)>=(Number(y.updatedAt)||0)?x:y;
      const earlier=latest===x?y:x;
      const answers={...(earlier.answers||{}),...(latest.answers||{})};
      for(const key of new Set([...Object.keys(x.answers||{}),...Object.keys(y.answers||{})])){
        const left=x.answers?.[key],right=y.answers?.[key];
        if(left?.correct||right?.correct)answers[key]=left?.correct?left:right;
      }
      sessions[id]={
        ...earlier,...latest,
        step:Math.max(Number(x.step)||0,Number(y.step)||0),
        completed:Boolean(x.completed||y.completed),
        answers,
        model:(Number(x.updatedAt)||0)>=(Number(y.updatedAt)||0)?(x.model||y.model||null):(y.model||x.model||null),
        memo:(Number(x.memo?.savedAt)||0)>=(Number(y.memo?.savedAt)||0)?(x.memo||y.memo||null):(y.memo||x.memo||null),
        updatedAt:Math.max(Number(x.updatedAt)||0,Number(y.updatedAt)||0)
      };
    }
    return{...b,...a,sessions,active:a.active||b.active||null};
  }
  function mergeTheses(local,remote){
    const a=isObject(local)?local:{},b=isObject(remote)?remote:{};
    const joined=new Map();
    for(const entry of [...(Array.isArray(b.entries)?b.entries:[]),...(Array.isArray(a.entries)?a.entries:[])]){
      if(!entry||typeof entry.id!=='string'||entry.id.length>100)continue;
      const prev=joined.get(entry.id);
      if(!prev||(Number(entry.updatedAt)||0)>=(Number(prev.updatedAt)||0))joined.set(entry.id,entry);
    }
    const entries=[...joined.values()].sort((x,y)=>(Number(x.createdAt)||0)-(Number(y.createdAt)||0));
    const draft=(Number(a.draftAt)||0)>=(Number(b.draftAt)||0)?a.draft??b.draft??null:b.draft??a.draft??null;
    return{entries,draft,draftAt:Math.max(Number(a.draftAt)||0,Number(b.draftAt)||0),selected:a.selected||b.selected||null};
  }
  function mergePayload(local,remote){
    const out={};
    for(const key of KEYS){const a=local?.[key]||{}, b=remote?.[key]||{};
      if(key==='fp_research_answers_v1')out[key]={...(isObject(b)?b:{}),...(isObject(a)?a:{})};
      else if(key==='finanzpilot_training_v1'||key==='finanzpilot_transfer_v1')out[key]=mergeTraining(a,b);
      else if(key==='finanzpilot_investment_committee_v1')out[key]=mergeInvestmentCommittee(a,b);
      else if(key==='finanzpilot_theses_v1')out[key]=mergeTheses(a,b);
      else if(key==='finanzpilot_concepts_v1')out[key]=mergeConcepts(a,b);
      else out[key]=merge(a,b);
    }
    return out;
  }
  function saveLocal(payload){
    const changed=[];
    for(const k of KEYS){const incoming=payload[k]||{};if(JSON.stringify(localObject(k))!==JSON.stringify(incoming)){
      try{localStorage.setItem(k,JSON.stringify(incoming));changed.push(k)}catch{}
    }}
    return changed;
  }
  function setStatus(message,state){
    lastStatus=String(message||'');
    const panel=document.getElementById('fp-account-state');
    if(panel)panel.textContent=lastStatus;
    const btn=document.getElementById('fp-quick-sync');
    const offline=typeof navigator!=='undefined'&&navigator.onLine===false;
    const status=state||(offline?'offline':!user?'guest':/fehlgeschlagen|fehler|nicht erreichbar/i.test(lastStatus)?'error':/wird abgeglichen|synchronisiere|wird geprüft/i.test(lastStatus)?'pending':/gespeichert und synchronisiert/i.test(lastStatus)?'success':'pending');
    if(btn){
      btn.dataset.syncState=status;
      btn.setAttribute('aria-busy',String(status==='pending'));
      btn.setAttribute('aria-label',(user?'Fortschritt synchronisieren. ':'Anmelden und Fortschritt sichern. ')+lastStatus);
      btn.title=lastStatus;
    }
    const assist=document.getElementById('fp-sync-accessible');
    if(assist)assist.textContent=lastStatus;
  }
  const statusMessage=e=>{
    const code=String(e?.code||'').toLowerCase(),msg=String(e?.message||'');
    if(code==='email_address_not_authorized'||/email address not authorized/i.test(msg))return 'Der kostenlose E-Mail-Versand erlaubt nur Projekt-Teamadressen. Bitte den Administrator um die Einrichtung eines SMTP-Dienstes.';
    if(code==='over_email_send_rate_limit'||/rate limit exceeded/i.test(msg))return 'Das E-Mail-Limit des Projekts ist erreicht (Standard: 2 E-Mails pro Stunde). Bitte nicht immer wieder registrieren; die Einrichtung eines eigenen Mailversands ist nötig.';
    if(code==='invalid_credentials'||/invalid login credentials/i.test(msg))return 'Das bestehende Konto akzeptiert dieses Passwort nicht. Nutze „Passwort zurücksetzen“ oder „Mit Google anmelden“, falls Google freigeschaltet ist.';
    if(code==='provider_disabled'||/provider is not enabled|unsupported provider|google provider.*disabled/i.test(msg))return 'Google ist in Supabase noch nicht freigeschaltet. Der Administrator muss Google OAuth im Projekt einrichten.';
    if(code==='email_not_confirmed'||/email not confirmed/i.test(msg))return 'Diese E-Mail ist noch nicht bestätigt. Der E-Mail-Versand des Projekts muss konfiguriert sein.';
    return msg||'Unbekannter Fehler';
  };
  function accountPanel(){
    if(document.getElementById('fp-account-dialog'))return;
    const button=document.createElement('button');button.id='fp-account-button';button.type='button';button.hidden=true;button.setAttribute('aria-hidden','true');
    document.body.append(button);
    const quick=document.createElement('button');quick.id='fp-quick-sync';quick.className='fp-topbar-sync';quick.type='button';quick.title='Synchronisieren';quick.setAttribute('aria-label','Jetzt synchronisieren oder anmelden');
    quick.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5"/><path d="M6 9a7 7 0 0 1 12-2l2 5M18 15a7 7 0 0 1-12 2l-2-5"/></svg>';
    document.querySelector('.header-right')?.append(quick);
    quick.addEventListener('click',()=>{if(user)sync(true);else button.click()});
    const sr=document.createElement('span');sr.id='fp-sync-accessible';sr.className='fp-sync-a11y';sr.setAttribute('role','status');sr.setAttribute('aria-live','polite');document.querySelector('.header-right')?.append(sr);
    const modal=document.createElement('div');modal.id='fp-account-dialog';modal.className='fp-account-overlay';modal.hidden=true;
    modal.innerHTML=`<section class="fp-account-window" role="dialog" aria-modal="true" aria-label="FinanzPilot Konto"><div class="fp-account-title"><h2>Dein FinanzPilot-Konto</h2><button id="fp-account-close" class="settings-btn" type="button" aria-label="Schließen">✕</button></div><p id="fp-account-state" aria-live="polite">Lokal gespeichert</p><div id="fp-account-guest"><p>Dein Lernstand bleibt ohne Konto lokal erhalten. Mit einem bestätigten Konto können Ergebnisse synchronisiert werden. Die Anmeldung ist freiwillig.</p><form id="fp-account-form"><label>E-Mail-Adresse<input id="fp-account-email" type="email" name="email" autocomplete="username" required maxlength="254" /></label><label>Passwort<input id="fp-account-password" type="password" name="password" autocomplete="current-password" required minlength="6" /></label><button class="fp-account-forgot" id="fp-account-forgot" type="button">Passwort vergessen? Zurücksetzen</button><div class="fp-account-actions"><button class="btn" type="submit">Anmelden</button><button class="btn secondary" id="fp-account-signup" type="button">Neues Konto erstellen</button></div></form><div class="fp-account-divider"><span>oder</span></div><button class="fp-account-google" type="button" id="fp-account-google"><svg viewBox="0 0 24 24" width="23" height="23" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.23c0-.73-.07-1.45-.2-2.13H12v4.03h5.37a4.6 4.6 0 0 1-1.99 3.02v2.53h3.22c1.89-1.74 3-4.3 3-7.45Z"/><path fill="#34A853" d="M12 22c2.71 0 4.99-.9 6.6-2.32l-3.22-2.53c-.9.6-2.03.96-3.38.96a6.02 6.02 0 0 1-5.66-4.16H3.03v2.61A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.34 13.95A6 6 0 0 1 6 12c0-.68.12-1.34.34-1.95V7.44H3.03A10 10 0 0 0 2 12c0 1.64.4 3.19 1.03 4.56l3.31-2.61Z"/><path fill="#EA4335" d="M12 5.89c1.48 0 2.81.51 3.85 1.52l2.88-2.88A9.56 9.56 0 0 0 12 2a10 10 0 0 0-8.97 5.44l3.31 2.61A6.02 6.02 0 0 1 12 5.89Z"/></svg><span>Mit Google anmelden</span></button><p class="fp-account-google-note">Wähle nach Möglichkeit dieselbe Google-E-Mail wie beim bestehenden Konto, damit sich deine Lernstände nicht auf zwei Konten verteilen. Die Google-Anmeldung muss zunächst im Projekt aktiviert sein.</p><div class="fp-mail-help"><strong>Keine Bestätigungs-E-Mail erhalten?</strong><p>Der eingebaute Supabase-Mailversand ist auf Teamadressen und sehr wenige Nachrichten begrenzt. Du kannst solange ohne Login weiterlernen und unten ein Backup speichern. Bei einer bereits registrierten Adresse bitte anmelden, statt erneut ein Konto anzulegen.</p><a href="https://supabase.com/dashboard/project/oqhwgksunlffvknaspmx/auth/providers" target="_blank" rel="noopener">Mail-Einstellungen öffnen ↗</a></div></div><div id="fp-account-recovery" hidden><h3>Neues Passwort festlegen</h3><p>Du hast einen Wiederherstellungslink geöffnet. Wähle jetzt ein neues Passwort für dein bestehendes Konto.</p><form id="fp-account-recovery-form"><label>Neues Passwort<input type="password" id="fp-account-new-password" autocomplete="new-password" required minlength="8" maxlength="128" /></label><label>Passwort wiederholen<input type="password" id="fp-account-confirm-password" autocomplete="new-password" required minlength="8" maxlength="128" /></label><button type="submit" class="btn">Neues Passwort speichern</button></form></div><div id="fp-account-signed" hidden><p>Angemeldet als <strong id="fp-account-user"></strong>. Dein Lernstand wird automatisch und verschlüsselt übertragen.</p><label class="fp-account-consent"><input id="fp-account-analysis" type="checkbox" /> Erlaube persönliche Lernstand-Analysen durch meinen verbundenen ChatGPT-Finanzcoach.</label><p>Ohne Freigabe werden deine Lernstatistiken nicht für ChatGPT-Auswertungen verwendet. Sie werden nicht auf GitHub veröffentlicht.</p><div class="fp-account-actions"><button id="fp-account-save" class="btn" type="button">Jetzt synchronisieren</button><button id="fp-account-logout" class="settings-btn" type="button">Abmelden</button></div></div><div class="fp-account-footer"><button class="settings-btn" id="fp-account-backup" type="button">Alle Lernstände als Backup speichern</button><small>Bei Kontowechsel oder Safari-Datenlöschung ist ein zusätzliches Backup sinnvoll.</small></div></section>`;
    document.body.append(modal);
    button.addEventListener('click',()=>{modal.hidden=false;document.getElementById('fp-account-email')?.focus()});
    document.getElementById('fp-account-close').addEventListener('click',()=>modal.hidden=true);
    modal.addEventListener('click',e=>{if(e.target===modal)modal.hidden=true});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)modal.hidden=true});
    document.getElementById('fp-account-form').addEventListener('submit',async e=>{e.preventDefault();await signIn()});
    document.getElementById('fp-account-signup').addEventListener('click',signUp);
    document.getElementById('fp-account-forgot').addEventListener('click',requestPasswordReset);
    document.getElementById('fp-account-google').addEventListener('click',signInGoogle);
    document.getElementById('fp-account-recovery-form').addEventListener('submit',finishPasswordReset);
    document.getElementById('fp-account-save').addEventListener('click',()=>sync(true));
    document.getElementById('fp-account-logout').addEventListener('click',async()=>{if(!client)return;await client.auth.signOut();user=null;ready=false;setStatus('Abgemeldet – Lernstand weiterhin lokal erhalten');showAccount();window.dispatchEvent(new Event('fp-auth-change'))});
    document.getElementById('fp-account-analysis').addEventListener('change',toggleAnalysis);
    document.getElementById('fp-account-backup').addEventListener('click',()=>{
      const blob=new Blob([JSON.stringify({version:1,exported_at:new Date().toISOString(),progress:snapshot()},null,2)],{type:'application/json'});
      const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='finanzpilot-alle-fortschritte.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),3000);
    });
  }
  function showAccount(){
    const guest=document.getElementById('fp-account-guest'),signed=document.getElementById('fp-account-signed');
    const recovery=document.getElementById('fp-account-recovery');
    if(guest)guest.hidden=Boolean(user)||recoveryMode;
    if(signed)signed.hidden=!user||recoveryMode;
    if(recovery)recovery.hidden=!recoveryMode;
    if(recoveryMode){setStatus('Bestätige dein neues Passwort.');return}
    if(user){document.getElementById('fp-account-user').textContent=user.email||'angemeldet';document.getElementById('fp-account-analysis').checked=canAnalyze}
    setStatus(user?(ready?'Lernstand in der Cloud gespeichert':'Anmeldung erkannt – synchronisiere …'):'Ohne Konto: nur auf diesem Gerät gespeichert');
  }
  const credentials=()=>({email:document.getElementById('fp-account-email').value.trim(),password:document.getElementById('fp-account-password').value});

  async function requestPasswordReset(){
    const address=document.getElementById('fp-account-email')?.value.trim()||'';
    if(!address||!/^\S+@\S+\.\S+$/.test(address)){setStatus('Trage oben zuerst deine E-Mail-Adresse ein.');document.getElementById('fp-account-email')?.focus();return}
    if(!client){setStatus('Passwortwiederherstellung nicht erreichbar. Lernfortschritt bleibt lokal erhalten.');return}
    setStatus('Die Anfrage zur Passwortwiederherstellung wird geprüft …');
    try{
      const {error}=await client.auth.resetPasswordForEmail(address,{redirectTo:APP_URL});
      if(error)throw error;
      setStatus('Anfrage angenommen. Falls eine Wiederherstellungsmail zugestellt wird, öffne den Link auf diesem Gerät. Die Zustellung ist noch nicht bestätigt; im Projekt kann eine eigene SMTP-Konfiguration erforderlich sein.');
    }catch(e){setStatus('Passwortwiederherstellung: '+statusMessage(e))}
  }
  async function finishPasswordReset(event){
    event.preventDefault();
    if(!client||!recoveryMode){setStatus('Kein gültiger Wiederherstellungsvorgang erkannt.');return}
    const a=document.getElementById('fp-account-new-password')?.value||'',b=document.getElementById('fp-account-confirm-password')?.value||'';
    if(a.length<8||a!==b){setStatus('Beide Passwörter müssen identisch sein und mindestens 8 Zeichen haben.');return}
    try{
      const {error}=await client.auth.updateUser({password:a});
      if(error)throw error;
      document.getElementById('fp-account-new-password').value='';
      document.getElementById('fp-account-confirm-password').value='';
      recoveryMode=false;showAccount();setStatus('Passwort geändert. Dein bisheriger Lernstand bleibt erhalten.');
      if(user)await sync(true);
    }catch(e){setStatus('Passwortänderung: '+statusMessage(e))}
  }
  async function signInGoogle(){
    if(!client){setStatus('Google-Anmeldung nicht erreichbar.');return}
    setStatus('Google-Anmeldung wird vorbereitet …');
    try{
      const {error}=await client.auth.signInWithOAuth({provider:'google',options:{redirectTo:APP_URL}});
      if(error)throw error;
    }catch(e){setStatus('Google-Anmeldung: '+statusMessage(e))}
  }
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
    if(user?.id===session.user.id&&ready)return;user=session.user;ready=false;showAccount();window.dispatchEvent(new Event('fp-auth-change'));await sync(true)
  }
  async function sync(force=false){
    if(!client||!user)return;
    if(busy){if(dirty)pendingAgain=true;return}
    if(!force&&!ready)return;
    if(typeof navigator!=='undefined'&&navigator.onLine===false){setStatus('Offline – dein Lernfortschritt bleibt auf dem Gerät gespeichert.','offline');return}
    busy=true;setStatus('Lernstand wird abgeglichen …','pending');
    let localBefore='';
    try{
      // Nie den Zustand eines anderen Logins in diesen Nutzeraccount hochladen.
      try{const owner=localStorage.getItem('finanzpilot_account_owner');if(owner&&owner!==user.id){
        localStorage.setItem('finanzpilot_user_backup_'+owner,JSON.stringify(snapshot()));
        KEYS.forEach(k=>localStorage.removeItem(k));
      }}catch{}
      const local=snapshot();
      localBefore=JSON.stringify(local);
      const {data,error}=await client.from(CLOUD_TABLE).select('progress_data,allow_coach_analysis').eq('user_id',user.id).maybeSingle();
      if(error)throw error;
      lastRemote=data?.progress_data||{};
      const merged=mergePayload(local,lastRemote);
      const changed=saveLocal(merged);
      canAnalyze=Boolean(data?.allow_coach_analysis);
      const {error:writeError}=await client.from(CLOUD_TABLE).upsert({user_id:user.id,progress_data:merged,updated_at:new Date().toISOString()},{onConflict:'user_id'});
      if(writeError)throw writeError;
      ready=true;lastRemote=merged;lastSyncAt=Date.now();retryCount=0;
      clearTimeout(retryTimer);retryTimer=null;
      // Wenn während des Uploads neue Übungen abgeschlossen werden, direkt einen weiteren Abgleich vormerken.
      const afterUpload=JSON.stringify(snapshot());
      dirty=afterUpload!==JSON.stringify(merged);
      if(dirty)pendingAgain=true;
      try{localStorage.setItem('finanzpilot_account_owner',user.id)}catch{}
      showAccount();
      setStatus(dirty?'Neue Änderungen werden gleich synchronisiert …':'Lernstand gespeichert und synchronisiert · '+new Date().toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'}),dirty?'pending':'success');
      if(changed.length){
        // Import in bereits geladene Lernmodule übernehmen, ohne die laufende PWA-Seite neu zu laden.
        window.dispatchEvent(new CustomEvent('fp-cloud-progress-imported',{detail:{keys:changed}}));
        setStatus('Cloud-Fortschritt ohne Seitenwechsel übernommen','success');
      }
    }catch(err){
      ready=false;
      setStatus('Cloud-Sync fehlgeschlagen: '+statusMessage(err)+'. Lokal bleibt alles erhalten.','error');
      if(user&&retryCount<5){const delay=Math.min(60000,12000*Math.pow(1.7,retryCount++));
        clearTimeout(retryTimer);retryTimer=setTimeout(()=>sync(true),delay)}
    }finally{
      busy=false;
      if(pendingAgain){pendingAgain=false;clearTimeout(timer);timer=setTimeout(()=>sync(true),500)}
    }
  }
  function schedule(){
    dirty=true;
    if(!user)return;
    if(busy){pendingAgain=true;return}
    if(!ready)return;
    setStatus('Änderungen lokal gespeichert – synchronisiere …','pending');
    clearTimeout(timer);timer=setTimeout(()=>sync(false),1100)
  }
  // Beim Schließen darf eine Web-App nur Best-Effort-Arbeit erwarten.
  // Fetch keepalive überträgt noch nicht hochgeladene Fortschritte mit gültigem JWT.
  function flushWhenClosing(){
    if(!dirty||!user||!accessToken||busy||!ready||typeof navigator!=='undefined'&&navigator.onLine===false)return;
    try{
      const payload=JSON.stringify({user_id:user.id,progress_data:mergePayload(snapshot(),lastRemote),updated_at:new Date().toISOString()});
      if(payload.length>55000){sync(true);return}
      fetch(PROJECT_URL+'/rest/v1/'+CLOUD_TABLE+'?on_conflict=user_id',{
        method:'POST',keepalive:true,
        headers:{'Content-Type':'application/json','apikey':PUBLISHABLE_KEY,'Authorization':'Bearer '+accessToken,'Prefer':'resolution=merge-duplicates'},
        body:payload
      }).catch(()=>{});
    }catch{}
  }
  function init(){accountPanel();if(!window.supabase?.createClient){setStatus('Login-Bibliothek nicht erreichbar. Lokales Lernen funktioniert weiterhin.');return}
    try{client=window.supabase.createClient(PROJECT_URL,PUBLISHABLE_KEY,{auth:{autoRefreshToken:true,persistSession:true,detectSessionInUrl:true}})}catch(e){setStatus('Login nicht verfügbar: '+statusMessage(e));return}
    client.auth.onAuthStateChange((event,session)=>{
      accessToken=session?.access_token||null;
      if(event==='PASSWORD_RECOVERY'){
        user=session?.user||user;recoveryMode=true;
        const modal=document.getElementById('fp-account-dialog');if(modal)modal.hidden=false;
        showAccount();document.getElementById('fp-account-new-password')?.focus();
      }else if(event==='SIGNED_OUT'){user=null;ready=false;dirty=false;lastRemote={};accessToken=null;clearTimeout(timer);clearTimeout(retryTimer);recoveryMode=false;showAccount();window.dispatchEvent(new Event('fp-auth-change'))}
      else if(event==='SIGNED_IN'||event==='INITIAL_SESSION'){
        if(!recoveryMode)setTimeout(()=>signedIn(session),0);
      }
    });
    window.addEventListener('fp-progress-change',schedule);
    window.addEventListener('storage',event=>{if(KEYS.includes(event.key))schedule()});
    window.addEventListener('pagehide',()=>{clearTimeout(timer);flushWhenClosing()});
    window.addEventListener('fp-navigation',()=>{if(user&&dirty&&!busy)sync(true)});
    window.addEventListener('offline',()=>setStatus('Offline – dein Lernfortschritt bleibt lokal gespeichert.','offline'));
    document.addEventListener('visibilitychange',()=>{
      if(document.hidden){clearTimeout(timer);flushWhenClosing()}
      else if(user&&!busy&&(dirty||Date.now()-lastSyncAt>45000))sync(true);
    });
    window.addEventListener('pageshow',()=>{if(user&&!busy&&(dirty||Date.now()-lastSyncAt>45000))sync(true)});
    window.addEventListener('focus',()=>{if(user&&!busy&&(dirty||Date.now()-lastSyncAt>45000))sync(true)});
    window.addEventListener('online',()=>{if(user&&!busy)sync(true);else if(!user)setStatus('Online – Anmeldung für Cloud-Sync möglich.','guest')});
    setInterval(()=>{if(user&&!busy&&!document.hidden)sync(true)},120000);
    client.auth.getSession().then(({data,error})=>{if(error){setStatus('Anmeldung nicht verfügbar: '+statusMessage(error));return}signedIn(data?.session)}).catch(()=>{});
  }
  window.FinanzPilotCloud={
    get user(){return user?.id||null},get ready(){return ready},
    get reviewClient(){return user?client:null},
    get paperClient(){return user?client:null},
    sync:()=>sync(true),backup:snapshot,
    async economyRpc(name,args){
      if(!client||!user)throw Error('Bitte zuerst bei FinanzPilot anmelden.');
      if(!['fp_submit_training_answer','fp_redeem_artifact','fp_purchase_reward'].includes(name))throw Error('Unbekannte Funktion');
      const {data,error}=await client.rpc(name,args);
      if(error)throw error;
      return data;
    },
    async economyRead(table){
      if(!client||!user)throw Error('Bitte zuerst anmelden.');
      if(!['fp_economy_accounts','fp_verified_training','fp_reward_claims','fp_reward_perks','fp_reward_ledger'].includes(table))throw Error('Unbekannte Tabelle');
      const {data,error}=await client.from(table).select('*').eq('user_id',user.id);
      if(error)throw error;
      return data||[];
    },
    openLogin:()=>document.getElementById('fp-account-button')?.click(),get status(){return lastStatus}
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();