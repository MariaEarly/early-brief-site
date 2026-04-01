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
    await new Promise(r => setTimeout(r, 21000));
  }

  console.log('\nIngestion terminée.');
}

ingest().catch(console.error);
