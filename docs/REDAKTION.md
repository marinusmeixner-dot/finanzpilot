# FinanzPilot: Redaktionsvertrag für automatische Lerninhalte

## Dateien

- `data/daily.json`: geprüfte tägliche 3 Markt-News mit Datum, Quelle, URL, `why`, `impact`.
- `data/academy.json`: Kurse, Datenstände und **eine tagesaktuelle** Aufgabe `market_task`.
- Beide Dateien täglich aktualisieren, sofern qualifizierte öffentlich überprüfbare Informationen verfügbar sind.
- **Bestehende Kurse beibehalten**; nur offensichtliche Fehler mit nachvollziehbarer Quelle korrigieren. Jedes neue Modul bekommt eine neue stabile `id`.

## academy.json Schema v1

```
{
  "schema_version": 1,
  "updated_at": "2026-10-31T08:00:00+01:00",
  "editor_note": "kurzer, ehrlicher Redaktionsvermerk",
  "market_task": {
    "date": "2026-10-31",
    "title": "aus überprüfter Nachricht",
    "context": "Was wissen wir / was ist offen?",
    "question": "Offene Analyseaufgabe, die eine begründete Meinung erfordert",
    "rubric": ["4 konkrete Kriterien für gute Argumentation"],
    "source": "Quelle",
    "source_url": "https://belegbare-quelle",
    "source_date": "2026-10-30",
    "symbol": "AMEX:SPY"
  },
  "courses": [
    {
      "id":"eindeutig-stabil-kebab-case",
      "title":"Konkretes interessantes Analyseszenario",
      "kind":"market-case|deep-dive|process",
      "difficulty":"Aufbau|Fortgeschritten",
      "duration":"15–25 Min.",
      "date":"2026-10-31",
      "symbol":"NASDAQ:MSFT",
      "symbol_name":"Bezeichnung",
      "summary":"kurze Kursbeschreibung",
      "evidence_note":"Alle Zahlen datieren, historisch und hypothetisch sichtbar trennen",
      "source_label":"Originalgeschäftsbericht / IR / Zentralbank / ...",
      "source_url":"https://originalquelle",
      "steps":[
        {"type":"teach","title":"1 · Analyse-Rahmen","text":"Fachliche gründliche Erklärung + Bezug zur Quelle","takeaway":"Prüfbare Erkenntnis"},
        {"type":"calc","title":"2 · Kennzahl berechnen","text":"Alle Eingangsgrößen mit Einheiten und Datenstand","question":"Exakte numerische Frage mit Rundung", "answer":12.5,"tolerance":0.1,"unit":"%","method":"korrekter, überprüfter Rechenweg"},
        {"type":"choice","title":"3 · Interpretation","text":"Abwägung im Kontext","question":"knifflige Frage mit plausiblen Alternativen","options":["Plausible falsche Deutung","Bestbegründete Deutung","Plausible falsche Deutung","Plausible falsche Deutung"],"correct":1,"method":"detaillierte Begründung"},
        {"type":"visual","title":"4 · Chart / Bericht interpretieren","text":"Reale externe Charts sind unabhängig von verwendeten Zahlen","chart":{"type":"live","symbol":"NASDAQ:MSFT"},"question":"echte Analysefrage", "rubric":["Prüfkriterium 1", "Prüfkriterium 2", "Prüfkriterium 3"],"sample":"fachlich gute, nicht absolute Musterbegründung"},
        {"type":"reflect","title":"5 · Eigene These","text":"Lerne, zwischen Annahmen und Fakten zu unterscheiden","question":"Eigene Schlussfolgerung und Gegenhypothese", "rubric":["Quellen", "Bepreisung", "Risiken", "Widerlegungskriterium"],"sample":"mögliche Musterbegründung, kein Kaufsignal"}
      ]
    }
  ]
}
```

Valid step types: `teach`, `calc`, `choice`, `visual`, `reflect`.
`visual.chart` supports `{type:"bars",unit:"...",labels:["..."],values:[1]}` **or** `{type:"live",symbol:"NASDAQ:MSFT"}`.
The `courses` field must be a JSON array, each `steps` field a nonempty array. `answer` is numeric, `correct` is 0-based index into four plausible `options`, `rubric` is an array of short strings. No invented current metrics. For market data that cannot be verified from reputable dated sources, explicitly present a *constructed example*.

