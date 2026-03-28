import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const images = [
  {
    id: 'og-veille-reglementaire',
    svg: `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="630" fill="#F4F0E6"/>
      <rect x="0" y="563" width="1200" height="67" fill="#1A1814"/>
      <text x="70" y="92" font-family="Georgia,serif" font-size="23" fill="#9E3D1B" letter-spacing="7">EARLY BRIEF</text>
      <rect x="70" y="112" width="1060" height="1.5" fill="rgba(26,24,20,0.15)"/>
      <text x="70" y="262" font-family="Georgia,serif" font-size="96" fill="#1A1814">Veille</text>
      <text x="70" y="364" font-family="Georgia,serif" font-size="96" fill="#1A1814">r&#233;glementaire</text>
      <rect x="70" y="396" width="1060" height="1.5" fill="rgba(26,24,20,0.15)"/>
      <text x="70" y="446" font-family="Georgia,serif" font-size="26" fill="rgba(26,24,20,0.45)" letter-spacing="1.5">LCB-FT &#183; DORA &#183; MiCA &#183; sanctions &#183; AMLA</text>
      <text x="70" y="598" font-family="monospace" font-size="20" fill="#F4F0E6" letter-spacing="2">early-brief.com</text>
      <text x="1130" y="598" font-family="monospace" font-size="18" fill="rgba(244,240,230,0.4)" letter-spacing="1" text-anchor="end">Veille &#183; Ressources &#183; Conformit&#233;</text>
    </svg>`
  },
  {
    id: 'og-base-reglementaire',
    svg: `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="630" fill="#F4F0E6"/>
      <rect x="0" y="563" width="1200" height="67" fill="#1A1814"/>
      <text x="70" y="92" font-family="Georgia,serif" font-size="23" fill="#9E3D1B" letter-spacing="7">EARLY BRIEF</text>
      <rect x="70" y="112" width="1060" height="1.5" fill="rgba(26,24,20,0.15)"/>
      <text x="70" y="262" font-family="Georgia,serif" font-size="96" fill="#1A1814">Base</text>
      <text x="70" y="364" font-family="Georgia,serif" font-size="96" fill="#1A1814">r&#233;glementaire</text>
      <rect x="70" y="396" width="1060" height="1.5" fill="rgba(26,24,20,0.15)"/>
      <text x="70" y="446" font-family="Georgia,serif" font-size="26" fill="rgba(26,24,20,0.45)" letter-spacing="1.5">57 textes &#183; LCB-FT &#183; DORA &#183; MiCA &#183; sanctions</text>
      <text x="70" y="598" font-family="monospace" font-size="20" fill="#F4F0E6" letter-spacing="2">early-brief.com</text>
      <text x="1130" y="598" font-family="monospace" font-size="18" fill="rgba(244,240,230,0.4)" letter-spacing="1" text-anchor="end">R&#233;f&#233;rentiel &#183; 57 textes &#183; Mis &#224; jour</text>
    </svg>`
  },
  {
    id: 'og-textes-applicables-france',
    svg: `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="630" fill="#F4F0E6"/>
      <rect x="0" y="563" width="1200" height="67" fill="#1A1814"/>
      <text x="70" y="92" font-family="Georgia,serif" font-size="23" fill="#9E3D1B" letter-spacing="7">EARLY BRIEF</text>
      <rect x="70" y="112" width="1060" height="1.5" fill="rgba(26,24,20,0.15)"/>
      <text x="70" y="234" font-family="Georgia,serif" font-size="88" fill="#1A1814">Textes applicables</text>
      <text x="70" y="336" font-family="Georgia,serif" font-size="88" fill="#1A1814">en France</text>
      <rect x="70" y="368" width="1060" height="1.5" fill="rgba(26,24,20,0.15)"/>
      <text x="70" y="446" font-family="Georgia,serif" font-size="26" fill="rgba(26,24,20,0.45)" letter-spacing="1.5">Droit UE &#183; Directives &#183; Droit national &#183; Soft law</text>
      <text x="70" y="598" font-family="monospace" font-size="20" fill="#F4F0E6" letter-spacing="2">early-brief.com</text>
      <text x="1130" y="598" font-family="monospace" font-size="18" fill="rgba(244,240,230,0.4)" letter-spacing="1" text-anchor="end">Cartographie &#183; Niveaux normatifs</text>
    </svg>`
  },
  {
    id: 'og-early-request',
    svg: `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="630" fill="#F4F0E6"/>
      <rect x="0" y="563" width="1200" height="67" fill="#1A1814"/>
      <text x="70" y="92" font-family="Georgia,serif" font-size="23" fill="#9E3D1B" letter-spacing="7">EARLY BRIEF</text>
      <rect x="70" y="112" width="1060" height="1.5" fill="rgba(26,24,20,0.15)"/>
      <text x="70" y="262" font-family="Georgia,serif" font-size="96" fill="#1A1814">Early</text>
      <text x="70" y="364" font-family="Georgia,serif" font-size="96" fill="#1A1814">Request</text>
      <rect x="70" y="396" width="1060" height="1.5" fill="rgba(26,24,20,0.15)"/>
      <text x="70" y="446" font-family="Georgia,serif" font-size="26" fill="rgba(26,24,20,0.45)" letter-spacing="1.5">Assistant r&#233;glementaire &#183; LCB-FT &#183; MiCA &#183; DORA</text>
      <text x="70" y="598" font-family="monospace" font-size="20" fill="#F4F0E6" letter-spacing="2">early-brief.com</text>
      <text x="1130" y="598" font-family="monospace" font-size="18" fill="rgba(244,240,230,0.4)" letter-spacing="1" text-anchor="end">Outil gratuit &#183; Corpus sourc&#233;</text>
    </svg>`
  },
  {
    id: 'og-outil-rts-cdd',
    svg: `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="630" fill="#F4F0E6"/>
      <rect x="0" y="563" width="1200" height="67" fill="#1A1814"/>
      <text x="70" y="92" font-family="Georgia,serif" font-size="23" fill="#9E3D1B" letter-spacing="7">EARLY BRIEF</text>
      <rect x="70" y="112" width="1060" height="1.5" fill="rgba(26,24,20,0.15)"/>
      <text x="70" y="234" font-family="Georgia,serif" font-size="88" fill="#1A1814">Outil RTS CDD</text>
      <text x="70" y="336" font-family="Georgia,serif" font-size="88" fill="#1A1814">AMLA</text>
      <rect x="70" y="368" width="1060" height="1.5" fill="rgba(26,24,20,0.15)"/>
      <text x="70" y="446" font-family="Georgia,serif" font-size="26" fill="rgba(26,24,20,0.45)" letter-spacing="1.5">Consultation ouverte &#183; Articles 1&#8211;7 &#183; Gratuit</text>
      <text x="70" y="598" font-family="monospace" font-size="20" fill="#F4F0E6" letter-spacing="2">early-brief.com</text>
      <text x="1130" y="598" font-family="monospace" font-size="18" fill="rgba(244,240,230,0.4)" letter-spacing="1" text-anchor="end">RTS &#183; CDD &#183; KYC &#183; AMLA</text>
    </svg>`
  }
];

for (const img of images) {
  const buffer = Buffer.from(img.svg);
  await sharp(buffer)
    .resize(1200, 630)
    .png()
    .toFile(join(__dirname, `../public/og/${img.id}.png`));
  console.log(`✓ ${img.id}.png`);
}

console.log('Toutes les OG images générées.');
