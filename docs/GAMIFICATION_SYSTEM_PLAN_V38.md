# FinanzPilot – integriertes Karriere-, Skill- und Belohnungssystem
**Status: Entwurf zur Freigabe. Kein vorhandenes Karrieresystem wurde in v38 geändert.**

## 1. Leitidee: Kompetenz statt Klicks
Jede nachweisbare Handlung erzeugt genau ein fachliches Ereignis mit stabiler `event_id`, Datum, Modul/Schritt und Prüfstatus. Daraus leiten sich **vier getrennte Werte** ab:
- **Lern-XP und Level:** persönlicher Umfang und Lernkontinuität. Kein Ersatz für Kompetenzbeweis.
- **Skill-Meisterschaft:** fachliche Fähigkeit mit bewerteter Prüfung und konkretem Lerninhalt. Ausschließlich nachweisbar; nicht durch Punkte kaufbar.
- **Karriererang:** erreichte fachliche Breite und Tiefe, ergänzt durch praktische vollständige Fallstudien.
- **Forschungspunkte und Artefakte:** optionale Belohnungen und Werkzeuge. Bewährtes Inventar bleibt bestehen; virtuelle Depot-Euro bleiben eine separate Lernsimulation.

Grundsatz: **Kurse, Nachrichten und grundlegende Analysefunktionen bleiben kostenlos und auch bei niedrigen Levels nutzbar.** Freischaltungen betreffen zusätzliche Trainingsszenarien, Darstellung, Sammelobjekte und freiwillige Analysehilfen, nicht den Zugang zu wichtigen Informationen. Keine Paywall, keine an Aktienkursen orientierten Echtgeld-Anreize.

## 2. Konkrete Aktivitätsregeln (Vorschlag, vor Umsetzung abgleichen)
| Nachgewiesene Aktivität | XP | Forschungspunkte | Häufigkeit / Schutz |
|---|---:|---:|---|
| Lehrschritt fachlich abgeschlossen | 5 | 0 | einmal je Schritt |
| Begründete Rechenaufgabe richtig, mit Erklärung | 15 | 3 | erste geprüfte Lösung, Korrektur erhält Lernfeedback |
| Lernmodul mit Schwellenwert gemeistert | 40 | 10 | einmal je Modulversion |
| Transferfall vollständig und richtig begründet | 65 | 15 | einmal je Fall |
| Praxis-Unternehmensanalyse erfolgreich geprüft | 100 | 30 | einmal, serverseitig bestätigt |
| Freitextanalyse durch Redaktion fachlich bewertet | 20–60 | 5–15 | nach Rubric, erst bei geprüfter Rückmeldung |
| Fällige Wiederholung korrekt abgeschlossen | 5 | 0 | maximal 4 pro Tag |
| Täglicher Lernstreak | +0 XP | – | kosmetische Markierung; nie Druck oder unbegrenzter Bonus |

**Schutz:** Eine eindeutige Prüf-/Ereignis-ID wird serverseitig maximal einmal belohnt. Reine Seitenaufrufe, wiederholtes Klicken, ständiges Nachrichtenöffnen und Depottransaktionen erzeugen keinerlei XP. Keine Umtauschmöglichkeit von Echtgeld in Lern-XP oder Forschungspunkte. Begrenzungen können später angepasst werden; frühere Belohnungen werden nicht rückwirkend gelöscht.

## 3. Level-Skala und Meilensteine
Start-Level 1 bei 0 XP; Beispielkurve `XP_bis_Level(L)=50×(L−1)²+50×(L−1)`. Die Kurve muss bei echten bestehenden Datensätzen und Kursumfängen kalibriert werden.
- **Level 2:** erste Lernchronik / kleines Profilabzeichen
- **Level 5:** ein freiwilliges Zusatzszenario, neuer Rahmen für Avatar/Profil
- **Level 10:** eine besondere visuelle Belohnung + zusätzliche Forschungsmissionskarte
- **Level 15/20:** individuelle Urkunde und komplexere freiwillige Fallaufgaben
- Danach periodische Sammlerstücke statt immer höhere monetäre Belohnungen

