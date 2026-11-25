// Filas del catálogo tal como las edita el admin (nombres de columna de la base,
// así lo que cambia se manda tal cual a /api/catalogo).

import type { Armado, Catalogo } from '@burritos/shared';

export type CategoriaSlug = 'tortilla' | 'salsa' | 'carne' | 'vegetal';

export interface FilaIngrediente {
  id: string;
  slug: string;
  categoria: CategoriaSlug;
  nombre: string;
  precio_extra: number;
  activo: boolean;
  sin_tacc: boolean;
  vegetariano: boolean;
  orden: number;
  imagen_url: string | null;
  /** Color de respaldo cuando todavía no hay foto. */
  color_hex?: string | null;
}

export interface FilaTamano {
  id: string;
  slug: string;
  nombre: string;
  precio_base: number;
  min_carnes: number;
  max_carnes: number;
  max_salsas: number;
  max_vegetales: number;
  activo: boolean;
}

export interface FilaCombo {
  id: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  destacado: boolean;
  orden: number;
  /** "Simple · Maíz, Pollo ×2, Guacamole…" (solo lectura). */
  receta: string;
  /** Foto propia del burrito (Storage) o null para la de siempre. */
  imagen_url: string | null;
  /** Para editar la receta. */
  tamano_id: string | null;
  items: ItemReceta[];
}

export interface ItemReceta {
  ingrediente_id: string;
  porciones: number;
}

/** Lo mínimo que necesitan la validación y el precio de shared (mismas reglas que la tienda). */
export function catalogoDesdeFilas(tamanos: FilaTamano[], ingredientes: FilaIngrediente[]): Catalogo {
  return {
    tamanos: tamanos.map((t, i) => ({
      id: t.id,
      slug: t.slug,
      nombre: t.nombre,
      cantTapas: t.slug.includes('doble') ? 2 : 1,
      precioBase: t.precio_base,
      minimos: { tortilla: 1, salsa: 0, carne: t.min_carnes, vegetal: 0 },
      maximos: { tortilla: 1, salsa: t.max_salsas, carne: t.max_carnes, vegetal: t.max_vegetales },
      activo: t.activo,
      orden: i,
    })),
    categorias: {
      tortilla: { nombre: 'Tortilla', paso: 1, permiteRepetir: false },
      salsa: { nombre: 'Salsas', paso: 2, permiteRepetir: false },
      carne: { nombre: 'Carne', paso: 3, permiteRepetir: true },
      vegetal: { nombre: 'Vegetales', paso: 4, permiteRepetir: false },
    },
    ingredientes: ingredientes.map((i) => ({
      id: i.id,
      slug: i.slug,
      categoria: i.categoria,
      nombre: i.nombre,
      precioExtra: i.precio_extra,
      activo: i.activo,
      sinTacc: i.sin_tacc,
      imagenUrl: i.imagen_url,
      colorHex: i.color_hex ?? null,
      orden: i.orden,
    })),
    productos: [],
  };
}

/** Receta (ingrediente + porciones) → Armado, para validar y calcular el precio. */
export function armadoDesdeReceta(tamanoId: string, items: ItemReceta[], ingredientes: FilaIngrediente[]): Armado {
  const porId = new Map(ingredientes.map((i) => [i.id, i]));
  const seleccion: Armado['seleccion'] = { tortilla: [], salsa: [], carne: [], vegetal: [] };
  for (const { ingrediente_id, porciones } of items) {
    const ingrediente = porId.get(ingrediente_id);
    if (!ingrediente) continue;
    for (let n = 0; n < porciones; n++) seleccion[ingrediente.categoria].push(ingrediente_id);
  }
  return { tamanoId, seleccion, cantidad: 1 };
}

export interface FilaZona {
  id: string;
  nombre: string;
  costo: number;
  activo: boolean;
}

export type TablaCatalogo = 'ingredientes' | 'tamanos' | 'productos' | 'zonas_envio';

export const TITULO_CATEGORIA: Record<CategoriaSlug, string> = {
  tortilla: 'Tortillas',
  salsa: 'Salsas',
  carne: 'Carnes',
  vegetal: 'Vegetales',
};

/** Las fotos viven en la tienda (otro dominio). */
export const TIENDA = 'https://burrimax.vercel.app';
