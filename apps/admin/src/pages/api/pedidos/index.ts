import type { APIRoute } from 'astro';
import type { ComprobanteTablero, PedidoTablero } from '@/lib/pedidos';

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

  const comprobantes = await comprobantesPorPedido(
    locals.supabase,
    (data ?? []).filter((p) => p.metodo_pago === 'transferencia' && p.estado_pago !== 'aprobado').map((p) => p.id),
  );

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
    comprobante: comprobantes.get(p.id) ?? null,
  }));

  return Response.json({ pedidos, ahora: new Date().toISOString() });
};

/** El último comprobante que llegó por WhatsApp de cada pedido, con un link privado de 1 hora. */
async function comprobantesPorPedido(db: App.Locals['supabase'], ids: string[]): Promise<Map<string, ComprobanteTablero>> {
  const resultado = new Map<string, ComprobanteTablero>();
  if (!ids.length) return resultado;
  const { data } = await db
    .from('whatsapp_mensajes')
    .select('pedido_id, media_path, analisis, created_at')
    .in('pedido_id', ids)
    .not('media_path', 'is', null)
    .order('created_at', { ascending: false });
  const ultimos = new Map<string, { media_path: string; analisis: unknown }>();
  for (const c of data ?? []) if (c.pedido_id && c.media_path && !ultimos.has(c.pedido_id)) ultimos.set(c.pedido_id, { media_path: c.media_path, analisis: c.analisis });
  if (!ultimos.size) return resultado;

  const rutas = [...ultimos.values()].map((c) => c.media_path);
  const { data: firmadas } = await db.storage.from('comprobantes').createSignedUrls(rutas, 3600);
  const urlPorRuta = new Map((firmadas ?? []).map((f) => [f.path, f.signedUrl]));

  for (const [pedidoId, c] of ultimos) {
    const a = (c.analisis ?? {}) as { coincide?: boolean; monto?: number | null; motivo?: string };
    resultado.set(pedidoId, {
      url: urlPorRuta.get(c.media_path) ?? null,
      coincide: typeof a.coincide === 'boolean' ? a.coincide : null,
      monto: typeof a.monto === 'number' ? a.monto : null,
      motivo: a.motivo ?? null,
    });
  }
  return resultado;
}
