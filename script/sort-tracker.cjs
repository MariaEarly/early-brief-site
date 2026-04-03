#!/usr/bin/env node
/**
 * sort-tracker.cjs
 * Trie tracker-data.json et autres-publications-data.json par date décroissante.
 * Format date : JJ/MM/AAAA
 */
const fs = require('fs');
const path = require('path');

const files = [
  path.join(__dirname, '..', 'public', 'outils', 'tracker', 'tracker-data.json'),
  path.join(__dirname, '..', 'public', 'outils', 'autres-publications', 'autres-publications-data.json'),
];

function parseDate(dateStr) {
  if (!dateStr || !dateStr.includes('/')) return 0;
  const [dd, mm, yyyy] = dateStr.split('/');
  return parseInt(yyyy + mm + dd, 10);
}

for (const filePath of files) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const before = data.length;

  data.sort((a, b) => parseDate(b.date) - parseDate(a.date));

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  const name = path.basename(filePath);
  console.log(`${name} : ${before} entrées triées (${data[0]?.date} → ${data[before - 1]?.date})`);
}
