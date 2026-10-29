import type { APIRoute } from 'astro';
import { decidirPorPago } from '@/lib/pagos/estadoPago';
import { firmaValida, obtenerPago } from '@/lib/pagos/mercadopago';
import { clienteServidor } from '@/lib/supabaseServidor';

export const prerender = false;

// Webhook de Mercado Pago (reglas 4 y 5 de CLAUDE.md): un pedido pasa a pagado
// SOLO acá, con la firma verificada, consultando el pago a MP y sin procesar
// dos veces el mismo evento.

const ok = () => new Response(null, { status: 200 });

export const POST: APIRoute = async ({ request, url }) => {
  const cuerpo = (await request.json().catch(() => ({}))) as { id?: string | number; type?: string; action?: string; data?: { id?: string } };
  const dataId = url.searchParams.get('data.id') ?? cuerpo.data?.id ?? null;

  if (!firmaValida(request, dataId)) return new Response('firma inválida', { status: 401 });

  // Solo interesan los pagos; el resto se confirma para que MP no reintente.
  const tipo = url.searchParams.get('type') ?? cuerpo.type;
  if (tipo !== 'payment' || !dataId) return ok();

  const servidor = clienteServidor();
  if (!servidor) return new Response('sin configurar', { status: 503 });

  // Idempotencia: el mismo aviso no se procesa dos veces.
  const eventoId = `${cuerpo.id ?? request.headers.get('x-request-id') ?? dataId}`;
  const { data: evento, error: errorEvento } = await servidor
    .from('pagos_eventos')
    .upsert(
      { proveedor: 'mercadopago', evento_id: eventoId, tipo: `${tipo}.${cuerpo.action ?? ''}`, payload: cuerpo as never },
      { onConflict: 'proveedor,evento_id', ignoreDuplicates: true },
    )
    .select('id')
    .maybeSingle();
  if (errorEvento) {
    console.error('pagos_eventos', errorEvento);
    return new Response('error', { status: 500 }); // MP reintenta
  }
  if (!evento) return ok(); // ya lo habíamos recibido

  const pago = await obtenerPago(dataId);
  if (!pago.external_reference) return ok();

  const { data: pedido } = await servidor
    .from('pedidos')
    .select('id, total, estado, estado_pago')
    .eq('id', pago.external_reference)
    .maybeSingle();
  if (!pedido) return ok();

  const decision = decidirPorPago(pago, pedido);
  if (decision.tipo === 'actualizar') {
    await servidor
      .from('pedidos')
      .update({ estado_pago: decision.estado_pago, estado: decision.estado, pago_proveedor_id: pago.id })
      .eq('id', pedido.id);
    if (decision.estado !== pedido.estado) {
      await servidor
        .from('pedido_historial')
        .insert({ pedido_id: pedido.id, estado_anterior: pedido.estado, estado_nuevo: decision.estado });
    }
  } else {
    console.warn('Webhook MP sin cambios:', decision.motivo, pedido.id);
  }

  await servidor.from('pagos_eventos').update({ procesado: true }).eq('id', evento.id);
  return ok();
};
