import { ESTADOS_PEDIDO } from '@burritos/shared';
import type { APIRoute } from 'astro';
import { z } from 'zod';

const cuerpoSchema = z.object({
  estado: z.enum(ESTADOS_PEDIDO),
  motivo: z.string().trim().max(200).optional(),
});

// Cambia el estado con la función de la base: valida la transición y deja el
// historial (quién, cuándo y por qué). El cliente lo ve en su seguimiento.
export const POST: APIRoute = async ({ params, request, locals }) => {
  if (!request.headers.get('content-type')?.includes('application/json')) return new Response('Formato inválido', { status: 415 });
  const cuerpo = cuerpoSchema.safeParse(await request.json().catch(() => null));
  if (!cuerpo.success || !params.id) return Response.json({ error: 'Datos inválidos' }, { status: 400 });

  const { error } = await locals.supabase.rpc('cambiar_estado_pedido', {
    p_id: params.id,
    p_estado: cuerpo.data.estado,
    p_motivo: cuerpo.data.motivo,
  });
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ ok: true });
};
