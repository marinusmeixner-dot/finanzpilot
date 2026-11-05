#!/usr/bin/env python3
"""Deterministic, source-labelled discovery radar for FinanzPilot.

Runs without network access and NEVER creates investment recommendations.
Evidence from unverified RSS is discovery-only; verified editorial is different
from independently audited issuer data. Research/price history is append-only.
"""
from __future__ import annotations
import bisect
import datetime as dt
import hashlib
import json
import math
import pathlib
import re
from collections import defaultdict

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "data" / "research-radar-v86.json"
LEDGER = ROOT / "data" / "thesis-ledger-v86.json"

def load(path, default):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError, TypeError):
        return default

def write_changed(path, data):
    contents = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
    try:
        current = path.read_text(encoding="utf-8")
    except OSError:
        current = ""
    if current == contents:
        return False
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(contents, encoding="utf-8")
    return True

def norm(s):
    return str(s or "").strip().upper()

def parse_date(raw):
    v = str(raw or "").strip()
    if re.match(r"^\d\d\.\d\d\.\d{4}$", v):
        v = ".".join(reversed(v.split(".")))  # day.month.year -> yyyy.mm.dd
    try:
        return dt.date.fromisoformat(v[:10].replace(".", "-"))
    except (TypeError, ValueError):
        return None

def rounded(v, places=3):
    return round(v, places) if isinstance(v, (int, float)) and math.isfinite(v) else None

def pct(start, end):
    return rounded((end / start - 1) * 100, 2) if start and end and start > 0 else None

def quote_source(symbol):
    return f"https://finance.yahoo.com/quote/{symbol}/history/"

def discovery_universe(universe, profiles, curated, editorial):
    by_ticker, by_name = {}, {}
    def put(entry):
        ticker = norm(entry.get("ticker"))
        if not re.match(r"^[A-Z0-9^][A-Z0-9.\-^]{0,13}$", ticker):
            return
        name = str(entry.get("company") or "").strip()
        if not name:
            return
        if ticker in by_ticker:
            return
        # Different share classes should not masquerade as independent ideas.
        nkey = re.sub(r"[^a-z0-9]", "", name.lower())
        if nkey in by_name and len(nkey) > 4:
            return
        by_ticker[ticker] = dict(entry)
        by_name[nkey] = ticker

    for item in universe.get("equities", []):
        put(item)
    curated_names = {norm(i.get("ticker")): i for i in curated.get("ideas", [])}
    for idea in curated.get("ideas", []):
        ticker = norm(idea.get("ticker"))
        if ticker in by_ticker:
            by_ticker[ticker]["curated_id"] = idea["id"]
            by_ticker[ticker]["editorial_status"] = idea.get("lifecycle", "active")
            continue
        # Recognized alternative listings in prior curated dossiers.
        ticker = norm(idea.get("symbol", "")).split(":")[-1] or ticker
        if ticker and ticker not in by_ticker:
            put({"id": idea.get("id") or "curated-" + ticker.lower(), "ticker": ticker,
                 "company": idea.get("company"), "sector": idea.get("sector", "Unbekannt"),
                 "currency": "EUR" if ".DE" in ticker or ticker.startswith("SIE") else "USD",
                 "country": "DE" if ".DE" in ticker else "US",
                 "benchmark_id": "VWCE" if ".DE" in ticker else "ACWI",
                 "discovery_class": "editorially_existing", "curated_id": idea.get("id"),
                 "editorial_status": idea.get("lifecycle", "active")})

    for ticker, record in (profiles.get("companies") or {}).items():
        symbol = norm(ticker)
        if symbol in by_ticker:
            continue
        if not record.get("name") or not record.get("sector"):
            continue
        suffix = symbol.endswith((".DE", ".MU", ".PA", ".AS"))
        put({"id": "profile-" + symbol.lower().replace(".", "-"),
             "ticker": symbol, "company": record["name"], "sector": record["sector"],
             "currency": "EUR" if suffix else "USD", "country": "EU" if suffix else "US",
             "benchmark_id": "VWCE" if suffix else "ACWI",
             "discovery_class": "published_business_profile",
             "verification": "published_profile_needs_ticker_recheck"})

    # Verified editorial articles may identify a symbol outside the original universe.
    # Only add it if a grounded business profile exists: prevents guessing an issuer
    # from a brand mention or an untrusted RSS headline.
    for story in editorial:
        for raw in story.get("symbols", []):
            symbol = norm(raw)
            if symbol in by_ticker or symbol not in (profiles.get("companies") or {}):
                continue
            p=profiles["companies"][symbol]
            suffix=symbol.endswith((".DE", ".MU", ".PA", ".AS"))
            put({"id":"story-"+symbol.lower().replace(".", "-"),
                 "ticker":symbol,"company":p["name"],"sector":p["sector"],
                 "currency":"EUR" if suffix else "USD","country":"EU" if suffix else "US",
                 "benchmark_id":"VWCE" if suffix else "ACWI",
                 "discovery_class":"published_business_profile"})
    return list(by_ticker.values())

