// @ts-check
// @ts-check
import { defineConfig } from 'astro/config';

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
      'https://early-brief.com/outils/autres-publications/',
    ],
  })],
  trailingSlash: 'always',
});