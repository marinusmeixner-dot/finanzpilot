#!/usr/bin/env python3
"""Independent public-index issuer discovery for FinanzPilot (v90).

The existing nine or 54 issuers are not a ceiling. Each Berlin calendar day,
scan a public S&P 500 constituent catalogue and enroll up to four previously
unknown, diversified listed companies. Each candidate must have a valid CIK
from the separate index catalogue AND a completed historical quote in Yahoo.
This confirms a ticker plausibly trades but is NOT a primary issuer audit.
Index membership/technical performance is never a fundamental buy thesis.
Failures leave the original universe untouched.
"""
from __future__ import annotations
import csv
import datetime as dt
import io
import json
import pathlib
import re
import urllib.request
from collections import Counter
from zoneinfo import ZoneInfo

ROOT=pathlib.Path(__file__).resolve().parents[1]
UNIVERSE=ROOT/"data/research-universe-v86.json"
STATUS=ROOT/"data/issuer-discovery-v90.json"
INDEX_URL="https://raw.githubusercontent.com/datasets/s-and-p-500-companies/main/data/constituents.csv"
MAX_PER_DATE=4
MIN_ROWS=350

def read(path, default):
    try:return json.loads(path.read_text(encoding="utf-8"))
    except (OSError,ValueError,TypeError):return default

def save_changed(path,obj):
    body=json.dumps(obj,ensure_ascii=False,indent=2)+"\n"
    if path.exists() and path.read_text(encoding="utf-8")==body:return False
    path.write_text(body,encoding="utf-8")
    return True

def parse_index(raw):
    if isinstance(raw,bytes):raw=raw.decode("utf-8-sig")
    rows=list(csv.DictReader(io.StringIO(raw)))
    if len(rows)<MIN_ROWS or len(rows)>750:
        raise ValueError(f"Unplausible index catalogue length: {len(rows)}")
    found={}
    for r in rows:
        ticker=str(r.get("Symbol","")).strip().upper()
        name=" ".join(str(r.get("Security","")).split())
        sector=" ".join(str(r.get("GICS Sector","")).split())
        cik=str(r.get("CIK","")).strip()
        added=str(r.get("Date added","")).strip()
        # A stock class like BRK.B needs a provider-specific alias and an
        # independently validated identity, so it cannot enter this simple flow.
        if not re.fullmatch(r"[A-Z]{1,5}",ticker):continue
        if not (3<=len(name)<=110 and 3<=len(sector)<=70):continue
        if not cik.isdigit() or int(cik)<=0:continue
        if ticker in found:continue
        found[ticker]={"ticker":ticker,"company":name,"sector":sector,
                       "cik":cik.zfill(10),"index_added":added}
    if len(found)<300:raise ValueError("Index parse produced implausibly few valid equity records")
    return found

def known_tickers(universe):
    return {str(x.get("ticker","")).strip().upper() for x in universe.get("equities",[])}

def shortlist(index,universe,day):
    known=known_tickers(universe)
    known_ciks={str(x.get("cik","")).lstrip("0") for x in universe.get("equities",[]) if x.get("cik")}
    sectors=Counter(str(x.get("sector","")).casefold() for x in universe.get("equities",[]))
    available=[]
    for rec in index.values():
        if rec["ticker"] in known or rec["cik"].lstrip("0") in known_ciks:continue
        try:added=dt.date.fromisoformat(rec["index_added"])
        except ValueError:added=dt.date(1950,1,1)
        # Favor better sector coverage and more recently added index companies,
        # but NEVER call this an undervaluation or security thesis.
        available.append((sectors[rec["sector"].casefold()],-(added.toordinal()),
                         rec["ticker"],rec))
    available.sort()
    return [r[-1] for r in available]

def completed_quote_check(ticker,history,day):
    if history is None or len(history)<20:return False
    # Only data from a completed day is accepted. Yahoo histories are secondary.
    today=day
    points=[]
    for stamp,close in history:
        try:
            asof=stamp.date() if hasattr(stamp,"date") else dt.date.fromisoformat(str(stamp)[:10])
            v=float(close)
        except (TypeError,ValueError,AttributeError):continue
        if asof>=today or not (0<v<1000000):continue
        points.append((asof,v))
    return len(points)>=20 and (today-max(d for d,_ in points)).days<=8

