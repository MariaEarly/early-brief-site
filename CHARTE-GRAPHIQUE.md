# Charte graphique — Early Brief

*Document de référence pour le site early-brief.com*
*Généré le 22 mars 2026*

---

## 1. Couleurs

### Palette principale

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg` | `#F4F0E6` | Fond global (écru) |
| `--ink` | `#1A1814` | Texte principal |
| `--muted` | `#4A4540` | Texte secondaire |
| `--ghost` | `#8A8480` | Texte tertiaire, légendes |
| `--green` | `#2C4A2E` | Accent vert sapin — stepper, bordures info, badges |
| `--terra` | `#9E3D1B` | Accent terracotta — liens, boutons, CTA, tags |
| `--rule` | `rgba(26,24,20,0.14)` | Séparateurs, bordures légères |

### Palette étendue (outils statiques)

| Variable | Hex | Usage |
|----------|-----|-------|
| `--ecru-dark` | `#EDE9E0` | Fonds secondaires (zones action) |
| `--text-mid` | `#4A4A3A` | Texte intermédiaire (tableaux) |
| `--text-light` | `#6B6B5A` | Labels, descriptions |
| `--text-muted` | `#8A8578` | Placeholders, notes de bas de page |
| `--border` | `#D4CFC6` | Bordures de section |
| `--border-input` | `#C8C4B8` | Bordures formulaires |

### Règles d'usage

- **Liens** : `--terra` (#9E3D1B), underline au hover
- **Boutons primaires** : fond `--terra`, texte `--bg`
- **Boutons secondaires** : bordure `--green`, texte `--green`
- **Encadrés info** : bordure gauche `--green` 2px
- **Blocs prospectifs** : bordure `--terra` 2px dashed
- **Tableaux th** : fond `--green`, texte `--bg`
- **Box-shadow** : aucune — remplacées par bordures

---

## 2. Typographie

### Familles de polices

| Token | Police | Usage |
|-------|--------|-------|
| `--display` | **Cormorant** (400, 600, 700, italic) | Titres h1/h2, citations |
| `--sans` | **Hanken Grotesk** (300–700) | Corps de texte, navigation, boutons |
| `--mono` | **IBM Plex Mono** (400, 500) | Labels de section, tags, badges, code |

### Chargement (Google Fonts)

```
Cormorant:ital,wght@0,400;0,600;0,700;1,400
Hanken Grotesk:wght@300;400;500;600;700
IBM Plex Mono:wght@400;500
```

### Polices outils statiques (public/outils/)

Les outils statiques utilisent une palette typographique légèrement différente :

| Variable | Police | Fallback |
|----------|--------|----------|
| `--serif` | Source Serif 4 | Georgia, serif |
| `--sans` | Inter | sans-serif |
| `--mono` | JetBrains Mono | monospace |

### Hiérarchie typographique

| Élément | Police | Taille | Poids | Espacement | Couleur |
|---------|--------|--------|-------|------------|---------|
| h1 (page) | Cormorant | 2.2–2.8rem | 400–600 | -0.01em | `--ink` |
| h2 (section) | Cormorant | 1.4–1.8rem | 600 | — | `--ink` |
| h3 (sous-section) | Hanken Grotesk | 1–1.2rem | 600 | — | `--ink` |
| Label de section | IBM Plex Mono | 0.7–0.75rem | 700 | 0.08–0.12em | `--ghost` |
| Corps | Hanken Grotesk | 0.95–1rem | 400 | — | `--ink` / `--muted` |
| Données tableau | Hanken Grotesk | 0.875rem | 400 | tabular-nums | `--muted` |
| Code inline | IBM Plex Mono | 0.78em | 400 | — | `--terra` |
| Badge / tag | IBM Plex Mono | 0.65–0.7rem | 500–700 | 0.06–0.1em | variable |

### Labels de section (pattern récurrent)

```css
font-family: var(--mono);
font-size: 0.7rem;
font-weight: 700;
letter-spacing: 0.12em;
text-transform: uppercase;
color: var(--ghost); /* ou --terra selon contexte */
```

---

## 3. Espacements

### Grille et conteneurs

| Élément | Valeur |
|---------|--------|
| Max-width contenu | 780px (outils) / 900px (fiches) / 100% (hub) |
| Padding horizontal page | 2–2.5rem |
| Padding horizontal mobile | 1.25rem |

### Marges verticales

| Contexte | Valeur |
|----------|--------|
| Entre sections | 2–3rem |
| Sous un h2 | 1–1.5rem |
| Entre paragraphes | 0.6–0.75rem |
| Entre items de liste | 0.25–0.5rem |
| Padding card | 1.25–1.75rem |

### Line-height

| Contexte | Valeur |
|----------|--------|
| Titres h1 | 1.05–1.15 |
| Titres h2 | 1.2–1.25 |
| Corps de texte | 1.55–1.75 |
| Mono / labels | 1.3–1.5 |

---

## 4. Composants

### Cards (hub ressources)

```css
.ressources-card {
  border: 1px solid var(--rule);
  border-radius: 0;
  padding: 1.75rem;
  background: transparent;
  /* hover: border-color --terra */
}
```

### Tableaux (.comparison-table)

```css
th { background: #2D5A3D; color: #F5F2EB; text-align: center; }
td { text-align: center; color: #4A4A3A; font-variant-numeric: tabular-nums; }
td:first-child { text-align: center; font-weight: 400; }
```

### Blocs visuels fiches

| Classe | Style | Usage |
|--------|-------|-------|
| `.fiche-reponse` | Fond léger, bordure gauche verte | Réponse clé, TL;DR |
| `.fiche-preuves` | Fond léger, bordure gauche verte foncée | Preuves, justification |
| `.fiche-vigilance` | Fond léger, bordure gauche orange | Points d'attention |
| `.fiche-futur` | Transparent, bordure terra 2px dashed | Sections prospectives (AMLR 2027) |
| `.fiche-sources` | Fond transparent | Sources avec authority/ref/link |

### Étapes AMLA

```css
.amla-etape {
  border-left: 2px solid #2D5A3D;
  padding: 0.6rem 0 0.6rem 1.25rem;
  margin: 0 0 2rem 0;
}
.amla-etape-titre {
  font-family: var(--mono);
  font-size: 0.75rem;
  font-weight: 700;
  color: #2D5A3D;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
```

### Boutons

| Type | Style |
|------|-------|
| Primaire | `background: --terra; color: --bg; border-radius: 2px` |
| Secondaire | `border: 1px solid --green; color: --green; background: transparent` |
| Lien-bouton | `color: --terra; text-decoration: underline; text-underline-offset: 3px` |

---

## 5. Responsive

| Breakpoint | Comportement |
|------------|-------------|
| > 900px | Layout desktop, grilles 2–4 colonnes |
| 600–900px | Grilles 1–2 colonnes, padding réduit |
| < 600px | 1 colonne, hamburger nav, padding 1.25rem |

---

## 6. Favicon

SVG 32×32 — fond terracotta `#9E3D1B`, lettres "EB" en écru `#F5F2EB`, DM Sans bold.

---

## 7. SEO / Meta

- `og:image` : `/og-default.png` (1200×630, surchargeable par page)
- `robots` : `max-image-preview:large`
- JSON-LD : Article (pages piliers), FAQPage (FAQ)
- Sitemap : 38 pages Astro + 5 outils statiques

---

*Ce document est généré depuis le code source du site. En cas de divergence, le code fait foi.*
