import { PedidoInvalidoError, type PedidoEntrada } from '@burritos/shared';
import { IDS, catalogoEjemplo } from '@burritos/shared/test/catalogoEjemplo';
import { describe, expect, it } from 'vitest';
import { ErrorDePedido, armarPedido } from './armarPedido';

const pagosTodos = { mercadopago: true, transferencia: true, efectivo: true };

const base: PedidoEntrada = {
  cliente: { nombre: 'Juana', telefono: '11 2345-6789' },
  entrega: { tipoEntrega: 'retiro' },
  pago: { metodoPago: 'transferencia' },
  items: [
    {
      tipo: 'armado',
      armado: {
        tamanoId: IDS.simple,
        seleccion: { tortilla: [IDS.maiz], salsa: [IDS.guacamole], carne: [IDS.pescado, IDS.pescado], vegetal: [IDS.lechuga] },
        cantidad: 2,
        nombrePersonalizado: 'El de Juan',
      },
    },
  ],
};

describe('armarPedido', () => {
  it('recalcula el precio en el servidor y arma los snapshots', () => {
    const { payload, total } = armarPedido(base, catalogoEjemplo, pagosTodos);
    // 9000 base + 500 × 2 porciones de pescado = 10000 por burrito, × 2
    expect(total).toBe(20000);
    expect(payload).toMatchObject({
      estado: 'pendiente_pago',
      metodo_pago: 'transferencia',
      tipo_entrega: 'retiro',
      subtotal: 20000,
      costo_envio: 0,
      total: 20000,
      cliente_nombre: 'Juana',
    });
    const item = payload.items[0]!;
    expect(item).toMatchObject({ tipo: 'armado', nombre: 'El de Juan', cantidad: 2, precio_unitario: 10000, tamano_id: IDS.simple });
    expect(item.detalle).toMatchObject({ incluye_papas: true, tamano: 'Simple' });
    // La carne repetida va una sola vez con sus porciones
    expect(item.ingredientes).toContainEqual({ ingrediente_id: IDS.pescado, nombre: 'Pescado', categoria: 'carne', precio: 500, porciones: 2 });
    expect(item.ingredientes).toHaveLength(4);
  });

  it('sin nombre personalizado usa "Burrito simple"', () => {
    const sinNombre = structuredClone(base);
    delete (sinNombre.items[0] as { armado: { nombrePersonalizado?: string } }).armado.nombrePersonalizado;
    expect(armarPedido(sinNombre, catalogoEjemplo, pagosTodos).payload.items[0]!.nombre).toBe('Burrito simple');
  });

  it('efectivo entra confirmado y suma el envío de la zona', () => {
    const conDelivery: PedidoEntrada = {
      ...base,
      entrega: { tipoEntrega: 'delivery', direccion: 'Calle Falsa 123', zonaEnvioId: IDS.zonaCentro },
      pago: { metodoPago: 'efectivo', pagaCon: 25000 },
    };
    const { payload } = armarPedido(conDelivery, catalogoEjemplo, pagosTodos);
    expect(payload).toMatchObject({ estado: 'confirmado', costo_envio: 1500, total: 21500, paga_con: 25000, direccion: 'Calle Falsa 123' });
  });

  it('"¿Con cuánto pagás?" menor al total da error claro', () => {
    const poco: PedidoEntrada = { ...base, pago: { metodoPago: 'efectivo', pagaCon: 1000 } };
    expect(() => armarPedido(poco, catalogoEjemplo, pagosTodos)).toThrow(ErrorDePedido);
    expect(() => armarPedido(poco, catalogoEjemplo, pagosTodos)).toThrow('Con $1.000 no alcanza: el total es $20.000');
  });

  it('un medio de pago apagado no se acepta', () => {
    expect(() => armarPedido(base, catalogoEjemplo, { ...pagosTodos, transferencia: false })).toThrow(
      'Ese medio de pago no está disponible ahora',
    );
  });

  it('un armado inválido no pasa (el servidor no confía en el cliente)', () => {
    const trucho = structuredClone(base);
    (trucho.items[0] as { armado: { seleccion: { carne: string[] } } }).armado.seleccion.carne = [IDS.pollo];
    expect(() => armarPedido(trucho, catalogoEjemplo, pagosTodos)).toThrow(PedidoInvalidoError);
  });
});
