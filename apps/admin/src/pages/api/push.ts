import { esEndpointPushValido } from '@burritos/shared';
import type { APIRoute } from 'astro';
import { z } from 'zod';

// Guarda / borra la suscripción de avisos de ESTE celular (RLS: solo las del
// admin logueado con MFA). Quien manda los avisos es la tienda al crear un pedido.

const suscripcionSchema = z.object({
  endpoint: z.url().max(1000),
  keys: z.object({ p256dh: z.string().min(10).max(200), auth: z.string().min(10).max(100) }),
  dispositivo: z.string().max(200).optional(),
});

export const POST: APIRoute = async ({ request, locals }) => {
  if (!request.headers.get('content-type')?.includes('application/json')) return new Response('Formato inválido', { status: 415 });
  const cuerpo = suscripcionSchema.safeParse(await request.json().catch(() => null));
  if (!cuerpo.success) return Response.json({ error: 'Suscripción inválida' }, { status: 400 });
  const { endpoint, keys, dispositivo } = cuerpo.data;
  // Solo servicios de avisos oficiales (Google, Apple, Mozilla, Microsoft).
  if (!esEndpointPushValido(endpoint)) return Response.json({ error: 'Servicio de avisos no admitido' }, { status: 400 });

  // Tope de celulares por usuario (evita llenar la tabla).
  const { count } = await locals.supabase.from('push_suscripciones').select('id', { count: 'exact', head: true });
  if ((count ?? 0) >= 10) return Response.json({ error: 'Ya hay 10 dispositivos con avisos; apagá alguno' }, { status: 400 });

  const { error } = await locals.supabase
    .from('push_suscripciones')
    .upsert({ endpoint, p256dh: keys.p256dh, auth: keys.auth, dispositivo: dispositivo ?? null }, { onConflict: 'endpoint' });
  if (error) return Response.json({ error: 'No se pudo activar' }, { status: 400 });
  return Response.json({ ok: true });
};

export const DELETE: APIRoute = async ({ request, locals }) => {
  const cuerpo = z.object({ endpoint: z.url() }).safeParse(await request.json().catch(() => null));
  if (!cuerpo.success) return Response.json({ error: 'Pedido inválido' }, { status: 400 });
  await locals.supabase.from('push_suscripciones').delete().eq('endpoint', cuerpo.data.endpoint);
  return Response.json({ ok: true });
};
