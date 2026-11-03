#!/usr/bin/env python3
"""Hourly, untrusted *discovery* inbox for the FinanzPilot editorial agent.

IMPORTANT: This script NEVER writes curated public articles to data/daily.json.
RSS headlines (including Google News) are not fact-checked and are not shown
as published FinanzPilot editorial. A human/AI editor must verify original
primary sources and write complete German articles before publication.
"""
from __future__ import annotations

import datetime as dt
import email.utils
import hashlib
import json
import pathlib
import urllib.request
import xml.etree.ElementTree as ET

ROOT = pathlib.Path(__file__).resolve().parents[1]
DEST = ROOT / "data" / "editorial-candidates.json"
FEEDS = [
    ("Destatis", "https://www.destatis.de/SiteGlobals/Functions/RSSFeed/DE/Presse/Pressemitteilungen/rss.xml"),
    ("Tagesschau Wirtschaft", "https://www.tagesschau.de/wirtschaft/index~rss2.xml"),
    ("CNBC Markets", "https://www.cnbc.com/id/10000664/device/rss/rss.html"),
    ("Google News: EU/Deutschland", "https://news.google.com/rss/search?q=EZB%20Destatis%20Wirtschaft%20when%3A2d&hl=de&gl=DE&ceid=DE%3Ade"),
    ("Google News: Watchlist", "https://news.google.com/rss/search?q=Siemens%20Bayer%20Nvidia%20Alphabet%20BayWa%20when%3A2d&hl=de&gl=DE&ceid=DE%3Ade"),
    ("Google News: Finanzen", "https://news.google.com/rss/search?q=Quartalszahlen%20Inflation%20Anleihen%20ETF%20when%3A2d&hl=de&gl=DE&ceid=DE%3Ade"),
]

def parse_pub(value):
    try:
        d = email.utils.parsedate_to_datetime(value)
        if d.tzinfo is None:
            d = d.replace(tzinfo=dt.timezone.utc)
        return d.astimezone(dt.timezone.utc)
    except (TypeError, ValueError):
        return None

def collect_feed(label, url, now):
    req = urllib.request.Request(url, headers={
        "User-Agent": "FinanzPilot-EditorialDiscovery/1.0 (noncommercial news index; source verification required)"
    })
    with urllib.request.urlopen(req, timeout=12) as response:
        body = response.read(1_000_000)
    root = ET.fromstring(body)
    candidates = []
    for entry in root.findall(".//item")[:24]:
        def field(name):
            node = entry.find(name)
            return (node.text or "").strip() if node is not None else ""
        title = " ".join(field("title").split())[:180]
        link = field("link")
        when = parse_pub(field("pubDate"))
        if not title or not link.startswith("https://") or not when:
            continue
        age = now - when
        if age < dt.timedelta(minutes=-15) or age > dt.timedelta(hours=72):
            continue
        token = hashlib.sha256((label + "|" + link).encode("utf-8")).hexdigest()[:18]
        candidates.append({
            "id": "rss-" + token, "title": title, "source": label, "url": link,
            "published_at": when.isoformat().replace("+00:00", "Z"),
            "verification": "unverified_candidate", "status": "needs_primary_source"
        })
    return candidates

def build_candidates(prior, fetched, now):
    cutoff = now - dt.timedelta(hours=96)
    by_id = {}
    # Preserve unreviewed candidates temporarily, with stable IDs.
    for item in prior.get("candidates", []):
        if not isinstance(item, dict) or item.get("verification") != "unverified_candidate":
            continue
        try:
            stamped = dt.datetime.fromisoformat(item["published_at"].replace("Z", "+00:00"))
        except (KeyError, ValueError, TypeError):
            continue
        if stamped >= cutoff and item.get("id") and str(item.get("url", "")).startswith("https://"):
            by_id[item["id"]] = item
    for item in fetched:
        if item["id"] in by_id:
            continue
        by_id[item["id"]] = item
    ordered = sorted(by_id.values(), key=lambda c: (c["published_at"], c["id"]), reverse=True)[:100]
    return ordered

def main():
    try:
        prior = json.loads(DEST.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        prior = {"schema_version": 1, "candidates": []}
    now = dt.datetime.now(dt.timezone.utc)
    found, successes = [], 0
    for label, url in FEEDS:
        try:
            result = collect_feed(label, url, now)
            successes += 1
            found.extend(result)
            print(f"READ {label}: {len(result)} possible headlines")
        except (TimeoutError, OSError, ET.ParseError, ValueError) as ex:
            print(f"SOURCE FAILED {label}: {type(ex).__name__}: {str(ex)[:150]}")
    if not successes:
        print("No reachable feeds; previously verified content and inbox unchanged.")
        return
    updated = build_candidates(prior, found, now)
    if updated == prior.get("candidates", []):
        print("No new editorial candidates; file unchanged.")
        return
    outgoing = {
        "schema_version": 1,
        "updated_at": now.isoformat().replace("+00:00", "Z"),
        "editorial_status": "unverified_candidates_only",
        "note": "Not FinanzPilot articles. Verify issuer/regulator primary sources before writing and publishing full in-app editorial.",
        "candidates": updated
    }
    DEST.write_text(json.dumps(outgoing, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"INBOX UPDATED: {len(updated)} unverified candidates; curated articles untouched.")

if __name__ == "__main__":
    main()
