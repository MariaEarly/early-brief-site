const { createClient } = require('@supabase/supabase-js');

// ── Supabase client (RAG) ─────────────────────────────────
const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  : null;

// ── System prompt (RAG-first) ─────────────────────────────
const SYSTEM_PROMPT = `Tu es Early Request, un assistant de recherche réglementaire pour les professionnels de la conformité financière (PSP, EME, CASP, banques, fintechs).

## Règle absolue

Tu réponds UNIQUEMENT à partir des sources fournies dans le contexte [SOURCE 1], [SOURCE 2], etc.

Si le contexte ne contient pas d'information pertinente pour répondre à la question, tu réponds EXACTEMENT :
"Je n'ai pas de source vérifiée sur ce point dans mon corpus actuel. Consultez directement EUR-Lex (eur-lex.europa.eu) ou acpr.banque-france.fr."

Tu ne complètes JAMAIS avec ta connaissance générale du droit. Tu ne cites JAMAIS un article, une date, un délai ou une obligation qui ne figure pas dans les sources fournies.

## Format de réponse

Structure chaque réponse ainsi :

**Textes applicables**
Liste uniquement les sources utilisées, avec leur référence exacte telle qu'elle figure dans les métadonnées.

**Analyse**
Réponse factuelle et opérationnelle basée strictement sur les sources. Pas d'interprétation au-delà du texte.

**Points d'attention**
2-3 points pratiques tirés directement des sources.

**Sources**
Pour chaque source utilisée : [label] — [URL]

## Périmètre

Entités couvertes : EC, PSP, EME, CASP, PSAN, entreprises d'investissement.
Thèmes : LCB-FT, KYC/PPE, gel des avoirs, MiCA, Travel Rule, DORA, paiements instantanés, sanctions.

Si la question est hors périmètre, le signaler clairement et ne pas répondre.

## Ton

Factuel, opérationnel, sans rhétorique. Pas de "il convient de noter", pas de conclusions prescriptives.

## Discipline de citation

RÈGLE ABSOLUE : ne jamais inventer une référence réglementaire.
- Articles CMF (L. xxx, R. xxx) : citer uniquement si présents dans les sources fournies
- Règlements EU : citer avec le numéro exact uniquement si dans les sources
- Positions ACPR, Instructions ACPR : ne citer QUE si référence exacte dans les sources

Si tu n'es pas certain qu'une référence existe dans les sources fournies, formuler ainsi :
"À vérifier dans les lignes directrices ACPR (acpr.banque-france.fr)" — jamais un numéro inventé.`;

// ── CORS ──────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  "https://early-brief.com",
  "https://www.early-brief.com",
];

if (process.env.NODE_ENV !== "production") {
  ALLOWED_ORIGINS.push("http://localhost:4321", "http://127.0.0.1:4321", "http://localhost:8888", "http://127.0.0.1:8888");
}

// ── Rate limiting (in-memory, per-IP + global daily cap) ──
const rateLimitMap = new Map();
let globalCount = 0;
let globalReset = Date.now() + 86_400_000;
const GLOBAL_DAILY_CAP = 500;
const PER_IP_HOURLY = 15;

function isRateLimited(ip) {
  const now = Date.now();
  if (now > globalReset) { globalCount = 0; globalReset = now + 86_400_000; }
  globalCount++;
  if (globalCount > GLOBAL_DAILY_CAP) return true;
  const e = rateLimitMap.get(ip) || { count: 0, resetAt: now + 3_600_000 };
  if (now > e.resetAt) { e.count = 0; e.resetAt = now + 3_600_000; }
  e.count++;
  rateLimitMap.set(ip, e);
  return e.count > PER_IP_HOURLY;
}

// ── RAG : Voyage AI embedding ─────────────────────────────
async function embedQuery(text) {
  const res = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.VOYAGE_API_KEY}`
    },
    body: JSON.stringify({
      model: 'voyage-3',
      input: text,
      input_type: 'query'
    })
  });
  const data = await res.json();
  if (!data.data || !data.data[0]) {
    throw new Error(`Voyage AI error: ${JSON.stringify(data)}`);
  }
  return data.data[0].embedding;
}

// ── RAG : recherche vectorielle Supabase ──────────────────
async function retrieveChunks(question) {
  if (!supabase || !process.env.VOYAGE_API_KEY) return [];

  const embedding = await embedQuery(question);

  const { data, error } = await supabase.rpc('match_chunks', {
    query_embedding: embedding,
    match_threshold: 0.65,
    match_count: 5
  });

  if (error) throw new Error(`Supabase error: ${error.message}`);
  return data || [];
}

// ── RAG : construction du contexte ────────────────────────
function buildContext(chunks) {
  if (chunks.length === 0) return '';

  const sources = chunks.map((c, i) =>
    `[SOURCE ${i + 1}]\nRéférence : ${c.source_ref}\nURL : ${c.source_url}\nContenu : ${c.content}`
  ).join('\n\n---\n\n');

  return `\n\n## Sources disponibles pour cette question\n\n${sources}`;
}

// ── Handler ───────────────────────────────────────────────
exports.handler = async function (event) {
  const origin = event.headers?.origin || event.headers?.Origin || "";
  const referer = event.headers?.referer || event.headers?.Referer || "";
  const isAllowed =
    ALLOWED_ORIGINS.includes(origin) ||
    ALLOWED_ORIGINS.some((o) => referer.startsWith(o));

  // Preflight CORS
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": isAllowed ? origin : "https://early-brief.com",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Max-Age": "86400",
      },
    };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // Reject cross-origin requests
  if (!isAllowed) {
    return { statusCode: 403, body: JSON.stringify({ error: "Origin not allowed" }) };
  }

  // Rate limit
  const clientIp = event.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(clientIp)) {
    return { statusCode: 429, body: JSON.stringify({ error: "Limite atteinte. Réessayez dans une heure." }) };
  }

  const headers = {
    "Access-Control-Allow-Origin": origin || "https://early-brief.com",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  try {
    const body = JSON.parse(event.body);
    if (!body.messages || body.messages.length > 20) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Conversation trop longue" }) };
    }
    const lastMsg = body.messages[body.messages.length - 1];
    if (lastMsg.content.length > 3000) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Message trop long" }) };
    }
    const { messages } = body;

    // RAG : récupérer les chunks pertinents
    let chunks = [];
    let contextBlock = '';

    try {
      chunks = await retrieveChunks(lastMsg.content);
      contextBlock = buildContext(chunks);
    } catch (ragError) {
      console.error('RAG error (fallback sans contexte):', ragError.message);
      // Continue sans RAG — le system prompt empêche les hallucinations
    }

    // System prompt + contexte RAG
    const systemWithContext = SYSTEM_PROMPT + contextBlock;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        system: systemWithContext,
        messages: messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { statusCode: response.status, headers, body: JSON.stringify({ error: data }) };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        answer: data.content[0].text,
        sources_used: chunks.length,
        has_context: chunks.length > 0
      }),
    };
  } catch (err) {
    console.error('Error:', err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
