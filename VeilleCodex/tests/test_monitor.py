import datetime as dt
import unittest

import monitor


class MonitorTests(unittest.TestCase):
    def test_parse_date_french(self):
        parsed = monitor.parse_date("19 mars 2026")
        self.assertIsNotNone(parsed)
        self.assertEqual(parsed.date().isoformat(), "2026-03-19")

    def test_parse_html_extracts_link_and_date(self):
        source = monitor.Source(
            name="Test",
            kind="html",
            url="https://example.com/news",
            tags=["lcb_ft"],
        )
        body = """
        <div class="card">
          <span>19 mars 2026</span>
          <a href="/article-1">Nouvelle consultation AML/CFT sur les obligations CDD</a>
        </div>
        """
        entries = monitor.parse_html(source, body)
        self.assertEqual(len(entries), 1)
        title, url, _snippet, published_at = entries[0]
        self.assertEqual(title, "Nouvelle consultation AML/CFT sur les obligations CDD")
        self.assertEqual(url, "https://example.com/article-1")
        self.assertEqual(published_at.date().isoformat(), "2026-03-19")

    def test_score_entry(self):
        themes, keywords, score = monitor.score_entry(
            "Draft RTS on MiCA and customer due diligence",
            "Consultation on AML and payment services.",
            ["lcb_ft"],
            {
                "lcb_ft": ["aml", "customer due diligence"],
                "mica": ["mica"],
                "payments_dsp": ["payment services"],
            },
        )
        self.assertIn("lcb_ft", themes)
        self.assertIn("mica", themes)
        self.assertIn("payments_dsp", themes)
        self.assertGreaterEqual(score, 8)
        self.assertIn("aml", keywords)

    def test_filter_entries(self):
        now = dt.datetime(2026, 3, 22, tzinfo=dt.timezone.utc)
        recent = monitor.Entry(
            source="Test",
            url="https://example.com/a",
            title="AML update",
            snippet="AML update",
            published_at=dt.datetime(2026, 3, 20, tzinfo=dt.timezone.utc),
            themes=["lcb_ft"],
            matched_keywords=["aml"],
            score=5,
            entry_id="1",
        )
        old = monitor.Entry(
            source="Test",
            url="https://example.com/b",
            title="Old update",
            snippet="Old update",
            published_at=dt.datetime(2026, 3, 1, tzinfo=dt.timezone.utc),
            themes=["lcb_ft"],
            matched_keywords=["aml"],
            score=5,
            entry_id="2",
        )
        filtered = monitor.filter_entries([recent, old], days=7, now=now)
        self.assertEqual([entry.entry_id for entry in filtered], ["1"])


if __name__ == "__main__":
    unittest.main()
