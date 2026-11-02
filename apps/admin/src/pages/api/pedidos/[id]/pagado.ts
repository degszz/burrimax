import type { APIRoute } from 'astro';
import { avisarEstadoPorWhatsapp } from '@/lib/whatsapp';

// Transferencia o efectivo cobrado. Mercado Pago no se marca a mano: lo
// confirma el webhook (la base lo rechaza).
export const POST: APIRoute = async ({ params, request, locals }) => {
  if (!request.headers.get('content-type')?.includes('application/json')) return new Response('Formato inválido', { status: 415 });
  if (!params.id) return Response.json({ error: 'Falta el pedido' }, { status: 400 });
  const { data: pedido, error } = await locals.supabase.rpc('marcar_pagado', { p_id: params.id });
  if (error) return Response.json({ error: error.message }, { status: 400 });
  // Transferencia confirmada: "tu pedido está confirmado" por WhatsApp si pidió por el bot.
  // Solo si quedó en "confirmado" (si ya estaba en la plancha o en camino, no hay nada nuevo que contar).
  if (pedido && pedido.metodo_pago === 'transferencia' && pedido.estado === 'confirmado') {
    await avisarEstadoPorWhatsapp(locals.supabase, pedido, 'confirmado');
  }
  return Response.json({ ok: true });
};
