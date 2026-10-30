import { defineMiddleware } from 'astro:middleware';
import { crearCliente } from './lib/supabase';

// Puerta del admin. Sin sesión → /login. Sin rol admin → afuera.
// Sin el código del celular (MFA) → /mfa. La base además exige lo mismo
// (es_admin() pide rol admin + aal2), así que saltear esto no sirve de nada.

const SIN_SESION = new Set(['/login', '/api/auth/login', '/sin-acceso', '/robots.txt']);
const SOLO_SESION = new Set(['/mfa', '/api/auth/mfa', '/api/auth/salir']);

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  context.locals.supabase = crearCliente(context);
  context.locals.usuario = null;

  if (pathname.startsWith('/_astro/') || pathname.startsWith('/favicon')) return next();
  if (SIN_SESION.has(pathname)) return next();

  const supabase = context.locals.supabase;
  // getUser() valida el token contra Supabase (no confía en la cookie a ciegas).
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return pathname.startsWith('/api/') ? new Response('Sin sesión', { status: 401 }) : context.redirect('/login');

  if (user.app_metadata?.role !== 'admin') {
    await supabase.auth.signOut();
    return context.redirect('/sin-acceso');
  }

  context.locals.usuario = { id: user.id, email: user.email ?? null };
  if (SOLO_SESION.has(pathname)) return next();

  const { data: nivel } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (nivel?.currentLevel !== 'aal2') {
    return pathname.startsWith('/api/') ? new Response('Falta el código del celular', { status: 401 }) : context.redirect('/mfa');
  }

  const respuesta = await next();
  // Nada del admin se guarda en caché ni se muestra en Google.
  respuesta.headers.set('Cache-Control', 'no-store');
  respuesta.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return respuesta;
});
