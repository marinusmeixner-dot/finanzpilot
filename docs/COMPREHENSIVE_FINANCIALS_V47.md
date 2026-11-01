# FinanzPilot v47 – vollständige Finanzberichte im Märkte-Tab

Stand: 2. November 2026. Verbindliche Anweisung für die aktive FinanzPilot-Redaktionsautomatisierung (Aufgaben-ID 6ae52a9d959c8191afdedc9e6d3e2cdf); sie ergänzt die bestehenden täglichen News- und Lernpflichten.

## Kernziel

**Märkte → Kennzahlen** zeigt einen **umfassenden, frei lesbaren, quellenbasierten Unternehmensbericht** für alle Aktien der privaten Watchlist. Nicht nur einige Spitzenkennzahlen, sondern die veröffentlichten Ertrags-, Bilanz-, Kapitalfluss-, Segment- und Wachstumsdaten mit eigener Einordnung.

**Datei:** `data/company-financials-v47.json` (schema_version 2). **Oberfläche:** `financial-report-v47.js` und `financial-report-v47.css`, geladen durch `market-v34.js`. Die alte fünf-Kennzahlen-Datei v45 darf nicht als neues Ergebnis zurückgeschrieben werden.

## Daily-Financial-Reporting-Vertrag

Bei der täglichen ersten Redaktionsausführung nach 08:00 Europe/Berlin:

1. **Aktuelle Watchlist** ausschließlich authentifiziert aus `fp_paper_watchlist` für die vorgesehene Nutzerzuordnung laden. Bestehende Ticker SIE.DE, BAYN.DE, NVDA und BYW.MU sind der Erstbestand; Änderungen der Watchlist sind immer maßgebend. Die Watchlist **nicht im öffentlichen Repository** veröffentlichen: Im öffentlichen JSON dürfen nur frei zugängliche *finanzielle Unternehmensinformationen* für die aktuell benötigten Ticker stehen, keine user_id, Anlagebeträge, Handelsdaten, Besitzinformationen oder persönlichen Notizen.
2. **Unternehmensbericht lokalisieren** über Emittenten-IR: den neuesten tatsächlich veröffentlichten Quartals- oder Jahresbericht, ggf. 10-Q / 10-K und XBRL via SEC EDGAR. Nicht die jüngste angekündigte Veröffentlichung mit veröffentlichten Zahlen verwechseln. Veröffentlichungsdatum, Berichtsende, Geschäftsjahr und Vierteljahr explizit überprüfen. Bei Geschäftsjahren mit abweichendem Kalender (NVDA) Kalenderdatum zusätzlich speichern.
3. **ALLE wesentlichen Finanz-Tabellen auswerten**: Umsatz und Vorjahresvergleich, organisches Wachstum, Herstellungskosten, Bruttoergebnis, Bruttomarge, EBITDA/EBIT, bereinigte Ergebnisse, Finanzergebnis, Steueraufwand, Nettogewinn/EPS, Investitionen (CAPEX), operativen Cashflow, Free Cashflow, Zahlungsmittel, Forderungen, Vorräte, Working Capital, Rückstellungen/Schulden, Eigenkapital und Bilanzsumme, Liquidität, Auftragsbestand, Unternehmens-/Geschäftssegmente, Regionen und Prognosen nach Verfügbarkeit. Die vollständige Positionenliste ist von Branche und veröffentlichtem Bericht abhängig – keine Firmen-einheitlichen Pflichtzahlen erfinden.
4. **Jede Zahl sicher erfassen**: `report_sections` hat `id,title,description,metrics`; jede `metric` hat `label,value,unit,period`, bei Vergleich auch `previous` und `previous_period`, bei Bedarf `kind` und `note`. `kind='stock'` für Bilanzstichtag, `kind='ratio'` für Margen/Prozentsätze, `kind='forecast'` für Unternehmensprognosen, `kind='derived'` für selbst aus nachgewiesenen Daten berechnete Werte (Formel in `note` nennen). Keine Mischung von Quartal vs. Halbjahr, Bilanzstichtag vs. Quartalsfluss, berichtet vs. bereinigt und verschiedenen Währungen. Prozentpunkt-Vergleich von Margen und Prozent-Wachstum bei gleichartig positiven Periodenwerten; bei Vorzeichenwechsel absolute Veränderung statt unsinniger relativer Prozentzahl. Ohne Wert KEINE erfundene Null.
5. **Risiken und Einordnung** in `report_overview` (summary, positives, negatives, watch) plus `assessment`, `risks`, `data_limitations`. In verständlicher, nicht werblicher Sprache. Positives Wachstum bei erhöhten Investitionen oder schlechter Cashflow-Konversion erklären. Trennlinie zu Aktienkurs und Aktienbewertung: KGV/EV/EBITDA nicht als Bestandteil der Finanzbericht-Daten ausgeben, ohne gesonderte verifizierte Börsenkursstichtage und Berechnungsdefinitionen.
6. **Quellen**: Für jede Gruppe auf die offizielle Gesamtquelle oder den einschlägigen Abschnitt zurückverfolgbare Links in `source` und `sources`, Publikationsdatum `published`, redaktionelle Prüfzeit `verified_at`, Datenperioden-Ende `period_end`. Ohne prüfbare Primärquelle keine neue Finanzzahl.
7. **Eingeschränkte Berichte**: Bei BayWa steht zum 2.11.2026 im IR-Archiv nur die Q1-2026-Mitteilung; sie enthält wegen Sanierung keine reguläre vollständige GuV-/Bilanz-/Cashflow-Rechnung. Diese Daten fehlen, sind aber nicht null und dürfen nie aus Vorperioden aufgefüllt werden. Termine für verspätete Folgeabschlüsse nur als Termine aufnehmen. Für andere Emittenten dieselbe Ehrlichkeit.
8. **Neue Aktien**: Wenn Watchlist einen neuen Ticker enthält, zum nächsten Tageslauf recherchieren und die neue Akte im JSON anlegen; zuvor zeigt das UI einen transparenten Hinweis. Niemals Daten von ähnlich geschriebenen Tickern/anderen Firmen verwenden.
9. **Veröffentlichung/QA**: Nach tatsächlich erfolgter Prüfung JSON auf syntaktische und fachliche Konsistenz validieren, anschließend mindestens `node scripts/test_comprehensive_financials_v47.mjs` sowie die bestehenden Tests ausführen. Keine doppelte Auszahlung von XP/FP, keine Änderungen an Aktienorders/Depot. Berichte werden vorgehalten, aber eine Aktualisierungsschaltfläche in der App lädt nur die zuletzt redaktionell publizierte Datei; sie führt **keine eigenständige Live-Finanzrecherche** aus. Daher Prüfung nicht als realtime beschreiben.

