#!/usr/bin/env python3
"""FinanzPilot: source-first opportunity diligence queue, not a buy/return ranking.

Inputs: published articles, dynamic research radar and audited decision ledger.
The queue expands with the scanner. Unverified RSS never becomes fundamental
evidence. Produces a deterministic, reproducible public snapshot; no private
portfolio, trade or appraisal is modified.
"""
from __future__ import annotations
import datetime as dt
import json
import pathlib
from collections import Counter

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "opportunity-queue-v89.json"

def read(path, default):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError, TypeError):
        return default

def date(raw):
    try: return dt.date.fromisoformat(str(raw)[:10])
    except (TypeError, ValueError): return None

def source_ok(v):
    return isinstance(v, str) and v.startswith("https://") and len(v) <= 1800

def business_gate(candidate, decision, days_old):
    article=candidate.get("editorial_evidence")
    history=candidate.get("signals") or {}
    has_history=history.get("status") == "history_available"
    if candidate.get("lifecycle")=="archived":
        return "archived", "Archiviert – ursprüngliche Beobachtung bleibt nachvollziehbar"
    if not has_history:
        return "source_gap", "Verifizierte, ausreichend lange Kurshistorie fehlt"
    if article and source_ok(article.get("url")) and days_old is not None and 0 <= days_old <= 21:
        return "news_catalyst", "Neuer veröffentlichter Unternehmensanlass – wirtschaftlichen Effekt prüfen"
    if article and source_ok(article.get("url")):
        return "old_catalyst", "Älterer Unternehmensanlass – nach neueren Fakten suchen"
    if decision and decision.get("thesis"):
        return "fundamental_watch", "Existierende Fundamentalthese – neue Zahlen und Bewertung prüfen"
    return "technical_only", "Reines Kurs-/Branchensignal – kein belegter Geschäftskatalysator"

def steps(candidate, decision, kind):
    audit=decision.get("primary_financial_status") or "not_audited"
    gaps=[str(x).strip() for x in decision.get("valuation_gaps",[]) if isinstance(x,str) and x.strip()]
    first=("Originalbericht/Emittentenzuordnung zum Signal und mögliche Umsatzwirkung prüfen"
      if kind in ("technical_only","source_gap") else
      "Unternehmensmeldung mit neuerem Geschäftsbericht und Markterwartung abgleichen")
    second=("Vorliegende TTM-Cashflows und Kapitalbindung auf Nachhaltigkeit testen"
       if audit=="primary_ttm_reconciled" else
       "CFO, Capex, Free Cashflow und Verschuldung aus Primärberichten belegen")
    third=gaps[0] if gaps else "Kurs, Bewertungsmaßstab, ETF-Alternative und Widerlegungskriterien dokumentieren"
    return [first,second,third]

def evaluate_candidate(candidate, decision, asof):
    source=candidate.get("editorial_evidence") or {}
    stamp=date(source.get("date"));today=date(asof)
    days=(today-stamp).days if today and stamp else None
    if days is not None and days < 0:
        days=None
    kind,reason=business_gate(candidate,decision,days)
    if kind in ("news_catalyst","fundamental_watch"):
        bucket="review_now"
    elif kind in ("old_catalyst","technical_only"):
        bucket="watch_and_verify"
    elif kind=="source_gap":
        bucket="source_gap"
    else:
        bucket="archived"
    source_url=source.get("url") if source_ok(source.get("url")) else None
    peer=decision.get("peer_valuations") or []
    etfs=decision.get("etf_alternatives") or []
    priority=candidate.get("research_priority")
    price=(candidate.get("signals") or {}).get("asof")
    audit=decision.get("primary_financial_status") or "not_audited"
    return {
        "id":candidate["id"],"ticker":candidate["ticker"],"company":candidate["company"],
        "sector":candidate.get("sector"),"bucket":bucket,"review_kind":kind,
        "radar_priority":priority,"decision_stage":decision.get("research_stage") or "not_audited",
        "primary_cashflow_ready":audit=="primary_ttm_reconciled",
        "price_asof":price,"evidence_date":source.get("date") if source_url else None,
        "evidence_age_days":days if source_url else None,
        "evidence_url":source_url,
        "evidence_title":source.get("title") if source_url else None,
        "why_now":source.get("title") if kind=="news_catalyst" else reason,
        "first_rejection":decision.get("what_would_invalidate") or candidate.get("risks") or
            "Kein geprüfter Umsatz-/Cashflow-Nachweis und keine unabhängige Bewertung",
        "needs_before_investment":decision.get("valuation_gaps") or
            ["Verifizierter Geschäftsbericht","Normalisierter Cashflow","Aktuelle faire Bewertung"],
        "next_checks":steps(candidate,decision,kind),
        "alternatives":{
            "peer_count":len(peer),
            "etf_count":len(etfs),
            "benchmark_names":[x.get("name") for x in etfs[:2] if x.get("name")]
        },
        "diligence_posture":"Recherchepriorität; ausdrücklich keine Kauf-, Short- oder fairer-Wert-Aussage"
    }