## Lernqualität und Aktualisierungen

- **Täglich**: 3 geprüfte Headlines, ein neues `market_task` mit differenzierter offenen Frage und Bewertungskriterien, und wenn überprüfbar mindestens ein neuer substanzieller Praxisfall (4–6 Schritte). Kein Wiederholen identischer Lektionen.
- **Wöchentlich**: wenigstens ein längerer vollständiger Analyseprozess (7–12 Schritte, 30–60 Minuten), mit Firmenunterlagen, Margen, Cashflows, Bewertung, Szenarien, Risiken und eigener These.
- Mindestens zwei Lernmethoden je neuem Kurs (Rechenaufgabe, Chart, offene Analyse, Vergleich, Mini-Entscheidung); keine triviale Definitionstest-Fragen, keine Garantie-Handelssignale.
- Quelle mit funktionierender URL und **Datum**. Unternehmenszahlen immer Zeitraum und Einheit nennen; keine Tatsachen und Beispieldaten vermischen.
- Vor GitHub-Schreibzugriff: SHA von `fetch_file` holen. Nach jeder Änderung Datei abrufen und JSON-Schema prüfen. Nicht im selben Zeitpunkt GitHub-Action-Commits überschreiben.
- Lesen und pflegen statt immer neue Daten zu duplizieren.

## Aktienanalyse anfordern

Die Website generiert **öffentliche** GitHub-Issues mit Titelprefix `Analysewunsch:` und Feldern `Unternehmen/Ticker`, `Lernmethode`, `Fokus`.
Prüfe täglich offene Issues. Nimm zuerst maximal zwei offene Wünsche pro Lauf und priorisiere sachliche, nicht personenbezogene Fragen. Verifiziere Ticker, Geschäftsbericht und Zahlen. Erstelle eine mehrstufige Analyse in `data/academy.json` und antworte im Issue mit dem Kurslink `https://marinusmeixner-dot.github.io/finanzpilot/?course=<id>` nach erfolgreichem Upload. Schreibe kein Feedback als erledigt, solange der Kurs nicht existiert.

## Meinung bewerten

Öffentliche Issues mit Titelprefix `Feedbackwunsch:` enthalten freie Thesen des Nutzers (erst nach dessen bewusster Veröffentlichung). **Das ist ein Auftrag an ChatGPT**, nicht an eine automatische Keyword-Auswertung. Prüfe den genauen Text auf Fakten, Annahmen, Logik, Erwartungen, Risiko und Gegenhypothesen und ergänze einen differenzierten Kommentar im Issue mit: belastbare Punkte, Fehler und Unsicherheiten, Verbesserungsvorschlag, nächster Lernschritt. Bewerte keine Person. Ein GitHub-Issue ist öffentlich sichtbar; never publish financial accounts or private user data.

## Technische Grenzen

- Diese App besitzt **keine bezahlte KI-API**. Freitext wird lokal gespeichert; individuelles KI-Feedback braucht ausdrücklich die Übertragung an ChatGPT oder per GitHub-Issue.
- TradingView zeigt externe Kurse, die verzögert oder im Browser blockiert sein können. Ein Klick im Chart ist keine automatisch bewertbare historische Datenquelle.
- Bei Ausfall: altes Datum sichtbar lassen, kein erfundenes Update melden.
## Neue v5-Komponenten

- data/research.json: datierte öffentliche Einzelaktienanalysen mit Primärquelle, Geschäftsmodell, Vergleichszahlen, Risiken und Aufgaben.
- data/prices.json: kostenfreie tägliche Tages-Schlusskurse, niemals Demo-Reihen als tatsächliche Marktdaten verwenden.
- glossary.js: 18 vertiefte Konzepte mit Erklärung, Beispiel, Fallstrick und Reflexionsfrage; bei Bedarf um wirklich neue Konzepte ergänzen.
- Die Tagesredaktion recherchiert 8–12 substanzielle Nachrichten mit Schwerpunkt einzelne Unternehmen, aktuelle Berichte und konkrete Aktienanalyse. Prüfe jede Quelle und trenne Fakten von Einschätzungen.


## Redaktion ab v34 – klare Trennung Märkte und Lernen (verbindlich)

