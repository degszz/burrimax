// Filas del catálogo tal como las edita el admin (nombres de columna de la base,
// así lo que cambia se manda tal cual a /api/catalogo).

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
