---
tags: [burritos, plan, whatsapp, automatizacion]
estado: propuesta
prioridad: alta (después del admin)
actualizado: 2026-10-30
---
# WhatsApp automático (sin una persona contestando)

**Objetivo:** que el cliente mande su pedido por WhatsApp y todo lo demás pase solo: confirmación, datos para pagar, verificación del pago y avisos de "en preparación / en camino / listo". Una persona solo interviene si algo sale raro.

> [!warning] Cosas a confirmar antes de empezar (las verifico con la documentación oficial de Meta al arrancar)
> - Precios actuales de la API de WhatsApp para Argentina (cambiaron en 2025: cobran por mensaje de plantilla, las respuestas dentro de las 24 h son gratis).
> - Si el número puede seguir usándose en la app de WhatsApp Business del celular al mismo tiempo ("coexistencia"). Si no, el número pasa a ser solo del bot.

## La pieza central: WhatsApp Cloud API (oficial de Meta)
- Es la única forma **segura** de automatizar. Las librerías "no oficiales" (whatsapp-web.js, Baileys) simulan un celular y **Meta banea el número** — descartadas.
- Se conecta directo con Meta (gratis el acceso) o con un intermediario (360dialog, Twilio) si se quiere soporte. Arrancamos directo.
- Meta manda cada mensaje que llega a **nuestro servidor** (`POST /api/webhooks/whatsapp`, con firma verificada igual que Mercado Pago) y nosotros respondemos por API.

## Cómo queda el circuito
1. El cliente arma el burrito y toca "Enviar pedido por WhatsApp" (ya hecho). El mensaje lleva **#número de pedido**.
2. Llega al webhook → buscamos el pedido por número y teléfono → respuesta automática al instante:
   - Efectivo: "¡Recibido, Ana! Pedido #0012 confirmado. Te avisamos cuando salga."
   - Transferencia: alias/CVU + monto exacto + "mandá el comprobante acá".
   - Mercado Pago: link de pago (preferencia de Checkout Pro).
3. Cada vez que en el **admin** se avanza el estado (confirmado → en preparación → en camino → entregado) sale un mensaje automático (plantilla aprobada por Meta). El cliente también lo ve en la página de seguimiento.
4. Preguntas comunes ("¿hasta qué hora abren?", "¿hacen envíos a…?") → respuestas automáticas con los datos de la base (horarios, zonas). Opcional: un asistente con IA (Claude) que solo responde con esa información y, si no sabe, avisa a una persona.

## Verificar comprobantes de transferencia (lo más delicado)
Una foto de comprobante **se puede falsificar**, así que nunca alcanza sola. De mejor a peor:

| Opción | Cómo | Automático | Seguro |
|---|---|---|---|
| **A. Que paguen con Mercado Pago (Checkout Pro)** | El pago se confirma por webhook firmado; no hay comprobante | ✅ total | ✅ total |
| **B. Transferencia a la cuenta de Mercado Pago + cruce por API** | Monto **único** por pedido (ej. $9.000 → $9.017) y buscamos en los movimientos de la cuenta un ingreso con ese monto y hora | ✅ | ✅ (si la API de MP expone los ingresos por CVU — **a verificar**) |
| **C. Leer el comprobante con IA** | Claude lee la imagen/PDF: monto, fecha, CVU/alias destino, número de operación. Se compara con el pedido y se guarda el número de operación para que no se reuse | ✅ | ⚠️ solo como **pre-aprobación**; se confirma con B o con un vistazo |
| D. Persona que mira el comprobante | Botón "Marcar pagado" en el admin (ya previsto) | ❌ | ✅ |

**Propuesta:** empujar A (botón Mercado Pago bien visible), usar C para responder al instante ("¡Recibimos tu comprobante de $9.017!") y B para confirmar de verdad. Si B no es posible, C + "Marcar pagado" en el admin con un toque.

## Qué necesita Max
- [ ] Un número de teléfono para el negocio (puede ser el actual si se confirma la coexistencia; si no, un chip nuevo)
- [ ] Cuenta de **Meta Business** (business.facebook.com) verificada con los datos del emprendimiento
- [ ] Nombre visible del negocio en WhatsApp (Meta lo aprueba)
- [ ] Tarjeta para los mensajes de plantilla (los avisos de estado); el costo es de centavos de dólar por mensaje

## Qué hago yo (fases)
1. Webhook de WhatsApp con firma + tabla `whatsapp_mensajes` (idempotente, como `pagos_eventos`)
2. Respuestas automáticas al pedido (efectivo / transferencia / Mercado Pago)
3. Plantillas de estado disparadas desde el admin
4. Comprobantes: lectura con IA (C) + cruce con Mercado Pago (B, si la API lo permite)
5. Preguntas frecuentes con datos de la base; derivar a persona si no sabe

Relacionado: [[06 Pagos]] · [[07 Panel admin]] · [[09 Decisiones]]
