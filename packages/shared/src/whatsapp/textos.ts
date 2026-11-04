import type { EstadoPago, EstadoPedido, MetodoPago, TipoEntrega } from '../constantes';
import { DIAS, NOMBRE_DIA, type Horarios } from '../horarios';

// Todo lo que dice el bot, en un solo lugar. Frases cortas, rioplatense y una
// sola idea por mensaje: si no se entiende en 3 segundos, está mal.

export interface NegocioBot {
  /** Nombre de la marca ("Burrimax"). */
  nombre: string;
  /** "https://burrimax.vercel.app" */
  sitio: string;
  /** "Abierto · cierra 23:30", "Abrimos mañana a las 19:30"… */
  textoApertura: string;
  horarios: Horarios;
  tamanos: { nombre: string; precioBase: number }[];
  transferencia: { alias: string | null; cvu: string | null; titular: string | null };
  avisoCeliacos: string | null;
  /** Número de Max (solo dígitos) para hablar con una persona. */
  whatsappAtencion: string | null;
}

export interface PedidoBot {
  numero: number;
  nombre: string;
  estado: EstadoPedido;
  estadoPago: EstadoPago;
  metodoPago: MetodoPago;
  tipoEntrega: TipoEntrega;
  total: number;
  pagaCon: number | null;
}

const formato = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });
/** 11500 → "$11.500" */
export const pesos = (monto: number) => `$${formato.format(monto)}`;
/** 12 → "#0012" */
export const numeroPedido = (numero: number) => `#${String(numero).padStart(4, '0')}`;
const primerNombre = (nombre: string) => nombre.trim().split(/\s+/)[0] ?? '';
const mayuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Link que abre un chat de WhatsApp con ese número. */
export const linkChat = (numero: string, texto?: string) =>
  `https://api.whatsapp.com/send?phone=${numero.replace(/\D/g, '')}${texto ? `&text=${encodeURIComponent(texto)}` : ''}`;

// ─── Horarios ────────────────────────────────────────────────

/** "Lunes a jueves: 19:30 a 23:30 · Domingo: cerrado". null si no hay horarios cargados. */
export function textoHorarios(horarios: Horarios): string | null {
  const claves = DIAS.map((d) => horarios[d].map((t) => `${t.desde} a ${t.hasta}`).join(' y ') || 'cerrado');
  if (claves.every((c) => c === 'cerrado')) return null;
  const lineas: string[] = [];
  for (let i = 0; i < DIAS.length; ) {
    let j = i;
    while (j + 1 < DIAS.length && claves[j + 1] === claves[i]) j++;
    const desde = NOMBRE_DIA[DIAS[i]!];
    const dias = j === i ? desde : j === i + 1 ? `${desde} y ${NOMBRE_DIA[DIAS[j]!]}` : `${desde} a ${NOMBRE_DIA[DIAS[j]!]}`;
    lineas.push(`${mayuscula(dias)}: ${claves[i]}`);
    i = j + 1;
  }
  return lineas.join('\n');
}

// ─── Preguntas frecuentes ────────────────────────────────────

export function respuestaHorarios(n: NegocioBot): string {
  const semana = textoHorarios(n.horarios);
  return `🕐 ${n.textoApertura}.${semana ? `\n\n${semana}` : ''}\n\nPedí cuando quieras en ${n.sitio}`;
}

export function respuestaEnvios(n: NegocioBot): string {
  return `🛵 Te lo llevamos a tu casa y el precio es el mismo: no se suma nada al pedido.\nTambién podés retirarlo en el local.\n\nPedí en ${n.sitio}`;
}

export function respuestaPrecios(n: NegocioBot): string {
  const lista = n.tamanos.map((t) => `🌯 Burrito ${t.nombre.toLowerCase()}: ${pesos(t.precioBase)}`).join('\n');
  return `${lista}\n\nTodos vienen con papas fritas 🍟\nArmalo a tu gusto en ${n.sitio}`;
}

export function datosTransferencia(n: NegocioBot): string | null {
  const { alias, cvu, titular } = n.transferencia;
  if (!alias && !cvu) return null;
  return [alias && `Alias: *${alias}*`, cvu && `CVU: *${cvu}*`, titular && `Titular: ${titular}`].filter(Boolean).join('\n');
}

export function respuestaTransferencia(n: NegocioBot): string {
  const datos = datosTransferencia(n);
  return datos
    ? `💸 Para transferir:\n\n${datos}\n\nDespués mandame por acá la foto del comprobante 📸`
    : 'Cuando hagas tu pedido con transferencia, te paso los datos para pagar.';
}

