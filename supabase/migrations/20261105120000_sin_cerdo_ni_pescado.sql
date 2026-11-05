-- Max saca cerdo y pescado de las carnes (quedan pollo y vaca).
-- Se desactivan, no se borran: los pedidos viejos los siguen nombrando y se
-- pueden volver a prender desde el admin (Stock).
update public.ingredientes
set activo = false
where slug in ('cerdo', 'pescado');

-- Los combos de la casa que llevan alguna de esas carnes ya no se pueden pedir.
update public.productos
set activo = false
where id in (
  select pi.producto_id
  from public.producto_ingredientes pi
  join public.ingredientes i on i.id = pi.ingrediente_id
  where i.slug in ('cerdo', 'pescado')
);
