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
];

// ============================================================
// CORPUS — à enrichir au fur et à mesure
// Chaque chunk = un article ou une section précise
// Ne jamais dépasser 800 mots par chunk
// ============================================================
const CORPUS = [
  // ── LCB-FT ──────────────────────────────────────────────
  {
    content: `L'article L.561-5 CMF impose aux personnes mentionnées à L.561-2 d'identifier leur client et, le cas échéant, le bénéficiaire effectif de celui-ci avant d'entrer en relation d'affaires ou d'exécuter une opération occasionnelle. La vérification de l'identité doit intervenir avant l'entrée en relation. En cas de risque faible, la vérification peut être différée pendant l'établissement de la relation, dans les conditions de l'article R.561-6.`,
    source_label: "CMF L.561-5 — Identification client",
    source_url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000033517742",
    source_ref: "Code monétaire et financier, Art. L.561-5",
    category: "lcb-ft"
  },
  {
    content: `L'article L.561-10 CMF (modifié par LOI n°2025-1249 du 22 décembre 2025) prévoit des mesures de vigilance complémentaires lorsque : 1° le client est une personne politiquement exposée (PPE) ou un proche/associé de PPE ; 2° le produit ou l'opération présente par sa nature un risque particulier d'anonymat (bons au porteur, jetons de monnaie électronique) ; 3° l'opération est réalisée avec des personnes physiques ou morales de pays à risque identifiés (listes GAFI, liste UE). La relation à distance n'est plus un cas autonome de vigilance renforcée au titre de L.561-10 depuis l'ordonnance n°2020-115 du 12 février 2020.`,
    source_label: "CMF L.561-10 — Vigilance complémentaire",
    source_url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000053153188",
    source_ref: "Code monétaire et financier, Art. L.561-10 (modifié LOI 2025-1249)",
    category: "lcb-ft"
  },
  {
    content: `Pour l'entrée en relation à distance, à défaut de recours à un moyen d'identification électronique offrant un niveau de garantie substantiel au sens du règlement eIDAS, les organismes financiers doivent mettre en œuvre au moins deux mesures distinctes parmi celles limitativement listées à l'article R.561-20 CMF. Une seule mesure est insuffisante. Cette exigence vaut également pour la vérification de l'identité du représentant légal agissant à distance. Source : LD ACPR identification/vérification/connaissance clientèle (16 décembre 2021, mises à jour décembre 2024), §49 et §53.`,
    source_label: "LD ACPR — Entrée en relation à distance : deux mesures R.561-20",
    source_url: "https://acpr.banque-france.fr/fr/publications-et-statistiques/publications/lignes-directrices-relatives-lidentification-la-verification-de-lidentite-et-la-connaissance-de-la",
    source_ref: "LD ACPR identification/vérification/connaissance clientèle, §49-53 (mise à jour déc. 2024)",
    category: "lcb-ft"
  },
  {
    content: `Le bénéficiaire effectif (L.561-2-2 CMF) est la personne physique qui détient, directement ou indirectement, plus de 25% du capital ou des droits de vote d'une personne morale, ou qui exerce par tout autre moyen un pouvoir de contrôle sur les organes de gestion, d'administration ou de direction, ou sur l'assemblée générale. Les deux branches sont alternatives : 25% OU contrôle. Un actionnaire à 20% qui contrôle le conseil d'administration est donc un bénéficiaire effectif.`,
    source_label: "CMF L.561-2-2 — Bénéficiaire effectif : définition",
    source_url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000041592134",
    source_ref: "Code monétaire et financier, Art. L.561-2-2",
    category: "lcb-ft"
  },
  {
    content: `Les PPE (personnes politiquement exposées) sont définies à l'article R.561-18 CMF : chefs d'État, membres de gouvernement, parlementaires, membres de cours suprêmes, dirigeants de banques centrales, officiers généraux, membres de conseil d'administration d'entreprises publiques, dirigeants d'organisations internationales — ainsi que les membres directs de leur famille (conjoint, enfants, parents) et les personnes connues pour leur être étroitement associées. La vigilance renforcée PPE s'applique pendant la durée de la relation d'affaires et au moins 12 mois après la fin du mandat (L.561-46 CMF).`,
    source_label: "CMF R.561-18 + L.561-46 — PPE : définition et durée",
    source_url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000041592332",
    source_ref: "CMF Art. R.561-18 et L.561-46",
    category: "lcb-ft"
  },
  // ── DORA ────────────────────────────────────────────────
  {
    content: `Le Règlement délégué (UE) 2025/301 Art. 5 fixe les délais de notification des incidents majeurs TIC sous DORA : notification initiale dans les 4 heures à compter de la classification de l'incident comme majeur, et au plus tard 24 heures après que l'entité en a eu connaissance. Rapport intermédiaire : au plus tard 72 heures après la notification initiale. Rapport final : au plus tard 1 mois après le rapport intermédiaire, ou après résolution définitive si l'incident n'est pas encore clôturé. Applicable depuis le 17 janvier 2025 pour les entités relevant de l'ACPR.`,
    source_label: "DORA — Délais notification incidents majeurs TIC",
    source_url: "https://eur-lex.europa.eu/legal-content/FR/ALL/?uri=CELEX%3A32025R0301",
    source_ref: "Règlement délégué (UE) 2025/301, Art. 5 — DORA Art. 19",
    category: "dora"
  },
  {
    content: `Le registre d'information DORA (RoI) doit être remis annuellement à l'ACPR via OneGate. Pour la campagne 2027 (données au 31/12/2026), l'échéance est le 31 mars 2027. Format : xBRL-CSV dans archive .zip encodée base64. Erreurs fréquentes identifiées par l'ACPR : date d'arrêté au mauvais format (utiliser 2026-12-31), arborescence non conforme au modèle EBA, encodage ANSI au lieu d'UTF-8. Source : webinaire ACPR DORA 23/01/2026.`,
    source_label: "DORA — Register of Information (RoI) : remise annuelle",
    source_url: "https://acpr.banque-france.fr/fr/reglementation/focus-sur-la-reglementation/transverse/digital-operational-resilience-act-dora",
    source_ref: "DORA Art. 28 + ITS (UE) 2024/2956 — Instruction ACPR",
    category: "dora"
  },
  // ── MICA / TRAVEL RULE ──────────────────────────────────
  {
    content: `Le Travel Rule crypto est régi par le Règlement (UE) 2023/1113 (TFR). Pour les transferts vers une adresse auto-hébergée (self-hosted wallet) supérieurs à 1 000 € : l'article 14 TFR impose au CASP de l'originator d'évaluer si l'adresse est détenue ou contrôlée par l'originator lui-même. Pour les transferts depuis une adresse auto-hébergée supérieurs à 1 000 € : l'article 16 TFR impose au CASP du bénéficiaire d'évaluer si l'adresse est détenue ou contrôlée par le bénéficiaire. Le TFR est un règlement distinct de MiCA, directement applicable — ne pas le rattacher à la transposition MiCA.`,
    source_label: "TFR Art. 14 et 16 — Self-hosted wallets",
    source_url: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32023R1113",
    source_ref: "Règlement (UE) 2023/1113, Art. 14 (vers self-hosted) et Art. 16 (depuis self-hosted)",
    category: "mica"
  },
  {
    content: `La période transitoire française MiCA pour les PSAN se termine le 1er juillet 2026. Les PSAN non encore agréés comme PSCA doivent cesser leurs activités à cette date. L'AMF a précisé (5 février 2026) que les PSAN qui n'obtiendront pas l'agrément doivent initier leur plan de cessation ordonnée dès le 30 mars 2026. La procédure d'agrément peut prendre jusqu'à 4 mois après réception d'un dossier complet — les dossiers incomplets ne déclenchent pas ce délai. Source : AMF, communiqué 5 février 2026.`,
    source_label: "MiCA — Fin période transitoire PSAN → PSCA : 1er juillet 2026",
    source_url: "https://www.amf-france.org/fr/actualites-publications/actualites/lamf-rappelle-que-la-periode-transitoire-pour-les-psan-pour-continuer-de-fournir-des-services-sur",
    source_ref: "Règlement (UE) 2023/1114, Art. 143 + Loi DDADUE Art. 8 III — AMF 05/02/2026",
    category: "mica"
  },
  // ── PAIEMENTS ───────────────────────────────────────────
  {
    content: `Le filtrage quotidien des sanctions sous le Règlement (UE) 2024/886 (IPR) est obligatoire depuis le 9 janvier 2025 pour tous les PSP y compris les EME. L'obligation porte sur l'ensemble de la base clients — pas uniquement les transactions en cours. La vérification du bénéficiaire (VoP) est obligatoire depuis le 9 octobre 2025 pour les établissements de crédit et PSP zone euro. Pour les EME zone euro, la deadline VoP et émission instantanée est le 9 avril 2027.`,
    source_label: "IPR — Filtrage sanctions quotidien et VoP",
    source_url: "https://eur-lex.europa.eu/legal-content/FR/TXT/HTML/?uri=OJ:L_202400886",
    source_ref: "Règlement (UE) 2024/886, Art. 5d (filtrage), Art. 5c (VoP)",
    category: "paiements"
  }
];

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
    label: "TFR — Transfer of Funds Regulation",
    category: "mica",
    file: "tfr.html"
  },
  {
    celex: "32023R1114",
    label: "MiCA — Markets in Crypto-Assets Regulation",
    category: "mica",
    file: "mica.html"
  },
  {
    celex: "32024R1624",
    label: "AMLR — Anti-Money Laundering Regulation",
    category: "lcb-ft",
    file: "amlr.html"
  },
  {
    celex: "32022R2554",
    label: "DORA — Digital Operational Resilience Act",
    category: "dora",
    file: "dora.html"
  },
];


function chunkByArticle(rawHtml, regulation) {
  const chunks = [];

  // Extraire les positions des vrais titres d'articles via la classe CSS oj-ti-art
  const artHeadingRegex = /<p[^>]*class="oj-ti-art"[^>]*>\s*Article[\s&nbsp;]+(premier|\d+(?:er)?)\s*<\/p>/gi;
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

    const truncated = content.slice(0, 2500);

    chunks.push({
      content: truncated,
      source_label: `${regulation.label} — Art. ${articlePositions[i].num}`,
      source_url: `https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:${regulation.celex}`,
      source_ref: `${regulation.celex}-art-${articlePositions[i].num}`,
      category: regulation.category
    });
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

async function ingest() {
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
