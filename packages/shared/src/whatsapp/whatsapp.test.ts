import { describe, expect, it } from 'vitest';
import { HORARIOS_VACIOS, copiarHorarios } from '../horarios';
import { esUrlDeMeta } from './api';
import { evaluarComprobante, type ComprobanteLeido } from './comprobante';
import { firmaMeta, firmaMetaValida } from './firma';
import { detectarIntencion, numeroEnTexto, referenciaPedido } from './intencion';
import { candidatosNacionales, mismoTelefono, nacionalDesdeWaId } from './telefono';
import { avisoEstado, estadoActual, respuestaPedido, textoHorarios, type NegocioBot, type PedidoBot } from './textos';
import { leerAvisoWhatsapp } from './webhook';

const negocio: NegocioBot = {
  nombre: 'Burrimax',
  sitio: 'https://burrimax.vercel.app',
  textoApertura: 'Abierto · cierra 23:30',
  horarios: HORARIOS_VACIOS,
  tamanos: [{ nombre: 'Simple', precioBase: 9000 }],
  transferencia: { alias: 'burri.max.mp', cvu: '0000003100012345678901', titular: 'Maximiliano Figuera' },
  avisoCeliacos: null,
  whatsappAtencion: '5492271468521',
};

const pedido: PedidoBot = {
  numero: 12,
  nombre: 'Ana María López',
  estado: 'pendiente_pago',
  estadoPago: 'pendiente',
  metodoPago: 'transferencia',
  tipoEntrega: 'delivery',
  total: 11500,
  pagaCon: null,
};

describe('teléfonos argentinos', () => {
  it('saca el número nacional del de WhatsApp', () => {
    expect(nacionalDesdeWaId('5492271468521')).toBe('2271468521');
    expect(nacionalDesdeWaId('541112345678')).toBe('1112345678');
    expect(nacionalDesdeWaId('5215512345678')).toBeNull(); // México
  });

  it('entiende cómo lo escribe la gente', () => {
    expect(candidatosNacionales('2271 468521')).toEqual(['2271468521']);
    expect(candidatosNacionales('+54 9 11 1234-5678')).toEqual(['1112345678']);
    expect(candidatosNacionales('02271 15 468521')).toEqual(['2271468521']);
    expect(candidatosNacionales('11 15 1234 5678')).toEqual(['1112345678']);
    expect(candidatosNacionales('468521')).toEqual([]);
  });

  it('compara el WhatsApp con el teléfono del pedido', () => {
    expect(mismoTelefono('5492271468521', '02271-15-468521')).toBe(true);
    expect(mismoTelefono('5492271468521', '2271 468522')).toBe(false);
  });
});

describe('qué quiere el cliente', () => {
  it('reconoce el mensaje del pedido y el link de seguimiento', () => {
    const texto = '¡Hola! Soy Ana y te mando mi pedido #0012 🌯\n\nSeguimiento: https://burrimax.vercel.app/pedido/24dd89b0-f2a3-4177-8a60-fc420fb42b5d?t=0123456789abcdef0123456789abcdef0123';
    expect(detectarIntencion(texto)).toBe('pedido');
    expect(numeroEnTexto(texto)).toBe(12);
    expect(referenciaPedido(texto)).toEqual({ id: '24dd89b0-f2a3-4177-8a60-fc420fb42b5d', token: '0123456789abcdef0123456789abcdef0123' });
  });

  it('entiende preguntas comunes sin tildes ni mayúsculas', () => {
    expect(detectarIntencion('Hola! hasta QUE hora abren?')).toBe('horarios');
    expect(detectarIntencion('hacen delivery a barrio norte?')).toBe('envios');
    expect(detectarIntencion('cuánto sale el doble?')).toBe('precios');
    expect(detectarIntencion('me pasás el alias?')).toBe('transferencia');
    expect(detectarIntencion('tienen algo sin tacc')).toBe('celiacos');
    expect(detectarIntencion('cuánto falta para mi pedido?')).toBe('estado_pedido');
    expect(detectarIntencion('quiero hablar con una persona')).toBe('hablar');
    expect(detectarIntencion('buenas noches')).toBe('saludo');
    expect(detectarIntencion('genial gracias')).toBe('gracias');
    expect(detectarIntencion('asdf qwerty')).toBe('desconocida');
  });

  it('los botones mandan', () => {
    expect(detectarIntencion('Horarios', 'horarios')).toBe('horarios');
    expect(detectarIntencion('Hablar con Max', 'hablar')).toBe('hablar');
    expect(detectarIntencion('cualquier cosa', 'boton-raro')).toBe('desconocida');
  });
});

