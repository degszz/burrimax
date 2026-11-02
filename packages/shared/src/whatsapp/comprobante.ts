import { normalizar } from './intencion';
import { pesos } from './textos';

// Comprobante de transferencia leído por la IA → ¿coincide con el pedido?
// Es SOLO una pre-aprobación para contestarle rápido al cliente: el pago lo
// confirma Max con "Llegó la transferencia" (una foto se puede falsificar).

export interface ComprobanteLeido {
  esComprobante: boolean;
  monto: number | null;
  alias: string | null;
  cvu: string | null;
  titular: string | null;
  numeroOperacion: string | null;
}

export interface DestinoTransferencia {
  alias: string | null;
  cvu: string | null;
  titular: string | null;
}

export type Evaluacion = { coincide: true } | { coincide: false; motivo: string };

const palabras = (s: string) => new Set(normalizar(s).split(/[^a-z0-9]+/).filter((p) => p.length >= 3));

/** Nombres en otro orden o con segundo nombre: alcanza con que coincidan 2 palabras (o la única que hay). */
function mismoTitular(a: string, b: string): boolean {
  const pa = palabras(a);
  const pb = palabras(b);
  const comunes = [...pa].filter((p) => pb.has(p)).length;
  return comunes >= Math.min(2, pa.size, pb.size) && comunes > 0;
}

function destinoCoincide(l: ComprobanteLeido, d: DestinoTransferencia): boolean | null {
  const leyoAlgo = !!(l.alias || l.cvu || l.titular);
  const tenemosAlgo = !!(d.alias || d.cvu || d.titular);
  if (!leyoAlgo || !tenemosAlgo) return null; // no hay con qué comparar
  if (l.cvu && d.cvu && l.cvu.replace(/\D/g, '') === d.cvu.replace(/\D/g, '')) return true;
  if (l.alias && d.alias && normalizar(l.alias) === normalizar(d.alias)) return true;
  if (l.titular && d.titular && mismoTitular(l.titular, d.titular)) return true;
  return false;
}

export function evaluarComprobante(l: ComprobanteLeido, total: number, destino: DestinoTransferencia, usadoEnOtroPedido: boolean): Evaluacion {
  if (!l.esComprobante) return { coincide: false, motivo: 'no parece un comprobante de transferencia' };
  if (usadoEnOtroPedido) return { coincide: false, motivo: 'ese comprobante ya se usó en otro pedido' };
  if (l.monto == null) return { coincide: false, motivo: 'no pude leer el monto' };
  if (Math.round(l.monto) !== total) return { coincide: false, motivo: `el monto (${pesos(l.monto)}) no es el del pedido (${pesos(total)})` };
  if (destinoCoincide(l, destino) === false) return { coincide: false, motivo: 'no figura nuestro alias, CVU ni titular' };
  return { coincide: true };
}
