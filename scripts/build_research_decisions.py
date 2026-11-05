#!/usr/bin/env python3
"""Source-tied long-term investment decision triage; no invented buy ratings.

The market radar (price discovery), editorial ideas (analyst hypothesis),
reported fundamentals, and source audits remain distinct evidence layers.
This process cannot promote a stock to 'cheap' or 'buy' using momentum alone.
Run after scan_research.py, append only meaningful thesis/audit revisions.
"""
from __future__ import annotations
import datetime as dt
import hashlib
import json
import math
import pathlib

ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/"data"/"research-decisions-v87.json"
EVENTS=ROOT/"data"/"investment-thesis-events-v87.json"

def read(path, default):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError, TypeError):
        return default

def write_if_changed(path, data):
    result=json.dumps(data,ensure_ascii=False,indent=2,sort_keys=False)+"\n"
    before=path.read_text(encoding="utf-8") if path.exists() else ""
    if before==result:
        return False
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(result,encoding="utf-8")
    return True

def number(value):
    return float(value) if type(value) in (int,float) and math.isfinite(value) else None

def safe_url(value):
    return isinstance(value,str) and value.startswith("https://") and len(value)<1500

def parsedate(value):
    try: return dt.date.fromisoformat(str(value)[:10])
    except (TypeError, ValueError): return None

def quote_metrics(stock):
    if not stock:return {}
    q=stock.get("quote") or {}
    f=stock.get("fundamentals") or {}
    price=number(q.get("close"));shares=number(f.get("shares_m"))
    eps=number(f.get("eps_ttm"));fcf=number(f.get("free_cf_m"))
    if not all([price,shares]) or price<=0 or shares<=0:return {}
    cap_m=price*shares
    return {"price":price,"price_date":q.get("date"),"currency":q.get("currency"),
      "exchange":q.get("exchange"),"market_cap_m":round(cap_m,2),
      "ttm_pe":round(price/eps,2) if eps and eps>0 else None,
      "ttm_fcf_yield_pct":round(100*fcf/cap_m,2) if fcf is not None else None,
      "ttm_fcf_m":fcf,"eps_ttm":eps,"fundamental_observed_date":f.get("observed_date"),
      "source_price":q.get("source_url") if safe_url(q.get("source_url")) else None,
      "source_fundamentals":f.get("source_url") if safe_url(f.get("source_url")) else None,
      "primary_verified_fields":f.get("primary_verified_fields") or [],
      "cash_flow_method_warning":f.get("caution") or "",
      "date_alignment_warning": bool(parsedate(f.get("observed_date")) and
         parsedate(q.get("date")) and parsedate(f["observed_date"])>parsedate(q["date"]))}

# Explicit comparison families are only for locating research alternatives, not
# statistically comparable peer valuation multiples. A stock with no verified
# metrics must never inherit one from a peer.
FAMILIES={
 "microsoft":"large_tech_platforms","amazon":"large_tech_platforms","meta":"large_tech_platforms",
 "alphabet":"large_tech_platforms","nvidia":"semiconductor_supply_chain","aixtron":"semiconductor_supply_chain",
 "siemens":"industrial_automation","kion":"industrial_automation","cgnx":"industrial_automation"
}
FAMILY_NAMES={"large_tech_platforms":"Große Software-, Cloud- und Plattformanbieter",
"semiconductor_supply_chain":"Halbleiter- und KI-Lieferkette",
"industrial_automation":"Industrie- und Automatisierungstechnik"}

def comparable_candidates(item,radar,prices):
    group=FAMILIES.get(item["id"])
    if not group:return []
    out=[]
    for candidate in radar:
        if candidate["id"]==item["id"] or FAMILIES.get(candidate["id"])!=group:continue
        q=quote_metrics(prices.get(candidate["id"]))
        if not q or q["currency"]!=item.get("currency"):continue
        out.append({"id":candidate["id"],"ticker":candidate["ticker"],"company":candidate["company"],
                    "sector":candidate.get("sector"),"currency":q["currency"],"price_date":q["price_date"],
                    "ttm_pe":q["ttm_pe"],"ttm_fcf_yield_pct":q["ttm_fcf_yield_pct"],
                    "price_source":q["source_price"],
                    "limitations":"Nur indikative Vergleichsgruppe, kein validierter Peer-Multiple-Fair-Value."})
    return sorted(out,key=lambda x:x["company"])[:5]

def evidence_stage(item,idea,info,audit,price):
    if item.get("lifecycle")=="archived":
        return "archived","Archiviert – frühere Einschätzung und Belege bleiben sichtbar."
    if not idea:
        if item.get("editorial_evidence"):
            return "editorial_screen","Quellenbezogene Nachricht vorhanden. Bilanz, Wachstum und Bewertung vor einer Investmentthese erst prüfen."
        return "technical_screen","Technischer Suchhinweis. Noch keine geprüfte Investmentthese oder Unternehmensbewertung."
    has_primary=audit and audit.get("financial_status")=="primary_ttm_reconciled"
    had_price=bool(price.get("price_date"))
    if has_primary and had_price and item.get("editorial_evidence"):
        return "source_based_watch","Unternehmens- und Cashflowdaten teilweise geprüft. Der faire Wert und die Sicherheitsmarge sind noch nicht unabhängig bestätigt."
    if has_primary:
        return "financial_data_review","Primär-Cashflow vorhanden. Preis- und Bewertungskriterien müssen unabhängig vervollständigt werden."
    return "financial_audit_pending","Analystenthese vorhanden. Vollständiger Primärdatenabgleich und belastbarer fairer Wert stehen noch aus."

