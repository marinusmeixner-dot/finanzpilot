"""No-network quality gates for independent index-sourced issuer discovery."""
from __future__ import annotations
import csv
import datetime as dt
import importlib.util
import io
import json
import pathlib
import tempfile
import unittest
from zoneinfo import ZoneInfo

HERE=pathlib.Path(__file__).parent

def load(name):
    spec=importlib.util.spec_from_file_location(name,HERE/name)
    mod=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod

mod=load("discover_issuers_v90.py")
price=load("refresh_prices.py")

def symbol(i):
    return "C"+chr(65+i//676)+chr(65+(i//26)%26)+chr(65+i%26)

def catalogue_csv(num=405):
    buf=io.StringIO()
    w=csv.DictWriter(buf,fieldnames=["Symbol","Security","GICS Sector","CIK","Date added"])
    w.writeheader()
    for i in range(num):
        w.writerow({"Symbol":symbol(i),"Security":f"Discovered Test Issuer {i}",
                    "GICS Sector":["Utilities","Energy","Health Care","Industrials",
                                   "Information Technology","Financials","Materials"][i%7],
                    "CIK":f"{i+1000:010d}","Date added":"2026-11-05"})
    return buf.getvalue()

class DiscoveryTests(unittest.TestCase):
    def setUp(self):
        self.day=dt.date(2026,11,6)
        self.records=mod.parse_index(catalogue_csv())
        self.universe={"schema_version":1,"equities":[{
            "id":"microsoft","ticker":"MSFT","company":"Microsoft",
            "sector":"Information Technology","currency":"USD"}],"benchmarks":[]}
    def test_index_source_parser_and_ticker_identity_reject_bad_rows(self):
        self.assertGreaterEqual(len(self.records),400)
        self.assertEqual(self.records[symbol(4)]["cik"],"0000001004")
        with self.assertRaises(ValueError):mod.parse_index("Symbol,Security,CIK\nUNVERIFIED,Company,42\n")
        bad=catalogue_csv().replace(symbol(1), "BRK.B",1)
        rows=mod.parse_index(bad)
        self.assertNotIn("BRK.B",rows,"Unverified provider aliases may never be imported")
        self.assertEqual(len(rows),404)
    def test_new_companies_added_without_nine_limit_and_diversity(self):
        out,stats=mod.build(self.universe,self.records,self.day,lambda t: True)
        self.assertEqual(stats["total_universe"],5)
        self.assertEqual(len(stats["new_companies"]),4)
        self.assertEqual(len(set(x["sector"] for x in out["equities"][1:])),4)
        for row in out["equities"][1:]:
            self.assertEqual(row["currency"],"USD")
            self.assertEqual(row["country"],"US")
            self.assertEqual(row["discovery_source_url"],mod.INDEX_URL)
            self.assertEqual(row["discovery_date"],self.day.isoformat())
            self.assertIn("not",row["verification"].lower())
        again,second=mod.build(out,self.records,self.day,lambda t: True)
        self.assertEqual(len(again["equities"]),5)
        self.assertEqual(second["new_companies"],[],"Same-day rerun must not spam additions")
        next_day,_=mod.build(again,self.records,self.day+dt.timedelta(days=1),lambda t: True)
        self.assertEqual(len(next_day["equities"]),9,"Open universe can expand daily without a fixed cap")
    def test_quote_gate_and_provider_failure_are_safe(self):
        seen=[]
        def verify(ticker):
            seen.append(ticker)
            if len(seen)<4:raise TimeoutError("source throttled")
            return True
        out,stats=mod.build(self.universe,self.records,self.day,verify)
        self.assertEqual(len(out["equities"]),5)
        self.assertGreaterEqual(stats["quote_checks"],5)
        self.assertTrue(stats["quote_failures"])
        no,meta=mod.build(self.universe,self.records,self.day,lambda ticker: False)
        self.assertEqual(len(no["equities"]),3,"Index-only fallback limited to two when Yahoo is unavailable")
        self.assertEqual(meta["quote_pending_added"],2)
        self.assertEqual(meta["quote_crosschecked_added"],0)
        self.assertTrue(all(x["discovery_class"]=="secondary_index_quote_pending" and not x["quote_crosschecked"]
            for x in no["equities"][1:]),"Pending quotes must NEVER masquerade as verified stock listings")
        again,next_meta=mod.build(no,self.records,self.day,lambda ticker: False)
        self.assertEqual(len(again["equities"]),5,"Second check may fill the same four-per-day quota")
        self.assertEqual(len(next_meta["new_companies"]),2)
        third,last_meta=mod.build(again,self.records,self.day,lambda ticker: False)
        self.assertEqual(len(third["equities"]),5,"A third daily check cannot exceed the daily cap")
        self.assertEqual(last_meta["new_companies"],[])
    def test_real_quote_window_cannot_include_today_or_fake_one_candle(self):
        pts=[(self.day-dt.timedelta(days=i),100+i) for i in range(1,32)]
        self.assertTrue(mod.completed_quote_check("CABC",pts,self.day))
        self.assertFalse(mod.completed_quote_check("CABC",[(self.day,100)]*30,self.day))
        self.assertFalse(mod.completed_quote_check("CABC",[(self.day-dt.timedelta(days=1),100)]*30,self.day),
            "Twenty repeated rows on one date are not twenty sessions")
        self.assertFalse(mod.completed_quote_check("CABC",[(self.day-dt.timedelta(days=30+i),100) for i in range(25)],self.day))
    def test_price_refresh_works_after_day_rollover_and_for_new_issuers(self):
        now=dt.datetime(2026,11,6,9,tzinfo=dt.timezone.utc)
        self.assertEqual(price.completed_us_session_day(now),dt.date(2026,11,5))
        state={"assets":{"SPY":{"ticker":"SPY","asof":"2026-11-05"},
                         "MSFT":{"ticker":"MSFT","asof":"2026-11-05"}}}
        self.assertFalse(price.price_refresh_due(state,now,universe=self.universe))
        bigger={**self.universe,"equities":self.universe["equities"]+[
            {"id":"new","ticker":"CABC","currency":"USD"}]}
        self.assertTrue(price.price_refresh_due(state,now,universe=bigger))
        self.assertTrue(price.price_refresh_due({"assets":{"SPY":{"ticker":"SPY","asof":"2026-11-04"}}},now,universe=self.universe))
        state["last_price_attempt_at"]="2026-11-06T08:00:00+00:00"
        self.assertFalse(price.price_refresh_due(state,now,universe=bigger),"Avoid expensive hourly retry loops")

if __name__=="__main__":unittest.main()
