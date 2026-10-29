-- Fase 2: crear pedidos en una sola transacción.
-- El servidor (POST /api/pedidos) valida y calcula el precio con shared/pricing.ts
-- y llama a esta función con la clave secreta. Nadie más puede ejecutarla.

-- La misma carne puede ir en varias porciones (pollo ×2).
alter table public.pedido_item_ingredientes
  add column porciones integer not null default 1 check (porciones >= 1);

create or replace function public.crear_pedido(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pedido public.pedidos;
  v_item jsonb;
  v_item_id uuid;
  v_ing jsonb;
begin
  insert into public.pedidos (
    estado, cliente_nombre, cliente_telefono, cliente_email, tipo_entrega, direccion, referencias,
    zona_envio_id, metodo_pago, paga_con, subtotal, costo_envio, total, notas
  ) values (
    (p ->> 'estado')::public.estado_pedido,
    p ->> 'cliente_nombre',
    p ->> 'cliente_telefono',
    nullif(p ->> 'cliente_email', ''),
    (p ->> 'tipo_entrega')::public.tipo_entrega,
    nullif(p ->> 'direccion', ''),
    nullif(p ->> 'referencias', ''),
    nullif(p ->> 'zona_envio_id', '')::uuid,
    (p ->> 'metodo_pago')::public.metodo_pago,
    nullif(p ->> 'paga_con', '')::integer,
    (p ->> 'subtotal')::integer,
    (p ->> 'costo_envio')::integer,
    (p ->> 'total')::integer,
    nullif(p ->> 'notas', '')
  )
  returning * into v_pedido;

  for v_item in select * from jsonb_array_elements(p -> 'items') loop
    insert into public.pedido_items (pedido_id, tipo, producto_id, tamano_id, nombre, cantidad, precio_unitario, detalle)
    values (
      v_pedido.id,
      (v_item ->> 'tipo')::public.tipo_item,
      nullif(v_item ->> 'producto_id', '')::uuid,
      nullif(v_item ->> 'tamano_id', '')::uuid,
      v_item ->> 'nombre',
      (v_item ->> 'cantidad')::integer,
      (v_item ->> 'precio_unitario')::integer,
      coalesce(v_item -> 'detalle', '{}'::jsonb)
    )
    returning id into v_item_id;

    for v_ing in select * from jsonb_array_elements(coalesce(v_item -> 'ingredientes', '[]'::jsonb)) loop
      insert into public.pedido_item_ingredientes (item_id, ingrediente_id, nombre, categoria, precio, porciones)
      values (
        v_item_id,
        (v_ing ->> 'ingrediente_id')::uuid,
        v_ing ->> 'nombre',
        v_ing ->> 'categoria',
        (v_ing ->> 'precio')::integer,
        coalesce((v_ing ->> 'porciones')::integer, 1)
      );
    end loop;
  end loop;

  insert into public.pedido_historial (pedido_id, estado_anterior, estado_nuevo)
  values (v_pedido.id, null, v_pedido.estado);

  return jsonb_build_object('id', v_pedido.id, 'numero', v_pedido.numero, 'token', v_pedido.token_seguimiento);
end;
$$;

revoke execute on function public.crear_pedido(jsonb) from public, anon, authenticated;
grant execute on function public.crear_pedido(jsonb) to service_role;

-- El seguimiento muestra también cómo se paga y, si es transferencia, los datos para hacerla.
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
    ), '[]'::jsonb)
  )
  from public.pedidos p
  where p.id = p_id and p.token_seguimiento = p_token;
$$;
