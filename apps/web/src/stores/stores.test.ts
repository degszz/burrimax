import { IDS, catalogoEjemplo } from '@burritos/shared/test/catalogoEjemplo';
import { beforeEach, describe, expect, it } from 'vitest';
import { instalarLocalStorage } from '../test/localStorageFalso';
import { armadoActual, useArmador } from './armador';
import { useCarrito } from './carrito';

describe('useArmador', () => {
  beforeEach(() => {
    instalarLocalStorage();
    useArmador.getState().reset(IDS.simple);
  });

  it('la tortilla se reemplaza al elegir otra y se saca al tocar la misma', () => {
    const { alternar } = useArmador.getState();
    alternar('tortilla', IDS.maiz, catalogoEjemplo);
    alternar('tortilla', IDS.trigo, catalogoEjemplo);
    expect(useArmador.getState().seleccion.tortilla).toEqual([IDS.trigo]);
    alternar('tortilla', IDS.trigo, catalogoEjemplo);
    expect(useArmador.getState().seleccion.tortilla).toEqual([]);
  });

  it('no deja pasar el máximo de salsas', () => {
    const { alternar } = useArmador.getState();
    alternar('salsa', IDS.guacamole, catalogoEjemplo);
    alternar('salsa', IDS.pico, catalogoEjemplo);
    alternar('salsa', IDS.crema, catalogoEjemplo);
    expect(useArmador.getState().seleccion.salsa).toEqual([IDS.guacamole, IDS.pico]);
  });

  it('sumarPorcion repite la carne hasta el máximo y restarPorcion saca de a una', () => {
    const { sumarPorcion, restarPorcion } = useArmador.getState();
    sumarPorcion(IDS.pollo, catalogoEjemplo);
    sumarPorcion(IDS.pollo, catalogoEjemplo);
    sumarPorcion(IDS.vaca, catalogoEjemplo);
    expect(useArmador.getState().seleccion.carne).toEqual([IDS.pollo, IDS.pollo]);
    restarPorcion(IDS.pollo);
    expect(useArmador.getState().seleccion.carne).toEqual([IDS.pollo]);
  });

  it('armadoActual arma el objeto para validar y guardar', () => {
    useArmador.getState().alternar('tortilla', IDS.maiz, catalogoEjemplo);
    useArmador.getState().setNombre('El de Juan');
    expect(armadoActual(useArmador.getState())).toMatchObject({
      tamanoId: IDS.simple,
      seleccion: { tortilla: [IDS.maiz] },
      cantidad: 1,
      nombrePersonalizado: 'El de Juan',
    });
  });
});

describe('useCarrito', () => {
  beforeEach(() => {
    instalarLocalStorage();
    useCarrito.setState({ items: [] });
  });

  it('agrega, cambia cantidad y con 0 lo quita', () => {
    const armado = armadoActual(useArmador.getState())!;
    const id = useCarrito.getState().agregar(armado, {});
    useCarrito.getState().cambiarCantidad(id, 3);
    expect(useCarrito.getState().items[0]!.armado.cantidad).toBe(3);
    expect(useCarrito.getState().cantidadBurritos()).toBe(3);
    useCarrito.getState().cambiarCantidad(id, 0);
    expect(useCarrito.getState().items).toEqual([]);
  });
});
