import { describe, expect, it } from 'vitest';
import { configPagosSchema, cvuDigitosOk } from './configNegocio';

// CBU de ejemplo con dígitos verificadores correctos (el que se usa en la documentación del CBU).
const CBU_OK = '2850590940090418135201';

const base = {
  pagos: { efectivo: true, transferencia: true, mercadopago: false },
  transferencia: { alias: 'burrimax.mp', cvu: CBU_OK, titular: 'Max Pérez' },
};

describe('CVU / CBU', () => {
  it('reconoce los dígitos verificadores', () => {
    expect(cvuDigitosOk(CBU_OK)).toBe(true);
    expect(cvuDigitosOk('2850590940090418135202')).toBe(false); // último dígito cambiado
    expect(cvuDigitosOk('2850591940090418135201')).toBe(false); // error en el primer bloque
    expect(cvuDigitosOk('123')).toBe(false);
  });
});

describe('configPagosSchema', () => {
  it('acepta una configuración completa', () => {
    expect(configPagosSchema.parse(base)).toEqual(base);
  });

  it('limpia espacios y separadores', () => {
    const r = configPagosSchema.parse({
      ...base,
      transferencia: { alias: '  burrimax.mp ', cvu: '2850 5909 4009 0418 1352 01', titular: '  Max Pérez ' },
    });
    expect(r.transferencia).toEqual(base.transferencia);
  });

  it('los datos de transferencia son opcionales: vacío queda en null', () => {
    const r = configPagosSchema.parse({ ...base, transferencia: { alias: '', cvu: ' ', titular: '' } });
    expect(r.transferencia).toEqual({ alias: null, cvu: null, titular: null });
  });

  it('el CVU con dígitos verificadores raros se guarda igual (en la pantalla es solo un aviso)', () => {
    const r = configPagosSchema.parse({ ...base, transferencia: { ...base.transferencia, cvu: '2850590940090418135202' } });
    expect(r.transferencia.cvu).toBe('2850590940090418135202');
  });

  it.each([
    ['alias corto', { alias: 'abc' }, 'transferencia.alias'],
    ['alias con espacios', { alias: 'burri max' }, 'transferencia.alias'],
    ['alias con ñ', { alias: 'muñeco.mp' }, 'transferencia.alias'],
    ['alias de más de 20', { alias: 'a'.repeat(21) }, 'transferencia.alias'],
    ['CVU de 21 dígitos', { cvu: CBU_OK.slice(1) }, 'transferencia.cvu'],
    ['CVU con letras', { cvu: `${CBU_OK.slice(0, 21)}x` }, 'transferencia.cvu'],
    ['titular de una letra', { titular: 'M' }, 'transferencia.titular'],
  ])('rechaza %s', (_caso, cambio, campo) => {
    const r = configPagosSchema.safeParse({ ...base, transferencia: { ...base.transferencia, ...cambio } });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.path.join('.')).toBe(campo);
  });

  it('tiene que quedar al menos un medio de pago prendido', () => {
    const r = configPagosSchema.safeParse({ ...base, pagos: { efectivo: false, transferencia: false, mercadopago: false } });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.path.join('.')).toBe('pagos');
  });

  it('descarta campos que no conoce (Stripe no se prende desde acá)', () => {
    const r = configPagosSchema.parse({ ...base, pagos: { ...base.pagos, stripe: true }, alias_transferencia: 'x' });
    expect(r.pagos).toEqual(base.pagos);
    expect(r).not.toHaveProperty('alias_transferencia');
  });
});
