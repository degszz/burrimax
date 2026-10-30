import { describe, expect, it } from 'vitest';
import { HORARIOS_VACIOS, copiarHorarios, estadoApertura, normalizarHorarios, textoApertura, type Horarios } from './horarios';

// Argentina es UTC-3 todo el año: las 20:00 de AR son las 23:00 UTC.
const ar = (fechaHora: string) => new Date(`${fechaHora}:00-03:00`);

// 2026-10-30 es viernes.
const semana: Horarios = {
  ...copiarHorarios(HORARIOS_VACIOS),
  mar: [{ desde: '19:30', hasta: '23:30' }],
  vie: [
    { desde: '12:00', hasta: '15:00' },
    { desde: '20:00', hasta: '01:00' },
  ],
  sab: [{ desde: '20:00', hasta: '02:00' }],
};

describe('horarios', () => {
  it('abierto dentro de un turno, con la hora de cierre', () => {
    expect(estadoApertura('automatico', semana, ar('2026-10-30T13:00'))).toMatchObject({ abierto: true, cierraA: '15:00' });
  });

  it('entre dos turnos del mismo día: abre más tarde hoy', () => {
    const e = estadoApertura('automatico', semana, ar('2026-10-30T16:00'));
    expect(e).toMatchObject({ abierto: false, proxima: { dia: 'vie', desde: '20:00', enDias: 0 } });
    expect(textoApertura(e)).toBe('Abrimos hoy a las 20:00');
  });

  it('turno que cruza la medianoche sigue abierto el día siguiente', () => {
    // sábado 00:30 → sigue el turno del viernes (hasta 01:00)
    expect(estadoApertura('automatico', semana, ar('2026-10-31T00:30'))).toMatchObject({ abierto: true, cierraA: '01:00' });
    // sábado 01:30 → ya cerró; abre sábado 20:00
    const e = estadoApertura('automatico', semana, ar('2026-10-31T01:30'));
    expect(e).toMatchObject({ abierto: false, proxima: { dia: 'sab', desde: '20:00', enDias: 0 } });
  });

  it('busca el próximo día que abre', () => {
    // domingo 15:00 → no abre ni domingo ni lunes; abre el martes
    const e = estadoApertura('automatico', semana, ar('2026-11-01T15:00'));
    expect(textoApertura(e)).toBe('Abrimos el martes a las 19:30');
    // lunes → "mañana"
    expect(textoApertura(estadoApertura('automatico', semana, ar('2026-11-02T10:00')))).toBe('Abrimos mañana a las 19:30');
  });

  it('modo manual pisa los horarios', () => {
    expect(estadoApertura('abierto', HORARIOS_VACIOS, ar('2026-10-30T04:00'))).toMatchObject({ abierto: true, manual: true });
    const cerrado = estadoApertura('cerrado', semana, ar('2026-10-30T13:00'));
    expect(cerrado.abierto).toBe(false);
    // cerrado a mano no promete abrir hoy
    expect(cerrado.proxima?.enDias).toBeGreaterThan(0);
  });

  it('sin horarios cargados queda cerrado', () => {
    const e = estadoApertura('automatico', HORARIOS_VACIOS, ar('2026-10-30T21:00'));
    expect(e.abierto).toBe(false);
    expect(textoApertura(e)).toBe('Cerrado por ahora');
  });

  it('entiende el formato viejo del seed', () => {
    const h = normalizarHorarios({ 'lun-dom': '19:30-23:30' });
    expect(h.lun).toEqual([{ desde: '19:30', hasta: '23:30' }]);
    expect(h.dom).toEqual([{ desde: '19:30', hasta: '23:30' }]);
    expect(normalizarHorarios({ 'vie-lun': '20:00-01:00' }).mar).toEqual([]);
    expect(normalizarHorarios({ 'vie-lun': '20:00-01:00' }).dom).toHaveLength(1);
    expect(normalizarHorarios(null)).toEqual(HORARIOS_VACIOS);
  });
});
