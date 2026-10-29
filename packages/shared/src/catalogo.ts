import type { CategoriaSlug } from './constantes';

// Forma del catálogo que usan la validación y el cálculo de precios.
// Se arma a partir de las tablas de Supabase (en el servidor) o de lo que
// la tienda ya cargó (en el cliente, solo para la vista previa).

export interface TamanoCatalogo {
  id: string;
  slug: string;
  nombre: string;
  cantTapas: number;
  precioBase: number;
  /** Máximo por categoría. La tapa siempre es 1: la doble usa dos del mismo tipo. */
  maximos: Record<CategoriaSlug, number>;
  activo: boolean;
}

export interface IngredienteCatalogo {
  id: string;
  categoria: CategoriaSlug;
  nombre: string;
  precioExtra: number;
  activo: boolean;
}

export interface ProductoCatalogo {
  id: string;
  nombre: string;
  precio: number;
  activo: boolean;
}

export interface ZonaEnvioCatalogo {
  id: string;
  nombre: string;
  costo: number;
  activo: boolean;
}

export interface Catalogo {
  tamanos: TamanoCatalogo[];
  /** Mínimo por categoría (de `categorias_ingrediente.min`). */
  minimos: Record<CategoriaSlug, number>;
  ingredientes: IngredienteCatalogo[];
  productos: ProductoCatalogo[];
  zonasEnvio: ZonaEnvioCatalogo[];
}
