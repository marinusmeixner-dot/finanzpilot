-- FINANZPILOT V51: individually authenticated and idempotent learning missions.
-- No changes to old lessons, XP, artifact inventory, or previous progress.
create schema if not exists fp_mission_private;
revoke all on schema fp_mission_private from public, anon, authenticated;
create table if not exists public.fp_mission_questions_v51(
 id text primary key,
 kind text not null check(kind in ('daily','review','weekly')),
 topic text not null,
 skill_id text references public.fp_specialization_catalog(id),
 case_no integer not null default 0,
 step integer not null default 0,
 title text not null,
 question text not null,
 options jsonb not null check(jsonb_typeof(options)='array' and jsonb_array_length(options)=4),
 context text not null default ''
);
create table if not exists fp_mission_private.fp_answers_v51 (
 id text primary key references public.fp_mission_questions_v51(id),
 correct_index integer not null check(correct_index between 0 and 3),
 explanation text not null
);
create table if not exists public.fp_mission_attempts_v51 (
 user_id uuid not null references auth.users(id) on delete cascade,
 period_key text not null,
 mission_kind text not null check(mission_kind in ('daily','review','weekly')),
 question_id text not null references public.fp_mission_questions_v51(id),
 selected_index integer not null check(selected_index between 0 and 3),
 tries integer not null check(tries between 1 and 2),
 correct boolean not null,
 resolved boolean not null,
 updated_at timestamptz not null default now(),
 primary key(user_id,period_key,question_id)
);
create table if not exists public.fp_mission_rewards_v51 (
 user_id uuid not null references auth.users(id) on delete cascade,
 period_key text not null,
 mission_kind text not null check(mission_kind in ('daily','review','weekly')),
 points integer not null check(points in (2,3,15)),
 awarded_at timestamptz not null default now(),
 primary key(user_id,period_key,mission_kind)
);
create index if not exists fp_mission_attempts_owner_time_v51 on public.fp_mission_attempts_v51(user_id,updated_at desc);
create index if not exists fp_mission_rewards_owner_v51 on public.fp_mission_rewards_v51(user_id,awarded_at desc);
alter table public.fp_mission_questions_v51 enable row level security;
alter table fp_mission_private.fp_answers_v51 enable row level security;
alter table public.fp_mission_attempts_v51 enable row level security;
alter table public.fp_mission_rewards_v51 enable row level security;
revoke all on public.fp_mission_questions_v51,public.fp_mission_attempts_v51,public.fp_mission_rewards_v51 from public,anon,authenticated;
revoke all on fp_mission_private.fp_answers_v51 from public,anon,authenticated;
grant select on public.fp_mission_attempts_v51,public.fp_mission_rewards_v51 to authenticated;
create policy fp_mission_attempt_owner_v51 on public.fp_mission_attempts_v51 for select to authenticated using ((select auth.uid())=user_id);
create policy fp_mission_reward_owner_v51 on public.fp_mission_rewards_v51 for select to authenticated using ((select auth.uid())=user_id);
insert into public.fp_mission_questions_v51 (id,kind,topic,skill_id,case_no,step,title,question,options,context) values
('d-margin','daily','zahlen',null,0,0,'Marge richtig berechnen','Umsatz 400 Mio. €, operatives EBIT 52 Mio. €. Wie hoch ist die EBIT-Marge?','["9 %","13 %","15 %","19 %"]'::jsonb,''),
('d-fcf','daily','zahlen',null,0,0,'Cashflow vom Gewinn trennen','Operativer Cashflow 120 Mio. €, Investitionsauszahlungen 45 Mio. €. Welcher vereinfachte FCF ergibt sich?','["165 Mio. €","120 Mio. €","75 Mio. €","45 Mio. €"]'::jsonb,''),
('d-dilution','daily','zahlen',null,0,0,'Aktienverwässerung erkennen','Ein Unternehmen erwirtschaftet unverändert 100 Mio. € Gewinn. Die Aktienzahl steigt von 50 auf 55 Mio. Wie verändert sich EPS?','["EPS steigt um 10 %","EPS sinkt um ca. 9,1 %","EPS bleibt gleich","EPS sinkt um 50 %"]'::jsonb,''),
('d-growth','daily','zahlen',null,0,0,'Wachstumsrate prüfen','Der Umsatz steigt von 80 auf 100 Mio. €. Welche nominale Wachstumsrate ist korrekt?','["20 %","25 %","80 %","125 %"]'::jsonb,''),
('d-drawdown','daily','risiko',null,0,0,'Verluste und Erholung','Ein Depot verliert 20 %. Wie stark muss es vom niedrigeren Wert steigen, um wieder den Ausgangswert zu erreichen?','["20 %","22 %","25 %","40 %"]'::jsonb,''),
('d-liquidity','daily','risiko',null,0,0,'Liquiditätsrisiko','Du benötigst in zwei Monaten sicher 3.000 €. Welche Aussage ist am fundiertesten?','["Aktien schwanken kurzfristig kaum","Das benötigte Geld sollte möglichst liquide und wertstabil bleiben","Hebel erhöht die Planungssicherheit","Ein hohes KGV schützt vor Verlusten"]'::jsonb,''),
('d-weight','daily','risiko',null,0,0,'Klumpenrisiko','70 % des Depots liegen in einer Aktie. Diese verliert 30 %, alle anderen Positionen bleiben stabil. Wie verändert sich das Depot?','["−9 %","−21 %","−30 %","−70 %"]'::jsonb,''),
('d-stop','daily','risiko',null,0,0,'Stop-Orders realistisch lesen','Eine Aktie schließt bei 50 €, dein Stop liegt bei 46 €, die nächste Eröffnung bei 40 €. Was gilt bei einem Stop-Market-Verkauf?','["Garantierte Ausführung bei 46 €","Garantierte Ausführung bei 50 €","Ausführung kann deutlich unter 46 € erfolgen","Der Stop verhindert jede Kurslücke"]'::jsonb,''),
('d-bonds','daily','markt',null,0,0,'Zins und Anleihekurs','Marktzinsen steigen bei sonst unveränderten Bedingungen deutlich. Was geschieht typischerweise mit dem Preis einer bereits bestehenden festverzinslichen Anleihe?','["Er steigt","Er fällt","Er bleibt garantiert unverändert","Die Kuponhöhe wird rückwirkend erhöht"]'::jsonb,''),
('d-news','daily','markt',null,0,0,'Nachrichten gegen Erwartungen','Ein Unternehmen meldet 15 % Gewinnwachstum und die Aktie fällt. Was ist eine plausible Erklärung?','["Gewinnwachstum führt gesetzlich zu Kursverlusten","Investoren erwarteten zuvor noch stärkeres Wachstum","Alle Kurse folgen mechanisch dem letzten Gewinn","Der Bilanzwert ist null"]'::jsonb,''),
('d-inflation','daily','markt',null,0,0,'Reale Kaufkraft','Eine Anlage erzielt nominal 4 % Rendite, die Inflation beträgt 3 %. Was ist näherungsweise die reale Rendite?','["−1 %","1 %","4 %","7 %"]'::jsonb,''),
('d-order','daily','markt',null,0,0,'Spread verstehen','Geldkurs 99,80 €, Briefkurs 100,20 €. Wie groß ist der angegebene Spread?','["0,20 €","0,40 €","1,00 €","200,00 €"]'::jsonb,''),
('r-report','review','reporting','berichte-lesen',0,0,'Berichtszeiträume zuordnen','Ein Unternehmen meldet Umsatz für Q2 und Schuldenstand am 30. Juni. Was ist richtig?','["Beides sind Quartals-Zahlungsströme","Schuldenstand ist eine Stichtagsgröße","Umsatz ist eine reine Stichtagsgröße","Beides darf direkt addiert werden"]'::jsonb,''),
('r-cash','review','cashflow','cashflow-architekt',0,0,'Cashflow-Brücke auffrischen','Gewinn 90, Abschreibungen 20, zusätzlich gebundenes Working Capital 30 (alles in Mio. €). Wie hoch ist ein vereinfachter operativer Cashflow?','["40 Mio. €","80 Mio. €","110 Mio. €","140 Mio. €"]'::jsonb,''),
('r-value','review','valuation','werttreiber',0,0,'Werttreiber identifizieren','Welche Änderung erhöht bei sonst gleichen Bedingungen typischerweise den DCF-Unternehmenswert?','["Höherer WACC","Niedrigerer langfristiger FCF","Nachhaltig höherer freier Cashflow","Mehr ausstehende Aktien ohne mehr Eigenkapitalwert"]'::jsonb,''),
('r-risk','review','risk','risiko-basis',0,0,'Risikotragfähigkeit wiederholen','Welches Kapital ist für sehr risikoreiche langfristige Anlagen am wenigsten geeignet?','["Geld mit 20 Jahren Anlagehorizont","Notreserve für unerwartete Ausgaben","Freies, entbehrliches Vermögen","Ein langfristiger Sparanteil"]'::jsonb,''),
('r-etf','review','etf','etf-strukturen',0,0,'ETF-Strukturen prüfen','Welche Kennzahl beschreibt am besten den realisierten Renditeabstand eines ETFs zu seinem Index über einen Zeitraum?','["Tracking Difference","Nur die Anzahl der ETF-Anteile","Kurs einer einzigen Indexaktie","Die Depotgröße des Anbieters"]'::jsonb,''),
('r-inflation','review','macro','inflation-zinsen',0,0,'Inflation richtig einordnen','Die Inflation sinkt von 5 % auf 2 %. Was folgt daraus unmittelbar?','["Das Preisniveau fällt um 3 %","Die Preise steigen insgesamt weiterhin, nur langsamer","Alle Waren sind günstiger geworden","Leitzinsen müssen auf null fallen"]'::jsonb,''),
('r-order','review','trading','orderbuch-liquiditaet',0,0,'Ordertypen unterscheiden','Du willst keinesfalls mehr als 25 € pro Aktie bezahlen. Welche Kauforder setzt diese Obergrenze?','["Market Buy","Buy Stop ohne Limit","Buy Limit 25 €","Verkaufslimit 25 €"]'::jsonb,''),
('r-bias','review','psychology','biases-mentalmodelle',0,0,'Bestätigungsfehler erkennen','Welche Research-Methode schwächt Confirmation Bias?','["Nur positive Meldungen sammeln","Gegenhypothese vor der Analyse festlegen","Kursziel zuerst fixieren","Warnungen ignorieren"]'::jsonb,''),
('r-diversity','review','portfolio','portfolio-architekt',0,0,'Diversifikation hinterfragen','Zwei ETFs enthalten fast dieselben Aktien und Sektoren. Welche Aussage ist richtig?','["Zwei Produkte garantieren Diversifikation","Die Risiken können stark korrelieren","Ein ETF schützt den anderen automatisch","Die Gebühren werden null"]'::jsonb,''),
('r-sources','review','research','quellenfinder',0,0,'Originalquellen prüfen','Du benötigst die tatsächlich ausgewiesenen Segmentumsätze. Welche Quelle ist zuerst geeignet?','["Unbelegte Social-Media-Grafik","Aktueller offizieller Geschäftsbericht","Anonymer Kommentar","Eine nicht datierte Kursprognose"]'::jsonb,''),
('w1-1','weekly','fallstudie',null,1,1,'Wachstum einordnen','Wie stark steigt der Umsatz?','["10 %","15 %","20 %","−15 %"]'::jsonb,'Fiktiver Maschinenbauer: Umsatz Vorjahr 800 Mio. €, aktuell 920 Mio. €; EBIT von 80 auf 69 Mio. € gefallen. Operativer Cashflow 54 Mio. €, Investitionen 70 Mio. €, Nettoverschuldung 180 Mio. €. Alle Werte stammen aus demselben fiktiven Geschäftsjahr. Bewerte Wachstum, Qualität, Liquidität und Risiko.'),
('w1-2','weekly','fallstudie',null,1,2,'Gewinnqualität lesen','Wie verändert sich die EBIT-Marge ungefähr?','["Von 10 % auf 7,5 %","Von 7,5 % auf 10 %","Sie bleibt bei 10 %","Von 80 % auf 69 %"]'::jsonb,'Fiktiver Maschinenbauer: Umsatz Vorjahr 800 Mio. €, aktuell 920 Mio. €; EBIT von 80 auf 69 Mio. € gefallen. Operativer Cashflow 54 Mio. €, Investitionen 70 Mio. €, Nettoverschuldung 180 Mio. €. Alle Werte stammen aus demselben fiktiven Geschäftsjahr. Bewerte Wachstum, Qualität, Liquidität und Risiko.'),
('w1-3','weekly','fallstudie',null,1,3,'Liquidität berechnen','Welcher vereinfachte Free Cashflow ergibt sich?','["124 Mio. €","−16 Mio. €","16 Mio. €","54 Mio. €"]'::jsonb,'Fiktiver Maschinenbauer: Umsatz Vorjahr 800 Mio. €, aktuell 920 Mio. €; EBIT von 80 auf 69 Mio. € gefallen. Operativer Cashflow 54 Mio. €, Investitionen 70 Mio. €, Nettoverschuldung 180 Mio. €. Alle Werte stammen aus demselben fiktiven Geschäftsjahr. Bewerte Wachstum, Qualität, Liquidität und Risiko.'),
('w1-4','weekly','fallstudie',null,1,4,'Unternehmensrisiko prüfen','Welche Information wäre für die Schuldentragfähigkeit besonders nützlich?','["Nur der Börsenkurs von gestern","Fälligkeiten, Zinsaufwand und Cashflow-Ausblick","Die Farbe des Logos","Eine unbestätigte Marktmeinung"]'::jsonb,'Fiktiver Maschinenbauer: Umsatz Vorjahr 800 Mio. €, aktuell 920 Mio. €; EBIT von 80 auf 69 Mio. € gefallen. Operativer Cashflow 54 Mio. €, Investitionen 70 Mio. €, Nettoverschuldung 180 Mio. €. Alle Werte stammen aus demselben fiktiven Geschäftsjahr. Bewerte Wachstum, Qualität, Liquidität und Risiko.'),
('w1-5','weekly','fallstudie',null,1,5,'Investmentthese verteidigen','Welche Schlussfolgerung ist aus den vorhandenen Zahlen am besten begründet?','["15 % Umsatzwachstum garantiert eine hohe Rendite","Der FCF ist negativ und die EBIT-Marge fällt; Ursachen und Ausblick prüfen","Die Firma ist sicher insolvent","Ein Kursziel kann ohne weitere Annahmen exakt berechnet werden"]'::jsonb,'Fiktiver Maschinenbauer: Umsatz Vorjahr 800 Mio. €, aktuell 920 Mio. €; EBIT von 80 auf 69 Mio. € gefallen. Operativer Cashflow 54 Mio. €, Investitionen 70 Mio. €, Nettoverschuldung 180 Mio. €. Alle Werte stammen aus demselben fiktiven Geschäftsjahr. Bewerte Wachstum, Qualität, Liquidität und Risiko.'),
('w2-1','weekly','fallstudie',null,2,1,'Wert je Aktie im Basisszenario','Welcher Eigenkapitalwert je Aktie folgt aus dem Base-EV?','["25 €","30 €","35 €","40 €"]'::jsonb,'Fiktives Unternehmen: 40 Mio. Aktien, Nettoschulden 200 Mio. €, aktueller Kurs 25 €. Eigene Unternehmenswertszenarien (Enterprise Value): Bear 900 Mio. €, Base 1.400 Mio. €, Bull 1.900 Mio. €. Eigene Wahrscheinlichkeiten 25 % / 50 % / 25 %. Es sind Annahmen, keine Kursziele aus einem Marktbericht.'),
('w2-2','weekly','fallstudie',null,2,2,'Bear-Risiko','Welcher Wert je Aktie folgt aus dem Bear-EV?','["17,50 €","22,50 €","27,50 €","30 €"]'::jsonb,'Fiktives Unternehmen: 40 Mio. Aktien, Nettoschulden 200 Mio. €, aktueller Kurs 25 €. Eigene Unternehmenswertszenarien (Enterprise Value): Bear 900 Mio. €, Base 1.400 Mio. €, Bull 1.900 Mio. €. Eigene Wahrscheinlichkeiten 25 % / 50 % / 25 %. Es sind Annahmen, keine Kursziele aus einem Marktbericht.'),
('w2-3','weekly','fallstudie',null,2,3,'Bull-Szenario','Welcher Wert je Aktie folgt aus dem Bull-EV?','["35 €","37,50 €","42,50 €","47,50 €"]'::jsonb,'Fiktives Unternehmen: 40 Mio. Aktien, Nettoschulden 200 Mio. €, aktueller Kurs 25 €. Eigene Unternehmenswertszenarien (Enterprise Value): Bear 900 Mio. €, Base 1.400 Mio. €, Bull 1.900 Mio. €. Eigene Wahrscheinlichkeiten 25 % / 50 % / 25 %. Es sind Annahmen, keine Kursziele aus einem Marktbericht.'),
('w2-4','weekly','fallstudie',null,2,4,'Wahrscheinlichkeiten anwenden','Wie hoch ist dein wahrscheinlichkeitgewichteter Wert je Aktie?','["25 €","27,50 €","30 €","32,50 €"]'::jsonb,'Fiktives Unternehmen: 40 Mio. Aktien, Nettoschulden 200 Mio. €, aktueller Kurs 25 €. Eigene Unternehmenswertszenarien (Enterprise Value): Bear 900 Mio. €, Base 1.400 Mio. €, Bull 1.900 Mio. €. Eigene Wahrscheinlichkeiten 25 % / 50 % / 25 %. Es sind Annahmen, keine Kursziele aus einem Marktbericht.'),
('w2-5','weekly','fallstudie',null,2,5,'Bewertung kritisch würdigen','Was ist trotz des positiven Abstands zum Börsenkurs zu prüfen?','["Nichts: Erwartungswert über Kurs garantiert Gewinn","Sensitivität der Annahmen, Eintrittswahrscheinlichkeiten, Verwässerung und Alternativen","Nur die Zahl der Social-Media-Follower","Man darf keine Szenarien vergleichen"]'::jsonb,'Fiktives Unternehmen: 40 Mio. Aktien, Nettoschulden 200 Mio. €, aktueller Kurs 25 €. Eigene Unternehmenswertszenarien (Enterprise Value): Bear 900 Mio. €, Base 1.400 Mio. €, Bull 1.900 Mio. €. Eigene Wahrscheinlichkeiten 25 % / 50 % / 25 %. Es sind Annahmen, keine Kursziele aus einem Marktbericht.'),
('w3-1','weekly','fallstudie',null,3,1,'Exposure prüfen','Wie hoch ist das gemeinsame Aktiengewicht?','["30 %","45 %","75 %","90 %"]'::jsonb,'Fiktives 20.000-€-Depot: Aktie A 45 %, Aktie B 30 %, Anleihe-ETF 15 %, Cash 10 %. Stressszenario: A −30 %, B −20 %, ETF −5 %, Cash unverändert. Geplanter Notgroschen ist ausdrücklich nicht Teil dieses Depots.'),
('w3-2','weekly','fallstudie',null,3,2,'Gesamtverlust schätzen','Wie stark sinkt das Depot im gegebenen Stressszenario?','["−15,75 %","−20,25 %","−30 %","−55 %"]'::jsonb,'Fiktives 20.000-€-Depot: Aktie A 45 %, Aktie B 30 %, Anleihe-ETF 15 %, Cash 10 %. Stressszenario: A −30 %, B −20 %, ETF −5 %, Cash unverändert. Geplanter Notgroschen ist ausdrücklich nicht Teil dieses Depots.'),
('w3-3','weekly','fallstudie',null,3,3,'Euro-Verlust verstehen','Welcher Verlust in Euro folgt daraus?','["2.025 €","3.500 €","4.050 €","6.000 €"]'::jsonb,'Fiktives 20.000-€-Depot: Aktie A 45 %, Aktie B 30 %, Anleihe-ETF 15 %, Cash 10 %. Stressszenario: A −30 %, B −20 %, ETF −5 %, Cash unverändert. Geplanter Notgroschen ist ausdrücklich nicht Teil dieses Depots.'),
('w3-4','weekly','fallstudie',null,3,4,'Erholung berechnen','Welche Aufwärtsrendite braucht das Depot vom gestressten Endwert, um wieder 20.000 € zu erreichen?','["20,25 %","25,4 %","30 %","40,5 %"]'::jsonb,'Fiktives 20.000-€-Depot: Aktie A 45 %, Aktie B 30 %, Anleihe-ETF 15 %, Cash 10 %. Stressszenario: A −30 %, B −20 %, ETF −5 %, Cash unverändert. Geplanter Notgroschen ist ausdrücklich nicht Teil dieses Depots.'),
('w3-5','weekly','fallstudie',null,3,5,'Handlungsplan beurteilen','Welche Maßnahme ist bei hoher Konzentration fachlich sinnvoll?','["Risiken ausschließlich am vergangenen Kursgewinn messen","Zusammenhängende Risikofaktoren, maximalen tragbaren Verlust und Diversifikation prüfen","Verluste durch Hebel garantiert ausgleichen","Jede rote Position automatisch verkaufen"]'::jsonb,'Fiktives 20.000-€-Depot: Aktie A 45 %, Aktie B 30 %, Anleihe-ETF 15 %, Cash 10 %. Stressszenario: A −30 %, B −20 %, ETF −5 %, Cash unverändert. Geplanter Notgroschen ist ausdrücklich nicht Teil dieses Depots.')
on conflict (id) do update set kind=excluded.kind,topic=excluded.topic,skill_id=excluded.skill_id,case_no=excluded.case_no,step=excluded.step,title=excluded.title,question=excluded.question,options=excluded.options,context=excluded.context;
insert into fp_mission_private.fp_answers_v51 (id,correct_index,explanation) values
('d-margin',1,'52 / 400 × 100 = 13 %. EBIT und Umsatz müssen denselben Zeitraum betreffen.'),
('d-fcf',2,'FCF = operativer Cashflow − ausgezahlte Investitionen = 75 Mio. €.'),
('d-dilution',1,'EPS fällt von 2,00 € auf 1,82 €, also um ca. 9,1 %. Verwässerung ist auch ohne sinkenden Gesamtgewinn relevant.'),
('d-growth',1,'(100 / 80 − 1) × 100 = 25 %. Prozentpunkte wären hier eine falsche Einheit.'),
('d-drawdown',2,'Nach dem Fall steht das Depot bei 80; (100/80 − 1) × 100 = 25 %.'),
('d-liquidity',1,'Ein kurzer fester Anlagehorizont macht starke Kursschwankungen riskant.'),
('d-weight',1,'0,70 × −30 % = −21 % Gesamtdepotverlust.'),
('d-stop',2,'Ein Stop-Market wird bei Auslösung zur Marktorder und schützt nicht vor ungünstigen Kurslücken.'),
('d-bonds',1,'Steigende Marktrenditen drücken normalerweise den Kurs bestehender Anleihen mit niedrigerem Kupon.'),
('d-news',1,'Märkte bewerten Abweichungen von Erwartungen, Ausblick, Risiko und Liquidität, nicht nur Vorjahresvergleiche.'),
('d-inflation',1,'Exakt (1,04/1,03 − 1) × 100 ≈ 0,97 %. Nominal und real strikt trennen.'),
('d-order',1,'Der Spread ist Brief minus Geld = 0,40 € pro Stück.'),
('r-report',1,'Umsatz wird über eine Periode gemessen, Schulden an einem Stichtag. Vergleiche müssen passende Zeiträume verwenden.'),
('r-cash',1,'90 + 20 − 30 = 80 Mio. €. Mehr gebundenes Working Capital reduziert die Liquidität.'),
('r-value',2,'Bei konstantem WACC erhöht nachhaltig höherer FCF den diskontierten Wert; die Gegenhypothese bleibt zu prüfen.'),
('r-risk',1,'Notreserve und terminierte Ausgaben erfordern planbare Verfügbarkeit.'),
('r-etf',0,'Tracking Difference vergleicht die tatsächliche ETF-Rendite mit der Vergleichsindexrendite; Indexmethodik beachten.'),
('r-inflation',1,'Disinflation ist sinkende Inflationsrate, nicht zwingend Deflation.'),
('r-order',2,'Ein Kauflimit setzt den maximalen Kaufpreis, garantiert aber keine Ausführung.'),
('r-bias',1,'Eine vorab formulierte Gegenhypothese macht die These falsifizierbar.'),
('r-diversity',1,'Viele Produkte bedeuten nicht zwangsläufig viele unabhängige Risikotreiber.'),
('r-sources',1,'Primärberichte sind für berichtete Kennzahlen der erste Prüfpunkt; Zeitraum und Bereinigungen mitlesen.'),
('w1-1',1,'(920−800)/800 = 15 %.'),
('w1-2',0,'Alt: 80/800 = 10 %. Neu: 69/920 = 7,5 %. Die Umsatzdynamik verdeckt den Margenrückgang.'),
('w1-3',1,'54 − 70 = −16 Mio. €. Vor einer Investitionsentscheidung muss der Investitionscharakter geklärt werden.'),
('w1-4',1,'Fälligkeiten, Konditionen, Liquidität und nachhaltige Geldflüsse entscheiden über Finanzierungsspielraum.'),
('w1-5',1,'Mehr Umsatz kann Wert vernichten, wenn operative Marge und Cashflow nicht folgen. Halte Fakten und zukünftige Annahmen getrennt.'),
('w2-1',1,'(1.400 − 200) / 40 = 30 € je Aktie. Nettoschulden vom EV abziehen.'),
('w2-2',0,'(900 − 200) / 40 = 17,50 € je Aktie.'),
('w2-3',2,'(1.900 − 200) / 40 = 42,50 € je Aktie.'),
('w2-4',2,'0,25×17,50 + 0,50×30 + 0,25×42,50 = 30 €. Ein Modellwert bleibt unsicher.'),
('w2-5',1,'Bewertungsszenarien sind Annahmen. Ein um 20 % höherer Erwartungswert beweist keine Marktfalschbewertung.'),
('w3-1',2,'45 %+30 % =75 % Aktienexposure, auch wenn der ETF und Cash einen kleinen Puffer bieten.'),
('w3-2',1,'45%×−30% +30%×−20% +15%×−5%=−13,5%−6%−0,75%=−20,25%.'),
('w3-3',2,'20.000 × 20,25 % = 4.050 €.'),
('w3-4',1,'Von 15.950 € auf 20.000 €: 4.050 / 15.950 ≈ 25,4 %.'),
('w3-5',1,'Risiko ist mehr als die Anzahl Positionen: Korrelationen, Liquidität, Anlageziel und Risikotragfähigkeit zählen.')
on conflict(id) do update set correct_index=excluded.correct_index,explanation=excluded.explanation;
-- Internally private selector; mode keys are day-local and ISO-week-local in Europe/Berlin.
create or replace function fp_mission_private.assignments_v51(p_user uuid,p_day date)
returns table(question_id text,mission_kind text,period_key text)
language sql stable security definer set search_path=''
as $$
 with daily_pool as (
  select q.id,q.topic, (row_number() over(partition by q.topic order by q.id)-1)::int as rn,
  count(*) over(partition by q.topic)::int as cnt
  from public.fp_mission_questions_v51 q where q.kind='daily'
 ),
 completed as (
  select c.id from public.fp_specialization_catalog c
  where exists(select 1 from public.fp_specialization_lesson_catalog lc where lc.skill_id=c.id)
  and not exists(
   select 1 from public.fp_specialization_lesson_catalog lc
   left join public.fp_specialization_lessons l on l.lesson_id=lc.id and l.user_id=p_user
   where lc.skill_id=c.id and l.completed_at is null
  )
 ),
 review_pool as (
  select q.id,coalesce(pr.last_day,date '2000-01-01') as last_day
  from public.fp_mission_questions_v51 q
  join completed c on c.id=q.skill_id
  left join lateral(
   select max(a.updated_at at time zone 'Europe/Berlin')::date as last_day, count(*)::int as visits
   from public.fp_mission_attempts_v51 a
   where a.user_id=p_user and a.mission_kind='review' and a.question_id=q.id
   and a.period_key <> 'r:'||to_char(p_day,'YYYY-MM-DD')
  ) pr on true
  where q.kind='review' and (pr.last_day is null or
   pr.last_day <= p_day - (case when pr.visits<1 then 1 when pr.visits<3 then 3 else 7 end))
  order by coalesce(pr.last_day,date '2000-01-01'),q.id limit 2
 ),
 monday as (
  select (p_day-(extract(isodow from p_day)::int-1))::date as day
 ),
 week_no as (
  select mod(mod(((day-date '2026-11-02')/7)::int,3)+3,3)+1 as case_no, day from monday
 )
 select id,'daily'::text,'d:'||to_char(p_day,'YYYY-MM-DD') from daily_pool
 where rn=mod(mod((p_day-date '2026-11-02')::int,cnt)+cnt,cnt)
 union all
 select id,'review'::text,'r:'||to_char(p_day,'YYYY-MM-DD') from review_pool
 union all
 select q.id,'weekly'::text,'w:'||to_char(w.day,'YYYY-MM-DD')
 from public.fp_mission_questions_v51 q cross join week_no w
 where q.kind='weekly' and q.case_no=w.case_no
 $$;
