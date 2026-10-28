---
tags: [burritos, pagos]
---
# Pagos

## ⚠️ Stripe en Argentina
Stripe **no acepta cuentas de negocios registradas en Argentina**. Para usarlo hace falta una empresa en un país soportado (ej. LLC en EE.UU. vía Stripe Atlas, o empresa en UK) con su cuenta bancaria. Además cobra en otra moneda y con comisiones más altas que MP para clientes locales.

**Decisión:** Mercado Pago es el medio principal. Stripe se construye detrás del interruptor `pago_stripe_activo` (apagado) y de un `PaymentProvider` común, para prenderlo si algún día hay entidad en el exterior o clientes extranjeros. → [[09 Decisiones]]

## Arquitectura común
```ts
interface PaymentProvider {
  crearCobro(pedido: PedidoServidor): Promise<{ redirectUrl: string; proveedorId: string }>;
  verificarWebhook(req: Request): Promise<EventoPago | null>; // null = firma inválida
}
```
- `POST /api/pedidos` → valida, recalcula precio, guarda pedido `pendiente_pago`, llama `crearCobro`, devuelve `redirectUrl`.
- `POST /api/webhooks/mercadopago` y `/api/webhooks/stripe` → verifican firma, guardan en `pagos_eventos` (si `evento_id` ya existe, responden 200 y no hacen nada), consultan el pago al proveedor, actualizan pedido.
- La URL de retorno ("success") **solo muestra** el seguimiento; nunca marca pagado.

## Mercado Pago — Checkout Pro
- Crear **preferencia** desde el servidor con los ítems, `external_reference = pedido.id`, `notification_url` (webhook), `back_urls` (success/failure/pending) y `auto_return`.
- Webhook: validar header `x-signature` con la clave secreta de webhooks; luego `GET` del pago por id y confirmar `status = approved` y monto = `pedido.total`.
- Moneda ARS. Cubre tarjetas, débito, dinero en cuenta y cuotas.
- Probar con cuentas de prueba (vendedor y comprador) del panel de desarrolladores.

## Stripe — Checkout Session (apagado por defecto)
- `checkout.sessions.create` con `line_items`, `metadata.pedido_id`, `success_url`, `cancel_url`.
- Webhook `checkout.session.completed` verificado con `constructEvent` usando el **body crudo** y el signing secret.
- Probar con Stripe CLI (`stripe listen --forward-to`).

## Transferencia
- Mostrar alias/CVU/titular desde `config_negocio`, botón **Copiar** y botón **Enviar comprobante por WhatsApp** (mensaje prearmado con número de pedido y total).
- El local verifica en su cuenta y toca **"Marcar pagado"** en el admin.
- Pedido queda `pendiente_pago`; si no se confirma en X minutos `[A CONFIRMAR]`, alerta en el admin.

## Efectivo
- Campo "¿Con cuánto pagás?" (opcional) → el admin ve el vuelto calculado.
- Pedido entra directo como `confirmado`.

## Variables de entorno
```
MP_ACCESS_TOKEN=            # servidor
MP_WEBHOOK_SECRET=          # servidor
PUBLIC_MP_PUBLIC_KEY=       # solo si se usa Bricks
STRIPE_SECRET_KEY=          # servidor
STRIPE_WEBHOOK_SECRET=      # servidor
PUBLIC_SITE_URL=
SUPABASE_SERVICE_ROLE_KEY=  # servidor, NUNCA en el cliente
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_ANON_KEY=
```
