-- Catálogo de ejemplo del armador (tortilla → salsas → carne → vegetales).
-- Precios y nombres [A CONFIRMAR]. Las imágenes viven en apps/web/public/armador/.

insert into public.tamanos (slug, nombre, cant_tapas, precio_base, min_carnes, max_carnes, max_salsas, max_vegetales, orden) values
  ('simple', 'Simple', 1, 9000, 2, 2, 2, 4, 1),
  ('doble', 'Doble tapa', 2, 13500, 4, 4, 2, 6, 2);

insert into public.categorias_ingrediente (slug, nombre, paso, obligatoria, min, permite_repetir) values
  ('tortilla', 'Tortilla', 1, true, 1, false),
  ('salsa', 'Salsas', 2, false, 0, false),
  ('carne', 'Carne', 3, true, 1, true),
  ('vegetal', 'Vegetales', 4, false, 0, false);

insert into public.ingredientes (categoria_id, slug, nombre, precio_extra, sin_tacc, vegetariano, color_hex, imagen_url, orden)
select c.id, i.slug, i.nombre, i.precio_extra, i.sin_tacc, i.vegetariano, i.color_hex, '/armador/' || i.slug || '.avif', i.orden
from (values
  ('tortilla', 'tortilla-maiz', 'Maíz', 0, true, true, '#F2C66B', 1),
  ('tortilla', 'tortilla-trigo', 'Harina de trigo', 0, false, true, '#F4D9A6', 2),
  ('salsa', 'guacamole', 'Guacamole', 0, true, true, '#7BB661', 1),
  ('salsa', 'salsa-roja-casera', 'Salsa roja casera', 0, true, true, '#B5261E', 2),
  ('salsa', 'picante-roja', 'Picante roja', 0, true, true, '#C1121F', 3),
  ('salsa', 'cheddar', 'Queso cheddar', 0, true, true, '#F5A623', 4),
  ('salsa', 'queso-crema', 'Queso crema', 0, true, true, '#FBF8F0', 5),
  ('salsa', 'barbacoa', 'Barbacoa', 0, true, true, '#6B2A14', 6),
  ('salsa', 'alioli', 'Alioli', 0, true, true, '#F3EBD3', 7),
  ('salsa', 'ranch', 'Ranch', 0, true, true, '#EFEBDD', 8),
  ('salsa', 'cesar', 'César', 0, true, true, '#EDE3C2', 9),
  ('salsa', 'golf', 'Salsa golf', 0, true, true, '#F4A38C', 10),
  ('salsa', 'mil-islas', 'Mil islas', 0, true, true, '#F2A07B', 11),
  ('salsa', 'mayonesa', 'Mayonesa', 0, true, true, '#F6EFC9', 12),
  ('salsa', 'ketchup', 'Ketchup', 0, true, true, '#C8102E', 13),
  ('salsa', 'mostaza', 'Mostaza', 0, true, true, '#F2C200', 14),
  ('carne', 'pollo', 'Pollo', 0, true, false, '#F2B8A6', 1),
  ('carne', 'vaca', 'Vaca', 0, true, false, '#9B2F3A', 2),
  ('carne', 'cerdo', 'Cerdo', 0, true, false, '#D98B6A', 3),
  ('carne', 'pescado', 'Pescado', 0, true, false, '#F07B4A', 4),
  ('vegetal', 'lechuga', 'Lechuga', 0, true, true, '#8CC152', 1),
  ('vegetal', 'tomate', 'Tomate', 0, true, true, '#E8463A', 2),
  ('vegetal', 'cebolla', 'Cebolla', 0, true, true, '#F2EDE4', 3),
  ('vegetal', 'cebolla-morada', 'Cebolla morada', 0, true, true, '#8E3B78', 4),
  ('vegetal', 'cebolla-verdeo', 'Cebolla de verdeo', 0, true, true, '#5FA83A', 5),
  ('vegetal', 'choclo', 'Choclo', 0, true, true, '#F5C842', 6),
  ('vegetal', 'morron', 'Morrones', 0, true, true, '#D93B30', 7),
  ('vegetal', 'repollo', 'Repollo', 0, true, true, '#C7C9C0', 8),
  ('vegetal', 'zanahoria', 'Zanahoria', 0, true, true, '#F28C28', 9),
  ('vegetal', 'huevo', 'Huevo', 0, true, true, '#F6E7B0', 10)
) as i (categoria, slug, nombre, precio_extra, sin_tacc, vegetariano, color_hex, orden)
join public.categorias_ingrediente c on c.slug = i.categoria;

