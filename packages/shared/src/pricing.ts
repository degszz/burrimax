import { type Armado, type ErrorArmado, validarArmado } from './armador/schema';
import type { Catalogo, TamanoCatalogo } from './catalogo';
import { CATEGORIAS } from './constantes';
import type { Entrega, ItemPedido } from './pedido/schema';

// Fuente única del precio. En el servidor es la verdad; en el cliente solo
// se usa para mostrar la vista previa con los mismos números.

export type ErrorPedido =
  | ErrorArmado
  | { tipo: 'producto_invalido'; productoId: string }
  | { tipo: 'zona_invalida'; zonaEnvioId: string };

export class PedidoInvalidoError extends Error {
  constructor(readonly errores: ErrorPedido[]) {
    super(`Pedido inválido: ${errores.map((e) => e.tipo).join(', ')}`);
    this.name = 'PedidoInvalidoError';
  }
}

/**
 * Precio base del tamaño (papas incluidas) + `precio_extra` de cada ingrediente
 * elegido. Cada porción de carne suma su extra.
 */
export function precioUnitarioArmado(armado: Armado, catalogo: Catalogo): number {
  const errores = validarArmado(armado, catalogo);
  if (errores.length > 0) throw new PedidoInvalidoError(errores);
  return sumarArmado(armado, catalogo);
}

/**
 * Lo mismo pero sin validar, para mostrar mientras se arma: tamaño desconocido
 * suma 0 e ingredientes desconocidos también.
 */
export function precioVistaPrevia(armado: Armado, catalogo: Catalogo): number {
  return sumarArmado(armado, catalogo);
}

function sumarArmado(armado: Armado, catalogo: Catalogo): number {
  const tamano = catalogo.tamanos.find((t) => t.id === armado.tamanoId);
  const precios = new Map(catalogo.ingredientes.map((i) => [i.id, i.precioExtra]));
  let precio = tamano?.precioBase ?? 0;
  for (const categoria of CATEGORIAS) {
    for (const id of armado.seleccion[categoria]) precio += precios.get(id) ?? 0;
  }
  return precio;
}

/** Relleno = porciones de carne + vegetales (las salsas no cuentan). */
export function contarRelleno(armado: Armado): number {
  return armado.seleccion.carne.length + armado.seleccion.vegetal.length;
}

/** 6 en la simple, 10 en la doble (con los límites de la base). */
export function maximoRelleno(tamano: TamanoCatalogo): number {
  return tamano.maximos.carne + tamano.maximos.vegetal;
}

export interface ItemCalculado {
  item: ItemPedido;
  precioUnitario: number;
  cantidad: number;
  subtotal: number;
}

export interface PedidoCalculado {
  items: ItemCalculado[];
  subtotal: number;
  costoEnvio: number;
  total: number;
}

/** Calcula todo el pedido. Junta todos los errores antes de tirar, para mostrarlos juntos. */
export function calcularPedido(
  items: ItemPedido[],
  entrega: Pick<Extract<Entrega, { tipoEntrega: 'delivery' }>, 'tipoEntrega' | 'zonaEnvioId'> | { tipoEntrega: 'retiro' },
  catalogo: Catalogo,
): PedidoCalculado {
  const errores: ErrorPedido[] = [];
  const calculados: ItemCalculado[] = [];

  for (const item of items) {
    if (item.tipo === 'armado') {
      const erroresArmado = validarArmado(item.armado, catalogo);
      if (erroresArmado.length > 0) {
        errores.push(...erroresArmado);
        continue;
      }
      const precioUnitario = sumarArmado(item.armado, catalogo);
      const cantidad = item.armado.cantidad;
      calculados.push({ item, precioUnitario, cantidad, subtotal: precioUnitario * cantidad });
    } else {
      const producto = catalogo.productos.find((p) => p.id === item.productoId && p.activo);
      if (!producto) {
        errores.push({ tipo: 'producto_invalido', productoId: item.productoId });
        continue;
      }
      calculados.push({ item, precioUnitario: producto.precio, cantidad: item.cantidad, subtotal: producto.precio * item.cantidad });
    }
  }

  let costoEnvio = 0;
  if (entrega.tipoEntrega === 'delivery') {
    const zona = catalogo.zonasEnvio.find((z) => z.id === entrega.zonaEnvioId && z.activo);
    if (zona) costoEnvio = zona.costo;
    else errores.push({ tipo: 'zona_invalida', zonaEnvioId: entrega.zonaEnvioId });
  }

  if (errores.length > 0) throw new PedidoInvalidoError(errores);

  const subtotal = calculados.reduce((suma, i) => suma + i.subtotal, 0);
  return { items: calculados, subtotal, costoEnvio, total: subtotal + costoEnvio };
}
