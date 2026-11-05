"""Regression: open-universe research priorities must be source-first and non-advisory."""
from __future__ import annotations
import datetime as dt
import importlib.util
import json
import pathlib
import tempfile
import unittest

CODE=pathlib.Path(__file__).with_name("build_opportunity_queue_v89.py")
spec=importlib.util.spec_from_file_location("opportunity_queue",CODE)
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

def write(path,object_):
    path.write_text(json.dumps(object_,ensure_ascii=False),encoding="utf-8")

class OpportunityQueueTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
        self.root=pathlib.Path(self.temp.name);self.data=self.root/"data";self.data.mkdir()
        self.asof=dt.date(2026,11,4)
    def seed(self,count=13):
        candidates=[]
        decisions=[]
        for k in range(count):
            classification="history_available" if k!=count-1 else "needs_price_history"
            editorial=({"id":f"story-{k}","title":f"Company {k} reported audited revenue",
                         "date":(self.asof-dt.timedelta(days=(2 if k==0 else 29 if k==1 else 1))).isoformat(),
                         "url":f"https://issuer.example/{k}"}
                         if k<2 else None)
            candidates.append({"id":f"firm-{k}","company":f"Firm {k}","ticker":f"FIRM{k}",
                 "sector":"Industrials","lifecycle":"archived" if k==3 else "active",
                 "research_priority":"A_research_first" if k in (0,2) else "B_watchlist",
                 "signals":{"status":classification,"asof":self.asof.isoformat()},
                 "editorial_evidence":editorial})
            decisions.append({"id":f"firm-{k}","research_stage":"technical_screen",
                 "primary_financial_status":"not_audited",
                 "thesis":"Existing sourced fundamental hypothesis" if k==4 else None,
                 "what_would_invalidate":"Missed order execution",
                 "valuation_gaps":["Audit the financial statements"],
                 "peer_valuations":[],"etf_alternatives":[{"name":"World ETF"}]})
        write(self.data/"research-radar-v86.json",{
          "asof":self.asof.isoformat(),"candidates":candidates})
        write(self.data/"research-decisions-v87.json",{"rows":decisions})
        write(self.data/"ideas.json",{"ideas":[{"id":"firm-4"}]})
    def test_no_fixed_nine_and_only_fresh_source_has_news_catalyst(self):
        self.seed(count=23)
        result=module.build_queue(self.root)
        self.assertEqual(result["total_issuers"],23)
        self.assertEqual(len(result["candidates"]),23)
        by={r["id"]:r for r in result["candidates"]}
        self.assertEqual(by["firm-0"]["review_kind"],"news_catalyst")
        self.assertEqual(by["firm-0"]["bucket"],"review_now")
        self.assertEqual(by["firm-1"]["review_kind"],"old_catalyst")
        self.assertNotEqual(by["firm-1"]["bucket"],"review_now")
        self.assertEqual(by["firm-2"]["review_kind"],"technical_only")
        self.assertEqual(by["firm-2"]["bucket"],"watch_and_verify")
        self.assertIsNone(by["firm-2"]["evidence_url"])
        self.assertEqual(by["firm-3"]["bucket"],"archived")
        self.assertEqual(by["firm-4"]["review_kind"],"fundamental_watch")
        self.assertEqual(by["firm-4"]["bucket"],"review_now")
        self.assertEqual(by["firm-22"]["bucket"],"source_gap")
        self.assertEqual(result["spotlight_ids"][:2],["firm-0","firm-4"])
        self.assertEqual(sum(result["bucket_counts"].values()),23)
        self.assertTrue(all(len(r["next_checks"])==3 for r in result["candidates"]))
        self.assertTrue(all("Kauf" in r["diligence_posture"] for r in result["candidates"]))
    def test_unverified_headline_cannot_create_fundamental_opportunity(self):
        self.seed(10)
        radar=json.loads((self.data/"research-radar-v86.json").read_text())
        radar["candidates"][2]["unverified_discovery_hint"]={
            "title":"Firm 2 rockets", "verification":"unverified_candidate","url":"https://newspaper.example"}
        write(self.data/"research-radar-v86.json",radar)
        x=module.build_queue(self.root)
        c=next(z for z in x["candidates"] if z["id"]=="firm-2")
        self.assertEqual(c["review_kind"],"technical_only")
        self.assertIsNone(c["evidence_url"])
        self.assertNotIn(c["id"],x["spotlight_ids"])
    def test_idempotent_output_and_primary_data_gap(self):
        self.seed()
        obj=module.build_queue(self.root)
        file=self.data/"opportunity-queue-v89.json"
        self.assertTrue(module.write_changed(file,obj))
        content=file.read_bytes()
        self.assertFalse(module.write_changed(file,module.build_queue(self.root)))
        self.assertEqual(file.read_bytes(),content)
        self.assertIn("CFO",obj["candidates"][0]["next_checks"][1])
    def test_no_publish_when_missing_radar_date_or_duplicate_ids(self):
        self.seed(12)
        radar=json.loads((self.data/"research-radar-v86.json").read_text())
        radar["asof"]=""
        write(self.data/"research-radar-v86.json",radar)
        with self.assertRaises(ValueError):module.build_queue(self.root)
        radar["asof"]=self.asof.isoformat()
        radar["candidates"][1]["id"]=radar["candidates"][0]["id"]
        write(self.data/"research-radar-v86.json",radar)
        with self.assertRaises(ValueError):module.build_queue(self.root)

if __name__=="__main__":
    unittest.main()
