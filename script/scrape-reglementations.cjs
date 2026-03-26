#!/usr/bin/env node
/**
 * Scrape regulatory sources and detect changes.
 * Writes detected changes to src/data/reglementations-pending.json
 * Never modifies src/data/reglementations.json directly.
 *
 * Usage: node script/scrape-reglementations.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const DATA_DIR = path.join(__dirname, '..', 'src', 'data');
const REG_FILE = path.join(DATA_DIR, 'reglementations.json');
const PENDING_FILE = path.join(DATA_DIR, 'reglementations-pending.json');
const ERROR_LOG = path.join(__dirname, 'scrape-errors.log');

const DELAY_MS = 2000;

// ── Helpers ──

function fetch(url, redirects = 3) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, { headers: { 'User-Agent': 'EarlyBrief-Scraper/1.0' }, timeout: 15000 }, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location && redirects > 0) {
        const next = new URL(res.headers.location, url).href;
        return resolve(fetch(next, redirects - 1));
      }
      let body = '';
      res.on('data', (c) => body += c);
      res.on('end', () => resolve({ status: res.statusCode, body, headers: res.headers }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function logError(id, msg) {
  const line = `[${new Date().toISOString()}] ${id}: ${msg}\n`;
  fs.appendFileSync(ERROR_LOG, line);
  console.error(`  ✗ ${id}: ${msg}`);
}

function extractMeta(html, source) {
  const meta = {};

  // Last modified from HTTP or page content
  if (source.includes('eur-lex.europa.eu')) {
    // Check for consolidated versions or corrigenda links
    const corrigendaMatch = html.match(/corrigend[aum]/i);
    if (corrigendaMatch) meta.has_corrigenda = true;

    // Check for "consolidated text" link
    const consolidatedMatch = html.match(/texte\s+consolid[ée]/i) || html.match(/consolidated\s+text/i);
    if (consolidatedMatch) meta.has_consolidated_version = true;

    // Extract celex number pattern for amendments
    const amendments = [];
    const amendRegex = /3\d{4}[RL]\d{4}/g;
    let m;
    while ((m = amendRegex.exec(html)) !== null) {
      if (!amendments.includes(m[0])) amendments.push(m[0]);
    }
    if (amendments.length > 3) meta.amendment_count = amendments.length;

  } else if (source.includes('eba.europa.eu') || source.includes('esma.europa.eu')) {
    // Look for publication dates
    const dateMatches = html.match(/\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}/g);
    if (dateMatches && dateMatches.length > 0) {
      meta.latest_date_found = dateMatches[dateMatches.length - 1];
    }

  } else if (source.includes('legifrance.gouv.fr')) {
    // Check version en vigueur
    const versionMatch = html.match(/Version\s+en\s+vigueur\s+(?:au|depuis)\s+le\s+(\d{2}\s+\w+\s+\d{4})/i);
    if (versionMatch) meta.version_en_vigueur = versionMatch[1];

  } else if (source.includes('acpr.banque-france.fr')) {
    // Look for update dates
    const updateMatch = html.match(/(?:mis\s+à\s+jour|publié)\s+le\s+(\d{2}\/\d{2}\/\d{4})/i);
    if (updateMatch) meta.derniere_maj = updateMatch[1];
  }

  return meta;
}

// ── Main ──

async function main() {
  console.log('🔍 Scraping regulatory sources...\n');

  const data = JSON.parse(fs.readFileSync(REG_FILE, 'utf-8'));
  const textes = data.textes;
  const pending = [];

  for (const texte of textes) {
    const url = texte.lien_texte_consolide;
    if (!url) {
      console.log(`  ⊘ ${texte.id}: pas de lien`);
      continue;
    }

    console.log(`  → ${texte.id}: ${url.substring(0, 70)}...`);

    try {
      const res = await fetch(url);

      if (res.status === 404 || res.status >= 500) {
        pending.push({
          id: texte.id,
          type_changement: 'lien_mort',
          description: `HTTP ${res.status} sur ${url}`,
          url_detectee: url,
          valeur_actuelle: url,
          valeur_proposee: null,
          champ: 'lien_texte_consolide',
          statut: 'en_attente',
          detecte_le: new Date().toISOString()
        });
        continue;
      }

      const meta = extractMeta(res.body, url);

      // Detect significant changes
      if (meta.has_corrigenda) {
        pending.push({
          id: texte.id,
          type_changement: 'page_modifiee',
          description: `Corrigendum détecté pour ${texte.reference}`,
          url_detectee: url,
          valeur_actuelle: null,
          valeur_proposee: 'Vérifier le corrigendum sur eur-lex',
          champ: 'notes',
          statut: 'en_attente',
          detecte_le: new Date().toISOString()
        });
      }

      if (meta.amendment_count && meta.amendment_count > 10) {
        pending.push({
          id: texte.id,
          type_changement: 'nouveau_texte_lie',
          description: `${meta.amendment_count} références CELEX détectées — possible amendement récent`,
          url_detectee: url,
          valeur_actuelle: texte.textes_lies.length + ' textes liés',
          valeur_proposee: 'Vérifier les amendements récents',
          champ: 'textes_lies',
          statut: 'en_attente',
          detecte_le: new Date().toISOString()
        });
      }

      if (meta.version_en_vigueur) {
        pending.push({
          id: texte.id,
          type_changement: 'page_modifiee',
          description: `Legifrance : version en vigueur ${meta.version_en_vigueur}`,
          url_detectee: url,
          valeur_actuelle: texte.date_application,
          valeur_proposee: meta.version_en_vigueur,
          champ: 'date_application',
          statut: 'en_attente',
          detecte_le: new Date().toISOString()
        });
      }

    } catch (err) {
      logError(texte.id, err.message);
    }

    await sleep(DELAY_MS);
  }

  // Write pending
  const output = {
    generated_at: new Date().toISOString(),
    pending
  };

  fs.writeFileSync(PENDING_FILE, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`\n✅ Done. ${pending.length} changement(s) détecté(s) → ${PENDING_FILE}`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
