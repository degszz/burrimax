import type { APIRoute } from 'astro';
import { decidirPorPago, decidirSinFirma } from '@/lib/pagos/estadoPago';
import { firmaValida, obtenerPago } from '@/lib/pagos/mercadopago';
import { clienteServidor } from '@/lib/supabaseServidor';

export const prerender = false;

// Webhook de Mercado Pago (reglas 4 y 5 de CLAUDE.md): un pedido pasa a pagado
// SOLO acá, consultando siempre el pago a MP y sin procesar dos veces el mismo
// evento. Si la firma no coincide, solo se aplica lo que confirma esa consulta.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ok = () => new Response(null, { status: 200 });

export const POST: APIRoute = async ({ request, url }) => {
  const cuerpo = (await request.json().catch(() => ({}))) as { id?: string | number; type?: string; action?: string; data?: { id?: string } };
  // Formato actual (type + data.id) o el clásico de notification_url (topic + id).
  const topico = url.searchParams.get('topic');
  const tipo = url.searchParams.get('type') ?? topico ?? cuerpo.type;
  const dataId = url.searchParams.get('data.id') ?? cuerpo.data?.id ?? (topico === 'payment' ? url.searchParams.get('id') : null);
  const firmada = firmaValida(request, dataId);

  // Solo interesan los pagos; el resto se confirma para que MP no reintente.
  if (tipo !== 'payment' || !dataId) return firmada ? ok() : new Response('firma inválida', { status: 401 });

  const servidor = clienteServidor();
  if (!servidor) return new Response('sin configurar', { status: 503 });

  // Sin firma (el panel de MP no deja ver la clave de prueba): el aviso no se
  // cree. Antes de guardar nada, el pago tiene que existir en MP y ser de un pedido.
  let pagoSinFirma: Awaited<ReturnType<typeof obtenerPago>> | null = null;
  if (!firmada) {
    if (!/^\d{1,20}$/.test(dataId)) return new Response('firma inválida', { status: 401 });
    pagoSinFirma = await obtenerPago(dataId).catch(() => null);
    if (!pagoSinFirma?.external_reference || !UUID.test(pagoSinFirma.external_reference)) {
      return new Response('pago no verificado', { status: 401 });
    }
    const { data: existe } = await servidor.from('pedidos').select('id').eq('id', pagoSinFirma.external_reference).maybeSingle();
    if (!existe) return new Response('pago no verificado', { status: 401 });
  }

  // Idempotencia: el mismo aviso no se procesa dos veces. Un aviso registrado
  // pero sin `procesado` (falló a mitad de camino) se vuelve a intentar.
  // Sin firma, el id sale de MP: quien mande avisos no puede inventar eventos.
  const eventoId = pagoSinFirma
    ? `pago-${pagoSinFirma.id}-${pagoSinFirma.status}`
    : `${cuerpo.id ?? request.headers.get('x-request-id') ?? dataId}`;
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
    const pago = pagoSinFirma ?? (await obtenerPago(dataId));
    if (pago.external_reference) {
      const { data: pedido, error: errorPedido } = await servidor
        .from('pedidos')
        .select('id, total, estado, estado_pago, pago_proveedor_id')
        .eq('id', pago.external_reference)
        .maybeSingle();
      if (errorPedido) throw errorPedido;

      if (pedido) {
        const decision = firmada ? decidirPorPago(pago, pedido) : decidirSinFirma(pago, pedido);
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
