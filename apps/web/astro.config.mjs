// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';

// Tienda pública. Server por defecto: pedidos, webhooks y catálogo en vivo.
// Las páginas que no cambian se marcan con `export const prerender = true`.
// https://astro.build/config
export default defineConfig({
  output: 'server',
  server: { port: 4321 },
  integrations: [react()],
  adapter: vercel(),

  vite: {
    plugins: [tailwindcss()],
  },
});
