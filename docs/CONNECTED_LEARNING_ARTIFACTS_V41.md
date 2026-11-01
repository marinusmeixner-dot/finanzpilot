# FinanzPilot v41 – zusammenhängende Lernwelt, Skillbaum, Karriere und einzigartige Artefakte

**Stand 01.11.2026.** Diese Datei unterscheidet strikt zwischen tatsächlich gebauten Funktionen und dem nächsten Ausbau. Kein Feature als live bezeichnen, bevor seine Datenbankoperation und sein Browserfluss geprüft sind.

## 1. Vier klare Bereiche unter Lernen

1. **Grundlagen:** Sechs bisherige Etappen und 36 kostenlose, nacheinander freigegebene Lektionen. Sie vermitteln zügig ein echtes Grundverständnis von Geld, Unternehmen, Zahlen und Bewertungen. Die bestehenden Cloudstände bleiben unverändert; kein künstlich langer Pflichtpfad vor den ersten Spezialisierungen. Abschluss der Grundlagen motiviert, ersetzt aber keine Expertenprüfung.
2. **Skillbaum:** Fachrichtungen mit aufeinander aufbauenden Skillknoten. Ein Knoten beschreibt nachprüfbare Fähigkeiten und seinen Vorgänger, nicht bloß einen Finanzbegriff. Die erste Ausbaustufe enthält zwölf fachliche Skills in vier Richtungen mit jeweils drei aufeinander aufbauenden Knoten und großem Kompetenzziel: Finanzberichte/Bilanzanalyse, Unternehmenswert/DCF, Risiko/Portfolio sowie Research/Investmentthese.
3. **Skill-Lektionen:** Jeder Knoten besitzt zunächst drei eigenständige, fachlich aufeinander folgende Speziallektionen, individualisierte XP nach Schwierigkeit und eine servergeprüfte Verständnisfrage. Skillwahl kostet 3 Forschungspunkte (nur mit gemeistertem Vorgänger), Lektion kostet 1 Forschungspunkt oder 10 € **virtuelles** Depotgeld. Nach Abschluss der drei Lektionen erhält der Nutzer den Skill und dessen Forschungspunktbelohnung. Eine falsche Antwort ist kein Abschluss. Der Kauf einer Lektion gibt kein XP. Bestehende Grundkurse bleiben kostenlos.
4. **Speziallektionen:** Kein neuer Skill für jeden Sonderfall. Ein Fall verbindet mehrere Fähigkeiten in einer außergewöhnlichen vierphasigen Forschungsaufgabe. Freischaltung nur bei passender Beförderung oder dem richtigen Artefakt-/Sonderpfad. Beispiele: Liquiditätskrise eines Anlagenbauers, kapitalintensiver Cloud-Ausbau, Risikoentscheidung im Investmentausschuss. Die erste Fassung ist vollständig lesbar. Eine **bewertete freie Bearbeitung samt Spezialbelohnung** muss noch serverseitig umgesetzt werden.

**Aktueller technischer Stand:** Neue Spezialisierungstabelle, Käufe, XP und abgeschlossene Skill-Prüfung sowie Beförderungen nach jeweils fünf neuen Skills sind serverseitig implementiert. Profil enthält keinen separaten Skillbaum-Link mehr. Die alten Karriere- und Artefakt-Nachweise bleiben unberührt, bis eine verifizierte Migration existiert.

## 2. Einheitlicher Wirkungskreis

Grundwissen → Forschungspunkte über App-Besuch und Missionen → passenden Skill auswählen → spezifische Lektionen freischalten → mit Wissen die Prüfung bestehen → variable XP + Skill + FP → mehr Level / alle fünf Skills eine Beförderung → Werkzeuge/Artefakte/Exklusivfälle → neuer inhaltlich sinnvoller Lernweg.

Ein Knopf zu einem Skill führt genau zu seinen Lektionen und deren Kauf-/Abschlussstatus. Kein zweites Profil-Skillmenü. Fachliche Freiheit: Die vier Wurzel-Skills können unabhängig gewählt werden; tiefere Spezialgebiete benötigen den erlernten Vorgänger.

Individuelle XP sind pro Lektion im redaktionell geprüften Katalog hinterlegt und entsprechen dem geschätzten fachlichen Aufwand. Sie werden nicht durch eine einzelne pauschale globale Punktzahl vergeben. Serverseitig können sie nur **einmal** pro abgeschlossener Lektion entstehen. Das vorhandene ältere Lern-XP-System bleibt bis zur sicheren Zusammenführung getrennt; die neue Oberfläche bezeichnet die Werte ausdrücklich als *Spezialisierungs-XP*, statt beide Summen doppelt zu addieren.

