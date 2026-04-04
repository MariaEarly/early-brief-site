// scripts/ingest-corpus.js
// Usage: node scripts/ingest-corpus.cjs

// Charger .env local
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const [k, ...v] = line.split('=');
    if (k && v.length) process.env[k.trim()] = v.join('=').trim();
  }
}

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const OPENLEGI_TOKEN = process.env.OPENLEGI_TOKEN;

const CMF_ARTICLES = [
  { id: "LEGIARTI000033517742", label: "CMF L.561-5 — Identification client", category: "lcb-ft" },
  { id: "LEGIARTI000041592134", label: "CMF L.561-2-2 — Bénéficiaire effectif définition", category: "lcb-ft" },
  { id: "LEGIARTI000053153188", label: "CMF L.561-10 — Vigilance complémentaire PPE pays risque", category: "lcb-ft" },
  { id: "LEGIARTI000033517667", label: "CMF L.561-10-1 — Vigilance renforcée risque élevé", category: "lcb-ft" },
  { id: "LEGIARTI000041592332", label: "CMF R.561-18 — PPE définition catégories", category: "lcb-ft" },
  { id: "LEGIARTI000041578272", label: "CMF L.561-46 — PPE durée post-mandat 12 mois", category: "lcb-ft" },
  { id: "LEGIARTI000041592285", label: "CMF R.561-12 — Vigilance constante relation affaires", category: "lcb-ft" },
  { id: "LEGIARTI000041592315", label: "CMF R.561-20 — Mesures vérification distance", category: "lcb-ft" },
  { id: "LEGIARTI000041577825", label: "CMF L.561-15 — Déclaration de soupçon Tracfin", category: "lcb-ft" },
  { id: "LEGIARTI000006645026", label: "CMF L.561-18 — Tipping-off interdit", category: "lcb-ft" },
  { id: "LEGIARTI000006645030", label: "CMF L.561-22 — Non-responsabilité bonne foi DS", category: "lcb-ft" },
  { id: "LEGIARTI000041577831", label: "CMF L.561-24 — Droit opposition Tracfin 10 jours", category: "lcb-ft" },
  { id: "LEGIARTI000041577809", label: "CMF L.561-12 — Conservation documents 5 ans", category: "lcb-ft" },
  { id: "LEGIARTI000006645084", label: "CMF L.562-1 — Gel des avoirs principe", category: "lcb-ft" },
  { id: "LEGIARTI000006645088", label: "CMF L.562-4 — Obligations assujettis gel avoirs", category: "lcb-ft" },
  // ── Identification personnes morales ──
  { id: "LEGIARTI000041577875", label: "CMF L.561-5-1 — Documents personnes morales", category: "lcb-ft" },
  { id: "LEGIARTI000041577869", label: "CMF L.561-5-2 — Vérification identité à distance", category: "lcb-ft" },
  { id: "LEGIARTI000041577863", label: "CMF L.561-5-3 — Identification bénéficiaire opération", category: "lcb-ft" },
  { id: "LEGIARTI000033517738", label: "CMF L.561-6 — Identification client occasionnel", category: "lcb-ft" },
  { id: "LEGIARTI000041577856", label: "CMF L.561-7 — Exemptions identification", category: "lcb-ft" },
  { id: "LEGIARTI000041592324", label: "CMF R.561-5 — Modalités identification personnes physiques", category: "lcb-ft" },
  { id: "LEGIARTI000041592320", label: "CMF R.561-5-1 — Modalités identification personnes morales", category: "lcb-ft" },
  { id: "LEGIARTI000041592316", label: "CMF R.561-5-2 — Deux mesures vérification distance", category: "lcb-ft" },
  { id: "LEGIARTI000041592312", label: "CMF R.561-5-3 — Vérification identité tiers", category: "lcb-ft" },
  { id: "LEGIARTI000041592308", label: "CMF R.561-5-4 — Mandataires", category: "lcb-ft" },
];

