import type { APIRoute } from 'astro';
import { z } from 'zod';

// Disponible / sin stock de varios ingredientes de una (ej. "volver a poner
// todo disponible" al abrir). Con la sesión del admin: RLS + MFA.
const cuerpoSchema = z.object({
  ids: z.array(z.uuid()).min(1).max(300),
  activo: z.boolean(),
});

export const POST: APIRoute = async ({ request, locals }) => {
  if (!request.headers.get('content-type')?.includes('application/json')) return new Response('Formato inválido', { status: 415 });
  const cuerpo = cuerpoSchema.safeParse(await request.json().catch(() => null));
  if (!cuerpo.success) return Response.json({ error: 'Pedido inválido' }, { status: 400 });

  const { data, error } = await locals.supabase
    .from('ingredientes')
    .update({ activo: cuerpo.data.activo })
    .in('id', cuerpo.data.ids)
    .select('id');
  if (error) return Response.json({ error: 'No se pudo guardar' }, { status: 400 });
  return Response.json({ ok: true, cambiados: data?.length ?? 0 });
};
