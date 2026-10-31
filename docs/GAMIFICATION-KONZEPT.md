# FinanzPilot – Lernwelt, Motivation und Skill-Ökosystem (Konzept, NICHT implementiert)

Stand: 31.10.2026. Dies ist der gemeinsam weiterzuentwickelnde Produktentwurf. **Keine Gamification-Funktionen veröffentlichen, bis der Nutzer dem konkreten Konzept zugestimmt hat.** Anmeldung / Google-OAuth / Passwortwiederherstellung sind ein separates, bereits gestartetes Infrastruktur-Thema.

## Produktziel
Eine unterhaltsame, fachlich anspruchsvolle Finanzakademie mit echten Primärdaten, ausführlichen Aktienbewertungen, visuellen Lernmethoden und ehrlichem Feedback. Inhalte sollen verständlich, aber nicht trivial sein. Nutzer sollen freiwillig regelmäßig zurückkommen, weil sie Fortschritt sehen und neue Methoden beherrschen.

## Prinzipien
1. **Mastery statt Klick-Farming**: XP für nachweisbare Kompetenz und Transferleistung, keine unendlichen Punkte durch stumpfe Wiederholungen.
2. **Freischaltungen mit Wahlfreiheit**: Fortschreitende Lernpfade und besondere Herausforderungen können Skill-Voraussetzungen haben; Referenzwissen, Hilfen und grundlegende Bildungsinhalte nie künstlich aussperren.
3. **Kein Echtgeld und keine problematische Manipulation**: rein kosmetische virtuelle Belohnungen, keine Echtgeldpreise, keine Investments durch Levels oder Kauf-/Verkaufssignale als Spielbelohnung.
4. **Kein Reset bei Updates**: Account-Synchronisation, Versionierung, Export, offline/local-first, klare Statusanzeige.
5. **Gutes Fachwissen**: kein trockenes Lexikon, sondern Begriff -> konkretes Problem -> Geschichte/Intuition -> Zahl/Diagramm -> Fehlerquelle -> Anwendung -> 1–2 Transferübungen.
6. **Barrierefreiheit**: Animationen abschaltbar (prefers-reduced-motion), kein erzwungenes Tages-Streak-Verlustgefühl, Sound standardmäßig aus.

## Vorschlag für Rangtitel (muss noch mit dem Nutzer abgestimmt werden)
1. Funkenjäger
2. Zahlenkundiger
3. Bilanzspäher
4. Renditeschmied
5. Marktstratege
6. Risikoarchitekt
7. Alpha-Alchemist
8. Kapitalnavigator
9. Meisteranalyst

Ein Gesamtrang beruht auf mehreren Mastery-Skills und umfassenden Prüfungen – nicht allein auf Zeit in der App.

## Skillbaum
- Unternehmensanalyse (Geschäftsmodell, Wettbewerb, Segmentzahlen, Bilanz, Gewinnqualität)
- Bewertung (Multiples, DCF, WACC, Szenarien, Sensitivitäten, Gegenproben)
- Märkte/Charts (Zeiträume, Volumen, technische Signale vs. Fehlsignale, Ereignisfenster)
- Makro/Zinsen (Inflation, Notenbanken, Anleihen, Kapitalmarktzinsen)
- Portfolio/Risiko (Diversifikation, Korrelation, Drawdowns, Kapitalallokation)
- Research/Urteilsbildung (Quellenkritik, Zahlen normalisieren, These/Falsifikation, Debatte)

Jeder Bereich 1–5 Mastery-Stufen, Freischaltung anspruchsvoller *Zusatzmissionen* über belegte Teilfertigkeiten. Beispiel: erst DCF-Grundlagen bestanden, dann DCF-Stresstest und Quellen-Audit; Referenzmaterial bleibt immer lesbar.

## Fortschritt / Belohnung
- XP: abhängig von Schwierigkeit, korrekter Methode und Transfer; Wiederholungen bringen mehr Mastery als XP.
- Virtuelle Währung als reines Lerngame ("Forschungspunkte", Arbeitstitel), verdient durch nachhaltiges Lernen. Keine Kaufmöglichkeit mit Echtgeld.
- Virtueller Analystenschreibtisch, visuelle Karten, seltene Sammelabzeichen für vollständige Sektorrecherchen, freischaltbare Diagramm-Themes und Profilrahmen.
- Streaks mit sanftem Wiedereinstieg und Schon-Tagen, keine negativen Verluste oder finanzielle Anreize.
- Skill-Erfolge mit kurzen Animationen (sensible Konfetti-Explosion, glühender Knoten, Rangaufstieg, Karte freischalten) mit Opt-out.
- Tägliche/wöchentliche Aufgaben, Boss-Challenges, eigene Research-Dossiers und vollständige, quellengestützte Kursziel-Verteidigung.
- Darstellung: XP-Bar, Mastery-Heatmap, Skillzweige, Liste freigeschalteter Aufgaben, persönliches Kompetenzportfolio.

## Lernmethoden
- Guided analysis über 10–25 Schritte
- Zahlen selbst aus einem Geschäftsbericht identifizieren und berechnen
- Chart in bestimmtem Ereignisfenster lesen
- Falsche Investmentanalyse kritisch auseinandernehmen
- Bull/Base/Bear-Modell mit veränderlichen Treibern und Zielkurs verteidigen
- "Blind Research": unbekannte Aktie, zuerst eigene These, danach Vergleich mit Quellen und Musterargumentation
- Aktueller Marktfall: Nachricht -> Erwartung -> aktueller Marktpreis -> eigener Bericht -> Feedback
- Aufspaced Wiederholung und Interleaving, adaptiver Fragenpool mit Kompetenzprofil

## App-Navigation
Fünf Hauptbereiche: Heute, Lernen, Märkte, Aktien, Profil. Innerhalb jedes Bereichs kompakte, gut geordnete Listen mit Breadcrumbs; Charts, News und interaktive Finanzmodelle dürfen groß sein. Merke zuletzt besuchte Seite, letzten Schritt, Scrollposition je Seite, aktives Unternehmen, Chart-Zeitraum, unfertige Antworten. Ein Kurs-/Aktienkontext darf nicht durch Navigation verloren gehen.

## Erst diskutieren, dann implementieren
Offene Entscheidungen:
- Welche Titel und welcher Welt-Stil (seriöse Analysten-Akademie vs. spielerische Expedition)?
- Welche Belohnungen reizvoll sind, ohne die Motivation auf bloße XP zu reduzieren?
- Wie strikt sollen anspruchsvolle Übungsketten und Meisterprüfungen freischalten?
- Welche Animationen/Sounds sollen Standard oder Opt-in sein?
- Welche Genauigkeitsanforderungen an freie Antworten für Mastery-Stufen?
- Wie soll ein visuelles "Research-Dossier" nach Abschluss aussehen?

**Bis zu ausdrücklichem Go:** Nur Konzept und Diskussion, keine Gamification-Codeänderungen.

## 31.10.2026 – FINALER ENTWURF VOR IMPLEMENTIERUNGSFREIGABE

**Status:** Freigabe der konkreten Features und Reihenfolge steht noch aus. Dokumentation, keine App-Code-Änderung.

