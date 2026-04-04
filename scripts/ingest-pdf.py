#!/usr/bin/env python3
"""Ingest PDF guidelines into Supabase via Voyage AI embeddings.
Usage: python3 scripts/ingest-pdf.py
"""

import os
import sys
import re
import json
import time
import urllib.request
from collections import Counter
from pypdf import PdfReader

# Force unbuffered output
sys.stdout.reconfigure(line_buffering=True)

# ── Load .env ──
script_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(script_dir, '.env')
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if '=' in line and not line.startswith('#'):
                k, v = line.split('=', 1)
                os.environ[k.strip()] = v.strip()

SUPABASE_URL = os.environ['SUPABASE_URL']
SUPABASE_KEY = os.environ['SUPABASE_SERVICE_KEY']
VOYAGE_API_KEY = os.environ['VOYAGE_API_KEY']

# ── Config ──
CHUNK_SIZE = 1200
OVERLAP = 150

PDF_DOCUMENTS = [
    {
        'path': 'data/ld-acpr-identification-2022.pdf',
        'source': 'LD ACPR — Identification, vérification identité et connaissance clientèle (2022)',
        'source_url': 'https://acpr.banque-france.fr/fr/publications-et-statistiques/publications/lignes-directrices-relatives-lidentification-la-verification-de-lidentite-et-la-connaissance-de-la',
        'category': 'lcb-ft',
        'prefix': 'LD-ACPR-ID-2022'
    },
    {
        'path': 'data/ld-acpr-tracfin-2025.pdf',
        'source': 'LD ACPR-Tracfin — Obligations de vigilance et déclaration (2025)',
        'source_url': 'https://acpr.banque-france.fr/fr/publications-et-statistiques/publications/lignes-directrices-relatives-aux-obligations-de-vigilance-et-de-declaration-tracfin',
        'category': 'lcb-ft',
        'prefix': 'LD-ACPR-TRACFIN-2025'
    },
    {
        'path': 'data/ld-acpr-dgt-gel-avoirs-2026.pdf',
        'source': 'LD ACPR-DGT — Gel des avoirs (mars 2026)',
        'source_url': 'https://acpr.banque-france.fr/fr/publications-et-statistiques/publications/lignes-directrices-relatives-au-gel-des-avoirs',
        'category': 'lcb-ft',
        'prefix': 'LD-GEL-2026'
    }
]

CONTENT_START_PATTERNS = [
    re.compile(r'^\s*1\.\s+\S', re.MULTILINE),
    re.compile(r'^\s*Chapitre\s+1', re.MULTILINE),
    re.compile(r'^\s*I\.\s+\S', re.MULTILINE),
    re.compile(r'^\s*Introduction\s*$', re.MULTILINE),
]


# ── PDF parsing ──

def find_content_start_page(reader):
    for i, page in enumerate(reader.pages):
        if i < 2:
            continue
        text = page.extract_text() or ''
        if len(re.findall(r'\.{5,}', text)) > 3:
            continue
        for pattern in CONTENT_START_PATTERNS:
            if pattern.search(text):
                return i
    return 4


def find_repeated_headers(text, threshold=3):
    lines = text.split('\n')
    short = [l.strip() for l in lines if 5 < len(l.strip()) < 50]
    counts = Counter(short)
    return {l for l, c in counts.items() if c > threshold}


def clean_text(text, repeated_headers=None):
    if repeated_headers is None:
        repeated_headers = set()
    lines = text.split('\n')
    cleaned = []
    prev_empty = False
    for line in lines:
        t = line.strip()
        if t.isdigit() and len(t) <= 3:
            continue
        if re.match(r'^[\s.·…]+$', t):
            continue
        if t.count('.') > len(t) * 0.3 and len(t) > 10:
            continue
        if t in repeated_headers:
            continue
        if t == '':
            if prev_empty:
                continue
            prev_empty = True
        else:
            prev_empty = False
        cleaned.append(t)
    return '\n'.join(cleaned).strip()


