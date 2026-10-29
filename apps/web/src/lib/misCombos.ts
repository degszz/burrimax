import { armadoSchema, type Armado } from '@burritos/shared';
import { z } from 'zod';
import { escribir, leer } from './almacenLocal';

// "Mis combos": burritos guardados en este celular, sin cuenta.

export const CLAVE_MIS_COMBOS = 'burritos:mis-combos:v1';
const MAXIMO = 10;

const comboSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  armado: armadoSchema,
  /** id → nombre al momento de guardar, para avisar si algo sale del menú. */
  nombres: z.record(z.string(), z.string()),
  guardadoEn: z.string(),
});

export type ComboGuardado = z.infer<typeof comboSchema>;

/** Del más nuevo al más viejo. Lo que no tenga la forma esperada se ignora. */
export function listar(): ComboGuardado[] {
  return (
    leer(CLAVE_MIS_COMBOS, (dato) =>
      Array.isArray(dato) ? dato.flatMap((c) => (comboSchema.safeParse(c).success ? [comboSchema.parse(c)] : [])) : null,
    ) ?? []
  );
}

/** Devuelve el combo guardado, o `null` si no se pudo guardar en el celular. */
export function guardar(armado: Armado, nombre: string, nombres: Record<string, string>): ComboGuardado | null {
  const combo: ComboGuardado = {
    id: crypto.randomUUID(),
    nombre: nombre.trim() || 'Mi combo',
    armado: { ...armado, cantidad: 1 },
    nombres,
    guardadoEn: new Date().toISOString(),
  };
  const combos = [combo, ...listar()].slice(0, MAXIMO);
  return escribir(CLAVE_MIS_COMBOS, combos) ? combo : null;
}

export function borrar(id: string): void {
  escribir(
    CLAVE_MIS_COMBOS,
    listar().filter((c) => c.id !== id),
  );
}
