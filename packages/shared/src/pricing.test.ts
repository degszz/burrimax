import { describe, expect, it } from 'vitest';
import type { Armado } from './armador/schema';
import { PedidoInvalidoError, calcularPedido, contarRelleno, maximoRelleno, precioUnitarioArmado, precioVistaPrevia } from './pricing';
import { IDS, catalogoEjemplo } from './test/catalogoEjemplo';

const simple: Armado = {
  tamanoId: IDS.simple,
  seleccion: {
    tortilla: [IDS.maiz],
    salsa: [IDS.guacamole, IDS.pico],
    carne: [IDS.pollo, IDS.pollo],
    vegetal: [IDS.lechuga, IDS.tomate, IDS.cebolla, IDS.choclo],
  },
  cantidad: 1,
};

const doble: Armado = {
  tamanoId: IDS.doble,
  seleccion: {
    tortilla: [IDS.trigo],
    salsa: [IDS.crema],
    carne: [IDS.vaca, IDS.vaca, IDS.pollo, IDS.pescado],
    vegetal: [IDS.lechuga, IDS.tomate, IDS.cebolla, IDS.choclo, IDS.zanahoria, IDS.repollo],
  },
  cantidad: 2,
};

function con(armado: Armado, cambios: Partial<Armado['seleccion']>): Armado {
  return { ...armado, seleccion: { ...armado.seleccion, ...cambios } };
}

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
  it('simple con 2 porciones del mismo pollo cuesta el precio base (papas incluidas)', () => {
    expect(precioUnitarioArmado(simple, catalogoEjemplo)).toBe(9000);
  });

  it('cada porción de carne suma su extra', () => {
    // 13500 base + 500 de una porción de pescado
    expect(precioUnitarioArmado(doble, catalogoEjemplo)).toBe(14000);
    const dosPescados = con(simple, { carne: [IDS.pescado, IDS.pescado] });
    expect(precioUnitarioArmado(dosPescados, catalogoEjemplo)).toBe(10000);
  });

  it('simple con 1 sola porción de carne da error', () => {
    expect(erroresDe(() => precioUnitarioArmado(con(simple, { carne: [IDS.pollo] }), catalogoEjemplo))).toContainEqual({
      tipo: 'faltan',
      categoria: 'carne',
      minimo: 2,
      elegidos: 1,
    });
  });

  it('doble con 3 porciones da error y con 5 también', () => {
    expect(erroresDe(() => precioUnitarioArmado(con(doble, { carne: [IDS.vaca, IDS.vaca, IDS.pollo] }), catalogoEjemplo))).toContainEqual({
      tipo: 'faltan',
      categoria: 'carne',
      minimo: 4,
      elegidos: 3,
    });
    const cinco = con(doble, { carne: [IDS.vaca, IDS.vaca, IDS.pollo, IDS.pollo, IDS.pollo] });
    expect(erroresDe(() => precioUnitarioArmado(cinco, catalogoEjemplo))).toContainEqual({
      tipo: 'excede',
      categoria: 'carne',
      maximo: 4,
      elegidos: 5,
    });
  });

  it('5 vegetales en un simple da error', () => {
    const armado = con(simple, { vegetal: [IDS.lechuga, IDS.tomate, IDS.cebolla, IDS.choclo, IDS.huevo] });
    expect(erroresDe(() => precioUnitarioArmado(armado, catalogoEjemplo))).toContainEqual({
      tipo: 'excede',
      categoria: 'vegetal',
      maximo: 4,
      elegidos: 5,
    });
  });

  it('3 salsas da error', () => {
    const armado = con(simple, { salsa: [IDS.guacamole, IDS.pico, IDS.crema] });
    expect(erroresDe(() => precioUnitarioArmado(armado, catalogoEjemplo))).toContainEqual({
      tipo: 'excede',
      categoria: 'salsa',
      maximo: 2,
      elegidos: 3,
    });
  });

  it('sin tortilla o con dos tortillas da error', () => {
    expect(erroresDe(() => precioUnitarioArmado(con(simple, { tortilla: [] }), catalogoEjemplo))).toContainEqual({
      tipo: 'faltan',
      categoria: 'tortilla',
      minimo: 1,
      elegidos: 0,
    });
    expect(erroresDe(() => precioUnitarioArmado(con(doble, { tortilla: [IDS.maiz, IDS.trigo] }), catalogoEjemplo))).toContainEqual({
      tipo: 'excede',
      categoria: 'tortilla',
      maximo: 1,
      elegidos: 2,
    });
  });

  it('salsa o vegetal repetido da error; carne repetida no', () => {
    const errores = erroresDe(() =>
      precioUnitarioArmado(con(simple, { salsa: [IDS.pico, IDS.pico], vegetal: [IDS.choclo, IDS.choclo] }), catalogoEjemplo),
    );
    expect(errores).toContainEqual({ tipo: 'ingrediente_repetido', categoria: 'salsa', ingredienteId: IDS.pico });
    expect(errores).toContainEqual({ tipo: 'ingrediente_repetido', categoria: 'vegetal', ingredienteId: IDS.choclo });
    expect(errores.some((e) => e.tipo === 'ingrediente_repetido' && e.categoria === 'carne')).toBe(false);
  });

  it('ingrediente inactivo, inexistente o de otra categoría da error', () => {
    const armado = con(simple, { tortilla: [IDS.espinacaInactiva], salsa: [IDS.noExiste], vegetal: [IDS.pollo] });
    const errores = erroresDe(() => precioUnitarioArmado(armado, catalogoEjemplo));
    expect(errores).toContainEqual({ tipo: 'ingrediente_invalido', categoria: 'tortilla', ingredienteId: IDS.espinacaInactiva });
    expect(errores).toContainEqual({ tipo: 'ingrediente_invalido', categoria: 'salsa', ingredienteId: IDS.noExiste });
    expect(errores).toContainEqual({ tipo: 'ingrediente_invalido', categoria: 'vegetal', ingredienteId: IDS.pollo });
  });

  it('tamaño inexistente da error', () => {
    expect(erroresDe(() => precioUnitarioArmado({ ...simple, tamanoId: IDS.noExiste }, catalogoEjemplo))).toContainEqual({
      tipo: 'tamano_invalido',
    });
  });
});

