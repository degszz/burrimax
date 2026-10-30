---
fecha: 2026-10-30
tipo: traspaso
---

# Traspaso: WhatsApp Business + realidad aumentada

> Pegá esto al abrir una sesión nueva de Claude Code en `C:\dev\burritos`, o decile: "Leé `docs/Prompts/Traspaso 2026-10-30 - WhatsApp y AR.md` completo y seguí desde ahí".

---

Sos el desarrollador de **Burrimax** (nombre provisorio): web de pedidos de burritos de un emprendimiento local en Argentina. El dueño es Max: cocina él mismo, habla en rioplatense y quiere que avances solo, sin preguntas innecesarias. Cuando algo lo tiene que hacer él (cuentas, claves, fotos, escanear), **guialo paso a paso, con clics concretos y en orden**, verificando antes con la documentación oficial actual. Nunca le pidas que pegue claves en el chat ni las imprimas.

Repo `C:\dev\burritos`, rama `main`; push directo a `main` = deploy automático de la tienda (https://burrimax.vercel.app). El admin (`apps/admin`) todavía no está publicado.

## 0. Al arrancar
1. Leé `CLAUDE.md` (importa `00 Inicio`, `02 Reglas de negocio`, `05 Modelo de datos`).
2. Leé: `docs/Prompts/Traspaso 2026-10-30.md` (estado general, reglas y trucos), `docs/Bitácora/2026-10-30.md`, `docs/09 Decisiones.md` (sobre todo las entradas del 2026-10-30 al final), `docs/10 Preguntas abiertas.md`, `docs/08 Roadmap por fases.md`.
3. Para esta sesión: `docs/Planes/WhatsApp automático.md` y la sección "Ver en mi mesa" de `docs/Planes/Fase 8 - Contenido visual con IA.md`.
4. Skills: `pagos-mercadopago` (paso 1), `checkout-pedido` y `panel-admin` (WhatsApp), `estilo-3d` y `armador-burrito` (AR), `supabase-datos` (tablas nuevas), **`notas-obsidian` al cerrar cada tarea**. Tareas grandes: Superpowers brainstorm → plan → ejecutar → code-review.

## 1. Primero: cerrar la prueba de Mercado Pago (Fase 4)
Estado: claves **de prueba** cargadas en Vercel (`MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, tipo Secret). El cobro ya crea la preferencia en producción (se arregló el import del SDK). El checkout de MP **bloquea navegadores automáticos**, así que el pago lo hace Max.
1. Preguntale a Max si ya pagó. Si no: que abra https://burrimax.vercel.app en una **ventana de incógnito**, arme un burrito, elija **Mercado Pago** y pague con la tarjeta de prueba: Mastercard `5031 7557 3453 0604`, código `123`, vencimiento `11/30`, titular **`APRO`**, DNI `12345678`. Si pide email, cualquiera válido.
2. Verificá con el MCP de Supabase que el pedido quedó `estado_pago = aprobado` y `estado = confirmado`, con su fila en `pagos_eventos` (`procesado = true`) y en `pedido_historial`. Verificá en los logs (`vercel logs --project burrimax --since 30m --json`, tapando cualquier token) que lo cambió el **webhook** y no la vuelta a la página.
3. Mirá en los logs si llegan avisos sin firma (formato viejo IPN: `?topic=payment&id=…`) que respondemos con 401. Si aparecen, confirmá en la doc de MP si `notification_url` acepta `?source_news=webhooks` para recibir solo los firmados.
4. Probá también un rechazo (titular `OTHE`): tiene que quedar `rechazado` sin confirmar el pedido.
5. Limpieza: borrá tus pedidos de prueba (cliente "PRUEBA Claude (borrar)", hoy el #7) y preguntale a Max si borrás o cancelás sus pruebas #4, #5 y #6.
6. Marcá la Fase 4 en el roadmap. Explicale a Max cómo pasar a **credenciales de producción**: Credenciales → Producción → Access Token → reemplazar `MP_ACCESS_TOKEN` en Vercel → Redeploy. La clave del webhook es la misma.

## 2. WhatsApp Business (tarea principal)
Plan completo en `docs/Planes/WhatsApp automático.md`. Decisión tomada: **WhatsApp Cloud API oficial de Meta**, programado en nuestra web (endpoint `/api/webhooks/whatsapp`, igual que Mercado Pago), **sin n8n** para el circuito principal. Nada de librerías no oficiales (whatsapp-web.js, Baileys): Meta banea el número.

**Antes de guiar a Max, verificá en la documentación oficial de Meta (a hoy):**
- Precios para Argentina (cobran por mensaje de plantilla; las respuestas dentro de las 24 h del último mensaje del cliente son gratis).
- **Coexistencia**: si el número actual del local (`+54 9 2271 468521`, el de `config_negocio.whatsapp`) puede seguir en la app WhatsApp Business del celular y a la vez en la API. Si no se puede, Max decide si usa un chip nuevo para el bot.
- Requisitos de verificación del negocio y del nombre visible.

**Lo que hace Max (guialo uno por uno):**
1. Cuenta de **Meta Business** en https://business.facebook.com con los datos del emprendimiento.
2. App en https://developers.facebook.com/apps de tipo **Business**, con el producto **WhatsApp**.
3. Elegir el número del bot (según lo de coexistencia) y registrarlo. Nombre visible del negocio (Meta lo aprueba).
4. Usuario del sistema con **token permanente** (no el temporal de 24 h) y medio de pago para las plantillas.
5. Cargar en Vercel, proyecto tienda, tipo **Secret**: `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_APP_SECRET` (para verificar la firma `X-Hub-Signature-256`) y `WHATSAPP_VERIFY_TOKEN` (lo inventás vos, para el desafío GET del webhook). Después, **Redeploy**: Astro graba las claves al compilar.
6. Configurar el webhook en la app de Meta → `https://burrimax.vercel.app/api/webhooks/whatsapp`, suscribir `messages`.

**Lo que hacés vos (por fases del plan):**
1. Webhook: GET de verificación + POST con firma HMAC SHA-256 verificada (respuesta 401 si no cierra) + tabla `whatsapp_mensajes` idempotente (como `pagos_eventos`, con RLS y migración).
2. Respuesta automática al pedido que llega por WhatsApp (el mensaje ya trae el `#número`): efectivo → confirmado; transferencia → alias/CVU y monto (de `config_negocio`, se cargan en admin → Pagos); Mercado Pago → link de pago.
3. Plantillas de estado ("en preparación", "en camino", "listo") que salen cuando Max toca el botón en el admin. Dejá los textos listos para que Max los mande a aprobar, y explicale cómo.
4. Comprobantes de transferencia: lectura con IA solo como **pre-aprobación**. La confirmación sigue siendo "Llegó la transferencia" en el admin, o el cruce con MP si la API lo permite.
5. Preguntas frecuentes con datos de la base (horarios, zonas); si no sabe, avisa a Max.

Reglas: los pedidos los sigue creando solo `POST /api/pedidos`; WhatsApp nunca marca "pagado" por su cuenta; secretos solo en variables del servidor.

## 3. Realidad aumentada: "Verlo en mi mesa" con el burrito de verdad
**Lo que quiere Max:** tocar "Verlo en mi mesa", que se abra la cámara a **pantalla completa** (ya hecho, sin header ni scroll) y ver el **burrito real apoyado en la mesa**, a tamaño real, pudiendo acercarse con el celular. Uno para el **simple** y otro para el **doble tapa**: son los "platos de demostración".

**Hoy:**
- Si no hay modelo 3D, se abre la cámara con la foto del burrito encima (`VerEnMiMesa.tsx`, se mueve con el dedo).
- Si existe `apps/web/public/modelos/burrito.glb`, el mismo botón abre `VerEnMiMesa3D.tsx` (`<model-viewer>` con AR nativo: Scene Viewer en Android, Quick Look en iPhone con `.usdz`, `ar-placement="floor"` y `ar-scale="fixed"`). `lib/modelo3d.ts` hoy maneja **un solo** modelo.
- Las capas de pantalla completa van con `CapaPantallaCompleta`.

**Lo que hace Max: escanear el burrito (fotogrametría / "escaneo 3D").** Verificá antes qué apps siguen gratis y exportan **GLB y USDZ** a hoy, y guialo paso a paso:
1. App de escaneo en el celular: **Polycam**, **KIRI Engine** o **Luma AI**, modo "Object/Photo capture". En iPhone con LiDAR también sirve la captura de objetos.
2. Burrito cerrado **en el plato con las papas**, armado como se entrega, sobre una mesa con un mantel liso que no brille. Luz pareja, sin sol directo ni sombras duras.
3. Girar alrededor despacio, en 2–3 alturas, unas 50–100 fotos o un video lento, sin mover el plato. Repetir con el **doble tapa**.
4. Exportar **GLB** (Android/web) y **USDZ** (iPhone) de cada uno y pasártelos (o dejarlos en `apps/web/public/modelos/`).
5. Si el escaneo no sale bien: IA de imagen a 3D (Meshy, Tripo, Rodin) con 2–3 fotos, menos fiel.

**Lo que hacés vos:**
1. `lib/modelo3d.ts` y `VerEnMiMesa3D` con un modelo **por tamaño**: `burrito-simple.glb/.usdz` y `burrito-doble.glb/.usdz`. Si falta el de un tamaño, que use el otro o la versión con foto.
2. Escala real (~0,22 m de largo el simple; medir el doble con Max), menos de 5 MB cada archivo: comprimir con `gltf-transform` (Draco o Meshopt + texturas WebP). Revisar que el plato quede apoyado (origen en la base) y que la sombra se vea.
3. Pantalla del 3D a pantalla completa y clara para gente mayor: botón grande "Ponerlo en mi mesa", texto corto "Apuntá a la mesa y movés el celular despacio", y con reduced-motion sin auto-rotate (ya está).
4. Probar en un Android y en un iPhone con la web publicada (lo hace Max; vos le decís qué mirar).
5. Actualizar la Fase 8 en el roadmap y el plan.

## 4. Lo que se hizo hoy (contexto rápido)
- Admin → **Pagos** (`/pagos`): medios de pago y alias/CVU/titular, con un schema compartido (`shared/configNegocio.ts`).
- Plato doble tapa sin texto antes de elegir la tortilla.
- Mercado Pago: arreglado `MercadoPagoConfig is not a constructor` (import con nombre).
- "Verlo en mi mesa" a pantalla completa (portal al `<body>`).
- Tests: 48 de shared y 40 de web; typecheck y build en verde.

## 5. Trucos aprendidos (sumar a los del traspaso anterior)
- **Paquetes CommonJS en el servidor**: import con nombre. Para probar el build real, compilá con un valor falso (`MP_ACCESS_TOKEN=falso pnpm build`) y ejecutá el chunk de `apps/web/.vercel/output/functions/_render.func/.../chunks/` con Node.
- Las variables del servidor se graban al compilar: tras cambiarlas en Vercel, **Redeploy**.
- La CLI `vercel` está logueada (usuario `degszz`, proyecto `burrimax`); el MCP de Vercel no ve el equipo. Logs: `vercel logs --project burrimax --since 15m --json`.
- Capturas a 375 px reales: Edge headless no baja de ~500 px de ventana. Usá Edge con `--remote-debugging-port` y CDP (`Emulation.setDeviceMetricsOverride` con `mobile: true`). Para la cámara: `--use-fake-ui-for-media-stream --use-fake-device-for-media-stream`. Para ver animaciones: `Emulation.setEmulatedMedia` con `prefers-reduced-motion: no-preference`.
- No dejes la terminal parada adentro de una carpeta que el build borra (`.vercel/output`, `dist`): en Windows el build se cuelga.
- `TaskStop` puede dejar vivo el `astro dev`: buscá el PID por el puerto (4321 tienda, 4322 admin) y pará **solo ese**. Nunca mates todos los `msedge` ni todos los `node`.
- Para el pedido de prueba sin pasar por la UI: `POST /api/pedidos` con un JSON (simple: tamaño `a6201d89-…`, tortilla trigo `2df1f6c9-…`, pollo ×2 `87652a13-…`, `entrega: {tipoEntrega: 'retiro'}`). Le llega un push a Max: avisale antes.

## 6. Al terminar cada tarea
`pnpm typecheck && pnpm test`, build, probar a 375 px, actualizar `docs/` (skill `notas-obsidian`), commit convencional en español con `Co-Authored-By` y push a `main`.
