#!/usr/bin/env python3
from __future__ import annotations

import argparse
import concurrent.futures
import dataclasses
import datetime as dt
import hashlib
import html
import json
import re
import sys
import textwrap
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from collections import defaultdict
from pathlib import Path
from typing import Iterable


ROOT = Path(__file__).resolve().parent
CONFIG_PATH = ROOT / "config" / "sources.json"
STATE_PATH = ROOT / "data" / "state.json"
REPORTS_DIR = ROOT / "reports"
CORE_THEMES = {"lcb_ft", "mica", "payments_dsp"}

USER_AGENT = (
    "Mozilla/5.0 (compatible; VeilleMonitor/1.0; "
    "+https://example.invalid/veille-reglementaire)"
)

DATE_PATTERNS = [
    "%Y-%m-%d",
    "%d/%m/%Y",
    "%d/%m/%y",
    "%d-%m-%Y",
    "%d-%m-%y",
    "%B %d, %Y",
    "%b %d, %Y",
    "%d %B %Y",
    "%d %b %Y",
]

MONTHS = {
    "janvier": "January",
    "fevrier": "February",
    "février": "February",
    "mars": "March",
    "avril": "April",
    "mai": "May",
    "juin": "June",
    "juillet": "July",
    "aout": "August",
    "août": "August",
    "septembre": "September",
    "octobre": "October",
    "novembre": "November",
    "decembre": "December",
    "décembre": "December",
}

DATE_REGEXES = [
    re.compile(r"\b\d{4}-\d{2}-\d{2}\b"),
    re.compile(r"\b\d{1,2}/\d{1,2}/\d{2,4}\b"),
    re.compile(r"\b\d{1,2}-\d{1,2}-\d{2,4}\b"),
    re.compile(
        r"\b(?:janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|"
        r"septembre|octobre|novembre|décembre|decembre)\s+\d{1,2},?\s+\d{4}\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b\d{1,2}\s+(?:janvier|février|fevrier|mars|avril|mai|juin|juillet|"
        r"août|aout|septembre|octobre|novembre|décembre|decembre|january|"
        r"february|march|april|may|june|july|august|september|october|"
        r"november|december)\s+\d{4}\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(?:january|february|march|april|may|june|july|august|september|"
        r"october|november|december)\s+\d{1,2},\s+\d{4}\b",
        re.IGNORECASE,
    ),
]

ANCHOR_RE = re.compile(
    r'(?is)<a[^>]+href=["\']([^"\']+)["\'][^>]*>(.*?)</a>'
)
TAG_RE = re.compile(r"(?is)<[^>]+>")
WS_RE = re.compile(r"\s+")


@dataclasses.dataclass
class Source:
    name: str
    kind: str
    url: str
    tags: list[str]
    include_url_patterns: list[str] | None = None
    exclude_url_patterns: list[str] | None = None


@dataclasses.dataclass
class Entry:
    source: str
    url: str
    title: str
    snippet: str
    published_at: dt.datetime | None
    themes: list[str]
    matched_keywords: list[str]
    score: int
    entry_id: str


def strip_html(value: str) -> str:
    unescaped = html.unescape(TAG_RE.sub(" ", value or ""))
    return WS_RE.sub(" ", unescaped).strip()


def normalize_text(value: str) -> str:
    return strip_html(value).casefold()


def ensure_dirs() -> None:
    REPORTS_DIR.mkdir(exist_ok=True)
    STATE_PATH.parent.mkdir(exist_ok=True)


def load_config() -> tuple[dict[str, list[str]], list[Source]]:
    raw = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    themes = raw["themes"]
    sources = [Source(**item) for item in raw["sources"]]
    return themes, sources


def load_state() -> dict:
    if not STATE_PATH.exists():
        return {"last_run_at": None, "seen_ids": {}}
    return json.loads(STATE_PATH.read_text(encoding="utf-8"))


def save_state(state: dict) -> None:
    STATE_PATH.write_text(
        json.dumps(state, indent=2, ensure_ascii=False, sort_keys=True) + "\n",
        encoding="utf-8",
    )


