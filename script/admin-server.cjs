#!/usr/bin/env node
/**
 * Local admin server for validating regulatory changes.
 * Usage: node script/admin-server.cjs
 * Opens http://localhost:3333
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3333;
const DATA_DIR = path.join(__dirname, '..', 'src', 'data');
const REG_FILE = path.join(DATA_DIR, 'reglementations.json');
const PENDING_FILE = path.join(DATA_DIR, 'reglementations-pending.json');
const TRACKER_DIR = path.join(__dirname, '..', 'public', 'outils', 'tracker');
const TRACKER_DATA = path.join(TRACKER_DIR, 'tracker-data.json');
const TRACKER_PENDING = path.join(TRACKER_DIR, 'pending.json');

const server = http.createServer((req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // Serve admin page
  if (req.url === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(fs.readFileSync(path.join(__dirname, 'admin-validate.html')));
    return;
  }

  // Get pending changes
  if (req.url === '/api/pending' && req.method === 'GET') {
    try {
      const data = fs.existsSync(PENDING_FILE) ? fs.readFileSync(PENDING_FILE, 'utf-8') : '{"generated_at":null,"pending":[]}';
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(data);
    } catch (e) {
      res.writeHead(500); res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // Accept a change — POST /api/accept { index: 0 }
  if (req.url === '/api/accept' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const { index } = JSON.parse(body);
        const pending = JSON.parse(fs.readFileSync(PENDING_FILE, 'utf-8'));
        const change = pending.pending[index];
        if (!change) { res.writeHead(404); res.end('Not found'); return; }

        // Mark as validated and remove from pending
        change.statut = 'validé';
        pending.pending.splice(index, 1);
        fs.writeFileSync(PENDING_FILE, JSON.stringify(pending, null, 2), 'utf-8');

        // Note: actual integration into reglementations.json requires manual review
        // The change is logged for now
        console.log(`✓ Accepted: ${change.id} — ${change.type_changement}`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, remaining: pending.pending.length }));
      } catch (e) {
        res.writeHead(500); res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // Reject a change — DELETE /api/reject { index: 0 }
  if (req.url === '/api/reject' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const { index } = JSON.parse(body);
        const pending = JSON.parse(fs.readFileSync(PENDING_FILE, 'utf-8'));
        const change = pending.pending[index];
        if (!change) { res.writeHead(404); res.end('Not found'); return; }

        console.log(`✗ Rejected: ${change.id} — ${change.type_changement}`);
        pending.pending.splice(index, 1);
        fs.writeFileSync(PENDING_FILE, JSON.stringify(pending, null, 2), 'utf-8');

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, remaining: pending.pending.length }));
      } catch (e) {
        res.writeHead(500); res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // ── Tracker: GET /api/tracker/pending ──────────────────
  if (req.url === '/api/tracker/pending' && req.method === 'GET') {
    try {
      if (!fs.existsSync(TRACKER_PENDING)) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ candidates: [], generated_at: new Date().toISOString() }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(fs.readFileSync(TRACKER_PENDING, 'utf-8'));
    } catch (e) {
      res.writeHead(500); res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // ── Tracker: POST /api/tracker/approve ────────────────
  if (req.url === '/api/tracker/approve' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const { entries } = JSON.parse(body);
        if (!entries || !Array.isArray(entries)) {
          res.writeHead(400); res.end(JSON.stringify({ error: 'entries manquant' }));
          return;
        }

        // Séparer tracker vs actualités
        const toTracker = entries.filter(e => e.destination === 'tracker');
        const toActualites = entries.filter(e => e.destination !== 'tracker');

        // Tracker
        const trackerData = JSON.parse(fs.readFileSync(TRACKER_DATA, 'utf-8'));
        const existingTrackerUrls = new Set(trackerData.map(e => e.url));
        const newTrackerEntries = toTracker
          .filter(e => !existingTrackerUrls.has(e.url))
          .map(e => ({
            id: e.id.replace('candidate-', ''),
            date: e.date,
            source: e.source,
            titre: e.titre,
            description: e.description,
            url: e.url,
            type: e.type || 'TEXTE',
            type_source: 'officielle',
            statut: 'publié'
          }));
        trackerData.unshift(...newTrackerEntries);
        fs.writeFileSync(TRACKER_DATA, JSON.stringify(trackerData, null, 2));

        // Actualités
        const actualitesPath = path.join(__dirname, '..', 'public', 'outils', 'actualites', 'actualites-data.json');
        const actualitesData = JSON.parse(fs.readFileSync(actualitesPath, 'utf-8'));
        const existingActualitesUrls = new Set(actualitesData.map(e => e.url));
        const newActualitesEntries = toActualites
          .filter(e => !existingActualitesUrls.has(e.url))
          .map(e => ({
            id: e.id.replace('candidate-', ''),
            date: e.date,
            source: e.source,
            titre: e.titre,
            description: e.description,
            url: e.url,
            type: e.type || 'INTELLIGENCE',
            type_source: 'officielle',
            statut: 'publié'
          }));
        actualitesData.unshift(...newActualitesEntries);
        fs.writeFileSync(actualitesPath, JSON.stringify(actualitesData, null, 2));

        // Nettoyer pending.json — retirer les entrées traitées
        if (fs.existsSync(TRACKER_PENDING)) {
          const pending = JSON.parse(fs.readFileSync(TRACKER_PENDING, 'utf-8'));
          const approvedIds = new Set(entries.map(e => e.id));
          pending.candidates = (pending.candidates || []).filter(c => !approvedIds.has(c.id));
          fs.writeFileSync(TRACKER_PENDING, JSON.stringify(pending, null, 2));
        }

        console.log(`✓ ${newTrackerEntries.length} → tracker, ${newActualitesEntries.length} → actualités`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ added_tracker: newTrackerEntries.length, added_actualites: newActualitesEntries.length }));
      } catch (e) {
        res.writeHead(500); res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // ── Tracker: POST /api/tracker/publish — git add + commit + push
  if (req.url === '/api/tracker/publish' && req.method === 'POST') {
    const { exec } = require('child_process');
    const projectRoot = path.join(__dirname, '..');

    const date = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });

    const cmd = `cd "${projectRoot}" && git add public/outils/tracker/tracker-data.json public/outils/actualites/actualites-data.json && git commit -m "tracker+actualites: mise à jour ${date}" && git push`;

    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error('Git error:', stderr);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: stderr || error.message }));
        return;
      }
      console.log('Git push OK:', stdout);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, output: stdout }));
    });
    return;
  }

  res.writeHead(404); res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`\n  Admin server: http://localhost:${PORT}\n`);
  console.log(`  Pending file: ${PENDING_FILE}`);
  console.log(`  Reg file:     ${REG_FILE}\n`);
});
