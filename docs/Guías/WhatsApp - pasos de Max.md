---
tags: [burritos, guia, whatsapp]
actualizado: 2026-11-03
---
# WhatsApp: los pasos que hace Max

> [!info] Qué vas a lograr
> Un número **nuevo** solo para el bot. Tu número de siempre (+54 9 2271 468521) sigue en tu celular para hablar vos: cuando el bot no sabe algo, le pasa ese número al cliente y a vos te llega un aviso.
> Verificado con la documentación de Meta el 2026-11-03 ([[superpowers/specs/2026-11-02-whatsapp-bot-design|diseño]]). Meta muestra los menús en inglés en su documentación: si en tu pantalla dicen otra cosa, o no coinciden, sacale una captura y mandámela.

> [!warning] Qué podés pasarle a Claude por el chat y qué no
> - ✅ **Sí**: el número del chip, el **Identificador del número de teléfono** (Phone number ID), el **ID de la cuenta de WhatsApp Business**, mensajes de error y capturas. No son secretos.
> - ❌ **Nunca**: el **token** (paso 4), la **clave secreta de la app** (paso 7), el **PIN** de 6 números ni la clave de Anthropic. Van directo a Vercel o a tu anotador. Si mandás una captura donde se ve un token, tapalo antes.

## Antes de empezar
- [ ] Un **chip nuevo** (prepago sirve) en cualquier celular, para recibir un SMS. Ese número **no tiene que tener WhatsApp**. Si alguna vez lo tuvo: WhatsApp → Ajustes → Cuenta → Eliminar cuenta.
- [ ] Una tarjeta para pagar los avisos fuera de las 24 h (centavos de dólar cada uno). Las respuestas del bot entran en las **1.000 gratis por mes**.

## 1. Portfolio comercial de Meta
1. Entrá a https://business.facebook.com con tu Facebook.
2. Creá el portfolio comercial con el nombre del emprendimiento, tu nombre y un email.

## 2. App de desarrollador
1. Entrá a https://developers.facebook.com/apps → **Crear app**.
2. Nombre: `Burrimax Bot` y tu email → **Siguiente**.
3. Caso de uso: **Conectarte con clientes a través de WhatsApp** ("Connect with customers through WhatsApp") → **Siguiente**.
4. Elegí el portfolio del paso 1 → **Siguiente** (te muestra los requisitos para publicar) → **Crear app**.
5. Quedás en **Personalizar caso de uso → Conectar en WhatsApp → Inicio rápido** ("Customize use case → Connect on WhatsApp → Quickstart"). Tocá **Empezar a usar la API** ("Start using the API"): te lleva a **Configuración de la API** ("API Setup").
6. Ahí elegí la cuenta en el desplegable o tocá **Crear una cuenta de WhatsApp Business**. Meta ahora la llama a veces "cuenta de mensajería" ("Messaging account"): es lo mismo. Meta te da un número de prueba: no lo uses para los clientes.
7. Anotá el **ID de la cuenta** que aparece en ese panel (lo vas a usar en el paso 5).

