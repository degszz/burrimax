import type { APIRoute } from 'astro';
import { MARCA } from '@/lib/marca';

export const prerender = true;

// Para "Agregar a la pantalla de inicio" en el celular: nombre, colores e íconos.
export const GET: APIRoute = () =>
  new Response(
    JSON.stringify({
      name: `${MARCA.nombre} · ${MARCA.frase}`,
      short_name: MARCA.nombre,
      description: MARCA.descripcion,
      lang: 'es-AR',
      start_url: '/',
      display: 'standalone',
      background_color: MARCA.colorFondo,
      theme_color: MARCA.colorFondo,
      icons: [
        { src: '/icono-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icono-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
      ],
    }),
    { headers: { 'content-type': 'application/manifest+json; charset=utf-8' } },
  );
