// script/tracker-from-platform.cjs
// Consomme GET /api/v1/articles depuis earlybrief-platform (lecture seule)
// Génère public/outils/tracker/pending.json pour validation humaine
// NE MODIFIE PAS earlybrief-platform/

const fs = require('fs');
const path = require('path');

// ── Config ────────────────────────────────────────────────
const PLATFORM_URL = process.env.PLATFORM_URL || 'http://localhost:8000';
const PLATFORM_TOKEN = process.env.PLATFORM_TOKEN;
const DAYS_BACK = parseInt(process.env.DAYS_BACK || '14');
const SCORE_MIN = parseInt(process.env.SCORE_MIN || '30');

if (!PLATFORM_TOKEN) {
  console.error('PLATFORM_TOKEN manquant');
  process.exit(1);
}

// Sources pertinentes pour le tracker
const TRACKER_SOURCES = [
  'AMLA', 'EBA', 'ESMA', 'AMF', 'ACPR', 'Tracfin',
  'FATF', 'Conseil UE', 'Commission EU', 'CNIL'
];

function stripHtml(str) {
  if (!str) return '';
  return str
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

// Mapping priorité plateforme → statut tracker
const PRIORITY_TO_STATUT = {
  critical: 'publié',
  high: 'publié',
  normal: 'publié',
  low: 'publié'
};

// ── Fetch articles depuis la plateforme ───────────────────
async function fetchArticles() {
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - DAYS_BACK);
  const minDate = new Date('2026-01-01');
  const effectiveDate = dateFrom < minDate ? minDate : dateFrom;
  const dateFromStr = effectiveDate.toISOString().split('T')[0];

  const url = `${PLATFORM_URL}/api/v1/articles?date_from=${dateFromStr}&page_size=500`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${PLATFORM_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.items || [];
}

// ── Charger les URLs déjà dans le tracker ─────────────────
function loadExistingUrls() {
  const dataPath = path.join(__dirname, '../public/outils/tracker/tracker-data.json');
  if (!fs.existsSync(dataPath)) return new Set();
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  return new Set(data.map(e => e.url));
}

// ── Charger les URLs déjà en pending ──────────────────────
function loadPendingUrls() {
  const pendingPath = path.join(__dirname, '../public/outils/tracker/pending.json');
  if (!fs.existsSync(pendingPath)) return new Set();
  const data = JSON.parse(fs.readFileSync(pendingPath, 'utf8'));
  return new Set((data.candidates || []).map(e => e.url));
}

// ── Convertir un article plateforme → candidat tracker ────
function toTrackerCandidate(article) {
  const date = article.published_at
    ? new Date(article.published_at).toLocaleDateString('fr-FR')
    : new Date().toLocaleDateString('fr-FR');

  return {
    id: `candidate-${article.id}`,
    titre: article.title,
    url: article.original_url,
    source: article.source_name || 'Autre',
    date,
    description: stripHtml(article.summary) || '',
    type_source: 'officielle',
    statut: PRIORITY_TO_STATUT[article.priority] || 'publié',
    priority: article.priority,
    score: article.score,
    detecte_le: new Date().toISOString(),
    platform_id: article.id
  };
}

// ── Main ──────────────────────────────────────────────────
async function run() {
  console.log(`Paramètres : DAYS_BACK=${DAYS_BACK}, SCORE_MIN=${SCORE_MIN}, depuis 2026-01-01`);
  console.log(`Fetching articles depuis ${PLATFORM_URL} (${DAYS_BACK} derniers jours)...`);

  let articles;
  try {
    articles = await fetchArticles();
  } catch (err) {
    console.error('Erreur fetch:', err.message);
    process.exit(1);
  }

  console.log(`${articles.length} articles récupérés`);

  const existingUrls = loadExistingUrls();
  const pendingUrls = loadPendingUrls();

  const candidates = articles
    .filter(a => {
      const source = a.source_name || '';
      const isTrackerSource = TRACKER_SOURCES.some(s =>
        source.toLowerCase().includes(s.toLowerCase())
      );
      const isNew = !existingUrls.has(a.original_url) && !pendingUrls.has(a.original_url);
      const hasUrl = !!a.original_url;
      const hasScore = (a.score || 0) >= SCORE_MIN;
      const afterCutoff = !a.published_at || new Date(a.published_at) >= new Date('2026-01-01');
      const isNotGoogleNews = !a.original_url.includes('news.google.com');

      return isTrackerSource && isNew && hasUrl && hasScore && afterCutoff && isNotGoogleNews;
    })
    .map(toTrackerCandidate)
    .sort((a, b) => (b.score || 0) - (a.score || 0));

  const pendingPath = path.join(__dirname, '../public/outils/tracker/pending.json');
  fs.writeFileSync(pendingPath, JSON.stringify({
    generated_at: new Date().toISOString(),
    source: 'earlybrief-platform',
    days_back: DAYS_BACK,
    total_fetched: articles.length,
    candidates
  }, null, 2) + '\n');

  console.log(`✓ ${candidates.length} candidats écrits dans pending.json`);
  if (candidates.length > 0) {
    console.log('\nAperçu :');
    candidates.slice(0, 5).forEach(c => {
      console.log(`  [${c.source}] ${c.titre.slice(0, 60)}...`);
    });
  }
}

run();
