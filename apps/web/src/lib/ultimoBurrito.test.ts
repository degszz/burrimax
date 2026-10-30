import type { Armado } from '@burritos/shared';
import { IDS, catalogoEjemplo } from '@burritos/shared/test/catalogoEjemplo';
import { beforeEach, describe, expect, it } from 'vitest';
import { instalarLocalStorage } from '../test/localStorageFalso';
import { CLAVE_ULTIMO_BURRITO, guardarUltimo, leerUltimo } from './ultimoBurrito';

const armado: Armado = {
  tamanoId: IDS.simple,
  seleccion: { tortilla: [IDS.maiz], salsa: [], carne: [IDS.pollo, IDS.pollo], vegetal: [IDS.choclo] },
  cantidad: 3,
  nombrePersonalizado: 'El de Juan',
};

describe('ultimoBurrito', () => {
  beforeEach(() => {
    instalarLocalStorage();
  });

  it('sin nada guardado no hay último burrito', () => {
    expect(leerUltimo(catalogoEjemplo)).toBeNull();
  });

  it('guarda el último armado completo (con cantidad 1) y lo devuelve', () => {
    guardarUltimo(armado);
    expect(leerUltimo(catalogoEjemplo)).toEqual({ ...armado, cantidad: 1 });
  });

  it('si algo ya no está en el menú y deja de valer, no se muestra', () => {
    guardarUltimo({ ...armado, seleccion: { ...armado.seleccion, carne: [IDS.noExiste, IDS.pollo] } });
    expect(leerUltimo(catalogoEjemplo)).toBeNull();
  });

  it('con datos rotos no rompe', () => {
    localStorage.setItem(CLAVE_ULTIMO_BURRITO, '{roto');
    expect(leerUltimo(catalogoEjemplo)).toBeNull();
  });
});
