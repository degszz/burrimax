import { z } from 'zod';
import { borrar, escribir, leer } from './almacenLocal';

// Datos del cliente recordados en este celular (con su permiso) para el próximo pedido.

export const CLAVE_DATOS_CLIENTE = 'burritos:datos-cliente:v1';

const datosSchema = z.object({
  nombre: z.string().default(''),
  telefono: z.string().default(''),
  email: z.string().default(''),
  tipoEntrega: z.enum(['delivery', 'retiro']).default('delivery'),
  direccion: z.string().default(''),
  referencias: z.string().default(''),
  zonaEnvioId: z.string().default(''),
});

export type DatosCliente = z.infer<typeof datosSchema>;

export const DATOS_VACIOS: DatosCliente = datosSchema.parse({});

export function leerDatosCliente(): DatosCliente | null {
  return leer(CLAVE_DATOS_CLIENTE, (dato) => {
    const r = datosSchema.safeParse(dato);
    return r.success ? r.data : null;
  });
}

export function guardarDatosCliente(datos: DatosCliente): void {
  escribir(CLAVE_DATOS_CLIENTE, datos);
}

export function olvidarDatosCliente(): void {
  borrar(CLAVE_DATOS_CLIENTE);
}
