// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';

// Panel de administración (subdominio admin.). Todo server: requiere sesión.
// https://astro.build/config
export default defineConfig({
  output: 'server',
  server: { port: 4322 },
  integrations: [react()],
  adapter: vercel(),

  vite: {
    plugins: [tailwindcss()],
  },
});
