import type { Database, Json } from '@burritos/shared';
import {
  comprobante,
  DE_NADA,
  descargarMedia,
  detectarIntencion,
  enviarBotones,
  enviarTexto,
  estadoActual,
  evaluarComprobante,
  linkChat,
  mismoTelefono,
  NO_ENTENDI,
  numeroEnTexto,
  numeroPedido,
  PEDIDO_SIN_ENCONTRAR,
  pesos,
  referenciaPedido,
  respuestaCeliacos,
  respuestaEnvios,
  respuestaHablar,
  respuestaHorarios,
  respuestaPedido,
  respuestaPrecios,
  respuestaTransferencia,
  saludo,
  SIN_PEDIDO_HOY,
  SOLO_TEXTO,
  type Boton,
  type CredencialesWhatsapp,
  type EstadoEnvio,
  type MensajeEntrante,
  type NegocioBot,
  type PedidoBot,
} from '@burritos/shared/whatsapp';
import type { SupabaseClient } from '@supabase/supabase-js';
import { avisarAlLocal, type AvisoLocal } from '../avisosPush';
import type { DatosTienda } from '../catalogo.server';
import { MARCA } from '../marca';
import { crearCobro, linkDePreferencia } from '../pagos/mercadopago';
import { leerComprobante } from './leerComprobante';

// El bot de WhatsApp: por cada mensaje que llega, busca el pedido, decide qué
// contestar y lo deja registrado. Nunca crea pedidos ni marca nada como pagado.

type Db = SupabaseClient<Database>;

export function credencialesWhatsapp(): CredencialesWhatsapp | null {
  const token = import.meta.env.WHATSAPP_TOKEN;
  const phoneNumberId = import.meta.env.WHATSAPP_PHONE_NUMBER_ID;
  return token && phoneNumberId ? { token, phoneNumberId } : null;
}

export function negocioParaBot(datos: DatosTienda, sitio: string): NegocioBot {
  return {
    nombre: MARCA.nombre,
    sitio,
    textoApertura: datos.config.textoApertura,
    horarios: datos.config.horarios,
    zonas: datos.catalogo.zonasEnvio.map((z) => ({ nombre: z.nombre, costo: z.costo })),
    tamanos: datos.catalogo.tamanos.map((t) => ({ nombre: t.nombre, precioBase: t.precioBase })),
    transferencia: datos.config.transferencia,
    avisoCeliacos: datos.config.avisoCeliacos,
    whatsappAtencion: datos.config.whatsappAtencion,
  };
}

const BOTONES: Boton[] = [
  { id: 'horarios', titulo: 'Horarios' },
  { id: 'envios', titulo: 'Envíos' },
  { id: 'hablar', titulo: 'Hablar con Max' },
];

/** Más de esto por minuto y el bot deja de contestar ese minuto (cada respuesta se paga después de las 1.000 gratis). */
const MAX_POR_MINUTO = 6;
const COLUMNAS_PEDIDO =
  'id, numero, token_seguimiento, cliente_nombre, cliente_telefono, cliente_email, estado, estado_pago, metodo_pago, tipo_entrega, total, paga_con, costo_envio, pago_proveedor_id';
/** Fotos o PDF por número cada 10 minutos (cada comprobante puede leerse con IA). */
const MAX_ARCHIVOS = 5;
/** Una reserva más vieja que esto se considera cortada (timeout o caída) y se puede retomar. */
const RESERVA_VENCE_MS = 3 * 60_000;

type FilaPedido = Pick<
  Database['public']['Tables']['pedidos']['Row'],
  | 'id'
  | 'numero'
  | 'token_seguimiento'
  | 'cliente_nombre'
  | 'cliente_telefono'
  | 'cliente_email'
  | 'estado'
  | 'estado_pago'
  | 'metodo_pago'
  | 'tipo_entrega'
  | 'total'
  | 'paga_con'
  | 'costo_envio'
  | 'pago_proveedor_id'
>;

interface Respuesta {
  texto: string;
  botones?: Boton[];
  pedidoId?: string | null;
  aviso?: AvisoLocal;
}

const aBot = (p: FilaPedido): PedidoBot => ({
  numero: p.numero,
  nombre: p.cliente_nombre,
  estado: p.estado,
  estadoPago: p.estado_pago,
  metodoPago: p.metodo_pago,
  tipoEntrega: p.tipo_entrega,
  total: p.total,
  pagaCon: p.paga_con,
});

// ─── Entrada ─────────────────────────────────────────────────

/**
 * Procesa un mensaje. Idempotente: el mismo wamid nunca se contesta dos veces.
 * Si algo falla, tira el error para que el webhook responda 500 y Meta reintente.
 */