describe('precioVistaPrevia', () => {
  it('con el armado vacío muestra el precio base del tamaño', () => {
    const vacio: Armado = { tamanoId: IDS.simple, seleccion: { tortilla: [], salsa: [], carne: [], vegetal: [] }, cantidad: 1 };
    expect(precioVistaPrevia(vacio, catalogoEjemplo)).toBe(9000);
  });

  it('suma los extras elegidos aunque el armado esté incompleto, sin tirar error', () => {
    const parcial = con(doble, { carne: [IDS.pescado], vegetal: [] });
    expect(precioVistaPrevia(parcial, catalogoEjemplo)).toBe(14000);
    expect(precioVistaPrevia({ ...parcial, tamanoId: IDS.noExiste }, catalogoEjemplo)).toBe(500);
  });
});

describe('relleno', () => {
  it('cuenta carnes y vegetales, no salsas', () => {
    expect(contarRelleno(simple)).toBe(6);
    expect(contarRelleno(con(simple, { vegetal: [] }))).toBe(2);
  });

  it('el máximo es 6 en simple y 10 en doble', () => {
    expect(maximoRelleno(catalogoEjemplo.tamanos[0]!)).toBe(6);
    expect(maximoRelleno(catalogoEjemplo.tamanos[1]!)).toBe(10);
  });
});

describe('calcularPedido', () => {
  it('suma ítems por cantidad más el envío de la zona', () => {
    const resultado = calcularPedido(
      [
        { tipo: 'armado', armado: doble },
        { tipo: 'producto', productoId: IDS.comboClasico, cantidad: 1 },
      ],
      { tipoEntrega: 'delivery', zonaEnvioId: IDS.zonaCentro },
      catalogoEjemplo,
    );
    expect(resultado.items.map((i) => [i.precioUnitario, i.cantidad, i.subtotal])).toEqual([
      [14000, 2, 28000],
      [10500, 1, 10500],
    ]);
    expect(resultado.total).toBe(28000 + 10500 + 1500);
  });

  it('retiro en el local no cobra envío', () => {
    const resultado = calcularPedido([{ tipo: 'armado', armado: simple }], { tipoEntrega: 'retiro' }, catalogoEjemplo);
    expect(resultado.costoEnvio).toBe(0);
    expect(resultado.total).toBe(9000);
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
