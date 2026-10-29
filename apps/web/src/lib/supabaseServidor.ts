import type { Database } from '@burritos/shared';
import { createClient } from '@supabase/supabase-js';

// Cliente con la clave secreta: SOLO en endpoints del servidor (pedidos y
// webhooks). Nunca importarlo desde componentes de la tienda.

export function clienteServidor() {
  const url = import.meta.env.PUBLIC_SUPABASE_URL;
  const clave = import.meta.env.SUPABASE_SECRET_KEY;
  if (!url || !clave) return null;
  return createClient<Database>(url, clave, { auth: { persistSession: false, autoRefreshToken: false } });
}
