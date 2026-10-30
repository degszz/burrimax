// Import con nombre, no por defecto: `mercadopago` es CommonJS y en Node (Vercel)
// el import por defecto trae el módulo entero ("MercadoPagoConfig is not a constructor").
import { InvalidWebhookSignatureError, MercadoPagoConfig, Payment, Preference, WebhookSignatureValidator } from 'mercadopago';
import type { ItemSnapshot } from '../pedidos/armarPedido';
import type { PagoInformado } from './estadoPago';

// Mercado Pago Checkout Pro (SDK oficial `mercadopago` 3.x).
// Credenciales solo del servidor: MP_ACCESS_TOKEN y MP_WEBHOOK_SECRET.

export function mercadoPagoConfigurado(): boolean {
  return !!import.meta.env.MP_ACCESS_TOKEN;
}

function config() {
  const accessToken = import.meta.env.MP_ACCESS_TOKEN;
  if (!accessToken) throw new Error('Falta MP_ACCESS_TOKEN');
  return new MercadoPagoConfig({ accessToken, options: { timeout: 8000 } });
}

interface DatosCobro {
  pedidoId: string;
  numero: number;
  urlSeguimiento: string;
  sitio: string;
  items: ItemSnapshot[];
  costoEnvio: number;
  email: string | null;
}

/** Crea la preferencia y devuelve a dónde mandar al cliente para pagar. */
export async function crearCobro({ pedidoId, numero, urlSeguimiento, sitio, items, costoEnvio, email }: DatosCobro) {
  const lineas = items.map((item) => ({
    id: item.tamano_id ?? item.producto_id ?? item.nombre,
    title: `${item.nombre} (con papas)`,
    quantity: item.cantidad,
    unit_price: item.precio_unitario,
    currency_id: 'ARS',
  }));
  if (costoEnvio > 0) lineas.push({ id: 'envio', title: 'Envío', quantity: 1, unit_price: costoEnvio, currency_id: 'ARS' });

  // Mercado Pago no acepta back_urls de localhost: en desarrollo se omite el retorno automático.
  const publico = !/localhost|127\.0\.0\.1/.test(sitio);
  const preferencia = await new Preference(config()).create({
    body: {
      items: lineas,
      external_reference: pedidoId,
      statement_descriptor: 'BURRITOS',
      metadata: { pedido_numero: numero },
      ...(email ? { payer: { email } } : {}),
      ...(publico
        ? {
            notification_url: `${sitio}/api/webhooks/mercadopago`,
            back_urls: { success: urlSeguimiento, pending: urlSeguimiento, failure: urlSeguimiento },
            auto_return: 'approved',
          }
        : {}),
    },
  });

  const destino = preferencia.init_point ?? preferencia.sandbox_init_point;
  if (!preferencia.id || !destino) throw new Error('Mercado Pago no devolvió la preferencia');
  return { preferenciaId: preferencia.id, redirectUrl: destino };
}

/** Valida que la notificación venga de Mercado Pago (firma `x-signature`). */
export function firmaValida(request: Request, dataId: string | null): boolean {
  const secret = import.meta.env.MP_WEBHOOK_SECRET;
  if (!secret) return false;
  try {
    WebhookSignatureValidator.validate({
      xSignature: request.headers.get('x-signature'),
      xRequestId: request.headers.get('x-request-id'),
      dataId,
      secret,
    });
    return true;
  } catch (error) {
    if (error instanceof InvalidWebhookSignatureError) return false;
    throw error;
  }
}

/** Consulta el pago a Mercado Pago: nunca confiar en lo que trae la notificación. */
export async function obtenerPago(id: string): Promise<PagoInformado & { id: string }> {
  const pago = await new Payment(config()).get({ id });
  return {
    id: String(pago.id),
    status: pago.status ?? 'unknown',
    external_reference: pago.external_reference ?? null,
    transaction_amount: pago.transaction_amount ?? null,
  };
}
