-- Bot de WhatsApp (Cloud API de Meta). Ver docs/superpowers/specs/2026-11-02-whatsapp-bot-design.md
--
-- 1. config_negocio.whatsapp_atencion: el número de Max para hablar con una
--    persona. `whatsapp` pasa a ser el del bot cuando el bot esté andando.
-- 2. whatsapp_mensajes: todo lo que entra y sale por el bot. El id de Meta
--    (wamid) es único: el mismo aviso nunca se procesa dos veces.
-- 3. Bucket privado `comprobantes` para las fotos de transferencias.

-- ─────────────────────────────────────────────────────────────
-- 1. Número de atención (público: el bot se lo pasa al cliente).
-- ─────────────────────────────────────────────────────────────
alter table public.config_negocio add column whatsapp_atencion text;
update public.config_negocio set whatsapp_atencion = whatsapp where whatsapp_atencion is null;

create or replace view public.config_publica
with (security_invoker = true) as
  select abierto, horarios, alias_transferencia, cvu, titular, whatsapp, aviso_celiacos,
         pago_mp_activo, pago_stripe_activo, pago_transferencia_activo, pago_efectivo_activo,
         modo_apertura, whatsapp_atencion
  from public.config_negocio;

-- ─────────────────────────────────────────────────────────────
-- 2. Mensajes del bot.
-- ─────────────────────────────────────────────────────────────
create table public.whatsapp_mensajes (
  id uuid primary key default gen_random_uuid(),
  wa_message_id text not null unique,
  direccion text not null check (direccion in ('entrante', 'saliente')),
  -- Número del cliente tal como lo manda Meta (solo dígitos, con 549…).
  wa_id text not null check (wa_id ~ '^[0-9]{8,15}$'),
  nombre_perfil text,
  pedido_id uuid references public.pedidos (id) on delete set null,
  tipo text not null,
  texto text,
  -- Comprobante guardado en Storage (bucket comprobantes) y lo que leyó la IA.
  media_path text,
  analisis jsonb,
  estado text not null default 'recibido'
    check (estado in ('recibido', 'enviado', 'entregado', 'leido', 'fallido')),
  error text,
  procesado boolean not null default false,
  payload jsonb,
  created_at timestamptz not null default now()
);
create index whatsapp_mensajes_wa_id_created_at_idx on public.whatsapp_mensajes (wa_id, created_at desc);
create index whatsapp_mensajes_pedido_id_idx on public.whatsapp_mensajes (pedido_id);

alter table public.whatsapp_mensajes enable row level security;

-- La tienda escribe con service role (webhook). El admin (rol + MFA) lee todo
-- y solo agrega los avisos de estado que manda él.
create policy "admin lee" on public.whatsapp_mensajes for select to authenticated
  using ((select public.es_admin()));
create policy "admin agrega salientes" on public.whatsapp_mensajes for insert to authenticated
  with check ((select public.es_admin()) and direccion = 'saliente');

-- ─────────────────────────────────────────────────────────────
-- 3. Comprobantes de transferencia (privado: solo el admin los ve).
-- ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('comprobantes', 'comprobantes', false, 10485760,
        array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;

create policy "admin lee comprobantes" on storage.objects for select to authenticated
  using (bucket_id = 'comprobantes' and (select public.es_admin()));
