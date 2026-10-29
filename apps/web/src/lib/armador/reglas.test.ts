import type { Armado } from '@burritos/shared';
import { IDS, catalogoEjemplo } from '@burritos/shared/test/catalogoEjemplo';
import { describe, expect, it } from 'vitest';
import { cuantas, excesoAlCambiar, limpiarContraCatalogo, motivoBloqueo, puedeAgregar } from './reglas';

const vacio = (tamanoId = IDS.simple): Armado => ({
  tamanoId,
  seleccion: { tortilla: [], salsa: [], carne: [], vegetal: [] },
  cantidad: 1,
});

const dobleLleno: Armado = {
  tamanoId: IDS.doble,
  seleccion: {
    tortilla: [IDS.trigo],
    salsa: [IDS.pico],
    carne: [IDS.pollo, IDS.pollo, IDS.vaca, IDS.vaca],
    vegetal: [IDS.lechuga, IDS.tomate, IDS.cebolla, IDS.choclo, IDS.zanahoria, IDS.repollo],
  },
  cantidad: 1,
};

const simple = catalogoEjemplo.tamanos[0]!;

describe('cuantas', () => {
  it('cuenta por categoría o por ingrediente', () => {
    expect(cuantas(dobleLleno, 'carne')).toBe(4);
    expect(cuantas(dobleLleno, 'carne', IDS.pollo)).toBe(2);
    expect(cuantas(dobleLleno, 'salsa', IDS.guacamole)).toBe(0);
  });
});

describe('puedeAgregar', () => {
  it('respeta el máximo del tamaño', () => {
    expect(puedeAgregar(vacio(), 'carne', catalogoEjemplo)).toBe(true);
    const conDos = { ...vacio(), seleccion: { ...vacio().seleccion, carne: [IDS.pollo, IDS.pollo] } };
    expect(puedeAgregar(conDos, 'carne', catalogoEjemplo)).toBe(false);
    expect(puedeAgregar(dobleLleno, 'vegetal', catalogoEjemplo)).toBe(false);
    expect(puedeAgregar(dobleLleno, 'salsa', catalogoEjemplo)).toBe(true);
  });
});

describe('motivoBloqueo', () => {
  it('pide la tortilla en el paso 1', () => {
    expect(motivoBloqueo(1, vacio(), catalogoEjemplo)).toBe('Elegí una tortilla para seguir');
  });

  it('dice cuántas porciones de carne faltan, en singular o plural', () => {
    const una = { ...vacio(), seleccion: { ...vacio().seleccion, carne: [IDS.pollo] } };
    expect(motivoBloqueo(3, una, catalogoEjemplo)).toBe('Te falta 1 porción de carne (1/2)');
    const doble = { ...vacio(IDS.doble), seleccion: { ...vacio().seleccion, carne: [IDS.pollo] } };
    expect(motivoBloqueo(3, doble, catalogoEjemplo)).toBe('Te faltan 3 porciones de carne (1/4)');
    expect(motivoBloqueo(3, dobleLleno, catalogoEjemplo)).toBeNull();
  });

  it('salsas y vegetales nunca bloquean', () => {
    expect(motivoBloqueo(2, vacio(), catalogoEjemplo)).toBeNull();
    expect(motivoBloqueo(4, vacio(), catalogoEjemplo)).toBeNull();
  });
});

describe('excesoAlCambiar', () => {
  it('doble lleno a simple: sobran 2 carnes y 2 vegetales', () => {
    expect(excesoAlCambiar(dobleLleno, simple)).toEqual([
      { categoria: 'carne', sobran: 2 },
      { categoria: 'vegetal', sobran: 2 },
    ]);
  });

  it('si entra, no hay exceso', () => {
    expect(excesoAlCambiar(vacio(IDS.doble), simple)).toEqual([]);
  });
});

describe('limpiarContraCatalogo', () => {
  it('saca lo que ya no está y dice qué sacó', () => {
    const viejo: Armado = {
      ...dobleLleno,
      seleccion: { ...dobleLleno.seleccion, vegetal: [IDS.lechuga, IDS.noExiste, IDS.espinacaInactiva] },
    };
    const { armado, quitados } = limpiarContraCatalogo(viejo, catalogoEjemplo, { [IDS.noExiste]: 'Rúcula' });
    expect(armado.seleccion.vegetal).toEqual([IDS.lechuga]);
    expect(quitados).toEqual(['Rúcula', 'un ingrediente']);
  });

  it('si el tamaño ya no existe, vuelve al primero', () => {
    const { armado, quitados } = limpiarContraCatalogo({ ...vacio(), tamanoId: IDS.noExiste }, catalogoEjemplo);
    expect(armado.tamanoId).toBe(IDS.simple);
    expect(quitados).toEqual(['el tamaño elegido']);
  });
});
