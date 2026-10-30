import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const datos = await request.formData();
  const factorId = String(datos.get('factorId') ?? '');
  const code = String(datos.get('codigo') ?? '').replace(/\D/g, '');
  if (!factorId || code.length !== 6) return redirect('/mfa?error=1', 303);

  // Verifica el código y sube la sesión a aal2 (las cookies se renuevan solas).
  const { error } = await locals.supabase.auth.mfa.challengeAndVerify({ factorId, code });
  if (error) return redirect('/mfa?error=1', 303);
  return redirect('/', 303);
};