export function respuestaCeliacos(n: NegocioBot): string {
  return n.avisoCeliacos?.trim()
    ? n.avisoCeliacos.trim()
    : `Tenemos tortilla de maíz sin TACC. Las salsas todavía no están confirmadas: preguntale a Max antes de pedir.${n.whatsappAtencion ? `\n👉 ${linkChat(n.whatsappAtencion)}` : ''}`;
}

export function respuestaHablar(n: NegocioBot): string {
  return n.whatsappAtencion
    ? `Escribile a Max acá 👉 ${linkChat(n.whatsappAtencion)}\nEstá cocinando: puede tardar un poquito en contestar 🙏`
    : 'Ya le avisé a Max: te escribe apenas pueda 🙏';
}

export function saludo(n: NegocioBot, nombre: string | null): string {
  const hola = nombre ? `¡Hola, ${primerNombre(nombre)}!` : '¡Hola!';
  return `${hola} Soy el asistente de ${n.nombre} 🌯\nPara pedir, armá tu burrito en ${n.sitio}\n\n¿Te ayudo con algo más?`;
}

export const NO_ENTENDI = 'No te entendí 🙈 Tocá una opción:';
export const SOLO_TEXTO = 'Por ahora leo solo mensajes de texto y fotos de comprobantes 🙈 Tocá una opción:';
export const DE_NADA = '¡De nada! 🙌';

// ─── Pedido que llega por WhatsApp ───────────────────────────

/** Respuesta al mensaje del pedido según cómo paga y en qué estado está. */
export function respuestaPedido(p: PedidoBot, n: NegocioBot, linkPago: string | null = null): string {
  const num = numeroPedido(p.numero);
  const nombre = primerNombre(p.nombre);
  if (p.estado === 'cancelado') return `Tu pedido ${num} está cancelado. Si querés, armá uno nuevo en ${n.sitio}`;
  if (p.estado !== 'pendiente_pago' && p.estado !== 'confirmado') return estadoActual(p);

  if (p.estadoPago === 'aprobado') return `¡Recibido, ${nombre}! Tu pedido ${num} ya está pago y confirmado ✅\nTe aviso por acá cuando esté en la plancha.`;

  if (p.metodoPago === 'efectivo') {
    const cuando = p.tipoEntrega === 'delivery' ? 'cuando te llegue' : 'cuando lo retires';
    const cambio = p.pagaCon && p.pagaCon > p.total ? ` Llevamos cambio de ${pesos(p.pagaCon)}.` : '';
    return `¡Recibido, ${nombre}! 🙌 Tu pedido ${num} está confirmado.\nPagás ${pesos(p.total)} en efectivo ${cuando}.${cambio}\nTe aviso por acá cuando esté en la plancha.`;
  }

  if (p.metodoPago === 'transferencia') {
    const datos = datosTransferencia(n);
    if (!datos) return `¡Gracias, ${nombre}! Recibimos tu pedido ${num} (${pesos(p.total)}). En un ratito Max te pasa los datos para transferir.`;
    return `¡Gracias, ${nombre}! Para confirmar tu pedido ${num} transferí *${pesos(p.total)}* a:\n\n${datos}\n\nDespués mandame por acá la *foto del comprobante* 📸`;
  }

  // Mercado Pago (o Stripe) sin pagar todavía.
  return linkPago
    ? `Tu pedido ${num} está guardado, pero todavía no está pago. Pagalo con Mercado Pago acá 👇\n${linkPago}`
    : `Tu pedido ${num} todavía no está pago. Max te escribe para ver cómo lo pagás 🙌`;
}

/** Cuando el pedido no está en la base (la web no lo pudo guardar o el número no coincide). */
export const PEDIDO_SIN_ENCONTRAR = '¡Recibimos tu pedido! 🙌 Max lo revisa y te confirma por acá en un ratito.';

/** "¿Cómo va mi pedido?" */
export function estadoActual(p: Pick<PedidoBot, 'numero' | 'estado' | 'tipoEntrega'>): string {
  const num = numeroPedido(p.numero);
  switch (p.estado) {
    case 'pendiente_pago':
      return `Tu pedido ${num} está esperando el pago.`;
    case 'confirmado':
      return `Tu pedido ${num} está confirmado y en la fila para la plancha 🌯`;
    case 'en_preparacion':
      return `Tu pedido ${num} está en la plancha 🔥`;
    case 'listo':
      return p.tipoEntrega === 'retiro' ? `Tu pedido ${num} está listo: ya podés pasar a retirarlo 🌯` : `Tu pedido ${num} está listo y sale en un ratito 🛵`;
    case 'en_camino':
      return `Tu pedido ${num} va en camino 🛵 Llega en un ratito.`;
    case 'entregado':
      return `Tu pedido ${num} ya fue entregado. ¡Que lo disfrutes! 🌯`;
    case 'cancelado':
      return `Tu pedido ${num} está cancelado.`;
  }
}

