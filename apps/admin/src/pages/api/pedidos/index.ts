import type { APIRoute } from 'astro';
import type { PedidoTablero } from '@/lib/pedidos';

// Pedidos del tablero: todos los que siguen en curso + los terminados de las
// últimas 12 h (para poder ver lo que se entregó hoy). Lee con RLS de admin.
export const GET: APIRoute = async ({ locals }) => {
  const desde = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
  const { data, error } = await locals.supabase
    .from('pedidos')
    .select(
      'id, numero, estado, estado_pago, metodo_pago, tipo_entrega, cliente_nombre, cliente_telefono, direccion, referencias, notas, total, paga_con, created_at, pedido_items(id, nombre, cantidad, pedido_item_ingredientes(nombre, categoria, porciones))',
    )
    .or(`estado.not.in.(entregado,cancelado),created_at.gte.${desde}`)
    .order('created_at', { ascending: true })
    .limit(200);

  if (error) return Response.json({ error: 'No pudimos leer los pedidos' }, { status: 500 });

  const pedidos: PedidoTablero[] = (data ?? []).map((p) => ({
    id: p.id,
    numero: p.numero,
    estado: p.estado,
    estadoPago: p.estado_pago,
    metodoPago: p.metodo_pago,
    tipoEntrega: p.tipo_entrega,
    cliente: p.cliente_nombre,
    telefono: p.cliente_telefono,
    direccion: p.direccion,
    referencias: p.referencias,
    notas: p.notas,
    total: p.total,
    pagaCon: p.paga_con,
    creado: p.created_at,
    items: (p.pedido_items ?? []).map((i) => ({
      id: i.id,
      nombre: i.nombre,
      cantidad: i.cantidad,
      ingredientes: (i.pedido_item_ingredientes ?? []).map((g) => ({ nombre: g.nombre, categoria: g.categoria, porciones: g.porciones })),
    })),
  }));

  return Response.json({ pedidos, ahora: new Date().toISOString() });
};