def prices_by_ticker(pricefile):
    out = {}
    for key, item in (pricefile.get("assets") or {}).items():
        if not isinstance(item, dict):
            continue
        ticker=norm(item.get("ticker"))
        if ticker not in out or len(item.get("points") or [])>len(out[ticker].get("points") or []):
            out[ticker]=item
    return out

def clean_points(row):
    result={}
    for r in row.get("points", []):
        day=parse_date(r.get("d"))
        price=r.get("c")
        if day and type(price) in (int,float) and math.isfinite(price) and price>0:
            result[day.isoformat()]=float(price)
    return sorted(result.items())

def price_at(items, date, lag=4):
    if not items or not date:
        return None
    dates=[x[0] for x in items]
    pos=bisect.bisect_right(dates,date)-1
    if pos<0:
        return None
    pday=dt.date.fromisoformat(items[pos][0])
    if (dt.date.fromisoformat(date)-pday).days>lag:
        return None
    return items[pos][1]

def aligned_return(points, benchmark, lookback=63):
    if len(points)<lookback+1 or len(benchmark)<lookback+1:
        return None
    d0=points[-(lookback+1)][0]
    d1=points[-1][0]
    b0=price_at(benchmark,d0,lag=4)
    b1=price_at(benchmark,d1,lag=4)
    if not b0 or not b1:
        return None
    return pct(b0,b1)

def metrics(item, benchmark):
    points=clean_points(item) if item else []
    if len(points)<200:
        return {"status":"needs_price_history","available_sessions":len(points),"asof":points[-1][0] if points else None}
    close=points[-1][1]
    avg50=sum(x[1] for x in points[-50:])/50
    avg200=sum(x[1] for x in points[-200:])/200
    p21=pct(points[-22][1],close)
    p63=pct(points[-64][1],close)
    p126=pct(points[-127][1],close)
    bench=aligned_return(points,clean_points(benchmark) if benchmark else [],63)
    excess=rounded(p63-bench,2) if p63 is not None and bench is not None else None
    peaks=max(x[1] for x in points[-min(len(points),252):])
    drawdown=pct(peaks,close)
    daily=[math.log(points[i][1]/points[i-1][1]) for i in range(len(points)-20,len(points))]
    dev=math.sqrt(sum((x-sum(daily)/len(daily))**2 for x in daily)/len(daily))
    vol=rounded(dev*math.sqrt(252)*100,1)
    return {"status":"history_available","asof":points[-1][0],"sessions":len(points),
       "adjusted_close":rounded(close,4),"return_21d_pct":p21,"return_63d_pct":p63,
       "return_126d_pct":p126,"benchmark_63d_pct":bench,"relative_63d_pp":excess,
       "ma50":rounded(avg50,4),"ma200":rounded(avg200,4),
       "above_ma50":close>avg50,"above_ma200":close>avg200,
       "drawdown_from_252d_high_pct":drawdown,"volatility_21d_annualized_pct":vol}

def signal_priority(m, editorial_event):
    if m["status"]!="history_available":
        return "insufficient_data",None
    # Ranking is TECHNICAL research order, explicitly not intrinsic value or a buy score.
    base=(20 if m["above_ma50"] else 0)+(15 if m["above_ma200"] else 0)
    outperformance=m["relative_63d_pp"]
    relative=max(0,min(30,15+outperformance*1.0)) if outperformance is not None else 0
    vol=m["volatility_21d_annualized_pct"] or 0
    risk=max(0,min(20,20-0.35*vol))
    evidence=10 if editorial_event else 0
    score=int(round(min(100,max(0,base+relative+risk+evidence))))
    if score>=68 and editorial_event:
        status="A_research_first"
    elif score>=52:
        status="B_watchlist"
    else:
        status="C_screen_only"
    return status,score

def closest_editorial(ticker, editorial, profiles):
    search={ticker}
    # One ticker may be quoted as e.g. NASDAQ:MSFT or SIE.DE.
    search.add(ticker.split(".")[0])
    match=[]
    for story in editorial:
        all_syms={norm(s).split(":")[-1] for s in story.get("symbols", [])}
        if search.isdisjoint(all_syms):
            continue
        when=parse_date(story.get("published"))
        if not when or not str(story.get("url","")).startswith("https://"):
            continue
        match.append((when,story))
    match.sort(key=lambda x:x[0],reverse=True)
    if not match:
        return None
    date,story=match[0]
    if (dt.date.today()-date).days>120:
        return None
    return {"id":story.get("id"),"title":story.get("title"),
      "date":date.isoformat(),"url":story["url"],"source":story.get("source"),
      "evidence_status":"published_editorial_not_independent_primary_audit"}

