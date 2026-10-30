import type { APIRoute } from 'astro';
import { z } from 'zod';

// Edición del catálogo. Lista cerrada: qué tabla y qué columnas se pueden
// tocar (nada de slugs, ids ni imágenes por acá). Escribe con la sesión del
// admin, así que la base aplica RLS (es_admin: rol + MFA) y sus propios
// controles (precios >= 0, mín. de carne <= máx., etc.).

const texto = (max: number) => z.string().trim().min(1, 'No puede quedar vacío').max(max);
const pesos = z.number().int('Sin centavos').min(0, 'No puede ser negativo').max(10_000_000);

const CAMBIOS = {
  ingredientes: z
    .object({
      nombre: texto(60),
      precio_extra: pesos,
      activo: z.boolean(),
      sin_tacc: z.boolean(),
      vegetariano: z.boolean(),
      orden: z.number().int().min(0).max(999),
    })
    .partial()
    .strict(),
  tamanos: z
    .object({
      nombre: texto(40),
      precio_base: pesos,
      min_carnes: z.number().int().min(1).max(10),
      max_carnes: z.number().int().min(1).max(10),
      max_salsas: z.number().int().min(0).max(10),
      max_vegetales: z.number().int().min(0).max(20),
      activo: z.boolean(),
    })
    .partial()
    .strict(),
  productos: z
    .object({
      nombre: texto(60),
      descripcion: z.string().trim().max(200).nullable(),
      activo: z.boolean(),
      destacado: z.boolean(),
      orden: z.number().int().min(0).max(999),
    })
    .partial()
    .strict(),
  zonas_envio: z
    .object({
      nombre: texto(60),
      costo: pesos,
      activo: z.boolean(),
    })
    .partial()
    .strict(),
} as const;

type Tabla = keyof typeof CAMBIOS;
const TABLAS = Object.keys(CAMBIOS) as [Tabla, ...Tabla[]];

const pedidoSchema = z.object({
  tabla: z.enum(TABLAS),
  id: z.uuid(),
  cambios: z.record(z.string(), z.unknown()),
});

/** Mensajes claros para los controles de la base. */
function traducir(mensaje: string): string {
  if (mensaje.includes('tamanos_carnes_check')) return 'El mínimo de carne no puede ser mayor que el máximo';
  if (mensaje.includes('check')) return 'Hay un valor fuera de lo permitido';
  return 'No se pudo guardar';
}

export const POST: APIRoute = async ({ request, locals }) => {
  if (!request.headers.get('content-type')?.includes('application/json')) return new Response('Formato inválido', { status: 415 });
  const pedido = pedidoSchema.safeParse(await request.json().catch(() => null));
  if (!pedido.success) return Response.json({ error: 'Pedido inválido' }, { status: 400 });

  const { tabla, id, cambios } = pedido.data;
  const validos = CAMBIOS[tabla].safeParse(cambios);
  if (!validos.success) {
    return Response.json({ error: validos.error.issues[0]?.message ?? 'Revisá los datos' }, { status: 400 });
  }
  if (Object.keys(validos.data).length === 0) return Response.json({ ok: true });

  const { data, error } = await locals.supabase
    .from(tabla)
    .update(validos.data as never)
    .eq('id', id)
    .select('id');
  if (error) return Response.json({ error: traducir(error.message) }, { status: 400 });
  if (!data?.length) return Response.json({ error: 'No se encontró o la sesión venció' }, { status: 404 });
  return Response.json({ ok: true });
};