def chunk_text(text, prefix, source, source_url, category):
    chunks = []
    start = 0
    idx = 0
    while start < len(text):
        end = min(start + CHUNK_SIZE, len(text))
        if end < len(text):
            s = text[start:end]
            ld = max(s.rfind('. '), s.rfind('.\n'), s.rfind('.\t'))
            if ld > CHUNK_SIZE * 0.4:
                end = start + ld + 1
        content = text[start:end].strip()
        if len(content) > 80:
            idx += 1
            chunks.append({
                'content': content,
                'source_ref': f'{prefix}-chunk-{idx:03d}',
                'source_label': f'{source} — chunk {idx}',
                'source_url': source_url,
                'category': category
            })
        ns = end - OVERLAP
        start = ns if ns > start else end
    return chunks


def parse_pdf(doc):
    filepath = os.path.join(script_dir, doc['path'])
    reader = PdfReader(filepath)
    start_page = find_content_start_page(reader)
    raw = '\n\n'.join(p.extract_text() or '' for p in reader.pages[start_page:])
    rh = find_repeated_headers(raw)
    cleaned = clean_text(raw, rh)
    return chunk_text(cleaned, doc['prefix'], doc['source'], doc['source_url'], doc['category'])


# ── Voyage AI embedding ──

def _http_request(url, data_bytes, headers, retries=3):
    """HTTP request with retry + exponential backoff."""
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, data=data_bytes, headers=headers)
            with urllib.request.urlopen(req, timeout=30) as resp:
                return resp.read(), resp.status
        except Exception as e:
            if attempt == retries - 1:
                raise
            wait = 2 ** (attempt + 1)  # 2s, 4s
            print(f"    ⏳ retry {attempt+1}/{retries} in {wait}s ({e})")
            time.sleep(wait)


def get_embedding(text):
    data = json.dumps({
        'model': 'voyage-3',
        'input': text,
        'input_type': 'document'
    }).encode('utf-8')

    body, _ = _http_request(
        'https://api.voyageai.com/v1/embeddings',
        data,
        {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {VOYAGE_API_KEY}'
        }
    )
    result = json.loads(body)
    return result['data'][0]['embedding']


# ── Supabase upsert ──

def supabase_upsert(row):
    data = json.dumps(row).encode('utf-8')
    _, status = _http_request(
        f'{SUPABASE_URL}/rest/v1/regulatory_chunks?on_conflict=source_ref',
        data,
        {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': f'Bearer {SUPABASE_KEY}',
            'Prefer': 'resolution=merge-duplicates'
        }
    )
    return status


def supabase_insert(row):
    """Plain insert — fallback if upsert fails due to no unique constraint."""
    data = json.dumps(row).encode('utf-8')
    _, status = _http_request(
        f'{SUPABASE_URL}/rest/v1/regulatory_chunks',
        data,
        {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': f'Bearer {SUPABASE_KEY}',
            'Prefer': 'return=minimal'
        }
    )
    return status


# ── Main ──

def main():
    all_chunks = []
    for doc in PDF_DOCUMENTS:
        chunks = parse_pdf(doc)
        all_chunks.append((doc, chunks))
        print(f"{doc['prefix']}: {len(chunks)} chunks")

    total = sum(len(c) for _, c in all_chunks)
    print(f"\nTotal: {total} chunks à ingérer\n")

    done = 0
    for doc, chunks in all_chunks:
        success = 0
        failed = 0
        print(f"\n── {doc['prefix']} ({len(chunks)} chunks) ──")

        for chunk in chunks:
            done += 1
            try:
                embedding = get_embedding(chunk['content'])

                row = {
                    'content': chunk['content'],
                    'source_label': chunk['source_label'],
                    'source_url': chunk['source_url'],
                    'source_ref': chunk['source_ref'],
                    'category': chunk['category'],
                    'embedding': embedding,
                    'updated_at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
                }

                supabase_upsert(row)
                success += 1

                if done % 25 == 0 or done == total:
                    print(f"  Chunk {done}/{total} ingéré")

            except Exception as e:
                failed += 1
                print(f"  ❌ {chunk['source_ref']}: {e}")

            time.sleep(0.2)  # Rate limit Voyage AI

        print(f"  ✓ {success} ingérés, {failed} échoués")

    print(f"\n✅ Ingestion terminée: {done} chunks traités")


if __name__ == '__main__':
    main()
