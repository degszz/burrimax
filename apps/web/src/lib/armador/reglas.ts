import { CATEGORIAS, type Armado, type Catalogo, type CategoriaSlug, type TamanoCatalogo } from '@burritos/shared';

// Reglas que necesita la pantalla del armador. Los límites salen del catálogo;
// la validación definitiva es `validarArmado` de shared.

export type Paso = 1 | 2 | 3 | 4 | 5;
export type PasoDeCategoria = 1 | 2 | 3 | 4;

export const CATEGORIA_DEL_PASO: Record<PasoDeCategoria, CategoriaSlug> = {
  1: 'tortilla',
  2: 'salsa',
  3: 'carne',
  4: 'vegetal',
};

export function tamanoDe(armado: Pick<Armado, 'tamanoId'>, catalogo: Catalogo): TamanoCatalogo | undefined {
  return catalogo.tamanos.find((t) => t.id === armado.tamanoId);
}

export function cuantas(armado: Armado, categoria: CategoriaSlug, ingredienteId?: string): number {
  const elegidos = armado.seleccion[categoria];
  return ingredienteId === undefined ? elegidos.length : elegidos.filter((id) => id === ingredienteId).length;
}

export function puedeAgregar(armado: Armado, categoria: CategoriaSlug, catalogo: Catalogo): boolean {
  const tamano = tamanoDe(armado, catalogo);
  return !!tamano && cuantas(armado, categoria) < tamano.maximos[categoria];
}

/** Por qué no se puede pasar al paso siguiente, o `null` si se puede. */
export function motivoBloqueo(paso: PasoDeCategoria, armado: Armado, catalogo: Catalogo): string | null {
  if (paso === 1 && armado.seleccion.tortilla.length === 0) return 'Elegí una tortilla para seguir';
  if (paso === 3) {
    const minimo = tamanoDe(armado, catalogo)?.minimos.carne ?? 0;
    const elegidas = armado.seleccion.carne.length;
    const faltan = minimo - elegidas;
    if (faltan === 1) return `Te falta 1 porción de carne (${elegidas}/${minimo})`;
    if (faltan > 1) return `Te faltan ${faltan} porciones de carne (${elegidas}/${minimo})`;
  }
  return null;
}

/** Qué sobra si el armado pasa al tamaño `destino` (vacío = entra). */
export function excesoAlCambiar(armado: Armado, destino: TamanoCatalogo): { categoria: CategoriaSlug; sobran: number }[] {
  return CATEGORIAS.flatMap((categoria) => {
    const sobran = armado.seleccion[categoria].length - destino.maximos[categoria];
    return sobran > 0 ? [{ categoria, sobran }] : [];
  });
}

/**
 * Saca del armado lo que ya no está en el catálogo (inactivo, borrado o de otra
 * categoría). `nombresConocidos` sirve para avisar qué se sacó, porque lo
 * inactivo ya no viene en el catálogo.
 */
export function limpiarContraCatalogo(
  armado: Armado,
  catalogo: Catalogo,
  nombresConocidos: Record<string, string> = {},
): { armado: Armado; quitados: string[] } {
  const quitados: string[] = [];
  const ingredientes = new Map(catalogo.ingredientes.map((i) => [i.id, i]));

  let tamanoId = armado.tamanoId;
  if (!catalogo.tamanos.some((t) => t.id === tamanoId && t.activo)) {
    tamanoId = catalogo.tamanos[0]?.id ?? tamanoId;
    quitados.push('el tamaño elegido');
  }

  const seleccion = { ...armado.seleccion };
  for (const categoria of CATEGORIAS) {
    seleccion[categoria] = armado.seleccion[categoria].filter((id) => {
      const ingrediente = ingredientes.get(id);
      const sigue = !!ingrediente && ingrediente.activo && ingrediente.categoria === categoria;
      if (!sigue) {
        const nombre = nombresConocidos[id] ?? 'un ingrediente';
        if (!quitados.includes(nombre)) quitados.push(nombre);
      }
      return sigue;
    });
  }

  return { armado: { ...armado, tamanoId, seleccion }, quitados };
}

/** id → nombre de todo lo elegido, para poder avisar si algo desaparece del menú. */
export function nombresDe(armado: Armado, catalogo: Catalogo): Record<string, string> {
  const nombres: Record<string, string> = {};
  for (const categoria of CATEGORIAS) {
    for (const id of armado.seleccion[categoria]) {
      const ingrediente = catalogo.ingredientes.find((i) => i.id === id);
      if (ingrediente) nombres[id] = ingrediente.nombre;
    }
  }
  return nombres;
}

/** "Pollo ×2, Vaca" — agrupa porciones repetidas. */
export function describir(ids: string[], catalogo: Catalogo): string {
  const conteo = new Map<string, number>();
  for (const id of ids) conteo.set(id, (conteo.get(id) ?? 0) + 1);
  return [...conteo]
    .map(([id, n]) => {
      const nombre = catalogo.ingredientes.find((i) => i.id === id)?.nombre ?? '';
      return n > 1 ? `${nombre} ×${n}` : nombre;
    })
    .filter(Boolean)
    .join(', ');
}
