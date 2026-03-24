// netlify/functions/chat.js
// v6 — fail-fast API key · Upstash rate limit · chunk retrieval · prompt caching

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const MAX_BODY_BYTES  = 32_768;
const MAX_MESSAGES    = 20;
const MAX_MSG_CHARS   = 4_000;
const KB_TTL_MS       = 60 * 60 * 1000;   // 1 hour KB cache
const TOP_K_CHUNKS    = 6;                  // max chunks injected per request
const CHUNK_SEPARATOR = "\n---\n";
const VALID_MODES     = new Set(["chat", "compare", "changes"]);
const VALID_ROLES     = new Set(["user", "assistant"]);

// ─── FAIL-FAST: REQUIRED ENV VARS ────────────────────────────────────────────
function checkEnv() {
  const required = ["ANTHROPIC_API_KEY"];
  const missing = required.filter(k => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }
  // Warn on non-critical missing vars
  if (!process.env.KB_URL)          console.warn("[chat] KB_URL not set — KB unavailable");
  if (!process.env.ALLOWED_ORIGIN)  console.warn("[chat] ALLOWED_ORIGIN not set — defaulting to restricted");
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.warn("[chat] Upstash env vars missing — falling back to in-memory rate limit");
  }
}

// ─── RATE LIMITER ─────────────────────────────────────────────────────────────
// Primary: Upstash Redis (works across serverless instances)
// Fallback: in-memory Map (single instance only, best-effort)
let upstashLimiter = null;

function getUpstashLimiter() {
  if (upstashLimiter) return upstashLimiter;
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    upstashLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 h"),
      prefix: "amla_rts_cdd",
    });
    return upstashLimiter;
  } catch (e) {
    console.error("[chat] Upstash init failed:", e.message);
    return null;
  }
}

// Fallback in-memory
const memRateMap = new Map();
function memIsLimited(ip) {
  const now = Date.now();
  const e = memRateMap.get(ip) || { count: 0, resetAt: now + 3_600_000 };
  if (now > e.resetAt) { e.count = 0; e.resetAt = now + 3_600_000; }
  e.count++;
  memRateMap.set(ip, e);
  return e.count > 10;
}

async function checkRateLimit(ip) {
  const limiter = getUpstashLimiter();
  if (limiter) {
    const { success } = await limiter.limit(ip);
    return !success;
  }
  return memIsLimited(ip);
}

// ─── KB CACHE + FETCH ─────────────────────────────────────────────────────────
const kbCache = { text: null, fetchedAt: 0 };

async function getKBRaw() {
  const now = Date.now();
  if (kbCache.text && now - kbCache.fetchedAt < KB_TTL_MS) return kbCache.text;

  const kbUrl = process.env.KB_URL;
  if (!kbUrl) return kbCache.text || "";

  try {
    const headers = { "Cache-Control": "no-cache" };
    if (kbUrl.includes("raw.githubusercontent.com") && process.env.GITHUB_TOKEN) {
      headers["Authorization"] = `token ${process.env.GITHUB_TOKEN}`;
    }
    const res = await fetch(kbUrl, { headers, signal: AbortSignal.timeout(8_000) });
    if (!res.ok) { console.error(`[chat] KB fetch ${res.status}`); return kbCache.text || ""; }

    const text = await res.text();
    if (text.length < 100) { console.warn("[chat] KB too short — keeping cache"); return kbCache.text || text; }

    kbCache.text = text;
    kbCache.fetchedAt = now;
    console.log(`[chat] KB refreshed — ${text.length} chars`);
    return text;
  } catch (err) {
    console.error("[chat] KB fetch error:", err.message);
    return kbCache.text || "";
  }
}

// ─── CHUNK RETRIEVAL ─────────────────────────────────────────────────────────
// Splits KB on "---" section separators (markdown HR), scores each chunk
// against the query using keyword overlap, returns top K chunks.

function chunkKB(raw) {
  return raw
    .split(CHUNK_SEPARATOR)
    .map(c => c.trim())
    .filter(c => c.length > 80);
}

