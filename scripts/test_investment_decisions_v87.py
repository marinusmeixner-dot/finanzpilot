"""Offline invariant tests for source-gated open-universe investment decisions."""
from __future__ import annotations
import datetime as dt
import importlib.util
import json
import pathlib
import tempfile
import unittest

path=pathlib.Path(__file__).with_name("build_research_decisions.py")
spec=importlib.util.spec_from_file_location("research_decisions",path)
mod=importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

class DecisionTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root=pathlib.Path(self.temp.name)
        (self.root/"data").mkdir()
    def data(self,name,content):
        (self.root/"data"/name).write_text(json.dumps(content,ensure_ascii=False),encoding="utf-8")
    def fixtures(self):
        candidates=[
         {"id":"alpha","ticker":"ALP","company":"Alpha Inc.","sector":"Software","currency":"USD",
          "lifecycle":"active","curated_id":"alpha","research_priority":"A_research_first",
          "editorial_evidence":{"id":"news1","title":"Alpha Earnings","date":"2026-11-04","url":"https://issuer.example/report"},
          "signals":{"asof":"2026-11-04"},"next_review":"Margin audit",
          "benchmarks":[{"benchmark_id":"ACWI","ticker":"ACWI","name":"Global ETF","currency":"USD","return_63d_pct":3.2,"excess_return_pp":-0.9}]},
         {"id":"beta","ticker":"BET","company":"Beta SE","sector":"Industrial","currency":"EUR","lifecycle":"active",
          "research_priority":"B_watchlist","curated_id":None,"signals":{"asof":"2026-11-04"},
          "benchmarks":[{"benchmark_id":"VWCE","ticker":"VWCE.DE","name":"Global EUR ETF","currency":"EUR","return_63d_pct":5.0,"excess_return_pp":1.0}]}]
        self.data("research-radar-v86.json",{"schema_version":1,"asof":"2026-11-04","candidates":candidates})
        self.data("ideas.json",{"ideas":[{"id":"alpha","ticker":"ALP","company":"Alpha Inc.",
          "interest":"Strong renewal contracts","counter":"Debt may rise",
          "next":"Margin audit","source":"https://issuer.example/report"}]})
        self.data("valuation-scenarios-v83.json",{"models":[{"id":"alpha","baseline":{"revenue_m":100},"scenarios":{"base":{}}}]})
        self.data("fair-value-audit-v85.json",{"records":[{"id":"alpha","financial_status":"primary_ttm_reconciled",
           "gaps":["WACC"],"primary_sources":[{"url":"https://issuer.example/fy"}]}]})
        self.data("market-valuations-v84.json",{"stocks":[{"id":"alpha",
          "quote":{"close":55,"currency":"USD","date":"2026-11-04","exchange":"NASDAQ","source_url":"https://broker.example/ALP"},
          "fundamentals":{"shares_m":100,"eps_ttm":5,"free_cf_m":130,"observed_date":"2026-11-05",
                          "source_url":"https://issuer.example/fy"}}]})
        return candidates
    def test_dynamic_count_currency_gates_and_noncurated(self):
        self.fixtures()
        result=mod.decision(self.root)
        self.assertEqual(len(result["rows"]),2)
        a,b=result["rows"]
        self.assertEqual(a["research_stage"],"source_based_watch")
        self.assertEqual(a["financials"]["ttm_pe"],11)
        self.assertTrue(a["financials"]["date_alignment_warning"])
        self.assertEqual(a["evidence_readiness"]["value"],100)
        self.assertEqual(b["research_stage"],"technical_screen")
        self.assertEqual(b["evidence_readiness"]["value"],10)
        self.assertEqual(a["etf_alternatives"][0]["currency"],"USD")
        self.assertEqual(b["etf_alternatives"][0]["currency"],"EUR")
        self.assertFalse(a["thesis_invalidated"])
        self.assertFalse(b["thesis_invalidated"])
        # Adding a new profile-research candidate must never require nine fixed names.
        r=json.loads((self.root/"data/research-radar-v86.json").read_text())
        r["candidates"].append({"id":"gamma","ticker":"GAM","company":"Gamma plc","currency":"USD",
          "lifecycle":"active","research_priority":"insufficient_data","signals":{"status":"needs_price_history"},
          "benchmarks":[]})
        self.data("research-radar-v86.json",r)
        self.assertEqual(len(mod.decision(self.root)["rows"]),3)
    def test_append_only_thesis_and_no_false_revision_for_price_update(self):
        self.fixtures()
        mod.main(self.root)
        f=self.root/"data/investment-thesis-events-v87.json"
        original=json.loads(f.read_text())
        self.assertEqual(len(original["events"]),1)
        before=f.read_bytes()
        mod.main(self.root)
        self.assertEqual(before,f.read_bytes(),"Same evidence never appends a new event")
        financial=json.loads((self.root/"data/market-valuations-v84.json").read_text())
        financial["stocks"][0]["quote"]["close"]=56
        self.data("market-valuations-v84.json",financial)
        mod.main(self.root)
        self.assertEqual(before,f.read_bytes(),"Price fluctuations do not rewrite fundamental thesis")
        ideas=json.loads((self.root/"data/ideas.json").read_text())
        ideas["ideas"][0]["counter"]="Debt has increased materially"
        self.data("ideas.json",ideas)
        mod.main(self.root)
        after=json.loads(f.read_text())
        self.assertEqual(len(after["events"]),2)
        self.assertEqual(after["events"][:1],original["events"])
        self.assertEqual(after["events"][-1]["event_type"],"thesis_revised")
        self.assertEqual(after["events"][-1]["counter_thesis"],"Debt has increased materially")
    def test_guards_no_false_buy_or_cross_currency_peers(self):
        self.fixtures()
        x=mod.decision(self.root)
        for row in x["rows"]:
            self.assertNotEqual(row["valuation_status"],"buy")
            self.assertIn("Kaufurteil",row["conclusion"])
            self.assertTrue(all(p["currency"]==row["currency"] for p in row["peer_valuations"]))
        self.assertEqual(x["status_counts"]["technical_screen"],1)

if __name__=="__main__":
    unittest.main()
