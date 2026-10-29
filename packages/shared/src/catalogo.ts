import type { CategoriaSlug } from './constantes';

// Forma del catálogo que usan la validación y el cálculo de precios.
// Se arma a partir de las tablas de Supabase (en el servidor) o de lo que
// la tienda ya cargó (en el cliente, solo para la vista previa).

export interface TamanoCatalogo {
  id: string;
  slug: string;
  nombre: string;
  cantTapas: number;
  /** Incluye las papas fritas. */
  precioBase: number;
  /** Mínimo por categoría. Tortilla 1; carne según tamaño (2 simple, 4 doble). */
  minimos: Record<CategoriaSlug, number>;
  /** Máximo por categoría. La tortilla siempre es 1: la doble usa dos tapas iguales. */
  maximos: Record<CategoriaSlug, number>;
  activo: boolean;
  orden: number;
}

export interface CategoriaCatalogo {
  nombre: string;
  paso: number;
  /** Si se puede elegir el mismo ingrediente más de una vez (porciones de carne). */
  permiteRepetir: boolean;
}

export interface IngredienteCatalogo {
  id: string;
  slug: string;
  categoria: CategoriaSlug;
  nombre: string;
  precioExtra: number;
  activo: boolean;
  sinTacc: boolean;
  imagenUrl: string | null;
  colorHex: string | null;
  orden: number;
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
  categorias: Record<CategoriaSlug, CategoriaCatalogo>;
  ingredientes: IngredienteCatalogo[];
  productos: ProductoCatalogo[];
  zonasEnvio: ZonaEnvioCatalogo[];
}