def unverified_mention(company, candidates):
    name=str(company or "").strip()
    words=[w for w in re.findall(r"[A-Za-zÄÖÜäöü0-9]+",name) if len(w)>3]
    if not words:
        return None
    for candidate in candidates[:100]:
        title=candidate.get("title","")
        if not isinstance(title,str):
            continue
        if any(re.search(r"\b"+re.escape(w)+r"\b",title,re.IGNORECASE) for w in words):
            return {"id":candidate.get("id"),"date":str(candidate.get("published_at",""))[:10],
              "status":"unverified_headline_only"}
    return None

def classify(ideas, ticker, entry):
    byid={str(x.get("id")):x for x in ideas.get("ideas",[])}
    idea=byid.get(entry.get("curated_id",""))
    return (idea or {})

def compare_to_benchmarks(m, item, benchmark_specs, provider):
    if m["status"]!="history_available":
        return []
    basis=clean_points(item)
    output=[]
    for b in benchmark_specs:
        if b.get("currency")!=m.get("currency"):
            continue
        ticker=norm(b.get("ticker"))
        hist=clean_points(provider.get(ticker,{}))
        ret=aligned_return(basis,hist,63)
        if ret is None:
            continue
        output.append({"benchmark_id":b["id"],"name":b["name"],"ticker":ticker,
           "currency":b["currency"],"return_63d_pct":ret,
           "excess_return_pp":rounded(m["return_63d_pct"]-ret,2),
           "source":"Split-/Ausschüttungs-bereinigte Historie desselben Datenanbieters, keine direkte Kaufvergleichsstudie"})
    return output

def priority_sort(c):
    order={"A_research_first":0,"B_watchlist":1,"C_screen_only":2,"insufficient_data":3,"archived":4}
    return (order.get(c["research_priority"],5),-(c.get("technical_research_score") or -1),c["company"])

def build_radar(root=ROOT):
    data=root/"data"
    universe=load(data/"research-universe-v86.json",{})
    prices=load(data/"prices.json",{})
    ideas=load(data/"ideas.json",{})
    profiles=load(data/"company-profiles-v82.json",{})
    storyfiles=[load(data/"daily.json",{}),load(data/"editorial-core-v43.json",{})]
    stories=[]
    for f in storyfiles:
        stories.extend(x for x in f.get("stories",[]) if isinstance(x,dict))
    inbox=load(data/"editorial-candidates.json",{})
    provider=prices_by_ticker(prices)
    candidates=[]
    for entry in discovery_universe(universe,profiles,ideas,stories):
        t=norm(entry.get("ticker"))
        if not t:
            continue
        benchmark_id=entry.get("benchmark_id") or ("VWCE" if entry.get("currency")=="EUR" else "ACWI")
        bspec=next((b for b in universe.get("benchmarks",[]) if b.get("id")==benchmark_id),None)
        info=provider.get(t, {})
        m=metrics(info,provider.get(norm(bspec["ticker"]),{}) if bspec else {})
        m["currency"]=entry.get("currency") or info.get("currency")
        article=closest_editorial(t,stories,profiles)
        weak=unverified_mention(entry["company"],inbox.get("candidates",[]))
        status,score=signal_priority(m,article)
        idea=classify(ideas,t,entry)
        archived=str(idea.get("lifecycle","active")).lower() in ("archived","retired","rejected")
        if archived:
            status="archived"
        alt=compare_to_benchmarks(m,info,universe.get("benchmarks",[]),provider)
        candidates.append({"id":entry["id"],"ticker":t,"company":entry["company"],
         "sector":entry.get("sector","Unbekannt"),"country":entry.get("country"),
         "currency":m.get("currency"),"origin":entry.get("discovery_class","universe"),
         "curated_id":entry.get("curated_id"),
         "has_curated_dossier":bool(idea),
         "lifecycle":"archived" if archived else "active",
         "research_priority":status,"technical_research_score":score,
         "signals":m,"editorial_evidence":article,
         "unverified_discovery_hint":weak,
         "benchmarks":alt,
         "next_review":idea.get("next") if idea else (
           "Originalbericht, belastbaren Gewinn/Cashflow, aktuelle Bewertung und Risiken prüfen."
           if m["status"]=="history_available" else
           "Historische Kursreihe und originalen Emittentenbericht für diesen Ticker prüfen."),
         "risks":idea.get("counter") if idea else None,
         "research_disclaimer":"Technische Suchpriorität, keine geprüfte Unterbewertung oder Kaufempfehlung."})
    candidates.sort(key=priority_sort)
    # Sector caps for the front-page queue; the complete universe remains accessible.
    picks=[];sector_counts=defaultdict(int)
    for c in candidates:
        if c["research_priority"] not in ("A_research_first","B_watchlist"):
            continue
        if sector_counts[c["sector"]]>=2:
            continue
        picks.append(c["id"]);sector_counts[c["sector"]]+=1
        if len(picks)>=12:
            break
    benchmark_meta=[]
    for b in universe.get("benchmarks",[]):
        r=provider.get(norm(b.get("ticker")),{})
        benchmark_meta.append({**b,"last_price_date":r.get("asof"),
           "sessions":len(r.get("points",[])),"source":r.get("source")})
    return {"schema_version":1,"asof":max((x["signals"].get("asof") or "" for x in candidates),default=""),
      "methodology_version":1,"methodology":"Openes Startuniversum + veröffentlichte Unternehmensprofile/Artikel; technisches Suchsignal aus 50/200-Tage-Trend, 63-Tage-Relativperformance, 21-Tage-Volatilität und geprüfter redaktioneller Ereigniszuordnung. A/B/C = RESEARCHPRIORITÄT, niemals Renditeprognose oder Kaufrating. Vor Annahme einer Investmentthese: Cashflow, Bilanz, Bewertung und Primärquellen separat prüfen.",
      "quote_method":"Anbieterbereinigte Tageskurse nur zum Vergleich der Performance. Nicht mit regulären Schlusskursen aus data/market-valuations-v84.json oder anderen Handelsplätzen vermischen. Währungsgleiche Vergleichspaare; FX-Effekt und ETF-Kosten gesondert zu bewerten.",
      "total_issuers":len(candidates),
      "with_price_history":sum(1 for x in candidates if x["signals"]["status"]=="history_available"),
      "research_priority_count":sum(1 for x in candidates if x["research_priority"]=="A_research_first"),
      "missing_quote_count":sum(1 for x in candidates if x["signals"]["status"]=="needs_price_history"),
      "front_page_candidate_ids":picks,
      "benchmark_universe":benchmark_meta,
      "candidates":candidates}

