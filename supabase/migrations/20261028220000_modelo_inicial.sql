-- Modelo inicial de la web de burritos.
-- Fuente de verdad: docs/05 Modelo de datos.md

-- ─────────────────────────────────────────────────────────────
-- Tipos
-- ─────────────────────────────────────────────────────────────
create type public.estado_pedido as enum (
  'pendiente_pago', 'confirmado', 'en_preparacion', 'listo', 'en_camino', 'entregado', 'cancelado'
);
create type public.estado_pago as enum ('pendiente', 'aprobado', 'rechazado', 'reembolsado');
create type public.metodo_pago as enum ('mercadopago', 'stripe', 'transferencia', 'efectivo');
create type public.tipo_entrega as enum ('delivery', 'retiro');
create type public.tipo_producto as enum ('burrito', 'combo', 'bebida', 'acompanamiento');
create type public.tipo_item as enum ('armado', 'producto');

-- ─────────────────────────────────────────────────────────────
-- Helpers
-- ─────────────────────────────────────────────────────────────
create or replace function public.es_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

create or replace function public.tocar_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- Catálogo
-- ─────────────────────────────────────────────────────────────
create table public.tamanos (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug in ('simple', 'doble')),
  nombre text not null,
  cant_tapas integer not null check (cant_tapas between 1 and 2),
  precio_base integer not null check (precio_base >= 0),
  max_proteinas integer not null check (max_proteinas >= 1),
  max_rellenos integer not null check (max_rellenos >= 0),
  max_salsas integer not null check (max_salsas >= 0),
  max_agregados integer not null check (max_agregados >= 0),
  activo boolean not null default true,
  orden integer not null default 0
);

create table public.categorias_ingrediente (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug in ('tapa', 'proteina', 'relleno', 'salsa', 'agregado')),
  nombre text not null,
  paso integer not null unique,
  obligatoria boolean not null default false,
  min integer not null default 0 check (min >= 0)
);

create table public.ingredientes (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid not null references public.categorias_ingrediente (id),
  nombre text not null,
  descripcion text,
  precio_extra integer not null default 0 check (precio_extra >= 0),
  sin_tacc boolean not null default false,
  vegetariano boolean not null default false,
  activo boolean not null default true,
  modelo_3d_url text,
  imagen_url text,
  color_hex text check (color_hex ~ '^#[0-9a-fA-F]{6}$'),
  orden integer not null default 0
);
create index ingredientes_categoria_id_idx on public.ingredientes (categoria_id);

create table public.menus (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  orden integer not null default 0,
  activo boolean not null default true
);

create table public.productos (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null references public.menus (id),
  tipo public.tipo_producto not null,
  nombre text not null,
  descripcion text,
  precio integer not null check (precio >= 0),
  imagen_url text,
  tamano_id uuid references public.tamanos (id),
  activo boolean not null default true,
  destacado boolean not null default false,
  orden integer not null default 0
);
create index productos_menu_id_idx on public.productos (menu_id);
create index productos_tamano_id_idx on public.productos (tamano_id);

create table public.producto_ingredientes (
  producto_id uuid not null references public.productos (id) on delete cascade,
  ingrediente_id uuid not null references public.ingredientes (id),
  primary key (producto_id, ingrediente_id)
);
create index producto_ingredientes_ingrediente_id_idx on public.producto_ingredientes (ingrediente_id);

create table public.combo_items (
  combo_id uuid not null references public.productos (id) on delete cascade,
  producto_id uuid not null references public.productos (id),
  cantidad integer not null default 1 check (cantidad >= 1),
  primary key (combo_id, producto_id),
  check (combo_id <> producto_id)
);
create index combo_items_producto_id_idx on public.combo_items (producto_id);

-- ─────────────────────────────────────────────────────────────
-- Operación
-- ─────────────────────────────────────────────────────────────
create table public.zonas_envio (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  costo integer not null check (costo >= 0),
  activo boolean not null default true
);

-- Una sola fila (id fijo = true).
create table public.config_negocio (
  id boolean primary key default true check (id),
  abierto boolean not null default false,
  horarios jsonb not null default '{}'::jsonb,
  alias_transferencia text,
  cvu text,
  titular text,
  whatsapp text,
  aviso_celiacos text,
  pago_mp_activo boolean not null default false,
  pago_stripe_activo boolean not null default false,
  pago_transferencia_activo boolean not null default true,
  pago_efectivo_activo boolean not null default true,
  updated_at timestamptz not null default now()
);
create trigger config_negocio_updated_at before update on public.config_negocio
  for each row execute function public.tocar_updated_at();

