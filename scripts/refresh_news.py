#!/usr/bin/env python3
"""Kostenloser RSS-Fallback für die FinanzPilot-Web-App, ohne API-Schlüssel.

GitHub Actions führt ihn täglich aus. Der tägliche ChatGPT-Finanzcoach kann
anschließend die Quellen prüfen und eigene kurze Erklärungen ergänzen.
Er setzt nie erfundene Nachrichten ein. Bei Feed-Ausfall bleibt das letzte
funktionierende JSON mit seinem alten Zeitstempel erhalten.
"""
import datetime as dt
import email.utils
import json
import pathlib
import urllib.request
from zoneinfo import ZoneInfo
import xml.etree.ElementTree as ET

ROOT = pathlib.Path(__file__).resolve().parents[1]
DEST = ROOT / 'data' / 'daily.json'
FEEDS = [
    ('Tagesschau Wirtschaft', 'https://www.tagesschau.de/wirtschaft/index~rss2.xml'),
    ('CNBC Markets', 'https://www.cnbc.com/id/10000664/device/rss/rss.html'),
    ('Google News Aktien', 'https://news.google.com/rss/search?q=Microsoft%20Nvidia%20Siemens%20Aktie%20when%3A2d&hl=de&gl=DE&ceid=DE%3Ade'),
    ('Google News Finanzen', 'https://news.google.com/rss/search?q=Aktien%20ETF%20EZB%20B%C3%B6rse%20when%3A1d&hl=de&gl=DE&ceid=DE%3Ade'),
    ('Google News Bilanzberichte', 'https://news.google.com/rss/search?q=Unternehmenszahlen%20Gewinn%20Quartal%20when%3A2d&hl=de&gl=DE&ceid=DE%3Ade'),
]

def get_feed(label, url):
    req = urllib.request.Request(url, headers={'User-Agent': 'FinanzPilot/1.0 (educational RSS reader; contact GitHub repo owner)'})
    with urllib.request.urlopen(req, timeout=16) as response:
        data = response.read(1_000_000)
    tree = ET.fromstring(data)
    results = []
    for item in tree.findall('.//item')[:16]:
        def node(tag):
            found = item.find(tag)
            return (found.text or '').strip() if found is not None else ''
        title = node('title')
        link = node('link')
        if not title or not link.startswith('https://'):
            continue
        pub = node('pubDate')
        try:
            when = email.utils.parsedate_to_datetime(pub)
            if when.tzinfo is None: when = when.replace(tzinfo=dt.timezone.utc)
            if dt.datetime.now(dt.timezone.utc) - when.astimezone(dt.timezone.utc) > dt.timedelta(days=3):
                continue
            pub = when.astimezone(ZoneInfo('Europe/Berlin')).strftime('%d.%m. %H:%M')
        except (ValueError, TypeError):
            pub = ''
        results.append({'title':title[:160], 'source':label, 'url':link, 'published':pub, 'why':'', 'impact':''})
    return results

def main():
    prior = json.loads(DEST.read_text(encoding='utf-8')) if DEST.exists() else {}
    stories=[]
    for label,url in FEEDS:
        try:
            stories.extend(get_feed(label,url))
        except (TimeoutError, OSError, ET.ParseError, ValueError) as ex:
            print(f'FEED FAILED {label}: {type(ex).__name__}: {ex}')
    seen=set()
    unique=[]
    for story in stories:
        key=story['title'].strip().lower()
        if key in seen:continue
        seen.add(key)
        unique.append(story)
    if not unique:
        print('Keine verwertbaren Nachrichten: bestehende Daten behalten.')
        return
    now=dt.datetime.now(dt.timezone.utc)
    berlin_date=now.astimezone(ZoneInfo('Europe/Berlin')).strftime('%Y-%m-%d')
    # Falls ChatGPT am gleichen Tag bereits geprüfte Erklärungen geliefert hat, diese nicht überschreiben.
    if prior.get('date')==berlin_date and str(prior.get('editor','')).startswith('ChatGPT'):
        print('ChatGPT-Bericht ist schon aktuell; RSS-Fallback schreibt nicht darüber.')
        return
    prior.update({
        'date':berlin_date,
        'updated_at':now.isoformat(),
        'editor':'RSS-Fallback; keine redaktionelle KI-Einordnung',
        'intro':'Aktuelle Überschriften aus öffentlichen Quellen. Erst die Quellen öffnen und prüfen, bevor daraus eine Anlageentscheidung abgeleitet wird.',
        'stories':unique[:15],
        'important':'Öffentliche Schlagzeilen sind keine Kaufempfehlungen. Wichtiger ist, was ein Ereignis langfristig verändert.'
    })
    DEST.write_text(json.dumps(prior,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f'{len(unique[:15])} Nachrichten gespeichert.')

if __name__=='__main__':main()