ORDER={"review_now":0,"watch_and_verify":1,"source_gap":2,"archived":3}
KIND_ORDER={"news_catalyst":0,"fundamental_watch":1,"old_catalyst":2,
            "technical_only":3,"source_gap":4,"archived":5}
PRIORITY_ORDER={"A_research_first":0,"B_watchlist":1,"C_screen_only":2,
                "insufficient_data":3,"archived":4}
def sort_key(x):
    return (ORDER.get(x["bucket"],9),
        KIND_ORDER.get(x["review_kind"],9),
        PRIORITY_ORDER.get(x.get("radar_priority"),9),
        x["evidence_age_days"] if isinstance(x.get("evidence_age_days"),int) else 999,
        x["company"].casefold())

def build_queue(root=ROOT):
    data=root/"data"
    radar=read(data/"research-radar-v86.json",{})
    decisions=read(data/"research-decisions-v87.json",{})
    catalogue=read(data/"ideas.json",{})
    rows={r["id"]:r for r in decisions.get("rows",[]) if isinstance(r,dict) and r.get("id")}
    asof=radar.get("asof")
    if not date(asof):
        raise ValueError("Cannot publish a research queue without a dated radar snapshot")
    candidates=radar.get("candidates",[])
    if not isinstance(candidates,list) or not candidates:
        raise ValueError("No radar candidates")
    screened=[evaluate_candidate(c,rows.get(c["id"],{}),asof) for c in candidates if c.get("id") and c.get("ticker")]
    if len(screened)!=len(candidates) or len({c["id"] for c in screened})!=len(screened):
        raise ValueError("Mismatched issuer IDs: no partial queue may be published")
    screened.sort(key=sort_key)
    counts=Counter(x["bucket"] for x in screened)
    current=[x for x in screened if x["bucket"]=="review_now"]
    backed=[x for x in current if x["review_kind"]=="news_catalyst"]
    # Only recent source-backed company events may appear as "fresh news catalysts".
    # Other fundamental watch candidates show separately as analyst follow-ups.
    spotlight=[x["id"] for x in backed[:6]]+[
        x["id"] for x in current if x["review_kind"]=="fundamental_watch"][:max(0,6-len(backed))]
    return {
      "schema_version":1,"asof":asof,"selection_method":"Source-first research queue",
      "total_issuers":len(screened),"curated_dossiers":len(catalogue.get("ideas",[])),
      "bucket_counts":dict(counts),"spotlight_ids":spotlight,
      "methodology":"Neue belegte Unternehmensanlässe (0–21 Kalendertage vor Kursstichtag) zuerst; laufende Fundamentalthesen als separate Nachprüfung; technische Signale ohne geprüften Geschäftsbeleg nur in Beobachtung. Klassifizierung auf Beleg- und Forschungsreife, nicht auf erwarteter Rendite oder Unterbewertung. Peer-/ETF-Daten nur bei identischer Vergleichswährung aus vorherigem Audit.",
      "readiness_warning":"Hier steht kein Kaufurteil. Nur Primärbericht, nachhaltiger Cashflow, Kapitalstruktur, Bewertung, Zeitstempel und Widerlegungskriterien können ein Investmenturteil rechtfertigen.",
      "candidates":screened
    }

def write_changed(path,obj):
    body=json.dumps(obj,ensure_ascii=False,indent=2)+"\n"
    prior=path.read_text(encoding="utf-8") if path.exists() else None
    if body==prior:return False
    path.write_text(body,encoding="utf-8")
    return True

def main():
    obj=build_queue(ROOT)
    changed=write_changed(OUT,obj)
    counts=obj["bucket_counts"]
    print(f"Research queue {len(obj['candidates'])} issuers; current-source reviews={counts.get('review_now',0)}; changed={changed}. No buy rankings.")

if __name__=="__main__":
    main()
