"""No-network regression suite for a dynamic—not fixed nine—stock discovery system."""
from __future__ import annotations
import datetime as dt
import importlib.util
import json
import pathlib
import tempfile
import unittest

MOD=pathlib.Path(__file__).with_name("scan_research.py")
spec=importlib.util.spec_from_file_location("scan_research", MOD)
screen=importlib.util.module_from_spec(spec)
spec.loader.exec_module(screen)

def write(path, obj):
    path.write_text(json.dumps(obj,ensure_ascii=False),encoding="utf-8")

class ResearchDiscoveryTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root=pathlib.Path(self.tmp.name)
        self.data=self.root/"data"
        self.data.mkdir()
        self.today=dt.date.today()-dt.timedelta(days=1)
        self.start=self.today-dt.timedelta(days=300)
        def history(ticker, currency, start_price, delta):
            points=[{"d":(self.start+dt.timedelta(days=i)).isoformat(),
                     "c":round(start_price*(1+delta*i),5)} for i in range(299)]
            return {"ticker":ticker,"currency":currency,"asof":points[-1]["d"],
                    "source":"test adjusted daily close","points":points}
        self.hist=history
        self.assets={"A":history("A","USD",20,.002),
                     "B":history("B","USD",100,-.001),
                     "ACWI":history("ACWI","USD",100,.0003),
                     "VWCE":history("VWCE.DE","EUR",100,.0003),
                     "X":history("X.DE","EUR",50,.001)}
        self.universe={"schema_version":1,"equities":[
         {"id":"alpha","ticker":"A","company":"Alpha Inc","sector":"Software","currency":"USD","country":"US","benchmark_id":"ACWI"},
         {"id":"beta","ticker":"B","company":"Beta plc","sector":"Utilities","currency":"USD","country":"US","benchmark_id":"ACWI"},
         {"id":"xetra","ticker":"X.DE","company":"Example SE","sector":"Industrial","currency":"EUR","country":"DE","benchmark_id":"VWCE"},
         {"id":"missing","ticker":"MISSING","company":"Missing Inc","sector":"Industrial","currency":"USD","country":"US","benchmark_id":"ACWI"}],
         "benchmarks":[{"id":"ACWI","ticker":"ACWI","name":"World ETF","currency":"USD"},
                       {"id":"VWCE","ticker":"VWCE.DE","name":"Global ETF EUR","currency":"EUR"}]}
        self.writeall()

    def writeall(self,archived=False):
        write(self.data/"research-universe-v86.json",self.universe)
        write(self.data/"prices.json",{"schema_version":1,"assets":self.assets})
        write(self.data/"ideas.json",{"ideas":[{"id":"alpha","company":"Alpha Inc","ticker":"A",
             "lifecycle":"archived" if archived else "active","next":"Audit real cashflow",
             "counter":"Revenue quality unclear"}]})
        write(self.data/"company-profiles-v82.json",{"companies":{
          "A":{"name":"Alpha Inc.","sector":"Software","business":"Issuer profile"},
          "Z.DE":{"name":"Zeta AG","sector":"Banks","business":"New issuer"}
        }})
        published=(self.today-dt.timedelta(days=2)).isoformat()
        write(self.data/"daily.json",{"stories":[{"id":"alpha-original",
                "title":"Alpha reports earnings","symbols":["A"],
                "published":published,"source":"Issuer IR",
                "url":"https://issuer.example/alpha-results"}]})
        write(self.data/"editorial-core-v43.json",{"stories":[]})
        write(self.data/"editorial-candidates.json",{"candidates":[
            {"id":"rss-missing","title":"Missing Group might rise",
             "published_at":published+"T09:00:00Z","verification":"unverified_candidate"}]})

    def test_open_universe_not_fixed_nine_and_unverified_news_never_advances(self):
        radar=screen.build_radar(self.root)
        self.assertGreaterEqual(radar["total_issuers"],5)
        by={x["ticker"]:x for x in radar["candidates"]}
        self.assertIn("Z.DE",by,"New verified profile must auto expand universe")
        self.assertNotIn("AIXA",by)
        self.assertEqual(by["MISSING"]["research_priority"],"insufficient_data")
        self.assertIsNone(by["MISSING"]["editorial_evidence"])
        self.assertIn(by["A"]["research_priority"],("A_research_first","B_watchlist"))
        self.assertEqual(by["A"]["editorial_evidence"]["id"],"alpha-original")
        self.assertEqual(by["A"]["editorial_evidence"]["evidence_status"],"published_editorial_not_independent_primary_audit")
        self.assertEqual(len(by["A"]["benchmarks"]),1,"USD must compare only with USD benchmarks")
        self.assertEqual(by["A"]["benchmarks"][0]["currency"],"USD")
        self.assertEqual(by["X.DE"]["benchmarks"][0]["currency"],"EUR")
        self.assertNotIn("Z.DE",radar["front_page_candidate_ids"],"Without prices new profiles cannot become priority picks")

    def test_preserve_immutable_thesis_events_and_performance_since_entry(self):
        screen.main(self.root)
        ledger_path=self.data/"thesis-ledger-v86.json"
        radar_path=self.data/"research-radar-v86.json"
        first=json.loads(ledger_path.read_text())
        first_bytes=ledger_path.read_bytes()
        count=len(first["events"])
        self.assertGreaterEqual(count,3)
        first_radar=json.loads(radar_path.read_text())
        alpha=next(x for x in first_radar["candidates"] if x["ticker"]=="A")
        self.assertEqual(alpha["since_first_screen"]["adjusted_return_pct"],0)
        self.assertEqual(alpha["since_first_screen"]["relative_to_benchmark_pp"],0)
        screen.main(self.root)
        self.assertEqual(ledger_path.read_bytes(),first_bytes,"Repeated identical scan must be no-op")
        self.assertEqual(len(json.loads(ledger_path.read_text())["events"]),count)
        # New bearish price-regime changes only signal priority; the original
        # event is kept byte-identical and no fictitious position action happens.
        hist=self.assets["A"]["points"]
        for i in range(len(hist)-45,len(hist)):
            hist[i]["c"]=round(32-(i-(len(hist)-45))*.2,4)
        self.writeall()
        screen.main(self.root)
        newer=json.loads(ledger_path.read_text())
        self.assertEqual(newer["events"][:count],first["events"])
        self.assertGreater(len(newer["events"]),count)
        self.assertEqual(newer["events"][-1]["event_type"],"priority_changed")
        self.assertEqual(newer["events"][-1]["classification"],"public_research_queue_change_not_investment_decision")
        second_len=len(newer["events"])
        self.writeall(archived=True)
        screen.main(self.root)
        last=json.loads(ledger_path.read_text())
        self.assertEqual(last["events"][:second_len],newer["events"])
        self.assertEqual(last["events"][-1]["event_type"],"archived")
        self.assertEqual(next(x for x in json.loads(radar_path.read_text())["candidates"] if x["ticker"]=="A")["lifecycle"],"archived")

    def test_name_alias_dedup_and_failed_price_data(self):
        source={"equities":[{"id":"aixtron","ticker":"AIXA.DE","company":"AIXTRON","sector":"Semiconductors","currency":"EUR"}]}
        profiles={"companies":{"AIXA":{"name":"AIXTRON SE","sector":"Semiconductors"},
                               "AIXA.DE":{"name":"AIXTRON SE","sector":"Semiconductors"},
                               "SIE.DE":{"name":"Siemens AG","sector":"Industrials"}}}
        names=screen.discovery_universe(source,profiles,{"ideas":[]},[])
        self.assertEqual(sum(x["company"].startswith("AIXTRON") for x in names),1)
        self.assertIn("SIE.DE",[x["ticker"] for x in names])
        self.assertEqual(screen.metrics({},{}).get("status"),"needs_price_history")
        self.assertIsNone(screen.signal_priority({"status":"needs_price_history"},True)[1])
        self.assertEqual(screen.parse_date("04.11.2026"),dt.date(2026,11,4))

if __name__=="__main__":
    unittest.main()