## 3. El número del chip
1. En **Configuración de la API** (API Setup), en el desplegable **De** ("From") → **agregar uno nuevo** ("add a new one"). Si no aparece: en el **Administrador de WhatsApp** (https://business.facebook.com/wa/manage) → **Herramientas de la cuenta → Números de teléfono** ("Account tools → Phone numbers") → **Agregar**.
2. **Nombre visible**: el de la marca (`Burrimax`). Meta lo revisa: tiene que ser el nombre del negocio.
3. Categoría: Restaurante. Poné el número del chip y confirmá con el código que llega por SMS.
4. Anotá el **Identificador del número de teléfono** (Phone number ID). Es `WHATSAPP_PHONE_NUMBER_ID`.

## 4. Token permanente (no el de 24 h)
1. Entrá a https://business.facebook.com/latest/settings → en la columna de la izquierda, **Usuarios del sistema** ("System users") → **Agregar +** (arriba a la derecha).
2. Nombre: `bot-burrimax`, rol **Administrador**.
3. Elegilo en la lista → **Asignar activos** ("Assign assets"):
   - La app `Burrimax Bot`: en **Control total**, prendé **Administrar app** ("Manage app").
   - La cuenta de WhatsApp: en **Control total**, prendé **Administrar cuentas de WhatsApp Business** ("Manage WhatsApp Business accounts").
   - **Asignar activos**.
4. **Generar token**: elegí la app; si te pregunta el vencimiento, **Nunca**; y marcá `business_management`, `whatsapp_business_messaging` y `whatsapp_business_management`.
5. Copialo y guardalo en un lugar seguro: no se vuelve a mostrar. Es `WHATSAPP_TOKEN`.

## 5. Registrar el número (Meta solo deja hacerlo por la API)
1. Entrá a https://developers.facebook.com/tools/explorer (Explorador de la API Graph).
2. Arriba a la derecha elegí la app `Burrimax Bot`. En **Token de acceso** pegá el token del paso 4 (queda en tu navegador).
3. Cambiá **GET** por **POST**. En la ruta escribí `<Phone number ID>/register` (con tu número, sin los signos).
4. En **Parámetros** agregá:
   - `messaging_product` = `whatsapp`
   - `pin` = 6 números que inventes. **Anotalo**: es la verificación en dos pasos del número.
5. **Enviar**. Tiene que decir `"success": true`. Si da error, **no lo repitas**: copiame el mensaje (sin el token). Meta deja solo 10 intentos cada 72 horas.
6. Ahora la ruta `<ID de la cuenta de WhatsApp Business>/subscribed_apps`, POST, sin parámetros → **Enviar** → `"success": true`. Así los mensajes de ese número llegan a la app (si ya estaba conectada, igual dice `success`).

## 6. Medio de pago
En el **Administrador de WhatsApp** (https://business.facebook.com/wa/manage) → configuración de la cuenta → **Pagos** → agregá la tarjeta.

## 7. Las claves en Vercel
En https://vercel.com → proyecto **burrimax** → **Settings → Environment Variables** → **Add**, tipo **Sensitive**, entorno **Production**:

| Nombre | De dónde sale |
|---|---|
| `WHATSAPP_TOKEN` | El token del paso 4 |
| `WHATSAPP_PHONE_NUMBER_ID` | El identificador del paso 3 |
| `WHATSAPP_APP_SECRET` | App de Meta → **Configuración de la app → Básica** → **Clave secreta de la app** → Mostrar |
| `WHATSAPP_VERIFY_TOKEN` | Lo inventás vos: una frase sin espacios, ej. `burrimax-bot-7391`. Anotala para el paso 8 |
| `ANTHROPIC_API_KEY` (opcional) | https://console.anthropic.com → API Keys. Lee los comprobantes de transferencia (alrededor de 1 o 2 centavos de dólar cada uno). Sin esta clave, el comprobante te llega igual para revisarlo vos |

Después: **Deployments** → el último → **⋯** → **Redeploy**. (Astro graba las claves al compilar: sin redeploy no las ve.)

Cuando publiquemos el admin, `WHATSAPP_TOKEN` y `WHATSAPP_PHONE_NUMBER_ID` van también en ese proyecto (para los avisos de "en la plancha", "en camino"…).

## 8. Conectar el webhook
1. En la app de Meta: **Casos de uso → Personalizar → Configuración** ("Use cases → Customize → Configuration"). En apps viejas está en **WhatsApp → Configuración**.
2. **URL de devolución de llamada**: `https://burrimax.vercel.app/api/webhooks/whatsapp`
3. **Token de verificación**: el mismo `WHATSAPP_VERIFY_TOKEN` del paso 7 → **Verificar y guardar**.
4. En **Campos del webhook**, buscá `messages` → **Suscribirse**.

## 9. Pasar la app a modo Activo
1. **Configuración de la app → Básica** → **URL de la política de privacidad**: `https://burrimax.vercel.app/privacidad` → Guardar.
2. Arriba, **Modo de la app: Desarrollo** → pasalo a **Activo** (Publicar). En modo Desarrollo Meta no manda algunos mensajes.

## 10. Probarlo
1. Desde tu celular personal, escribile `hola` al número del bot. Tiene que contestar con 3 botones.
2. Avisame: reviso que todo quede registrado y recién ahí cambio el número de la tienda al del bot. Tu número actual queda como "Hablar con Max".

## Plantillas (avisos fuera de las 24 h)
Casi siempre el bot avisa dentro de las 24 h (gratis). Las plantillas son para cuando pasó más tiempo. En el **Administrador de WhatsApp → Plantillas de mensajes → Crear plantilla**, una por cada fila: categoría **Utilidad**, idioma **Español (ARG)**, y el texto tal cual. Ejemplos para Meta: `{{1}}` = Ana, `{{2}}` = #0012, `{{3}}` = Nos quedamos sin stock.

| Nombre | Texto |
|---|---|
| `pedido_confirmado` | Hola {{1}}, tu pedido {{2}} está confirmado ✅. Ya lo ponemos en la plancha 🌯 |
| `pedido_en_preparacion` | Hola {{1}}, tu pedido {{2}} ya está en la plancha 🔥. Te avisamos cuando esté listo. |
| `pedido_listo_retiro` | Hola {{1}}, tu pedido {{2}} está listo 🌯. Ya podés pasar a retirarlo. |
| `pedido_en_camino` | Hola {{1}}, tu pedido {{2}} salió y va en camino 🛵. Llega en un ratito. |
| `pedido_cancelado` | Hola {{1}}, tu pedido {{2}} se canceló. Motivo: {{3}}. Si tenés dudas, respondé este mensaje. |

Meta las revisa; avisame cuando estén aprobadas. Si cambiás un texto acá, hay que cambiarlo también en `packages/shared/src/whatsapp/textos.ts`.

## Qué hace el bot (ya programado)
- **Pedido con efectivo**: "¡Recibido! confirmado" y el monto a pagar.
- **Transferencia**: monto + alias/CVU/titular (de admin → Pagos) y pide la foto del comprobante. Con la foto: la guarda (privada), la lee con IA si está la clave, le contesta al cliente y a vos te llega un aviso. **El pago lo confirmás vos** con "Llegó la transferencia".
- **Mercado Pago sin pagar**: le manda un link de pago nuevo.
- **Preguntas**: horarios, envíos, precios, alias, sin TACC y "¿cómo va mi pedido?". Si no entiende, botones: Horarios · Envíos · Hablar con Max.
- **Avisos de estado** cuando tocás los botones del tablero (en la plancha, listo para retirar, en camino, cancelado).

Relacionado: [[Planes/WhatsApp automático]] · [[06 Pagos]]
