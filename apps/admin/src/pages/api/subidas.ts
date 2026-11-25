import type { APIRoute } from 'astro';
import { z } from 'zod';

// Fotos de combos y el burrito en 3D. El archivo no pasa por acá (Vercel corta
// los pedidos grandes): 1) `pedir` devuelve una URL firmada para subir directo
// a Storage; 2) el navegador sube; 3) `confirmar` guarda la URL pública en la
// base. `quitar` vuelve a la foto o al estado por defecto. Todo con la sesión
// del admin (RLS + es_admin).

const DESTINOS = {
  combo: { bucket: 'combos', extensiones: ['webp', 'png', 'jpg', 'avif'] },
  glb: { bucket: 'modelos', extensiones: ['glb'] },
  usdz: { bucket: 'modelos', extensiones: ['usdz'] },
} as const;

type Destino = keyof typeof DESTINOS;

const cuerpoSchema = z.discriminatedUnion('accion', [
  z.object({ accion: z.literal('pedir'), destino: z.enum(['combo', 'glb', 'usdz']), id: z.uuid().optional(), extension: z.string().max(5) }),
  z.object({ accion: z.literal('confirmar'), destino: z.enum(['combo', 'glb', 'usdz']), id: z.uuid().optional(), path: z.string().max(200) }),
  z.object({ accion: z.literal('quitar'), destino: z.enum(['combo', 'glb', 'usdz']), id: z.uuid().optional() }),
]);

/** Carpeta de cada destino: así `confirmar` solo acepta archivos que pidió este mismo flujo. */
const prefijo = (destino: Destino, id?: string) => (destino === 'combo' ? `${id}/` : `burrito/${destino}-`);

export const POST: APIRoute = async ({ request, locals }) => {
  if (!request.headers.get('content-type')?.includes('application/json')) return new Response('Formato inválido', { status: 415 });
  const cuerpo = cuerpoSchema.safeParse(await request.json().catch(() => null));
  if (!cuerpo.success) return Response.json({ error: 'Pedido inválido' }, { status: 400 });
  const datos = cuerpo.data;
  if (datos.destino === 'combo' && !datos.id) return Response.json({ error: 'Falta el combo' }, { status: 400 });
  const { bucket, extensiones } = DESTINOS[datos.destino];
  const db = locals.supabase;

  if (datos.accion === 'pedir') {
    const extension = datos.extension.toLowerCase();
    if (!(extensiones as readonly string[]).includes(extension)) {
      return Response.json({ error: `Tiene que ser ${extensiones.map((e) => `.${e}`).join(' o ')}` }, { status: 400 });
    }
    // Nombre nuevo cada vez: el navegador y el CDN no muestran la versión vieja.
    const path = `${prefijo(datos.destino, datos.id)}${crypto.randomUUID()}.${extension}`;
    const { data, error } = await db.storage.from(bucket).createSignedUploadUrl(path);
    if (error || !data) return Response.json({ error: 'No se pudo preparar la subida (¿sesión vencida?)' }, { status: 400 });
    return Response.json({ ok: true, bucket, path: data.path, token: data.token });
  }

  const url = datos.accion === 'confirmar' ? db.storage.from(bucket).getPublicUrl(datos.path).data.publicUrl : null;
  if (datos.accion === 'confirmar' && !datos.path.startsWith(prefijo(datos.destino, datos.id))) {
    return Response.json({ error: 'Archivo inválido' }, { status: 400 });
  }

  const { data, error } =
    datos.destino === 'combo'
      ? await db.from('productos').update({ imagen_url: url }).eq('id', datos.id!).eq('tipo', 'burrito').select('id')
      : await db
          .from('config_negocio')
          .update(datos.destino === 'glb' ? { modelo_burrito_glb: url } : { modelo_burrito_usdz: url })
          .eq('id', true)
          .select('id');
  if (error || !data?.length) return Response.json({ error: 'No se pudo guardar (¿sesión vencida?)' }, { status: 400 });
  return Response.json({ ok: true, url });
};
