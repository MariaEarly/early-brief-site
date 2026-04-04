# ARCHITECTURE — early-brief.com
*Mis à jour le 4 avril 2026*

---

## 1. Stack technique

| Composant | Technologie |
|---|---|
| Framework site | Astro 6.0.8 |
| Hébergement | Netlify (CDN global, HTTPS auto) |
| Base de données | Supabase (PostgreSQL + pgvector) |
| DNS | Gandi → A record 75.2.60.5 |
| Analytics | Plausible Analytics (EU-hosted, privacy-first) |
| Versioning | GitHub (early-brief-site) |

---

## 2. Structure du repo

```
early-brief-site/
  src/
    pages/          ← pages Astro (SSG)
    layouts/        ← BaseLayout.astro (head, nav, footer, Plausible)
    data/           ← reglementations.json, manquements.json
    components/     ← composants Astro réutilisables
  public/
    outils/
      tracker/      ← tracker réglementaire public
      tb-admin/     ← interface admin tracker (protégée, URL non publiée)
      kyc/          ← checklist KYC
      roadmap/      ← roadmap réglementaire
      liste-pays/   ← listes pays à risque GAFI/UE/OFAC
      early-request/← chatbot RAG public
      autres-publications/ ← rapports et publications institutionnelles
    fonts/          ← polices auto-hébergées (Cormorant, Hanken Grotesk, IBM Plex Mono)
  netlify/
    functions/
      chat.js       ← Netlify Function — Early Request RAG
      describe-tracker.js ← Netlify Function — reformulation + classification articles
  scripts/
    ingest-corpus.cjs ← ingestion RAG Supabase
    data/           ← HTML EUR-Lex + PDFs lignes directrices ACPR
  ARCHITECTURE.md   ← ce fichier
```

---

## 3. Outils publics

### 3.1 Tracker réglementaire (`/outils/tracker/`)
- Données : `tracker-data.json` (TEXTE, DECISION, CONSULTATION)
- 61 entrées au 4 avril 2026, janvier–mars 2026
- Pipeline : earlybrief-platform → tb-admin → GitHub API → Netlify deploy

### 3.2 Autres publications (`/outils/autres-publications/`)
- Données : `autres-publications-data.json` (RAPPORT, INTELLIGENCE)
- 58 entrées au 4 avril 2026
- Accessible via `/ressources/`

### 3.3 Checklist KYC (`/outils/kyc/`)
- 19 items avec sources Légifrance cliquables
- Références : L.561-5, R.561-5, L.561-2-2, L.561-12, R.561-18, R.561-20-2, L.562-4
- Export PDF via impression navigateur

### 3.4 Roadmap réglementaire (`/outils/roadmap/`)
- 22 échéances réglementaires 2024-2029
- Export .ics (calendrier)
- Données hardcodées dans le HTML

### 3.5 Liste pays à risque (`/outils/liste-pays/`)
- Listes GAFI (grey/black), UE (tax blacklist), OFAC
- Fraîcheur : février 2026
- Carte interactive (`/outils/liste-pays/carte`)

### 3.6 Early Request (`/outils/early-request/`)
- Chatbot RAG — voir section 5

---

## 4. Pipeline tracker — tb-admin

### Architecture
```
earlybrief-platform (Scaleway)
→ GET /api/v1/articles
→ tb-admin (early-brief.com/outils/tb-admin/)
→ describe-tracker.js (Netlify Function)
   Appel 1 : reformulation titre FR (temp 0, max_tokens 80)
   Appel 2 : classification JSON {type, destination} (temp 0, max_tokens 50)
→ validation humaine
→ tracker-data.json / autres-publications-data.json
→ GitHub API commit → Netlify deploy (~2 min)
```

### Sécurité tb-admin
- Login par formulaire (mot de passe saisi, jamais dans le code)
- Authentification via POST /api/v1/auth/login → JWT en sessionStorage
- Token GitHub saisi à chaque session, jamais stocké dans le code
- URL non publiée (tb-admin, pas tracker-admin)

### Filtres tb-admin
- PRIORITY_SOURCES (score ignoré) : AMLA, EBA, ESMA, AMF, ACPR, Tracfin, FATF, Conseil UE, Commission EU, OFAC, OFSI, Moneyval, FinCEN, Legifrance
- Autres sources : score >= 30
- Filtres qualité : isNotGoogleNews, isOfficialDomain, isNotGeneric, isNew

---

## 5. Early Request — RAG

### Architecture
```
Question utilisateur (FR)
→ Voyage AI voyage-3 → embedding 1024 dims
→ Supabase pgvector → 30 candidats (match_threshold: 0.15)
→ Voyage AI rerank-2 → top 10 reranked
→ Claude claude-sonnet → réponse depuis contexte uniquement
→ Disclaimer "ne constitue pas un conseil juridique"
```

### Corpus — 1930 chunks (4 avril 2026)