Level-Bonus nicht mit Karriererang verwechseln: Level zeigt Lernzeit und Fortschritt, Rang zeigt tatsächlich bewiesene Kompetenz.

## 4. Skillbaum: sechs Inhaltszweige mit echten Zielkursen
Jeder Knoten erhält `id,title,description,prerequisites,course_id,step_id,proof_type,required_score`, nicht bloß ein Schlagwort. Beim Klick: **Verstehen → Anwenden → Nachweis**. Der Button *Passenden Lerninhalt öffnen* führt exakt zu dem zugehörigen Modul/Schritt, nicht nur allgemein zum Lernen-Tab.

| Zweig | Verstehen | Anwenden | Meisterprüfung |
|---|---|---|---|
| Finanzberichte | GuV + Bilanz | Gewinnqualität + Margen | echten Zahlenvergleich begründen |
| Cashflow & Kapital | Working Capital / FCF | Cashflows normalisieren | Investitions- und Liquiditätsszenario |
| Unternehmensbewertung | ROIC, Kapitalkosten | Multiples, Unternehmenswert | DCF + Sensitivität |
| Markt & Charts | Trend, Volatilität, Zeiträume | Indikatoren kritisch prüfen | Chartthese mit Gegenargumenten |
| Risiko & Portfolio | Diversifikation, Verlustrisiko | Konzentrations- und Szenariotests | Portfolio-Stresstest |
| Research & Urteil | Primärquellen, Newsbewertung | vollständige Case Study | Investmentkomitee mit Gegenhypothese |

Die derzeitigen 13 Kernskills und 53 Weltkarten-Knoten sind **zunächst nur Kompatibilitäts-/Migrationsbestand**. 16 Fachmodule und zusätzliche 5 Brückenstufen werden in eine neue `skill_content_map` überführt. Nicht jeder Knoten muss eine eigene neue Lektion bekommen; mehrere Fähigkeiten dürfen auf denselben Kurs mit unterschiedlichen nachprüfbaren Lernzielen verweisen. Bestehende Bestwerte, Abschlüsse und erworbene Rang-/Artefakt-Nachweise werden importiert.

## 5. Karriere: acht bestehende Ränge, jetzt mit echten Anforderungen
Bestehende Namen beibehalten: Kursfunke → Markt-Scout → Zahlenkundiger → Bilanzspäher → Renditeschmied → Risikoarchitekt → Szenarioarchitekt → Kapitalnavigator.
- **Beförderung:** erforderliche Breite (z. B. zwei unterschiedliche Skillzweige auf Meister-Level) plus bestandene Praxis-Herausforderung; nicht nur Anzahl angeklickter Skills.
- **Jede Beförderung:** persönliche Leistungsübersicht: nachgewiesene Skills, bestandener Fall, neu verfügbares Werkzeug, nächste konkrete Anforderung.
- **Werkzeuge:** Margen-Scanner, Auftragslabor, Sicherheitsmargen-Werkstatt, Portfolio-Stresstest, DCF-Szenarioarchiv, Peer-Bewertungsprüfung, Investment-Ausschuss. Alle nur als unterstützende Tools; nicht aus jeder Nutzung automatisch neue Punkte generieren.
- **Abzeichen:** dauerhaft, nach Nachweisen. Kein bereits erworbener Rang wird bei Migration herabgesetzt; bestehende Ränge erhalten ein Legacy-Nachweisflag, neue Kriterien gelten bei künftigen Beförderungen.

