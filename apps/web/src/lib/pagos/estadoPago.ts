import type { EstadoPago, EstadoPedido } from '@burritos/shared';

// Qué hacer con un pedido cuando Mercado Pago avisa de un pago.
// Lógica pura: el webhook busca los datos y aplica lo que esto decide.

export interface PagoInformado {
  status: string;
  external_reference: string | null;
  transaction_amount: number | null;
}

export interface PedidoActual {
  id: string;
  total: number;
  estado: EstadoPedido;
  estado_pago: EstadoPago;
}

export type Decision =
  | { tipo: 'ignorar'; motivo: string }
  | { tipo: 'actualizar'; estado_pago: EstadoPago; estado: EstadoPedido };

export function decidirPorPago(pago: PagoInformado, pedido: PedidoActual): Decision {
  if (pago.external_reference !== pedido.id) return { tipo: 'ignorar', motivo: 'el pago es de otro pedido' };

  switch (pago.status) {
    case 'approved': {
      // Nunca aprobar si el monto no coincide con lo que calculó el servidor.
      if (pago.transaction_amount !== pedido.total) return { tipo: 'ignorar', motivo: 'el monto no coincide con el total' };
      const estado = pedido.estado === 'pendiente_pago' ? 'confirmado' : pedido.estado;
      return { tipo: 'actualizar', estado_pago: 'aprobado', estado };
    }
    case 'rejected':
    case 'cancelled':
      return { tipo: 'actualizar', estado_pago: 'rechazado', estado: pedido.estado };
    case 'refunded':
    case 'charged_back':
      return { tipo: 'actualizar', estado_pago: 'reembolsado', estado: pedido.estado };
    default:
      // pending, in_process, authorized…: todavía no hay nada que cambiar.
      return { tipo: 'ignorar', motivo: `pago en estado ${pago.status}` };
  }
}