// ─── Avisos de estado (los dispara el admin) ─────────────────
// El texto libre (dentro de las 24 h) y la plantilla dicen lo mismo. Las
// plantillas se mandan a aprobar a Meta con estos nombres y textos (ver
// docs/Guías/WhatsApp - pasos de Max.md).

export interface AvisoEstado {
  texto: string;
  /** null: fuera de las 24 h no se avisa (no vale la pena pagar el mensaje). */
  plantilla: { nombre: string; parametros: string[] } | null;
}

export function avisoEstado(
  estado: EstadoPedido,
  p: Pick<PedidoBot, 'numero' | 'nombre' | 'tipoEntrega'>,
  motivo?: string | null,
): AvisoEstado | null {
  const nombre = primerNombre(p.nombre) || 'hola';
  const num = numeroPedido(p.numero);
  switch (estado) {
    case 'confirmado':
      return {
        texto: `Hola ${nombre}, tu pedido ${num} está confirmado ✅. Ya lo ponemos en la plancha 🌯`,
        plantilla: { nombre: 'pedido_confirmado', parametros: [nombre, num] },
      };
    case 'en_preparacion':
      return {
        texto: `Hola ${nombre}, tu pedido ${num} ya está en la plancha 🔥. Te avisamos cuando esté listo.`,
        plantilla: { nombre: 'pedido_en_preparacion', parametros: [nombre, num] },
      };
    case 'listo':
      // En delivery el próximo aviso es "en camino".
      return p.tipoEntrega === 'retiro'
        ? {
            texto: `Hola ${nombre}, tu pedido ${num} está listo 🌯. Ya podés pasar a retirarlo.`,
            plantilla: { nombre: 'pedido_listo_retiro', parametros: [nombre, num] },
          }
        : null;
    case 'en_camino':
      return {
        texto: `Hola ${nombre}, tu pedido ${num} salió y va en camino 🛵. Llega en un ratito.`,
        plantilla: { nombre: 'pedido_en_camino', parametros: [nombre, num] },
      };
    case 'entregado':
      return { texto: `¡Gracias por tu pedido, ${nombre}! Que lo disfrutes 🌯`, plantilla: null };
    case 'cancelado': {
      const porque = motivo?.trim() || 'sin detalle';
      return {
        texto: `Hola ${nombre}, tu pedido ${num} se canceló. Motivo: ${porque}. Si tenés dudas, respondé este mensaje.`,
        plantilla: { nombre: 'pedido_cancelado', parametros: [nombre, num, porque] },
      };
    }
    default:
      return null;
  }
}

// ─── Comprobantes de transferencia ───────────────────────────

export const SIN_PEDIDO_HOY = 'No encuentro un pedido tuyo de hoy 🤔 Si ya pediste, mandame el número (por ejemplo #0012).';

export const comprobante = {
  archivoRecibido: 'Recibí tu archivo 📎 Max lo mira en un ratito.',
  soloFotoOPdf: 'Mandame el comprobante como foto o PDF, porfa 🙏',
  pedidoCancelado: (numero: number) => `Tu pedido ${numeroPedido(numero)} figura cancelado. Max lo revisa y te escribe 🙏`,
  recibido: (numero: number) => `¡Gracias! Recibí tu comprobante 📸 Max lo revisa y te confirmo el pedido ${numeroPedido(numero)} por acá.`,
  coincide: (numero: number, monto: number) =>
    `¡Gracias! Recibí tu comprobante de *${pesos(monto)}* ✅ Max confirma que llegó y arrancamos con tu pedido ${numeroPedido(numero)}.`,
  revisar: (motivo: string) => `Recibí tu comprobante, pero ${motivo}. Max lo revisa y te escribe 🙏`,
  sinPedido: 'Recibí tu archivo 📎 ¿De qué pedido es? Mandame el número, por ejemplo #0012.',
  yaPago: (numero: number) => `Tu pedido ${numeroPedido(numero)} ya figura como pago ✅ ¡Gracias!`,
};
