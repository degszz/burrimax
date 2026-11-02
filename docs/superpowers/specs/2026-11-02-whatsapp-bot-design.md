---
fecha: 2026-11-02
tema: Bot de WhatsApp (Cloud API)
estado: aprobado (Max eligió "chip nuevo para el bot"; el resto sigue el plan de [[Planes/WhatsApp automático]])
---
# Bot de WhatsApp — diseño

## Para qué
Que el cliente mande el pedido por WhatsApp y todo lo demás pase solo: confirmación, datos para pagar, comprobante, avisos de estado y preguntas comunes. Max cocina: su celular es la central (avisos push) y solo interviene si algo sale raro.

## Lo que dice Meta hoy (verificado 2026-11-02)
- **Precios**: por mensaje entregado. Desde el **1/10/2026** también se cobran las respuestas dentro de las 24 h ("service"), pero cada número tiene **1.000 gratis por mes**. Las plantillas (fuera de las 24 h) se cobran según la categoría: en Argentina, utilidad ≈ US$0,026 y marketing ≈ US$0,062 (dato de terceros; la planilla oficial no se pudo leer).
- **Coexistencia** (mismo número en la app y en la API): solo para Tech Providers / Solution Partners vía Embedded Signup. **Descartada**: Max usa un **chip nuevo** para el bot.
- **Límite sin verificar el negocio**: 250 clientes distintos por día **fuera** de la ventana de 24 h. Las respuestas a quien escribió primero no cuentan.
- El número nuevo se **registra solo por API** (`POST /{phone-number-id}/register` con PIN de 6 dígitos). La API va en **v26.0**. Plantillas en `es_AR`.

## Decisiones
1. **Dos números.** `config_negocio.whatsapp` = el del bot (a donde va el pedido). Nueva columna `config_negocio.whatsapp_atencion` = el de Max, para hablar con una persona. El cambio de número se hace recién cuando el bot responde bien.
2. **Webhook** `GET/POST /api/webhooks/whatsapp` en la tienda: el GET responde el desafío con `WHATSAPP_VERIFY_TOKEN`; el POST verifica `X-Hub-Signature-256` (HMAC-SHA256 del cuerpo crudo con `WHATSAPP_APP_SECRET`, comparación en tiempo constante) o responde 401. Ignora otros `phone_number_id`.
3. **Tabla `whatsapp_mensajes`** (entrantes y salientes), `wa_message_id` único = idempotencia; `procesado` como en `pagos_eventos`. RLS: el admin lee todo y solo agrega salientes.
4. **Encontrar el pedido**: el mensaje del checkout trae el link de seguimiento con id + token → se verifica contra la base (lo más seguro). Si no hay link, `#número` + teléfono del cliente (comparando el número nacional de 10 dígitos, contemplando el 0 y el 15).
5. **Respuesta al pedido**: efectivo → "¡Recibido! confirmado"; transferencia → monto + alias/CVU/titular + "mandame la foto del comprobante"; Mercado Pago sin pagar → link de pago nuevo (preferencia). Pagado → "ya está pago".
6. **Comprobantes**: la imagen/PDF va a Storage (`comprobantes`, privado). Si existe `ANTHROPIC_API_KEY`, Claude lee monto, destino y número de operación y se compara con el pedido: **solo pre-aprobación** (mensaje al cliente + aviso a Max). **Nunca marca pagado**: eso sigue siendo "Llegó la transferencia" en el admin.
7. **Avisos de estado**: los manda el **servidor del admin** al cambiar el estado (con `WHATSAPP_TOKEN` en sus variables; el admin sigue sin clave secreta de Supabase). Solo a clientes que escribieron al bot por ese pedido. Ventana abierta (< 24 h) → texto libre (gratis dentro de los 1.000); cerrada → plantilla aprobada. Nunca frena el cambio de estado.
8. **Preguntas frecuentes** por palabras clave (sin IA): horarios, envíos/zonas, precios, alias, sin TACC, estado de mi pedido. Si no entiende: menú con botones (Horarios · Envíos · Hablar con Max). "Hablar con Max" → link al número de Max + aviso push a Max con el link al chat del cliente.
9. **Anti-spam**: más de 6 mensajes de un número en 1 minuto → deja de contestar ese minuto (cada respuesta gasta de los 1.000 gratis).
10. **Código**: lógica pura en `packages/shared/src/whatsapp/` (texto, teléfonos, intención, firma, cliente de la API con `fetch`), con tests. Orquestación en `apps/web/src/lib/whatsapp/` y el endpoint.

## Fuera de alcance
- Cruce automático con los movimientos de Mercado Pago (opción B del plan): a verificar si la API expone ingresos por CVU.
- Asistente con IA para preguntas abiertas.
- Bandeja de chats en el admin (Max contesta desde su número con el link del aviso).

## Variables nuevas (Vercel, tipo Secret)
Tienda: `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN`, opcional `ANTHROPIC_API_KEY`. Admin: `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`.
