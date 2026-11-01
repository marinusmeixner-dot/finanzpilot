/* FinanzPilot v42: compact real profile, not a second course hub. */
(function(){
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=n=>new Intl.NumberFormat('de-DE',{maximumFractionDigits:0}).format(Number(n)||0);
const current=()=>{
 const hub=window.FinanzPilotLearningHub?.status||{},journey=window.FinanzPilotJourney;
 const total=journey?.modules?.length||18;
 const done=journey?.modules?.filter(m=>!!journey.completed?.[m.id]).length||0;
 const skillTotal=window.FinanzPilotLearningHub?.catalog?.skills?.length||12;
 const mastered=(window.FinanzPilotLearningHub?.catalog?.skills||[]).filter(s=>s.lessons.every(l=>hub.lessons?.some(x=>x.lesson_id===l.id&&x.completed_at))).length;
 const promotions=Number(hub.profiles?.[0]?.promotion_count)||0;
 const sxp=Number(hub.profiles?.[0]?.xp)||0;
 const oldXp=typeof state==='object'&&state?Number(state.xp)||0:0;
 const oldLevel=typeof level==='function'?level():1;
 const st=window.FinanzPilotStreak?.status;
 const econ=window.FinanzPilotEconomy;
 const artefacts=(econ?.claims||[]).filter(x=>!x.choice).length;
 const hasUser=!!window.FinanzPilotCloud?.user;
 let oldRank='';
 try{oldRank=window.FinanzPilotCareer?.status()?.rank?.name||''}catch{}
 return {total,done,skillTotal,mastered,promotions,sxp,oldXp,oldLevel,streak:Number(st?.day)||0,st,artefacts,points:Number(econ?.account?.research_points??hub.points)||0,oldRank,hasUser};
};
const btn=(id,name,description,numOrIcon)=>'<button type="button" class="fp42-profile-link" '+(id==='account'?'data-section-account':'data-section-route="'+id+'"')+'><span class="fp42-profile-link-icon">'+numOrIcon+'</span><span><b>'+esc(name)+'</b><small>'+esc(description)+'</small></span><span class="fp42-profile-link-arrow">›</span></button>';
function render(){
 const v=current(),remaining=Math.max(0,5-v.mastered%5),complete=v.mastered>0&&v.mastered%5===0?5:v.mastered%5;
 return '<div class="fp42-profile"><div class="fp42-profile-heading"><span class="eyebrow">DEIN FINANZPILOT</span><h1>Profil</h1><p>Deine Entwicklung, Erfolge und der nächste Schritt – ohne zusätzlichen Lernbaum auf dieser Seite.</p></div>'+
 '<section class="fp42-profile-hero"><div><span class="eyebrow">DEINE ENTWICKLUNG</span><h2>Level '+esc(v.oldLevel)+'</h2><p>'+num(v.oldXp)+' bisherige Lern-XP · '+num(v.sxp)+' neue Spezialisierungs-XP</p><small>Beide XP-Konten bleiben bis zur sicheren Zusammenführung getrennt gespeichert.</small></div>'+
 '<div class="fp42-profile-hero-orb"><strong>'+v.mastered+'</strong><span>Skills</span></div></section>'+
 '<div class="fp42-profile-stats">'+[
 ['Grundlagen',v.done+' / '+v.total,'Kurzlehrgang'],
 ['Skills',v.mastered+' / '+v.skillTotal,'Spezialisierungen'],
 ['Streak',v.streak+' / 30','Besuchstage'],
 ['Forschung',num(v.points),'Forschungspunkte']
 ].map(x=>'<div class="fp42-profile-stat"><small>'+x[0]+'</small><b>'+x[1]+'</b><span>'+x[2]+'</span></div>').join('')+'</div>'+
 '<section class="fp42-profile-promotion"><div class="fp42-profile-promotion-top"><div><span class="eyebrow">DEINE ANALYSTENKARRIERE</span><h2>'+(v.promotions?'Beförderungsstufe '+v.promotions:'Deine erste Beförderung')+'</h2></div><span class="fp42-profile-rank-emblem">✦</span></div>'+
 '<div class="fp42-profile-track"><div style="width:'+Math.min(100,complete/5*100)+'%"></div></div>'+
 '<p>'+v.mastered+' abgeschlossene neue Skills · '+(v.mastered>0&&v.mastered%5===0?'Nächster Rang nach fünf weiteren Skills.':remaining+' bis zur nächsten Beförderung.')+'</p>'+
 (v.promotions?'<small>Jede neue Beförderung erhöht deine täglichen Streak-Belohnungen. Aktuell '+v.promotions+' bestätigte neue Beförderung(en).</small>':'<small>Mit jedem fünften neuen Skill erhältst du eine größere Belohnung und bessere tägliche Streak-Prämien.</small>')+
 '<button class="btn" type="button" data-section-route="learn">Im Lernen-Tab weitermachen →</button></section>'+
 '<section class="fp42-profile-more"><h2>Deine Erfolge und Werkzeuge</h2><p>Öffne die Details nur dann, wenn du sie brauchst.</p><div class="fp42-profile-links">'+
 btn('inventory','Artefakte & Inventar',v.artefacts+' derzeit vorhandene, noch nicht eingelöste Artefakte · Forschung und Belohnungen','◇')+
 btn('career','Karriere & Analysewerkzeuge','Erreichte frühere Ränge, Analysehilfen und dauerhafte Auszeichnungen','✦')+
 btn('learningstats','Lernstatistik','Abgeschlossene Grundlagen, Skills und Entwicklung im Detail','◫')+
 '</div></section>'+
 '<section class="fp42-profile-account"><span class="eyebrow">KONTO & SICHERUNG</span><h2>Konto</h2><p>'+(v.hasUser?'Angemeldet · Lernstände und Skillkäufe werden geräteübergreifend gesichert.':'Ohne Anmeldung bleiben manche Fortschritte nur auf diesem Gerät. Für Skillkäufe und Belohnungen brauchst du ein kostenloses Konto.')+'</p>'+
 '<div class="fp42-profile-links">'+btn('account','Konto & Synchronisierung','Anmeldung, Fortschrittssicherung, Export und Einstellungen','⚙')+'</div></section></div>';
}
function stats(){
 const v=current();
 const detail=(title,value,subtitle)=>'<article class="fp42-profile-stat fp42-profile-stat-detail"><small>'+title+'</small><b>'+value+'</b><span>'+subtitle+'</span></article>';
 return '<div class="fp42-profile"><button class="btn secondary" type="button" data-section-route="progress">← Profil</button><div class="fp42-profile-heading"><span class="eyebrow">DEIN FORTSCHRITT</span><h1>Lernstatistik</h1><p>Nur tatsächliche Abschlüsse. Wiederholungen erhöhen die Zählung nicht erneut.</p></div><div class="fp42-profile-stats">'+
 detail('Grundlagen',v.done+' / '+v.total,'Kompakter Einstieg')+
 detail('Neue Spezialisierungen',v.mastered+' / '+v.skillTotal,'Geprüfte Skillabschlüsse')+
 detail('Bisheriges Lern-XP',num(v.oldXp),'Historisch vorhandene Kurse')+
 detail('Spezialisierungs-XP',num(v.sxp),'Serverseitig bestätigte Speziallektionen')+
 '</div><section class="fp42-profile-more"><h2>Tägliche Besuche</h2><p>Aktuelle Besuchsserie '+v.streak+' von maximal 30 Tagen. Entscheidend ist der App-Besuch, nicht der Abschluss einer Lektion.</p><button class="btn secondary" type="button" data-fp42-streak>Streak und Tagesbelohnungen ansehen</button></section>'+
 '<section class="fp42-profile-more"><h2>Was du als Nächstes tun kannst</h2><p>Grundlagen wiederholen, eine neue Spezialisierung auswählen oder bestehende Prüfungen fortsetzen.</p><button class="btn" data-section-route="learn">Zum Lernen →</button></section></div>';
}
function bind(root=document){
 root.querySelector('[data-fp42-streak]')?.addEventListener('click',()=>window.FinanzPilotStreak?.open?.());
}
window.FinanzPilotProfile={render,stats,bind,current};
})();