revoke all on function fp_mission_private.assignments_v51(uuid,date) from public,anon,authenticated;
create or replace function public.fp_missions_dashboard_v51()
returns jsonb language plpgsql volatile security definer set search_path=''
as $$
declare v_user uuid:=auth.uid(); v_day date:=(now() at time zone 'Europe/Berlin')::date; v_result jsonb;
begin
 if v_user is null then raise exception 'Für die synchronisierten Missionen bitte anmelden.' using errcode='28000'; end if;
 with assigned as (select * from fp_mission_private.assignments_v51(v_user,v_day)),
 data as (
 select a.mission_kind,a.period_key,q.id,q.title,q.question,q.options,q.context,q.topic,q.step,q.case_no,q.skill_id,
  at.tries,at.selected_index,at.correct,at.resolved,at.updated_at,
  case when at.resolved then ans.explanation else null end as explanation,
  case when at.resolved then ans.correct_index else null end as correct_index
 from assigned a join public.fp_mission_questions_v51 q on q.id=a.question_id
 left join public.fp_mission_attempts_v51 at on at.user_id=v_user and at.question_id=q.id and at.period_key=a.period_key
 left join fp_mission_private.fp_answers_v51 ans on ans.id=q.id
 )
 select jsonb_build_object(
 'date',to_char(v_day,'YYYY-MM-DD'),
 'week_start',to_char(v_day-(extract(isodow from v_day)::int-1),'YYYY-MM-DD'),
 'daily',coalesce((select jsonb_agg(to_jsonb(d) order by d.topic,d.id) from data d where d.mission_kind='daily'),'[]'::jsonb),
 'reviews',coalesce((select jsonb_agg(to_jsonb(d) order by d.id) from data d where d.mission_kind='review'),'[]'::jsonb),
 'weekly',coalesce((select jsonb_agg(to_jsonb(d) order by d.step) from data d where d.mission_kind='weekly'),'[]'::jsonb),
 'recent_rewards',coalesce((select jsonb_agg(to_jsonb(r) order by r.awarded_at desc) from (select period_key,mission_kind,points,awarded_at from public.fp_mission_rewards_v51 where user_id=v_user order by awarded_at desc limit 15) r),'[]'::jsonb),
 'totals',jsonb_build_object('missions_completed',(select count(*) from public.fp_mission_rewards_v51 where user_id=v_user),'questions_correct',(select count(*) from public.fp_mission_attempts_v51 where user_id=v_user and correct),'points_earned',(select coalesce(sum(points),0) from public.fp_mission_rewards_v51 where user_id=v_user))
 ) into v_result;
 return v_result;
