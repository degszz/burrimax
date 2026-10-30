import type { APIRoute } from 'astro';

// "todos=1" cierra la sesión en todos los dispositivos (si se perdió una tablet).
export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const datos = await request.formData().catch(() => null);
  const todos = datos?.get('todos') === '1';
  await locals.supabase.auth.signOut({ scope: todos ? 'global' : 'local' });
  return redirect('/login', 303);
};
