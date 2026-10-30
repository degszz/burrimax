import type { Armado, Catalogo } from '@burritos/shared';
import { describir } from './armador/reglas';
import { formatoPesos } from './formato';

export interface DatosMensaje {
  /** null: el pedido no se pudo guardar en la web; va solo por WhatsApp. */
  numero: number | null;
  nombre: string;
  items: { armado: Armado; precio: number }[];
  entrega: { tipo: 'delivery'; direccion: string; referencias?: string; zona?: string } | { tipo: 'retiro' };
  pago: { metodo: string; pagaCon?: number };
  envio: number;
  total: number;
  notas?: string;
  urlSeguimiento: string | null;
}

const NOMBRES_PAGO: Record<string, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  mercadopago: 'Mercado Pago',
};

/** Texto del pedido listo para mandar por WhatsApp al local. */
export function mensajePedido(datos: DatosMensaje, catalogo: Catalogo): string {
  const numero = datos.numero ? ` #${String(datos.numero).padStart(4, '0')}` : '';
  const lineas: string[] = [`¡Hola! Soy ${datos.nombre.trim()} y te mando mi pedido${numero} 🌯`, ''];

  for (const { armado, precio } of datos.items) {
    const tamano = catalogo.tamanos.find((t) => t.id === armado.tamanoId);
    const titulo = armado.nombrePersonalizado ?? `Burrito ${tamano?.nombre.toLowerCase() ?? ''}`.trim();
    lineas.push(`*${armado.cantidad} × ${titulo}* — ${formatoPesos(precio * armado.cantidad)}`);
    const partes: [string, string[]][] = [
      ['Tortilla', armado.seleccion.tortilla],
      ['Salsas', armado.seleccion.salsa],
      ['Carne', armado.seleccion.carne],
      ['Vegetales', armado.seleccion.vegetal],
    ];
    for (const [nombre, ids] of partes) {
      const texto = describir(ids, catalogo);
      if (texto) lineas.push(`   • ${nombre}: ${texto}`);
    }
    lineas.push('   • Con papas fritas');
  }

  lineas.push('');
  if (datos.entrega.tipo === 'delivery') {
    const zona = datos.entrega.zona ? ` (${datos.entrega.zona})` : '';
    lineas.push(`📍 Envío a: ${datos.entrega.direccion}${zona}`);
    if (datos.entrega.referencias) lineas.push(`   ${datos.entrega.referencias}`);
    lineas.push(`🛵 Envío: ${formatoPesos(datos.envio)}`);
  } else {
    lineas.push('🏪 Retiro en el local');
  }
  const pagaCon = datos.pago.pagaCon ? ` (pago con ${formatoPesos(datos.pago.pagaCon)})` : '';
  lineas.push(`💵 Pago: ${NOMBRES_PAGO[datos.pago.metodo] ?? datos.pago.metodo}${pagaCon}`);
  if (datos.notas) lineas.push(`📝 ${datos.notas}`);
  lineas.push(`*Total: ${formatoPesos(datos.total)}*`);
  if (datos.urlSeguimiento) lineas.push('', `Seguimiento: ${datos.urlSeguimiento}`);

  return lineas.join('\n');
}

/** Link que abre WhatsApp (la app en el celular) con el mensaje ya escrito. */
export function linkWhatsapp(numero: string, mensaje: string): string {
  // Directo a api.whatsapp.com: el atajo wa.me rompe los emojis al redirigir (🌯 → �).
  return `https://api.whatsapp.com/send?phone=${numero.replace(/\D/g, '')}&text=${encodeURIComponent(mensaje)}`;
}
