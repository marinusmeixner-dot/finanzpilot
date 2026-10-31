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
