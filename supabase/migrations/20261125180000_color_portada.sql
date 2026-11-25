-- Color de fondo de la portada, elegible desde el admin (Catálogo → Combos).
-- null = el de siempre (arena). Solo hex de 6 dígitos.
alter table public.config_negocio
  add column color_portada text check (color_portada ~ '^#[0-9A-Fa-f]{6}$');

create or replace view public.config_publica
with (security_invoker = true) as
  select abierto, horarios, alias_transferencia, cvu, titular, whatsapp, aviso_celiacos,
         pago_mp_activo, pago_stripe_activo, pago_transferencia_activo, pago_efectivo_activo,
         modo_apertura, whatsapp_atencion, modelo_burrito_glb, modelo_burrito_usdz, color_portada
  from public.config_negocio;