def confidence(item,idea,model,audit,price):
    # Evidence completeness, emphatically NOT attractiveness / return score.
    parts=[
        ("Identifizierter Börsentitel",bool(item.get("ticker")),10),
        ("Veröffentlichte Quellenmeldung",bool(item.get("editorial_evidence")),15),
        ("Begründete These und Gegenargument",bool(idea and idea.get("interest") and idea.get("counter")),20),
        ("Primär-Cashflow abgeglichen",bool(audit and audit.get("financial_status")=="primary_ttm_reconciled"),25),
        ("Datierter Börsenkurs und TTM-Kennzahl",bool(price.get("price_date") and price.get("ttm_pe") is not None),15),
        ("Drei offengelegte operative Szenarien",bool(model and model.get("scenarios") and model.get("baseline")),15)]
    return {"value":sum(pts for _,passed,pts in parts if passed),"max":100,
     "kind":"quellen_vollstaendigkeit_nicht_rendite_score",
     "criteria":[{"label":label,"ready":passed,"points":pts} for label,passed,pts in parts]}

def decision(root=ROOT):
    d=root/"data"
    radar=read(d/"research-radar-v86.json",{})
    idea_data=read(d/"ideas.json",{})
    audit_data=read(d/"fair-value-audit-v85.json",{})
    model_data=read(d/"valuation-scenarios-v83.json",{})
    prices=read(d/"market-valuations-v84.json",{})
    byidea={x["id"]:x for x in idea_data.get("ideas",[]) if isinstance(x,dict) and x.get("id")}
    bymodel={x["id"]:x for x in model_data.get("models",[]) if isinstance(x,dict) and x.get("id")}
    byaudit={x["id"]:x for x in audit_data.get("records",[]) if isinstance(x,dict) and x.get("id")}
    byprice={x["id"]:x for x in prices.get("stocks",[]) if isinstance(x,dict) and x.get("id")}
    universe=radar.get("candidates",[])
    rows=[]
    for item in universe:
        if not item.get("id") or not item.get("ticker"):continue
        name=item["id"]; curated_id=item.get("curated_id") or name
        idea=byidea.get(curated_id);model=bymodel.get(curated_id);audit=byaudit.get(curated_id)
        price=quote_metrics(byprice.get(curated_id))
        stage,explanation=evidence_stage(item,idea,model,audit,price)
        suff=confidence(item,idea,model,audit,price)
        status=item.get("research_priority","insufficient_data")
        published=item.get("editorial_evidence") or {}
        latest_source=(idea or {}).get("source") or published.get("url")
        if not safe_url(latest_source):latest_source=None
        supported_price=price.get("ttm_pe") is not None
        valuation_status=("illustrative_model_not_fair_value" if audit and audit.get("dcf") else
                          "audited_cashflow_no_fair_value" if audit and audit.get("financial_status")=="primary_ttm_reconciled" else
                          "no_source_audited_fair_value")
        candidates=radar.get("candidates",[])
        alt=[{"id":v["id"],"name":v["name"],"ticker":v["ticker"],"currency":v["currency"],
              "return_63d_pct":v["return_63d_pct"],"excess_return_pp":v["excess_return_pp"]}
              for v in item.get("benchmarks",[]) if v.get("currency")==item.get("currency") and v.get("return_63d_pct") is not None]
        risk=(idea or {}).get("counter") or item.get("risks") or "Geschäftsmodell, Bewertung und Bilanz sind noch zu verifizieren."
        rows.append({
          "id":name,"ticker":item["ticker"],"company":item.get("company"),
          "sector":item.get("sector"),"currency":item.get("currency"),"lifecycle":item.get("lifecycle"),
          "radar_priority":status,"research_stage":stage,"decision":explanation,
          "conclusion":"Kein belegtes Kaufurteil. Weiter recherchieren / abwarten." if stage!="archived" else "Archiviert: kein neues Investmenturteil.",
          "evidence_readiness":suff,
          "thesis":(idea or {}).get("interest") if idea else None,
          "counter_thesis":risk if idea else None,
          "thesis_invalidated":False, # NEVER auto-claim invalidation from price trend
          "why_now":published.get("title") if published else None,
          "what_would_confirm":(idea or {}).get("next") if idea else "Echten Geschäftsbericht prüfen, danach Cashflows und Bewertungsniveau vergleichen.",
          "what_would_invalidate":risk if idea else "Ohne Primärquellen kann noch keine Investmentthese widerlegt werden.",
          "financials":price,
          "primary_financial_status":(audit or {}).get("financial_status") or "not_audited",
          "valuation_status":valuation_status,
          "valuation_gaps":(audit or {}).get("gaps") or ["Primärbericht/Cashflow", "Aktuelle Aktienzahl und Bilanz",
              "Nachvollziehbare künftige Cashflows", "Bewertung mit Sicherheitsspanne"],
          "editorial_source":{"title":published.get("title"),"date":published.get("date"),"url":published.get("url")}
              if published and safe_url(published.get("url")) else None,
          "primary_source_urls":[s["url"] for s in (audit or {}).get("primary_sources",[]) if safe_url(s.get("url"))],
          "original_idea_source":latest_source,
          "comparison_family":FAMILY_NAMES.get(FAMILIES.get(name)) if FAMILIES.get(name) else None,
          "peer_valuations":comparable_candidates(item,universe,byprice),
          "etf_alternatives":alt,
          "relative_performance":item.get("since_first_screen"),
          "radar_asof":item.get("signals",{}).get("asof") or radar.get("asof"),
          "next_review":item.get("next_review"),
          "methodology": "Research-Reife, nicht Anlageattraktivität. Kein Kauf-/Verkaufssignal ohne dokumentierten fairen Wert und Margin of Safety."})
    return {
      "schema_version":1,"asof":radar.get("asof"),
      "purpose":"Dynamische, nicht auf neun Aktien begrenzte Prüf- und Vergleichsschicht zwischen öffentlichem Radar und belastbarem Unternehmensresearch.",
      "policy":"Technische Research-Priorität != faire Bewertung. Sekundärpreise und Cashflows sind als solche beschriftet; ohne normalisierte Cashflows, vollständige Equity-Bridge und Quellen-Prüfung kein Buy, Sell, überbewertet oder unterbewertet.",
      "status_counts":{stage:sum(c["research_stage"]==stage for c in rows)
       for stage in ["source_based_watch","financial_data_review","financial_audit_pending","editorial_screen","technical_screen","archived"]},
      "benchmark_method":"Nur identische Notierungswährung und gleiches 63-Handelstage-Fenster. ETF-Rendite ist historische Opportunitätskosteninformation, keine Prognose und kein Risikomatch.",
      "rows":rows}