end $$;
revoke all on function public.fp_missions_dashboard_v51() from public,anon;
grant execute on function public.fp_missions_dashboard_v51() to authenticated;
create or replace function public.fp_missions_submit_v51(p_question_id text,p_index integer)
returns jsonb language plpgsql volatile security definer set search_path=''
as $$
declare
 v_user uuid:=auth.uid(); v_day date:=(now() at time zone 'Europe/Berlin')::date;
 v_kind text;v_period text;v_answer integer;v_reason text;v_prev public.fp_mission_attempts_v51%rowtype;
 v_correct boolean;v_tries integer;v_resolved boolean;v_count int;v_correct_count int;v_required int;v_points int;v_awarded int:=0;
begin
 if v_user is null then raise exception 'Bitte anmelden.' using errcode='28000'; end if;
 if p_question_id is null or length(p_question_id)>100 or p_index is null or p_index not between 0 and 3 then
  raise exception 'Ungültige Antwort.' using errcode='22023';
 end if;
 select a.mission_kind,a.period_key into v_kind,v_period
 from fp_mission_private.assignments_v51(v_user,v_day) a where a.question_id=p_question_id limit 1;
 if v_kind is null then raise exception 'Diese Mission ist nicht freigeschaltet oder nicht mehr aktuell.' using errcode='42501';end if;
 select correct_index,explanation into v_answer,v_reason from fp_mission_private.fp_answers_v51 where id=p_question_id;
 if v_answer is null then raise exception 'Antwortschlüssel fehlt.';end if;
 perform pg_advisory_xact_lock(hashtextextended(v_user::text||':'||v_period||':'||p_question_id,0));
 select * into v_prev from public.fp_mission_attempts_v51
 where user_id=v_user and period_key=v_period and question_id=p_question_id for update;
 if found and v_prev.resolved then
  return jsonb_build_object('correct',v_prev.correct,'resolved',true,'tries',v_prev.tries,'explanation',v_reason,'correct_index',v_answer,'points_awarded',0,'dashboard',public.fp_missions_dashboard_v51());
 end if;
 v_tries=coalesce(v_prev.tries,0)+1;
 if v_tries>2 then raise exception 'Diese Frage wurde schon zweimal beantwortet.';end if;
 v_correct=(p_index=v_answer);
 v_resolved=v_correct or v_tries>=2;
 insert into public.fp_mission_attempts_v51 (user_id,period_key,mission_kind,question_id,selected_index,tries,correct,resolved,updated_at)
 values(v_user,v_period,v_kind,p_question_id,p_index,v_tries,v_correct,v_resolved,now())
 on conflict(user_id,period_key,question_id)
 do update set selected_index=excluded.selected_index,tries=excluded.tries,correct=excluded.correct,resolved=excluded.resolved,updated_at=excluded.updated_at;
 if v_resolved then
  select count(*),count(*) filter(where a.correct) into v_count,v_correct_count
  from fp_mission_private.assignments_v51(v_user,v_day) assigned
  join public.fp_mission_attempts_v51 a on a.user_id=v_user and a.question_id=assigned.question_id and a.period_key=assigned.period_key
  where assigned.mission_kind=v_kind and a.resolved;
  v_required=case v_kind when 'daily' then 3 when 'weekly' then 5 else 2 end;
  v_points=case v_kind when 'daily' then 3 when 'weekly' then 15 else 2 end;
  if v_count=v_required and v_correct_count=v_required then
    insert into public.fp_mission_rewards_v51(user_id,period_key,mission_kind,points)
    values(v_user,v_period,v_kind,v_points)
    on conflict(user_id,period_key,mission_kind) do nothing
    returning points into v_awarded;
    if v_awarded is not null then
      insert into public.fp_economy_accounts (user_id,research_points)
      values(v_user,v_awarded)
      on conflict (user_id) do update
      set research_points=public.fp_economy_accounts.research_points+excluded.research_points,updated_at=now();
    end if;
  end if;
 end if;
 return jsonb_build_object('correct',v_correct,'resolved',v_resolved,'tries',v_tries,
 'explanation',case when v_resolved then v_reason else null end,
 'correct_index',case when v_resolved then v_answer else null end,
 'points_awarded',coalesce(v_awarded,0),'dashboard',public.fp_missions_dashboard_v51());
end $$;
revoke all on function public.fp_missions_submit_v51(text,integer) from public,anon;
grant execute on function public.fp_missions_submit_v51(text,integer) to authenticated;
