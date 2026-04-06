/**
 * MCP Server — Tracker réglementaire Early Brief
 * Stateless JSON-RPC 2.0 over HTTP (Netlify Function)
 *
 * READ  → fetch public CDN
 * WRITE → GitHub Contents API (get SHA → modify → commit)
 * AUTH  → Authorization: Bearer <MCP_SECRET>
 */

// ── Types ────────────────────────────────────────────────

/** MCP-facing schema (spec) */
interface TrackerEntry {
  id: string;
  date: string;         // YYYY-MM-DD
  source: string;
  sujet: string;
  statut: string;
  synthese: string;
  lien: string;
  type: string;
  perimetre: string;
}

/** Actual JSON file schema */
interface RawEntry {
  id: string;
  date: string;         // DD/MM/YYYY
  source: string;
  titre: string;
  description: string;
  url: string;
  type_source: string;
  statut: string;
  type?: string;
}

// ── Config ───────────────────────────────────────────────

const GITHUB_OWNER = "MariaEarly";
const GITHUB_REPO = "early-brief-site";
const TRACKER_PATH = "public/outils/tracker/tracker-data.json";
const AUTRES_PUB_PATH = "public/outils/autres-publications/autres-publications-data.json";
const SITE_URL = process.env.URL || "https://early-brief.com";
const TRACKER_CDN = `${SITE_URL}/outils/tracker/tracker-data.json`;
const AUTRES_PUB_CDN = `${SITE_URL}/outils/autres-publications/autres-publications-data.json`;

const VALID_STATUTS = ["En vigueur", "Publié", "Consultation", "Rapport", "Décision", "Programme"];
const VALID_TYPES = ["TEXTE", "DECISION", "CONSULTATION", "RAPPORT", "INTELLIGENCE"];
const UKUS_SOURCES = ["FinCEN", "OFAC", "FCA UK", "OFSI UK"];

// ── Field mapping ────────────────────────────────────────