export async function procesarMensaje(db: Db, cred: CredencialesWhatsapp, m: MensajeEntrante, negocio: NegocioBot): Promise<void> {
  if (!/^\d{8,15}$/.test(m.waId)) return;

  const { error: errorAlta } = await db.from('whatsapp_mensajes').upsert(
    {
      wa_message_id: m.id,
      direccion: 'entrante',
      wa_id: m.waId,
      nombre_perfil: m.nombrePerfil,
      tipo: m.tipo,
      texto: m.texto,
      payload: m.crudo as Json,
    },
    { onConflict: 'wa_message_id', ignoreDuplicates: true },
  );
  if (errorAlta) throw errorAlta;

  // Se "reserva" antes de contestar: si Meta reintenta mientras tanto, no sale dos
  // veces. Si la función se cortó a mitad de camino, la reserva vence y se retoma.
  const ahora = new Date();
  const vencida = new Date(ahora.getTime() - RESERVA_VENCE_MS).toISOString();
  const { data: reservado, error: errorReserva } = await db
    .from('whatsapp_mensajes')
    .update({ procesado: true, procesando_desde: ahora.toISOString() })
    .eq('wa_message_id', m.id)
    .or(`procesado.eq.false,procesando_desde.lt."${vencida}"`)
    .select('id')
    .maybeSingle();
  if (errorReserva) throw errorReserva;
  if (!reservado) return; // ya contestado (o contestándose)

  try {
    const respuesta = (await demasiadosMensajes(db, m)) ? null : await decidir(db, cred, m, reservado.id, negocio);
    if (respuesta?.pedidoId) await db.from('whatsapp_mensajes').update({ pedido_id: respuesta.pedidoId }).eq('id', reservado.id);
    if (respuesta) await responder(db, cred, m.waId, respuesta);
    await db.from('whatsapp_mensajes').update({ procesando_desde: null }).eq('id', reservado.id);
    if (respuesta?.aviso) await avisarAlLocal(respuesta.aviso);
  } catch (error) {
    // Se libera para que el reintento de Meta lo vuelva a intentar.
    await db.from('whatsapp_mensajes').update({ procesado: false, procesando_desde: null }).eq('id', reservado.id);
    throw error;
  }
}

/** Texto: más de 6 por minuto. Fotos y PDF llevan su propio límite, así un comprobante no se pierde entre mensajes. */
async function demasiadosMensajes(db: Db, m: MensajeEntrante): Promise<boolean> {
  const esArchivo = m.tipo === 'image' || m.tipo === 'document';
  let consulta = db
    .from('whatsapp_mensajes')
    .select('id', { count: 'exact', head: true })
    .eq('wa_id', m.waId)
    .eq('direccion', 'entrante')
    .gte('created_at', new Date(Date.now() - (esArchivo ? 10 * 60_000 : 60_000)).toISOString());
  consulta = esArchivo ? consulta.in('tipo', ['image', 'document']) : consulta.not('tipo', 'in', '(image,document)');
  const { count } = await consulta;
  return (count ?? 0) > (esArchivo ? MAX_ARCHIVOS : MAX_POR_MINUTO);
}

// ─── Qué contestar ───────────────────────────────────────────

async function decidir(db: Db, cred: CredencialesWhatsapp, m: MensajeEntrante, filaId: string, negocio: NegocioBot): Promise<Respuesta | null> {
  if (m.tipo === 'reaction') return null; // un 👍 a un mensaje: no hace falta contestar
  if (m.tipo === 'image' || m.tipo === 'document') return archivo(db, cred, m, filaId, negocio);
  if (!['text', 'interactive', 'button'].includes(m.tipo)) return { texto: SOLO_TEXTO, botones: BOTONES };

  const nombre = m.nombrePerfil;
  switch (detectarIntencion(m.texto, m.botonId)) {
    case 'pedido':
      return pedidoQueLlega(db, cred, m, negocio);
    case 'estado_pedido': {
      const pedido = await ultimoPedidoDelChat(db, m.waId);
      return pedido
        ? { texto: estadoActual(aBot(pedido)), pedidoId: pedido.id }
        : { texto: SIN_PEDIDO_HOY };
    }
    case 'hablar':
      return {
        texto: respuestaHablar(negocio),
        aviso: {
          titulo: '🙋 Un cliente quiere hablar con vos',
          cuerpo: `${nombre ?? `+${m.waId}`}: "${(m.texto ?? '').slice(0, 80)}". Tocá para abrir el chat.`,
          etiqueta: `hablar-${m.waId}`,
          url: linkChat(m.waId),
        },
      };
    case 'horarios':
      return { texto: respuestaHorarios(negocio) };
    case 'envios':
      return { texto: respuestaEnvios(negocio) };
    case 'precios':
      return { texto: respuestaPrecios(negocio) };
    case 'transferencia':
      return { texto: respuestaTransferencia(negocio) };
    case 'celiacos':
      return { texto: respuestaCeliacos(negocio) };
    case 'gracias':
      return { texto: DE_NADA };
    case 'saludo':
      return { texto: saludo(negocio, nombre), botones: BOTONES };
    case 'desconocida':
      return { texto: NO_ENTENDI, botones: BOTONES };
  }
}

