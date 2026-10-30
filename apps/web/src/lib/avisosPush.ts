import webpush from 'web-push';
import { formatoPesos } from './formato';
import { MARCA } from './marca';
import { clienteServidor } from './supabaseServidor';

// Avisos push al celular del admin cuando entra un pedido (aunque tenga el
// panel cerrado o el celular bloqueado). Las suscripciones las guarda el admin
// con "Avisarme en este celular". La clave privada solo vive en el servidor.

/** Pública: la misma que usa el admin para suscribirse (no es secreta). */
export const VAPID_PUBLICA =
  import.meta.env.PUBLIC_VAPID_PUBLIC_KEY || 'BCRyAo4wyLZDHaZnF-VsM7dfASSLDde8z-yK9Q7vM_L-givj9u9pR_lRgrs8IVkxOZ9FC_jAeO6aTshhyySPFak';

const NOMBRE_PAGO: Record<string, string> = { efectivo: 'Efectivo', transferencia: 'Transferencia', mercadopago: 'Mercado Pago', stripe: 'Tarjeta' };

export interface PedidoParaAvisar {
  numero: number;
  cliente: string;
  total: number;
  metodoPago: string;
  tipoEntrega: 'delivery' | 'retiro';
}

/** Manda el aviso a todos los celulares anotados. Nunca rompe el pedido: si falla, solo lo registra. */
export async function avisarPedidoNuevo(p: PedidoParaAvisar): Promise<void> {
  const privada = import.meta.env.VAPID_PRIVATE_KEY;
  const db = clienteServidor();
  if (!privada || !db) return;

  try {
    const { data: suscripciones } = await db.from('push_suscripciones').select('id, endpoint, p256dh, auth');
    if (!suscripciones?.length) return;

    webpush.setVapidDetails(MARCA.sitio, VAPID_PUBLICA, privada);
    const contenido = JSON.stringify({
      titulo: `🌯 Pedido #${String(p.numero).padStart(4, '0')} · ${formatoPesos(p.total)}`,
      cuerpo: `${p.cliente} · ${p.tipoEntrega === 'delivery' ? 'Delivery' : 'Retira'} · ${NOMBRE_PAGO[p.metodoPago] ?? p.metodoPago}`,
      etiqueta: `pedido-${p.numero}`,
      url: '/',
    });

    const vencidas: string[] = [];
    // Máximo 4 s: el cliente no espera por el aviso.
    await Promise.race([
      Promise.allSettled(
        suscripciones.map(async (s) => {
          try {
            await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, contenido, { TTL: 60 * 30, urgency: 'high' });
          } catch (e) {
            const estado = (e as { statusCode?: number }).statusCode;
            // 404/410: el celular ya no acepta avisos (se desinstaló o se borraron permisos).
            if (estado === 404 || estado === 410) vencidas.push(s.id);
            else console.error('push', estado ?? e);
          }
        }),
      ),
      new Promise((r) => setTimeout(r, 4000)),
    ]);
    if (vencidas.length) await db.from('push_suscripciones').delete().in('id', vencidas);
  } catch (e) {
    console.error('avisos push', e);
  }
}