function tokenize(text) {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9àâäéèêëîïôùûü§\s]/g, " ")
      .split(/\s+/)
      .filter(t => t.length > 3)
  );
}

function scoreChunk(chunkTokens, queryTokens) {
  let hits = 0;
  for (const t of queryTokens) {
    if (chunkTokens.has(t)) hits++;
  }
  return hits;
}

function retrieveChunks(kb, query, topK = TOP_K_CHUNKS) {
  if (!kb) return "";
  const chunks = chunkKB(kb);
  if (chunks.length === 0) return kb; // fallback: return full KB if unsplittable

  const queryTokens = tokenize(query);

  const scored = chunks.map(chunk => ({
    chunk,
    score: scoreChunk(tokenize(chunk), queryTokens),
  }));

  // Always include the first chunk (metadata / dates / context)
  const first = scored.shift();

  const top = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK - 1)
    .map(s => s.chunk);

  const selected = [first.chunk, ...top];
  console.log(`[chat] Retrieved ${selected.length}/${chunks.length} chunks for query (${queryTokens.size} tokens)`);
  return selected.join(CHUNK_SEPARATOR);
}

// ─── SYSTEM PROMPT (block structure for prompt caching) ───────────────────────
function buildSystemBlocks(mode, relevantKB) {
  const rules = `Tu es un assistant spécialisé en conformité LCB-FT, expert du draft RTS CDD publié par l'AMLA le 9 février 2026 sous l'article 28(1) du Règlement (UE) 2024/1624 (AMLR).

RÈGLE ABSOLUE — CITATIONS OBLIGATOIRES:
Chaque affirmation factuelle DOIT être accompagnée d'une citation directe entre guillemets et d'une référence précise (article, paragraphe, recital).
Format: "texte exact du RTS" (Article X §Y) ou "texte exact" (Recital N).
Si tu ne peux pas localiser le passage exact, dis EXPLICITEMENT: "Je ne trouve pas de passage textuel dans le draft pour confirmer ce point — vérifier directement dans le document source officiel AMLA."
Ne jamais inventer ni paraphraser comme si c'était une citation.
En cas de doute entre version EBA et AMLA, précise la version et la différence.

DISCLAIMER PERMANENT: Ce draft n'est pas encore adopté. Ne pas utiliser à des fins opérationnelles sans vérification sur le document source officiel AMLA.`;

  const kbBlock = relevantKB
    ? `EXTRAITS PERTINENTS DE LA BASE DOCUMENTAIRE:\n${relevantKB}`
    : "(Base documentaire temporairement indisponible. Informer l'utilisateur de réessayer dans quelques instants.)";

  const modeMap = {
    compare: `
MODE ACTIF: COMPARAISON EBA (30 oct. 2025) vs AMLA (9 fév. 2026)
Structure ta réponse:
**Version EBA:** [texte ou disposition]
**Version AMLA:** [texte ou disposition]
**Changement:** [nature — fond / libellé / numérotation / ajout / suppression]
Si identiques, indique-le explicitement. Avertis si la couverture est partielle.`,

    changes: `
MODE ACTIF: IMPACT SUR LE DROIT FRANÇAIS
Structure ta réponse:
**Droit français actuel (CMF / ACPR):** [disposition applicable]
**Ce que le RTS AMLA change ou précise:** [disposition RTS]
**Qualification:** NOUVEAU / PRÉCISION / ≈ IDENTIQUE
**Significance opérationnelle:** [impact concret pour les assujettis français]
Rappelle que le RTS est un draft non adopté.`,

    chat: `
MODE ACTIF: CHAT LIBRE
Réponds de manière précise, sourcée, utile pour un praticien LCB-FT. Structure avec des titres courts si la réponse couvre plusieurs points.`,
  };

  return [
    // Block 1: rules — static, cache aggressively
    { type: "text", text: rules, cache_control: { type: "ephemeral" } },
    // Block 2: KB excerpts — changes per query, still cache (same query = cache hit)
    { type: "text", text: kbBlock, cache_control: { type: "ephemeral" } },
    // Block 3: mode instructions — lightweight, no cache needed
    { type: "text", text: modeMap[mode] || modeMap.chat },
  ];
}