### Eine Spielwelt aus drei Ebenen
- **Finanzwelt-Abenteuer / Expeditionskarte:** Regionen Unternehmensstadt (Geschäftsmodelle), Bilanzminen (Finanzzahlen), Bewertungsgebirge (DCF/Multiples), Makro-Ozean (Zinsen/Währung), Chart-Wildnis (Marktbewegungen) und Risiko-Festung (Portfoliomanagement). Region hat thematische Aufgaben, Entdeckungskarten, besondere Gebietsbosse, seltene digitale Artefakte. Karte ist navigierbar, nicht nur Liste.
- **Analystenkarriere / Forschungszentrale:** parallel persönliches Research-Büro mit Beförderungen, Analysewerkzeugen, Rangnamen, Missionsarchiv und Aktien-Dossiers. Karriere an Kompetenz gekoppelt, nicht Klickzahl.
- **Lernakademie / Skillbaum:** echte verzweigte Fertigkeiten mit 5 Kompetenzstufen je Strang. Beispiel Bewertung: Zahlen lesen -> FCF-Bridge -> DCF -> WACC/Szenarien -> Modell-Audit. Querverbindungen: Bilanz + Cashflow -> DCF; DCF + Marktpreis + Gegenhypothese -> Aktienresearch. Meisterprüfungen können Anforderungen überspringen. Glossar, Nachrichten, grundlegende Erklärungen nie sperren; nur Spezialmissionen/Tools verdienen.
### Sekundäre Motivation
- Kurz-Animationen: animiertes Aufleuchten von Skill-Knoten und verbindenden Linien, Meisterschafts-Siegel, seltenes Karten-Reveal, Rangaufstieg mit sanfter Partikelanimation, visuell sichtbare Expeditionserfolge; Einstellungen für reduzierte Animationen und Sound aus.
- Seltene **persönliche** digitale Preise (keine NFTs, kein Blockchain-Trading): einzigartiges Research-Dossier mit Name, Datumsstempel und personalisierten Analyseschwerpunkten, individuelle Sammlerstücke/Büro-Einrichtung/Chart-Themes, dynamisch erzeugte Gebietsreliquien. Keine künstliche Seltenheitsbehauptung über andere Benutzer.
- XP = Studien-Fortschritt; Meisterschaft = geprüfte Transferleistung; Forschungscredits = nicht auszahlbare Kosmetik-/Research-Spielmittel; Sim€ = separate, limitierte virtuelle Depotliquidität. Kein Kauf für echtes Geld, keine Konvertierung in Echtgeld oder Kryptowährung.
- Erstmalige schwere Erfolge, saubere Wiederholungen und Transfer erhalten Belohnung; bloßes wiederholtes Klicken kein Farming. Pausen ohne harte Streak-Strafe, optionaler Schon-Tag.

### Fachbegriffe als Mini-Abenteuer
Jeder Begriff: echtes Problem -> nachvollziehbare Geschichte/Intuition -> Datengrafik -> eigener Zahlenversuch -> typischer Fehler -> kurze anspruchsvolle Anwendung an aktueller Aktie. Persönliche Kompetenz-/Wissenslücken für Wiederholung.

### Übungen, Challenge-Mix, verzögertes Feedback
- Hauptsächlich Multiple-Choice mit echter Differenzierung (mehrere plausible Optionen), Rechenfälle, Tabelleneinordnungen, Chart-Annotation, Reihenfolge, Zuordnung, interaktive Szenarien und Modellparameter.
- Weniger Freitext; Freitext nur für echte eigene Investmentthesen, längere Analysen und Bossprüfungen.
- Freitext-Fall wird nur nach ausdrücklichem Einreichen in private Supabase-Review-Warteschlange übernommen: Status Eingereicht / Wartet auf Prüfung / Bewertet / Fehler. Tägliche vorhandene Redaktion kann mit expliziter Identitäts-/Datenschutzfreigabe bewerten, schriftliches faktenbasiertes Feedback und individuellen Folgeauftrag im privaten Datensatz speichern.
- Falls automatisierte Ausführung scheitert oder Daten fehlen, unverändert 'Ausstehend' statt vorgetäuschtem morgigen Ergebnis. Echte Bearbeitungszeit transparent; unzuverlässige oder nicht zuordenbare Einsendungen nicht öffentlich in GitHub Issues oder anonymen Dateien ablegen.

### Virtuelles Aktien-Depot / Börsensimulator (später eigener Bereich)
- Wird durch nachgewiesene Grundlagenkenntnisse + bestandene Markt-/Risikoprüfung freigeschaltet. Training/Glossar weiterhin offen.
- Anfangskapital begrenzt in Sim€; zusätzlich kleine, gedeckelte Sim€-Belohnungen für Lernmeilensteine, virtuelle Dividenden, reale simulierte Kursgewinne/verluste. Kaufkraft/XP nie als Echtgeld darstellbar.
- Separate Sim€-Transaktionswährung und Forschungscredits, damit Lern- und Investitionsanreize nicht durcheinandergeraten.
- Reale, datierte verzögerte Tagesschlusskurse und offizielle Währungsumrechnung; keine erfundenen Livekurse, keine Trades ohne Datensatz. Zu Anfang nur Buy/Hold/Sell, kein Leverage/Options/Shorts. Stückzahl/Fractions, Ordergebühren/-slippage im Modell klar definiert; Dividenden, Splits, Delistings später.
- Trades als unveränderliches Journal, atomisch im Server über Supabase mit RLS und serverseitiger Validierung – niemals nur in Browser-localStorage oder ungeprüften Client-Preisparametern. Keine vertraulichen Nutzerbestände in öffentliches GitHub.
- Diversifikation, Konzentration, Volatilität, Benchmark-Return, Sektor-/Länderanteile, Dividenden, Trade-Thesen und nachträgliche Entscheidungsreflexion.
- **Nicht käufliche** Belohnungspakete aus fest kommunizierten, nicht monetarisierbaren virtuellen Anteilen oder Unternehmens-Research-Karten (transparentes, nachvollziehbares Sortiment; kein Echtgeld, keine Pay-to-Win-Lootbox, kein Glücksspiel, keine manipulative Zufallsmechanik).
- Depot-Skillmissionen: „3 Sektoren analysieren“, „Trade nach Thesis verteidigen“, „Was hättest du anders gemacht?“, „Watchlist/Portfolio auditieren“.
- Marktbewegungen allein sind kein Nachweis von Wissen, deshalb 'Skillmastery' unabhängig von simulierten Portfolioerträgen. Lerneinsatz wird nicht zum gefährlichen Spekulieren belohnt.

### Konkreter sinnvoller Release-Plan – nacheinander mit Tests und Nutzerreview
0. **Auth & Kontomigration:** Google OAuth Provider, SMTP/Reset vollständig testen; bestehende Fortschritte korrekt einem Benutzer zuweisen, Backup, RLS, Fehlerbehandlung.
1. **Informationsarchitektur:** fünf Hauptnavigationen, Expedition/Karriere als Unterseiten, kompakte Listen + große News/Charts, stabile Breadcrumbs, Deep-Links, Draft- und Scroll-Persistenz.
2. **Skill-Engine:** feste Skill-Abhängigkeiten, Stufen/Mastery, Tests, klare Unlock-Prüfung, Fortschrittsereignisse serverseitig, einfache Skillbaum-Grafik.
3. **Lern-UX:** 2–3 Referenzkurse auf Problem-Datengrafik-Rechnung-Anwendung umbauen, Prüfformate, Wiederholungsplan; erst nach Qualitätstest skalieren.
4. **Erlebnis & Belohnung:** aufwendigere 2D-Karte und Analystenbüro, Rangtitel, Animationen, Schmuck, nicht käufliche personalisierte Unikate, Barrierefreiheit und Nutzerfeedback.
5. **Private Warteschlange & tägliches KI-Feedback:** einreichbare Thesen, klare Wartezustände, Redaktionsantwort in Supabase statt GitHub, Quellen/Datumslog, zuverlässiger Ausfallstatus.
6. **Börsensimulator Grundversion:** Sim€-Wallet, servervalidierte Orderausführung, Börsenkurse, Kauf/Halten/Verkauf, Portfolio-/Cashchart, Handelshistorie.
7. **Depotanalyse und Geschenk-Events:** Dividenden/Splits, Benchmarks, Depotmissionen, Spezialpakete, risk/performance audit, Learning-to-Portfolio Rewards.
8. **End-to-End QA & Feinschliff:** Monitoring, iPhone-PWA, Datenfrische, Auth, Synchronisation, Anti-Exploit, Performance, Animationen, Data-integrity, RLS, Datenschutz.

