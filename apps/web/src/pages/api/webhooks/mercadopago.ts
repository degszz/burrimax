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

  // Idempotencia: el mismo aviso no se procesa dos veces. Un aviso registrado
  // pero sin `procesado` (falló a mitad de camino) se vuelve a intentar.
  const eventoId = `${cuerpo.id ?? request.headers.get('x-request-id') ?? dataId}`;
  const { error: errorEvento } = await servidor
    .from('pagos_eventos')
    .upsert(
      { proveedor: 'mercadopago', evento_id: eventoId, tipo: `${tipo}.${cuerpo.action ?? ''}`, payload: cuerpo as never },
      { onConflict: 'proveedor,evento_id', ignoreDuplicates: true },
    );
  const { data: evento } = await servidor
    .from('pagos_eventos')
    .select('id, procesado')
    .eq('proveedor', 'mercadopago')
    .eq('evento_id', eventoId)
    .maybeSingle();
  if (errorEvento || !evento) {
    console.error('pagos_eventos', errorEvento);
    return reintentar();
  }
  if (evento.procesado) return ok(); // ya lo habíamos procesado

  try {
    const pago = await obtenerPago(dataId);
    if (pago.external_reference) {
      const { data: pedido, error: errorPedido } = await servidor
        .from('pedidos')
        .select('id, total, estado, estado_pago')
        .eq('id', pago.external_reference)
        .maybeSingle();
      if (errorPedido) throw errorPedido;

      if (pedido) {
        const decision = decidirPorPago(pago, pedido);
        if (decision.tipo === 'actualizar') {
          const { error } = await servidor
            .from('pedidos')
            .update({ estado_pago: decision.estado_pago, estado: decision.estado, pago_proveedor_id: pago.id })
            .eq('id', pedido.id);
          if (error) throw error;
          if (decision.estado !== pedido.estado) {
            const { error: errorHistorial } = await servidor
              .from('pedido_historial')
              .insert({ pedido_id: pedido.id, estado_anterior: pedido.estado, estado_nuevo: decision.estado });
            if (errorHistorial) throw errorHistorial;
          }
        } else {
          console.warn('Webhook MP sin cambios:', decision.motivo, pedido.id);
        }
      }
    }
  } catch (error) {
    console.error('Webhook MP', error);
    return reintentar(); // el evento queda sin procesar y MP lo vuelve a mandar
  }

  // Recién acá cuenta como procesado.
  await servidor.from('pagos_eventos').update({ procesado: true }).eq('id', evento.id);
  return ok();
};

const reintentar = () => new Response('error', { status: 500 });
