# FinanzPilot – Ein verbundenes Lern-, Karriere- und Belohnungssystem
**Planungsstand v39, 01.11.2026 — NICHT IMPLEMENTIERT.** Ersetzt den voneinander getrennten Ansatz des Entwurfs v38. Streak-Dialog, Belohnungen, Beförderungen, Skills und Animationslogik bleiben bis zur Freigabe technisch unverändert.

## 1. Eine einzige sichtbare Kette
**Nächstes Lernziel → Kurs → echte Kompetenzprüfung → Kompetenznachweis → Erfahrung / kleine Ressource → Skill-Meisterschaft → konkretes freigeschaltetes Werkzeug / Artefakt → Karrierebeförderung → neuer Lernauftrag.**

Level, Skills, Karriere und Inventar sind keine vier unabhängigen Mini-Spiele, sondern unterschiedliche Ausschnitte **desselben Lernfortschritts**. Für den Nutzer existiert ein **nächster sinnvoller Schritt**, dessen Konsequenz bereits direkt am Lernort sichtbar ist. Beispiel:

> „Etappe 2: Bilanz verstehen – noch 2 Lektionen. Danach kannst du die Bilanz-Prüfung machen. Bestehst du sie, erhältst du den Skill *Bilanz lesen* und schaltest den Margen-Scanner für die nächste Praxisübung frei. Für die Beförderung zum Bilanzspäher fehlt dir anschließend noch der Cashflow-Nachweis.“

Dieser Pfad wird automatisch aus den noch fehlenden fachlichen Nachweisen berechnet. Kein Scrollen durch vier Menüs oder manuelles Abgleichen von Bedingungen.

## 2. Ein gemeinsames Lernprofil
Kanonische Ereignisse nachweisbar und eindeutig: `lesson_completed`, `bridge_exam_passed`, `skill_mastered`, `case_passed`, `written_feedback_reviewed`, `streak_day_qualified`, `reward_granted`, `artifact_redeemed`, `promotion_granted`. Jede `event_id` pro Benutzer genau einmal. Neben der Ereignisart speichert der Server Modul-ID, Schwierigkeitsgrad, Ergebnis, Quellen-/Versionstand und Zeitpunkt. Browser-Events dürfen keine Belohnungen ohne serverseitig bestätigte Prüfung erschaffen. Die bestehende lokale/cloudgesicherte Historie wird vorerst nur importiert und nicht gelöscht.

**Alle Anzeigen verwenden genau diese gemeinsame Leistungsbasis.**
- Das **Level** zeigt über die Zeit gewachsene Lernpraxis; der nächste Level ist eine echte Etappe auf dem Weg.
- Der **Skill** zeigt, *was* fachlich beherrscht wird. Er ist die konkrete Voraussetzung für Werkzeuge und Beförderungen.
- Die **Karriere** zeigt fachliche Breite, schwierigere Fallprüfungen und Verantwortung (Szenarien und Urteile).
- **Artefakte, Forschungspunkte und Ausrüstung** bilden die sichtbare Anerkennung konkreter Nachweise; damit lassen sich zusätzliche Übungen oder visuelle Funktionen nutzen.

Der **Beförderungsknopf** zeigt nicht nur gesperrte Bedingungen. Er verlinkt direkt zur fehlenden Lektion/Prüfung. Umgekehrt steht direkt nach der bestandenen Lektion der dadurch freigeschaltete nächste Schritt.

## 3. Fester Weg: sechs Etappen und Skills aus echtem Inhalt
Der in v39 neu aufgebaute Lernweg ist die primäre Nutzeroberfläche. Jede Etappe hat sechs echte Lektionen inklusive einer Übergangsprüfung. Neue `journey-v39.json`-IDs werden künftig fachlichen Skill-Knoten zugeordnet. Die Skills **können nicht bloß durch das Lesen** von Begriffen gemeistert werden; es gibt jeweils eine **bestehbare Anwendung** mit der passenden Erklärung unmittelbar davor und danach.