**Auf keinen Fall alle Etappen in einem Update starten.** Je Etappe eine vollständige konsistente Funktion mit Testplan, dann nächste.
## 31.10.2026 – WIRTSCHAFT, BEFÖRDERUNGEN, SOUNDS UND ECHTKURSE (KONZEPTABGLEICH)

**Noch nicht implementieren.** Diese Erweiterung bündelt die neu präzisierten Wünsche. Erst nach Nutzerfreigabe releaseweise in die Laufzeit übernehmen. Für alle Features gilt: bestehende App, Kurse und Lernfortschritte konservieren; eine einzige verlässliche Navigations-/Progress-Quelle.

### 1. Zwei Systeme, eine Progression
- Ein navigierbarer, verästelter Talentbaum mit verbundenen Abhängigkeiten und Querverbindungen. Mindestens 6 Hauptlinien und versteckte/seltene Nebenäste. Kurse verleihen einzelne Skills, besondere Kursabzeichen und konkrete neue Zweige, nicht nur XP.
- Parallele Analysten-Karriere (Rang/Beförderung) **mit funktionalen Privilegien**: freigeschaltete Research-Werkzeuge, Vergleichscharts, Screener, Watchlist-Kapazität, Portfolio-Szenarioanalyse, erweiterte Ordertypen und Portfolio-Audit; Zugang nach tatsächlichen Mastery-Nachweisen, kein unbegründetes Kursrendite-Boosting.
- Ein Rangwechsel ist ein inszeniertes Ereignis mit Sound, visueller Zeremonie und konkreter „Ab jetzt kannst du …“-Liste. Keine Geldwäsche zwischen Systemen, kein Echtgeld, keine manipulativen Glücksspiele.

### 2. Economy: Virtuelles Euro-Depot und wertvolle Entscheidungen
- In der Depot-UI werden **gewöhnliche €** angezeigt (z. B. „Depotwert 3.842,50 €“) und die ganze Ansicht dauerhaft eindeutig mit **„Übungsdepot · virtuell, kein Echtgeld“** markiert. Niemals suggerieren, das Geld sei auszahlbar.
- Zwei Ressourcen, keine überflüssige dritte: **virtuelle Depot-Euro (handelbares Kapital)** und **Forschungspunkte (Fortschritt-/Craftingressource)**. XP bleibt separater Rangfortschritt, **nicht** handelbar.
- Geld zum Start limitiert (Vorschlag: 2.500 €), neue Depoteinzahlungen durch einmalig bestandene Kurse/Bossmissionen und wöchentliche Lernziele **gedeckelt und transparent**; keine unendlichen Trivia-Farms. Depotgewinne/-verluste und Dividenden als normaler Kapitalfluss.
- „Relikte/Items“ sind sammelbare virtuelle, nicht handelbare Spielobjekte mit begrenzter Einmaligkeit. Beispiel: ein seltenes „Kapital-Siegel“ kann **genau einmal** auf eine von drei Arten eingesetzt werden: (1) Research-Werkzeug permanent freischalten, (2) Spezial-Lernpfad freischalten, (3) Item vernichten und gegen z. B. 250 € virtuelles Depotkapital einlösen. Entscheidung irreversibel, vor Bestätigung Klartext-Preview und explizites Confirm; keine Leerlauffalle: gesperrtes Wissen anderweitig durch Meisterprüfungen erreichbar, aber ggf. schwerer. Nicht per Echtgeld nachkaufbar.
- Auszahlung von Items in € hat explizite deterministische Werte, keine Lootbox-/Zufalls-Abhängigkeit von realen Wertgegenständen; kosmetische Packs können Entdeckung enthalten, aber keine bezahlten Zufallsprodukte.
- Jede Transaktion erhält serverseitiges Audit-Ereignis, selbst bei neuer Geräteanmeldung. Portfolio-Performance ist **geldflussbereinigt** (Zeitgewichtung oder interne Benchmark-Buchung); neue Lernprämien sollen nicht fälschlich als Börsenrendite zählen.
- Zwischen den Belohnungskanälen echte Wahlfreiheit: heute „Screener“, „verzweigter Makrokurs“ oder „150 € mehr verfügbare Börsengelder“. Nutzer sieht Konsequenzen und kann selbst wählen.

### 3. Realistische Aktienkurse (kein Fake-Handel)
- Es werden **echte börsennotierte Titel** mit echten, datierten Preisinformationen und Börsen-/Währungskennung geführt; Benutzer kann reale Aktien **virtuell** kaufen/halten/verkaufen. Keine fiktiven Kurse als echte anzeigen.
- Nicht wahrheitswidrig „Live“ versprechen: kursfähig handeln nur mit wirklich bereitgestellten, frischen und zeitlich gekennzeichneten Daten. Zu Beginn **historische/vom Anbieter verzögerte Schlusskurse**; Orders können als wartende Marktausführung zum nächsten verifizierten Schlusskurs laufen. Erst wenn ein zulässiger und erschwinglicher Echtzeit-Feed verfügbar und geprüft ist, echte intra-day-Simulation ermöglichen.
- Marktschluss und Feiertage, späte Meldungen, Spreads/Slippage-Gebühren, Bruchteile, Corporate Actions, Dividenden, Quellen und Euro/FX-Kurse vor vollem Launch festlegen; fehlende/frischigkeitskritische Daten blockieren Order und geben vernünftige Erklärung.
- Nicht direkt lokale Storage-Zahlen ändern: Supabase-only/serverseitige atomic/transactional Ordervalidierung, Preis-/Währungs-Snapshot plus Zeitstempel, idempotente Buchungs-ID, RLS, Konkurrierende-Geräte-Tests, Saldo kann nicht negativ werden.
- Rang-/Tool-Freischaltungen verbessern Analysefähigkeiten (z. B. detailliertere Charts, Trade-Journal, Risiko-/Exposure-Prognose), **nicht** systematisch die simulierte Chance auf Kursgewinne. So bleibt die Performance vergleichbar. Kursgewinne unabhängig von XP und Mastery.

