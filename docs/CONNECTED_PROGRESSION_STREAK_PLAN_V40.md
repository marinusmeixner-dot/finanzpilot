# FinanzPilot v40 — Das eine gemeinsame Lern-, Skill-, Karriere- und Belohnungssystem
**Stand: 01.11.2026.** Das Eurodepot, der Bruchteilhandel, die Streak-Tagesbelohnungen und die sequenziellen 36 Grundkurs-Lektionen sind tatsächlich implementiert. Der unten stehende **Ausbau von Skillbaum, XP, Karriere, Artefakten und weiteren Animationen ist ein Konzept**, noch keine ausgezahlte oder freigeschaltete Funktion.

## 1. Der Kern: nur ein Fortschrittssystem

Jede Handlung hat einen fachlichen Zweck und genau einen nachprüfbaren Beleg:
**Nächste freigeschaltete Lektion → verstehen → selbst anwenden → nachgewiesene Kompetenz → ein klarer Skill → ggf. Werkzeug/Artefakt/XP → sichtbarer Karriereschritt → nächste Herausforderung.**

Streakbesuche bilden den **einzigen bewusst separaten Motivationseinstieg**, aber **keine Ersatz-Kompetenz**. Sie vergeben kleine Forschungspunkte und Euro-Spielgeld aus derselben nachprüfbaren Guthabenverwaltung. Gekaufte Funktionen dürfen keine Kompetenz vortäuschen. Echte Finanzen, Börsenhandel und Auszahlung sind ausgeschlossen.

Jeder Bildschirm beantwortet unmittelbar: **Was kann ich schon? Was ist als Nächstes dran? Was erhalte ich bei erfolgreichem Bestehen?** Kein verstecktes „du brauchst noch die drei Tokens X, Y, Z“, kein bloßes Klicken durch Fachbegriffe.

## 2. Was bereits wirklich vorhanden ist
- 36 anfängergerechte Lehrmodule in sechs separaten Etappen. Eine Lektion wird erst nach dem Abschluss der vorherigen freigegeben; man kann gesperrte Etappen zur Orientierung ansehen.
- Die erste Etappe hat nun vertiefte Erklärungen und zusätzliche **freiwillige Denkaufgaben** mit aufklappbaren Lösungen. Die anderen Etappen erhalten diese Art Vertiefung schrittweise.
- Ein einziges Startbudget von **1.000 €** statt je 50.000 EUR und USD. Bestehende virtuelle Trades bleiben erhalten, ehemalige Währungsbestände werden gemäß dokumentierter EZB-Referenzrate übernommen.
- Kauf/Verkauf auch als Eurobetrag und in Bruchteilen bis 0,000001 Aktie, soweit Kurswert und Mindestbetrag sinnvoll. Server kontrolliert Gesamtsumme, Restguthaben, Kursalter und Besitz. Bei ausländischen Währungen erfolgt die Umrechnung mit datiertem ECB-Kurs.
- Bei angemeldeten Nutzern zählt der App-Besuch einmal pro Berliner Kalendertag. Jeder neue Tag schreibt **+10 € virtuelles Eurodepot und +1 Forschungspunkt** gut; an Tag 10, 20, 30 gibt es zusätzlich deutlich sichtbare Meilensteinprämien. Die Anzeige ist auf 30 gedeckelt, nach einem Ausfall beginnt sie bei 1. Bereits verdiente Guthaben/Artefakte bleiben erhalten. Ohne Anmeldung ist die Prämienauszahlung nicht möglich; kein Geld nachträglich für nicht prüfbare Gastbesuche.
- Die vorhandenen Karriere-, Forschungsartefakt- und Tool-Belohnungen werden nicht einfach in ein neues isoliertes System kopiert oder zurückgesetzt.

## 3. Echte skillbasierte Freischaltungen, direkt an den sechs Etappen