// ============================================================
// CORPUS — vidé : tous les chunks manuels remplacés par des
// sources officielles (EU FR, CMF OpenLegi, PDF ACPR)
// ============================================================
const CORPUS = [];

async function getEmbedding(text) {
  const response = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.VOYAGE_API_KEY}`
    },
    body: JSON.stringify({
      model: 'voyage-3',
      input: text,
      input_type: 'document'
    })
  });
  const data = await response.json();
  if (!data.data || !data.data[0]) {
    throw new Error(`Voyage AI error: ${JSON.stringify(data)}`);
  }
  return data.data[0].embedding;
}

// Initialise une session MCP OpenLegi et retourne le session ID
let mcpSessionId = null;
async function initMCPSession() {
  if (mcpSessionId) return mcpSessionId;

  const res = await fetch('https://mcp.openlegi.fr/legifrance/mcp', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENLEGI_TOKEN}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream'
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'early-brief', version: '1.0' }
      }
    })
  });

  const sessionHeader = res.headers.get('mcp-session-id');
  if (!sessionHeader) throw new Error('Pas de session MCP retournée');
  mcpSessionId = sessionHeader;
  console.log(`  Session MCP: ${mcpSessionId.slice(0, 8)}...`);
  return mcpSessionId;
}

async function fetchCMFArticle(articleNum) {
  if (!OPENLEGI_TOKEN) throw new Error('OPENLEGI_TOKEN manquant');

  const sessionId = await initMCPSession();

  const response = await fetch('https://mcp.openlegi.fr/legifrance/mcp', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENLEGI_TOKEN}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'Mcp-Session-Id': sessionId
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'rechercher_code',
        arguments: {
          search: articleNum,
          code_name: 'Code monétaire et financier',
          champ: 'NUM_ARTICLE',
          formatter: true
        }
      }
    })
  });

  if (!response.ok) {
    // Session expirée ? Réinitialiser
    if (response.status === 400) {
      mcpSessionId = null;
      throw new Error(`OpenLegi HTTP ${response.status} — session expirée, relancer`);
    }
    throw new Error(`OpenLegi HTTP ${response.status}`);
  }

  const text = await response.text();

  // Parser format SSE (Server-Sent Events)
  for (const line of text.split('\n')) {
    if (line.startsWith('data: ')) {
      try {
        const data = JSON.parse(line.slice(6));
        const content = data?.result?.content?.[0]?.text;
        if (content && content.length > 50) return content;
      } catch {}
    }
  }

  // Fallback : chercher du JSON dans la réponse brute
  try {
    const json = JSON.parse(text);
    const content = json?.result?.content?.[0]?.text;
    if (content) return content;
  } catch {}

  console.log(`  ⚠️ Réponse brute OpenLegi (${articleNum}):`, text.slice(0, 200));
  return null;
}

async function ingestCMFArticles() {
  console.log(`\nIngestion de ${CMF_ARTICLES.length} articles CMF via OpenLegi...`);

  let success = 0;
  let failed = 0;

  for (const article of CMF_ARTICLES) {
    console.log(`→ ${article.label}`);

    try {
      // Extraire le numéro d'article du label (ex: "CMF L.561-5 — ..." → "L561-5")
      const articleNum = article.label.match(/CMF ([LR]\.\d[\d\-]+)/)?.[1]?.replace('.', '') || article.id;
      const content = await fetchCMFArticle(articleNum);

      if (!content) {
        console.log(`  ⚠️ Contenu vide — ignoré`);
        failed++;
        continue;
      }

      // Tronquer à 3000 chars max par chunk (limite embedding)
      const truncated = content.slice(0, 3000);
      const sourceUrl = `https://www.legifrance.gouv.fr/codes/article_lc/${article.id}`;
      const embedding = await getEmbedding(truncated);

      const { error } = await supabase
        .from('regulatory_chunks')
        .upsert({
          content: truncated,
          source_label: article.label,
          source_url: sourceUrl,
          source_ref: article.label,
          category: article.category,
          embedding,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'source_ref'
        });

      if (error) {
        console.error(`  ❌ Supabase: ${error.message}`);
        failed++;
      } else {
        console.log(`  ✓ indexé (${truncated.length} chars)`);
        success++;
      }

    } catch (err) {
      console.error(`  ❌ Erreur: ${err.message}`);
      failed++;
    }

    // Rate limiting
    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`\nCMF : ${success} indexés, ${failed} échoués`);
}

