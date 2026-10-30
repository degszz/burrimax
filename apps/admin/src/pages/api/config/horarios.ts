import { MODOS_APERTURA, horariosSchema } from '@burritos/shared';
import type { APIRoute } from 'astro';
import { z } from 'zod';

const cuerpoSchema = z.object({ modo: z.enum(MODOS_APERTURA), horarios: horariosSchema });

// Guarda modo y horarios (RLS: solo admin con MFA puede actualizar config_negocio).
export const POST: APIRoute = async ({ request, locals }) => {
  if (!request.headers.get('content-type')?.includes('application/json')) return new Response('Formato inválido', { status: 415 });
  const cuerpo = cuerpoSchema.safeParse(await request.json().catch(() => null));
  if (!cuerpo.success) return Response.json({ error: 'Revisá las horas (formato HH:MM, máximo 3 turnos por día)' }, { status: 400 });

  const { modo, horarios } = cuerpo.data;
  const { data, error } = await locals.supabase
    .from('config_negocio')
    // `abierto` queda en sintonía para lo que todavía lo lea.
    .update({ modo_apertura: modo, horarios, abierto: modo === 'abierto' })
    .eq('id', true)
    .select('id');
  if (error || !data?.length) return Response.json({ error: 'No se pudo guardar (¿sesión vencida?)' }, { status: 400 });
  return Response.json({ ok: true });
};