| Etappe | Lernkern und Nachweis | Skill nach Abschluss / späterer Meisterprüfung | Konkreter nächster Vorteil |
|---|---|---|---|
| 1 Orientieren | Geldziele, Sparen, Börse, Anlageformen; Prüfung „erste Entscheidung“ | Finanzkompass | Stufe 2 und erstes freiwilliges „Depot ohne Risiko“-Szenario |
| 2 Verstehen | Geschäftsmodell, Umsatz, Gewinn, Bilanz, Cashflow; Firmenfall | Zahlenleser | Stufe 3, GuV-Lupe als Übungswerkzeug |
| 3 Verknüpfen | Margen, Liquidität, Zinsen, Preis/Wert; verknüpfte Bewertungskette | Werttreiber-Versteher | Stufe 4, einfaches Kennzahlenvergleichstool |
| 4 Anwenden | Prozent, Marge, FCF, Multiple, Szenario; geprüfte Rechnungen | Modell-Praktiker | Stufe 5, Szenario-Sandbox |
| 5 Selbst analysieren | Originalquellen, eigene Nachrechnung, Risiken, erste Firmenanalyse | Research-Scout | Stufe 6, Quellenprüf- und Analyse-Checkliste |
| 6 Urteil bilden | Erwartungen, Gegenhypothesen, Portfolio-Risiko, dokumentierte These | Kritischer Analyst | Portfolio-Risiko-Werkstatt und erste Analysten-Karriereprüfung |

**Wichtig:** Ein Skill mit Meistergrad erfordert später nicht nur die bestehende zwei-Fragen-Lektion, sondern eine schwierigere frei formulierbare oder rechnerische **Transferprüfung**. Bis dahin kann ein Kursabschluss nur einen Grundlagen-Nachweis, keinen Expertenrang liefern. Bestehende alte Skill-Erfolge bleiben als historische Nachweise erhalten.

Jeder zukünftige Skill-Knoten enthält feste `lesson_id`, `assessment_id`, `required_score`, `proof`, `prerequisite` und `unlocks`. Der Klick auf „Jetzt lernen“ führt direkt zum benötigten Stoff und gegebenenfalls zur richtigen *Seite*, nicht bloß zum Lernen-Tab.

## 4. So wird aus 36 Einstiegskursen ein tiefer Lernweg

1. **Orientieren zuerst:** sechs Kurse, jetzt mit ausführlicheren Zusatzabschnitten und praktischen Denkfragen. Weitere Erweiterung: 5-Minuten-Mission für ein echtes Budget, Börsenspiel ohne Einsatz, ETF-Bestandteile untersuchen.
2. **Verstehen danach:** mit einer durchgehenden fiktiven Firma, deren Umsatz, Kosten, Bilanz und Geldfluss Schritt für Schritt gezeigt werden. Ergebnisse müssen sich zwischen den Kursen wiederfinden. Zwischentest mit echtem Zahlenvergleich, nicht nur Definitionen.
3. **Verknüpfen:** dieselbe Firma wird bewertet; jede neue Entscheidung verändert die Modellannahmen. „Wachstum hilft nur, wenn Kapitalbedarf und Risiko passen.“
4. **Anwenden:** interaktive Rechenfelder, vollständig begründete Lösungswege, Fehlerdiagnose und variierende Szenarien statt austauschbarer Multiple-Choice-Fragen.
5. **Selbst analysieren:** Originalberichte frei lesbarer börsennotierter Unternehmen, strukturiertes Quellenprotokoll, alle Änderungen der eigenen These nachvollziehbar.
6. **Urteil bilden:** mehrere Bewertungen, Risiken und eine Gegenhypothese. Redaktionsfeedback der angemeldeten Nutzer kann nach Einwilligung die Auswertung vertiefen, ohne eine bezahlte externe KI-API.

**Je Etappe drei Ebenen**: Grundlagen (Pflicht), Transfer (Pflicht für den echten Skill-Nachweis), Vertiefung/Spezialprojekt (optional, verknüpft mit Karriere/Artefakten). So entsteht für Fortgeschrittene genug Inhalt, ohne Anfänger mit zu vielen Fachbegriffen zu überladen.

