-- El delivery cuesta lo mismo en cualquier zona: la tienda ya no pide zona.
-- Un pedido con delivery solo necesita la dirección. `zona_envio_id` queda
-- (null) para no romper los pedidos viejos que sí la tienen.

alter table public.pedidos drop constraint pedidos_check;

alter table public.pedidos
  add constraint pedidos_delivery_con_direccion
  check (tipo_entrega = 'retiro' or direccion is not null);