/** El mensaje que arma el checkout ("te mando mi pedido #0012 … Seguimiento: <link>") o solo "#0012". */
async function pedidoQueLlega(db: Db, cred: CredencialesWhatsapp, m: MensajeEntrante, negocio: NegocioBot): Promise<Respuesta> {
  const pedido = await buscarPedido(db, m);
  if (!pedido) {
    return {
      texto: PEDIDO_SIN_ENCONTRAR,
      aviso: {
        titulo: '📲 Pedido por WhatsApp para revisar',
        cuerpo: `${m.nombrePerfil ?? `+${m.waId}`} mandó un pedido que no encuentro en la web. Tocá para abrir el chat.`,
        etiqueta: `pedido-wa-${m.waId}`,
        url: linkChat(m.waId),
      },
    };
  }

  // Mandó primero la foto del comprobante y después el número: se procesa ahora.
  if (pedido.metodo_pago === 'transferencia' && pedido.estado_pago === 'pendiente') {
    const pendiente = await archivoSinPedido(db, m.waId);
    if (pendiente) return comprobanteDePedido(db, cred, pendiente, pedido, negocio);
  }

  let linkPago: string | null = null;
  if (pedido.metodo_pago === 'mercadopago' && pedido.estado_pago !== 'aprobado' && pedido.estado === 'pendiente_pago') {
    linkPago = await linkDePago(db, pedido, negocio.sitio);
  }
  const sinDatos = pedido.metodo_pago === 'transferencia' && !negocio.transferencia.alias && !negocio.transferencia.cvu;
  return {
    texto: respuestaPedido(aBot(pedido), negocio, linkPago),
    pedidoId: pedido.id,
    aviso:
      sinDatos || (pedido.metodo_pago === 'mercadopago' && !linkPago && pedido.estado_pago !== 'aprobado')
        ? {
            titulo: `💬 Pedido ${numeroPedido(pedido.numero)}: falta cómo paga`,
            cuerpo: `${pedido.cliente_nombre} · ${pesos(pedido.total)}. Tocá para abrir el chat.`,
            etiqueta: `pago-${pedido.numero}`,
            url: linkChat(m.waId),
          }
        : undefined,
  };
}

/** Foto o PDF: si hay un pedido por transferencia esperando el pago, es el comprobante. */
async function archivo(db: Db, cred: CredencialesWhatsapp, m: MensajeEntrante, filaId: string, negocio: NegocioBot): Promise<Respuesta> {
  const porNumero = numeroEnTexto(m.texto);
  const pedido = porNumero ? await pedidoPorNumero(db, porNumero, m.waId) : await ultimoPedidoDelChat(db, m.waId);
  if (!pedido) return { texto: comprobante.sinPedido };
  if (pedido.estado_pago === 'aprobado') return { texto: comprobante.yaPago(pedido.numero), pedidoId: pedido.id };
  if (pedido.estado === 'cancelado') {
    return {
      texto: comprobante.pedidoCancelado(pedido.numero),
      pedidoId: pedido.id,
      aviso: {
        titulo: `📎 Archivo de un pedido cancelado (${numeroPedido(pedido.numero)})`,
        cuerpo: `${pedido.cliente_nombre} mandó un archivo por WhatsApp. Tocá para abrir el chat.`,
        etiqueta: `archivo-${pedido.numero}`,
        url: linkChat(m.waId),
      },
    };
  }
  if (pedido.metodo_pago !== 'transferencia' || !m.media) {
    return {
      texto: comprobante.archivoRecibido,
      pedidoId: pedido.id,
      aviso: {
        titulo: `📎 Archivo del pedido ${numeroPedido(pedido.numero)}`,
        cuerpo: `${pedido.cliente_nombre} mandó un archivo por WhatsApp. Tocá para abrir el chat.`,
        etiqueta: `archivo-${pedido.numero}`,
        url: linkChat(m.waId),
      },
    };
  }
  return comprobanteDePedido(db, cred, { filaId, wamid: m.id, mediaId: m.media.id }, pedido, negocio);
}

