// Valores fijos del dominio. Los que el dueño puede cambiar (precios, límites)
// viven en la base, no acá.

export const CATEGORIAS = ['tapa', 'proteina', 'relleno', 'salsa', 'agregado'] as const;
export type CategoriaSlug = (typeof CATEGORIAS)[number];

export const ESTADOS_PEDIDO = [
  'pendiente_pago',
  'confirmado',
  'en_preparacion',
  'listo',
  'en_camino',
  'entregado',
  'cancelado',
] as const;
export type EstadoPedido = (typeof ESTADOS_PEDIDO)[number];

export const ESTADOS_PAGO = ['pendiente', 'aprobado', 'rechazado', 'reembolsado'] as const;
export type EstadoPago = (typeof ESTADOS_PAGO)[number];

export const METODOS_PAGO = ['mercadopago', 'stripe', 'transferencia', 'efectivo'] as const;
export type MetodoPago = (typeof METODOS_PAGO)[number];

export const TIPOS_ENTREGA = ['delivery', 'retiro'] as const;
export type TipoEntrega = (typeof TIPOS_ENTREGA)[number];

export const CANTIDAD_MAXIMA_POR_ITEM = 20;
export const ITEMS_MAXIMOS_POR_PEDIDO = 30;
