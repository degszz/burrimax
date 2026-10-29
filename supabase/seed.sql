-- Datos de ejemplo de docs/02 Reglas de negocio.md.
-- TODOS los precios, nombres y zonas son [A CONFIRMAR].

insert into public.tamanos (slug, nombre, cant_tapas, precio_base, max_proteinas, max_rellenos, max_salsas, max_agregados, orden) values
  ('simple', 'Simple', 1, 6000, 1, 4, 2, 3, 1),
  ('doble', 'Doble tapa', 2, 9000, 2, 6, 3, 5, 2);

insert into public.categorias_ingrediente (slug, nombre, paso, obligatoria, min) values
  ('tapa', 'Tapa', 2, true, 1),
  ('proteina', 'Proteína', 3, true, 1),
  ('relleno', 'Rellenos', 4, false, 0),
  ('salsa', 'Salsas', 5, false, 0),
  ('agregado', 'Agregados', 6, false, 0);

insert into public.ingredientes (categoria_id, nombre, precio_extra, sin_tacc, vegetariano, color_hex, orden)
select c.id, i.nombre, i.precio_extra, i.sin_tacc, i.vegetariano, i.color_hex, i.orden
from (values
  ('tapa', 'Harina común', 0, false, true, '#F2D9A0', 1),
  ('tapa', 'Integral', 0, false, true, '#C89B5E', 2),
  ('tapa', 'Espinaca', 0, false, true, '#7FA650', 3),
  ('tapa', 'Sin TACC', 800, true, true, '#EFE2B8', 4),
  ('proteina', 'Carne picada', 0, true, false, '#8B4A2B', 1),
  ('proteina', 'Pollo', 0, true, false, '#E0B070', 2),
  ('proteina', 'Cerdo desmechado', 500, true, false, '#B5653A', 3),
  ('proteina', 'Vegetariano (porotos)', 0, true, true, '#5A3A2E', 4),
  ('relleno', 'Arroz', 0, true, true, '#F7F3E8', 1),
  ('relleno', 'Porotos negros', 0, true, true, '#2E2420', 2),
  ('relleno', 'Lechuga', 0, true, true, '#8CC152', 3),
  ('relleno', 'Tomate', 0, true, true, '#E8463A', 4),
  ('relleno', 'Cebolla', 0, true, true, '#E9D7E8', 5),
  ('relleno', 'Morrón', 0, true, true, '#D93B30', 6),
  ('relleno', 'Choclo', 0, true, true, '#F5C842', 7),
  ('relleno', 'Queso', 0, true, true, '#F8D35E', 8),
  ('salsa', 'Guacamole', 0, true, true, '#7BAF3E', 1),
  ('salsa', 'Pico de gallo', 0, true, true, '#D9503E', 2),
  ('salsa', 'Crema ácida', 0, true, true, '#F5F2EA', 3),
  ('salsa', 'Picante suave', 0, true, true, '#E07B2A', 4),
  ('salsa', 'Picante fuerte', 0, true, true, '#B8261A', 5),
  ('agregado', 'Extra queso', 700, true, true, '#F8D35E', 1),
  ('agregado', 'Extra carne', 1500, true, false, '#8B4A2B', 2),
  ('agregado', 'Panceta', 1000, true, false, '#C9705A', 3),
  ('agregado', 'Jalapeños', 500, true, true, '#4F8A2B', 4),
  ('agregado', 'Nachos adentro', 600, false, true, '#E8B44A', 5)
) as i (categoria, nombre, precio_extra, sin_tacc, vegetariano, color_hex, orden)
join public.categorias_ingrediente c on c.slug = i.categoria;

insert into public.menus (nombre, orden) values
  ('Burritos', 1),
  ('Combos', 2),
  ('Bebidas', 3);

-- Prehechos: el precio es el del armado equivalente.
insert into public.productos (menu_id, tipo, nombre, descripcion, precio, tamano_id, destacado, orden)
select m.id, 'burrito', p.nombre, p.descripcion, p.precio, t.id, p.destacado, p.orden
from (values
  ('Clásico', 'Harina, carne, arroz, porotos, queso y pico de gallo', 6000, 'simple', true, 1),
  ('Pollo crocante', 'Harina, pollo, lechuga, tomate, choclo y crema ácida', 6000, 'simple', false, 2),
  ('El Hambre', 'Doble tapa, carne y cerdo, arroz, porotos, queso, guacamole y panceta', 10500, 'doble', true, 3)
) as p (nombre, descripcion, precio, tamano, destacado, orden)
join public.menus m on m.nombre = 'Burritos'
join public.tamanos t on t.slug = p.tamano;

insert into public.productos (menu_id, tipo, nombre, precio, orden)
select m.id, p.tipo::public.tipo_producto, p.nombre, p.precio, p.orden
from (values
  ('Bebidas', 'bebida', 'Gaseosa 500 ml', 2000, 1),
  ('Bebidas', 'bebida', 'Agua 500 ml', 1500, 2),
  ('Combos', 'acompanamiento', 'Nachos con cheddar', 3500, 9)
) as p (menu, tipo, nombre, precio, orden)
join public.menus m on m.nombre = p.menu;

insert into public.productos (menu_id, tipo, nombre, descripcion, precio, destacado, orden)
select m.id, 'combo', c.nombre, c.descripcion, c.precio, c.destacado, c.orden
from (values
  ('Combo Clásico', 'Burrito Clásico + gaseosa', 7500, true, 1),
  ('Combo Hambre', 'El Hambre + nachos con cheddar + gaseosa', 14500, false, 2)
) as c (nombre, descripcion, precio, destacado, orden)
join public.menus m on m.nombre = 'Combos';

-- Recetas de los prehechos.
insert into public.producto_ingredientes (producto_id, ingrediente_id)
select p.id, i.id
from (values
  ('Clásico', 'Harina común'), ('Clásico', 'Carne picada'), ('Clásico', 'Arroz'),
  ('Clásico', 'Porotos negros'), ('Clásico', 'Queso'), ('Clásico', 'Pico de gallo'),
  ('Pollo crocante', 'Harina común'), ('Pollo crocante', 'Pollo'), ('Pollo crocante', 'Lechuga'),
  ('Pollo crocante', 'Tomate'), ('Pollo crocante', 'Choclo'), ('Pollo crocante', 'Crema ácida'),
  ('El Hambre', 'Harina común'), ('El Hambre', 'Carne picada'), ('El Hambre', 'Cerdo desmechado'),
  ('El Hambre', 'Arroz'), ('El Hambre', 'Porotos negros'), ('El Hambre', 'Queso'),
  ('El Hambre', 'Guacamole'), ('El Hambre', 'Panceta')
) as r (producto, ingrediente)
join public.productos p on p.nombre = r.producto
join public.ingredientes i on i.nombre = r.ingrediente;

insert into public.combo_items (combo_id, producto_id, cantidad)
select c.id, p.id, r.cantidad
from (values
  ('Combo Clásico', 'Clásico', 1), ('Combo Clásico', 'Gaseosa 500 ml', 1),
  ('Combo Hambre', 'El Hambre', 1), ('Combo Hambre', 'Nachos con cheddar', 1), ('Combo Hambre', 'Gaseosa 500 ml', 1)
) as r (combo, producto, cantidad)
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