interface ArchivoPendiente {
  filaId: string;
  wamid: string;
  mediaId: string;
}

const MIME_COMPROBANTE: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf' };

/** Guarda el comprobante (privado) y, si hay IA, lo pre-aprueba. El pago lo confirma Max en el admin. */
async function comprobanteDePedido(db: Db, cred: CredencialesWhatsapp, a: ArchivoPendiente, pedido: FilaPedido, negocio: NegocioBot): Promise<Respuesta> {
  const { datos, mimeType } = await descargarMedia(cred, a.mediaId);
  const tipo = mimeType.split(';')[0]!.trim().toLowerCase();
  const extension = MIME_COMPROBANTE[tipo];
  if (!extension) return { texto: comprobante.soloFotoOPdf, pedidoId: pedido.id };

  const ruta = `${pedido.id}/${a.wamid.replace(/[^A-Za-z0-9_-]/g, '')}.${extension}`;
  const { error: errorSubida } = await db.storage.from('comprobantes').upload(ruta, datos, { contentType: tipo, upsert: true });
  if (errorSubida) throw errorSubida;

  let texto = comprobante.recibido(pedido.numero);
  let analisis: Record<string, unknown> | null = null;
  const leido = await leerComprobante(datos, tipo);
  if (leido) {
    const usado = leido.numeroOperacion ? await operacionUsadaEnOtroPedido(db, leido.numeroOperacion, pedido.id) : false;
    const evaluacion = evaluarComprobante(leido, pedido.total, negocio.transferencia, usado);
    analisis = { ...leido, ...evaluacion };
    texto = evaluacion.coincide ? comprobante.coincide(pedido.numero, leido.monto ?? pedido.total) : comprobante.revisar(evaluacion.motivo);
  }

  const { error } = await db
    .from('whatsapp_mensajes')
    .update({ media_path: ruta, analisis: analisis as Json, pedido_id: pedido.id })
    .eq('id', a.filaId);
  if (error) throw error;

  const estado = analisis ? (analisis.coincide ? '✅ coincide' : '⚠️ revisar') : 'para revisar';
  return {
    texto,
    pedidoId: pedido.id,
    aviso: {
      titulo: `💸 Comprobante ${numeroPedido(pedido.numero)} · ${estado}`,
      cuerpo: `${pedido.cliente_nombre} · pedido de ${pesos(pedido.total)}${leido?.monto != null ? ` · el comprobante dice ${pesos(leido.monto)}` : ''}. Confirmalo con "Llegó la transferencia".`,
      etiqueta: `comprobante-${pedido.numero}`,
      url: '/',
    },
  };
}

// ─── Búsquedas ───────────────────────────────────────────────

async function buscarPedido(db: Db, m: MensajeEntrante): Promise<FilaPedido | null> {
  // 1. El link de seguimiento (id + token): lo más seguro.
  const ref = referenciaPedido(m.texto);
  if (ref) {
    const { data } = await db.from('pedidos').select(COLUMNAS_PEDIDO).eq('id', ref.id).eq('token_seguimiento', ref.token).maybeSingle();
    if (data) return data;
  }
  // 2. "#0012" + el mismo teléfono que dejó en el pedido.
  const numero = numeroEnTexto(m.texto);
  return numero ? pedidoPorNumero(db, numero, m.waId) : null;
}

async function pedidoPorNumero(db: Db, numero: number, waId: string): Promise<FilaPedido | null> {
  const { data } = await db.from('pedidos').select(COLUMNAS_PEDIDO).eq('numero', numero).maybeSingle();
  if (data && mismoTelefono(waId, data.cliente_telefono)) return data;
  // También vale si ese chat ya estaba vinculado a ese pedido.
  if (data) {
    const { count } = await db
      .from('whatsapp_mensajes')
      .select('id', { count: 'exact', head: true })
      .eq('wa_id', waId)
      .eq('pedido_id', data.id);
    if (count) return data;
  }
  return null;
}

/** El último pedido que se habló por este chat (últimas 48 h). */
async function ultimoPedidoDelChat(db: Db, waId: string): Promise<FilaPedido | null> {
  const { data: fila } = await db
    .from('whatsapp_mensajes')
    .select('pedido_id')
    .eq('wa_id', waId)
    .not('pedido_id', 'is', null)
    .gte('created_at', new Date(Date.now() - 48 * 3600_000).toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!fila?.pedido_id) return null;
  const { data } = await db.from('pedidos').select(COLUMNAS_PEDIDO).eq('id', fila.pedido_id).maybeSingle();
  return data;
}

