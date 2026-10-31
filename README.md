# FinanzPilot – kostenlose Finanz-Lern-App

Funktioniert ohne zahlungspflichtige Dienste. Statisches HTML, CSS und JavaScript mit lokalem Lernfortschritt. Kein Tracking, keine privaten Kontostände, keine Zugangsdaten, keine benötigte Finanz-API. Mobile Web-App fürs iPhone, Tagesquiz, Lektionen, Fortschritt, Level, Streak, Markt-News.

## Kostenlos online mit GitHub Pages

1. Auf https://github.com/new ein **öffentliches** Repository `finanzpilot` anlegen (ohne kostenpflichtigen Plan).
2. ZIP lokal entpacken; **Inhalte des Ordners**, nicht ZIP selbst, ins Repo laden. `.github/workflows/daily-news.yml` muss ebenfalls hochgeladen werden (versteckter Ordner; falls Webupload ihn auslässt, einzeln anlegen).
3. In GitHub unter **Settings → Pages → Build and deployment → Deploy from a branch → main → /(root) → Save** wählen.
4. Unter **Actions** ggf. Workflow erlauben; unter **Settings → Actions → General → Workflow permissions** Schreibrechte für `GITHUB_TOKEN` erlauben, sofern zunächst nur Leserechte aktiv sind.
5. Die GitHub-Pages-URL zeigt GitHub unter **Settings → Pages** an. Keine private Tabelle oder Schlüssel in diesem öffentlichen Repository hinterlegen.

**Wichtig:** GitHub Free ermöglicht Pages für **öffentliche Repos**, nicht private. Geplante GitHub-Actions-Workflows können verzögert ausgeführt oder nach 60 Tagen Inaktivität deaktiviert werden. Die App zeigt ein fehlendes/veraltetes Update ausdrücklich an. Der tägliche News-Workflow benötigt keine API-Schlüssel und verwendet nur Python-Standardbibliothek.

## Was aktualisiert sich täglich?

- `scripts/refresh_news.py` lädt öffentliche RSS-Schlagzeilen, speichert deren Quelle und Link mit Datum. Keine erfundene Bewertung.
- Die ChatGPT-Aufgabe **FinanzPilot Tagesredaktion** kann zusätzlich jeden Tag `data/daily.json` redaktionell aktualisieren: 3 wichtige Nachrichten mit verständlicher Erklärung, passendes Lernziel, falsche Gewissheiten vermeiden. Dafür braucht die Aufgabe GitHub-Zugriff auf das öffentliche Repository. Wenn sie keinen Zugriff hat, schreibt sie den Tagesbericht im Chat und meldet die Grenze.
- **Nicht automatisch möglich ohne Datenverbindung:** ChatGPT kann den lokal im Browser gespeicherten individuellen Lernstand nicht auslesen. Die App selbst passt das nächste Lernmodul an falsche Antworten an. Für weitergehendes persönliches Coaching kann ein späterer freiwilliger Supabase-Login mit Row-Level Security ergänzt werden.
- Die App übernimmt **keine persönlichen Kontodaten** aus Google Sheets. Das separate Google Sheet bleibt privat.

## Lokaler Start

Einfach `index.html` im Browser öffnen. Die Oberfläche, Lektionen und Fortschritte funktionieren offline; Laden von `data/daily.json` kann lokal über `file://` blockiert sein – dann wird ein erklärender Platzhalter angezeigt. Für lokale Entwicklung `python -m http.server 8000` im Projektordner verwenden und `http://localhost:8000` öffnen.

## Datenformat `data/daily.json`

```json
{
  "date": "YYYY-MM-DD",
  "updated_at": "2026-10-31T07:00:00+01:00",
  "editor": "ChatGPT: überprüfte Marktredaktion",
  "intro": "Maximal zwei kurze Sätze zum Tagesgeschehen.",
  "lesson_id": "etf",
  "stories": [
    {
      "title": "Verifizierte Kurz-Überschrift",
      "source": "Quellenname",
      "url": "https://...",
      "published": "31.10. 07:00",
      "why": "Kurz und sachlich: Warum kann das für Anleger wichtig sein?",
      "impact": "Konkrete, vorsichtige Einordnung ohne Kursprognosen."
    }
  ],
  "learning_note": "Eine kurze, belegbare Erkenntnis.",
  "important": "Ein knapper Hinweis zu Risiko und Anlageentscheidungen."
}
```

