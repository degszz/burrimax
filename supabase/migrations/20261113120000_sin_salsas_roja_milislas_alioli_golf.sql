-- Max saca de las salsas a elección: salsa roja casera, mil islas, alioli y golf.
-- Se desactivan, no se borran: los pedidos viejos las siguen nombrando y se
-- pueden volver a prender desde el admin (Stock).
update public.ingredientes
set activo = false
where slug in ('salsa-roja-casera', 'mil-islas', 'alioli', 'golf');

-- Los combos de la casa activos que las llevaban siguen a la venta, sin esa
-- salsa (las salsas son opcionales). Hoy solo "Clásico" (salsa roja casera).
delete from public.producto_ingredientes pi
using public.ingredientes i, public.productos p
where i.id = pi.ingrediente_id
  and p.id = pi.producto_id
  and p.activo
  and i.slug in ('salsa-roja-casera', 'mil-islas', 'alioli', 'golf');
