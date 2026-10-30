import { CATEGORIAS, validarArmado, type Armado, type Catalogo, type CategoriaSlug, type Database } from '@burritos/shared';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CLAVE_PUBLICA, SUPABASE_URL } from './supabasePublico';

// Lee el catálogo activo de Supabase con la clave pública (RLS ya filtra lo
// inactivo para anon) y lo pasa a la forma que usan shared y el armador.

/** Burrito armado por la casa (`productos` tipo burrito con su receta). */
export interface ComboCasa {
  id: string;
  nombre: string;
  descripcion: string | null;
  destacado: boolean;
  armado: Armado;
}

export interface ConfigTienda {
  abierto: boolean;
  /** Medios de pago prendidos desde el admin. */
  pagos: { mercadopago: boolean; transferencia: boolean; efectivo: boolean };
  transferencia: { alias: string | null; cvu: string | null; titular: string | null };
  /** Solo dígitos, o null si todavía no está cargado. */
  whatsapp: string | null;
  avisoCeliacos: string | null;
}

export interface DatosTienda {
  catalogo: Catalogo;
  combosCasa: ComboCasa[];
  abierto: boolean;
  config: ConfigTienda;
}

/** Cliente con la clave pública (respeta RLS). */
export function cliente() {
  return createClient<Database>(SUPABASE_URL, SUPABASE_CLAVE_PUBLICA, { auth: { persistSession: false } });
}

const esCategoria = (slug: string): slug is CategoriaSlug => (CATEGORIAS as readonly string[]).includes(slug);

export async function cargarDatosTienda(): Promise<DatosTienda> {
  const db = cliente();
  const [tamanos, categorias, ingredientes, productos, zonas, config, burritos] = await Promise.all([
    db.from('tamanos').select('*').eq('activo', true).order('orden'),
    db.from('categorias_ingrediente').select('*').order('paso'),
    db
      .from('ingredientes')
      .select('id, slug, nombre, precio_extra, activo, sin_tacc, imagen_url, color_hex, orden, categorias_ingrediente(slug)')
      .eq('activo', true)
      .order('orden'),
    db.from('productos').select('id, nombre, precio, activo').eq('activo', true),
    db.from('zonas_envio').select('id, nombre, costo, activo').eq('activo', true),
    db.from('config_publica').select('*').maybeSingle(),
    db
      .from('productos')
      .select('id, nombre, descripcion, destacado, orden, tamano_id, producto_ingredientes(ingrediente_id, porciones)')
      .eq('activo', true)
      .eq('tipo', 'burrito')
      .order('orden'),
  ]);

  const error =
    tamanos.error ?? categorias.error ?? ingredientes.error ?? productos.error ?? zonas.error ?? config.error ?? burritos.error;
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

  const c = config.data;
  const whatsapp = c?.whatsapp?.replace(/\D/g, '') ?? '';
  return {
    catalogo,
    combosCasa: armarCombosCasa(burritos.data!, catalogo),
    abierto: c?.abierto ?? false,
    config: {
      abierto: c?.abierto ?? false,
      pagos: {
        mercadopago: !!c?.pago_mp_activo,
        transferencia: !!c?.pago_transferencia_activo,
        efectivo: !!c?.pago_efectivo_activo,
      },
      transferencia: { alias: c?.alias_transferencia ?? null, cvu: c?.cvu ?? null, titular: c?.titular ?? null },
      whatsapp: whatsapp.length >= 10 ? whatsapp : null,
      avisoCeliacos: c?.aviso_celiacos ?? null,
    },
  };
}

type FilaBurrito = {
  id: string;
  nombre: string;
  descripcion: string | null;
  destacado: boolean;
  tamano_id: string | null;
  producto_ingredientes: { ingrediente_id: string; porciones: number }[];
};

/** Pasa cada receta a un Armado; si ya no es válido con el menú actual, no se muestra. */
function armarCombosCasa(filas: FilaBurrito[], catalogo: Catalogo): ComboCasa[] {
  const ingredientes = new Map(catalogo.ingredientes.map((i) => [i.id, i]));
  return filas.flatMap((fila) => {
    if (!fila.tamano_id) return [];
    const seleccion: Armado['seleccion'] = { tortilla: [], salsa: [], carne: [], vegetal: [] };
    for (const { ingrediente_id, porciones } of fila.producto_ingredientes) {
      const ingrediente = ingredientes.get(ingrediente_id);
      if (!ingrediente) return []; // receta con algo que ya no está
      for (let i = 0; i < porciones; i++) seleccion[ingrediente.categoria].push(ingrediente_id);
    }
    const armado: Armado = { tamanoId: fila.tamano_id, seleccion, cantidad: 1, nombrePersonalizado: fila.nombre };
    if (validarArmado(armado, catalogo).length) return [];
    return [{ id: fila.id, nombre: fila.nombre, descripcion: fila.descripcion, destacado: fila.destacado, armado }];
  });
}
