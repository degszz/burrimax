import { CATEGORIAS, type Catalogo, type CategoriaSlug, type Database } from '@burritos/shared';
import { createClient } from '@supabase/supabase-js';

// Lee el catálogo activo de Supabase con la clave pública (RLS ya filtra lo
// inactivo para anon) y lo pasa a la forma que usan shared y el armador.

export interface DatosTienda {
  catalogo: Catalogo;
  abierto: boolean;
}

function cliente() {
  const url = import.meta.env.PUBLIC_SUPABASE_URL;
  const clave = import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !clave) throw new Error('Faltan PUBLIC_SUPABASE_URL o PUBLIC_SUPABASE_PUBLISHABLE_KEY');
  return createClient<Database>(url, clave, { auth: { persistSession: false } });
}

const esCategoria = (slug: string): slug is CategoriaSlug => (CATEGORIAS as readonly string[]).includes(slug);

export async function cargarDatosTienda(): Promise<DatosTienda> {
  const db = cliente();
  const [tamanos, categorias, ingredientes, productos, zonas, config] = await Promise.all([
    db.from('tamanos').select('*').eq('activo', true).order('orden'),
    db.from('categorias_ingrediente').select('*').order('paso'),
    db
      .from('ingredientes')
      .select('id, slug, nombre, precio_extra, activo, sin_tacc, imagen_url, color_hex, orden, categorias_ingrediente(slug)')
      .eq('activo', true)
      .order('orden'),
    db.from('productos').select('id, nombre, precio, activo').eq('activo', true),
    db.from('zonas_envio').select('id, nombre, costo, activo').eq('activo', true),
    db.from('config_publica').select('abierto').maybeSingle(),
  ]);

  const error = tamanos.error ?? categorias.error ?? ingredientes.error ?? productos.error ?? zonas.error ?? config.error;
  if (error) throw new Error(`No se pudo leer el catálogo: ${error.message}`);

  const porSlug = new Map(categorias.data!.map((c) => [c.slug, c]));
  const categoria = (slug: CategoriaSlug) => {
    const fila = porSlug.get(slug);
    if (!fila) throw new Error(`Falta la categoría "${slug}" en la base`);
    return { nombre: fila.nombre, paso: fila.paso, permiteRepetir: fila.permite_repetir };
  };

  const catalogo: Catalogo = {
    tamanos: tamanos.data!.map((t) => ({
      id: t.id,
      slug: t.slug,
      nombre: t.nombre,
      cantTapas: t.cant_tapas,
      precioBase: t.precio_base,
      minimos: { tortilla: 1, salsa: 0, carne: t.min_carnes, vegetal: 0 },
      maximos: { tortilla: 1, salsa: t.max_salsas, carne: t.max_carnes, vegetal: t.max_vegetales },
      activo: t.activo,
      orden: t.orden,
    })),
    categorias: {
      tortilla: categoria('tortilla'),
      salsa: categoria('salsa'),
      carne: categoria('carne'),
      vegetal: categoria('vegetal'),
    },
    ingredientes: ingredientes.data!.flatMap((i) => {
      const slug = i.categorias_ingrediente?.slug;
      if (!slug || !esCategoria(slug)) return [];
      return [
        {
          id: i.id,
          slug: i.slug,
          categoria: slug,
          nombre: i.nombre,
          precioExtra: i.precio_extra,
          activo: i.activo,
          sinTacc: i.sin_tacc,
          imagenUrl: i.imagen_url,
          colorHex: i.color_hex,
          orden: i.orden,
        },
      ];
    }),
    productos: productos.data!,
    zonasEnvio: zonas.data!,
  };

  return { catalogo, abierto: config.data?.abierto ?? false };
}
