import { PedidoInvalidoError, pedidoSchema } from '@burritos/shared';
import type { APIRoute } from 'astro';
import { cargarDatosTienda } from '@/lib/catalogo.server';
import { crearCobro, mercadoPagoConfigurado } from '@/lib/pagos/mercadopago';
import { ErrorDePedido, armarPedido } from '@/lib/pedidos/armarPedido';
import { clienteServidor } from '@/lib/supabaseServidor';

export const prerender = false;

// POST /api/pedidos — único lugar donde se crean pedidos (reglas 1–3 de CLAUDE.md).

const MAX_POR_VENTANA = 10;
const VENTANA_MS = 10 * 60 * 1000;
// Límite básico por IP. En serverless vive por instancia: frena abusos simples, no ataques.
const intentos = new Map<string, number[]>();

function json(cuerpo: unknown, status: number) {
  return new Response(JSON.stringify(cuerpo), { status, headers: { 'content-type': 'application/json' } });
}

function demasiadosIntentos(ip: string): boolean {
  const ahora = Date.now();
  const recientes = (intentos.get(ip) ?? []).filter((t) => ahora - t < VENTANA_MS);
  recientes.push(ahora);
  intentos.set(ip, recientes);
  return recientes.length > MAX_POR_VENTANA;
}

export const POST: APIRoute = async ({ request, clientAddress, url }) => {
  if (demasiadosIntentos(clientAddress ?? 'desconocida')) {
    return json({ error: 'Hiciste muchos pedidos seguidos. Esperá unos minutos y probá de nuevo.' }, 429);
  }

  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return json({ error: 'No pudimos leer el pedido.' }, 400);
  }
  // Campo trampa para bots: una persona nunca lo completa.
  if (typeof cuerpo === 'object' && cuerpo && 'web' in cuerpo && (cuerpo as { web?: unknown }).web) {
    return json({ ok: true }, 200);
  }

  const servidor = clienteServidor();
  if (!servidor) return json({ error: 'Todavía no estamos tomando pedidos por la web. Escribinos por WhatsApp.' }, 503);

  const datos = await cargarDatosTienda().catch(() => null);
  if (!datos) return json({ error: 'No pudimos cargar el menú. Probá de nuevo en un ratito.' }, 503);
  if (!datos.config.abierto) return json({ error: 'Ahora estamos cerrados. ¡Volvé en nuestro horario!' }, 409);

  const entrada = pedidoSchema.safeParse(cuerpo);
  if (!entrada.success) {
    const primero = entrada.error.issues[0];
    return json({ error: primero?.message ?? 'Revisá los datos del pedido.', campo: primero?.path.join('.') }, 400);
  }

  const pagos = { ...datos.config.pagos, mercadopago: datos.config.pagos.mercadopago && mercadoPagoConfigurado() };
  let armado;
  try {
    armado = armarPedido(entrada.data, datos.catalogo, pagos);
  } catch (error) {
    if (error instanceof ErrorDePedido) return json({ error: error.message }, 422);
    if (error instanceof PedidoInvalidoError) {
      return json({ error: 'Algo de tu pedido cambió en el menú. Revisalo y probá de nuevo.', detalle: error.errores }, 422);
    }
    throw error;
  }

  const { data, error } = await servidor.rpc('crear_pedido', { p: armado.payload as never });
  if (error || !data) {
    console.error('crear_pedido', error);
    return json({ error: 'No pudimos guardar tu pedido. Probá de nuevo.' }, 500);
  }
  const creado = data as { id: string; numero: number; token: string };

  const sitio = (import.meta.env.PUBLIC_SITE_URL || url.origin).replace(/\/$/, '');
  const urlSeguimiento = `${sitio}/pedido/${creado.id}?t=${creado.token}`;
  // Al volver de Mercado Pago, el seguimiento vacía el carrito (nuevo=1).

  if (armado.payload.metodo_pago === 'mercadopago') {
    try {
      const cobro = await crearCobro({
        pedidoId: creado.id,
        numero: creado.numero,
        urlSeguimiento: `${urlSeguimiento}&nuevo=1`,
        sitio,
        items: armado.payload.items,
        costoEnvio: armado.payload.costo_envio,
        email: armado.payload.cliente_email,
      });
      await servidor.from('pedidos').update({ pago_proveedor_id: cobro.preferenciaId }).eq('id', creado.id);
      return json({ numero: creado.numero, url: urlSeguimiento, redirectUrl: cobro.redirectUrl }, 201);
    } catch (e) {
      console.error('Mercado Pago', e);
      // El pedido quedó guardado: desde el seguimiento puede pagar por transferencia o avisar.
      return json({ numero: creado.numero, url: urlSeguimiento, aviso: 'No pudimos abrir Mercado Pago. Tu pedido quedó guardado.' }, 201);
    }
  }

  return json({ numero: creado.numero, url: urlSeguimiento }, 201);
};
