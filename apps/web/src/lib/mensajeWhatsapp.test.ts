import { IDS, catalogoEjemplo } from '@burritos/shared/test/catalogoEjemplo';
import { describe, expect, it } from 'vitest';
import { linkWhatsapp, mensajePedido } from './mensajeWhatsapp';

const armado = {
  tamanoId: IDS.simple,
  seleccion: { tortilla: [IDS.maiz], salsa: [], carne: [IDS.pollo, IDS.pollo], vegetal: [IDS.choclo] },
  cantidad: 2,
};

describe('mensaje de WhatsApp', () => {
  it('arma el pedido con número, detalle, entrega, pago y total', () => {
    const texto = mensajePedido(
      {
        numero: 12,
        nombre: ' Ana ',
        items: [{ armado, precio: 9000 }],
        entrega: { tipo: 'delivery', direccion: 'Mitre 123', zona: 'Centro' },
        pago: { metodo: 'efectivo', pagaCon: 20000 },
        envio: 1500,
        total: 19500,
        urlSeguimiento: 'https://x.test/pedido/1?t=a',
      },
      catalogoEjemplo,
    );
    expect(texto).toContain('Soy Ana y te mando mi pedido #0012');
    expect(texto).toContain('2 × Burrito simple');
    expect(texto).toMatch(/Carne: .+×2/);
    expect(texto).toContain('Envío a: Mitre 123 (Centro)');
    expect(texto).toContain('Pago: Efectivo');
    expect(texto).toContain('Total:');
    expect(texto).toContain('https://x.test/pedido/1?t=a');
  });

  it('retiro no menciona dirección', () => {
    const texto = mensajePedido(
      { numero: 1, nombre: 'Leo', items: [{ armado, precio: 9000 }], entrega: { tipo: 'retiro' }, pago: { metodo: 'transferencia' }, envio: 0, total: 18000, urlSeguimiento: 'u' },
      catalogoEjemplo,
    );
    expect(texto).toContain('Retiro en el local');
    expect(texto).not.toContain('Envío a');
  });

  it('sin número ni seguimiento (la web no pudo guardarlo) igual arma el mensaje', () => {
    const texto = mensajePedido(
      { numero: null, nombre: 'Leo', items: [{ armado, precio: 9000 }], entrega: { tipo: 'retiro' }, pago: { metodo: 'efectivo' }, envio: 0, total: 18000, urlSeguimiento: null },
      catalogoEjemplo,
    );
    expect(texto).toContain('te mando mi pedido 🌯');
    expect(texto).not.toContain('#');
    expect(texto).not.toContain('Seguimiento');
  });

  it('el link usa solo dígitos y codifica el texto', () => {
    expect(linkWhatsapp('+54 9 2271 468521', 'hola #1')).toBe('https://wa.me/5492271468521?text=hola%20%231');
  });
});