## 6. Forschungspunkte, Inventar und vorhandene Artefakte
Die drei vorhandenen Artefakte bleiben bestehen: **Industrie-Funke (KION)**, **Silizium-Linse (AIXTRON)**, **Cloud-Kompass (Alphabet)**. Vergabe nur nach verifizierter Praxisprüfung; bereits erteilte Boni niemals nochmals buchen.
- **Artefakt-Qualität:** ein Gegenstand besitzt Herkunft, Prüfungsnachweis, Rarität (gewöhnlich, selten, legendär), permanente oder einmalige Wirkung.
- **Verwendung:** bestehende Auswahl aus Analysetool/Spezial-Expedition/150 € virtuellem Depotkapital bleibt kompatibel; pro Artefakt nur die einmalige erlaubte Auswahl.
- **Forschungspunkte:** für weitere optionale Missions- oder Darstellungsgegenstände, keine Aushebelung der Leistungsnachweise, keine echten Aktienkäufe.
- **Ausrüstung und Sammlung:** sichtbar getrennt von verbrauchten Artefakten; ein konsumiertes Artefakt bleibt im Sammelalbum als *gefunden*, aber kann nicht erneut eingelöst werden.
- **Kombinationen:** optionale Forschungsmissions-Sets (z. B. mindestens ein Industrie-, ein Technologie- und ein Risiko-Nachweis) liefern ein kosmetisches Sammlerzeichen, nicht unverhältnismäßig viel virtuelles Geld.

## 7. Animationen und Nutzerführung
- **Microfeedback:** kleine Fortschrittsleiste und sanfte Antwortbestätigung; kein Vollbild bei jeder Frage.
- **Modulabschluss:** 1–2 Sekunden Abzeichen-Erscheinung und Zusammenfassung fachlicher Leistung.
- **Karrierebeförderung/legendäres Artefakt:** einmalige, hochwertigere Animation mit benannten neuen Möglichkeiten und nächstem Ziel.
- **Barrierefreiheit:** `prefers-reduced-motion`, stumm, kein schneller Blitz, auf iPhone flüssig; kann übersprungen werden.
- **Reproduzierbarkeit:** Animation aus signiertem, serverseitig protokolliertem Reward-Event, sodass App-Updates und Cloud-Synchronisierung weder Belohnungen doppelt zeigen noch verlieren.

## 8. Einheitliche technische Architektur (später, nicht umgesetzt)
- **Katalog/Versionierung:** stabile IDs für Lernmodule, Prüfungen, Skills, Werkzeugfreischaltungen, Artefakte, Karriereränge.
- **Verifizierte Event-Ledger-Tabelle:** append-only Ereignisse, `unique(user_id,event_id)`, RLS, separate serverseitige Verifikationsfunktion mit Sperre vor Mehrfachbelohnungen.
- **Materialized/abgeleitete Profile:** XP, Level, Skill-Nachweise, Rang, Inventar, Forschungswährung werden aus demselben Ledger gelesen; kein unterschiedlicher Stand zwischen Profil, Skillbaum und Inventar.
- **Migration:** bestehende lokalen und Cloud-Daten zunächst nur lesen/abgleichen, bestehende Tools und Awards erhalten; für fragliche Daten manuell gekennzeichneten Legacy-Status.
- **QA:** Tests für jeden Skill-Deep-Link und echten Kursinhalt, keine Doppelbelohnungen, Cloud-Resume, Tabellen-/RLS-Sicherheit, verlorene Netzwerkverbindung und iOS-Animationen.

## 9. Freigabe vor Implementierung
Offene Designentscheidungen: (1) Level rein motivierend oder zusätzliche echte Spezialmissionen? (2) Welche Abzeichen/Raritäten und wie selten? (3) Wie streng sollen Karriere- und Meisterprüfungen sein? (4) Soll das bestehende einmalige virtuelle Depot-Geld als Artefaktoption bleiben? Standardempfehlung: **ja, mit strikter einmaliger Buchung**, aber kein XP durch Handelsfrequenz.

**Umsetzung in eigener späterer Phase**: Erst Kompetenzmodell + Skill-Direktlinks, dann serverseitige Prämien- und Migrationslogik, dann Karrierestufen und Animationen, zuletzt Balancing. Während v38 nur Planung, keinerlei Änderung an bestehenden Belohnungstabellen, Skill-Code oder Karriererängen.
