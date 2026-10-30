-- Horarios de la semana con apertura automática, y cambios de estado del
-- pedido desde el admin (con historial) que el cliente ve en el seguimiento.

-- ─────────────────────────────────────────────────────────────
-- Apertura: automática según horarios, o abierto/cerrado a mano.
-- horarios: {"lun":[{"desde":"19:30","hasta":"23:30"}], ..., "dom":[]}
-- (hasta < desde = cruza la medianoche). La lógica vive en
-- packages/shared/src/horarios.ts (hora de Argentina).
-- ─────────────────────────────────────────────────────────────
alter table public.config_negocio
  add column modo_apertura text not null default 'automatico'
  check (modo_apertura in ('automatico', 'abierto', 'cerrado'));

-- Pasa el formato viejo del seed ({"lun-dom": "19:30-23:30"}) al nuevo.
update public.config_negocio
set horarios = (
  select jsonb_object_agg(dia, case
    when horarios ? 'lun-dom' then jsonb_build_array(jsonb_build_object(
      'desde', split_part(horarios ->> 'lun-dom', '-', 1),
      'hasta', split_part(horarios ->> 'lun-dom', '-', 2)))
    else '[]'::jsonb end)
  from unnest(array['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom']) as dia
)
where not (horarios ? 'lun');

-- Hasta que Max cargue los horarios reales, se respeta el interruptor que había.
update public.config_negocio
set modo_apertura = case when abierto then 'abierto' else 'automatico' end;

create or replace view public.config_publica
with (security_invoker = true) as
  select abierto, horarios, alias_transferencia, cvu, titular, whatsapp, aviso_celiacos,
         pago_mp_activo, pago_stripe_activo, pago_transferencia_activo, pago_efectivo_activo,
         modo_apertura
  from public.config_negocio;

-- ─────────────────────────────────────────────────────────────
-- Historial: motivo (al cancelar).
-- ─────────────────────────────────────────────────────────────
alter table public.pedido_historial add column motivo text;

-- ─────────────────────────────────────────────────────────────
-- Cambiar estado desde el admin: valida, actualiza y registra en un solo paso.
-- security invoker: corre con los permisos del admin logueado (RLS + es_admin).
-- ─────────────────────────────────────────────────────────────
create or replace function public.cambiar_estado_pedido(p_id uuid, p_estado public.estado_pedido, p_motivo text default null)
returns public.pedidos
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_actual public.pedidos;
  v_nuevo public.pedidos;
begin
  if not public.es_admin() then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;

  select * into v_actual from public.pedidos where id = p_id for update;
  if not found then
    raise exception 'Pedido no encontrado' using errcode = 'P0002';
  end if;
  if v_actual.estado in ('entregado', 'cancelado') then
    raise exception 'El pedido ya está %', v_actual.estado using errcode = '22023';
  end if;
  if v_actual.estado = p_estado then
    return v_actual;
  end if;
  if p_estado = 'cancelado' and coalesce(btrim(p_motivo), '') = '' then
    raise exception 'Para cancelar hace falta un motivo' using errcode = '22023';
  end if;
  -- "En camino" es solo para delivery.
  if p_estado = 'en_camino' and v_actual.tipo_entrega <> 'delivery' then
    raise exception 'Un pedido para retirar no va "en camino"' using errcode = '22023';
  end if;

  update public.pedidos set estado = p_estado, updated_at = now()
  where id = p_id
  returning * into v_nuevo;

  insert into public.pedido_historial (pedido_id, estado_anterior, estado_nuevo, usuario_id, motivo)
  values (p_id, v_actual.estado, p_estado, auth.uid(), nullif(btrim(p_motivo), ''));

  return v_nuevo;
end;
$$;

-- Transferencia o efectivo cobrado: marca el pago y, si esperaba el pago, lo confirma.
create or replace function public.marcar_pagado(p_id uuid)
returns public.pedidos
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_actual public.pedidos;
  v_nuevo public.pedidos;
begin
  if not public.es_admin() then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;

  select * into v_actual from public.pedidos where id = p_id for update;
  if not found then
    raise exception 'Pedido no encontrado' using errcode = 'P0002';
  end if;
  -- Mercado Pago y Stripe solo se marcan pagados por webhook verificado.
  if v_actual.metodo_pago not in ('transferencia', 'efectivo') then
    raise exception 'Este pago se confirma solo, por el webhook' using errcode = '22023';
  end if;

  update public.pedidos
  set estado_pago = 'aprobado',
      estado = case when estado = 'pendiente_pago' then 'confirmado'::public.estado_pedido else estado end,
      updated_at = now()
  where id = p_id
  returning * into v_nuevo;

  if v_actual.estado <> v_nuevo.estado then
    insert into public.pedido_historial (pedido_id, estado_anterior, estado_nuevo, usuario_id, motivo)
    values (p_id, v_actual.estado, v_nuevo.estado, auth.uid(), 'Pago confirmado');
  end if;

  return v_nuevo;
end;
$$;

revoke execute on function public.cambiar_estado_pedido(uuid, public.estado_pedido, text) from public, anon;
revoke execute on function public.marcar_pagado(uuid) from public, anon;
grant execute on function public.cambiar_estado_pedido(uuid, public.estado_pedido, text) to authenticated;
grant execute on function public.marcar_pagado(uuid) to authenticated;

-- ─────────────────────────────────────────────────────────────
-- Seguimiento: suma el camino del pedido (cada estado con su hora).
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
    'metodo_pago', p.metodo_pago,
    'tipo_entrega', p.tipo_entrega,
    'subtotal', p.subtotal,
    'costo_envio', p.costo_envio,
    'total', p.total,
    'paga_con', p.paga_con,
    'created_at', p.created_at,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object('nombre', i.nombre, 'cantidad', i.cantidad, 'precio_unitario', i.precio_unitario) order by i.nombre)
      from public.pedido_items i
      where i.pedido_id = p.id
    ), '[]'::jsonb),
    'historial', coalesce((
      select jsonb_agg(jsonb_build_object('estado', h.estado_nuevo, 'fecha', h.created_at) order by h.created_at)
      from public.pedido_historial h
      where h.pedido_id = p.id
    ), '[]'::jsonb)
  )
  from public.pedidos p
  where p.id = p_id and p.token_seguimiento = p_token;
$$;