1. **Orientieren:** Sparen, Geldanlage, Börse, Aktie, Fonds, Risiko → Fähigkeit „Anlageformen verstehen“.
2. **Verstehen:** Geschäftsmodell, Umsatz, Ergebnis, Bilanz, Cashflow → Fähigkeit „Zahlen lesen“.
3. **Verknüpfen:** Margen, Liquidität, Zinsen, erwarteter Wert, Bewertungskennzahlen → Fähigkeit „Werttreiber erklären“.
4. **Anwenden:** Wachstums-, Margen-, Cashflow- und Bewertungsrechnungen → Fähigkeit „Zahlen selbst prüfen“.
5. **Selbst analysieren:** Primärquellen, Zahlenvergleich, Werttreiber, Risiken, erster Bericht → Fähigkeit „Unternehmensrecherche“.
6. **Urteil bilden:** Preis versus Wert, Erwartungen, Gegenhypothesen, Szenarien, Positionsrisiko → Fähigkeit „Investmentthese kritisch verteidigen“.

Für echte Meistergrade folgen die bereits vorhandenen langen Praxisfälle mit prüfbaren Quellen. Der Skill-Button **„Passenden Lerninhalt“** erhält im späteren technischen Schritt einen stabilen Deep Link `view=journeycourse&id=...` oder eine zugehörige Advanced-Course-ID mit Lernposition. Derzeitige unscharfe Verweise auf „Lernen“/„Akademie“ werden bei Implementierung ersetzt, nicht jetzt.

## 4. Belohnungspfad: unmittelbar sichtbares Warum
Pro erfolgreich abgeschlossenem, erstmals geprüftem Lernmodul: **fachliches Fortschrittszeichen** und begrenzte XP; nach Übergangsprüfung ein passender Skill-Nachweis; bei Meilensteinen ein eigener Karrierefortschritt; nach einer schweren Fallprüfung optional Artefakt oder eine Spezialmission. **Eine Aktion löst niemals mehrere versteckte, unzusammenhängende Belohnungsströme aus.** Folgeeffekte (z. B. Skill → Rang → Werkzeug) werden als ein gemeinsamer Abschlussmoment präsentiert, mit der einen echten Ursache deutlich sichtbar.

Als Beispiel (vorläufige Beträge, keine Auszahlungen):
- Normale Lektion: 10 XP (nur bei erstem bestandenen Abschluss).
- Etappenprüfung: 25 XP und sichtbarer Kompetenznachweis, sofern die Prüfungsbedingungen erfüllt sind.
- Vollständiger anspruchsvoller Praxisfall: 35 XP und maximal 1 nach Art passender Artefakt-Nachweis.
- Bewertete Freitextanalyse: XP erst nach tatsächlich hinterlegtem Feedback; kein XP für bloßes Abschicken.
- Einfaches Artikel-Lesen oder Depothandeln: **kein XP**, um Klicken und riskantes Verhalten nicht zu belohnen.

Die XP-/Belohnungsbeträge werden an tatsächlichem Aufwand kalibriert und mit älteren Besitzständen abgeglichen. Basisinhalte bleiben zugänglich, auch wenn eine Belohnung fehlt.

## 5. Streak: genau derselbe Fortschritt, kleine Tagesbelohnungen
Der rechts oben bereits vorhandene Streak-Zähler `#top-streak` wird in einer späteren Version ein **anklickbarer Button**. Darauf öffnet sich ein kleines, auf dem iPhone gut bedienbares Fenster:
- Aktuelle Serie und die sieben Tage einer kompakten Wochenansicht; erreichte Tage sind markiert.
- **„Heute erledigt?“** Nur ein **qualifizierender Lernnachweis** zählt: z. B. eine vollständig beantwortete Mini-Lektion, eine fällige Wiederholung oder eine tatsächlich geprüfte Praxisaufgabe. Lesen, App-Öffnen, mehrfaches Klicken, bloße Watchlist-Änderung oder aktienbezogenes Handeln zählen nicht.
- **„Heute bereits erhalten“** / **„Nächste kleine Belohnung“** direkt sichtbar. Serienstände über Zeitzonen konsistent anhand Europe/Berlin berechnen.
- Die tägliche Mini-Belohnung erfolgt **nachweisbar aus demselben Ledger**, nicht über eine zweite Streak-Währung.

**Vorschlag für kleine, bewusst begrenzte Belohnungen:**

| Nachweis | Belohnung (einmal) | Einordnung |
|---|---|---|
| Ein qualifizierter Lerntag | +2 Forschungspunkte | Kleine Anerkennung; kein Extra-XP |
| 3 Tage in Folge | +5 Forschungspunkte | Nur einmal pro jeweiliger laufender Serie |
| 7 Tage in Folge | +10 Forschungspunkte + gewöhnliches Profilabzeichen | Kleine Wochenanerkennung, kein legendäres Artefakt |
| 14/30 Tage | kosmetische Fortschrittsmarkierung | Ohne Geld-/XP-Vorteile |