### 4. Ton- und Animationssystem iPhone-fähig
- Kleine hochwertige eindeutig unterscheidbare Klänge: richtige Antwort (kurzer warmer Tick), abgeschlossenes Kapitel (2–3 Noten), Skill freigeschaltet (aufsteigendes Motiv), Rangaufstieg (feierlicher kurzer Fanfaren-Sound), besondere Fundstücke (eigene Enthüllung), Aktienkauf (leises bestätigendes Signal), Verkauf (anderer kurzer Bestätigungston), fehlerhafte Order (subtiler Hinweiston).
- Nie als Echtgeldzahlung anmutende Geräusche; keine Endlosschleifen. Sound standardmäßig auf „Aus“ bis erste bewusste Nutzeraktivierung bzw. klarer Sound-Schalter; Lautstärke-Regler; iOS-WebAudio erst bei Nutzerinteraktion aktivieren; kein Ton im Silent Mode erzwingen.
- Animationen als leichte DOM/CSS/Canvas- oder SVG-Effekte, Hardware-/iPhone-PWA-schonend, keine Lags; Reduced-Motion respektieren, Animationen separat konfigurierbar. Jeder audiovisuelle Effekt hat auch eine Text-Bestätigung und ist nicht die einzige Informationsquelle.
- Debounce/anti-repeat: bei wiederholten Klicks kein Explosion-Farming; Belohnungsereignisse sind eindeutig, nicht rekursiv.

### 5. Release-Gates – nicht alles auf einmal
0. Google OAuth, Reset-Mail/SMTP wirklich mit Benutzer verifizieren, lokale und Cloud-Daten erhalten.
1. App-Navigation/Breadcrumbs/Sessionwiederaufnahme gründlich und mobil testen.
2. Mastery-Engine + Skill-Graph mit echten Fähigkeiten, Meilensteinen und serverseitig verlässlicher Progression.
3. Hochwertige Lernmodule + sinnvolle Unlocks/Karrierebeförderungen.
4. Zentraler Economy-Ledger für XP/Forschungspunkte/Items/virtuelle € (keine Trades).
5. Animation-/Sounddesign + Inventar, drei kontrollierte Redemption-Optionen, keine versehentliche unwiderrufliche Auflösung.
6. Depot-Service mit echten datierten Kursen und Ordersystem + Performance-Buchung.
7. Depotanalyse, Dividenden/Corporate Actions, virtuelle Aktiengeschenke, Missions-/Paket-System.
8. Professionelle End-to-End-QA und PWA auf iPhone. Jede Stufe: Datenmigration/Tests, Feature-Flag, Nutzerabnahme vor dem nächsten Abschnitt.

### Aktueller Status
Konzept in Markdown dokumentiert, **keine Veröffentlichung als App-Funktion**. Frei entscheidbare noch offene Parameter: Startkapital/Höhe von Skill-Belohnungen, Typ und Wert spezieller Item-Umwandlungen, Sound-Standard, Reihenfolge der Gameplay-Releases, Live-/Delay-Quoteversorgung, grafischer Kartenstil.


## Umsetzungsstand 31.10.2026 – Autorisierung und erste Etappen
Der Nutzer hat am 31.10.2026 nach eigenem Google-OAuth-Setup die **schrittweise Umsetzung** ausdrücklich beauftragt. Die frühere Formulierung „ohne Freigabe keine Implementierung“ ist durch diese spätere Freigabe für die unten bezeichneten Schritte überholt. Nicht stillschweigend andere große Teilprojekte als fertig bezeichnen.

| Etappe | Status | Technischer Stand |
|---|---|---|
| 0. Konto & Datensicherung | **Vorbereitet; Live-Login noch nicht end-to-end bestätigt** | Google-Button und Passwort-Reset in sync.js; vorhandene Supabase-Tabelle mit RLS; keine Benutzerdaten migriert oder gelöscht |
| 1. Navigation & Startseite | **Im Repo veröffentlicht; Sichtprüfung auf iPhone ausstehend** | ux.js v11, kompakter Home-Hub, eigene Skillseite, gespeicherte letzte Ansicht/Scrollposition unter bestehendem Key |
| 2. Skillbaum Basis | **Im Repo veröffentlicht; synthetisch getestet** | skills.js + skills.css v11: 13 Knoten, 16 Kanten, echte Abhängigkeiten; Beherrschung ausschließlich aus gespeicherten Kurs- und Aufgabenergebnissen abgeleitet |
| 3. Bessere interaktive Kurse | **Offen** | Vorhandene Kurse unverändert, Schwerpunkt Lernqualität und Aufgabenformen |
| 4. Inventar, Economy & Beförderungsvorteile | **Offen** | Vor Implementierung: Ledger/RLS/Servertransaktionen, Statusmodell, idempotente Reward-Claims |
| 5. Sounds, animierte Rangaufstiege, Weltkarte | **Offen** | Animation und Audio-Einstellungen, Accessibility, iPhone-Performance |
| 6. Private Analyse-Prüfschlange | **Offen** | Eigene Supabase-Warteschlange und echtes privates Feedback der täglichen Redaktion |
| 7. Virtuelles Echtkurs-Depot | **Offen** | Datierte verifizierte Kursquelle, Orders, Konto, Geldflussbereinigte Performance |
| 8. Geschenke, Depotauswertung, Events | **Offen** | Abhängig vom sicheren Depot-Ledger |

### Erste Release-Grenzen
- Skillbaum ist **vorerst lesender Fortschritt** und keine eigene Guthaben-/Belohnungswirtschaft. Er darf nie XP ohne bestandene Aufgaben vergeben.
- Der Graph zeigt Prüfungs-Freischaltungen, **keine Sperre für Lernmaterialien**.
- Keine echten oder virtuellen Depotorders, noch keine Items und keine Sounds.
- Bestehende lokale Keys `finanzpilot_v1`, `finanzpilot_lab_v3`, `finanzpilot_academy_v4`, `fp_research_answers_v1`, `finanzpilot_navigation_v6` werden nicht umbenannt/gelöscht.
- Vor Ausweitung Etappe 0 mit Google-Login/SMTP und Fortschrittsübernahme auf dem iPhone testen. Ein veröffentlichter Button ist kein Beweis für funktionierenden OAuth.

## Entwicklungsstand Version 12 – interaktive Trainingskurse

**Am 31.10.2026 direkt in GitHub veröffentlicht, End-to-End-iPhone-Test ausstehend.**

- Phase 3, erste vollständige Teilfunktion: `data/training.json`, `training.js`, `training.css`; drei unternehmensbezogene, datierte Praxisreihen zu KION, AIXTRON, Alphabet (5 Schritte je Kurs).
- Lernformate: Erklärung und Diagramm → Zahlenrechnung → Mehrfachauswahl (genau zwei) → fachliche Reihenfolge → analytische Entscheidung. Bei jeder Prüfung gibt es einen expliziten Rechenweg / begründete Analyse.
- Eigenes wiederaufnehmbares Lernmodul `training` im Menü und auf Startseite, unveränderte bestehende Kurse.
- Wiederholungsplanung: falsche Antworten nach einem Tag, richtige nach drei Tagen, bei korrekter Wiederholung längeres Intervall. Keine erfundene KI-Auswertung.
- Fortschrittskey `finanzpilot_training_v1` mit modulspezifischem Status, Antworten, Bestwerten und Wiedervorlage; Cloud-Synchronisierung anhand zeitlich neuerer Modulversion und maximalem bestandenem Score.
- Der Skillbaum kann nachgewiesene 4/4-Trainingsergebnisse zusätzlich zu älteren Kursen als Kompetenznachweis verwenden.
- XP, Belohnungen, virtuelle Euros, Inventar und Trades weiterhin nicht implementiert; die sichere Spielökonomie gehört zu einer späteren Etappe.
- QA: JS-Syntax und 12 richtige/falsche Musterantwort-Paare simuliert und bestanden; App-Verknüpfung, Dateipfade und Schreib-Commits verifiziert. Echte Nutzeranmeldung und Anzeige auf iPhone noch nicht verifiziert.
- Redaktion: bestehende tägliche Automations-Aufgabe wurde um Qualitätsvorgaben und Schutz der neuen Trainingsschema- und Fortschritts-IDs ergänzt.

