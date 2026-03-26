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

  res.writeHead(404); res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`\n  Admin server: http://localhost:${PORT}\n`);
  console.log(`  Pending file: ${PENDING_FILE}`);
  console.log(`  Reg file:     ${REG_FILE}\n`);
});
