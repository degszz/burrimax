-- Admin = rol admin Y sesión con segundo factor verificado (MFA, nivel aal2).
-- Así, aunque se filtre una contraseña, sin el código del celular no se puede
-- leer ni tocar nada de admin, ni siquiera llamando a la API directo.
create or replace function public.es_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
      and (auth.jwt() ->> 'aal') = 'aal2',
    false
  );
$$;