## Erstbestand November 2026

- Siemens AG: Q3 GJ 2026, Veröffentlichung 6.8.2026; Presse-/Ergebnisbericht, **20 sicher geprüfte** Kennzahlen aus veröffentlichtem Bericht. Q4 GJ 2026 erst für 12.11.2026 erwartet (als Termin, nicht als Zahlen).
- Bayer AG: Q2 2026, Halbjahresbericht 4.8.2026; **41** dokumentierte wesentliche Größen aus GuV, Cashflow, Segment- und Regionaltabellen sowie gesonderte Jahresprognose.
- NVIDIA Corporation: Q2 GJ 2027, 26.8.2026; **44** dokumentierte Größen aus GAAP-GuV, Bilanz, Cashflow, Segmenten und Q3-Guidance. GJ 2027 ≠ Kalenderjahr 2027.
- BayWa AG: nur eingeschränkter Q1-2026-Berichtsstand, 26.5.2026; **2** belastbare Umsatz- und berechnete Wachstumsangaben, fehlende Finanzteile ausdrücklich markiert.

**Wichtig:** Diese Zahlenangaben sind eine sorgfältig quellengeprüfte *Auswahl der verfügbaren Tabellenwerte*, keine Behauptung, dass jede Fußnote und jede einzelne Kontoposition sämtlicher Langberichte bereits vollständig erfasst wurde. Der tägliche redaktionelle Ausbau soll die wesentlichen tabellarischen Positionen möglichst vollständig erfassen und deren Quellensicherheit aufrechterhalten.

## Frontend-Regeln

Aktien per Watchlistauswahl wechseln; nie ungefragt fremde Nutzerportfoliozahlen sichtbar machen. Alle Abschnitte aufklappbar, Textsuche, korrekter Vorjahres-/Stichtagsvergleich, Euro- oder US-Dollar-Einheiten und mobile horizontal scrollbar KPI-Tabelle. Einordnung getrennt von amtlichen Unternehmenszahlen. Quellen direkt als HTTPS-Link öffnbar. Die vorhandenen Charts, News und Skill-Lektionen bleiben unverändert.
