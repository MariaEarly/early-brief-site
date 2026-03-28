// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  site: 'https://early-brief.com',
  integrations: [react(), sitemap({
    customPages: [
      'https://early-brief.com/outils/tracker/',
      'https://early-brief.com/outils/kyc/',
      'https://early-brief.com/outils/liste-pays/',
      'https://early-brief.com/outils/roadmap/',
      'https://early-brief.com/outils/early-request/',
    ],
  })],
  trailingSlash: 'always',
  fonts: [
    {
      name: "Cormorant",
      cssVariable: "--font-cormorant",
      provider: fontProviders.google(),
      weights: [400, 600, 700],
      styles: ["normal", "italic"],
    },
    {
      name: "Hanken Grotesk",
      cssVariable: "--font-hanken",
      provider: fontProviders.google(),
      weights: [300, 400, 500, 600, 700],
      styles: ["normal"],
    },
    {
      name: "IBM Plex Mono",
      cssVariable: "--font-mono",
      provider: fontProviders.google(),
      weights: [400, 500],
      styles: ["normal"],
    },
  ],
});