Eine Beförderung entsteht bei 5, 10, 15, 20, 25, 30 und 35 verifizierten neuen Skills. Der erste verifizierte Ausbau vergibt beispielsweise 150 € virtuelles Depotgeld und 15 Forschungspunkte; jede weitere Beförderung eine etwas höhere einmalige Anerkennung. Ab Erreichen einer Beförderung verbessern sich die unabhängigen täglichen App-Besuchs-Streak-Prämien serverseitig um +2 € und +1 Forschungspunkt pro Rang (maximal sieben Ränge), **zusätzlich** zu den normalen 10 € und 1 Forschungspunkt. Für einen schon früher bezahlten Tag wird kein nachträglicher Bonus ausgegeben. Die 10-/20-/30-Tage-Meilensteine bleiben getrennt.

## 3. Ausbau, sodass tatsächlich immer neue Inhalte entstehen

Jeder Skill braucht fachlichen Inhalt. Die zwölf Startskills bilden vier sinnvolle Lernketten mit insgesamt 36 neuen Speziallektionen. Ziel sind mindestens 35 große Skills plus optionale Projekte, verteilt über weitere Finanzgebiete. Die Redaktion soll regelmäßig neue, sorgfältig recherchierte Inhalte schaffen, statt dutzende leerer Knoten zu zeichnen.

**Wichtige Versionsregel:** Ein bereits erlernter Skill darf durch später angehängte Lektionen **nicht wieder unvollständig** werden. Neue Vertiefungen deshalb als neue Skills mit neuen stabilen IDs oder als unabhängige Sonderprojekte hinzufügen; niemals nachträglich die Zahl der Pflichtlektionen eines bereits aktiven Skills erhöhen. Begonnenes, schon bezahltes oder abgeschlossenes Material bleibt unverändert. Zusammen mit dem JSON-Katalog muss die serverseitige Unterrichts-/Antwortbank atomar ergänzt werden. Erst nach fachlicher Quellenkontrolle, gültigen Fragen, XP-Kalibrierung und Tests veröffentlichen. Kein einmaliges Tagesupdate darf alte Beförderungen oder Forschungspunktguthaben zurücksetzen.

Künftige Lernformate über einfache Multiple Choice hinaus: Rechenfelder mit Einheiten und abgestufter Fehlerdiagnose, freiwillige Reflexionen mit qualitativer Bewertung, abrufbare aktuelle Primärquellen und mehrphasige Fallstudien. Größere Skill-Meisterstücke sollen nicht allein durch das Erraten einer Antwort entstehen. Diese erweiterten Assessments sind zusätzliche Ausbauarbeit, keine schon fertige Funktion.

## 4. Artefakte – verbindlicher künftiger Entwurf (NOCH NICHT IMPLEMENTIERT)

**Einmaligkeit und knapper Platz:** Pro angemeldetem Nutzer maximal **vier aktive, ungetauschte Artefakte**. Bereits verbrauchte Artefakte bleiben dauerhaft im Sammelalbum mit dem Status „eingelöst“, blockieren aber keinen aktiven Platz. Die drei bisherigen Artefakte müssen bei der Migration mitsamt echten alten Einlöseentscheidungen erhalten bleiben und zählen, soweit noch aktiv, gegen die Vierergrenze. Wenn die Sammlung voll ist, muss vor dem nächsten Fund bewusst ein Gegenstand eingetauscht werden; zeitlich begrenzte neue Funde können sonst verfallen. Ein Verfall darf einen bereits sicher erworbenen Gegenstand nicht rückwirkend löschen.

**Zufälliger Nutzen wird EINMAL serverseitig ausgelost**, wenn ein neues Artefakt tatsächlich durch eine bestandene Mission entsteht. Die Qualität/Variante wird dauerhaft gespeichert, nachweisbar vom Nutzer und der Client-UI nicht auswählbar. Neue Artefakte sind nicht automatisch stärker. Beispielvarianten:
- **Analysten-Linse:** +5 % zusätzliche neue XP bei bestimmten zukünftigen geprüften Speziallektionen (nur während Besitz, keine rückwirkende Berechnung).
- **Forschungs-Kristall:** +5 % Forschungspunkte bei passenden neuen Forschungsmissionen (keine Streak-Exploits).
- **Rechenkompass:** ein zusätzliches Hilfsmittel bzw. ein begrenzter Hinweis pro anspruchsvoller Mission.
- **Risikostein:** zusätzlicher stresstestbasierter Auswertungsschritt in der Depot-Simulation.
- **Themenartefakte:** eine seltene, inhaltlich passende Exklusivmission freischalten.

**Stapelgrenze:** Mehrfach vorhandene XP-/FP-Prozentvorteile dürfen höchstens +10 % auf denselben nachgewiesenen Unterrichtserfolg wirken; keine endlosen Zinseszins-/Streak-Boni. Wirksamkeit ist nicht die Rarität: Nischenartefakte können besonders einzigartige Werkzeuge freischalten, ohne numerisch die stärksten zu sein.