## Entwicklungsstand Version 13 – Analystenkarriere, Freischaltungen und Werkzeuge

**31.10.2026: Auf GitHub main implementiert; Javascript-/Muster-Daten-Tests bestanden, echter iPhone-/Pages-Test ausstehend.**

### Implementiert
- `data/career.json`: acht Ränge auf Basis von 0/1/3/5/7/10/12/13 nachgewiesenen Fertigkeiten, keine clickfarmbaren Rangpunkte. Jeder weitere Rang eröffnet bei fachlicher Voraussetzung mindestens ein neues Recherchewerkzeug.
- `career.js` / `career.css`: eigene Seite `career` über Startseite, Skillbaum, Profil und Mobilmenü. Kompakte Werkzeugliste, nachvollziehbare gesperrte Voraussetzungen, aktive Tools als eigene Unteransicht.
- Sieben **funktionierende, mit eigenen Daten befüllbare** Kalkulatoren: operatives Umsatz-/EBIT-Margenprofil; Book-to-Bill; Sicherheitsmarge; Portfolio-Stress mit zwei Positionen und Cashgewicht; bestehendes KION-Szenario-DCF; EV/EBIT-Peer-Multiple-Gegenrechnung; subjektiv wahrscheinlichkeitsgewichteter Investment-Ausschuss.
- Vier **nachweisbasiert einmalig pro Kursstand** erscheinende persönliche Kursartefakte: Industrie-Kern (KION-Kurs+Training), Silizium-Linse (AIXTRON-Training), Cloud-Kompass (Alphabet-Training), Szenario-Kristall (Skillbaum-Meister). Keine Erfindung von globaler Seltenheit, keine virtuelle Währung, kein Item-Handel oder -Verbrauch.
- Die eigentlichen Abschlüsse bleiben in den **bestehenden synchronisierten Fortschritts-Keys** gespeichert; Rang und Artefakte werden daraus deterministisch abgeleitet. Belohnungsklicks können daher nichts doppelt ausschütten. Werkzeugwahl lokal in `finanzpilot_career_ui_v1` gespeichert (kein Lernfortschritt).
- Alle numerischen Tools kontrollieren Eingaben und zeigen Formeln/Annahmegrenzen. Historische Beispielzahlen sind ausdrücklich kein aktueller Livekurs oder garantierte Kaufchance.
- Bestehende UI, Auth und Kurse bleiben unverändert im Inhalt; keine Supabase-Tabellen- oder Geldtransaktionen.

### Getestet
- Vier JS-Dateien auf Syntax und Quellenpfade geprüft; Grundfall 0 Skills, Zwischenfall 7 Skills, Vollfall 13 Skills simuliert.
- In 0-Skill-Profil keine Spezialwerkzeuge, im vollständigen Testprofil sieben Werkzeuge und vier Artefakte, bei teilweisem Lernstand nur die tatsächlich verdienten Unlocks.
- Sechs selbstständige Modellrechnungen geprüft; KION-DCF-Anbindung aus bestehendem Quellcode übernommen.
- Öffentliche GitHub-Pages-Auslieferung und echter iPhone-/Google-Login weiter nicht end-to-end bestätigt.

### Nächster sicherer Schritt
1. Echte iPhone-Navigation und Google-/Passwort-Anmeldung bestätigen.
2. Eigenes **serverseitig gebuchtes Belohnungs-/Inventarsystem** entwerfen: pro einmaligem Ereignis (Kurs, Prüfung) eine idempotente Reward-ID, Transaktionen in Supabase mit RLS. Getrennte Forschungspunkte und virtuelle Depot-Euro; Umtausch nur mit klarer Bestätigung und atomischem Ledger.
3. Animationen und Sounds erst nach sicheren Reward-Ereignissen anbinden, um Mehrfachbelohnungen und falsche Freischaltmeldungen zu vermeiden.
4. Virtuelles Aktien-Depot erst nach belastbaren zeitgestempelten Kursen, serverseitiger Ordervalidierung und Cashflowbereinigter Performance.

## Entwicklungsstand Version 14 – sicheres Inventar, Lernbelohnungen und virtuelle Euro

**Stand 31.10.2026. Backend auf Supabase und App-Code auf GitHub veröffentlicht. Authentifizierter End-to-End-Test auf dem echten iPhone steht aus.**

### Implementierte, durchdachte Economy-Stufe
- Server-Schema `supabase/economy_v1.sql` mit Patch `supabase/economy_v1b_item_ids.sql`: `fp_economy_accounts` (Forschungspunkte/virtuelle Eurocent), `fp_verified_training` (einzeln bestätigte Aufgaben), `fp_reward_claims` (ein einmalig verdientes und optional verbrauchtes Item pro Modul), `fp_reward_perks` (dauerhafte Freischaltung), `fp_reward_ledger` (unveränderliche, eindeutige Buchungen).
- RLS an allen fünf Tabellen, ausschließlich SELECT für `authenticated`, kein Browser-Direktwrite und kein anon-read. Drei kontrollierte RPCs `fp_submit_training_answer`, `fp_redeem_artifact`, `fp_purchase_reward` mit expliziter `auth.uid()`-Prüfung; `SECURITY DEFINER` wird ausschließlich für diese streng begrenzten validierenden Endpunkte verwendet. Der Security Advisor meldet zwei erwartete Warnungen über intentional aufrufbare authenticated/security-definer-RPCs; keine neuen ERROR-Befunde für die fünf Tabellen.
- Trainingserfolg wird **nicht aufgrund ungesicherter localStorage-Punkte ausgezahlt**: die vier öffentlichen, festgelegten Antworten werden auch auf dem Server geprüft. Je Modul können nur vier unterschiedliche Schritte zählen und ein einzigartiges Buchungsereignis `mastery:<module>` schreibt höchstens einmal **100 Forschungspunkte + ein eigenes verbrauchbares Artefakt** gut.
- Die drei anrechenbaren Module heißen `kion-nachfrage`, `aixtron-auftraege`, `alphabet-cloud`. Ein bereits abgeschlossener Kurs kann auf der Abschlussseite erneut serverseitig bestätigt werden (nur bei vorhandenen gespeicherten korrekten Antworten, sonst Aufgaben erneut lösen).
- Jedes so entstandene Artefakt hat **genau eine irreversible Einlösung** mit expliziter Benutzer-Bestätigung: eine modulbezogene **interaktive Research-Lupe (Tool)**, eine modulbezogene **dreistufige Spezial-Expedition (Lernpfad)** oder **150,00 € nicht auszahlbare virtuelle Depotliquidität**. Der ursprüngliche Gegenstand wird danach als verbraucht markiert. Besondere Kursurkunden in der Karriere sind getrennte dauerhafte Leistungsnachweise, keine zusätzlichen verbrauchbaren Items.
- Neue Spezial-Expeditionsergebnisse in `finanzpilot_expedition_v1` im bestehenden Sync-Backup. Zwei zusätzliche rein kosmetische Forschungspunkt-Produkte: `theme:mint` (150 FP) und `theme:gold` (200 FP), ohne Echtgeld.
- Einloggen erforderlich für Economy. Bei Logout leert die UI die Kontodaten, Themes und Items. Formulardaten und sensible Auth-Credentials werden nie in GitHub gespeichert.
- Ledger-Schutz: Account-Row-Lock, einmalige `user_id,event_key`-Buchungen und eindeutige `user_id,module_id`-Ansprüche. Direkte HTTP-POSTs auf Tabellen verhindern die Privilegien/RLS, aber die quizbasierten Antworten sind bewusst öffentlich und damit für motiviertes Cheating kein kryptografischer Kompetenznachweis.
- `economy.js` / `economy.css` / `sync.js` / `training.js` und Navigation v14 sind angeschlossen. Frei zugängliche Grundlagen- und Expertenkurse bleiben erhalten. Die neue Profil-Unterseite heißt **Inventar & Belohnungen**.
- Tests: JS-Syntax, 4 Aufgaben je Modul, erneute Abgabe desselben Trainings erzeugt in simulierten Tests weder doppelte Coins noch ein zweites Item, anonymes RPC wird serverseitig abgewiesen, RLS-/GRANT-Schema und drei RPCs geprüft, GitHub CI um `scripts/test_economy.mjs` ergänzt.