def fetch_text(url: str, timeout: int = 20) -> str:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=timeout) as response:
        charset = response.headers.get_content_charset() or "utf-8"
        body = response.read()
        return body.decode(charset, errors="replace")


def parse_date(text: str) -> dt.datetime | None:
    candidate = text.strip()
    lowered = candidate.casefold()
    for french, english in MONTHS.items():
        lowered = lowered.replace(french, english.casefold())
    normalized = lowered.title()

    for pattern in DATE_PATTERNS:
        try:
            parsed = dt.datetime.strptime(normalized, pattern)
            return parsed.replace(tzinfo=dt.timezone.utc)
        except ValueError:
            continue

    try:
        parsed = dt.datetime.fromisoformat(candidate.replace("Z", "+00:00"))
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=dt.timezone.utc)
        return parsed.astimezone(dt.timezone.utc)
    except ValueError:
        return None


def find_date_candidates(text: str) -> list[str]:
    matches: list[str] = []
    for regex in DATE_REGEXES:
        matches.extend(match.group(0) for match in regex.finditer(text))
    return matches


def canonical_url(base_url: str, href: str) -> str:
    return urllib.parse.urljoin(base_url, href)


def url_allowed(source: Source, url: str) -> bool:
    if source.include_url_patterns and not any(
        pattern in url for pattern in source.include_url_patterns
    ):
        return False
    if source.exclude_url_patterns and any(
        pattern in url for pattern in source.exclude_url_patterns
    ):
        return False
    return True


def parse_date_from_url(url: str) -> dt.datetime | None:
    candidates = []
    candidates.extend(re.findall(r"/(20\d{2})/(\d{2})/(\d{2})/", url))
    candidates.extend(re.findall(r"(20\d{2})-(\d{2})-(\d{2})", url))
    for year, month, day in candidates:
        try:
            return dt.datetime(
                int(year),
                int(month),
                int(day),
                tzinfo=dt.timezone.utc,
            )
        except ValueError:
            continue
    return None


def make_entry_id(source: str, url: str, title: str) -> str:
    payload = f"{source}\n{url}\n{title}".encode("utf-8")
    return hashlib.sha256(payload).hexdigest()[:20]


def parse_rss(source: Source, body: str) -> list[tuple[str, str, str, dt.datetime | None]]:
    entries: list[tuple[str, str, str, dt.datetime | None]] = []
    try:
        root = ET.fromstring(body)
    except ET.ParseError:
        return entries

    for item in root.findall(".//item") + root.findall(".//{*}entry"):
        title = strip_html(
            find_first_text(item, ["title", "{*}title"]) or "Untitled"
        )
        url = (
            find_first_text(item, ["link", "{*}link"])
            or find_first_attr(item, ["{*}link"], "href")
            or source.url
        )
        snippet = strip_html(
            find_first_text(
                item,
                ["description", "{*}summary", "{*}content", "{*}subtitle"],
            )
            or ""
        )
        date_text = (
            find_first_text(
                item,
                [
                    "pubDate",
                    "{*}updated",
                    "{*}published",
                    "dc:date",
                    "{http://purl.org/dc/elements/1.1/}date",
                ],
            )
            or ""
        )
        published_at = parse_date(date_text) if date_text else None
        entries.append((title, canonical_url(source.url, url), snippet, published_at))
    return entries


def find_first_text(node: ET.Element, paths: list[str]) -> str | None:
    for path in paths:
        child = node.find(path)
        if child is not None and child.text:
            return child.text
    return None


def find_first_attr(node: ET.Element, paths: list[str], attr: str) -> str | None:
    for path in paths:
        child = node.find(path)
        if child is not None and child.attrib.get(attr):
            return child.attrib[attr]
    return None


