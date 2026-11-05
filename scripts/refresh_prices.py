#!/usr/bin/env python3
"""Best-effort daily adjusted historical prices for the open FinanzPilot research universe.

All symbols are discovered from data/research-universe-v86.json, plus legacy
chart symbols. Never replaces previous prices when a source is unavailable.
No partial current-session candles: today's daily bar is not a completed close.
Source: public Yahoo historical adjusted prices, NOT a live trade quote.
"""
from __future__ import annotations
import json
import math
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"data"/"prices.json"
UNIVERSE=ROOT/"data"/"research-universe-v86.json"
LEGACY={
 "MSFT":("MSFT","USD"),"NVDA":("NVDA","USD"),"AAPL":("AAPL","USD"),
 "AMZN":("AMZN","USD"),"META":("META","USD"),
 "SIEMENS":("SIE.DE","EUR"),"SPY":("SPY","USD"),"QQQ":("QQQ","USD"),
 "ACWI":("ACWI","USD"),"DAX":("^GDAXI","EUR"),
 "BTCEUR":("BTC-EUR","EUR"),"VWCE":("VWCE.DE","EUR"),
 "KION":("KGX.DE","EUR"),"AIXTRON":("AIXA.DE","EUR"),"CGNX":("CGNX","USD")
}

def requested_symbols(universe,legacy=LEGACY,discovered=None):
    symbols=dict(legacy)
    already={v[0].upper() for v in symbols.values()}
    # Scanner-derived verified profiles and published issuers are first-class quote requests.
    # Unverified RSS headlines are intentionally never inserted into this set.
    for item in list(universe.get("equities",[]))+list(universe.get("benchmarks",[]))+list(discovered or []):
        ticker=str(item.get("ticker","")).strip().upper()
        currency=item.get("currency")
        if not ticker or currency not in ("USD","EUR") or ticker in already:
            continue
        if not (ticker.replace(".","").replace("-","").isalnum()):
            continue
        symbols[ticker]=(ticker,currency)
        already.add(ticker)
    return symbols

def usable_history(rows,ticker,now=None):
    now=now or datetime.now(timezone.utc)
    market_tz=ZoneInfo("Europe/Berlin") if ticker.endswith((".DE",".PA",".AS",".MI",".MU")) or ticker.startswith("^GDAXI") else ZoneInfo("America/New_York")
    today=now.astimezone(market_tz).date()
    result={}
    for date,value in rows:
        d=date.date() if hasattr(date,"date") else date
        try:
            val=float(value)
        except (ValueError,TypeError):
            continue
        # This excludes the current session even after close to avoid an
        # unfinished/late-adjusted daily bar; it is retained the next day.
        if d>=today or not (0<val<1e9) or not math.isfinite(val):
            continue
        result[d.isoformat()]=round(val,5)
    return [{"d":d,"c":result[d]} for d in sorted(result)][-300:]

def main():
    import yfinance as yf
    try:
        result=json.loads(OUT.read_text(encoding="utf-8"))
    except (OSError,ValueError):
        result={"schema_version":1,"assets":{}}
    try:
        universe=json.loads(UNIVERSE.read_text(encoding="utf-8"))
    except (OSError,ValueError):
        universe={"equities":[],"benchmarks":[]}
    import scan_research as screen
    profiles=json.loads((ROOT/"data/company-profiles-v82.json").read_text(encoding="utf-8")) if (ROOT/"data/company-profiles-v82.json").exists() else {"companies":{}}
    curated=json.loads((ROOT/"data/ideas.json").read_text(encoding="utf-8")) if (ROOT/"data/ideas.json").exists() else {"ideas":[]}
    stories=[]
    for name in ("daily.json","editorial-core-v43.json"):
        file=ROOT/"data"/name
        if file.exists():
            try: stories.extend(json.loads(file.read_text(encoding="utf-8")).get("stories",[]))
            except (ValueError,OSError): pass
    discovered=screen.discovery_universe(universe,profiles,curated,stories)
    requested=requested_symbols(universe,discovered=discovered)
    print(f"Quote collection: {len(requested)} symbols across the seed universe, verified profiles and editorial dossiers.")

    result.setdefault("assets",{})
    now=datetime.now(timezone.utc)
    def collect(pair):
        key,(ticker,currency)=pair
        h=yf.Ticker(ticker).history(period="1y",interval="1d",auto_adjust=True,timeout=13)
        if h is None or h.empty:
            raise ValueError("Keine verfügbaren Tageskurse")
        points=usable_history(h["Close"].items(),ticker,now)
        if len(points)<15:
            raise ValueError("Keine ausreichend langen vollständigen historischen Tageskerzen")
        return key,{"ticker":ticker,"currency":currency,"source":"Yahoo Finance (über yfinance)",
                    "asof":points[-1]["d"],"adjusted":"Split-/dividendenbereinigt nach Datenanbieter",
                    "price_type":"fully_closed_daily_adjusted_price","points":points}
    successful=0
    # Five bounded workers keep the GitHub job below the workflow timeout, and
    # source errors cannot corrupt previously available historical data.
    with ThreadPoolExecutor(max_workers=5) as ex:
        futures={ex.submit(collect,row):row[0] for row in requested.items()}
        for future in as_completed(futures):
            key=futures[future]
            try:
                idx,series=future.result()
                old=result["assets"].get(idx,{})
                if old.get("asof","")>series["asof"]:
                    print(f"{idx}: older provider dataset ignored")
                    continue
                if old.get("asof")==series["asof"] and old.get("points")==series["points"]:
                    continue
                result["assets"][idx]=series
                successful+=1
                print(f"{idx}: {len(series['points'])} closed sessions to {series['asof']}")
            except Exception as e:
                print(f"{key}: unavailable ({type(e).__name__}: {str(e)[:100]}), previous data preserved")
    if successful:
        result["schema_version"]=1
        result["last_refresh_at"]=now.isoformat()
        OUT.write_text(json.dumps(result,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf-8")
    else:
        print("No new fully closed daily data; file unchanged.")

if __name__=="__main__":
    main()
