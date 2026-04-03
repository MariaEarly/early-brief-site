#!/usr/bin/env node
/**
 * Migration: classify all tracker entries via Claude API
 * Splits into tracker-data.json (TEXTE/DECISION/CONSULTATION)
 * and autres-publications-data.json (RAPPORT/INTELLIGENCE)
 *
 * Usage: ANTHROPIC_API_KEY=xxx node script/migrate-tracker-march.cjs
 */

const fs = require('fs');
const path = require('path');

const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY) {
  console.error('ERROR: ANTHROPIC_API_KEY required');
  process.exit(1);
}

const TRACKER_PATH = path.join(__dirname, '..', 'public', 'outils', 'tracker', 'tracker-data.json');
const AUTRES_PATH = path.join(__dirname, '..', 'public', 'outils', 'autres-publications', 'autres-publications-data.json');

const SYSTEM_PROMPT = `Tu classifies des publications réglementaires.

Réponds UNIQUEMENT en JSON valide, rien d'autre.

Types disponibles :
- TEXTE : règlement, directive, RTS, ITS, ordonnance, décret, arrêté — crée des obligations
- DECISION : sanction, amende, retrait d'agrément, injonction nominative
- CONSULTATION : draft RTS, consultation publique, call for evidence
- RAPPORT : rapport, étude, analyse, bilan, évaluation mutuelle, typologies
- INTELLIGENCE : speech, Q&A, position paper, MoU, communiqué, advisory, guidelines non contraignantes

Destination :
- "tracker" si TEXTE, DECISION ou CONSULTATION
- "autres-publications" si RAPPORT ou INTELLIGENCE

Utilise exactement ces valeurs de destination, sans variante.`;

async function classify(titre, source) {
  const body = JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 50,
    temperature: 0,
    system: SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `Source : ${source}\nTitre : ${titre}\n\nRéponds : {"type": "...", "destination": "..."}`
    }]
  });

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body
  });

  const data = await res.json();
  if (!res.ok) {
    console.error(`  API error: ${JSON.stringify(data)}`);
    return { type: 'INTELLIGENCE', destination: 'autres-publications' };
  }

  try {
    return JSON.parse(data.content[0].text.trim());
  } catch {
    console.error(`  Parse error: ${data.content[0].text}`);
    return { type: 'INTELLIGENCE', destination: 'autres-publications' };
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const trackerData = JSON.parse(fs.readFileSync(TRACKER_PATH, 'utf-8'));
  const autresData = JSON.parse(fs.readFileSync(AUTRES_PATH, 'utf-8'));

  const toClassify = trackerData.filter(e => !e.type);
  const alreadyDone = trackerData.filter(e => e.type);

  console.log(`Total entries: ${trackerData.length}`);
  console.log(`Already classified: ${alreadyDone.length}`);
  console.log(`To classify: ${toClassify.length}`);
  console.log('');

  const BATCH_SIZE = 5;
  const keepInTracker = [...alreadyDone];
  const moveToAutres = [...autresData];

  for (let i = 0; i < toClassify.length; i += BATCH_SIZE) {
    const batch = toClassify.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async entry => {
        const cls = await classify(entry.titre, entry.source);
        return { entry, cls };
      })
    );

    for (const { entry, cls } of results) {
      entry.type = cls.type || 'INTELLIGENCE';
      const dest = cls.destination || 'autres-publications';
      const arrow = dest === 'tracker' ? '→ TRACKER' : '→ AUTRES';
      console.log(`  ${cls.type.padEnd(14)} ${arrow.padEnd(12)} [${entry.source}] ${entry.titre.substring(0, 60)}`);

      if (dest === 'tracker') {
        keepInTracker.push(entry);
      } else {
        moveToAutres.push(entry);
      }
    }

    const done = Math.min(i + BATCH_SIZE, toClassify.length);
    console.log(`  --- ${done}/${toClassify.length} done ---\n`);

    if (i + BATCH_SIZE < toClassify.length) {
      await sleep(500);
    }
  }

  // Write files
  fs.writeFileSync(TRACKER_PATH, JSON.stringify(keepInTracker, null, 2));
  fs.writeFileSync(AUTRES_PATH, JSON.stringify(moveToAutres, null, 2));

  console.log('='.repeat(50));
  console.log(`tracker-data.json:              ${keepInTracker.length} entries`);
  console.log(`autres-publications-data.json:  ${moveToAutres.length} entries`);
  console.log('Done.');
}

main().catch(err => { console.error(err); process.exit(1); });
