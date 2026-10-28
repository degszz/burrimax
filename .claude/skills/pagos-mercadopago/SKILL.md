---
name: pagos-mercadopago
description: Usar para integrar Mercado Pago Checkout Pro — crear preferencias, webhook con verificación de firma, idempotencia, pruebas con usuarios de prueba — y para el flujo de transferencia.
---
# Mercado Pago

Lee `docs/06 Pagos.md`. **Antes de escribir código, consultá la documentación actual de Mercado Pago Developers** (Checkout Pro y Webhooks) y la versión actual del SDK `mercadopago` de Node; no uses firmas de API de memoria.

## Archivos
```
packages/shared/src/pagos/provider.ts          # interfaz PaymentProvider
apps/web/src/lib/pagos/mercadopago.ts          # implementación
apps/web/src/pages/api/webhooks/mercadopago.ts
```

## Crear cobro
- SDK oficial con `MP_ACCESS_TOKEN` (solo servidor).
- Preferencia: ítems con título legible ("Burrito doble · pollo"), `quantity`, `unit_price` (del cálculo del servidor), `currency_id: 'ARS'`.
- `external_reference: pedido.id`, `notification_url: ${PUBLIC_SITE_URL}/api/webhooks/mercadopago`, `back_urls` → página de seguimiento (con token), `auto_return: 'approved'`.
- Guardar `preference_id` en `pedidos.pago_proveedor_id`.
- Teléfono/email del cliente como `payer` solo si existen.

## Webhook
1. Leer `x-signature` y `x-request-id`; validar HMAC con `MP_WEBHOOK_SECRET` según el manifiesto que indica la doc. Firma inválida → 401.
2. Solo procesar notificaciones de tipo `payment`.
3. Idempotencia: insertar en `pagos_eventos` con `evento_id` único; si ya existe → 200 y salir.
4. `GET` del pago por id con el SDK. Verificar `external_reference` = pedido existente y `transaction_amount` = `pedido.total`.
5. Mapear estado: `approved` → `estado_pago = aprobado`, pedido `confirmado`; `rejected`/`cancelled` → `rechazado`; `pending`/`in_process` → sin cambios; `refunded` → `reembolsado`.
6. Responder 200 rápido (MP reintenta si no).

## Pruebas
- Credenciales de prueba + usuarios de prueba (vendedor/comprador) del panel.
- Exponer el webhook local con un túnel (ej. `cloudflared`) o probar en preview de Vercel.
- Casos: aprobado, rechazado, webhook duplicado, monto alterado (debe NO aprobar).

## Transferencia (sin API)
- Datos desde `config_publica`. El admin confirma con "Marcar pagado" → registra en `pedido_historial`.
