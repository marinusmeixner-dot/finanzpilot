# FinanzPilot – kostenlose Finanz-Lern-App

Mobile Web-App mit 14 kurzen Lernlektionen, Quiz, XP, Lernserien und täglichem Marktüberblick. Ohne Bezahl-API. Keine Kontostände im Repository.

## Einrichtung (einmalig)

Der Quellcode ist **bereits hier hochgeladen**. Die ZIP-Datei wird nicht mehr benötigt.

**Achtung:** Dieses Repository wurde zunächst als **privat** angelegt. Auf GitHub Free funktioniert GitHub Pages nur mit **öffentlichen** Repositories. Unter Settings → General → Danger Zone → Change repository visibility → Make public umstellen, wenn du die Lern-App öffentlich bereitstellen möchtest. Achtung: Dann werden Code und darin enthaltene **öffentliche Marktberichte** für alle sichtbar. Persönliche Finanzdaten bleiben nur im privaten Google Sheet.

Anschließend Settings → Pages → Build and deployment: Deploy from a branch, Branch main, Folder /(root), Save.

Nach der Veröffentlichung zeigt Settings → Pages den geprüften Link zur App. Der GitHub-Pages-Link ist bis zur Aktivierung nicht bestätigt.

## Automatische Aktualisierung

- ChatGPT-Aufgabe `FinanzPilot Tagesredaktion`: recherchiert Nachrichten, erklärt Chancen/Risiken und kann `data/daily.json` redaktionell auf dem bestehenden Repo aktualisieren.
- GitHub-Workflow `.github/workflows/daily-news.yml`: lädt täglich aktuelle RSS-Überschriften als kostenfreie Fallback-Lösung, sofern Actions aktiviert und Schreibzugriff für `GITHUB_TOKEN` erlaubt sind.
- Bei News-Ausfall: App zeigt veralteten Datenstand statt erfundene Aktualität.
- Wichtig: Die redaktionelle Aufgabe muss GitHub-Zugriff in der Ausführung haben, damit ihre Texte wirklich im Repo landen. GitHub Actions und ChatGPT haben keine garantierte exakte Ausführungszeit.

## Datenschutz

Lernfortschritt liegt lokal im Browser. Bei Browserwechsel kein automatischer Abgleich. Öffentliche GitHub-Pages-Websites und News enthalten **keine** Bankdaten, Kontonummern, Passwörter oder Google-Sheets-Inhalte. Deine Kontoübersicht bleibt im privaten Sheet.

## ZIP

Die bereits erzeugte ZIP ist eine lokale Sicherheitskopie der Quelldateien. Du brauchst sie nicht hochzuladen.