def parse_html(source: Source, body: str) -> list[tuple[str, str, str, dt.datetime | None]]:
    results: list[tuple[str, str, str, dt.datetime | None]] = []
    seen: set[str] = set()
    now = dt.datetime.now(dt.timezone.utc)
    for match in ANCHOR_RE.finditer(body):
        href = match.group(1)
        if href.startswith("#") or href.startswith("javascript:"):
            continue
        url = canonical_url(source.url, href)
        if not url_allowed(source, url):
            continue
        title = strip_html(match.group(2))
        if not title or len(title) < 8:
            continue
        if url in seen:
            continue
        seen.add(url)

        start, end = match.span()
        date_window = body[max(0, start - 2500) : min(len(body), end + 2500)]
        snippet_window = body[max(0, start - 250) : min(len(body), end + 250)]
        snippet = strip_html(snippet_window)
        published_at = parse_date_from_url(url)
        for candidate in find_date_candidates(date_window):
            parsed = parse_date(candidate)
            if parsed and parsed <= now + dt.timedelta(days=1):
                published_at = parsed
                break
        results.append((title, url, snippet, published_at))
    return results


def score_entry(
    title: str,
    snippet: str,
    source_tags: Iterable[str],
    theme_keywords: dict[str, list[str]],
) -> tuple[list[str], list[str], int]:
    haystack = f"{title} {snippet}".casefold()
    matched_themes: list[str] = []
    matched_keywords: list[str] = []
    score = 0

    for theme, keywords in theme_keywords.items():
        theme_hits = [keyword for keyword in keywords if keyword.casefold() in haystack]
        if theme_hits:
            matched_themes.append(theme)
            matched_keywords.extend(theme_hits[:5])
            score += len(theme_hits) * 2

    source_bonus = sum(1 for source_tag in source_tags if source_tag in matched_themes)
    score += source_bonus

    if any(token in haystack for token in ["consultation", "guidelines", "rts", "its"]):
        score += 2
    if any(token in haystack for token in ["sanctions", "gel des avoirs", "freeze of funds"]):
        score += 3
    if any(token in haystack for token in ["mica", "psd3", "psd2", "dsp2", "amlr"]):
        score += 3

    return matched_themes, sorted(set(matched_keywords)), score


def collect_source(source: Source, theme_keywords: dict[str, list[str]]) -> list[Entry]:
    try:
        body = fetch_text(source.url)
    except Exception as exc:
        return [
            Entry(
                source=source.name,
                url=source.url,
                title=f"Fetch error: {exc}",
                snippet="",
                published_at=None,
                themes=["system"],
                matched_keywords=[],
                score=-1,
                entry_id=make_entry_id(source.name, source.url, str(exc)),
            )
        ]

    raw_entries = parse_rss(source, body) if source.kind == "rss" else parse_html(source, body)
    entries: list[Entry] = []
    for title, url, snippet, published_at in raw_entries:
        themes, matched_keywords, score = score_entry(
            title,
            snippet,
            source.tags,
            theme_keywords,
        )
        entries.append(
            Entry(
                source=source.name,
                url=url,
                title=title,
                snippet=snippet,
                published_at=published_at,
                themes=themes,
                matched_keywords=matched_keywords,
                score=score,
                entry_id=make_entry_id(source.name, url, title),
            )
        )
    return entries


def filter_entries(
    entries: list[Entry],
    days: int,
    now: dt.datetime,
) -> list[Entry]:
    floor = now - dt.timedelta(days=days)
    filtered: list[Entry] = []
    seen_urls: set[str] = set()
    for entry in sorted(
        entries,
        key=lambda item: (
            item.published_at or dt.datetime.min.replace(tzinfo=dt.timezone.utc),
            item.score,
        ),
        reverse=True,
    ):
        if entry.url in seen_urls:
            continue
        if entry.score <= 0:
            continue
        if entry.published_at is None:
            continue
        if entry.published_at < floor:
            continue
        if not any(theme in CORE_THEMES for theme in entry.themes):
            continue
        seen_urls.add(entry.url)
        filtered.append(entry)
    return filtered