| Source | Chunks | Méthode |
|---|---|---|
| AMLR (UE) 2024/1624 | 179 | HTML EUR-Lex FR + subdivision |
| AMLD6 (UE) 2024/1640 | 169 | HTML EUR-Lex FR + subdivision |
| Règlement AMLA (UE) 2024/1620 | 170 | HTML EUR-Lex FR + subdivision |
| TFR (UE) 2023/1113 | 60 | HTML EUR-Lex FR + subdivision |
| MiCA (UE) 2023/1114 | 360 | HTML EUR-Lex FR + subdivision |
| DORA (UE) 2022/2554 | 137 | HTML EUR-Lex FR + subdivision |
| DORA-RTS (UE) 2025/301 | 7 | HTML EUR-Lex FR |
| SEPA 260/2012 consolidé post-IPR | 49 | HTML EUR-Lex FR (version 20240408) |
| LD ACPR Identification 2022 | 216 | PDF parsé + nettoyage |
| LD ACPR-Tracfin 2025 | 233 | PDF parsé + nettoyage |
| LD ACPR-DGT Gel avoirs 2026 | 194 | PDF parsé + nettoyage |
| CMF articles (25) | 25 | OpenLegi API |
| **Total** | **1930** | **100% FR, 0 chunk manuel** |

### Règles corpus
- **100% sources officielles** — zéro chunk manuel, zéro interprétation
- **100% FR** — versions françaises EUR-Lex pour résoudre le gap sémantique FR↔EN
- **Zéro règlement modificatif** — utiliser les versions consolidées (ex: SEPA 260/2012 post-IPR)
- **Subdivision articles longs** — articles > 4000 chars → sous-chunks 2000 chars overlap 150

### Maintenance corpus

**Mise à jour règlements EU (HTML) :**
```bash
cd scripts
node ingest-corpus.cjs --eu-only --files amlr-fr,mica-fr,...
```

**Mise à jour CMF :**
```bash
node ingest-corpus.cjs --cmf-only
```

**Ajout nouveau PDF :**
1. Placer le PDF dans `scripts/data/`
2. Ajouter l'entrée dans `PDF_DOCUMENTS[]` dans `ingest-corpus.cjs`
3. `node ingest-corpus.cjs --pdf-only`
4. Reindex pgvector si ingestion massive (voir ci-dessous)

**Reindex pgvector (après ingestion massive) :**
```sql
DROP INDEX IF EXISTS regulatory_chunks_embedding_idx;
CREATE INDEX regulatory_chunks_embedding_idx ON regulatory_chunks
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

### System prompt — 3 cas
1. Corpus contient sources pertinentes → répondre en citant
2. Corpus contient sources connexes + faux présupposé → corriger + citer
3. Aucune source pertinente → "Je n'ai pas de source vérifiée sur ce point dans mon corpus actuel"

### Angles morts corpus (à ingérer)
- Guidelines EBA CDD (EBA/GL/2021/02) — URL PDF à trouver
- Sanctions OFAC/OFSI — textes opérationnels
- AI Act — Règlement (UE) 2024/1689

### TODO corpus
- [ ] Relire 643 chunks PDF ACPR (exporter Supabase CSV → parcourir)

---

## 6. Variables d'environnement

### Netlify (production)

| Variable | Usage | Statut |
|---|---|---|
| `ANTHROPIC_API_KEY` | Early Request + describe-tracker | ✅ |
| `SUPABASE_URL` | RAG pgvector | ✅ |
| `SUPABASE_SERVICE_KEY` | RAG pgvector | ✅ |
| `VOYAGE_API_KEY` | Embeddings + reranking | ✅ |
| `OPENLEGI_TOKEN` | Fetch articles CMF | ⚠️ Manquant |

### Local (`scripts/.env`)

| Variable | Usage |
|---|---|
| `PLATFORM_URL` | URL Scaleway API |
| `PLATFORM_TOKEN` | JWT plateforme |
| `SUPABASE_URL` | Ingestion RAG |
| `SUPABASE_SERVICE_KEY` | Ingestion RAG |
| `VOYAGE_API_KEY` | Embeddings |
| `OPENLEGI_TOKEN` | Fetch articles CMF |

---

## 7. earlybrief-platform (Scaleway)

**Règle absolue : lecture seule depuis early-brief-site/**

URL API : `https://earlybriefp7hwqsga-earlybrief-api.functions.fnc.fr-par.scw.cloud`

Endpoint utilisé : `GET /api/v1/articles?date_from=X&date_to=Y&page_size=500`

### Sources actives (27)
**France/UE :** ACPR, AMF, Tracfin, EBA, ESMA, AMLA, FATF/GAFI, Conseil UE, Commission EU (FISMA), Legifrance JO, DGT Trésor/COLB, Banque de France, CNIL, Moneyval, Europarl ECON, EIOPA, ECB Supervision, AI Office EU, Egmont Group, Wolfsberg Group, UN Sanctions, BIS, FSB, EUR-Lex Sanctions

**UK/US :** OFAC, OFSI UK, FinCEN

---

## 8. Design system

| Élément | Valeur |
|---|---|
| Font titres | Cormorant |
| Font corps | Hanken Grotesch |
| Font labels | IBM Plex Mono |
| Background | `#F4F0E6` |
| Ink | `#1A1814` |
| Terra (CTA) | `#9E3D1B` |
| Green (info) | `#2C4A2E` |
| Boutons primaires | Fond terra |
| Encadrés info | Bordure gauche green 2px |
