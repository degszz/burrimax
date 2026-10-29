import type { Armado } from '@burritos/shared';
import { IDS } from '@burritos/shared/test/catalogoEjemplo';
import { beforeEach, describe, expect, it } from 'vitest';
import { instalarLocalStorage } from '../test/localStorageFalso';
import { formatoPesos } from './formato';
import { CLAVE_MIS_COMBOS, borrar, guardar, listar } from './misCombos';

const armado: Armado = {
  tamanoId: IDS.simple,
  seleccion: { tortilla: [IDS.maiz], salsa: [], carne: [IDS.pollo, IDS.pollo], vegetal: [IDS.choclo] },
  cantidad: 1,
};

describe('misCombos', () => {
  beforeEach(() => {
    instalarLocalStorage();
  });

  it('guarda, lista del más nuevo al más viejo y borra', () => {
    const a = guardar(armado, 'El de Juan', {})!;
    const b = guardar(armado, 'Para mamá', {})!;
    expect(listar().map((c) => c.nombre)).toEqual(['Para mamá', 'El de Juan']);
    borrar(a.id);
    expect(listar().map((c) => c.id)).toEqual([b.id]);
  });

  it('sin nombre usa "Mi combo"', () => {
    expect(guardar(armado, '   ', {})!.nombre).toBe('Mi combo');
  });

  it('guarda como máximo 10: el 11º saca al más viejo', () => {
    for (let i = 1; i <= 11; i++) guardar(armado, `Combo ${i}`, {});
    const nombres = listar().map((c) => c.nombre);
    expect(nombres).toHaveLength(10);
    expect(nombres).not.toContain('Combo 1');
    expect(nombres[0]).toBe('Combo 11');
  });

  it('con JSON roto o datos con otra forma devuelve lo que se pueda leer', () => {
    localStorage.setItem(CLAVE_MIS_COMBOS, '{no es json');
    expect(listar()).toEqual([]);
    localStorage.setItem(CLAVE_MIS_COMBOS, JSON.stringify([{ id: 'x' }, { nada: true }]));
    expect(listar()).toEqual([]);
  });

  it('si localStorage está bloqueado no rompe', () => {
    instalarLocalStorage({ roto: true });
    expect(listar()).toEqual([]);
    expect(guardar(armado, 'X', {})).toBeNull();
  });
});

describe('formatoPesos', () => {
  it('pesos argentinos sin decimales', () => {
    expect(formatoPesos(9000)).toBe('$9.000');
    expect(formatoPesos(13500)).toBe('$13.500');
    expect(formatoPesos(0)).toBe('$0');
  });
});
