-- Armador nuevo (ver docs/superpowers/specs/2026-10-28-armador-hero-design.md):
-- tortilla → salsas → carne (por porciones, repetible) → vegetales.
-- Requiere el catálogo vacío: en desarrollo se vacía antes y se recarga con seed.sql.

-- Categorías
alter table public.categorias_ingrediente drop constraint categorias_ingrediente_slug_check;
alter table public.categorias_ingrediente
  add constraint categorias_ingrediente_slug_check check (slug in ('tortilla', 'salsa', 'carne', 'vegetal')),
  add column permite_repetir boolean not null default false;

-- Tamaños: límites por categoría. La tortilla siempre es 1.
alter table public.tamanos
  drop column max_proteinas,
  drop column max_rellenos,
  drop column max_agregados,
  add column min_carnes integer not null check (min_carnes >= 1),
  add column max_carnes integer not null,
  add column max_vegetales integer not null check (max_vegetales >= 0),
  add constraint tamanos_carnes_check check (min_carnes <= max_carnes);

-- Ingredientes: slug estable para imágenes y referencias.
alter table public.ingredientes
  add column slug text not null unique check (slug ~ '^[a-z0-9-]+$');

-- Recetas de prehechos: una carne puede ir en varias porciones.
alter table public.producto_ingredientes
  add column porciones integer not null default 1 check (porciones >= 1);
