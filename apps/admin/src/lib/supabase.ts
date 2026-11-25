import type { Database } from '@burritos/shared';
import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import type { AstroCookies } from 'astro';
import { SUPABASE_CLAVE_PUBLICA, SUPABASE_URL } from './supabasePublico';

// El admin NUNCA usa la clave secreta: todo lo que hace pasa por RLS con
// es_admin() (rol admin + MFA verificado).

/**
 * Cliente de Supabase para el servidor del admin. La sesión vive en cookies
 * httpOnly (el JavaScript del navegador no puede leer el token).
 */
export function crearCliente({ request, cookies }: { request: Request; cookies: AstroCookies }) {
  const seguro = new URL(request.url).protocol === 'https:';
  return createServerClient<Database>(
    SUPABASE_URL,
    SUPABASE_CLAVE_PUBLICA,
    {
      cookies: {
        getAll() {
          return parseCookieHeader(request.headers.get('Cookie') ?? '').map((c) => ({ name: c.name, value: c.value ?? '' }));
        },
        setAll(lista) {
          for (const { name, value, options } of lista) {
            cookies.set(name, value, { ...options, httpOnly: true, secure: seguro, sameSite: 'lax', path: '/' });
          }
        },
      },
    },
  );
}
