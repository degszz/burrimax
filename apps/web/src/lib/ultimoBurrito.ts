import { armadoSchema, validarArmado, type Armado, type Catalogo } from '@burritos/shared';
import { escribir, leer } from './almacenLocal';
import { limpiarContraCatalogo } from './armador/reglas';

// El último burrito que la persona terminó de armar (aunque no lo haya
// guardado ni pedido). Se muestra primero en "Combos de la casa".

export const CLAVE_ULTIMO_BURRITO = 'burritos:ultimo-burrito:v1';

export function guardarUltimo(armado: Armado): void {
  escribir(CLAVE_ULTIMO_BURRITO, { ...armado, cantidad: 1 });
}

/** El último burrito, puesto al día con el menú; null si no hay o ya no se puede pedir. */
export function leerUltimo(catalogo: Catalogo): Armado | null {
  const guardado = leer(CLAVE_ULTIMO_BURRITO, (dato) => {
    const r = armadoSchema.safeParse(dato);
    return r.success ? r.data : null;
  });
  if (!guardado) return null;
  const { armado } = limpiarContraCatalogo(guardado, catalogo);
  return validarArmado(armado, catalogo).length ? null : armado;
}