// ── RÈGLEMENTS EU — chunking automatique article par article ──────────────
const EU_REGULATIONS = [
  {
    celex: "32023R1113",
    label: "TFR — Règlement sur les transferts de fonds",
    category: "mica",
    file: "tfr-fr.html"
  },
  {
    celex: "32023R1114",
    label: "MiCA — Règlement sur les marchés de crypto-actifs",
    category: "mica",
    file: "mica-fr.html"
  },
  {
    celex: "32024R1624",
    label: "AMLR — Règlement anti-blanchiment",
    category: "lcb-ft",
    file: "amlr-fr.html"
  },
  {
    celex: "32022R2554",
    label: "DORA — Règlement sur la résilience opérationnelle numérique",
    category: "dora",
    file: "dora-fr.html"
  },
  {
    celex: "32024L1640",
    label: "AMLD6 — Directive anti-blanchiment (UE) 2024/1640",
    category: "lcb-ft",
    file: "amld6-fr.html"
  },
  {
    celex: "32024R1620",
    label: "AMLA-REG — Règlement AMLA (UE) 2024/1620",
    category: "lcb-ft",
    file: "amla-regulation-fr.html"
  },
  {
    celex: "32025R0301",
    label: "DORA-RTS — Règlement délégué (UE) 2025/301 notifications incidents",
    category: "dora",
    file: "dora-rts-2025-301-fr.html"
  },
  {
    celex: "02012R0260-20240408",
    label: "SEPA 260/2012 consolidé — virements instantanés (IPR intégré)",
    category: "paiements",
    file: "sepa-260-2012-consolide-fr.html"
  },
];


function chunkByArticle(rawHtml, regulation) {
  const chunks = [];

  // Extraire les positions des vrais titres d'articles via les classes CSS EUR-Lex
  // oj-ti-art = textes originaux JO, title-article-norm = versions consolidées
  const artHeadingRegex = /<p[^>]*class="(?:oj-ti-art|title-article-norm)"[^>]*>\s*Article[\s&nbsp;]+(premier|\d+(?:er)?)\s*<\/p>/gi;
  const articlePositions = [];
  let m;
  while ((m = artHeadingRegex.exec(rawHtml)) !== null) {
    const num = m[1].toLowerCase() === 'premier' ? '1' : m[1].replace('er', '');
    articlePositions.push({ num, pos: m.index });
  }

  // Découper le HTML entre chaque titre d'article, puis nettoyer
  for (let i = 0; i < articlePositions.length; i++) {
    const start = articlePositions[i].pos;
    const end = i + 1 < articlePositions.length ? articlePositions[i + 1].pos : rawHtml.length;
    const htmlSlice = rawHtml.slice(start, end);

    // Nettoyer le HTML → texte
    const content = htmlSlice
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&rsquo;/g, "'")
      .replace(/&laquo;/g, '«')
      .replace(/&raquo;/g, '»')
      .replace(/&#\d+;/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();

    if (content.length < 100) continue;

    const label = `${regulation.label} — Art. ${articlePositions[i].num}`;
    const artNum = articlePositions[i].num;
    const sourceUrl = `https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:${regulation.celex}`;

    if (content.length <= 4000) {
      // Article court : un seul chunk
      chunks.push({
        content: `[${label}] ${content}`.slice(0, 4000),
        source_label: label,
        source_url: sourceUrl,
        source_ref: `${regulation.celex}-art-${artNum}`,
        category: regulation.category
      });
    } else {
      // Article long : subdiviser en sous-chunks de 2000 chars avec overlap 200
      const SUB_SIZE = 2000;
      const OVERLAP = 200;
      let pos = 0;
      let partIdx = 1;
      while (pos < content.length) {
        let end = pos + SUB_SIZE;
        // Couper à la dernière phrase complète si possible
        if (end < content.length) {
          const lastDot = content.lastIndexOf('. ', end);
          if (lastDot > pos + SUB_SIZE * 0.6) end = lastDot + 1;
        }
        const subContent = content.slice(pos, end).trim();
        if (subContent.length > 50) {
          chunks.push({
            content: `[${label} — partie ${partIdx}] ${subContent}`,
            source_label: `${label} — partie ${partIdx}`,
            source_url: sourceUrl,
            source_ref: `${regulation.celex}-art-${artNum}-part-${partIdx}`,
            category: regulation.category
          });
          partIdx++;
        }
        pos = end - OVERLAP;
      }
    }
  }

  return chunks;
}

