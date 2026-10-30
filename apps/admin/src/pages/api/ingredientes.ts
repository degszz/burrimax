import type { APIRoute } from 'astro';
import { z } from 'zod';
import type { FilaIngrediente } from '@/lib/catalogo';

// Alta de un ingrediente nuevo (ej. "Salmón" en carnes). La foto se suma
// después; mientras tanto la tienda lo muestra con un círculo de su color.

const CATEGORIAS = ['tortilla', 'salsa', 'carne', 'vegetal'] as const;

const cuerpoSchema = z.object({
  categoria: z.enum(CATEGORIAS),
  nombre: z.string().trim().min(2, 'Poné un nombre').max(60),
  precio_extra: z.number().int().min(0).max(10_000_000).default(0),
  sin_tacc: z.boolean().default(false),
  color_hex: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Color inválido')
    .default('#E9C46A'),
});

/** "Salmón ahumado" → "salmon-ahumado" (como los demás slugs). */
function aSlug(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

export const POST: APIRoute = async ({ request, locals }) => {
  if (!request.headers.get('content-type')?.includes('application/json')) return new Response('Formato inválido', { status: 415 });
  const cuerpo = cuerpoSchema.safeParse(await request.json().catch(() => null));
  if (!cuerpo.success) return Response.json({ error: cuerpo.error.issues[0]?.message ?? 'Revisá los datos' }, { status: 400 });
  const { categoria, nombre, precio_extra, sin_tacc, color_hex } = cuerpo.data;
  const db = locals.supabase;

  const { data: cat } = await db.from('categorias_ingrediente').select('id').eq('slug', categoria).maybeSingle();
  if (!cat) return Response.json({ error: 'Categoría no encontrada' }, { status: 400 });

  // Va al final de su categoría.
  const { data: ultimo } = await db
    .from('ingredientes')
    .select('orden')
    .eq('categoria_id', cat.id)
    .order('orden', { ascending: false })
    .limit(1)
    .maybeSingle();

  const base = aSlug(nombre) || 'ingrediente';
  // Si el slug ya existe (otro con el mismo nombre), prueba con un número.
  for (let intento = 0; intento < 5; intento++) {
    const slug = intento === 0 ? base : `${base}-${intento + 1}`;
    const { data, error } = await db
      .from('ingredientes')
      .insert({
        categoria_id: cat.id,
        slug,
        nombre,
        precio_extra,
        sin_tacc: categoria === 'tortilla' ? sin_tacc : false,
        vegetariano: categoria !== 'carne',
        color_hex,
        activo: true,
        orden: (ultimo?.orden ?? 0) + 1,
      })
      .select('id, slug, nombre, precio_extra, activo, sin_tacc, vegetariano, orden, imagen_url, color_hex')
      .single();
    if (!error && data) {
      const fila: FilaIngrediente = { ...data, categoria };
      return Response.json({ ok: true, ingrediente: fila });
    }
    if (error?.code !== '23505') return Response.json({ error: 'No se pudo agregar (¿sesión vencida?)' }, { status: 400 });
  }
  return Response.json({ error: 'Ya hay varios ingredientes con ese nombre' }, { status: 400 });
};