**Eintauschen:** Jedes aktive Artefakt darf exakt einmal gegen eine der konkret angebotenen Alternativen eingetauscht werden: virtuelle Euro, ein Werkzeug, eine Spezialmission oder eine **virtuelle Aktienfraktion**. Für den Aktienumtausch ist ein vom Nutzer gewähltes, unterstütztes Börsensymbol mit verifiziertem aktuellem Referenzkurs nötig. Die Servertransaktion weist den Gegenstand endgültig als eingetauscht aus, verbucht den ihm zugewiesenen virtuellen Geldwert und kauft dafür die berechneten Bruchteile der Aktie über die bereits bestehende atomare EUR-Depotlogik. Es darf keine Aktie ohne belastbaren Börsen- oder EZB-Kurs aus dem Nichts zu einem Fantasiepreis entstehen. Keine Echtgeld-Aktie und keine Auszahlung außerhalb der App.

**Klares Trade-off:** Behalten bedeutet einen kleinen, spezifischen dauerhaften Vorteil sowie wachsende Artefakt-Meisterschaft (maximal Artefaktlevel 5). Eintauschen bedeutet sofortigen, einmaligen Wert; zukünftige Besitzboni verfallen. Höhere Artefaktstufen erfordern neue passende Missionen, aber der einmal zufällig zugewiesene Grundeffekt wird nicht bei jedem Levelwechsel neu gezogen.

**Vergabe:** Durch thematisch passende, echte schwierige Prüfungen, besondere Beförderungen und seltene Forschungsmissionen; niemals bloß für einen Klick oder nachträgliche Streak-Wiederholung. Eine serverseitige Ledger-Tabelle mit `unique(user_id,reward_event_id)`, eindeutiger Artefakt-ID, Slots, Besitzstatus und unwiderruflicher Einlöseentscheidung muss vor Aktivierung implementiert und getestet werden. Die existierenden Artefakt-Tabellen können nicht blind durch neue Zufallsvarianten ersetzt werden.

## 5. Sichtbare nächste Ziele

Im Lernen-Tab sieht man in der Hauptansicht nur die vier klaren Bereiche. Im Skillbaum sieht man je Fachweg den aktiven/noch gesperrten Knoten, die notwendige Voraussetzung und den nächsten Abschluss. Die Skill-Lektionen zeigen pro Einzelstufe echten Inhalt, XP, die Kaufalternative und den abgeschlossenen Status. Im Spezialbereich erkennt man, welcher Beförderungs- oder Artefaktnachweis den Fall öffnet.

Im Profil bleiben Gesamtlevel, Analystenkarriere, Inventar und Konto, aber **kein separater Skillbaum**. Bei einer Beförderung wird angezeigt, welcher genaue Skillabschluss sie ausgelöst hat und welche neue Tagesbelohnung jetzt gilt. Artefakte zeigen ihre aktive Wirkung und die klaren Einlöseoptionen.

## 6. Technische Sicherheitsanforderungen für weitere Ausbaustufen

- Keine Browser-Guthabenbuchungen; serverseitige RLS und atomare Kauf-/Belohnungsfunktionen.
- XP und Forschungspunkte nur einmal pro eindeutiger Aufgaben-/Prüfungs-ID.
- Quizantworten dürfen nicht allein durch ein clientseitiges `completed:true` Meistergrade erzeugen.
- Echtgeld und virtuelles Eurodepot strikt getrennt; Unterrichtsausgaben aus Spielgeld müssen separat von der Aktienperformance ausgewiesen werden.
- Aktiv-Artifact-Limit vier auch bei gleichzeitigem Einlösen/Erhalten auf verschiedenen Geräten eingehalten; keine doppelten oder zufällig mehrfach neu gezogenen Gegenstände.
- Geprüfte Beförderungen verbessern täglich die Streak-Prämie, ohne die einmaligen Meilensteine mehrfach auszuzahlen.
- Vor jeder automatisierten Veröffentlichung den vollständigen Katalog, alle Verweise, Vorbedingungen, inhaltliche Richtigkeit und serverseitige Antwortdaten prüfen.
- Cloud- und Offlinezustände dürfen keinen unverdienten XP-/Geldzuwachs ermöglichen.

**Status:** v41 implementiert Navigation, Skillkatalog, serverseitige Käufe, 36 neue Speziallektionen, individuelles XP, FP-Skillabschluss, 5-Skill-Beförderung, Streak-Rangbonus und den ersten exklusiven Spezialfall-Katalog. Zufällige Artefakte mit Limit vier, deren neue Tauschvarianten, vollständige Bewertungsprüfung der Spezialfälle, Langzeitmissionen und die Zusammenführung alter/neuer Skill-XP sind als nächste kontrollierte Phasen geplant.
