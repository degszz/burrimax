import { describe, expect, it } from 'vitest';
import type { Armado } from './armador/schema';
import { PedidoInvalidoError, calcularPedido, precioUnitarioArmado } from './pricing';
import { IDS, catalogoEjemplo } from './test/catalogoEjemplo';

const armadoSimple: Armado = {
  tamanoId: IDS.simple,
  seleccion: {
    tapa: [IDS.harina],
    proteina: [IDS.carne],
    relleno: [IDS.arroz, IDS.porotos],
    salsa: [IDS.guacamole],
    agregado: [],
  },
  cantidad: 1,
};

const armadoDobleConAgregados: Armado = {
  tamanoId: IDS.doble,
  seleccion: {
    tapa: [IDS.sinTacc],
    proteina: [IDS.carne, IDS.pollo],
    relleno: [IDS.arroz],
    salsa: [],
    agregado: [IDS.extraQueso, IDS.panceta],
  },
  cantidad: 2,
};

function erroresDe(fn: () => unknown) {
  try {
    fn();
  } catch (e) {
    if (e instanceof PedidoInvalidoError) return e.errores;
    throw e;
  }
  throw new Error('Se esperaba PedidoInvalidoError');
}

describe('precioUnitarioArmado', () => {
  it('simple sin extras cuesta el precio base', () => {
    expect(precioUnitarioArmado(armadoSimple, catalogoEjemplo)).toBe(6000);
  });

  it('doble con tapa especial y agregados suma cada extra', () => {
    // 9000 base + 800 sin TACC + 700 extra queso + 1000 panceta
    expect(precioUnitarioArmado(armadoDobleConAgregados, catalogoEjemplo)).toBe(11500);
  });

  it('exceder el límite de rellenos da error', () => {
    const armado: Armado = {
      ...armadoSimple,
      seleccion: {
        ...armadoSimple.seleccion,
        relleno: [IDS.arroz, IDS.porotos, IDS.lechuga, IDS.tomate, IDS.cebolla],
      },
    };
    expect(erroresDe(() => precioUnitarioArmado(armado, catalogoEjemplo))).toContainEqual({
      tipo: 'excede',
      categoria: 'relleno',
      maximo: 4,
      elegidos: 5,
    });
  });

  it('dos proteínas en un simple da error', () => {
    const armado: Armado = {
      ...armadoSimple,
      seleccion: { ...armadoSimple.seleccion, proteina: [IDS.carne, IDS.pollo] },
    };
    expect(erroresDe(() => precioUnitarioArmado(armado, catalogoEjemplo))).toContainEqual({
      tipo: 'excede',
      categoria: 'proteina',
      maximo: 1,
      elegidos: 2,
    });
  });

  it('sin proteína da error', () => {
    const armado: Armado = { ...armadoSimple, seleccion: { ...armadoSimple.seleccion, proteina: [] } };
    expect(erroresDe(() => precioUnitarioArmado(armado, catalogoEjemplo))).toContainEqual({
      tipo: 'faltan',
      categoria: 'proteina',
      minimo: 1,
      elegidos: 0,
    });
  });

  it('dos tapas distintas en una doble da error', () => {
    const armado: Armado = {
      ...armadoDobleConAgregados,
      seleccion: { ...armadoDobleConAgregados.seleccion, tapa: [IDS.harina, IDS.sinTacc] },
    };
    expect(erroresDe(() => precioUnitarioArmado(armado, catalogoEjemplo))).toContainEqual({
      tipo: 'excede',
      categoria: 'tapa',
      maximo: 1,
      elegidos: 2,
    });
  });

  it('ingrediente inactivo, inexistente o de otra categoría da error', () => {
    const armado: Armado = {
      ...armadoSimple,
      seleccion: {
        ...armadoSimple.seleccion,
        tapa: [IDS.espinacaInactiva],
        relleno: [IDS.noExiste],
        salsa: [IDS.carne],
      },
    };
    const errores = erroresDe(() => precioUnitarioArmado(armado, catalogoEjemplo));
    expect(errores).toContainEqual({ tipo: 'ingrediente_invalido', categoria: 'tapa', ingredienteId: IDS.espinacaInactiva });
    expect(errores).toContainEqual({ tipo: 'ingrediente_invalido', categoria: 'relleno', ingredienteId: IDS.noExiste });
    expect(errores).toContainEqual({ tipo: 'ingrediente_invalido', categoria: 'salsa', ingredienteId: IDS.carne });
  });

  it('ingrediente repetido da error (no se puede cobrar dos veces el mismo extra)', () => {
    const armado: Armado = {
      ...armadoDobleConAgregados,
      seleccion: { ...armadoDobleConAgregados.seleccion, agregado: [IDS.panceta, IDS.panceta] },
    };
    expect(erroresDe(() => precioUnitarioArmado(armado, catalogoEjemplo))).toContainEqual({
      tipo: 'ingrediente_repetido',
      categoria: 'agregado',
      ingredienteId: IDS.panceta,
    });
  });

  it('tamaño inexistente da error', () => {
    const armado: Armado = { ...armadoSimple, tamanoId: IDS.noExiste };
    expect(erroresDe(() => precioUnitarioArmado(armado, catalogoEjemplo))).toContainEqual({ tipo: 'tamano_invalido' });
  });
});

describe('calcularPedido', () => {
  it('suma ítems por cantidad más el envío de la zona', () => {
    const resultado = calcularPedido(
      [
        { tipo: 'armado', armado: armadoDobleConAgregados },
        { tipo: 'producto', productoId: IDS.comboClasico, cantidad: 1 },
      ],
      { tipoEntrega: 'delivery', zonaEnvioId: IDS.zonaCentro },
      catalogoEjemplo,
    );
    expect(resultado.items.map((i) => [i.precioUnitario, i.cantidad, i.subtotal])).toEqual([
      [11500, 2, 23000],
      [12000, 1, 12000],
    ]);
    expect(resultado.subtotal).toBe(35000);
    expect(resultado.costoEnvio).toBe(1500);
    expect(resultado.total).toBe(36500);
  });

  it('retiro en el local no cobra envío', () => {
    const resultado = calcularPedido([{ tipo: 'armado', armado: armadoSimple }], { tipoEntrega: 'retiro' }, catalogoEjemplo);
    expect(resultado.costoEnvio).toBe(0);
    expect(resultado.total).toBe(6000);
  });

  it('zona inactiva o producto inactivo da error', () => {
    const errores = erroresDe(() =>
      calcularPedido(
        [{ tipo: 'producto', productoId: IDS.bebidaInactiva, cantidad: 1 }],
        { tipoEntrega: 'delivery', zonaEnvioId: IDS.zonaInactiva },
        catalogoEjemplo,
      ),
    );
    expect(errores).toContainEqual({ tipo: 'producto_invalido', productoId: IDS.bebidaInactiva });
    expect(errores).toContainEqual({ tipo: 'zona_invalida', zonaEnvioId: IDS.zonaInactiva });
  });
});