### Noch nicht umgesetzt
- Kein aktiver virtueller Handel, kein Kauf/Verkauf realer Aktien für virtuelle Euro, keine Gutschriften aus Dividenden oder Kursgewinnen.
- Keine automatischen Sound- und Rangaufstiegsanimationen, keine grafische Abenteuer-Weltkarte, keine KI-Review-Queue und keine umfangreiche Economy über die drei geprüften V12-Kurse hinaus.
- Kein unabhängiger End-to-End-Test eines realen Google-Logins mit echtem Belohnungs-RPC, kein verifizierter GitHub-Pages-Browser-Test. Bestehende Nutzer können ihre Arbeiten zunächst weiter lokal sichern.

### Nächste Release-Qualitätsstufe
1. Google-Login auf iPhone, Kontowechsel, Offline-Status, Rewards-Replay, doppelte Käufe und die irreversible Entscheidung mit echtem Testkonto und starker Datenschutzkontrolle testen.
2. Unaufdringliche, barrierefreie Belohnungs-/Beförderungsanimationen und klar abschaltbare kurze Töne als einzelne Release-Phase.
3. Erst danach serverseitiges Depotjournal, belastbar datierte Börsenkurse und echte virtuelle Orderausführung.

## Version 15 – Navigation, Sync und Homebildschirm (31.10.2026)

**Im Repository implementiert, echter iPhone-PWA-Durchlauf noch ausstehend.** Der Nutzer meldete: alte v13 sichtbar, überlaufendes Konto-Synchronisieren, unübersichtliche Kontextreiter, zu viele Tabsprünge, einen störenden Zurück-Button, schlecht erkennbare Artefakt-Icons und mangelnde Auto-Updates.

### Tatsächlich in dieser Etappe umgesetzt
1. `ux-v15.js` statt `ux.js`, `ux-v15.css` ergänzt. Fünf feste Hauptbereiche:
   - **Start:** Übersicht, Kurse fortsetzen, wichtige News.
   - **Lernen:** Lernpfad, Training, Skillbaum, Fachwissen/Grundlagen.
   - **Märkte:** News, Charts, Indizes, eigene Markthypothesen.
   - **Aktien:** Unternehmensresearch und vollständige Intensivkurse.
   - **Profil:** Fortschritt, Analystenkarriere, Werkzeuge, Inventar und Konto.
   Lokale Breadcrumbs + ein kompakter **Bereiche**-Button öffnen pro Tab eine eigene beschreibende Modalseite. Alte großflächige Kontext-Buttons und pauschale Zurück-Schaltfläche entfernt. In den Unterseiten nur optionaler expliziter Weg zur Hauptbereichsübersicht. Ein Navigationswechsel speichert Blickposition und letzte Seite im bisherigen Schlüssel `finanzpilot_navigation_v6`.
2. `sync.js`: Konto oben rechts jetzt nur noch kompaktes Sync-Symbol; öffnet bei nicht angemeldetem Nutzer Konto, ansonsten löst es eine direkte Sync aus. Konto weiterhin über Profil -> Bereiche erreichbar. Bei Login, App-Öffnen, Wiederkehr aus Hintergrund, Online-Wiederkehr und lokalen Fortschrittsereignissen automatischer Supabase-Abgleich; zusätzliche periodische Synchronisierung im Vordergrund. Beim Verlassen bestmöglicher `fetch keepalive` mit bestehenden JWT-/RLS-Regeln, ohne Garantien bei iOS-Prozessabbruch. Lokal gespeicherte Resultate werden niemals absichtlich gelöscht.
3. `version.json` mit Version 15, `updates.js` prüft auf GitHub Pages beim Start, Sichtbarwerden und periodisch eine frisch abgerufene Versionsnummer. Erst bei einer höheren App-Version synchronisieren versuchen und Seite mit neuer, cachebrechender Query neu öffnen; Hash/Unterseite bleibt erhalten. `manifest.webmanifest` mit stabiler Scope, eigenem `icon.svg`, `display: standalone` und Start-URL. Reale PWA-Installation muss auf iPhone über Safari „Zum Home-Bildschirm“ mit „Als Web-App öffnen“ einmalig erfolgen.
4. Karriere und Inventar behalten geteilte Kernschemas, erhalten aber hochwertigere, individuelle Vektor-Medaillen über `iconography.js` und `iconography.css`. Einlösbare Artefakte bleiben vom permanenten Karrieretitel getrennt.
5. `scripts/test_navigation_v15.mjs` ist im GitHub Actions Quality-Workflow verankert, zusätzlich zu vorangehenden Rechnungs-, Economy- und JS-Tests. Manuelle Laufzeit-Mocks für Tab-Gruppierung, Wechsel und fünf Haupttabs erfolgreich; echte Gerätedarstellung/erfolgreiche GitHub-Actions-Ausführung nicht abschließend bestätigt.

### Bewusst als nächste eigenständige Ausbaustufe geplant (NICHT als fertig markieren)
- **Großer zoombarer Skillbaum:** umfangreicher als 13 Fertigkeiten, echte verästelte Karte mit 6–8 Branch-Hauptlinien, Querverbindungen und verschiedenen Fertigkeiten-/Meisterstufen. Pinch-to-Zoom am iPhone, Zoom +/−/Reset, minimap/Übersicht, Fokus/Scroll-Erhaltung. Erlerntes Wissen bleibt frei zugänglich, gesperrt sind spezialaufgaben und Tools.
- **Begriffs-Training statt trockener Lexikoneinträge:** Glossar als Nachschlagewerk behalten, daneben eine **eigenständige Begriffsschule mit progressiver Reihe**: (1) Geschäftsmodell/GuV, (2) operative Marge, (3) Bilanz und Working Capital, (4) Cashflow/Capex, (5) Free Cashflow, (6) ROIC/WACC, (7) DCF und Szenarioprüfung. Pro Stufe: verständlich motivierender Fall → Grafik mit konkreten Zahlen → guided challenge → eigenständige Anwendung in realen Aktienanalysen → anspruchsvolle Meisterfrage. Zwischenstufen, knappe Wiederholungen und spaced review einbauen; keine triviale MC-Klickmaschine. Auch fortgeschrittene Lernende können Eingangstests zum Überspringen leichter Stufen ablegen. Nicht alles in einen großen Tab quetschen.
- **Design weiterer Belohnungen:** Den neuen Vektorlook fortführen, klare Besonderheit für seltene Artefakte, hochwertige visuelle Entdeckungsanimationen und Nutzer-regelbare Töne; Performance des iPhones prüfen.
- **Depot:** echte, zeitgestempelte Kurse mit Quellen/Verzögerungsangaben, serverseitiges Orderjournal, Aktien/ETF-Käufe mit ausschließlich virtuellen Euro. Kein Depot starten, bevor diese Daten und Buchungstests stehen.

