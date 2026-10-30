-- Avisos push al celular del admin cuando entra un pedido.
-- Cada celular/navegador que toca "Avisarme en este celular" deja acá su
-- suscripción. La tienda (servidor, service role) las lee para mandar el aviso.

create table public.push_suscripciones (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  dispositivo text,
  created_at timestamptz not null default now()
);
create index push_suscripciones_usuario_id_idx on public.push_suscripciones (usuario_id);

alter table public.push_suscripciones enable row level security;

-- Solo el admin (rol + MFA) maneja sus propias suscripciones.
create policy "admin lee las suyas" on public.push_suscripciones for select to authenticated
  using ((select public.es_admin()) and usuario_id = (select auth.uid()));
create policy "admin agrega las suyas" on public.push_suscripciones for insert to authenticated
  with check ((select public.es_admin()) and usuario_id = (select auth.uid()));
create policy "admin actualiza las suyas" on public.push_suscripciones for update to authenticated
  using ((select public.es_admin()) and usuario_id = (select auth.uid()))
  with check ((select public.es_admin()) and usuario_id = (select auth.uid()));
create policy "admin borra las suyas" on public.push_suscripciones for delete to authenticated
  using ((select public.es_admin()) and usuario_id = (select auth.uid()));
