import { configPagosSchema } from '@burritos/shared';
import type { APIRoute } from 'astro';

// Guarda los medios de pago y los datos de transferencia (RLS: solo admin con MFA
// puede actualizar config_negocio). No toca `pago_stripe_activo`: Stripe tiene su propio interruptor.
export const POST: APIRoute = async ({ request, locals }) => {
  if (!request.headers.get('content-type')?.includes('application/json')) return new Response('Formato inválido', { status: 415 });
  const cuerpo = configPagosSchema.safeParse(await request.json().catch(() => null));
  if (!cuerpo.success) {
    const primero = cuerpo.error.issues[0];
    return Response.json({ error: primero?.message ?? 'Revisá los datos', campo: primero?.path.join('.') }, { status: 400 });
  }

  const { pagos, transferencia } = cuerpo.data;
  const { data, error } = await locals.supabase
    .from('config_negocio')
    .update({
      pago_mp_activo: pagos.mercadopago,
      pago_transferencia_activo: pagos.transferencia,
      pago_efectivo_activo: pagos.efectivo,
      alias_transferencia: transferencia.alias,
      cvu: transferencia.cvu,
      titular: transferencia.titular,
    })
    .eq('id', true)
    .select('id');
  if (error || !data?.length) return Response.json({ error: 'No se pudo guardar (¿sesión vencida?)' }, { status: 400 });
  return Response.json({ ok: true });
};