## Datenschutz / Grenzen

Lernfortschritt liegt im Browser (`localStorage`) und ist exportier- und importierbar. Andere Geräte synchronisieren nicht automatisch. Browserdaten-Löschung kann den Fortschritt löschen. Öffentliche News können Fehler, Verzögerungen oder Paywalls haben; Quellen sind verlinkt. Externe TradingView-Charts sind optional und unterliegen deren eigenen Datenschutzbedingungen. App ist Finanzbildung und keine Anlageberatung.


## FinanzPilot-Akademie v4 – tägliche Kurse und eigene Aktienanalysen

Die App enthält jetzt den Reiter **Analysen**. Die Dateien `academy.js` und `data/academy.json` sind ohne KI-API und ohne kostenpflichtigen Marktfeed nutzbar.

- **Kurse:** Datengetriebene längere und kürzere Analysen mit Originalquellen, Rechenaufgaben, echten (externen) Charts und eigenen Investmentthesen.
- **Aktienanalysen anfordern:** Formular am Ende des Analyse-Reiters. Öffnet ein **öffentliches GitHub-Issue**, das du noch absenden musst. Die tägliche ChatGPT-Aufgabe verarbeitet solche Anfragen, sobald sie Zugriff und belastbare Quellen hat.
- **Markturteil:** Formuliere deine persönliche Einschätzung, lass dir ein Prüfraster zeigen, und übergib den Text nach ausdrücklicher Auswahl an ChatGPT oder via öffentliches GitHub-Issue an die Tagesredaktion. **Keine KI läuft unsichtbar im Browser.**
- **Lernstand:** Nur auf dem eigenen Gerät unter `finanzpilot_academy_v4` gespeichert; GitHub kann ihn weder automatisch lesen noch serverseitig bewerten.
- **Aktualisierungen:** Die bestehende Aufgabe `FinanzPilot Lernredaktion` aktualisiert `data/daily.json` und `data/academy.json` über den GitHub-Connector. Die genaue Anweisung und das Schema stehen in `docs/REDAKTION.md`.
- **Echte Microsoft-Zahlen:** Der erste vollständige Prozess verwendet echte historische FY2025-Unternehmenszahlen aus dem Microsoft Annual Report; kursbezogene hypothetische Aufgaben sind sichtbar als Annahmen gekennzeichnet.
- **Grenzen:** Live-Charts kommen extern von TradingView und können verzögert sein; Website-Besucher können keine vertraulichen Bankdaten eingeben. GitHub-Issues sind öffentlich.

Der Kurskatalog kann täglich wachsen, ohne App-Code ändern zu müssen. Bereits absolvierte Kurs-IDs bleiben stabil, damit der Fortschritt erhalten bleibt.
## Version 5 – 31.10.2026

- Übersichtliche Navigation: Start, Lernpfad, Märkte, Aktien, Fortschritt. Aktienprofile, Komplettanalysen und vertiefende Grundbegriffe sind direkt erreichbar.
- 18 anspruchsvollere Konzepte mit Anwendungsbeispielen in glossary.js.
- Aktueller Research-Katalog: Microsoft, NVIDIA und Siemens; mit datierten Originalquellen, Kennzahlen, Risiken und Rechenaufgaben.
- Neue Rechenfelder mit normaler Tastatur, Klammern und +, −, ×, ÷ ohne eval.
- Eigene interaktive Kurscharts aus data/prices.json, keine TradingView-Frames. Historische Tages-Schlusskurse, kein Live-Feed; genaue Quelle und Datenstand werden angezeigt.
- Gratis-Datenabruf über yfinance und GitHub Actions; bei Quellenfehlern bleibt letzter verifizierter Stand erhalten, statt Kurszahlen zu erfinden.
- Aktuelle Börsennachrichten mit mehr Einzelaktien, aktivem Lernpfad und ChatGPT-Tagesredaktion. Persönliche Antworten werden nicht automatisch an externe KI-Dienste übertragen.