## 5. XP, Level und freischaltbare Werkzeuge – Vorschlag zur späteren Umsetzung

Das Level soll ein motivierender *sichtbarer Überblick*, aber **kein käuflicher Ersatz für Fachwissen** sein.

- Nach erstmaligem Lernabschluss: vorläufig +15 XP.
- Nach erster bestandener Transferprüfung: +30 XP.
- Nach nachgewiesener Firmen-Fallstudie: +60 XP; nur wenn fachlich geprüft.
- Nach späterer freiwilliger Expertenprüfung: +100 XP, zusätzlich relevanter Skill-Meistergrad.
- Für bloßes Wiederholen richtiger Antworten, das Öffnen von Artikeln, das Kaufen/Verkaufen im Depot oder Streakbesuche **kein XP**.

**Vorgeschlagene Level-Meilensteine**: Level 2 – eigenes Lernprofil; Level 5 – erste optionale Fallmission; Level 10 – zweites Forschungswerkzeug; Level 15 – Auswahl anspruchsvoller Firmenfälle; Level 20 – erweiterter Analyse-Arbeitsplatz. Die genaue XP-Kurve wird erst nach einer Simulation über alle echten Lektionen festgelegt, damit ein Level nicht durch stupides Wiederholen entsteht.

**Forschungspunkte** stammen aus bescheidenen Streak-Belohnungen und später aus überprüften Forschungsaufgaben. Damit lassen sich zusätzliche *Anwendungsmöglichkeiten* bezahlen: z. B. ein freiwilliger Fall, eine Auswertungsdarstellung oder ein Forschungswerkzeug. Ein Tool bleibt aber bis zum fachlichen Skillnachweis gesperrt, selbst wenn genügend Punkte vorhanden sind. Alle Grundkurse und notwendigen Erklärungen bleiben gratis und zugänglich.

## 6. Streak-Kalender – bereits in v40 umgesetzt

Die Streak bedeutet **konsekutive Tage mit einem registrierten App-Besuch**, nicht beantwortete Lektionen. Eine Anmeldung erlaubt sichere einmalige Buchung; Tageswechsel ist immer Europe/Berlin.

| Besuchstag | Depotgeld | Forschungspunkte | Bedeutung |
|---:|---:|---:|---|
| 1–9 | jeden Tag +10 € | jeden Tag +1 | Kleine, verlässliche Anerkennung |
| **10** | **+110 € gesamt** | **+16 gesamt** | Tagesprämie + 100 € und 15 Forschungspunkte als großer Meilenstein |
| 11–19 | jeden Tag +10 € | jeden Tag +1 | Klein bleiben, kein künstlicher Glücksspielreiz |
| **20** | **+135 € gesamt** | **+21 gesamt** | Tagesprämie + 125 € und 20 Forschungspunkte |
| 21–29 | jeden Tag +10 € | jeden Tag +1 | Fortschritt bis maximal 30 |
| **30** | **+160 € gesamt** | **+31 gesamt** | Tagesprämie + 150 € und 30 Forschungspunkte |
| Ab Tag 31 | je weiterem Besuchstag +10 € | je weiterem Besuchstag +1 | Anzeige bleibt 30/30; kein erneuter 10/20/30-Meilenstein derselben Serie |

Damit entstehen in 30 ununterbrochenen Besuchstagen **insgesamt 675 € virtuelles Depotgeld und 95 Forschungspunkte**. Das ist bewusst keine Anlageperformance: Depotgewinn und geschenkte virtuelle Gutschriften müssen getrennt gezeigt werden. Die tägliche Buchung ist idempotent über `(user_id,checkin_date)`, die höhere Auszahlung pro Meilenstein erfolgt einmalig beim erstmaligen Erreichen, nicht bei jedem weiteren Tag im Maximum.

