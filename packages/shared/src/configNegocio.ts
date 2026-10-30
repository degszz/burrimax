import { z } from 'zod';

// Lo que el admin puede cambiar de los cobros: qué medios de pago se ofrecen y
// a dónde se transfiere. Lo validan el formulario del admin y su endpoint con
// este mismo schema. Nunca van claves ni tokens acá: `config_negocio` es de
// lectura pública (ver docs/09 Decisiones); los secretos van en variables de entorno.
// Stripe no se maneja desde acá: sigue detrás de su propio interruptor.

/** Sin espacios ni guiones; vacío = no cargado (null). */
const limpiar = (v: unknown) => {
  if (typeof v !== 'string') return v;
  const texto = v.trim();
  return texto === '' ? null : texto;
};

/** Alias de transferencia (BCRA): 6 a 20 caracteres, letras sin ñ ni tildes, números, puntos y guiones. */
export const ALIAS_REGEX = /^[a-zA-Z0-9.-]{6,20}$/;

const alias = z.preprocess(limpiar, z.string().regex(ALIAS_REGEX, 'El alias tiene entre 6 y 20 letras, números, puntos o guiones (sin espacios, ñ ni tildes)').nullable());

const cvu = z.preprocess(
  (v) => {
    const texto = limpiar(v);
    return typeof texto === 'string' ? texto.replace(/[\s-]/g, '') : texto;
  },
  z.string().regex(/^\d{22}$/, 'El CVU/CBU tiene 22 números').nullable(),
);

const titular = z.preprocess(limpiar, z.string().min(2, 'Poné el nombre completo del titular').max(80, 'Es muy largo').nullable());

export const configPagosSchema = z.object({
  pagos: z
    .object({
      mercadopago: z.boolean(),
      transferencia: z.boolean(),
      efectivo: z.boolean(),
    })
    .refine((p) => p.mercadopago || p.transferencia || p.efectivo, 'Dejá al menos un medio de pago prendido'),
  transferencia: z.object({ alias, cvu, titular }),
});
export type ConfigPagos = z.infer<typeof configPagosSchema>;

// Ponderadores del dígito verificador del CBU. El CVU usa la misma cuenta.
const PESOS_BLOQUE_1 = [7, 1, 3, 9, 7, 1, 3];
const PESOS_BLOQUE_2 = [3, 9, 7, 1, 3, 9, 7, 1, 3, 9, 7, 1, 3];

function digitoVerificador(digitos: string, pesos: number[]): number {
  const suma = pesos.reduce((acc, peso, i) => acc + peso * Number(digitos[i]), 0);
  return (10 - (suma % 10)) % 10;
}

/**
 * ¿Los dígitos verificadores del CBU/CVU cierran? Sirve para avisar de un error
 * de tipeo, pero no para rechazar: no pudimos confirmar con el texto oficial del
 * BCRA que todos los CVU de las billeteras cierren con esta cuenta.
 */
export function cvuDigitosOk(valor: string): boolean {
  const d = valor.replace(/[\s-]/g, '');
  if (!/^\d{22}$/.test(d)) return false;
  return digitoVerificador(d.slice(0, 7), PESOS_BLOQUE_1) === Number(d[7]) && digitoVerificador(d.slice(8, 21), PESOS_BLOQUE_2) === Number(d[21]);
}
