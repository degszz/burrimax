---
name: checkout-pedido
description: Usar para el carrito, el formulario de datos del cliente, la elección de forma de pago, el endpoint POST /api/pedidos y la página de seguimiento del pedido.
---
# Checkout y pedidos

Lee: `docs/02 Reglas de negocio.md` (datos, pagos, estados) y `docs/03 Flujo del cliente.md`.

## Carrito
- Store Zustand `carrito` persistido (try/catch). Ítem = `{ tipo: 'armado' | 'producto', productoId?, armado?, cantidad, uid }`.
- El precio del carrito es **solo vista previa**.
- Editar ítem armado → `armador.cargarDesdeItem(uid)` y vuelve al armador.

## Formulario de datos
- react-hook-form + Zod (`pedidoSchema` de `shared`).
- Campos: nombre*, teléfono* (normalizar a formato AR, aceptar con o sin 0/15), tipo de entrega*, dirección* y referencias (solo delivery), zona de envío (si delivery), email (opcional), notas.
- Forma de pago: botones grandes; solo mostrar las activas en `config_publica`. Efectivo → "¿Con cuánto pagás?" (opcional, ≥ total).
- Recordar nombre/teléfono/dirección en el dispositivo (con aviso y opción de borrar).
- Errores en lenguaje humano, al lado del campo.

## POST /api/pedidos (Astro endpoint, `prerender = false`)
1. Rechazar si `config.abierto = false`.
2. Validar body con `pedidoSchema`.
3. Traer de la base los ingredientes/productos/tamaños/zona involucrados (service role).
4. Validar límites con `armadoSchema` y que todo esté activo.
5. **Recalcular precios con `pricing.ts`**; ignorar cualquier total del cliente.
6. Insertar pedido + ítems + ingredientes con snapshots, en una transacción (función RPC `crear_pedido(jsonb)` security definer, o inserción secuencial con rollback manual).
7. Generar `token_seguimiento` (32 bytes aleatorios, base64url).
8. Según método:
   - `efectivo` → estado `confirmado`, devolver URL de seguimiento.
   - `transferencia` → `pendiente_pago`, devolver URL de seguimiento con datos de transferencia.
   - `mercadopago` / `stripe` → `pendiente_pago`, llamar `PaymentProvider.crearCobro`, devolver `redirectUrl`.
9. Rate limit básico por IP (ej. 10 pedidos / 10 min) y honeypot anti-bots.

## Seguimiento `/pedido/[id]?t=[token]`
- Llama RPC `ver_pedido`. Token inválido → 404 genérico.
- Línea de tiempo de estados, se refresca cada 15 s (o Realtime vía canal broadcast si se prefiere).
- Transferencia pendiente: mostrar alias/CVU, botón Copiar y "Enviar comprobante por WhatsApp" (`wa.me` con mensaje prearmado: "Hola! Pedido #0042, total $X, te paso el comprobante").
- Vaciar el carrito al llegar acá.
