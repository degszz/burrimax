import { z } from 'zod';
import type { Catalogo } from '../catalogo';
import { CANTIDAD_MAXIMA_POR_ITEM, CATEGORIAS, type CategoriaSlug } from '../constantes';

const ids = z.array(z.uuid()).max(20).default([]);

/**
 * Forma de un burrito armado. No conoce el catálogo: eso lo valida `validarArmado`.
 * En `carne` cada id repetido es una porción más.
 */
export const armadoSchema = z.object({
  tamanoId: z.uuid(),
  seleccion: z.object({
    tortilla: ids,
    salsa: ids,
    carne: ids,
    vegetal: ids,
  }),
  cantidad: z.number().int().min(1).max(CANTIDAD_MAXIMA_POR_ITEM),
  nombrePersonalizado: z.string().trim().max(40).optional(),
});

export type Armado = z.infer<typeof armadoSchema>;

export type ErrorArmado =
  | { tipo: 'tamano_invalido' }
  | { tipo: 'ingrediente_invalido'; categoria: CategoriaSlug; ingredienteId: string }
  | { tipo: 'ingrediente_repetido'; categoria: CategoriaSlug; ingredienteId: string }
  | { tipo: 'faltan'; categoria: CategoriaSlug; minimo: number; elegidos: number }
  | { tipo: 'excede'; categoria: CategoriaSlug; maximo: number; elegidos: number };

/**
 * Valida un armado contra el catálogo: tamaño activo, ingredientes activos y de
 * la categoría correcta, repetidos solo donde se permite, y dentro de mínimos y
 * máximos del tamaño. Devuelve la lista de errores (vacía si está todo bien).
 */
export function validarArmado(armado: Armado, catalogo: Catalogo): ErrorArmado[] {
  const errores: ErrorArmado[] = [];
  const tamano = catalogo.tamanos.find((t) => t.id === armado.tamanoId && t.activo);
  if (!tamano) errores.push({ tipo: 'tamano_invalido' });

  const ingredientes = new Map(catalogo.ingredientes.map((i) => [i.id, i]));

  for (const categoria of CATEGORIAS) {
    const elegidos = armado.seleccion[categoria];
    const vistos = new Set<string>();

    for (const ingredienteId of elegidos) {
      const ingrediente = ingredientes.get(ingredienteId);
      if (!ingrediente || !ingrediente.activo || ingrediente.categoria !== categoria) {
        errores.push({ tipo: 'ingrediente_invalido', categoria, ingredienteId });
      }
      if (vistos.has(ingredienteId) && !catalogo.categorias[categoria].permiteRepetir) {
        errores.push({ tipo: 'ingrediente_repetido', categoria, ingredienteId });
      }
      vistos.add(ingredienteId);
    }

    if (!tamano) continue;
    if (elegidos.length < tamano.minimos[categoria]) {
      errores.push({ tipo: 'faltan', categoria, minimo: tamano.minimos[categoria], elegidos: elegidos.length });
    }
    if (elegidos.length > tamano.maximos[categoria]) {
      errores.push({ tipo: 'excede', categoria, maximo: tamano.maximos[categoria], elegidos: elegidos.length });
    }
  }

  return errores;
}

/** El mismo schema para el armador (cliente) y para `POST /api/pedidos` (servidor). */
export function crearArmadoValidoSchema(catalogo: Catalogo) {
  return armadoSchema.superRefine((armado, ctx) => {
    for (const error of validarArmado(armado, catalogo)) {
      ctx.addIssue({ code: 'custom', message: error.tipo, params: error });
    }
  });
}
