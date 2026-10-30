import type { Database } from '@burritos/shared';
import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import type { AstroCookies } from 'astro';

// URL y clave PUBLICABLE (no secretas). El admin NUNCA usa la clave secreta:
// todo lo que hace pasa por RLS con es_admin() (rol admin + MFA verificado).
const URL_POR_DEFECTO = 'https://qoxzylgpstmzjzgxnetw.supabase.co';
const CLAVE_POR_DEFECTO = 'sb_publishable_vE1Y9WMUSfW3q7gpf2hf_g_W8Qrjhro';

/**
 * Cliente de Supabase para el servidor del admin. La sesión vive en cookies
 * httpOnly (el JavaScript del navegador no puede leer el token).
 */
export function crearCliente({ request, cookies }: { request: Request; cookies: AstroCookies }) {
  const seguro = new URL(request.url).protocol === 'https:';
  return createServerClient<Database>(
    import.meta.env.PUBLIC_SUPABASE_URL || URL_POR_DEFECTO,
    import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY || CLAVE_POR_DEFECTO,
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
