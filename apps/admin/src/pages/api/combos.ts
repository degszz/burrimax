import { precioUnitarioArmado, validarArmado } from '@burritos/shared';
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { armadoDesdeReceta, catalogoDesdeFilas, type CategoriaSlug, type FilaIngrediente, type FilaTamano } from '@/lib/catalogo';
import { textoErrorArmado } from '@/lib/combos';

// Alta y cambio de receta de un combo de la casa. Antes de guardar se valida
// con las mismas reglas que la tienda (límites del tamaño, ingredientes
// activos) y el precio sale de shared (regla 1: el precio nunca lo manda el cliente).

const cuerpoSchema = z.object({
  id: z.uuid().nullable(),
  nombre: z.string().trim().min(2, 'Poné un nombre').max(60),
  descripcion: z.string().trim().max(200).nullable(),
  tamano_id: z.uuid('Elegí el tamaño'),
  items: z
    .array(z.object({ ingrediente_id: z.uuid(), porciones: z.number().int().min(1).max(10) }))
    .min(1, 'Elegí los ingredientes')
    .max(30),
});

export const POST: APIRoute = async ({ request, locals }) => {
  if (!request.headers.get('content-type')?.includes('application/json')) return new Response('Formato inválido', { status: 415 });
  const cuerpo = cuerpoSchema.safeParse(await request.json().catch(() => null));
  if (!cuerpo.success) return Response.json({ error: cuerpo.error.issues[0]?.message ?? 'Revisá los datos' }, { status: 400 });
  const { id, nombre, descripcion, tamano_id, items } = cuerpo.data;
  const db = locals.supabase;

  const [tamanos, ingredientes, categorias] = await Promise.all([
    db.from('tamanos').select('id, slug, nombre, precio_base, min_carnes, max_carnes, max_salsas, max_vegetales, activo').order('orden'),
    db
      .from('ingredientes')
      .select('id, slug, nombre, precio_extra, activo, sin_tacc, vegetariano, orden, imagen_url, color_hex, categorias_ingrediente(slug)')
      .order('orden'),
    db.from('categorias_ingrediente').select('slug, permite_repetir'),
  ]);
  if (tamanos.error || ingredientes.error || categorias.error) return Response.json({ error: 'No se pudo leer el catálogo' }, { status: 500 });

  const filas: FilaIngrediente[] = ingredientes.data.map((i) => ({
    ...i,
    categoria: (i.categorias_ingrediente?.slug ?? 'vegetal') as CategoriaSlug,
  }));
  const catalogo = catalogoDesdeFilas(tamanos.data as FilaTamano[], filas);
  for (const c of categorias.data) {
    if (c.slug in catalogo.categorias) catalogo.categorias[c.slug as CategoriaSlug].permiteRepetir = c.permite_repetir;
  }

  const armado = armadoDesdeReceta(tamano_id, items, filas);
  const errores = validarArmado(armado, catalogo);
  if (errores.length) return Response.json({ error: textoErrorArmado(errores[0]!, catalogo) }, { status: 400 });

  const { data, error } = await db.rpc('guardar_combo', {
    p_id: id,
    p_nombre: nombre,
    p_descripcion: descripcion || null,
    p_tamano_id: tamano_id,
    p_precio: precioUnitarioArmado(armado, catalogo),
    p_receta: items,
  });
  if (error) {
    console.error('guardar_combo', error);
    return Response.json({ error: error.code === 'P0002' ? 'No se encontró el combo' : 'No se pudo guardar (¿sesión vencida?)' }, { status: 400 });
  }
  return Response.json({ ok: true, id: data });
};
