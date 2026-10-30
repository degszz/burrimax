import type { APIRoute } from 'astro';

// Transferencia o efectivo cobrado. Mercado Pago no se marca a mano: lo
// confirma el webhook (la base lo rechaza).
export const POST: APIRoute = async ({ params, request, locals }) => {
  if (!request.headers.get('content-type')?.includes('application/json')) return new Response('Formato inválido', { status: 415 });
  if (!params.id) return Response.json({ error: 'Falta el pedido' }, { status: 400 });
  const { error } = await locals.supabase.rpc('marcar_pagado', { p_id: params.id });
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ ok: true });
};
