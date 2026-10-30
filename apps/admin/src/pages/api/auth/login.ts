import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const datos = await request.formData();
  const email = String(datos.get('email') ?? '').trim();
  const password = String(datos.get('password') ?? '');
  if (!email || !password) return redirect('/login?error=faltan', 303);

  const { data, error } = await locals.supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return redirect('/login?error=datos', 303);

  // Sin rol admin no entra (no hay registro público).
  if (data.user.app_metadata?.role !== 'admin') {
    await locals.supabase.auth.signOut();
    return redirect('/sin-acceso', 303);
  }
  return redirect('/mfa', 303);
};
