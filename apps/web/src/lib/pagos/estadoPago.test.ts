import { describe, expect, it } from 'vitest';
import { decidirPorPago, type PedidoActual } from './estadoPago';

const pedido: PedidoActual = { id: 'p1', total: 18000, estado: 'pendiente_pago', estado_pago: 'pendiente' };

describe('decidirPorPago', () => {
  it('aprobado con el monto justo confirma el pedido', () => {
    expect(decidirPorPago({ status: 'approved', external_reference: 'p1', transaction_amount: 18000 }, pedido)).toEqual({
      tipo: 'actualizar',
      estado_pago: 'aprobado',
      estado: 'confirmado',
    });
  });

  it('aprobado con monto alterado NO aprueba', () => {
    expect(decidirPorPago({ status: 'approved', external_reference: 'p1', transaction_amount: 10 }, pedido)).toMatchObject({
      tipo: 'ignorar',
    });
  });

  it('pago de otro pedido se ignora', () => {
    expect(decidirPorPago({ status: 'approved', external_reference: 'otro', transaction_amount: 18000 }, pedido)).toMatchObject({
      tipo: 'ignorar',
    });
  });

  it('rechazado marca el pago rechazado sin tocar el estado del pedido', () => {
    expect(decidirPorPago({ status: 'rejected', external_reference: 'p1', transaction_amount: 18000 }, pedido)).toEqual({
      tipo: 'actualizar',
      estado_pago: 'rechazado',
      estado: 'pendiente_pago',
    });
  });

  it('pendiente no cambia nada', () => {
    expect(decidirPorPago({ status: 'in_process', external_reference: 'p1', transaction_amount: 18000 }, pedido).tipo).toBe('ignorar');
  });

  it('un aprobado repetido sobre un pedido ya en preparación no lo hace retroceder', () => {
    const enCocina: PedidoActual = { ...pedido, estado: 'en_preparacion', estado_pago: 'aprobado' };
    expect(decidirPorPago({ status: 'approved', external_reference: 'p1', transaction_amount: 18000 }, enCocina)).toEqual({
      tipo: 'actualizar',
      estado_pago: 'aprobado',
      estado: 'en_preparacion',
    });
  });
});