describe('textos del bot', () => {
  it('agrupa los días con el mismo horario', () => {
    const h = copiarHorarios(HORARIOS_VACIOS);
    for (const d of ['lun', 'mar', 'mie', 'jue'] as const) h[d] = [{ desde: '19:30', hasta: '23:30' }];
    h.vie = [{ desde: '19:30', hasta: '00:30' }];
    h.sab = [{ desde: '19:30', hasta: '00:30' }];
    expect(textoHorarios(h)).toBe('Lunes a jueves: 19:30 a 23:30\nViernes y sábado: 19:30 a 00:30\nDomingo: cerrado');
    expect(textoHorarios(HORARIOS_VACIOS)).toBeNull();
  });

  it('transferencia: monto y datos para copiar', () => {
    const texto = respuestaPedido(pedido, negocio);
    expect(texto).toContain('#0012');
    expect(texto).toContain('*$11.500*');
    expect(texto).toContain('Alias: *burri.max.mp*');
    expect(texto).toContain('comprobante');
    const sinDatos = respuestaPedido(pedido, { ...negocio, transferencia: { alias: null, cvu: null, titular: null } });
    expect(sinDatos).toContain('Max te pasa los datos');
  });

  it('efectivo y Mercado Pago', () => {
    expect(respuestaPedido({ ...pedido, metodoPago: 'efectivo', estado: 'confirmado', pagaCon: 20000 }, negocio)).toContain('Llevamos cambio de $20.000');
    expect(respuestaPedido({ ...pedido, metodoPago: 'mercadopago' }, negocio, 'https://mp.com/x')).toContain('https://mp.com/x');
    expect(respuestaPedido({ ...pedido, metodoPago: 'mercadopago', estadoPago: 'aprobado', estado: 'confirmado' }, negocio)).toContain('ya está pago');
    expect(respuestaPedido({ ...pedido, estado: 'en_camino' }, negocio)).toBe(estadoActual({ ...pedido, estado: 'en_camino' }));
  });

  it('avisos de estado con su plantilla', () => {
    const preparando = avisoEstado('en_preparacion', pedido);
    expect(preparando?.texto).toBe('Hola Ana, tu pedido #0012 ya está en la plancha 🔥. Te avisamos cuando esté listo.');
    expect(preparando?.plantilla).toEqual({ nombre: 'pedido_en_preparacion', parametros: ['Ana', '#0012'] });
    expect(avisoEstado('listo', pedido)).toBeNull(); // delivery: avisa al salir
    expect(avisoEstado('listo', { ...pedido, tipoEntrega: 'retiro' })?.plantilla?.nombre).toBe('pedido_listo_retiro');
    expect(avisoEstado('cancelado', pedido, 'Sin stock')?.plantilla?.parametros).toEqual(['Ana', '#0012', 'Sin stock']);
    expect(avisoEstado('entregado', pedido)?.plantilla).toBeNull();
    expect(avisoEstado('pendiente_pago', pedido)).toBeNull();
  });
});

describe('comprobantes (pre-aprobación)', () => {
  const leido: ComprobanteLeido = { esComprobante: true, monto: 11500, alias: null, cvu: null, titular: 'FIGUERA MAXIMILIANO', numeroOperacion: '123' };
  const destino = negocio.transferencia;

  it('coincide con monto y titular en otro orden', () => {
    expect(evaluarComprobante(leido, 11500, destino, false)).toEqual({ coincide: true });
    expect(evaluarComprobante({ ...leido, titular: null, cvu: '0000003100012345678901' }, 11500, destino, false)).toEqual({ coincide: true });
  });

  it('avisa qué no cierra', () => {
    expect(evaluarComprobante({ ...leido, monto: 1150 }, 11500, destino, false)).toEqual({ coincide: false, motivo: 'el monto ($1.150) no es el del pedido ($11.500)' });
    expect(evaluarComprobante({ ...leido, titular: 'Juan Pérez' }, 11500, destino, false).coincide).toBe(false);
    expect(evaluarComprobante(leido, 11500, destino, true).coincide).toBe(false);
    expect(evaluarComprobante({ ...leido, esComprobante: false }, 11500, destino, false).coincide).toBe(false);
  });
});

