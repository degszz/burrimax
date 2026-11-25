-- Color de fondo de la parte de abajo de la tienda (combos de la casa), elegible
-- desde el admin junto al de la portada. null = crema.
alter table public.config_negocio
  add column color_catalogo text check (color_catalogo ~ '^#[0-9A-Fa-f]{6}$');

create or replace view public.config_publica
with (security_invoker = true) as
  select abierto, horarios, alias_transferencia, cvu, titular, whatsapp, aviso_celiacos,
         pago_mp_activo, pago_stripe_activo, pago_transferencia_activo, pago_efectivo_activo,
         modo_apertura, whatsapp_atencion, modelo_burrito_glb, modelo_burrito_usdz, color_portada, color_catalogo
  from public.config_negocio;
