---
name: supabase-datos
description: Usar al crear o cambiar tablas, migraciones, políticas RLS, funciones RPC, seeds o tipos de Supabase del proyecto de burritos.
---
# Supabase — datos

Fuente de verdad del modelo: `docs/05 Modelo de datos.md`. Si cambiás el modelo, actualizá esa nota en el mismo cambio.

## Flujo de trabajo
1. Desarrollo local con Supabase CLI (`supabase start`). Probar ahí antes de tocar remoto.
2. Cada cambio = `supabase migration new <nombre_en_snake>` → SQL en `supabase/migrations/`.
3. `supabase db reset` para validar que todas las migraciones + seed corren de cero.
4. `pnpm db:types` → genera `packages/shared/src/db.types.ts`.
5. Con el MCP de Supabase: revisar `get_advisors` (seguridad y rendimiento) después de cada migración.
6. Aplicar a remoto solo cuando el usuario lo confirme.

## Convenciones SQL
- Nombres en español, snake_case, sin tildes ni ñ (`tamanos`, `pedido_items`).
- `id uuid default gen_random_uuid()` salvo `pedidos.numero` (`bigint generated always as identity`).
- Precios `integer` (pesos enteros), `check (precio >= 0)`.
- Enums de Postgres para `estado_pedido`, `estado_pago`, `metodo_pago`.
- `created_at timestamptz default now()`, `updated_at` con trigger.
- Índices en FKs y en `pedidos(estado, created_at)`.

## RLS (siempre activada en TODAS las tablas)
- Helper: `create function es_admin() returns boolean ... (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'` (security definer, search_path fijo).
- Catálogo: `select` para `anon` y `authenticated` con `activo = true`; todo para `es_admin()`.
- `pedidos`, `pedido_items`, `pedido_item_ingredientes`, `pagos_eventos`, `pedido_historial`: **sin políticas para anon**. Escritura desde el servidor con service role; lectura/actualización para `es_admin()`.
- Seguimiento: `create function ver_pedido(p_id uuid, p_token text)` security definer → devuelve solo número, estado, estado_pago, ítems resumidos, total, created_at.
- `config_negocio`: vista `config_publica` con solo campos públicos (abierto, horarios, alias, cvu, titular, whatsapp, aviso_celiacos, medios activos).

## Realtime
- Publicación en `pedidos` (insert/update) para el admin; las políticas RLS filtran quién recibe.

## Seed
- `supabase/seed.sql` con tamaños, categorías e ingredientes de ejemplo de `docs/02 Reglas de negocio.md`, 3 burritos prehechos y 2 combos.
