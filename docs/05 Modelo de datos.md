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
**zonas_envio**: `id` · `nombre` · `costo` int · `activo` — **sin uso desde 2026-11-03** (el envío no tiene costo); queda por los pedidos viejos.

**config_negocio** (una sola fila)
`abierto` bool · `horarios` jsonb · `alias_transferencia` · `cvu` · `titular` · `whatsapp` (a donde va el pedido: el bot cuando esté andando) · `whatsapp_atencion` (el de Max, para hablar con una persona) · `aviso_celiacos` text · `pago_mp_activo` · `pago_stripe_activo` · `pago_transferencia_activo` · `pago_efectivo_activo`

## Pedidos
**pedidos**
`id` uuid · `numero` serial (el que ve el cliente: #0042) · `token_seguimiento` text · `estado` enum · `cliente_nombre` · `cliente_telefono` · `cliente_email` null · `tipo_entrega` ('delivery' | 'retiro') · `direccion` null · `referencias` null · `zona_envio_id` null (ya no se carga; delivery solo exige `direccion`) · `metodo_pago` enum ('mercadopago' | 'stripe' | 'transferencia' | 'efectivo') · `paga_con` int null · `estado_pago` enum ('pendiente' | 'aprobado' | 'rechazado' | 'reembolsado') · `pago_proveedor_id` null · `subtotal` · `costo_envio` · `total` · `notas` · `created_at` · `updated_at`

**pedido_items**
`id` · `pedido_id` · `tipo` ('armado' | 'producto') · `producto_id` null · `tamano_id` null · `nombre` (snapshot) · `cantidad` · `precio_unitario` (snapshot) · `detalle` jsonb (snapshot completo de lo elegido)

**pedido_item_ingredientes**
`item_id` · `ingrediente_id` · `nombre` (snapshot) · `categoria` · `precio` (snapshot) · `porciones` (carne repetida)

**Función `crear_pedido(p jsonb)`** — crea pedido + ítems + ingredientes + historial en una transacción. Solo `service_role` (la usa `POST /api/pedidos`).

**pagos_eventos** (log e idempotencia de webhooks)
`id` · `proveedor` · `evento_id` · `tipo` · `payload` jsonb · `procesado` bool · `created_at` — UNIQUE (`proveedor`, `evento_id`)

**whatsapp_mensajes** (bot de WhatsApp: lo que entra y sale, e idempotencia)
`id` · `wa_message_id` UNIQUE (wamid de Meta) · `direccion` ('entrante' | 'saliente') · `wa_id` (número del cliente, 549…) · `nombre_perfil` · `pedido_id` null → pedidos · `tipo` · `texto` · `media_path` (comprobante en Storage) · `analisis` jsonb (lo que leyó la IA: solo pre-aprobación) · `estado` (recibido/enviado/entregado/leido/fallido) · `error` · `procesado` · `procesando_desde` (reserva: vence a los 3 min si la función se cortó) · `payload` jsonb · `created_at`
Storage: bucket privado `comprobantes` (`<pedido_id>/<wamid>.<ext>`), solo lo lee el admin.

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
| whatsapp_mensajes | nada (escribe el webhook con service role) | SELECT + INSERT de salientes |
| Storage `comprobantes` | nada | SELECT |

Admin = `auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'`.

## Por qué snapshots
Si mañana cambia el precio o el nombre de un ingrediente, los pedidos viejos tienen que seguir mostrando lo que realmente se vendió.
