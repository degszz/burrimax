import type { APIRoute } from 'astro';
import { z } from 'zod';

// Colores de fondo de la tienda: portada y catálogo de abajo (null = el de siempre). RLS: solo admin con MFA.
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color inválido').nullable();
const cuerpoSchema = z.object({ portada: hex, catalogo: hex });

export const POST: APIRoute = async ({ request, locals }) => {
  if (!request.headers.get('content-type')?.includes('application/json')) return new Response('Formato inválido', { status: 415 });
  const cuerpo = cuerpoSchema.safeParse(await request.json().catch(() => null));
  if (!cuerpo.success) return Response.json({ error: cuerpo.error.issues[0]?.message ?? 'Revisá el color' }, { status: 400 });
  const { data, error } = await locals.supabase.from('config_negocio').update({ color_portada: cuerpo.data.portada, color_catalogo: cuerpo.data.catalogo }).eq('id', true).select('id');
  if (error || !data?.length) return Response.json({ error: 'No se pudo guardar (¿sesión vencida?)' }, { status: 400 });
  return Response.json({ ok: true });
};
