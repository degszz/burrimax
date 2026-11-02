import { firmaMetaValida, leerAvisoWhatsapp } from '@burritos/shared/whatsapp';
import type { APIRoute } from 'astro';
import { cargarDatosTienda } from '@/lib/catalogo.server';
import { clienteServidor } from '@/lib/supabaseServidor';
import { actualizarEstados, credencialesWhatsapp, negocioParaBot, procesarMensaje } from '@/lib/whatsapp/bot';

export const prerender = false;

// Webhook del bot de WhatsApp (Cloud API de Meta).
// GET: Meta verifica la URL con el token que inventó Max (WHATSAPP_VERIFY_TOKEN).
// POST: mensajes y estados de envío, firmados con el App Secret (X-Hub-Signature-256).

export const GET: APIRoute = ({ url }) => {
  const esperado = import.meta.env.WHATSAPP_VERIFY_TOKEN;
  const reto = url.searchParams.get('hub.challenge');
  if (url.searchParams.get('hub.mode') === 'subscribe' && esperado && url.searchParams.get('hub.verify_token') === esperado && reto) {
    return new Response(reto, { status: 200, headers: { 'content-type': 'text/plain' } });
  }
  return new Response('prohibido', { status: 403 });
};

export const POST: APIRoute = async ({ request, url }) => {
  // La firma se calcula sobre los bytes tal como llegaron, antes de leer el JSON.
  const crudo = new Uint8Array(await request.arrayBuffer());
  if (!(await firmaMetaValida(crudo, request.headers.get('x-hub-signature-256'), import.meta.env.WHATSAPP_APP_SECRET))) {
    return new Response('firma inválida', { status: 401 });
  }

  const cred = credencialesWhatsapp();
  const db = clienteServidor();
  if (!cred || !db) return new Response('sin configurar', { status: 503 });

  let cuerpo: unknown;
  try {
    cuerpo = JSON.parse(new TextDecoder().decode(crudo));
  } catch {
    return new Response('json inválido', { status: 400 });
  }

  const { mensajes, estados } = leerAvisoWhatsapp(cuerpo, cred.phoneNumberId);
  try {
    await actualizarEstados(db, estados);
    if (mensajes.length) {
      const datos = await cargarDatosTienda();
      const sitio = (import.meta.env.PUBLIC_SITE_URL || url.origin).replace(/\/$/, '');
      const negocio = negocioParaBot(datos, sitio);
      for (const m of mensajes) await procesarMensaje(db, cred, m, negocio);
    }
  } catch (error) {
    console.error('Webhook WhatsApp', error);
    return new Response('error', { status: 500 }); // Meta reintenta; lo ya contestado no se repite
  }
  return new Response(null, { status: 200 });
};
