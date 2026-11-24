---
fecha: 2026-11-16
tipo: plan
---

# Para terminar el proyecto (relevado 2026-11-16)

Estado real revisado en Vercel, Supabase y el repo. Orden = prioridad.

## 1. Lo que falta para cobrar y avisar bien (bloquea el lanzamiento)

| # | Qué | Quién | Detalle |
|---|---|---|---|
| 1 | **Pago de prueba de Mercado Pago** | Max | Webhook de Prueba ya configurado y la web confirma los pagos con la API de MP (2026-11-21). Falta pagar el #0010 desde Edge InPrivate: ver [[Bitácora/2026-11-21]]. |
| 2 | Credenciales de **producción** de MP | Max | Cuando la prueba pase a "pagado" solo por webhook. |
| 3 | **`VAPID_PRIVATE_KEY`** en Vercel (tienda) | Max | No está cargada: los avisos de pedido nuevo al celular no salen. Está en `apps/web/.env`. |
| 4 | **Publicar el admin** | Max | No existe el proyecto en Vercel. Nuevo proyecto, Root Directory `apps/admin`, con las variables de Supabase (y las de WhatsApp cuando estén). |
| 5 | Cambios del admin sin subir | Claude | Hay cambios de otra sesión en `apps/admin` (catálogo, horarios, pagos, stock, tablero, estilos) y `docs/Bitácora/2026-11-10.md`. Revisarlos, probarlos y subirlos o descartarlos con Max. |

## 2. WhatsApp automático con IA

Ya hecho (2026-11-02): webhook con firma, respuesta al pedido según el pago, comprobantes leídos con IA (solo pre-aprobación), avisos de estado desde el admin, preguntas frecuentes **por palabras clave** y "Hablar con Max" con aviso push.

Falta:

| # | Qué | Quién |
|---|---|---|
| 6 | Alta en Meta con chip nuevo → [[Guías/WhatsApp - pasos de Max]]. Cargar en Vercel `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN` y `ANTHROPIC_API_KEY` (ninguna está hoy). | Max |
| 7 | **Asistente con IA** para preguntas abiertas (hoy el bot solo entiende palabras clave). Responde con datos reales de la base: menú, precios, horarios, zonas, sin TACC, estado del pedido. Nunca inventa precios ni promete cosas. | Claude |
| 8 | **Pasarle a Max** cuando haga falta: reclamos, pedido demorado o con problema, cambios en un pedido ya hecho, pedidos grandes o eventos, cuando el cliente pide hablar con una persona, o cuando la IA no está segura. Aviso push a Max y el bot deja de contestar ese chat hasta que Max lo libere. | Claude |
| 9 | **Bandeja de chats en el admin**: ver conversaciones, contestar desde ahí, botón "Lo tomo yo" / "Devolver al bot". | Claude |
| 10 | Plantillas aprobadas por Meta (avisos fuera de las 24 h) y prueba en vivo; cambiar `config_negocio.whatsapp` al número del bot. | Max + Claude |

## 3. Admin

| # | Qué | Quién |
|---|---|---|
| 11 | Fotos de ingredientes nuevos (Storage) y recetas de combos | Claude |
| 12 | Historial de pedidos con filtros | Claude |

## 4. Datos y contenido de Max

13. ~~Alias~~ (`maxilmnz`, cargado 2026-11-24; también va en el mensaje de WhatsApp del pedido). Falta titular y CVU (opcional); horarios reales en modo Automático; precios y zonas reales; qué salsas son sin TACC.
14. Fotos: burrito doble, maíz y un burrito **sin marca de agua** (el actual es provisorio).
15. Marca: ciudad, Instagram, dominio propio. Nombre legal y CUIT para los textos legales.

## 5. Lanzamiento

16. Textos legales (términos, celíacos; `/privacidad` ya está).
17. Lighthouse mobile > 85.
18. Prueba con 5 personas (al menos una mayor de 60).
19. Opcional después: render del burrito enrollado, "Así hacemos tu burrito", AR con escaneo 3D.