-- ─────────────────────────────────────────────────────────────
-- Pedidos
-- ─────────────────────────────────────────────────────────────
create table public.pedidos (
  id uuid primary key default gen_random_uuid(),
  numero bigint generated always as identity unique,
  token_seguimiento text not null default encode(extensions.gen_random_bytes(18), 'hex'),
  estado public.estado_pedido not null default 'pendiente_pago',
  cliente_nombre text not null,
  cliente_telefono text not null,
  cliente_email text,
  tipo_entrega public.tipo_entrega not null,
  direccion text,
  referencias text,
  zona_envio_id uuid references public.zonas_envio (id),
  metodo_pago public.metodo_pago not null,
  paga_con integer check (paga_con > 0),
  estado_pago public.estado_pago not null default 'pendiente',
  pago_proveedor_id text,
  subtotal integer not null check (subtotal >= 0),
  costo_envio integer not null default 0 check (costo_envio >= 0),
  total integer not null check (total >= 0),
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (tipo_entrega = 'retiro' or (direccion is not null and zona_envio_id is not null)),
  check (paga_con is null or metodo_pago = 'efectivo')
);
create index pedidos_estado_created_at_idx on public.pedidos (estado, created_at);
create index pedidos_zona_envio_id_idx on public.pedidos (zona_envio_id);
create trigger pedidos_updated_at before update on public.pedidos
  for each row execute function public.tocar_updated_at();

create table public.pedido_items (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos (id) on delete cascade,
  tipo public.tipo_item not null,
  producto_id uuid references public.productos (id),
  tamano_id uuid references public.tamanos (id),
  nombre text not null,
  cantidad integer not null check (cantidad >= 1),
  precio_unitario integer not null check (precio_unitario >= 0),
  detalle jsonb not null default '{}'::jsonb
);
create index pedido_items_pedido_id_idx on public.pedido_items (pedido_id);
create index pedido_items_producto_id_idx on public.pedido_items (producto_id);
create index pedido_items_tamano_id_idx on public.pedido_items (tamano_id);

create table public.pedido_item_ingredientes (
  item_id uuid not null references public.pedido_items (id) on delete cascade,
  ingrediente_id uuid not null references public.ingredientes (id),
  nombre text not null,
  categoria text not null,
  precio integer not null check (precio >= 0),
  primary key (item_id, ingrediente_id)
);
create index pedido_item_ingredientes_ingrediente_id_idx on public.pedido_item_ingredientes (ingrediente_id);

create table public.pagos_eventos (
  id uuid primary key default gen_random_uuid(),
  proveedor text not null check (proveedor in ('mercadopago', 'stripe')),
  evento_id text not null,
  tipo text not null,
  payload jsonb not null,
  procesado boolean not null default false,
  created_at timestamptz not null default now(),
  unique (proveedor, evento_id)
);

create table public.pedido_historial (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos (id) on delete cascade,
  estado_anterior public.estado_pedido,
  estado_nuevo public.estado_pedido not null,
  usuario_id uuid references auth.users (id),
  created_at timestamptz not null default now()
);
create index pedido_historial_pedido_id_idx on public.pedido_historial (pedido_id);
create index pedido_historial_usuario_id_idx on public.pedido_historial (usuario_id);

-- ─────────────────────────────────────────────────────────────
-- RLS: activada en TODAS las tablas.
-- La tienda (anon) solo lee catálogo activo. Los pedidos los escribe el
-- servidor con service role (que saltea RLS). El admin puede todo.
-- ─────────────────────────────────────────────────────────────
alter table public.tamanos enable row level security;
alter table public.categorias_ingrediente enable row level security;
alter table public.ingredientes enable row level security;
alter table public.menus enable row level security;
alter table public.productos enable row level security;
alter table public.producto_ingredientes enable row level security;
alter table public.combo_items enable row level security;
alter table public.zonas_envio enable row level security;
alter table public.config_negocio enable row level security;
alter table public.pedidos enable row level security;
alter table public.pedido_items enable row level security;
alter table public.pedido_item_ingredientes enable row level security;
alter table public.pagos_eventos enable row level security;
alter table public.pedido_historial enable row level security;