### Release-Regeln für die tägliche Redaktion
Bei reinen Content-Änderungen nur Daten aktualisieren; die bestehenden Navigationsskripte nicht zurücksetzen. **Wenn Laufzeit-HTML/JS/CSS geändert werden**, zuerst GitHub Regressionen prüfen, `version.json.version` erhöhen, in `updates.js` auch `CURRENT_VERSION` anpassen, geänderte CSS/JS-Asset-Queryparameter in `index.html` cachebrechend erhöhen und `manifest.webmanifest.start_url` passend aktualisieren. Reine Datenmeldungen mit `fetch(cache:no-store)` benötigen keinen Versionssprung. Keine Cloud-Passwörter/Secrets in GitHub schreiben.

## Version 16 – vergrößerter Skillbaum und strukturierte Begriffs-Akademie

**31.10.2026: auf GitHub main implementiert und statisch/funktional in JS-Mocks geprüft; echter iPhone-PWA-Test weiterhin ausstehend.**

### Neues Curriculum und Fortschritt
- Die zehn eigens aufgebauten Lernkurse in `data/terminology.json` heißen `guv`, `margen`, `bilanz`, `working`, `fcf`, `roic`, `wacc`, `enterprise`, `multiples`, `szenarien`. Ein durchgehendes *fiktives* Unternehmen Nordwerk AG liefert nachvollziehbare und zusammenpassende Kennzahlen. Keine echten oder aktuellen Kursdaten vortäuschen.
- Je vier Schritte: ausführliches Konzept + Einordnung samt einfachen Datenbalkendiagrammen, eigene Rechnung, kritische Mehrfachauswahl mit genau zwei richtigen Aussagen, begründete analytische Entscheidung. 40 Schritte, davon 30 bewertete Prüfungen. Hinter jeder Prüfung steht eine Erklärung, keine kindischen Rätsel. Die nächste Kursstufe wird nach vollständig bestandenen drei Prüfungen freigegeben; zuvor bestandenes bleibt erhalten.
- `concepts.js` ist eine unabhängige Instanz des bewährten Lern-Engines mit eigenem Speicherkey `finanzpilot_concepts_v1` und verzögerten Wiederholungen. In `sync.js` wird das Konto-Backup um diesen Key ergänzt und mit `mergeConcepts()` korrekt pro beantworteter Aufgabe zusammengeführt, ohne bestehende richtige Lösungen zu verlieren. Keine virtuelle Währung/Extra-Items durch diese Kurse, nur evidenzbasierte Skills.
- Eigenständiges älteres `glossary.js` bleibt das Lexikon zum Nachschlagen. Neue Akademie ist als `concepts` unter „Lernen → Bereiche“ und als deutlich sichtbarer Startpunkt im Lernbereich zu finden. Das Training bestehender Unternehmenskursen bleibt unabhängig.

### Erweiterte Skillwelt und Zoom
- `skill-world.js` ersetzt **nur die Darstellung und Bindung** von `FinanzPilotSkills.render/bind`. Die bewährte Funktion `FinanzPilotSkills.levels()` (genau 13 Kernskills) wird als Vertrags-API unverändert beibehalten: bisherige Analystenkarriere, ihre Schwellen und die 7 Werkzeuge dürfen nicht plötzlich auf 53 Knoten umgerechnet werden.
- 53 sichtbare Skillknoten, 66 Abhängigkeitsverbindungen: 13 bisherige Kernskills, 30 zusätzliche Begriffs-Teilkompetenzen (10 Kurse × Entdecken/Anwenden/Meistern) und 10 vertiefende Expertenabzeichen. Status aus tatsächlichen gespeicherten Antworten und bestandenen Lernstufen abgeleitet – keine bloßen Klickbelohnungen. Neues `fullLevels()` gibt die gesamte Karte zurück.
- Mobile Bedienung: ein- und zweidimensionales Scrollen, Pinch-to-Zoom über Safari-Touchevents, Zoom +/−/Übersicht, Tastaturbefehle und Minimap mit klickbarer Zentrierung. Zoom/Position im Gerätekey `finanzpilot_skillmap_v2` lokal gespeichert; Cloud-Konto sichert weiterhin die Lernstände, nicht pixelgenaue UI-Ansichten.
- `learning-v16.css` ist responsive; bestehenden Fünf-Tab-Aufbau nicht wieder verwässern. Andere Haupttabs werden nur über ausdrücklich geklickte Lernbereich-Links geöffnet.

### Release und Kontrollen
- `index.html` lädt `skill-world.js`, `concepts.js` und `learning-v16.css`; `app.js` hat den neuen `concepts`-Renderpfad, `ux-v15.js` ordnet ihn korrekt dem Haupttab Lernen zu.
- `version.json` = 16, `updates.js` = 16, Webapp-Manifest Start-URL `?v=16`. Geänderte Asset-Dateien erhalten Cacheparameter.
- `scripts/test_learning_v16.mjs` und die bestehenden Testskripte sind in GitHub Actions unter `quality.yml` angebunden. Manuell überprüft: JS-Syntax, 10 valide Module, 30 richtige Musterantworten ohne falsche positive Antworten, 53 Knoten, 66 Kanten, 13 unveränderte Career-Core-Knoten und relevante Integrationspfade. GitHub Actions-Lauf und echter Pinch/Google-Login auf iPhone sind noch nicht vollständig unabhängig bestätigt.

### Weitere Ausbauschritte
- Branch-übergreifende Meisterprojekte, längere dokumentierte Research-Cases, zusätzliches Diagramm-Feedback und Nutzer-Review für Prüfungen.
- Später Belohnungsanimationen und Töne mit Ausschaltmöglichkeit, separate serverseitig gesicherte virtuelle Aktienorders und ein vollständiger Echtkurs-Datenlieferant.
- Über mehrere Lernstufen hinweg keine triviale Ja/Nein-Klickerei; anspruchsvolle praktische Anwendung, Originalzahlen bei echten Firmencases und Quellenangabe bleiben Pflicht.


## Version 21 – Investmentkomitee: Unternehmensbewertung selbst durchspielen

**Stand 31.10.2026 – in GitHub implementiert, lokale fachliche/JS-Prüfungen durchgeführt; echter iPhone-Browserlauf und GitHub Actions-Ergebnis gesondert zu prüfen.**