def update_ledger(existing, radar):
    # Only stable status/confirmed editorial changes generate events; movements in a
    # daily quote do NOT rewrite an investment thesis or simulate performance.
    events=list(existing.get("events",[]))
    last={}
    for e in events:
        if e.get("ticker"):
            last[e["ticker"]]=e
    for c in radar["candidates"]:
        status=c["research_priority"]
        if status=="insufficient_data":
            continue
        prior=last.get(c["ticker"])
        evidence=c.get("editorial_evidence") or {}
        signature=f'{status}|{evidence.get("id") or ""}|{c.get("lifecycle")}'
        if prior and prior.get("signal_signature")==signature:
            continue
        event_type=("entered_radar" if not prior else
                    "archived" if status=="archived" else
                    "new_editorial_evidence" if (prior.get("editorial_story_id")!=evidence.get("id") and evidence.get("id"))
                    else "priority_changed")
        stamp=c["signals"].get("asof")
        if not stamp:
            continue
        code=hashlib.sha256((c["ticker"]+"|"+stamp+"|"+signature).encode()).hexdigest()[:15]
        e={"id":"radar-"+code,"ticker":c["ticker"],"company":c["company"],
           "date":stamp,"event_type":event_type,"signal_signature":signature,
           "from_priority":prior.get("priority") if prior else None,"priority":status,
           "adjusted_close":c["signals"].get("adjusted_close"),"currency":c.get("currency"),
           "benchmark_id":c["benchmarks"][0]["benchmark_id"] if c["benchmarks"] else None,
           "benchmark_adjusted_return_63d_pct":c["benchmarks"][0]["return_63d_pct"] if c["benchmarks"] else None,
           "editorial_story_id":evidence.get("id"),"evidence_url":evidence.get("url"),
           "classification":"public_research_queue_change_not_investment_decision",
           "note":"Automatically observed price/source-driven research priority. No personal portfolio change."}
        if not any(x.get("id")==e["id"] for x in events):
            events.append(e);last[c["ticker"]]=e
    return {"schema_version":1,"policy":"Append-only public research-priority events, not a trading log. The original underwriting, entry decisions, and private thesis journal are separate. Do not backfill investment performance from prices alone.", "events":events}

def main(root=ROOT):
    radar=build_radar(root)
    ledger_path=root/"data"/"thesis-ledger-v86.json"
    radar_path=root/"data"/"research-radar-v86.json"
    prior=load(ledger_path,{"schema_version":1,"events":[]})
    ledger=update_ledger(prior,radar)
    a=write_changed(radar_path,radar)
    b=write_changed(ledger_path,ledger)
    print(f"Research scanner: {radar['total_issuers']} issuers / "
          f"{radar['with_price_history']} price-ready / "
          f"{radar['research_priority_count']} first-research / "
          f"{len(ledger['events'])} historic events; "
          f"radar_changed={a} ledger_changed={b}. No trades or editorial publications.")

if __name__=="__main__":
    main()
