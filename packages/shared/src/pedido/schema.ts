import { z } from 'zod';
import { armadoSchema } from '../armador/schema';
import { CANTIDAD_MAXIMA_POR_ITEM, ITEMS_MAXIMOS_POR_PEDIDO, METODOS_PAGO } from '../constantes';

// Lo que manda la tienda a `POST /api/pedidos`. No incluye precios ni totales:
// el servidor los calcula con `calcularPedido`, y Zod descarta cualquier campo extra.

/** Celular o fijo argentino con código de área: 10 dígitos, o hasta 13 con +54 9. */
const telefonoAR = z
  .string()
  .trim()
  .refine((valor) => {
    const digitos = valor.replace(/\D/g, '');
    return digitos.length >= 10 && digitos.length <= 13;
  }, 'Ingresá tu teléfono con código de área');

export const clienteSchema = z.object({
  nombre: z.string().trim().min(2, 'Ingresá tu nombre').max(60),
  telefono: telefonoAR,
  // Opcional: el campo vacío del formulario cuenta como no cargado.
  email: z.preprocess((v) => (v === '' ? undefined : v), z.email('Revisá el email').optional()),
});

export const entregaSchema = z.discriminatedUnion('tipoEntrega', [
  z.object({
    tipoEntrega: z.literal('delivery'),
    direccion: z.string().trim().min(5, 'Ingresá tu dirección').max(150),
    referencias: z.string().trim().max(200).optional(),
    zonaEnvioId: z.uuid(),
  }),
  z.object({ tipoEntrega: z.literal('retiro') }),
]);

export const pagoSchema = z
  .object({
    metodoPago: z.enum(METODOS_PAGO),
    pagaCon: z.number().int().positive().optional(),
  })
  .refine((pago) => pago.pagaCon === undefined || pago.metodoPago === 'efectivo', {
    message: '"¿Con cuánto pagás?" es solo para efectivo',
    path: ['pagaCon'],
  });

export const itemPedidoSchema = z.discriminatedUnion('tipo', [
  z.object({ tipo: z.literal('armado'), armado: armadoSchema }),
  z.object({
    tipo: z.literal('producto'),
    productoId: z.uuid(),
    cantidad: z.number().int().min(1).max(CANTIDAD_MAXIMA_POR_ITEM),
  }),
]);

export const pedidoSchema = z.object({
  cliente: clienteSchema,
  entrega: entregaSchema,
  pago: pagoSchema,
  items: z.array(itemPedidoSchema).min(1, 'El carrito está vacío').max(ITEMS_MAXIMOS_POR_PEDIDO),
  notas: z.string().trim().max(300).optional(),
});

export type ItemPedido = z.infer<typeof itemPedidoSchema>;
export type Entrega = z.infer<typeof entregaSchema>;
export type PedidoEntrada = z.infer<typeof pedidoSchema>;