def build_report(
    all_entries: list[Entry],
    entries: list[Entry],
    state: dict,
    now: dt.datetime,
    days: int,
    max_items: int | None,
) -> str:
    last_run_at = state.get("last_run_at")
    last_run_dt = parse_date(last_run_at) if last_run_at else None
    seen_ids = state.get("seen_ids", {})

    if max_items is not None:
        entries = entries[:max_items]

    grouped: dict[str, list[Entry]] = defaultdict(list)
    for entry in entries:
        primary_theme = entry.themes[0] if entry.themes else "autres"
        grouped[primary_theme].append(entry)

    new_entries = [
        entry for entry in entries if entry.entry_id not in seen_ids and entry.score > 0
    ]
    fetch_errors = [entry for entry in all_entries if entry.score < 0]

    lines = [
        f"# Veille réglementaire automatique - {now.date().isoformat()}",
        "",
        f"Périmètre temporel: {days} derniers jours",
        f"Dernière exécution connue: {last_run_dt.isoformat() if last_run_dt else 'aucune'}",
        f"Éléments retenus: {len(entries)}",
        f"Nouveautés depuis la dernière exécution: {len(new_entries)}",
        "",
        "## Synthèse",
    ]

    if new_entries:
        top_new = sorted(
            new_entries,
            key=lambda item: (item.score, item.published_at or now),
            reverse=True,
        )[:5]
        for entry in top_new:
            lines.append(
                f"- {entry.published_at.date().isoformat()} | {entry.source} | "
                f"[{entry.title}]({entry.url})"
            )
    else:
        lines.append("- Aucune nouveauté détectée depuis la dernière exécution.")

    if fetch_errors:
        lines.extend(["", "## Erreurs de collecte"])
        for entry in fetch_errors:
            lines.append(f"- {entry.source}: {entry.title}")

    for theme in sorted(grouped):
        lines.extend(["", f"## Thème: {theme}"])
        for entry in sorted(
            grouped[theme],
            key=lambda item: (item.published_at or now, item.score),
            reverse=True,
        ):
            keywords = ", ".join(entry.matched_keywords[:5]) or "aucun"
            snippet = textwrap.shorten(entry.snippet, width=220, placeholder="...")
            lines.append(
                f"- {entry.published_at.date().isoformat()} | {entry.source} | "
                f"score {entry.score} | [{entry.title}]({entry.url})"
            )
            lines.append(f"  Mots-clés: {keywords}")
            if snippet:
                lines.append(f"  Contexte: {snippet}")

    return "\n".join(lines) + "\n"


def update_state(entries: list[Entry], state: dict, now: dt.datetime) -> dict:
    seen_ids = state.get("seen_ids", {})
    for entry in entries:
        seen_ids[entry.entry_id] = now.isoformat()

    ordered = sorted(seen_ids.items(), key=lambda item: item[1], reverse=True)[:5000]
    return {
        "last_run_at": now.isoformat(),
        "seen_ids": dict(ordered),
    }


def run_monitor(days: int, output: Path | None, max_items: int | None) -> int:
    ensure_dirs()
    theme_keywords, sources = load_config()
    state = load_state()
    now = dt.datetime.now(dt.timezone.utc)

    all_entries: list[Entry] = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
        futures = [
            executor.submit(collect_source, source, theme_keywords) for source in sources
        ]
        for future in concurrent.futures.as_completed(futures):
            all_entries.extend(future.result())

    filtered = filter_entries(all_entries, days=days, now=now)
    filtered.sort(
        key=lambda item: (item.published_at or now, item.score, item.source),
        reverse=True,
    )

    report = build_report(
        all_entries,
        filtered,
        state=state,
        now=now,
        days=days,
        max_items=max_items,
    )
    output_path = output or (REPORTS_DIR / f"veille-{now.date().isoformat()}.md")
    output_path.write_text(report, encoding="utf-8")

    new_state = update_state(filtered, state=state, now=now)
    save_state(new_state)

    print(output_path)
    return 0


def list_sources() -> int:
    _, sources = load_config()
    for source in sources:
        print(f"- {source.name}: {source.url}")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Veille réglementaire automatique pour LCB-FT / MiCA / DSP"
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    run_parser = subparsers.add_parser("run", help="Lancer une collecte")
    run_parser.add_argument("--days", type=int, default=7, help="Fenêtre en jours")
    run_parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="Chemin du rapport Markdown",
    )
    run_parser.add_argument(
        "--max-items",
        type=int,
        default=40,
        help="Nombre maximal d'éléments dans le rapport",
    )

    subparsers.add_parser("list-sources", help="Lister les sources configurées")
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    if args.command == "run":
        return run_monitor(days=args.days, output=args.output, max_items=args.max_items)
    if args.command == "list-sources":
        return list_sources()
    parser.error("Commande inconnue")
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
