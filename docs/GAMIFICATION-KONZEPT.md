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