1. **Märkte → Marktüberblick** enthält ausschließlich Charts von RLS-geschützten Watchlist-Aktien; nie wieder allgemeine Nachrichten, Kurse oder Analysekarten dort einfügen. Die Watchlist wird im Browser privat per `fp_paper_watchlist` gelesen. Bei Änderungen aktualisiert die App die Chartübersicht sofort.
2. **Märkte → News → Gesamtmarkt:** In `data/daily.json` täglich datierte Makro-, Zins- und marktbreite Meldungen mit Primärquelle pflegen. Nicht als Lernen/Quiz tarnen.
3. **Märkte → News → Meine Aktien:** In `data/daily.json.stories[]` für relevante Unternehmensmeldungen eine präzise `symbols`-Liste mit gültigen Aktientickern (bei bekannten Börsen mit Suffix) setzen. Der Browser ordnet die redaktionellen Nachrichten der privaten Watchlist zu. Bei neuen Watchlist-Titeln fragt die App sofort die kostenlose Edge Function (`news`) beim Anbieter ab; externe Schlagzeilen **nicht** als redaktionell geprüft darstellen. Die Redaktion darf keine privaten Nutzerdaten oder private Watchlisten auslesen oder veröffentlichen.
4. **Märkte → News → Entdecken:** Jeden Tag überprüfte öffentliche Unternehmensnachrichten mit korrekt zuordenbaren Symbolen veröffentlichen, auch für Werte außerhalb der üblichen großen Technologieaktien. Die App zeigt sie als Entdeckungen, der Nutzer kann sie nach serverseitiger Kursregistrierung bewusst merken. Keine Kaufempfehlungen oder Fantasie-Ticker.
5. **Lernen → News verstehen:** `data/learning-news.json` nach `schema_version:1` täglich pflegen. Pro geeigneter Nachricht ein eigener Fall mit stabiler datumsbezogener `id`, `title,goal,source,url,published,facts,context,caveat,questions,reflectionPrompt,rubric,sample`. `questions` sind mindestens drei wirklich anspruchsvolle Denkfragen mit vier plausiblen `options`, nullbasiertem `correct` und detaillierter `explanation`; erfordern Deutung, periodengerechte Rechnungen, Gegenargumente und Unterscheidung von Kurs und Bewertung. Nicht bloß Definitionsfragen. Dazu eigene Freitextthese mit prüfbarer Widerlegung. Tatsächliche Nachrichten/Originalquellen verwenden; jeden Tag frische Fälle in `cases` (neue IDs), niemals frühere private Fortschritte umdeuten. Unbelegte Aussagen als solche markieren.
6. **Recherche-/Skillwünsche:** Öffentlich eingereichte GitHub-Issues mit Titelprefix `Analysewunsch:` oder `Skillwunsch:` täglich prüfen, mit Quellen und ausreichend Substanz bearbeiten, sinnvoll in den Lern-/Research-Tab einfügen. Ein GitHub-Issue ist nur eine eingereichte Anfrage, kein unmittelbarer ChatGPT-Lauf; nichts als erledigt markieren, bevor Code/Inhalt tatsächlich veröffentlicht ist. Falls unerfüllbar: im Issue nachvollziehbar erklären.
7. Die bestehenden privaten Folgetagsbewertungen (`fp_review_submissions`) weiterhin nach Zustimmung und RLS mit vorheriger Prüfung ausführen. Keine Nutzerantworten öffentlich machen. Komplettanalysen, Transferkurse und Werkzeuge gehören in **Lernen**, nicht in Märkte.
8. Bei Codeänderungen Version/Cache + Regressionstests aktualisieren, beide iPhone-Leisten fixed lassen und keine Cloud-/RLS-Funktion beschädigen. Bei reinen täglichen JSON-Updates ist kein PWA-Version-Bump notwendig.

Stand v34: `market-v34.js`, `learning-news-v34.js`, `market-v34.css`, `data/learning-news.json` und `data/daily.json`. Die App fordert Live-Schlagzeilen nur bei Aufruf ab; ein automatischer täglicher Vorab-Abruf für **jede private Watchlist** wäre ohne freiwillige Hintergrunddatenübermittlung und weitergehende Infrastruktur nicht möglich. Niemals diese Einschränkung verschweigen.
