#!/usr/bin/env node
// Test PDF parsing — dry run, no Supabase ingestion

const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

const CHUNK_SIZE = 800;
const OVERLAP = 100;

function cleanText(text) {
  const lines = text.split('\n');
  const cleaned = [];
  let prevEmpty = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^\d{1,3}$/.test(trimmed)) continue;
    if (trimmed === 'Autorité de contrôle prudentiel et de résolution') continue;
    if (trimmed === "Secrétariat général de l'ACPR") continue;
    if (trimmed === '') {
      if (prevEmpty) continue;
      prevEmpty = true;
    } else {
      prevEmpty = false;
    }
    cleaned.push(trimmed);
  }
  return cleaned.join('\n').trim();
}

function chunkText(text, prefix, source, category) {
  const cleaned = cleanText(text);
  const chunks = [];
  let start = 0;
  let idx = 0;

  while (start < cleaned.length) {
    let end = Math.min(start + CHUNK_SIZE, cleaned.length);

    // Try to break at sentence boundary within the slice
    if (end < cleaned.length) {
      const slice = cleaned.substring(start, end);
      const lastDot = slice.lastIndexOf('.');
      if (lastDot > CHUNK_SIZE * 0.5) {
        end = start + lastDot + 1;
      }
    }

    const content = cleaned.substring(start, end).trim();
    if (content.length > 50) {
      idx++;
      chunks.push({
        content,
        source_ref: `${prefix}-chunk-${String(idx).padStart(3, '0')}`,
        source_label: `${source} — chunk ${idx}`,
        category
      });
    }

    start = end > start ? end - OVERLAP : start + CHUNK_SIZE;
  }

  return chunks;
}

async function testParsing() {
  const filePath = path.join(__dirname, 'data', 'ld-acpr-identification-2022.pdf');
  console.log(`\nParsing: LD ACPR Identification 2022`);
  console.log(`File: ${filePath} (${(fs.statSync(filePath).size / 1024 / 1024).toFixed(1)} MB)`);

  // Extract text then free buffer
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer, { max: 0 }); // max:0 = all pages
  const rawText = data.text;
  const numpages = data.numpages;
  // data and buffer go out of scope for GC

  console.log(`Pages: ${numpages}`);
  console.log(`Raw text: ${rawText.length} chars`);

  const chunks = chunkText(rawText, 'LD-ACPR-ID-2022', 'LD ACPR — Identification (2022)', 'lcb-ft');
  console.log(`Chunks générés: ${chunks.length}`);

  console.log('\n=== 3 premiers chunks ===\n');
  for (let i = 0; i < Math.min(3, chunks.length); i++) {
    const c = chunks[i];
    console.log(`--- Chunk ${i + 1} (${c.content.length} chars) ---`);
    console.log(`source_ref: ${c.source_ref}`);
    console.log(c.content.substring(0, 500));
    console.log('...\n');
  }
}

testParsing().catch(console.error);
