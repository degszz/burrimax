// Qué quiere el cliente que escribe al bot. Palabras clave simples y
// predecibles (sin IA): si no entiende, el bot ofrece botones.

export const BOTONES_MENU = ['horarios', 'envios', 'precios', 'hablar'] as const;

export type Intencion =
  | 'pedido'
  | 'hablar'
  | 'estado_pedido'
  | 'transferencia'
  | 'celiacos'
  | 'horarios'
  | 'envios'
  | 'precios'
  | 'saludo'
  | 'gracias'
  | 'desconocida';

/** Minúsculas, sin tildes ni espacios de más (para comparar sin errores de tipeo). */
export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** El link de seguimiento que lleva el mensaje del checkout: /pedido/<uuid>?t=<token>. */
export function referenciaPedido(texto: string | null): { id: string; token: string } | null {
  const m = texto?.match(/\/pedido\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\?t=([0-9a-f]{16,64})/i);
  return m ? { id: m[1]!.toLowerCase(), token: m[2]!.toLowerCase() } : null;
}

/** "#0012" → 12. */
export function numeroEnTexto(texto: string | null): number | null {
  const m = texto?.match(/#\s?0*(\d{1,7})\b/);
  const n = m ? Number(m[1]) : NaN;
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

const REGLAS: [Exclude<Intencion, 'pedido' | 'desconocida'>, RegExp][] = [
  ['hablar', /\b(hablar con|quiero hablar|una persona|persona real|humano|alguien que|atencion al cliente|encargad[oa]|dueno|llamame|llamar)\b/],
  ['estado_pedido', /\b(mi pedido|cuanto (falta|tarda|demora)|demora|ya (sale|salio|viene)|donde (esta|viene)|cuando llega|en camino|esta listo)\b/],
  ['transferencia', /\b(alias|cvu|cbu|transferencia|transferir|transfiero)\b/],
  ['celiacos', /\b(tacc|celiac[oa]s?|gluten)\b/],
  ['horarios', /\b(horarios?|abren|abris|abiertos?|cierran|cerras|cerrados?|hasta que hora|a que hora|atienden)\b/],
  ['envios', /\b(envios?|envian|delivery|reparto|llegan|llevan|mandan a|zonas?|domicilio)\b/],
  ['precios', /\b(precios?|cuanto (sale|cuesta|esta|vale|salen|cuestan)|valor|menu|carta|que tienen|que hay)\b/],
  ['saludo', /\b(hola|holis|buenas|buen dia|buenos dias|buenas tardes|buenas noches|que tal)\b/],
  ['gracias', /\b(gracias|genial|joya|perfecto|buenisimo|dale|ok|okey|barbaro|de una)\b|👍|🙌|🙏/],
];

export function detectarIntencion(texto: string | null, botonId: string | null = null): Intencion {
  if (botonId && (BOTONES_MENU as readonly string[]).includes(botonId)) return botonId as Intencion;
  if (!texto) return 'desconocida';
  if (referenciaPedido(texto) || /te mando mi pedido/i.test(texto) || numeroEnTexto(texto)) return 'pedido';
  const limpio = normalizar(texto);
  for (const [intencion, regla] of REGLAS) if (regla.test(limpio)) return intencion;
  return 'desconocida';
}
