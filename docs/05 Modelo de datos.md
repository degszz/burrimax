---
tags: [burritos, supabase, datos]
---
# Modelo de datos (Supabase / Postgres)

## Catálogo
**tamanos**
`id` · `slug` ('simple' | 'doble') · `nombre` · `cant_tapas` int · `precio_base` int (incluye papas) · `min_carnes` · `max_carnes` · `max_salsas` · `max_vegetales` · `activo` · `orden`

**categorias_ingrediente**
`id` · `slug` ('tortilla' | 'salsa' | 'carne' | 'vegetal') · `nombre` · `paso` int · `obligatoria` bool · `min` int · `permite_repetir` bool (solo carne)

**ingredientes**
`id` · `categoria_id` → categorias_ingrediente · `slug` UNIQUE (nombre de la imagen) · `nombre` · `descripcion` · `precio_extra` int default 0 · `sin_tacc` bool · `vegetariano` bool · `activo` bool · `modelo_3d_url` · `imagen_url` (`/armador/<slug>.avif`) · `color_hex` · `orden`

**menus**
`id` · `nombre` ('Burritos', 'Combos', 'Bebidas'…) · `orden` · `activo`

**productos** (prehechos, combos, bebidas, acompañamientos)
`id` · `menu_id` → menus · `tipo` ('burrito' | 'combo' | 'bebida' | 'acompanamiento') · `nombre` · `descripcion` · `precio` int · `imagen_url` · `tamano_id` null · `activo` · `destacado` · `orden`

**producto_ingredientes** — receta de un burrito prehecho (permite "editar en el armador")
`producto_id` · `ingrediente_id` · `porciones` int default 1

**combo_items**
`combo_id` → productos · `producto_id` → productos · `cantidad`

## Operación
**zonas_envio**: `id` · `nombre` · `costo` int · `activo`

**config_negocio** (una sola fila)
`abierto` bool · `horarios` jsonb · `alias_transferencia` · `cvu` · `titular` · `whatsapp` · `aviso_celiacos` text · `pago_mp_activo` · `pago_stripe_activo` · `pago_transferencia_activo` · `pago_efectivo_activo`

## Pedidos
**pedidos**
`id` uuid · `numero` serial (el que ve el cliente: #0042) · `token_seguimiento` text · `estado` enum · `cliente_nombre` · `cliente_telefono` · `cliente_email` null · `tipo_entrega` ('delivery' | 'retiro') · `direccion` null · `referencias` null · `zona_envio_id` null · `metodo_pago` enum ('mercadopago' | 'stripe' | 'transferencia' | 'efectivo') · `paga_con` int null · `estado_pago` enum ('pendiente' | 'aprobado' | 'rechazado' | 'reembolsado') · `pago_proveedor_id` null · `subtotal` · `costo_envio` · `total` · `notas` · `created_at` · `updated_at`

**pedido_items**
`id` · `pedido_id` · `tipo` ('armado' | 'producto') · `producto_id` null · `tamano_id` null · `nombre` (snapshot) · `cantidad` · `precio_unitario` (snapshot) · `detalle` jsonb (snapshot completo de lo elegido)

**pedido_item_ingredientes**
`item_id` · `ingrediente_id` · `nombre` (snapshot) · `categoria` · `precio` (snapshot)

**pagos_eventos** (log e idempotencia de webhooks)
`id` · `proveedor` · `evento_id` · `tipo` · `payload` jsonb · `procesado` bool · `created_at` — UNIQUE (`proveedor`, `evento_id`)

**pedido_historial**
`id` · `pedido_id` · `estado_anterior` · `estado_nuevo` · `usuario_id` · `created_at`

> [!note] Implementación
> Migración: `supabase/migrations/20261028220000_modelo_inicial.sql`. `config_negocio` tiene `id boolean` fijo en `true` para asegurar una sola fila. `token_seguimiento` se genera solo (36 caracteres hex).

## Seguridad (RLS)
| Tabla | anon (tienda) | admin |
|---|---|---|
| catálogo (tamanos, ingredientes, menus, productos…) | SELECT donde `activo = true` | todo |
| config_negocio | SELECT de campos públicos (vista `config_publica`) | todo |
| pedidos / items | **nada** (se crean por endpoint con service role) | todo |
| seguimiento | función RPC `ver_pedido(id, token)` devuelve solo estado y resumen | — |
| pagos_eventos | nada | SELECT |

Admin = `auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'`.

## Por qué snapshots
Si mañana cambia el precio o el nombre de un ingrediente, los pedidos viejos tienen que seguir mostrando lo que realmente se vendió.
