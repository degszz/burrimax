import { CATEGORIAS, calcularPedido, type Catalogo, type CategoriaSlug, type MetodoPago, type PedidoEntrada } from '@burritos/shared';
import { formatoPesos } from '../formato';

// Arma el pedido tal como se guarda en la base (función `crear_pedido`).
// El precio sale SIEMPRE de calcularPedido con el catálogo de la base: lo que
// mande el cliente sobre precios se ignora (Zod ya lo descarta).

/** Error con un mensaje para mostrarle tal cual al cliente. */
export class ErrorDePedido extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = 'ErrorDePedido';
  }
}

export interface IngredienteSnapshot {
  ingrediente_id: string;
  nombre: string;
  categoria: CategoriaSlug;
  precio: number;
  porciones: number;
}

export interface ItemSnapshot {
  tipo: 'armado' | 'producto';
  producto_id: string | null;
  tamano_id: string | null;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  detalle: Record<string, unknown>;
  ingredientes: IngredienteSnapshot[];
}

export interface PedidoParaGuardar {
  estado: 'pendiente_pago' | 'confirmado';
  cliente_nombre: string;
  cliente_telefono: string;
  cliente_email: string | null;
  tipo_entrega: 'delivery' | 'retiro';
  direccion: string | null;
  referencias: string | null;
  zona_envio_id: string | null;
  metodo_pago: MetodoPago;
  paga_con: number | null;
  subtotal: number;
  costo_envio: number;
  total: number;
  notas: string | null;
  items: ItemSnapshot[];
}

export function armarPedido(
  entrada: PedidoEntrada,
  catalogo: Catalogo,
  pagosActivos: Record<'mercadopago' | 'transferencia' | 'efectivo', boolean>,
): { payload: PedidoParaGuardar; total: number } {
  const metodo = entrada.pago.metodoPago;
  if (metodo === 'stripe' || !pagosActivos[metodo]) throw new ErrorDePedido('Ese medio de pago no está disponible ahora');

  // Tira PedidoInvalidoError si algo no vale (límites, inactivos, zona).
  const calculado = calcularPedido(entrada.items, entrada.entrega, catalogo);

  if (metodo === 'efectivo' && entrada.pago.pagaCon !== undefined && entrada.pago.pagaCon < calculado.total) {
    throw new ErrorDePedido(`Con ${formatoPesos(entrada.pago.pagaCon)} no alcanza: el total es ${formatoPesos(calculado.total)}`);
  }

  const ingredientes = new Map(catalogo.ingredientes.map((i) => [i.id, i]));
  const items: ItemSnapshot[] = calculado.items.map(({ item, precioUnitario, cantidad }) => {
    if (item.tipo === 'producto') {
      const producto = catalogo.productos.find((p) => p.id === item.productoId)!;
      return {
        tipo: 'producto',
        producto_id: producto.id,
        tamano_id: null,
        nombre: producto.nombre,
        cantidad,
        precio_unitario: precioUnitario,
        detalle: {},
        ingredientes: [],
      };
    }

    const { armado } = item;
    const tamano = catalogo.tamanos.find((t) => t.id === armado.tamanoId)!;
    const snapshot: IngredienteSnapshot[] = [];
    const detalle: Record<string, string[]> = {};
    for (const categoria of CATEGORIAS) {
      const conteo = new Map<string, number>();
      for (const id of armado.seleccion[categoria]) conteo.set(id, (conteo.get(id) ?? 0) + 1);
      detalle[categoria] = [];
      for (const [id, porciones] of conteo) {
        const ingrediente = ingredientes.get(id)!;
        snapshot.push({ ingrediente_id: id, nombre: ingrediente.nombre, categoria, precio: ingrediente.precioExtra, porciones });
        detalle[categoria].push(porciones > 1 ? `${ingrediente.nombre} ×${porciones}` : ingrediente.nombre);
      }
    }
    return {
      tipo: 'armado',
      producto_id: null,
      tamano_id: tamano.id,
      nombre: armado.nombrePersonalizado?.trim() || `Burrito ${tamano.nombre.toLowerCase()}`,
      cantidad,
      precio_unitario: precioUnitario,
      detalle: { incluye_papas: true, tamano: tamano.nombre, ...detalle },
      ingredientes: snapshot,
    };
  });

  const { cliente, entrega, pago } = entrada;
  return {
    total: calculado.total,
    payload: {
      // Efectivo se paga al recibir: entra confirmado. El resto espera el pago.
      estado: metodo === 'efectivo' ? 'confirmado' : 'pendiente_pago',
      cliente_nombre: cliente.nombre,
      cliente_telefono: cliente.telefono,
      cliente_email: cliente.email ?? null,
      tipo_entrega: entrega.tipoEntrega,
      direccion: entrega.tipoEntrega === 'delivery' ? entrega.direccion : null,
      referencias: entrega.tipoEntrega === 'delivery' ? (entrega.referencias ?? null) : null,
      zona_envio_id: entrega.tipoEntrega === 'delivery' ? entrega.zonaEnvioId : null,
      metodo_pago: metodo,
      paga_con: metodo === 'efectivo' ? (pago.pagaCon ?? null) : null,
      subtotal: calculado.subtotal,
      costo_envio: calculado.costoEnvio,
      total: calculado.total,
      notas: entrada.notas ?? null,
      items,
    },
  };
}