Das Streak-Fenster zeigt: 30-Tage-Obergrenze, 7-Tage-Kalender, heutige bereits gutgeschriebene Belohnung, nächste große Stufe und deren konkrete Werte. Die sichtbare Streak wird durch Besuchstage und nicht durch Lernprüfungen bestimmt. **Mehrere Besuche am selben Tag zahlen nichts zusätzlich aus.** Eine Unterbrechung startet die Folge bei Tag 1, bereits verdientes Guthaben bleibt.

## 7. Karriere, Artefakte und Animationen – ein sichtbarer Erfolgsmoment

Die bestehenden acht Analystenränge und die drei Forschungsartefakte bleiben bestehen; die spätere Integration darf nichts doppelt ausgeben. Das Gesamtsystem zeigt beispielsweise:

> **„Du hast 'Gewinn, Bilanz und Cashflow' bestanden.** Dein Grundlagen-Skill *Zahlenleser* ist aktiviert. Du kannst jetzt Stufe 3 starten. Für deine nächste Beförderung fehlen noch *Cashflow-Transferfall* und *Bewertungsgrundlagen*. Öffne den dazugehörigen Kurs.“

Für die Karriere zählt nachweisbare **Breite + Tiefe** (zwei Skillzweige und ein praktischer Fall), nicht die bloße Menge gesammelter XP. Artefakte kommen aus anspruchsvollen, einmalig geprüften Fällen, nicht aus passiven App-Besuchen. Forschungspunkte finanzieren auf Wunsch *Zusatzerfahrungen*, nicht einen künstlichen Rang.

Animationen: korrekte Antwort = dezentes Feedback; bestandener Transfer = eine kompakte Kompetenzkarte; Beförderung = eine einmalige Animation mit konkreter Erklärung, freigeschaltetem Vorteil und nächster Aufgabe. Jeder Event ist eindeutig, alle Animationen überspringbar und bei `prefers-reduced-motion` zurückhaltend.

## 8. Umsetzung in kontrollierten Ausbaustufen

1. **v40 (jetzt):** 1.000 € Startgeld, Bruchstücke, gemeinsame EUR-Währung, Streak-Kalender mit tatsächlichen Gutschriften, feste Lernreihenfolge, mehr Tiefe in allen sechs Einsteigerlektionen.
2. **Nächster Schritt:** Stufe 2 und 3 als eine zusammenhängende Unternehmensgeschichte vertiefen, neue Transferprüfungen inklusive Beispielrechnungen; Skills genau darauf abbilden.
3. **Danach:** gemeinsames serverseitiges Ereignisjournal für Lern-XP, Skillnachweise, Karriere und neue Sammelobjekte; alte Erfolge unverändert migrieren.
4. **Danach:** echten Skillbaum mit Deep Links, sichtbare Beförderungsanforderungen und sinnvolle Werkzeuge, zusätzliche vertiefte Aktienfälle.
5. **Zum Schluss:** zusammenhängende Abschlussanimationen, konfigurierbarer Umfang, Accessibility und Balancing unter realistischen Lernzeiten.

Jede Phase braucht funktionale Tests: unerlaubte Direktsprünge in gesperrte Lektionen, Verlust alter Cloud-Daten, Streak-Doppelbuchung, FX-Veralterung, Bruchstückverkauf ohne Bestand, verifizierte Lehrkompetenzen, Migration von Artefakten und alle Tool-Deep-Links.

**Was bis jetzt ausdrücklich noch NICHT als neu implementiert gilt**: zusätzliche XP pro neuer Lektion, neue Skill-Meistergrade, Karriere-/Artefakt-Freischaltungen aus v39-Lektionen und die neuen Karriereanimationen. Der vorhandene Forschungs-Shop und das Inventar bleiben bestehen und zeigen die neuen Streak-Forschungspunkte, sobald sie serverseitig gutgeschrieben werden.
