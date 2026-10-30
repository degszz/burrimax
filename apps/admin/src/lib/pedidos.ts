import type { EstadoPedido, MetodoPago, TipoEntrega } from '@burritos/shared';

// Forma de un pedido para el tablero (la arma GET /api/pedidos).

export interface IngredientePedido {
  nombre: string;
  categoria: string;
  porciones: number;
}

export interface ItemPedido {
  id: string;
  nombre: string;
  cantidad: number;
  ingredientes: IngredientePedido[];
}

export interface PedidoTablero {
  id: string;
  numero: number;
  estado: EstadoPedido;
  estadoPago: 'pendiente' | 'aprobado' | 'rechazado' | 'reembolsado';
  metodoPago: MetodoPago;
  tipoEntrega: TipoEntrega;
  cliente: string;
  telefono: string;
  direccion: string | null;
  referencias: string | null;
  notas: string | null;
  total: number;
  pagaCon: number | null;
  creado: string;
  items: ItemPedido[];
}

/** Columnas del tablero, en orden. "Entregado" y "Cancelado" salen del tablero. */
export const COLUMNAS: { estado: EstadoPedido; titulo: string }[] = [
  { estado: 'pendiente_pago', titulo: 'Esperando pago' },
  { estado: 'confirmado', titulo: 'Nuevos' },
  { estado: 'en_preparacion', titulo: 'En preparación' },
  { estado: 'listo', titulo: 'Listos' },
  { estado: 'en_camino', titulo: 'En camino' },
];

/** El paso siguiente con un toque (null si no hay). */
export function siguienteEstado(p: Pick<PedidoTablero, 'estado' | 'tipoEntrega'>): { estado: EstadoPedido; texto: string } | null {
  switch (p.estado) {
    case 'confirmado':
      return { estado: 'en_preparacion', texto: 'Empezar a preparar' };
    case 'en_preparacion':
      return { estado: 'listo', texto: 'Está listo' };
    case 'listo':
      return p.tipoEntrega === 'delivery' ? { estado: 'en_camino', texto: 'Salió el delivery' } : { estado: 'entregado', texto: 'Lo retiró' };
    case 'en_camino':
      return { estado: 'entregado', texto: 'Entregado' };
    default:
      return null;
  }
}

export const NOMBRE_PAGO: Record<MetodoPago, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  mercadopago: 'Mercado Pago',
  stripe: 'Tarjeta (Stripe)',
};
