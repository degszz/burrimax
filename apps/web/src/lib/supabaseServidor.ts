import type { Database } from '@burritos/shared';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL } from './supabasePublico';

// Cliente con la clave secreta: SOLO en endpoints del servidor (pedidos y
// webhooks). Nunca importarlo desde componentes de la tienda.

export function clienteServidor() {
  const clave = import.meta.env.SUPABASE_SECRET_KEY;
  if (!clave) return null;
  return createClient<Database>(SUPABASE_URL, clave, { auth: { persistSession: false, autoRefreshToken: false } });
}
