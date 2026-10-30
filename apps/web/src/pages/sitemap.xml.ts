import type { APIRoute } from 'astro';
import { MARCA } from '@/lib/marca';

export const prerender = true;

// Por ahora la tienda es una sola página pública (el armador + los combos).
export const GET: APIRoute = () => {
  const sitio = (import.meta.env.PUBLIC_SITE_URL || MARCA.sitio).replace(/\/$/, '');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${sitio}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>
</urlset>
`;
  return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
};
