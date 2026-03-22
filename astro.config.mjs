// @ts-check
import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://early-brief.com',
  integrations: [sitemap({
    customPages: [
      'https://early-brief.com/outils/tracker/',
      'https://early-brief.com/outils/kyc/',
      'https://early-brief.com/outils/liste-pays/',
      'https://early-brief.com/outils/roadmap/',
      'https://early-brief.com/outils/early-request/',
    ],
  })],
  trailingSlash: 'always',
});