// ─── CORS ─────────────────────────────────────────────────────────────────────
function corsHeaders() {
  const origin = process.env.ALLOWED_ORIGIN;
  // No wildcard in production — if not set, block all cross-origin requests
  return {
    "Access-Control-Allow-Origin": origin || "null",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}

function jsonError(message, status) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders(), "Content-Type": "application/json" },
  });
}

// ─── HANDLER ──────────────────────────────────────────────────────────────────
export default async function handler(req, context) {
  // Fail-fast: check required env vars before anything else
  try {
    checkEnv();
  } catch (err) {
    console.error("[chat] Config error:", err.message);
    return jsonError("Server misconfiguration.", 500);
  }

  // Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (req.method !== "POST") return jsonError("Method not allowed", 405);

  // Rate limit
  const ip = context?.ip || req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  const limited = await checkRateLimit(ip);
  if (limited) return jsonError("Limite atteinte. Réessayez dans une heure.", 429);

  // Body size guard
  const contentLength = parseInt(req.headers.get("content-length") || "0", 10);
  if (contentLength > MAX_BODY_BYTES) return jsonError("Requête trop volumineuse.", 413);

  // Parse
  let body;
  try {
    const raw = await req.text();
    if (raw.length > MAX_BODY_BYTES) return jsonError("Requête trop volumineuse.", 413);
    body = JSON.parse(raw);
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  // Validate mode
  const mode = VALID_MODES.has(body.mode) ? body.mode : "chat";

  // Validate + sanitize messages
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return jsonError("messages requis", 400);
  }

  const sanitized = body.messages
    .slice(-MAX_MESSAGES)
    .filter(m => VALID_ROLES.has(m?.role) && typeof m?.content === "string" && m.content.trim())
    .map(m => ({ role: m.role, content: m.content.slice(0, MAX_MSG_CHARS) }));

  // Normalize alternation
  const normalized = [];
  for (const m of sanitized) {
    if (normalized.at(-1)?.role === m.role) continue;
    normalized.push(m);
  }

  // Must start and end with user
  if (!normalized.length || normalized[0].role !== "user") return jsonError("Premier message doit être de l'utilisateur.", 400);
  while (normalized.at(-1)?.role === "assistant") normalized.pop();
  if (!normalized.length) return jsonError("Aucun message utilisateur valide.", 400);

  // Extract last user query for retrieval
  const lastUserQuery = normalized.filter(m => m.role === "user").at(-1)?.content || "";

  // Fetch KB + retrieve relevant chunks
  const kbRaw = await getKBRaw();
  const relevantKB = retrieveChunks(kbRaw, lastUserQuery);

  // Build system
  const systemBlocks = buildSystemBlocks(mode, relevantKB);

  // Call Anthropic
  const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "prompt-caching-2024-07-31",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemBlocks,
      messages: normalized,
      stream: true,
    }),
  });

  if (!anthropicRes.ok) {
    const errText = await anthropicRes.text().catch(() => "");
    console.error("[chat] Anthropic error:", anthropicRes.status, errText.slice(0, 200));
    return jsonError("Erreur API. Réessayez.", 502);
  }

  // Relay SSE stream
  const encoder = new TextEncoder();
  const reader = anthropicRes.body.getReader();

  const stream = new ReadableStream({
    async start(controller) {
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += new TextDecoder().decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") { controller.enqueue(encoder.encode("data: [DONE]\n\n")); continue; }
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === "content_block_delta" && parsed.delta?.type === "text_delta" && parsed.delta.text) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: parsed.delta.text })}\n\n`));
              }
              if (parsed.type === "message_stop") {
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              }
            } catch { /* skip malformed */ }
          }
        }
      } catch (err) {
        console.error("[chat] Stream error:", err.message);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      ...corsHeaders(),
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