async function ingestEURegulations() {
  console.log(`\nIngestion de ${EU_REGULATIONS.length} règlements EU (chunking automatique)...`);

  for (const regulation of EU_REGULATIONS) {
    console.log(`\n${regulation.label} (${regulation.celex})`);

    const filePath = path.join(__dirname, 'data', regulation.file);
    if (!fs.existsSync(filePath)) {
      console.log(`  ⚠️ Fichier scripts/data/${regulation.file} absent — ignoré`);
      continue;
    }
    const rawHtml = fs.readFileSync(filePath, 'utf8');
    console.log(`  HTML chargé : ${rawHtml.length} chars`);

    const chunks = chunkByArticle(rawHtml, regulation);
    console.log(`  ${chunks.length} articles détectés`);

    if (chunks.length === 0) {
      console.log(`  ⚠️ Aucun article extrait — vérifier le parsing`);
      continue;
    }

    console.log(`  Aperçu des 3 premiers chunks :`);
    chunks.slice(0, 3).forEach(c => {
      console.log(`    → ${c.source_label} (${c.content.length} chars)`);
      console.log(`      ${c.content.slice(0, 100)}...`);
    });

    let success = 0;
    let failed = 0;

    for (const chunk of chunks) {
      try {
        const embedding = await getEmbedding(chunk.content);

        const { error } = await supabase
          .from('regulatory_chunks')
          .upsert({
            content: chunk.content,
            source_label: chunk.source_label,
            source_url: chunk.source_url,
            source_ref: chunk.source_ref,
            category: chunk.category,
            embedding,
            updated_at: new Date().toISOString()
          }, { onConflict: 'source_ref' });

        if (error) { failed++; console.error(`  ❌ ${chunk.source_label}: ${error.message}`); }
        else success++;

      } catch (err) {
        failed++;
        console.error(`  ❌ ${chunk.source_label}: ${err.message}`);
      }

      // Rate limiting Voyage AI (3 RPM sans carte)
      await new Promise(r => setTimeout(r, 100));
    }

    console.log(`  ✓ ${success} indexés, ${failed} échoués`);

    // 2 secondes entre chaque règlement
    await new Promise(r => setTimeout(r, 2000));
  }
}

const cmfOnly = process.argv.includes('--cmf-only');
const euOnly = process.argv.includes('--eu-only');
const manualOnly = process.argv.includes('--manual-only');
const filesIdx = process.argv.indexOf('--files');
const filesArg = process.argv.find(a => a.startsWith('--files='));
const filesFilter = filesArg
  ? filesArg.split('=')[1].split(',').filter(Boolean)
  : (filesIdx > -1 && process.argv[filesIdx + 1] ? process.argv[filesIdx + 1].split(',').filter(Boolean) : []);

