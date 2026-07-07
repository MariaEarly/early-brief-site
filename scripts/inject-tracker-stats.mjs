// Injecte au build les stats DÉRIVÉES de tracker-data.json dans la page tracker,
// pour supprimer les valeurs codées en dur qui se périment.
//
// Aujourd'hui : le compteur « N textes suivis » des balises meta (SEO / partage
// social), qui doit refléter le nombre réel d'entrées, pas un littéral figé.
//
// Exécuté APRÈS `astro build` : patche dist/ (Astro a déjà copié public/ → dist/).
// La source public/…/index.html garde une valeur par défaut ; dist fait foi.
//
// HORS PÉRIMÈTRE (volontaire) : le bloc « bilan mensuel » (EVENEMENTS_MARQUANTS,
// BILAN_MOIS, compteurs jan/fév/mars) reste ÉDITORIAL et manuel — sa prose curée
// n'est pas dérivable de tracker-data.json. Voir le commentaire du bloc dans index.html.
import { readFileSync, writeFileSync } from 'node:fs';

const DIR = 'dist/outils/tracker';

const raw = JSON.parse(readFileSync(`${DIR}/tracker-data.json`, 'utf8'));
const count = Array.isArray(raw) ? raw.length : (raw.entries?.length ?? 0);

const htmlPath = `${DIR}/index.html`;
const html = readFileSync(htmlPath, 'utf8');
const matches = (html.match(/\d+\s+textes suivis/g) || []).length;
const patched = html.replace(/\d+\s+textes suivis/g, `${count} textes suivis`);

if (matches === 0) {
  console.warn('[inject-tracker-stats] motif "N textes suivis" introuvable — rien injecté');
} else {
  writeFileSync(htmlPath, patched);
  console.log(`[inject-tracker-stats] compteur meta → "${count} textes suivis" (${matches} occurrences)`);
}
