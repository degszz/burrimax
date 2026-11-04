import { describe, expect, it } from 'vitest';
import { mediosDePago } from './mediosDePago';

describe('mediosDePago', () => {
  it('con transferencia y Mercado Pago, Mercado Pago va dentro de Transferencia', () => {
    expect(mediosDePago({ mercadopago: true, transferencia: true, efectivo: true })).toEqual({
      opciones: ['transferencia', 'efectivo'],
      mercadoPagoEnTransferencia: true,
    });
  });

  it('sin transferencia, Mercado Pago queda como opción aparte', () => {
    expect(mediosDePago({ mercadopago: true, transferencia: false, efectivo: true })).toEqual({
      opciones: ['mercadopago', 'efectivo'],
      mercadoPagoEnTransferencia: false,
    });
  });

  it('sin Mercado Pago, Transferencia muestra solo el alias', () => {
    expect(mediosDePago({ mercadopago: false, transferencia: true, efectivo: true })).toEqual({
      opciones: ['transferencia', 'efectivo'],
      mercadoPagoEnTransferencia: false,
    });
  });

  it('solo efectivo', () => {
    expect(mediosDePago({ mercadopago: false, transferencia: false, efectivo: true })).toEqual({
      opciones: ['efectivo'],
      mercadoPagoEnTransferencia: false,
    });
  });
});
