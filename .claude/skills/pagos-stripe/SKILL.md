---
name: pagos-stripe
description: Usar para la integración de Stripe Checkout Session y su webhook, que va detrás del interruptor pago_stripe_activo porque Stripe no abre cuentas de negocios en Argentina.
---
# Stripe (apagado por defecto)

Lee `docs/06 Pagos.md`. Stripe **no acepta negocios registrados en Argentina**; requiere una entidad en un país soportado. Por eso:
- Implementar `PaymentProvider` de Stripe completo, pero el botón solo aparece si `config_negocio.pago_stripe_activo = true` **y** existe `STRIPE_SECRET_KEY`.
- Si falta configuración, el endpoint responde error claro y la tienda oculta la opción. Nunca romper el checkout por Stripe.
- Consultá la documentación y versión actual del SDK `stripe` antes de codear.

## Archivos
```
apps/web/src/lib/pagos/stripe.ts
apps/web/src/pages/api/webhooks/stripe.ts
```

## Crear cobro
- `checkout.sessions.create` modo `payment`, `line_items` con `price_data` del cálculo del servidor, `metadata: { pedido_id }`, `success_url` → seguimiento, `cancel_url` → carrito.
- Moneda según lo que soporte la cuenta (ARS si la cuenta lo permite; si no, definir conversión → anotar en `docs/10 Preguntas abiertas.md`).

## Webhook
- Leer el **body crudo** (`await request.text()`), verificar con `stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)`.
- Idempotencia con `pagos_eventos` (`event.id`).
- `checkout.session.completed` con `payment_status = 'paid'` → aprobar pedido. `checkout.session.expired` → dejar pendiente o cancelar.

## Pruebas
- `stripe listen --forward-to localhost:4321/api/webhooks/stripe`, tarjetas de prueba (`4242…`).
