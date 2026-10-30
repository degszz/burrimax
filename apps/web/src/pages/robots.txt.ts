import type { APIRoute } from 'astro';
import { MARCA } from '@/lib/marca';

export const prerender = true;

// Google puede leer la tienda; el checkout, el seguimiento y la API no.
export const GET: APIRoute = () => {
  const sitio = (import.meta.env.PUBLIC_SITE_URL || MARCA.sitio).replace(/\/$/, '');
  const texto = ['User-agent: *', 'Allow: /', 'Disallow: /checkout', 'Disallow: /pedido/', 'Disallow: /api/', '', `Sitemap: ${sitio}/sitemap.xml`, ''].join('\n');
  return new Response(texto, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
};