def select_additions(universe,index,day,quote_ok,max_new=MAX_PER_DATE):
    existing_today=sum(1 for x in universe.get("equities",[])
      if x.get("discovery_date")==day.isoformat() and x.get("discovery_class")=="secondary_index_quote_crosscheck")
    budget=max(0,min(max_new,MAX_PER_DATE-existing_today))
    selected=[];attempts=0;failed=[]
    if not budget:return selected,attempts,failed
    # Attempt a few extra tickers if a provider endpoint fails.
    for item in shortlist(index,universe,day):
        if len(selected)>=budget or attempts>=max(14,budget*6):break
        # Allow scanning the complete catalogue to obtain sector diversity,
        # but cap the number of expensive remote quote checks.
        if any(x["sector"]==item["sector"] for x in selected):continue
        attempts+=1
        try:
            if not quote_ok(item["ticker"]):
                failed.append(item["ticker"])
                continue
        except Exception:
            failed.append(item["ticker"])
            continue
        selected.append({
           "id":"index-"+item["ticker"].lower(),
           "ticker":item["ticker"],
           "company":item["company"],
           "sector":item["sector"],
           "currency":"USD","country":"US","market":"US","benchmark_id":"ACWI",
           "discovery_class":"secondary_index_quote_crosscheck",
           "verification":"S&P 500 constituent from a secondary catalogue plus observed historical trading; company fundamentals and catalyst NOT audited",
           "cik":item["cik"],
           "index_added":item["index_added"],
           "discovery_date":day.isoformat(),
           "discovery_source_url":INDEX_URL,
           "editorial_status":"new_screening_only"})
    return selected,attempts,failed

def build(universe,index,day,quote_ok):
    if not isinstance(universe.get("equities"),list):raise ValueError("Invalid universe file")
    selected,attempts,failed=select_additions(universe,index,day,quote_ok)
    if len(selected)!=len({x["ticker"] for x in selected}):raise ValueError("Duplicate new tickers")
    result={**universe,"equities":[*universe["equities"],*selected]}
    result["universe_policy"]=(
       "Offenes Startuniversum, kein fixes Renditeranking. Neue liquide US-Firmen dürfen "
       "aus dem datierten externen S&P-500-Mitgliedsverzeichnis nach einem zweiten "
       "historischen Kurs-Nachweis aufgenommen werden (maximal vier pro Berliner Tag); "
       "Europa- und Spezialwerte stammen weiterhin aus verifizierten Profilen/Artikeln. "
       "Indexaufnahme und Kursmuster bedeuten KEIN bestätigtes Geschäftsmodell, "
       "Unterbewertung oder Investmenturteil. Bei Quellenfehlern alte Daten erhalten.")
    stats={"schema_version":1,"last_checked_date":day.isoformat(),
      "index_source":INDEX_URL,"index_rows":len(index),"new_companies":[{"ticker":x["ticker"],
        "company":x["company"],"sector":x["sector"],"cik":x["cik"]} for x in selected],
      "already_known":len(universe["equities"]),"total_universe":len(result["equities"]),
      "quote_checks":attempts,"quote_failures":failed[:12],
      "source_status":"secondary_index_and_price_crosschecked",
      "warning":"Keine Primärquellen-Unternehmensanalyse, keine Kaufaussage; neu aufgenommene Firmen sind unbewertete Screening-Kandidaten."}
    return result,stats

def main():
    day=dt.datetime.now(ZoneInfo("Europe/Berlin")).date()
    u=read(UNIVERSE,{"equities":[]})
    prior=read(STATUS,{})
    try:
        request=urllib.request.Request(INDEX_URL,headers={
          "User-Agent":"FinanzPilot-OpenEquityResearch/1.0 (public index membership auditing)"})
        with urllib.request.urlopen(request,timeout=15) as f:
            catalogue=parse_index(f.read(130000))
    except Exception as exc:
        print(f"INDEX-DISCOVERY SOURCE FAILURE: {type(exc).__name__}: {str(exc)[:180]}; original universe preserved")
        return
    import yfinance as yf
    def quote_ok(ticker):
        frame=yf.Ticker(ticker).history(period="3mo",interval="1d",auto_adjust=True,
                                         actions=False,timeout=10)
        return completed_quote_check(ticker,frame["Close"].items() if frame is not None and not frame.empty else [],day)
    new,stats=build(u,catalogue,day,quote_ok)
    changed=len(new["equities"])!=len(u["equities"])
    if changed:save_changed(UNIVERSE,new)
    # A dated daily run record is distinct from the earlier quotation-as-of and
    # cannot masquerade as freshly verified earnings.
    save_changed(STATUS,stats)
    print(f"INDEX-DISCOVERY {day}: scanned {len(catalogue)} listed securities, attempted {stats['quote_checks']}, "
          f"added {len(stats['new_companies'])}, universe {stats['total_universe']}. "
          f"Existing thesis, dossiers and portfolio unchanged.")

if __name__=="__main__":
    main()