function rawDateToIso(raw: string): string {
  // DD/MM/YYYY → YYYY-MM-DD
  const parts = raw.split("/");
  if (parts.length !== 3) return raw;
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

function isoToRawDate(iso: string): string {
  // YYYY-MM-DD → DD/MM/YYYY
  const parts = iso.split("-");
  if (parts.length !== 3) return iso;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function normalizeStatut(raw: string): string {
  const map: Record<string, string> = {
    "publie": "Publié", "publié": "Publié",
    "consultation": "Consultation",
    "en vigueur": "En vigueur",
    "décision": "Décision", "decision": "Décision",
    "programme": "Programme",
    "rapport": "Rapport",
  };
  return map[raw.toLowerCase()] || raw;
}

function statutToRaw(statut: string): string {
  const map: Record<string, string> = {
    "Publié": "publié", "En vigueur": "en vigueur",
    "Consultation": "consultation", "Décision": "décision",
    "Programme": "programme", "Rapport": "rapport",
  };
  return map[statut] || statut.toLowerCase();
}

function rawToMcp(raw: RawEntry): TrackerEntry {
  return {
    id: raw.id,
    date: rawDateToIso(raw.date),
    source: raw.source,
    sujet: raw.titre,
    statut: normalizeStatut(raw.statut),
    synthese: raw.description,
    lien: raw.url,
    type: raw.type || "",
    perimetre: UKUS_SOURCES.includes(raw.source) ? "UK/US" : "France/UE",
  };
}

function mcpToRaw(mcp: Omit<TrackerEntry, "perimetre">, id: string): RawEntry {
  return {
    id,
    date: isoToRawDate(mcp.date),
    source: mcp.source,
    titre: mcp.sujet,
    description: mcp.synthese,
    url: mcp.lien,
    type_source: "officielle",
    statut: statutToRaw(mcp.statut),
    type: mcp.type,
  };
}

// ── Data fetching (read from CDN) ────────────────────────

async function fetchEntries(url: string): Promise<RawEntry[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CDN fetch failed: ${res.status}`);
  return res.json() as Promise<RawEntry[]>;
}

// ── GitHub API (read/write from repo) ────────────────────

async function githubGet(path: string): Promise<{ entries: RawEntry[]; sha: string }> {
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
      },
    }
  );
  if (!res.ok) throw new Error(`GitHub GET ${path}: ${res.status}`);
  const data = (await res.json()) as { content: string; sha: string };
  const entries = JSON.parse(Buffer.from(data.content, "base64").toString("utf-8"));
  return { entries, sha: data.sha };
}

async function githubCommit(path: string, entries: RawEntry[], sha: string, message: string): Promise<void> {
  const encoded = Buffer.from(JSON.stringify(entries, null, 2)).toString("base64");
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, content: encoded, sha }),
    }
  );
  if (!res.ok) {
    const err = (await res.json()) as { message?: string };
    throw new Error(`GitHub commit failed: ${res.status} — ${err.message}`);
  }
}

// ── ID generation ────────────────────────────────────────

function generateId(date: string, source: string): string {
  const slug = source.toLowerCase().replace(/[^a-z0-9]/g, "");
  const rand = Math.random().toString(36).slice(2, 6);
  return `${date}-${slug}-${rand}`;
}

// ── Validation ───────────────────────────────────────────

function validateDate(d: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(d);
}

function validateUrl(u: string): boolean {
  return u.startsWith("https://");
}

function validateEntry(e: Record<string, unknown>): string | null {
  if (!e.date || !validateDate(String(e.date))) return "date invalide (format YYYY-MM-DD requis)";
  if (!e.source) return "source requis";
  if (!e.sujet) return "sujet requis";
  if (!e.synthese) return "synthese requis";
  if (!e.lien || !validateUrl(String(e.lien))) return "lien invalide (https:// requis)";
  if (!e.statut || !VALID_STATUTS.includes(String(e.statut))) return `statut invalide (${VALID_STATUTS.join(", ")})`;
  if (!e.type || !VALID_TYPES.includes(String(e.type))) return `type invalide (${VALID_TYPES.join(", ")})`;
  return null;
}

// ── Tool implementations ─────────────────────────────────

function sortByDateDesc(a: TrackerEntry, b: TrackerEntry): number {
  return b.date.localeCompare(a.date);
}

function sortRawByDateDesc(a: RawEntry, b: RawEntry): number {
  return rawDateToIso(b.date).localeCompare(rawDateToIso(a.date));
}

function filterEntries(
  entries: TrackerEntry[],
  params: Record<string, unknown>
): { entries: TrackerEntry[]; total: number; filtered: number } {
  const total = entries.length;
  let filtered = entries;

  if (params.month) {
    const m = String(params.month);
    filtered = filtered.filter((e) => e.date.startsWith(m));
  }
  if (params.source) {
    const s = String(params.source).toLowerCase();
    filtered = filtered.filter((e) => e.source.toLowerCase() === s);
  }
  if (params.statut) {
    const st = String(params.statut);
    filtered = filtered.filter((e) => e.statut === st);
  }
  if (params.perimetre) {
    const p = String(params.perimetre);
    filtered = filtered.filter((e) => e.perimetre === p);
  }
  if (params.type) {
    const t = String(params.type).toUpperCase();
    filtered = filtered.filter((e) => e.type === t);
  }
  if (params.search) {
    const q = String(params.search).toLowerCase();
    filtered = filtered.filter(
      (e) => e.sujet.toLowerCase().includes(q) || e.synthese.toLowerCase().includes(q)
    );
  }

  filtered.sort(sortByDateDesc);
  const limit = Math.min(Number(params.limit) || 100, 200);
  return { total, filtered: filtered.length, entries: filtered.slice(0, limit) };
}

function computeStats(entries: TrackerEntry[]) {
  const by_month: Record<string, number> = {};
  const by_source: Record<string, number> = {};
  const by_statut: Record<string, number> = {};
  const by_type: Record<string, number> = {};
  let last_updated = "";

  for (const e of entries) {
    const m = e.date.slice(0, 7); // YYYY-MM
    by_month[m] = (by_month[m] || 0) + 1;
    by_source[e.source] = (by_source[e.source] || 0) + 1;
    by_statut[e.statut] = (by_statut[e.statut] || 0) + 1;
    if (e.type) by_type[e.type] = (by_type[e.type] || 0) + 1;
    if (e.date > last_updated) last_updated = e.date;
  }

  return { total: entries.length, by_month, by_source, by_statut, by_type, last_updated };
}

// ── TRACKER tools ────────────────────────────────────────

async function trackerGetEntries(params: Record<string, unknown>) {
  const raw = await fetchEntries(TRACKER_CDN);
  return filterEntries(raw.map(rawToMcp), params);
}

async function trackerGetStats() {
  const raw = await fetchEntries(TRACKER_CDN);
  return computeStats(raw.map(rawToMcp));
}

async function trackerGetEntry(params: Record<string, unknown>) {
  const id = String(params.id || "");
  if (!id) return { error: "id requis" };
  const raw = await fetchEntries(TRACKER_CDN);
  const entry = raw.find((e) => e.id === id);
  if (!entry) return { error: "not_found" };
  return rawToMcp(entry);
}

async function trackerAddEntry(params: Record<string, unknown>) {
  const entry = params.entry as Record<string, unknown>;
  if (!entry) return { error: "entry requis" };

  const err = validateEntry(entry);
  if (err) return { error: err };

  const id = generateId(String(entry.date), String(entry.source));
  const newRaw = mcpToRaw(entry as unknown as Omit<TrackerEntry, "perimetre">, id);

  const { entries, sha } = await githubGet(TRACKER_PATH);
  entries.unshift(newRaw);
  entries.sort(sortRawByDateDesc);

  const msg = `feat: add tracker entry ${String(entry.sujet).slice(0, 50)}`;
  console.error(`[MCP WRITE] ${new Date().toISOString()} tracker_add_entry: ${id}`);
  await githubCommit(TRACKER_PATH, entries, sha, msg);

  return { success: true, id, entry: rawToMcp(newRaw) };
}

async function trackerUpdateEntry(params: Record<string, unknown>) {
  const id = String(params.id || "");
  const fields = params.fields as Record<string, unknown>;
  if (!id) return { error: "id requis" };
  if (!fields || Object.keys(fields).length === 0) return { error: "fields requis" };

  // Validate provided fields
  if (fields.date && !validateDate(String(fields.date))) return { error: "date invalide (YYYY-MM-DD)" };
  if (fields.lien && !validateUrl(String(fields.lien))) return { error: "lien invalide (https://)" };
  if (fields.statut && !VALID_STATUTS.includes(String(fields.statut))) return { error: "statut invalide" };
  if (fields.type && !VALID_TYPES.includes(String(fields.type))) return { error: "type invalide" };

  const { entries, sha } = await githubGet(TRACKER_PATH);
  const idx = entries.findIndex((e) => e.id === id);
  if (idx === -1) return { error: "not_found" };

  // Apply mapped fields
  if (fields.date) entries[idx].date = isoToRawDate(String(fields.date));
  if (fields.source) entries[idx].source = String(fields.source);
  if (fields.sujet) entries[idx].titre = String(fields.sujet);
  if (fields.synthese) entries[idx].description = String(fields.synthese);
  if (fields.lien) entries[idx].url = String(fields.lien);
  if (fields.statut) entries[idx].statut = statutToRaw(String(fields.statut));
  if (fields.type) entries[idx].type = String(fields.type);

  entries.sort(sortRawByDateDesc);

  console.error(`[MCP WRITE] ${new Date().toISOString()} tracker_update_entry: ${id}`);
  await githubCommit(TRACKER_PATH, entries, sha, `fix: update tracker entry ${id}`);

  return { success: true, entry: rawToMcp(entries.find((e) => e.id === id)!) };
}

async function trackerDeleteEntry(params: Record<string, unknown>) {
  const id = String(params.id || "");
  const confirm = params.confirm === true;
  if (!id) return { error: "id requis" };
  if (!confirm) return { error: "confirm: true requis pour supprimer" };

  const { entries, sha } = await githubGet(TRACKER_PATH);
  const idx = entries.findIndex((e) => e.id === id);
  if (idx === -1) return { error: "not_found" };

  const deleted = entries.splice(idx, 1)[0];

  console.error(`[MCP WRITE] ${new Date().toISOString()} tracker_delete_entry: ${id}`);
  await githubCommit(TRACKER_PATH, entries, sha, `chore: delete tracker entry ${id}`);

  return { success: true, deleted_entry: rawToMcp(deleted) };
}

// ── AUTRES PUBLICATIONS tools ────────────────────────────

async function autresPubGetEntries(params: Record<string, unknown>) {
  const raw = await fetchEntries(AUTRES_PUB_CDN);
  return filterEntries(raw.map(rawToMcp), params);
}

async function autresPubGetStats() {
  const raw = await fetchEntries(AUTRES_PUB_CDN);
  return computeStats(raw.map(rawToMcp));
}

async function autresPubAddEntry(params: Record<string, unknown>) {
  const entry = params.entry as Record<string, unknown>;
  if (!entry) return { error: "entry requis" };

  const err = validateEntry(entry);
  if (err) return { error: err };

  const id = generateId(String(entry.date), String(entry.source));
  const newRaw = mcpToRaw(entry as unknown as Omit<TrackerEntry, "perimetre">, id);

  const { entries, sha } = await githubGet(AUTRES_PUB_PATH);
  entries.unshift(newRaw);
  entries.sort(sortRawByDateDesc);

  const msg = `feat: add publication ${String(entry.sujet).slice(0, 50)}`;
  console.error(`[MCP WRITE] ${new Date().toISOString()} autres_pub_add_entry: ${id}`);
  await githubCommit(AUTRES_PUB_PATH, entries, sha, msg);

  return { success: true, id, entry: rawToMcp(newRaw) };
}

async function autresPubUpdateEntry(params: Record<string, unknown>) {
  const id = String(params.id || "");
  const fields = params.fields as Record<string, unknown>;
  if (!id) return { error: "id requis" };
  if (!fields || Object.keys(fields).length === 0) return { error: "fields requis" };

  if (fields.date && !validateDate(String(fields.date))) return { error: "date invalide (YYYY-MM-DD)" };
  if (fields.lien && !validateUrl(String(fields.lien))) return { error: "lien invalide (https://)" };
  if (fields.statut && !VALID_STATUTS.includes(String(fields.statut))) return { error: "statut invalide" };
  if (fields.type && !VALID_TYPES.includes(String(fields.type))) return { error: "type invalide" };

  const { entries, sha } = await githubGet(AUTRES_PUB_PATH);
  const idx = entries.findIndex((e) => e.id === id);
  if (idx === -1) return { error: "not_found" };

  if (fields.date) entries[idx].date = isoToRawDate(String(fields.date));
  if (fields.source) entries[idx].source = String(fields.source);
  if (fields.sujet) entries[idx].titre = String(fields.sujet);
  if (fields.synthese) entries[idx].description = String(fields.synthese);
  if (fields.lien) entries[idx].url = String(fields.lien);
  if (fields.statut) entries[idx].statut = statutToRaw(String(fields.statut));
  if (fields.type) entries[idx].type = String(fields.type);

  entries.sort(sortRawByDateDesc);

  console.error(`[MCP WRITE] ${new Date().toISOString()} autres_pub_update_entry: ${id}`);
  await githubCommit(AUTRES_PUB_PATH, entries, sha, `fix: update publication ${id}`);

  return { success: true, entry: rawToMcp(entries.find((e) => e.id === id)!) };
}

async function autresPubDeleteEntry(params: Record<string, unknown>) {
  const id = String(params.id || "");
  const confirm = params.confirm === true;
  if (!id) return { error: "id requis" };
  if (!confirm) return { error: "confirm: true requis pour supprimer" };

  const { entries, sha } = await githubGet(AUTRES_PUB_PATH);
  const idx = entries.findIndex((e) => e.id === id);
  if (idx === -1) return { error: "not_found" };

  const deleted = entries.splice(idx, 1)[0];

  console.error(`[MCP WRITE] ${new Date().toISOString()} autres_pub_delete_entry: ${id}`);
  await githubCommit(AUTRES_PUB_PATH, entries, sha, `chore: delete publication ${id}`);

  return { success: true, deleted_entry: rawToMcp(deleted) };
}

// ── Tool dispatch ────────────────────────────────────────

async function handleToolCall(
  rpcId: string | number,
  name: string,
  args: Record<string, unknown>
) {
  const handlers: Record<string, (args: Record<string, unknown>) => Promise<unknown>> = {
    tracker_get_entries: trackerGetEntries,
    tracker_get_stats: () => trackerGetStats(),
    tracker_get_entry: trackerGetEntry,
    tracker_add_entry: trackerAddEntry,
    tracker_update_entry: trackerUpdateEntry,
    tracker_delete_entry: trackerDeleteEntry,
    autres_pub_get_entries: autresPubGetEntries,
    autres_pub_get_stats: () => autresPubGetStats(),
    autres_pub_add_entry: autresPubAddEntry,
    autres_pub_update_entry: autresPubUpdateEntry,
    autres_pub_delete_entry: autresPubDeleteEntry,
  };

  const fn = handlers[name];
  if (!fn) {
    return jsonrpcResult(rpcId, {
      content: [{ type: "text", text: `Outil inconnu : ${name}` }],
      isError: true,
    });
  }

  try {
    const result = await fn(args);
    return jsonrpcResult(rpcId, {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur interne";
    return jsonrpcResult(rpcId, {
      content: [{ type: "text", text: `Erreur : ${msg}` }],
      isError: true,
    });
  }
}

// ── TOOLS_LIST ───────────────────────────────────────────

const ENTRY_FILTER_PROPS = {
  month: { type: "string", description: "Format YYYY-MM, ex: '2026-03'" },
  source: { type: "string", description: "Ex: 'EBA', 'ACPR', 'AMF'" },
  statut: { type: "string", enum: ["En vigueur", "Publié", "Consultation", "Rapport", "Décision", "Programme"] },
  perimetre: { type: "string", enum: ["France/UE", "UK/US"] },
  type: { type: "string", enum: ["TEXTE", "DECISION", "CONSULTATION", "RAPPORT", "INTELLIGENCE"] },
  search: { type: "string", description: "Recherche texte dans sujet et synthèse" },
  limit: { type: "number", description: "Max résultats (défaut 100, max 200)" },
};

const ENTRY_WRITE_PROPS = {
  date: { type: "string", description: "YYYY-MM-DD" },
  source: { type: "string", description: "Ex: EBA, ACPR, AMF" },
  sujet: { type: "string", description: "Titre court" },
  synthese: { type: "string", description: "Description opérationnelle" },
  lien: { type: "string", description: "URL source officielle (https://)" },
  statut: { type: "string", enum: ["En vigueur", "Publié", "Consultation", "Rapport", "Décision", "Programme"] },
  type: { type: "string", enum: ["TEXTE", "DECISION", "CONSULTATION", "RAPPORT", "INTELLIGENCE"] },
};

const TOOLS_LIST = [
  // ── Tracker READ
  {
    name: "tracker_get_entries",
    description: "Récupère les entrées du tracker réglementaire Early Brief (TEXTE, DECISION, CONSULTATION) avec filtres optionnels.",
    inputSchema: { type: "object", properties: ENTRY_FILTER_PROPS },
    annotations: { readOnlyHint: true, destructiveHint: false },
  },
  {
    name: "tracker_get_stats",
    description: "Statistiques du tracker : total, répartition par mois/source/statut/type, dernière mise à jour.",
    inputSchema: { type: "object", properties: {} },
    annotations: { readOnlyHint: true, destructiveHint: false },
  },
  {
    name: "tracker_get_entry",
    description: "Récupère une entrée du tracker par son ID.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", description: "ID de l'entrée" } },
      required: ["id"],
    },
    annotations: { readOnlyHint: true, destructiveHint: false },
  },
  // ── Tracker WRITE
  {
    name: "tracker_add_entry",
    description: "Ajoute une entrée au tracker via commit GitHub. Déploiement automatique ~2 min.",
    inputSchema: {
      type: "object",
      properties: { entry: { type: "object", properties: ENTRY_WRITE_PROPS, required: ["date", "source", "sujet", "synthese", "lien", "statut", "type"] } },
      required: ["entry"],
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
  },
  {
    name: "tracker_update_entry",
    description: "Modifie une entrée existante du tracker (champs partiels acceptés).",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "ID de l'entrée" },
        fields: { type: "object", properties: ENTRY_WRITE_PROPS, description: "Champs à modifier" },
      },
      required: ["id", "fields"],
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
  },
  {
    name: "tracker_delete_entry",
    description: "Supprime une entrée du tracker. Nécessite confirm: true.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "ID de l'entrée" },
        confirm: { type: "boolean", description: "Doit être true" },
      },
      required: ["id", "confirm"],
    },
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true },
  },
  // ── Autres publications READ
  {
    name: "autres_pub_get_entries",
    description: "Récupère les autres publications (RAPPORT, INTELLIGENCE) avec filtres optionnels.",
    inputSchema: { type: "object", properties: ENTRY_FILTER_PROPS },
    annotations: { readOnlyHint: true, destructiveHint: false },
  },
  {
    name: "autres_pub_get_stats",
    description: "Statistiques des autres publications.",
    inputSchema: { type: "object", properties: {} },
    annotations: { readOnlyHint: true, destructiveHint: false },
  },
  // ── Autres publications WRITE
  {
    name: "autres_pub_add_entry",
    description: "Ajoute une publication via commit GitHub.",
    inputSchema: {
      type: "object",
      properties: { entry: { type: "object", properties: ENTRY_WRITE_PROPS, required: ["date", "source", "sujet", "synthese", "lien", "statut", "type"] } },
      required: ["entry"],
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
  },
  {
    name: "autres_pub_update_entry",
    description: "Modifie une publication existante.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        fields: { type: "object", properties: ENTRY_WRITE_PROPS },
      },
      required: ["id", "fields"],
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
  },
  {
    name: "autres_pub_delete_entry",
    description: "Supprime une publication. Nécessite confirm: true.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        confirm: { type: "boolean", description: "Doit être true" },
      },
      required: ["id", "confirm"],
    },
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true },
  },
];

// ── JSON-RPC helpers ─────────────────────────────────────

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };
}

function jsonrpcResult(id: string | number | null, result: unknown) {
  return {
    statusCode: 200,
    headers: corsHeaders(),
    body: JSON.stringify({ jsonrpc: "2.0", id, result }),
  };
}

function jsonrpcError(id: string | number | null, code: number, message: string) {
  return {
    statusCode: 200,
    headers: corsHeaders(),
    body: JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } }),
  };
}

// ── Netlify handler ──────────────────────────────────────

export const handler = async (event: {
  httpMethod: string;
  headers: Record<string, string>;
  body: string | null;
}) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders() };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: corsHeaders(), body: "Method Not Allowed" };
  }

  // Auth
  const auth = event.headers["authorization"] || event.headers["Authorization"] || "";
  if (auth !== `Bearer ${process.env.MCP_SECRET}`) {
    return {
      statusCode: 401,
      headers: corsHeaders(),
      body: JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32000, message: "Unauthorized" } }),
    };
  }

  // Parse
  let body: { jsonrpc?: string; id?: string | number; method?: string; params?: Record<string, unknown> };
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return jsonrpcError(null, -32700, "Parse error");
  }

  if (body.jsonrpc !== "2.0") {
    return jsonrpcError(null, -32600, "Invalid JSON-RPC request");
  }

  const { id, method, params } = body;

  // Route
  switch (method) {
    case "initialize":
      return jsonrpcResult(id ?? null, {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "early-brief-tracker-mcp", version: "1.0.0" },
      });

    case "notifications/initialized":
      return { statusCode: 204, headers: corsHeaders() };

    case "tools/list":
      return jsonrpcResult(id ?? null, { tools: TOOLS_LIST });

    case "tools/call":
      return handleToolCall(
        id ?? 0,
        String((params as { name?: string })?.name || ""),
        ((params as { arguments?: Record<string, unknown> })?.arguments) || {}
      );

    default:
      return jsonrpcError(id ?? null, -32601, `Method not found: ${method}`);
  }
};