insert into public.menus (nombre, orden) values
  ('Burritos', 1),
  ('Combos', 2),
  ('Bebidas', 3);

insert into public.productos (menu_id, tipo, nombre, descripcion, precio, tamano_id, destacado, orden)
select m.id, 'burrito', p.nombre, p.descripcion, p.precio, t.id, p.destacado, p.orden
from (values
  ('Clásico', 'Trigo, vaca ×2, salsa roja casera, lechuga, tomate y cebolla', 9000, 'simple', true, 1),
  ('Pollo y choclo', 'Maíz sin TACC, pollo ×2, guacamole, choclo, lechuga y morrones', 9000, 'simple', false, 2),
  ('El Doble', 'Doble tapa de trigo, vaca ×2, pollo ×2, picante roja y 6 vegetales', 13500, 'doble', true, 3)
) as p (nombre, descripcion, precio, tamano, destacado, orden)
join public.menus m on m.nombre = 'Burritos'
join public.tamanos t on t.slug = p.tamano;

insert into public.productos (menu_id, tipo, nombre, precio, orden)
select m.id, 'bebida', p.nombre, p.precio, p.orden
from (values ('Gaseosa 500 ml', 2000, 1), ('Agua 500 ml', 1500, 2)) as p (nombre, precio, orden)
join public.menus m on m.nombre = 'Bebidas';

insert into public.productos (menu_id, tipo, nombre, descripcion, precio, destacado, orden)
select m.id, 'combo', 'Combo Clásico', 'Burrito Clásico (con papas) + gaseosa', 10500, true, 1
from public.menus m where m.nombre = 'Combos';

insert into public.producto_ingredientes (producto_id, ingrediente_id, porciones)
select p.id, i.id, r.porciones
from (values
  ('Clásico', 'tortilla-trigo', 1), ('Clásico', 'vaca', 2), ('Clásico', 'salsa-roja-casera', 1),
  ('Clásico', 'lechuga', 1), ('Clásico', 'tomate', 1), ('Clásico', 'cebolla', 1),
  ('Pollo y choclo', 'tortilla-maiz', 1), ('Pollo y choclo', 'pollo', 2), ('Pollo y choclo', 'guacamole', 1),
  ('Pollo y choclo', 'choclo', 1), ('Pollo y choclo', 'lechuga', 1), ('Pollo y choclo', 'morron', 1),
  ('El Doble', 'tortilla-trigo', 1), ('El Doble', 'vaca', 2), ('El Doble', 'pollo', 2),
  ('El Doble', 'picante-roja', 1), ('El Doble', 'lechuga', 1), ('El Doble', 'tomate', 1),
  ('El Doble', 'cebolla-morada', 1), ('El Doble', 'choclo', 1), ('El Doble', 'zanahoria', 1),
  ('El Doble', 'repollo', 1)
) as r (producto, ingrediente, porciones)
join public.productos p on p.nombre = r.producto
join public.ingredientes i on i.slug = r.ingrediente;

insert into public.combo_items (combo_id, producto_id, cantidad)
select c.id, p.id, 1
from (values ('Combo Clásico', 'Clásico'), ('Combo Clásico', 'Gaseosa 500 ml')) as r (combo, producto)
join public.productos c on c.nombre = r.combo
join public.productos p on p.nombre = r.producto;

insert into public.zonas_envio (nombre, costo) values
  ('Centro', 1500),
  ('Barrios cercanos', 2500);

insert into public.config_negocio (abierto, horarios, whatsapp, aviso_celiacos) values (
  true,
  '{"lun-dom": "19:30-23:30"}'::jsonb,
  '[A CONFIRMAR]',
  'Cocinamos en una cocina compartida: puede haber contaminación cruzada con TACC. [A CONFIRMAR texto legal]'
);
