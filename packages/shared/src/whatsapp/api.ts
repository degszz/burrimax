// Cliente mínimo de la WhatsApp Cloud API oficial de Meta (Graph API), con
// fetch y sin librerías. Lo usan la tienda (respuestas del bot) y el admin
// (avisos de estado). El token vive solo en variables del servidor.

/** Versión de la Graph API (verificada en el changelog de Meta el 2026-11-02). */
export const VERSION_GRAPH = 'v26.0';
const BASE = `https://graph.facebook.com/${VERSION_GRAPH}`;

export interface CredencialesWhatsapp {
  token: string;
  phoneNumberId: string;
  /** Cuánto esperar a Meta (8 s por defecto). El admin usa menos: el botón espera la respuesta. */
  timeoutMs?: number;
}

export class ErrorWhatsapp extends Error {
  constructor(
    mensaje: string,
    readonly codigo: number | null,
  ) {
    super(mensaje);
    this.name = 'ErrorWhatsapp';
  }
}

export interface Boton {
  /** Lo que vuelve en el webhook al tocarlo (máx. 256). */
  id: string;
  /** Lo que ve el cliente (máx. 20 caracteres). */
  titulo: string;
}

async function pedir<T>(cred: CredencialesWhatsapp, url: string, cuerpo?: unknown): Promise<T> {
  const respuesta = await fetch(url, {
    method: cuerpo === undefined ? 'GET' : 'POST',
    headers: { Authorization: `Bearer ${cred.token}`, ...(cuerpo === undefined ? {} : { 'Content-Type': 'application/json' }) },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    signal: AbortSignal.timeout(cred.timeoutMs ?? 8000),
  });
  const datos = (await respuesta.json().catch(() => ({}))) as { error?: { message?: string; code?: number } };
  if (!respuesta.ok) throw new ErrorWhatsapp(datos.error?.message ?? `HTTP ${respuesta.status}`, datos.error?.code ?? null);
  return datos as T;
}

async function enviar(cred: CredencialesWhatsapp, para: string, mensaje: Record<string, unknown>): Promise<string> {
  const datos = await pedir<{ messages?: { id: string }[] }>(cred, `${BASE}/${cred.phoneNumberId}/messages`, {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: `+${para.replace(/\D/g, '')}`,
    ...mensaje,
  });
  const wamid = datos.messages?.[0]?.id;
  if (!wamid) throw new ErrorWhatsapp('Meta no devolvió el id del mensaje', null);
  return wamid;
}

/** Texto libre: solo dentro de las 24 h desde el último mensaje del cliente. */
export function enviarTexto(cred: CredencialesWhatsapp, para: string, texto: string): Promise<string> {
  return enviar(cred, para, { type: 'text', text: { preview_url: true, body: texto.slice(0, 4096) } });
}

/** Hasta 3 botones grandes de respuesta (más fácil que escribir, sobre todo para gente mayor). */
export function enviarBotones(cred: CredencialesWhatsapp, para: string, texto: string, botones: Boton[]): Promise<string> {
  return enviar(cred, para, {
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: texto.slice(0, 1024) },
      action: { buttons: botones.slice(0, 3).map((b) => ({ type: 'reply', reply: { id: b.id, title: b.titulo.slice(0, 20) } })) },
    },
  });
}

/** Plantilla aprobada por Meta (fuera de las 24 h). Los parámetros van en orden: {{1}}, {{2}}… */
export function enviarPlantilla(cred: CredencialesWhatsapp, para: string, nombre: string, parametros: string[], idioma = 'es_AR'): Promise<string> {
  return enviar(cred, para, {
    type: 'template',
    template: {
      name: nombre,
      language: { code: idioma },
      components: parametros.length ? [{ type: 'body', parameters: parametros.map((text) => ({ type: 'text', text })) }] : [],
    },
  });
}

/** El token solo viaja a servidores de Meta (los archivos salen de lookaside.fbsbx.com). */
export function esUrlDeMeta(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && /(^|\.)(fbsbx\.com|facebook\.com|whatsapp\.net)$/.test(u.hostname);
  } catch {
    return false;
  }
}

/** Baja una foto o PDF que mandó el cliente. La URL de Meta dura 5 minutos y pide el token. */
export async function descargarMedia(cred: CredencialesWhatsapp, mediaId: string, maxBytes = 10 * 1024 * 1024): Promise<{ datos: Uint8Array; mimeType: string }> {
  const info = await pedir<{ url?: string; mime_type?: string; file_size?: number }>(cred, `${BASE}/${encodeURIComponent(mediaId)}`);
  if (!info.url || !esUrlDeMeta(info.url)) throw new ErrorWhatsapp('Meta no devolvió una URL válida para el archivo', null);
  if (info.file_size && info.file_size > maxBytes) throw new ErrorWhatsapp('El archivo es muy grande', null);
  const respuesta = await fetch(info.url, { headers: { Authorization: `Bearer ${cred.token}` }, signal: AbortSignal.timeout(15000) });
  if (!respuesta.ok) throw new ErrorWhatsapp(`No se pudo bajar el archivo (HTTP ${respuesta.status})`, null);
  const datos = new Uint8Array(await respuesta.arrayBuffer());
  if (datos.byteLength > maxBytes) throw new ErrorWhatsapp('El archivo es muy grande', null);
  return { datos, mimeType: info.mime_type ?? respuesta.headers.get('content-type') ?? 'application/octet-stream' };
}
