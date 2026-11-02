import { z } from 'zod';

// Lee lo que manda Meta al webhook (objeto whatsapp_business_account):
// entry[].changes[].value con messages[] (lo que escribe el cliente) y
// statuses[] (si lo que mandamos llegó o se leyó). Lo que no entiende lo ignora.

const media = z.object({ id: z.string(), mime_type: z.string().optional(), caption: z.string().optional(), filename: z.string().optional() });

const mensajeSchema = z.object({
  from: z.string(),
  id: z.string(),
  timestamp: z.string().optional(),
  type: z.string(),
  text: z.object({ body: z.string() }).optional(),
  interactive: z
    .object({
      type: z.string(),
      button_reply: z.object({ id: z.string(), title: z.string() }).optional(),
      list_reply: z.object({ id: z.string(), title: z.string() }).optional(),
    })
    .optional(),
  // Botón de respuesta rápida de una plantilla.
  button: z.object({ payload: z.string().optional(), text: z.string().optional() }).optional(),
  image: media.optional(),
  document: media.optional(),
});

const estadoSchema = z.object({
  id: z.string(),
  status: z.string(),
  recipient_id: z.string().optional(),
  errors: z.array(z.object({ code: z.number().optional(), title: z.string().optional(), message: z.string().optional() })).optional(),
});

const valorSchema = z.object({
  metadata: z.object({ phone_number_id: z.string() }).optional(),
  contacts: z.array(z.object({ wa_id: z.string(), profile: z.object({ name: z.string() }).optional() })).optional(),
  messages: z.array(z.unknown()).optional(),
  statuses: z.array(z.unknown()).optional(),
});

const avisoSchema = z.object({
  object: z.string(),
  entry: z.array(z.object({ changes: z.array(z.object({ field: z.string(), value: z.unknown() })) })),
});

export interface MensajeEntrante {
  /** wamid: único por mensaje (sirve para no procesarlo dos veces). */
  id: string;
  /** Número del cliente (solo dígitos, ej. 5492271468521). */
  waId: string;
  nombrePerfil: string | null;
  tipo: string;
  /** Texto escrito, el título del botón tocado o el epígrafe de la foto. */
  texto: string | null;
  /** id del botón tocado (los botones que manda el bot). */
  botonId: string | null;
  media: { id: string; mimeType: string | null; nombreArchivo: string | null } | null;
  crudo: unknown;
}

export interface EstadoEnvio {
  wamid: string;
  estado: 'enviado' | 'entregado' | 'leido' | 'fallido';
  error: string | null;
}

const ESTADOS: Record<string, EstadoEnvio['estado']> = { sent: 'enviado', delivered: 'entregado', read: 'leido', failed: 'fallido' };

/** Solo toma lo que es para nuestro número (`phone_number_id`). */
export function leerAvisoWhatsapp(cuerpo: unknown, phoneNumberId: string): { mensajes: MensajeEntrante[]; estados: EstadoEnvio[] } {
  const mensajes: MensajeEntrante[] = [];
  const estados: EstadoEnvio[] = [];
  const aviso = avisoSchema.safeParse(cuerpo);
  if (!aviso.success || aviso.data.object !== 'whatsapp_business_account') return { mensajes, estados };

  for (const entrada of aviso.data.entry) {
    for (const cambio of entrada.changes) {
      if (cambio.field !== 'messages') continue;
      const valor = valorSchema.safeParse(cambio.value);
      if (!valor.success || valor.data.metadata?.phone_number_id !== phoneNumberId) continue;
      const nombres = new Map((valor.data.contacts ?? []).map((c) => [c.wa_id, c.profile?.name ?? null]));

      for (const crudo of valor.data.messages ?? []) {
        const m = mensajeSchema.safeParse(crudo);
        if (!m.success) continue;
        const d = m.data;
        const boton = d.interactive?.button_reply ?? d.interactive?.list_reply;
        const archivo = d.type === 'image' ? d.image : d.type === 'document' ? d.document : undefined;
        mensajes.push({
          id: d.id,
          waId: d.from.replace(/\D/g, ''),
          nombrePerfil: nombres.get(d.from) ?? null,
          tipo: d.type,
          texto: d.text?.body ?? boton?.title ?? d.button?.text ?? archivo?.caption ?? null,
          botonId: boton?.id ?? d.button?.payload ?? null,
          media: archivo ? { id: archivo.id, mimeType: archivo.mime_type ?? null, nombreArchivo: archivo.filename ?? null } : null,
          crudo,
        });
      }

      for (const crudo of valor.data.statuses ?? []) {
        const s = estadoSchema.safeParse(crudo);
        const estado = s.success ? ESTADOS[s.data.status] : undefined;
        if (!s.success || !estado) continue;
        const error = s.data.errors?.[0];
        estados.push({ wamid: s.data.id, estado, error: error ? `${error.code ?? ''} ${error.title ?? error.message ?? ''}`.trim() : null });
      }
    }
  }
  return { mensajes, estados };
}
