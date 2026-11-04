import type { MetodoPago } from '@burritos/shared';

export type MetodoVisible = Exclude<MetodoPago, 'stripe'>;

/**
 * Qué opciones ve el cliente en "¿Cómo pagás?". Si están transferencia y
 * Mercado Pago, se muestra solo Transferencia: adentro tiene el alias para
 * copiar y un botón para pagar con Mercado Pago (no son dos opciones aparte).
 */
export function mediosDePago(pagos: Record<MetodoVisible, boolean>): { opciones: MetodoVisible[]; mercadoPagoEnTransferencia: boolean } {
  const mercadoPagoEnTransferencia = pagos.mercadopago && pagos.transferencia;
  const orden: MetodoVisible[] = ['mercadopago', 'transferencia', 'efectivo'];
  return {
    opciones: orden.filter((m) => pagos[m] && !(m === 'mercadopago' && mercadoPagoEnTransferencia)),
    mercadoPagoEnTransferencia,
  };
}