/** Una foto o PDF de las últimas 2 h que llegó sin saber de qué pedido era. */
async function archivoSinPedido(db: Db, waId: string): Promise<ArchivoPendiente | null> {
  const { data } = await db
    .from('whatsapp_mensajes')
    .select('id, wa_message_id, payload')
    .eq('wa_id', waId)
    .eq('direccion', 'entrante')
    .in('tipo', ['image', 'document'])
    .is('pedido_id', null)
    .is('media_path', null)
    .gte('created_at', new Date(Date.now() - 2 * 3600_000).toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  const payload = data?.payload as { image?: { id?: string }; document?: { id?: string } } | null | undefined;
  const mediaId = payload?.image?.id ?? payload?.document?.id;
  return data && mediaId ? { filaId: data.id, wamid: data.wa_message_id, mediaId } : null;
}

async function operacionUsadaEnOtroPedido(db: Db, numeroOperacion: string, pedidoId: string): Promise<boolean> {
  const { count } = await db
    .from('whatsapp_mensajes')
    .select('id', { count: 'exact', head: true })
    .eq('analisis->>numeroOperacion', numeroOperacion)
    .neq('pedido_id', pedidoId);
  return !!count;
}

/**
 * Link de Mercado Pago del pedido: el que ya tenía (si sigue vigente) o uno nuevo
 * con lo que quedó guardado (el precio ya lo calculó el servidor). Nunca dos links vivos.
 */
async function linkDePago(db: Db, pedido: FilaPedido, sitio: string): Promise<string | null> {
  if (!import.meta.env.MP_ACCESS_TOKEN) return null;
  try {
    const existente = pedido.pago_proveedor_id ? await linkDePreferencia(pedido.pago_proveedor_id) : null;
    if (existente) return existente;
    const { data: items, error } = await db
      .from('pedido_items')
      .select('tipo, producto_id, tamano_id, nombre, cantidad, precio_unitario')
      .eq('pedido_id', pedido.id);
    if (error || !items?.length) return null;
    const cobro = await crearCobro({
      pedidoId: pedido.id,
      numero: pedido.numero,
      urlSeguimiento: `${sitio}/pedido/${pedido.id}?t=${pedido.token_seguimiento}&nuevo=1`,
      sitio,
      items: items.map((i) => ({ ...i, detalle: {}, ingredientes: [] })),
      costoEnvio: pedido.costo_envio,
      email: pedido.cliente_email,
    });
    await db.from('pedidos').update({ pago_proveedor_id: cobro.preferenciaId }).eq('id', pedido.id);
    return cobro.redirectUrl;
  } catch (error) {
    console.error('Link de Mercado Pago por WhatsApp', error);
    return null;
  }
}

// ─── Salida ──────────────────────────────────────────────────

async function responder(db: Db, cred: CredencialesWhatsapp, waId: string, r: Respuesta): Promise<void> {
  const fila = { direccion: 'saliente', wa_id: waId, pedido_id: r.pedidoId ?? null, tipo: r.botones ? 'interactive' : 'text', texto: r.texto };
  try {
    const wamid = r.botones ? await enviarBotones(cred, waId, r.texto, r.botones) : await enviarTexto(cred, waId, r.texto);
    await db.from('whatsapp_mensajes').insert({ ...fila, wa_message_id: wamid, estado: 'enviado' });
  } catch (error) {
    // No se reintenta: el cliente ya escribió y un reintento podría duplicar la respuesta.
    console.error('WhatsApp: no se pudo responder', error);
    await db
      .from('whatsapp_mensajes')
      .insert({ ...fila, wa_message_id: `fallido-${crypto.randomUUID()}`, estado: 'fallido', error: String((error as Error).message ?? error).slice(0, 500) });
  }
}

const ORDEN_ESTADO: Record<EstadoEnvio['estado'], number> = { enviado: 1, entregado: 2, leido: 3, fallido: 4 };

/** "Enviado → entregado → leído" (o "fallido") de lo que mandó el bot. Nunca vuelve para atrás. */
export async function actualizarEstados(db: Db, estados: EstadoEnvio[]): Promise<void> {
  for (const e of estados) {
    const { data: actual } = await db.from('whatsapp_mensajes').select('id, estado').eq('wa_message_id', e.wamid).eq('direccion', 'saliente').maybeSingle();
    if (!actual) continue;
    const previo = ORDEN_ESTADO[actual.estado as EstadoEnvio['estado']] ?? 0;
    if (ORDEN_ESTADO[e.estado] <= previo) continue;
    await db.from('whatsapp_mensajes').update({ estado: e.estado, error: e.error }).eq('id', actual.id);
  }
}