def event_tracker(old, current):
    events=list(old.get("events",[]))
    last={x["issuer_id"]:x for x in events if x.get("issuer_id")}
    for r in current.get("rows",[]):
        if not r.get("thesis"):continue # radar-only ideas aren't analyst thesis updates
        fingerprint={
            "thesis":r["thesis"],"counter_thesis":r["counter_thesis"],
            "what_would_confirm":r["what_would_confirm"],
            "primary_financial_status":r["primary_financial_status"],
            "valuation_status":r["valuation_status"],
            "lifecycle":r["lifecycle"],
            "source_url":r.get("original_idea_source")}
        sig=hashlib.sha256(json.dumps(fingerprint,sort_keys=True,ensure_ascii=False).encode()).hexdigest()[:18]
        prior=last.get(r["id"])
        if prior and prior.get("signature")==sig:continue
        event_type=("thesis_created" if not prior else "archived" if r["lifecycle"]=="archived" else
                    "evidence_stage_changed" if r["primary_financial_status"]!=prior.get("primary_financial_status") else
                    "thesis_revised")
        proof=r["original_idea_source"] or (r.get("editorial_source") or {}).get("url")
        event={"id":"evidence-"+hashlib.sha256((r["id"]+"|"+sig).encode()).hexdigest()[:16],
               "issuer_id":r["id"],"ticker":r["ticker"],"company":r["company"],
               "date":current.get("asof"),"event_type":event_type,
               "signature":sig,"prior_signature":prior.get("signature") if prior else None,
               "thesis":r["thesis"],"counter_thesis":r["counter_thesis"],
               "what_would_confirm":r["what_would_confirm"],
               "primary_financial_status":r["primary_financial_status"],
               "valuation_status":r["valuation_status"],
               "evidence_url":proof,"classification":"public_source_research_revision_not_trade",
               "note":"Eine dokumentierte These/Prüfstufe änderte sich; keine Anlageentscheidung oder Anlageberatung."}
        if not any(e.get("id")==event["id"] for e in events):
            events.append(event);last[r["id"]]=event
    return {"schema_version":1,"policy":"Append-only fundamental thesis and source readiness revisions, without invented trading decisions, backtest returns or proprietary private user data.", "events":events}

def main(root=ROOT):
    current=decision(root)
    old=read(root/"data"/"investment-thesis-events-v87.json",{"events":[]})
    events=event_tracker(old,current)
    a=write_if_changed(root/"data"/"research-decisions-v87.json",current)
    b=write_if_changed(root/"data"/"investment-thesis-events-v87.json",events)
    print(f"Investment decision triage: {len(current['rows'])} names, {len(events['events'])} reviewed source revisions, decisions_changed={a}, events_changed={b}. No invented fair values/trades.")

if __name__=="__main__":
    main()
