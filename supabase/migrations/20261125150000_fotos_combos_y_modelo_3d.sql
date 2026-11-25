-- Fotos de los combos de la casa y el burrito en 3D, cargados desde el admin.
--
-- 1. Bucket público `combos`: la foto del burrito de cada combo (las papas las
--    pone la tienda). La URL queda en productos.imagen_url.
-- 2. Bucket público `modelos`: el burrito escaneado en 3D (.glb para la web y
--    Android, .usdz para "ver en tu mesa" en iPhone). Uno solo para todos los
--    combos: las URLs quedan en config_negocio.
-- Solo el admin (rol + MFA) sube o borra; leer es público (son de la tienda).
-- Se sube directo del navegador a Storage con una URL firmada que pide el
-- admin (Vercel no acepta archivos grandes en sus funciones).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('combos', 'combos', true, 3145728, array['image/webp', 'image/png', 'image/jpeg', 'image/avif']),
  ('modelos', 'modelos', true, 52428800, array['model/gltf-binary', 'model/vnd.usdz+zip', 'application/octet-stream'])
on conflict (id) do nothing;

create policy "admin sube fotos y modelos" on storage.objects for insert to authenticated
  with check (bucket_id in ('combos', 'modelos') and (select public.es_admin()));
create policy "admin cambia fotos y modelos" on storage.objects for update to authenticated
  using (bucket_id in ('combos', 'modelos') and (select public.es_admin()))
  with check (bucket_id in ('combos', 'modelos') and (select public.es_admin()));
create policy "admin borra fotos y modelos" on storage.objects for delete to authenticated
  using (bucket_id in ('combos', 'modelos') and (select public.es_admin()));

alter table public.config_negocio
  add column modelo_burrito_glb text,
  add column modelo_burrito_usdz text;

create or replace view public.config_publica
with (security_invoker = true) as
  select abierto, horarios, alias_transferencia, cvu, titular, whatsapp, aviso_celiacos,
         pago_mp_activo, pago_stripe_activo, pago_transferencia_activo, pago_efectivo_activo,
         modo_apertura, whatsapp_atencion, modelo_burrito_glb, modelo_burrito_usdz
  from public.config_negocio;
