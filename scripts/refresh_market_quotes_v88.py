#!/usr/bin/env python3
"""Refresh dated *unadjusted* completed regular-session close for researched stocks.

Never promotes Yahoo's third-party quote to official exchange verification.
Never alters fundamental data or invents shares, forward estimates, or fair values.
If data is unavailable, incomplete, reversed or split-suspicious, keep old close.
This is distinct from prices.json's split/dividend-adjusted return histories.
"""
from __future__ import annotations
import datetime as dt
import json
import math
import pathlib
from zoneinfo import ZoneInfo

ROOT=pathlib.Path(__file__).resolve().parents[1]
SNAPSHOT=ROOT/"data"/"market-valuations-v84.json"
UNIVERSE=ROOT/"data"/"research-universe-v86.json"
MAX_SINGLE_DAY_MOVE=.40

def read(path, default):
    try: return json.loads(path.read_text(encoding="utf-8"))
    except (OSError,ValueError,TypeError): return default

def local_market_day(ticker, now):
    tz=ZoneInfo("Europe/Berlin") if ticker.endswith((".DE",".MU",".PA",".AS",".MI")) else ZoneInfo("America/New_York")
    return now.astimezone(tz).date()

def last_completed_close(rows, ticker, now):
    """Pure source-checking function; rows = [(date, raw_close)] from yfinance."""
    today=local_market_day(ticker,now)
    valid=[]
    for stamp,value in rows:
        try:
            date=stamp.date() if hasattr(stamp,"date") else dt.date.fromisoformat(str(stamp)[:10])
            price=float(value)
        except (TypeError,ValueError,OverflowError,AttributeError):
            continue
        if not (date<today and math.isfinite(price) and 0<price<1e7):continue
        valid.append((date,round(price,5)))
    return sorted(valid,key=lambda a:a[0])[-1] if valid else None

def safe_update(record,ticker,latest,now):
    if not latest or not isinstance(record,dict):return False
    quote=record.get("quote") or {}
    current=quote.get("date") or ""
    date,price=latest
    day=date.isoformat()
    if not isinstance(current,str) or (current and day<=current):return False
    if quote.get("currency") not in ("USD","EUR") or quote.get("exchange") not in ("NASDAQ","XETRA"):return False
    if (quote["exchange"]=="XETRA")!=ticker.endswith(".DE"):return False
    old=quote.get("close")
    if type(old) in (float,int) and old>0:
        days=(date-dt.date.fromisoformat(current)).days if current else 0
        if days<=8 and abs(price/old-1)>MAX_SINGLE_DAY_MOVE:
            # Likely split/corporate action; shares+historical EPS must be audited first.
            print(f"CORPORATE-ACTION REVIEW {ticker}: {old} -> {price} ({day}); previous quote retained")
            return False
    quote.update({
      "close":price,"date":day,"price_type":"regular_session_close",
      "source_url":f"https://finance.yahoo.com/quote/{ticker}/history/",
      "source_kind":"third_party_yahoo_unadjusted_close",
      "observed_at":now.isoformat().replace("+00:00","Z"),
      "provider_ticker":ticker,
      "exchange_verified_by_operator":False,
    })
    record["quote"]=quote
    return True

def main():
    import yfinance as yf
    data=read(SNAPSHOT,{})
    universe=read(UNIVERSE,{})
    id_to_ticker={item.get("id"):item.get("ticker") for item in universe.get("equities",[]) if isinstance(item,dict)}
    records=data.get("stocks")
    if not isinstance(records,list):
        raise ValueError("No existing dated equity snapshot to refresh")
    now=dt.datetime.now(dt.timezone.utc)
    changes=0
    for row in records:
        id_=row.get("id")
        ticker=id_to_ticker.get(id_)
        if not ticker:
            print(f"QUOTE GAP {id_}: provider ticker not in verified research universe; unchanged")
            continue
        ticker=str(ticker).upper()
        try:
            h=yf.Ticker(ticker).history(period="10d",interval="1d",auto_adjust=False,actions=False,timeout=13)
            if h is None or h.empty:raise ValueError("empty raw price history")
            latest=last_completed_close(h["Close"].items(),ticker,now)
            if safe_update(row,ticker,latest,now):
                changes+=1
                print(f"QUOTE VERIFIED {ticker}: {row['quote']['date']} {row['quote']['close']} {row['quote']['currency']} (third-party raw close)")
        except (Exception) as exc:
            # Provider rate limits or unavailable tickers do not silently zero anything.
            print(f"QUOTE UNAVAILABLE {ticker}: {type(exc).__name__}: {str(exc)[:130]}")
    if changes:
        data["asof"]=max(x["quote"]["date"] for x in records if x.get("quote",{}).get("date"))
        data["last_quote_refresh_at"]=now.isoformat().replace("+00:00","Z")
        data["price_policy"]=("Datierte, reguläre, unbereinigte Schlusskurse der zuletzt vollständig abgeschlossenen "
          "Handelssitzung von einem Drittanbieter (Yahoo Finance via yfinance). Keine börsenbetreiber-"
          "beglaubigten Preise, kein Echtzeitkurs und kein Split-/Dividenden-adjusted Preis. "
          "Währung und Handelsplatz je Datensatz angegeben. Fundamentalzahlen können einen anderen "
          "Stichtag haben; Kursupdate verändert diese Daten niemals. Bei Splits >40% Preisänderung "
          "innerhalb von 8 Kalendertagen aktualisiert nur ein gesonderter Finanz-Audit die Aktie.")
        SNAPSHOT.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
        print(f"PRICE AUDIT: {changes} eligible completed closes, issuer financials unchanged.")
    else:
        print("No new safe completed closes; preserved old quotes and financials.")

if __name__=="__main__":
    main()