-- Catálogo: lectura pública de lo activo.
create policy "catalogo publico" on public.tamanos for select to anon, authenticated
  using (activo or (select public.es_admin()));
create policy "catalogo publico" on public.categorias_ingrediente for select to anon, authenticated
  using (true);
create policy "catalogo publico" on public.ingredientes for select to anon, authenticated
  using (activo or (select public.es_admin()));
create policy "catalogo publico" on public.menus for select to anon, authenticated
  using (activo or (select public.es_admin()));
create policy "catalogo publico" on public.productos for select to anon, authenticated
  using (activo or (select public.es_admin()));
create policy "catalogo publico" on public.producto_ingredientes for select to anon, authenticated
  using (true);
create policy "catalogo publico" on public.combo_items for select to anon, authenticated
  using (true);
create policy "catalogo publico" on public.zonas_envio for select to anon, authenticated
  using (activo or (select public.es_admin()));

-- Catálogo y config: escritura solo admin.
do $$
declare
  t text;
begin
  foreach t in array array[
    'tamanos', 'categorias_ingrediente', 'ingredientes', 'menus', 'productos',
    'producto_ingredientes', 'combo_items', 'zonas_envio'
  ]
  loop
    execute format(
      'create policy "admin inserta" on public.%I for insert to authenticated with check ((select public.es_admin()));
       create policy "admin actualiza" on public.%I for update to authenticated using ((select public.es_admin())) with check ((select public.es_admin()));
       create policy "admin borra" on public.%I for delete to authenticated using ((select public.es_admin()));',
      t, t, t
    );
  end loop;
end;
$$;

create policy "admin lee" on public.config_negocio for select to authenticated
  using ((select public.es_admin()));
create policy "admin actualiza" on public.config_negocio for update to authenticated
  using ((select public.es_admin())) with check ((select public.es_admin()));

-- Pedidos: nada para anon. Admin lee y actualiza (no borra: se cancelan).
create policy "admin lee" on public.pedidos for select to authenticated using ((select public.es_admin()));
create policy "admin actualiza" on public.pedidos for update to authenticated
  using ((select public.es_admin())) with check ((select public.es_admin()));
create policy "admin lee" on public.pedido_items for select to authenticated using ((select public.es_admin()));
create policy "admin lee" on public.pedido_item_ingredientes for select to authenticated using ((select public.es_admin()));
create policy "admin lee" on public.pedido_historial for select to authenticated using ((select public.es_admin()));
create policy "admin inserta" on public.pedido_historial for insert to authenticated
  with check ((select public.es_admin()) and usuario_id = (select auth.uid()));
create policy "admin lee" on public.pagos_eventos for select to authenticated using ((select public.es_admin()));

-- ─────────────────────────────────────────────────────────────
-- Vista pública de la config (sin campos internos).
-- security_invoker = false a propósito: expone solo estas columnas a anon,
-- que no tiene acceso a la tabla.
-- ─────────────────────────────────────────────────────────────
create view public.config_publica
with (security_invoker = false) as
  select abierto, horarios, alias_transferencia, cvu, titular, whatsapp, aviso_celiacos,
         pago_mp_activo, pago_stripe_activo, pago_transferencia_activo, pago_efectivo_activo
  from public.config_negocio;
grant select on public.config_publica to anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- Seguimiento: el cliente ve su pedido con id + token, nada más.
-- ─────────────────────────────────────────────────────────────
create or replace function public.ver_pedido(p_id uuid, p_token text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'numero', p.numero,
    'estado', p.estado,
    'estado_pago', p.estado_pago,
    'tipo_entrega', p.tipo_entrega,
    'total', p.total,
    'created_at', p.created_at,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object('nombre', i.nombre, 'cantidad', i.cantidad))
      from public.pedido_items i
      where i.pedido_id = p.id
    ), '[]'::jsonb)
  )
  from public.pedidos p
  where p.id = p_id and p.token_seguimiento = p_token;
$$;
revoke execute on function public.ver_pedido(uuid, text) from public;
grant execute on function public.ver_pedido(uuid, text) to anon, authenticated;
-- es_admin() queda ejecutable por anon a propósito: la usan las políticas del
-- catálogo, y para anon siempre devuelve false.

-- ─────────────────────────────────────────────────────────────
-- Realtime: pedidos nuevos y cambios de estado para el admin.
-- ─────────────────────────────────────────────────────────────
alter publication supabase_realtime add table public.pedidos;
