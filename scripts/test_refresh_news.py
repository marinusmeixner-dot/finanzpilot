"""Regression tests for RSS discovery. No network calls."""
import datetime as dt
import importlib.util
import tempfile
import json
import pathlib
import unittest
from unittest.mock import patch

PATH = pathlib.Path(__file__).resolve().parents[0] / "refresh_news.py"
spec = importlib.util.spec_from_file_location("refresh_news", PATH)
news = importlib.util.module_from_spec(spec)
spec.loader.exec_module(news)

class EditorialInboxTests(unittest.TestCase):
    def setUp(self):
        self.now = dt.datetime(2026, 11, 3, 9, tzinfo=dt.timezone.utc)
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = pathlib.Path(self.tmp.name)
        (self.root / "data").mkdir()
        self.inbox = self.root / "data" / "editorial-candidates.json"
        self.daily = self.root / "data" / "daily.json"
        self.daily.write_text('{"date":"2026-11-02","stories":[{"article":{"sections":[1,2,3,4]}}]}')
        self.old_daily = self.daily.read_bytes()

    def test_preserves_full_articles_on_fetch_success_and_failure(self):
        prior = {"candidates": []}
        mock_feed = [{"id":"rss-x", "title":"Candidate not published", "source":"Test",
                      "url":"https://test.example/123","published_at":"2026-11-03T08:00:00Z",
                      "verification":"unverified_candidate", "status":"needs_primary_source"}]
        self.inbox.write_text(json.dumps(prior))
        with patch.object(news, "DEST", self.inbox), \
             patch.object(news, "FEEDS",[("Test","https://test.example/rss")]), \
             patch.object(news,"collect_feed",return_value=mock_feed):
            news.main()
        self.assertEqual(self.daily.read_bytes(), self.old_daily)
        self.assertEqual(len(json.loads(self.inbox.read_text())["candidates"]),1)
        with patch.object(news, "DEST", self.inbox), \
             patch.object(news, "FEEDS",[("Test","https://test.example/rss")]), \
             patch.object(news, "collect_feed",side_effect=OSError("offline")):
            news.main()
        self.assertEqual(self.daily.read_bytes(), self.old_daily)
        self.assertEqual(len(json.loads(self.inbox.read_text())["candidates"]),1)

    def test_candidate_dedup_and_expiry(self):
        valid={"id":"rss-good","title":"A","url":"https://source.test/a",
               "published_at":"2026-11-03T08:00:00Z","verification":"unverified_candidate"}
        old={"id":"rss-expired","title":"B","url":"https://source.test/b",
             "published_at":"2026-10-24T08:00:00Z","verification":"unverified_candidate"}
        rows=news.build_candidates({"candidates":[old,valid]},[valid],self.now)
        self.assertEqual([v["id"] for v in rows],["rss-good"])

if __name__ == "__main__":
    unittest.main()
