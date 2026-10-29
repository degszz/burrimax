import { describe, expect, it } from 'vitest';
import { IDS } from '../test/catalogoEjemplo';
import { pedidoSchema } from './schema';

const pedidoBase = {
  cliente: { nombre: 'Juana', telefono: '11 2345-6789' },
  entrega: { tipoEntrega: 'retiro' },
  pago: { metodoPago: 'transferencia' },
  items: [{ tipo: 'producto', productoId: IDS.comboClasico, cantidad: 1 }],
};

describe('pedidoSchema', () => {
  it('acepta un pedido mínimo de retiro', () => {
    expect(pedidoSchema.safeParse(pedidoBase).success).toBe(true);
  });

  it('descarta el total que manda el cliente', () => {
    const resultado = pedidoSchema.parse({ ...pedidoBase, total: 1 });
    expect(resultado).not.toHaveProperty('total');
  });

  it('rechaza teléfonos sin código de área', () => {
    const r = pedidoSchema.safeParse({ ...pedidoBase, cliente: { nombre: 'Juana', telefono: '2345-6789' } });
    expect(r.success).toBe(false);
  });

  it('acepta teléfonos con +54 9', () => {
    const r = pedidoSchema.safeParse({ ...pedidoBase, cliente: { nombre: 'Juana', telefono: '+54 9 11 2345-6789' } });
    expect(r.success).toBe(true);
  });

  it('email vacío cuenta como no cargado', () => {
    const r = pedidoSchema.parse({ ...pedidoBase, cliente: { ...pedidoBase.cliente, email: '' } });
    expect(r.cliente.email).toBeUndefined();
  });

  it('delivery exige dirección y zona', () => {
    const r = pedidoSchema.safeParse({ ...pedidoBase, entrega: { tipoEntrega: 'delivery' } });
    expect(r.success).toBe(false);
  });

  it('"¿Con cuánto pagás?" solo vale para efectivo', () => {
    const conMp = pedidoSchema.safeParse({ ...pedidoBase, pago: { metodoPago: 'mercadopago', pagaCon: 20000 } });
    const conEfectivo = pedidoSchema.safeParse({ ...pedidoBase, pago: { metodoPago: 'efectivo', pagaCon: 20000 } });
    expect(conMp.success).toBe(false);
    expect(conEfectivo.success).toBe(true);
  });

  it('pedido sin ítems no vale', () => {
    expect(pedidoSchema.safeParse({ ...pedidoBase, items: [] }).success).toBe(false);
  });
});
