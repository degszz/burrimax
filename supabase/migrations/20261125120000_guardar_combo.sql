-- Combos de la casa desde el admin: alta y cambio de receta en un solo paso
-- (datos del producto + la receta, que se reemplaza entera). Corre con los
-- permisos del admin logueado: RLS + es_admin (rol + MFA). La validación de
-- límites y el precio los hace /api/combos con el mismo código que la tienda.

create or replace function public.guardar_combo(
  p_id uuid,
  p_nombre text,
  p_descripcion text,
  p_tamano_id uuid,
  p_precio integer,
  p_receta jsonb
) returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid := p_id;
  v_menu uuid;
begin
  if not (select public.es_admin()) then
    raise exception 'solo el admin puede guardar combos' using errcode = '42501';
  end if;
  if jsonb_typeof(p_receta) <> 'array' or jsonb_array_length(p_receta) = 0 then
    raise exception 'la receta está vacía' using errcode = '22023';
  end if;

  if v_id is null then
    -- Mismo menú que los demás burritos de la casa.
    select menu_id into v_menu from public.productos where tipo = 'burrito' order by orden limit 1;
    if v_menu is null then
      select id into v_menu from public.menus where activo order by orden limit 1;
    end if;

    insert into public.productos (menu_id, tipo, nombre, descripcion, precio, tamano_id, activo, destacado, orden)
    values (
      v_menu, 'burrito', p_nombre, p_descripcion, p_precio, p_tamano_id, true, false,
      coalesce((select max(orden) + 1 from public.productos where tipo = 'burrito'), 0)
    )
    returning id into v_id;
  else
    update public.productos
    set nombre = p_nombre, descripcion = p_descripcion, precio = p_precio, tamano_id = p_tamano_id
    where id = v_id and tipo = 'burrito';
    if not found then
      raise exception 'combo no encontrado' using errcode = 'P0002';
    end if;
    delete from public.producto_ingredientes where producto_id = v_id;
  end if;

  insert into public.producto_ingredientes (producto_id, ingrediente_id, porciones)
  select v_id, (r ->> 'ingrediente_id')::uuid, (r ->> 'porciones')::integer
  from jsonb_array_elements(p_receta) as r;

  return v_id;
end;
$$;

revoke execute on function public.guardar_combo(uuid, text, text, uuid, integer, jsonb) from public, anon;
grant execute on function public.guardar_combo(uuid, text, text, uuid, integer, jsonb) to authenticated;