Es gibt **keine permanente Rendite**, keinen Handelsbonus, keine Werbe- oder Echtgeldkopplung und keine exponentiellen Serienboni. Ein verpasster Tag soll kein aufgebautes Fachwissen oder erreichten Karriererang löschen. Bei Bedarf einmalige Kulanz/Toleranz als spätere Designfrage, nicht standardmäßig eingebaut. Der Streak ist **Motivation, kein zweites Karrierelevel**.

## 6. Karriere, Artefakte, Skillbaum und Animationen zusammen
Die acht bereits vorhandenen Rangnamen, bestehende Artefakte, Forschungspunkte und Werkzeuge werden in einen einzigen Fortschrittskatalog aufgenommen. Jeder Rang hat *eine konkrete nächste Hürde* mit direktem Lernlink. Ein Artefakt zeigt „Für diesen bestandenen Fall erhalten; ermöglicht diese Spezialaufgabe“. Inventar trennt **gesammelt**, **verfügbar** und **verwendet**. Bereits verbrauchte Gegenstände bleiben historisch nachvollziehbar, aber nicht erneut einlösbar.

**Eine konsequente Animationshierarchie statt ständiger Pop-ups:**
- Korrekte Antwort: subtiler kurzer Fortschrittsimpuls.
- Lektion abgeschlossen: kleine Bestätigung inkl. „jetzt weiter mit…“.
- Etappenprüfung/Skill gemeistert: sichtbarer Skill-Knoten leuchtet auf, ein einziger gemeinsamer Freischaltmoment.
- Karrierebeförderung/seltenes Artefakt: kurze einmalige Bühne mit benannter Ursache, Ergebnis und nächster erreichbarer Herausforderung.

Alle Animationen überspringbar, ohne Tonzwang, sicher bei reduzierter Bewegung, nicht doppelt nach Cloud-Synchronisation. Ein Abschluss mit gleichzeitigem Skill + Level + Beförderung wird **zusammengefasst**, nicht als drei nacheinander störende Modals gezeigt.

## 7. Oberfläche: Wie man ohne Erklärung versteht, was zu tun ist
Auf „Lernen“ nur: **1. Wo stehe ich? 2. Was lerne ich als Nächstes? 3. Wohin führt das?**. Ein sichtbarer Start-/Fortsetzen-Button, sechs Etappen und eine kleine Fortschrittszeile. Zusätzliche Werkzeuge in einem zugeklappten Bereich, nicht auf Augenhöhe mit den Grundlagen.

Beim Klick auf einen Skill: konkrete Anforderung und ein **einziger** passender Lerninhalt. Im Profil: aktueller Rang, drei wirklich relevante noch fehlende Nachweise, ein nächster erreichbarer Vorteil. Im Inventar: Verwendungszweck des gerade vorhandenen Artefakts. Im Streak-Fenster: heutige Aktion und kleine Anerkennung. Dieselben Ziele und Daten müssen auf allen Oberflächen übereinstimmen.

## 8. Abnahmebedingungen (vor späterer Umsetzung)
- Einheitlicher kanonischer Fortschrittsstand, kein separater Streak-/Karriere-Punktestand.
- Keine doppelten Belohnungen nach Neuladen, Wiederholung, konkurrierenden Geräten oder fehlerhafter Synchronisierung.
- Jeder Skill verlinkt exakt auf ein inhaltlich passendes Modul/Schritt; Regressionstests klicken die realen Ziele.
- Alte Kurse, erreichte Ränge und Artefakte dürfen weder verschwinden noch mehrfach vergütet werden.
- Die sechs Etappen aus v39 behalten einen echten Anfängerstart und individuelle Seiten.
- Streak zählt nur echte Lernaktivitäten; die geplanten Kleinstbelohnungen werden einmalig vergeben.
- Positiv und kritisch prüfbare Bestehensbedingungen, keine Punkte für bloße Textlänge.
- Alles läuft ohne zusätzliche kostenpflichtige KI-API.

**Freigabestatus:** Dies ist ein konkreter, konsistenter Umsetzungsplan. Kein Streak-Popup, keine Forschungspunkteänderung, keine Levelneuberechnung, keine Karriere-/Skillbaum-Neuverknüpfung und keine Animation wurden auf Basis dieses Entwurfs tatsächlich eingebaut.
