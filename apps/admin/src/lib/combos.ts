import type { Catalogo, ErrorArmado } from '@burritos/shared';

const NOMBRE: Record<string, string> = { tortilla: 'tortilla', salsa: 'salsas', carne: 'porciones de carne', vegetal: 'vegetales' };

/** Un error de la validación de shared, dicho en criollo para el admin. */
export function textoErrorArmado(error: ErrorArmado, catalogo: Catalogo): string {
  switch (error.tipo) {
    case 'tamano_invalido':
      return 'Elegí un tamaño disponible';
    case 'ingrediente_invalido': {
      const nombre = catalogo.ingredientes.find((i) => i.id === error.ingredienteId)?.nombre;
      return nombre ? `${nombre} está sin stock: sacalo o volvé a activarlo` : 'Hay un ingrediente que ya no existe';
    }
    case 'ingrediente_repetido':
      return `No se puede repetir en ${NOMBRE[error.categoria]}`;
    case 'faltan':
      return error.categoria === 'tortilla' ? 'Elegí la tortilla' : `Faltan ${NOMBRE[error.categoria]}: mínimo ${error.minimo}`;
    case 'excede':
      return `Te pasaste de ${NOMBRE[error.categoria]}: máximo ${error.maximo} para este tamaño`;
  }
}