describe('firma de Meta', () => {
  it('HMAC-SHA256 conocido', async () => {
    expect(await firmaMeta('The quick brown fox jumps over the lazy dog', 'key')).toBe('f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8');
  });

  it('acepta solo la firma correcta', async () => {
    const cuerpo = '{"object":"whatsapp_business_account"}';
    const firma = await firmaMeta(cuerpo, 'secreto');
    expect(await firmaMetaValida(cuerpo, `sha256=${firma}`, 'secreto')).toBe(true);
    expect(await firmaMetaValida(new TextEncoder().encode(cuerpo), `sha256=${firma}`, 'secreto')).toBe(true);
    expect(await firmaMetaValida(cuerpo + ' ', `sha256=${firma}`, 'secreto')).toBe(false);
    expect(await firmaMetaValida(cuerpo, `sha256=${firma}`, 'otro')).toBe(false);
    expect(await firmaMetaValida(cuerpo, firma, 'secreto')).toBe(false);
    expect(await firmaMetaValida(cuerpo, `sha256=${firma}`, undefined)).toBe(false);
  });

  it('el token solo viaja a Meta', () => {
    expect(esUrlDeMeta('https://lookaside.fbsbx.com/whatsapp_business/attachments/?mid=1')).toBe(true);
    expect(esUrlDeMeta('https://evil.com/fbsbx.com')).toBe(false);
    expect(esUrlDeMeta('https://fbsbx.com.evil.com/x')).toBe(false);
    expect(esUrlDeMeta('http://lookaside.fbsbx.com/x')).toBe(false);
  });
});

describe('aviso de Meta', () => {
  const aviso = (value: unknown) => ({ object: 'whatsapp_business_account', entry: [{ id: 'WABA', changes: [{ field: 'messages', value }] }] });

  it('lee texto, botones y fotos de nuestro número', () => {
    const { mensajes } = leerAvisoWhatsapp(
      aviso({
        messaging_product: 'whatsapp',
        metadata: { phone_number_id: '111', display_phone_number: '5492271000000' },
        contacts: [{ wa_id: '5492271468521', profile: { name: 'Ana' } }],
        messages: [
          { from: '5492271468521', id: 'wamid.1', timestamp: '1', type: 'text', text: { body: 'hola' } },
          { from: '5492271468521', id: 'wamid.2', type: 'interactive', interactive: { type: 'button_reply', button_reply: { id: 'horarios', title: 'Horarios' } } },
          { from: '5492271468521', id: 'wamid.3', type: 'image', image: { id: 'MEDIA1', mime_type: 'image/jpeg' } },
        ],
      }),
      '111',
    );
    expect(mensajes.map((m) => [m.id, m.tipo, m.texto, m.botonId])).toEqual([
      ['wamid.1', 'text', 'hola', null],
      ['wamid.2', 'interactive', 'Horarios', 'horarios'],
      ['wamid.3', 'image', null, null],
    ]);
    expect(mensajes[0]?.nombrePerfil).toBe('Ana');
    expect(mensajes[2]?.media).toEqual({ id: 'MEDIA1', mimeType: 'image/jpeg', nombreArchivo: null });
  });

  it('ignora otros números y lee los estados de envío', () => {
    expect(leerAvisoWhatsapp(aviso({ metadata: { phone_number_id: '999' }, messages: [{ from: '1', id: 'x', type: 'text', text: { body: 'a' } }] }), '111').mensajes).toEqual([]);
    const { estados } = leerAvisoWhatsapp(
      aviso({ metadata: { phone_number_id: '111' }, statuses: [{ id: 'wamid.9', status: 'failed', errors: [{ code: 131047, title: 'Re-engagement message' }] }] }),
      '111',
    );
    expect(estados).toEqual([{ wamid: 'wamid.9', estado: 'fallido', error: '131047 Re-engagement message' }]);
    expect(leerAvisoWhatsapp({ cualquier: 'cosa' }, '111')).toEqual({ mensajes: [], estados: [] });
  });
});
