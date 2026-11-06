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

def completed_us_session_day(now):
    """Last eligible session date for an intentionally one-day-delayed daily bar."""
    ny=now.astimezone(ZoneInfo("America/New_York")).date()
    d=ny-from_timedelta(1)
    while d.weekday()>=5:
        d=d-from_timedelta(1)
    return d

def from_timedelta(days):
    from datetime import timedelta
    return timedelta(days=days)

def price_refresh_due(data, now, min_retry_hours=4, universe=None):
    """Quick hourly check; download full price history only when yesterday's
    completed U.S. session is missing. Holidays retry with a cooldown."""
    target=completed_us_session_day(now).isoformat()
    assets=data.get("assets") or {}
    # Large-index benchmark is more reliable than a thinly traded stock.
    anchor=assets.get("SPY",{})
    if anchor.get("ticker")!="SPY":
        anchor=next((x for x in assets.values() if x.get("ticker")=="SPY"),{})
    tracked={str(x.get('ticker','')).upper() for x in (universe or {}).get('equities',[]) if x.get('ticker')}
    provider={str(x.get('ticker','')).upper() for x in assets.values() if isinstance(x,dict)}
    missing=tracked-provider
    # Newly verified members must receive a history even if the main ETF is current.
    if not missing and anchor.get("asof","")>=target:
        return False
    try:
        last=datetime.fromisoformat(str(data.get("last_price_attempt_at","")).replace("Z","+00:00"))
        if last.tzinfo is None:return True
        hours=(now-last).total_seconds()/3600
        if 0<=hours<min_retry_hours:return False
    except (ValueError,TypeError):pass
    return True

def main():
    try:
        result=json.loads(OUT.read_text(encoding="utf-8"))
    except (OSError,ValueError):
        result={"schema_version":1,"assets":{}}
    try:
        universe=json.loads(UNIVERSE.read_text(encoding="utf-8"))
    except (OSError,ValueError):
        universe={"equities":[],"benchmarks":[]}
    now=datetime.now(timezone.utc)
    if not price_refresh_due(result,now,universe=universe):
        print('HOURLY PRICE AUDIT: latest complete U.S. session is already present, or provider retry cooldown; no quote fetch necessary.')
        return
    result['last_price_attempt_at']=now.isoformat()
    import yfinance as yf
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
        # A dated failed/no-update audit prevents rapid repeat provider calls.
        # Source values remain untouched, so stale quotes cannot masquerade as fresh.
        OUT.write_text(json.dumps(result,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf-8")
        print("HOURLY PRICE AUDIT: no new fully closed daily data; historical quotes preserved, retry after cooldown.")

if __name__=="__main__":
    main()
