import type { Database, EstadoPedido } from '@burritos/shared';
import { avisoEstado, enviarPlantilla, enviarTexto, type CredencialesWhatsapp } from '@burritos/shared/whatsapp';
import type { SupabaseClient } from '@supabase/supabase-js';

// Avisos de estado por WhatsApp cuando Max toca un botón en el tablero.
// Solo a clientes que escribieron al bot por ese pedido. Dentro de las 24 h
// desde su último mensaje va texto libre; después, la plantilla aprobada.
// Nunca frena el cambio de estado: si falla, queda registrado y listo.

type Db = SupabaseClient<Database>;

/** Margen de 10 minutos antes de que Meta cierre la ventana de 24 h. */
const VENTANA_MS = 24 * 3600_000 - 10 * 60_000;

function credenciales(): CredencialesWhatsapp | null {
  const token = import.meta.env.WHATSAPP_TOKEN;
  const phoneNumberId = import.meta.env.WHATSAPP_PHONE_NUMBER_ID;
  // 4 s como mucho: el botón del tablero espera esta respuesta.
  return token && phoneNumberId ? { token, phoneNumberId, timeoutMs: 4000 } : null;
}

interface PedidoAvisable {
  id: string;
  numero: number;
  cliente_nombre: string;
  tipo_entrega: 'delivery' | 'retiro';
}

export async function avisarEstadoPorWhatsapp(db: Db, pedido: PedidoAvisable, estado: EstadoPedido, motivo?: string | null): Promise<void> {
  const cred = credenciales();
  if (!cred) return;
  const aviso = avisoEstado(estado, { numero: pedido.numero, nombre: pedido.cliente_nombre, tipoEntrega: pedido.tipo_entrega }, motivo);
  if (!aviso) return;

  // El chat del cliente es el que le escribió al bot por este pedido.
  const { data: chat } = await db
    .from('whatsapp_mensajes')
    .select('wa_id')
    .eq('pedido_id', pedido.id)
    .eq('direccion', 'entrante')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!chat) return;

  // Mismo aviso ya mandado (doble toque, dos celulares a la vez, o el estado no cambió): no se repite.
  const { count: yaMandado } = await db
    .from('whatsapp_mensajes')
    .select('id', { count: 'exact', head: true })
    .eq('pedido_id', pedido.id)
    .eq('direccion', 'saliente')
    .eq('texto', aviso.texto)
    .neq('estado', 'fallido');
  if (yaMandado) return;

  const { data: ultimo } = await db
    .from('whatsapp_mensajes')
    .select('created_at')
    .eq('wa_id', chat.wa_id)
    .eq('direccion', 'entrante')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  const ventanaAbierta = !!ultimo && Date.now() - new Date(ultimo.created_at).getTime() < VENTANA_MS;
  if (!ventanaAbierta && !aviso.plantilla) return;

  const fila = { direccion: 'saliente', wa_id: chat.wa_id, pedido_id: pedido.id, texto: aviso.texto, tipo: ventanaAbierta ? 'text' : 'template' };
  try {
    const wamid = ventanaAbierta
      ? await enviarTexto(cred, chat.wa_id, aviso.texto)
      : await enviarPlantilla(cred, chat.wa_id, aviso.plantilla!.nombre, aviso.plantilla!.parametros);
    await db.from('whatsapp_mensajes').insert({ ...fila, wa_message_id: wamid, estado: 'enviado' });
  } catch (error) {
    console.error('Aviso por WhatsApp', error);
    await db
      .from('whatsapp_mensajes')
      .insert({ ...fila, wa_message_id: `fallido-${crypto.randomUUID()}`, estado: 'fallido', error: String((error as Error).message ?? error).slice(0, 500) });
  }
}
