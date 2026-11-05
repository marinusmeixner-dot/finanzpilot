"""No-network evidence controls for the self-updating open equity universe and raw quotes."""
from __future__ import annotations
import datetime as dt
import importlib.util
import pathlib
import unittest

HERE=pathlib.Path(__file__).parent
def load(name,filename):
    spec=importlib.util.spec_from_file_location(name,HERE/filename)
    module=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module
quot=load("quotes","refresh_market_quotes_v88.py")
hist=load("history","refresh_prices.py")

class AutoDiscoveryTests(unittest.TestCase):
    def test_new_verified_profile_request_not_fixed_universe(self):
        universe={"equities":[{"ticker":"MSFT","currency":"USD"}],
                  "benchmarks":[{"ticker":"ACWI","currency":"USD"}]}
        extra=[{"ticker":"ZETA.DE","company":"Verified Zeta","currency":"EUR"},
               {"ticker":"ABC","company":"New US","currency":"USD"}]
        result=hist.requested_symbols(universe,legacy={},discovered=extra)
        self.assertEqual({v[0] for v in result.values()},{"MSFT","ACWI","ZETA.DE","ABC"})
        self.assertEqual(result["ZETA.DE"][1],"EUR")
    def test_bad_ticker_and_wrong_currency_not_loaded(self):
        result=hist.requested_symbols({"equities":[],"benchmarks":[]},legacy={},
             discovered=[{"ticker":"BAD/TICKER","currency":"EUR"},
                {"ticker":"NONUS","currency":"JPY"},{"ticker":"GOOD","currency":"USD"}])
        self.assertEqual(list(result),["GOOD"])
    def test_never_use_intraday_candle(self):
        now=dt.datetime(2026,11,5,12,30,tzinfo=dt.timezone.utc)
        series=[(dt.date(2026,11,4),100.1234),(dt.date(2026,11,5),400),
            (dt.date(2026,11,6),500)]
        self.assertEqual(quot.last_completed_close(series,"MSFT",now),(dt.date(2026,11,4),100.1234))
        # EU open vs US premarket is never treated as close.
        self.assertEqual(quot.last_completed_close(series,"SIE.DE",now),(dt.date(2026,11,4),100.1234))
    def test_update_price_only_and_never_touch_fundamentals(self):
        now=dt.datetime(2026,11,5,12,30,tzinfo=dt.timezone.utc)
        entry={"id":"microsoft","quote":{"close":100,"date":"2026-11-03",
                     "currency":"USD","exchange":"NASDAQ","price_type":"regular_session_close",
                     "source_url":"https://example.test"},"fundamentals":{"shares_m":42,"eps_ttm":6,
                     "observed_date":"2026-11-03"}}
        self.assertTrue(quot.safe_update(entry,"MSFT",(dt.date(2026,11,4),101.23456),now))
        self.assertEqual(entry["quote"]["close"],101.23456)
        self.assertEqual(entry["quote"]["source_kind"],"third_party_yahoo_unadjusted_close")
        self.assertFalse(entry["quote"]["exchange_verified_by_operator"])
        self.assertEqual(entry["fundamentals"]["shares_m"],42)
        self.assertEqual(entry["fundamentals"]["observed_date"],"2026-11-03")
        self.assertFalse(quot.safe_update(entry,"MSFT",(dt.date(2026,11,4),102),now))
    def test_split_or_mismatched_listing_cannot_silently_invalidate_shares(self):
        now=dt.datetime(2026,11,5,tzinfo=dt.timezone.utc)
        for ticker,exchange in [("MSFT","NASDAQ"),("SIE.DE","XETRA")]:
            entry={"quote":{"close":100,"date":"2026-11-04",
                            "currency":"USD" if exchange=="NASDAQ" else "EUR",
                            "exchange":exchange}}
            self.assertFalse(quot.safe_update(entry,ticker,(dt.date(2026,11,5),20),now))
            self.assertEqual(entry["quote"]["close"],100)
        wrong={"quote":{"close":100,"date":"2026-11-03","currency":"EUR","exchange":"XETRA"}}
        self.assertFalse(quot.safe_update(wrong,"MSFT",(dt.date(2026,11,4),100),now))
        self.assertEqual(wrong["quote"]["close"],100)
    def test_reject_invalid_or_missing_quotes(self):
        now=dt.datetime(2026,11,5,tzinfo=dt.timezone.utc)
        self.assertIsNone(quot.last_completed_close([(dt.date(2026,11,4),-1),
                        (dt.date(2026,11,3),float("nan"))],"MSFT",now))
        self.assertFalse(quot.safe_update({"quote":{"date":"2026-11-03"}},"MSFT",None,now))

if __name__=="__main__":
    unittest.main()