- Neuer Aktien-Unterbereich `investmentcommittee` mit Datum, Quellen und unabhängiger `investment-committee.js`-Lernoberfläche; `investment-committee.css` für das iPhone. Haupttab Aktien bleibt die Unterbereichsliste mit `researchcatalog`, `investmentcommittee`, `academy` – ohne neues Overlay oder cross-tab Navigation. Startseite beibehalten.
- `data/investment-committee.json`: Zwei Cases `kion-2026` (XETR:KGX, KION Q3/9M 2026 mit Original-Konzernzahlen) und `msft-fy2026` (NASDAQ:MSFT, Microsoft FY2026 Annual Report). Je acht Etappen: Firmen-/Quellenkontext, zwei Berechnungen, fachliche Zweifachauswahl, eigene Prozessentscheidung, editierbares Bear/Base/Bull-Modell mit Wahrscheinlichkeiten, Modellkritik und strukturierte eigene Investmentthese. Zahlen/Fristen sind historisch; Kurswerte niemals als Livekurse ausgeben.
- KION: Rechnet das bereits vorhandene vollständige 2027–2031 FCFF-DCF aus `data/kion_model.json` dynamisch neu; Basis-WACC und langfristiges Wachstum editierbar. Referenzszenarien circa 24,59 € / 58,20 € / 94,65 € (individuelle, risikobehaftete Analystenannahmen). Historischer Kursbezug nur der datierte 30.10.2026-Xetra-Preis von 33,27 €. Alle unbereinigten Leasing-Finanzierungsprobleme bleiben Risiko.
- Microsoft: Nur nachweislich echte FY2026-Zahlen, einschließlich Umsatz 331.839 Mio. USD, Betriebsergebnis 155.237 Mio. USD, GAAP-EPS 17,95 USD, adjustiertes Non-GAAP EPS 17,28 USD. Illustratives rückblickendes Multiple-Szenario (20/27/34×, 345,60/466,56/587,52 USD); ausdrücklich weder Forward-Kursziel noch echter aktueller Preis. Nutzer muss selbst Originaldaten und Kapitalbedarf bewerten.
- Eigene Wahrscheinlichkeitsschätzungen (Summe exakt 100), Base-WACC und g bzw. PE, Ergebnisband und eigenständige schriftliche These mit Gegenargument und Falsifikationskriterium. Der Lernstand und das Memo werden unter `finanzpilot_investment_committee_v1` gespeichert und über `sync.js` mit einer eigenen, nicht verlustbehafteten Session-Merge-Routine synchronisiert. KI-Bewertung ist **nicht** automatisiert: Der Nutzer muss seine Analyse bewusst via „Kopieren“ nach ChatGPT übertragen, und erst dort entsteht ein externes Urteil. Keine falschen „morgen ausgewertet“-Versprechen.
- GitHub CI: `scripts/test_investment_committee_v21.mjs` validiert die realen Zahlen aus den gespeicherten Quellen, sechs Bewertungsziele, Gewichtungen, Nachberechnungen, WACC-Grenzen, Antwortschlüssel und Integration. Start- und bereits bestandene Kurse, 53 Kern-/Vertiefungsskills und alte Fortschrittsschlüssel bleiben unverändert.
- Release v21 synchronisiert `version.json`, `updates.js`, `manifest.webmanifest`, relevante JS-Cache-Queries und Styles in `index.html`. Die täglichen Redaktionsupdates dürfen `investment-committee.js`, den neuen Persistenz-Schlüssel oder Quellen-/Zeitangaben nicht entfernen; zusätzliche aktuelle Firmenkurse nur mit geprüften Quellen, eindeutig abgesetzten Analystenannahmen und Regressionen ergänzen.



## Version 22 – Alphabet-Aktienresearch als mehrstufiges Meistertraining

- Neues 20-stufiges, quellengeprüftes Masterclass-Folgecurriculum `alphabet-q3-2026-research-masterclass` in `data/academy.json`; eigener Fortschrittsschlüssel unter der bestehenden Academy-Progress-Struktur. Voraussetzung ist der bisherige 10-stufige Kurs `alphabet-q3-2026-cashflow-valuation`; dessen ursprüngliche Stufen und Fortschrittsindizes unverändert.
- Inhalt: Geschäftsmodell, Services- und Cloud-Kennzahlen aus Alphabet SEC Exhibit 99.1 (28.10.2026), operative Gewinnqualität, negativ/positiv gezeichnete FCF-Quartale, TTM-FCF, Finanzierung, nachvollziehbare hypothetische P/FCF-Szenarien und persönliche Investmentthese. Alle Zukunftswerte werden ausdrücklich als **Lehrannahmen ohne Kursziel je Aktie** gekennzeichnet; nicht als aktuelle Kurse publizieren.
- `academy.js` sperrt direkte Links auf noch nicht freigeschaltete Kurse, lässt bei falschen Prüfungsantworten nicht mehr weiterklicken und speichert korrekte Antworten unmittelbar. `equity-masterclass-v22.css` zeigt negative Balken mit Nullachse links statt unsichtbar oder als null.
- Release-Konsistenz `version.json` v22, `updates.js` v22, `manifest.webmanifest` ?v=22, `academy.js?v=22` und `equity-masterclass-v22.css?v=22`. Neues CI-Skript `scripts/test_equity_masterclass_v22.mjs` in `.github/workflows/quality.yml`.
- Nächstes Entwicklungsthema nach echter Nutzererprobung: freie Schlussfolgerungen an die bestehende freiwillige ChatGPT-Bewertung anbinden, Modellannahmen stärker personalisierbar machen und geprüfte weitere Einzelaktien ergänzen. Keine angebliche automatische KI-Bewertung ohne vorhandenen überprüfbaren Workflow behaupten.


## Version 24 – privates Thesenjournal mit nachvollziehbarer Analysehistorie

- Neue eigene `theses`-Unterseite im **Aktien-Tab**, sichtbar in der `ux-v15.js`-Bereichsliste. `theses.js` und `theses-v23.css?v=24`, Route/Binder in `app.js`. Kein zusätzlicher Haupttab, Startseite unverändert.
- Strukturierte Angaben zu Unternehmen, Bewertungsmethode, Bear/Base/Bull, Eintrittswahrscheinlichkeiten, Originalquelle, Zahlenbelegen, These, Gegenargument, Widerlegungskriterium und Termin des nächsten Checks. **Formaler 0–10-Check ist keine KI- oder Faktenprüfung**: Quelle nur HTTPS-Syntax, Zahlenangaben nur strukturell geprüft, Modellrechnen nur mathematische Logik. Keine Kaufempfehlung.
- Eigener langfristiger Verlauf mit unveränderlichen Revisionen, Vergleich zur Vorversion, Mini-Verlauf je Unternehmen, lokal wiederhergestellten Entwürfen und JSON-Export. Supabase-RLS-Sync über `finanzpilot_theses_v1` und kollisionssicheres `mergeTheses` nach ID/updatedAt. Private Inhalte niemals in öffentlichen Repo oder GitHub-Issue publizieren.
- Freiwillige ChatGPT-Übergabe: App kopiert nur auf Knopfdruck einen ausführlichen Forschungs-Prompt; nach echter KI-Prüfung kann Nutzer dessen Resultat manuell in der App archivieren. **Keine automatisierte KI-Bewertung, kein Hintergrundabruf privater Texte.**
- Am Abschluss von KION/Microsoft Investmentkomitee sowie nach einem letzten freien Aktien-Intensivkurs-Reflexionsschritt wird auf Wunsch ein neuer Journal-Entwurf mit relevanten Angaben vorbefüllt. Die alten Kursfortschritte bleiben bestehen.
- v24 Release: `version.json` 24, `updates.js` 24, Manifest `?v=24`. `theses.js?v=24`, `theses-v23.css?v=24`, `academy.js?v=24`, übrige angefasste JS-Dateien weiterhin `?v=23`. GitHub-CI mit `scripts/test_theses_v23.mjs` und aktualisierten bestehenden Tests. Regressionen und iPhone-Verhalten noch unabhängig auszuführen.
