#!/usr/bin/env python3
"""Test PDF parsing v2 — skip sommaire, clean artifacts, larger chunks"""

import os
import re
from collections import Counter
from pypdf import PdfReader

CHUNK_SIZE = 1200
OVERLAP = 150

PDF_DOCUMENTS = [
    {
        'path': 'data/ld-acpr-identification-2022.pdf',
        'source': 'LD ACPR — Identification, vérification identité et connaissance clientèle (2022)',
        'category': 'lcb-ft',
        'prefix': 'LD-ACPR-ID-2022'
    },
    {
        'path': 'data/ld-acpr-tracfin-2025.pdf',
        'source': 'LD ACPR-Tracfin — Obligations de vigilance et déclaration (2025)',
        'category': 'lcb-ft',
        'prefix': 'LD-ACPR-TRACFIN-2025'
    },
    {
        'path': 'data/ld-acpr-dgt-gel-avoirs-2026.pdf',
        'source': 'LD ACPR-DGT — Gel des avoirs (mars 2026)',
        'category': 'lcb-ft',
        'prefix': 'LD-GEL-2026'
    }
]

# Patterns that signal the start of actual content (end of sommaire)
CONTENT_START_PATTERNS = [
    re.compile(r'^\s*1\.\s+\S', re.MULTILINE),          # "1. Blabla"
    re.compile(r'^\s*Chapitre\s+1', re.MULTILINE, ),     # "Chapitre 1"
    re.compile(r'^\s*I\.\s+\S', re.MULTILINE),           # "I. Blabla"
    re.compile(r'^\s*Introduction\s*$', re.MULTILINE),    # "Introduction" alone
]


def find_content_start_page(reader):
    """Find first page where real content begins (after cover + sommaire)."""
    for i, page in enumerate(reader.pages):
        if i < 2:  # Always skip first 2 pages (cover + blank/intro)
            continue
        text = page.extract_text() or ''
        # Check if this page has TOC indicators (lots of dotted lines)
        dot_lines = len(re.findall(r'\.{5,}', text))
        if dot_lines > 3:
            continue  # Still in sommaire
        # Check for content start patterns
        for pattern in CONTENT_START_PATTERNS:
            if pattern.search(text):
                return i
    return 4  # Default: skip 4 pages


def find_repeated_headers(text, threshold=3):
    """Find short lines that appear more than threshold times (headers/footers)."""
    lines = text.split('\n')
    short_lines = [l.strip() for l in lines if 5 < len(l.strip()) < 50]
    counts = Counter(short_lines)
    return {line for line, count in counts.items() if count > threshold}


def clean_text(text, repeated_headers=None):
    """Clean extracted PDF text."""
    if repeated_headers is None:
        repeated_headers = set()

    lines = text.split('\n')
    cleaned = []
    prev_empty = False

    for line in lines:
        t = line.strip()

        # Skip page numbers (standalone digits 1-999)
        if t.isdigit() and len(t) <= 3:
            continue

        # Skip dotted lines (TOC remnants)
        if re.match(r'^[\s.·…]+$', t):
            continue
        # Skip lines that are mostly dots (e.g. "Section 1 ........ 5")
        if t.count('.') > len(t) * 0.3 and len(t) > 10:
            continue

        # Skip repeated headers/footers
        if t in repeated_headers:
            continue

        # Collapse empty lines
        if t == '':
            if prev_empty:
                continue
            prev_empty = True
        else:
            prev_empty = False

        cleaned.append(t)

    return '\n'.join(cleaned).strip()


def chunk_text(text, prefix, source, category):
    """Split text into overlapping chunks, breaking at sentence boundaries."""
    chunks = []
    start = 0
    idx = 0

    while start < len(text):
        end = min(start + CHUNK_SIZE, len(text))

        # Try to break at sentence boundary
        if end < len(text):
            slice_ = text[start:end]
            # Look for last sentence-ending punctuation
            last_dot = max(slice_.rfind('. '), slice_.rfind('.\n'), slice_.rfind('.\t'))
            if last_dot > CHUNK_SIZE * 0.4:
                end = start + last_dot + 1

        content = text[start:end].strip()
        if len(content) > 80:  # Skip tiny fragments
            idx += 1
            chunks.append({
                'content': content,
                'source_ref': f'{prefix}-chunk-{idx:03d}',
                'source_label': f'{source} — chunk {idx}',
                'category': category
            })

        new_start = end - OVERLAP
        if new_start <= start:
            start = end
        else:
            start = new_start

    return chunks


def parse_pdf(doc, script_dir, verbose=False):
    """Full pipeline: read PDF → skip sommaire → clean → chunk."""
    filepath = os.path.join(script_dir, doc['path'])
    reader = PdfReader(filepath)
    total_pages = len(reader.pages)

    # Find where content starts
    start_page = find_content_start_page(reader)

    # Extract text from content pages only
    raw_text = '\n\n'.join(
        page.extract_text() or ''
        for page in reader.pages[start_page:]
    )

    # Find repeated headers across the document
    repeated_headers = find_repeated_headers(raw_text)

    # Clean
    cleaned = clean_text(raw_text, repeated_headers)

    # Chunk
    chunks = chunk_text(cleaned, doc['prefix'], doc['source'], doc['category'])

    if verbose:
        print(f"\nPages: {total_pages} (content starts at page {start_page + 1})")
        print(f"Raw text: {len(raw_text)} chars")
        print(f"Cleaned: {len(cleaned)} chars ({len(raw_text) - len(cleaned)} removed)")
        if repeated_headers:
            print(f"Repeated headers suppressed: {repeated_headers}")
        print(f"Chunks: {len(chunks)}")

    return chunks, total_pages, start_page


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))

    # === Detailed test on first PDF ===
    doc = PDF_DOCUMENTS[0]
    print(f"=== {doc['source']} ===")

    chunks, pages, start = parse_pdf(doc, script_dir, verbose=True)

    print('\n--- 3 premiers chunks ---\n')
    for i, c in enumerate(chunks[:3]):
        print(f"[Chunk {i+1}] ({len(c['content'])} chars) — {c['source_ref']}")
        print(c['content'][:600])
        print('...\n')

    # === Summary for all 3 PDFs ===
    print('\n=== Résumé des 3 PDFs (après nettoyage) ===\n')
    total_chunks = 0
    for doc in PDF_DOCUMENTS:
        chunks, pages, start = parse_pdf(doc, script_dir)
        total_chunks += len(chunks)
        print(f"{doc['prefix']}: {pages} pages (content p.{start+1}), {len(chunks)} chunks")

    print(f"\nTotal: {total_chunks} chunks")


if __name__ == '__main__':
    main()