async function ingest() {
  if (manualOnly) {
    console.log(`Mode --manual-only : ingestion de ${CORPUS.length} chunks manuels`);
    for (const chunk of CORPUS) {
      console.log(`→ ${chunk.source_label}`);
      const embedding = await getEmbedding(chunk.content);
      const { error } = await supabase.from('regulatory_chunks').upsert({
        content: chunk.content, source_label: chunk.source_label,
        source_url: chunk.source_url, source_ref: chunk.source_ref,
        category: chunk.category, embedding, updated_at: new Date().toISOString()
      }, { onConflict: 'source_ref' });
      if (error) console.error(`  ✗ Erreur: ${error.message}`);
      else console.log(`  ✓ indexé`);
      await new Promise(r => setTimeout(r, 100));
    }
    console.log('\nIngestion manuelle terminée.');
    return;
  }

  if (euOnly) {
    let regs = EU_REGULATIONS;
    if (filesFilter.length) {
      regs = regs.filter(r => filesFilter.some(f => r.file.includes(f)));
      console.log(`Mode --eu-only --files : ${regs.length} règlement(s) filtré(s)`);
    } else {
      console.log(`Mode --eu-only : ${regs.length} règlements EU`);
    }
    // Inline EU ingestion with filtered list
    for (const regulation of regs) {
      console.log(`\n${regulation.label} (${regulation.celex})`);
      const filePath = path.join(__dirname, 'data', regulation.file);
      if (!fs.existsSync(filePath)) {
        console.log(`  ⚠️ Fichier scripts/data/${regulation.file} absent — ignoré`);
        continue;
      }
      const rawHtml = fs.readFileSync(filePath, 'utf8');
      const chunks = chunkByArticle(rawHtml, regulation);
      console.log(`  ${chunks.length} articles détectés`);
      let success = 0, failed = 0;
      for (const chunk of chunks) {
        try {
          const embedding = await getEmbedding(chunk.content);
          const { error } = await supabase.from('regulatory_chunks').upsert({
            content: chunk.content, source_label: chunk.source_label,
            source_url: chunk.source_url, source_ref: chunk.source_ref,
            category: chunk.category, embedding, updated_at: new Date().toISOString()
          }, { onConflict: 'source_ref' });
          if (error) { failed++; console.error(`  ❌ ${chunk.source_label}: ${error.message}`); }
          else { success++; if (success % 20 === 0) console.log(`  … ${success}/${chunks.length}`); }
        } catch (err) { failed++; console.error(`  ❌ ${chunk.source_label}: ${err.message}`); }
        await new Promise(r => setTimeout(r, 100));
      }
      console.log(`  ✓ ${success} indexés, ${failed} échoués`);
    }
    console.log('\nIngestion EU terminée.');
    return;
  }

  if (cmfOnly) {
    console.log('Mode --cmf-only : ingestion CMF uniquement');
    if (!OPENLEGI_TOKEN) {
      console.error('❌ OPENLEGI_TOKEN requis pour --cmf-only');
      process.exit(1);
    }
    await ingestCMFArticles();
    console.log('\nIngestion CMF terminée.');
    return;
  }

  console.log(`Ingestion de ${CORPUS.length} chunks...`);

  for (const chunk of CORPUS) {
    console.log(`→ ${chunk.source_label}`);

    const embedding = await getEmbedding(chunk.content);

    const { error } = await supabase
      .from('regulatory_chunks')
      .upsert({
        content: chunk.content,
        source_label: chunk.source_label,
        source_url: chunk.source_url,
        source_ref: chunk.source_ref,
        category: chunk.category,
        embedding,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'source_ref'
      });

    if (error) console.error(`  ✗ Erreur: ${error.message}`);
    else console.log(`  ✓ indexé`);

    // Rate limiting Voyage AI
    await new Promise(r => setTimeout(r, 100));
  }

  // Ingestion automatique articles CMF via OpenLegi
  if (OPENLEGI_TOKEN) {
    await ingestCMFArticles();
  } else {
    console.log('\n⚠️ OPENLEGI_TOKEN absent — ingestion CMF ignorée');
  }

  // Ingestion automatique règlements EU
  await ingestEURegulations();

  console.log('\nIngestion terminée.');
}

ingest().catch(console.error);
