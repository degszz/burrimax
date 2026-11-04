---
fecha: 2026-11-03
tipo: traspaso
---

# Traspaso: WhatsApp en vivo, admin publicado y prueba de Mercado Pago

> Pegá esto al abrir una sesión nueva de Claude Code en `C:\dev\burritos`, o decile: "Leé `docs/Prompts/Traspaso 2026-11-03 - WhatsApp en vivo.md` completo y seguí desde ahí".

---

Sos el desarrollador de **Burrimax** (nombre provisorio): web de pedidos de burritos de un emprendimiento local en Argentina. El dueño es Max: cocina él mismo, habla en rioplatense y quiere que avances solo, sin preguntas innecesarias. Cuando algo lo tiene que hacer él (cuentas, claves, pagos de prueba), **guialo de a un paso, con clics concretos**, verificando antes con la documentación oficial actual. Si una pantalla no coincide, pedile una captura. Nunca le pidas que pegue claves en el chat ni las imprimas.

Repo `C:\dev\burritos`, rama `main`; push a `main` = deploy automático de la tienda (https://burrimax.vercel.app). El admin (`apps/admin`) **todavía no está publicado**.

## 0. Al arrancar
1. Leé `CLAUDE.md` y estos, en orden: `docs/Bitácora/2026-11-02.md`, `docs/Bitácora/2026-11-03.md`, `docs/Guías/WhatsApp - pasos de Max.md`, `docs/superpowers/specs/2026-11-02-whatsapp-bot-design.md`, `docs/Planes/WhatsApp automático.md`, `docs/10 Preguntas abiertas.md`, `docs/08 Roadmap por fases.md`. Los trucos de las sesiones anteriores están en `docs/Prompts/Traspaso 2026-10-30.md` y `docs/Prompts/Traspaso 2026-10-30 - WhatsApp y AR.md` (sección 5).
2. Skills: `panel-admin` y `checkout-pedido` (WhatsApp y admin), `pagos-mercadopago`, `supabase-datos`, **`notas-obsidian` al cerrar cada tarea**.
3. ~~Cambios sin commitear del 2026-11-03~~ **Hecho** (2026-11-03 noche): commits `9438043` (sin zona) y `da383cb` (MP dentro de Transferencia), push a `main` y deploy en vivo verificado.

## 1. WhatsApp Business con Meta (tarea principal)
**Estado (2026-11-03, noche):** el bot está programado y deployado (commit `e2ec68f`), pero **nunca recibió un mensaje**: `whatsapp_mensajes` está vacía y `config_negocio.whatsapp` sigue siendo el número de Max (`5492271468521`). En Vercel (proyecto `burrimax`) **no hay ninguna variable `WHATSAPP_*`** todavía, así que Max está entre los pasos 1 y 6 de la guía. Max eligió un **chip nuevo** para el bot; su número queda como "Hablar con Max" (`config_negocio.whatsapp_atencion`).

La guía ya se corrigió contra la doc de Meta del 2026-11-03 (pasos 2 a 5 y 8). Falta verificar el paso 6 (dónde se carga la tarjeta en el Administrador de WhatsApp) y el paso 9 cuando lleguen.

Para ver las variables sin valores: `MSYS_NO_PATHCONV=1 vercel api "/v10/projects/burrimax/env" --scope degs-projects` y quedate solo con `key`, `type` y `target` (en Git Bash, sin `MSYS_NO_PATHCONV` la ruta se rompe; `vercel env ls` no sirve porque el repo no está linkeado).

Max puede pasarte por el chat el número del chip, el Phone number ID y el ID de la cuenta (no son secretos): con eso podés cargar vos `WHATSAPP_PHONE_NUMBER_ID` en Vercel. El token, la clave secreta de la app, el PIN y la clave de Anthropic **nunca** por el chat.

**Lo que hace Max** → la guía `docs/Guías/WhatsApp - pasos de Max.md` (pasos 1 a 10 + plantillas):
1. Preguntale **en qué paso de la guía quedó** y seguí desde ahí, de a un paso. Antes de cada paso, confirmá con la documentación de Meta que el menú sigue llamándose igual (cambia seguido). Si algo cambió, corregí la guía.
2. Las claves van directo a Vercel, tipo **Sensitive**, entorno **Production**, y después **Redeploy** (Astro las graba al compilar).
3. `ANTHROPIC_API_KEY` es opcional (lee comprobantes, ~1–2 centavos de dólar cada uno). Preguntale si la quiere.

**Lo que hacés vos, cuando Max termine el paso 8 (webhook):**
1. Revisá en los logs de Vercel que llegaron el GET de verificación (200) y los POST con firma válida. Ninguno debería dar 401.
2. **Prueba 1:** Max escribe `hola` desde su celular personal al número del bot. Tiene que contestar con 3 botones. Verificá en `whatsapp_mensajes` la fila entrante y la saliente, con `procesado = true`.
3. **Prueba 2, un pedido sin cambiar todavía el número de la tienda:** Max arma un pedido con **Transferencia** en la web. Le abre WhatsApp a su propio número; que **copie ese mensaje y se lo mande al bot**. El bot tiene que encontrar el pedido por el link de seguimiento y contestar con el monto y el alias. Avisale antes: le llega un push por el pedido nuevo.
4. **Prueba 3:** que mande una foto cualquiera como comprobante. Verificá que se guardó en el bucket privado `comprobantes` y que aparece en el tablero del admin. **Nunca** debe marcarse pagado solo.
5. Si todo anda: con OK de Max, cambiá `config_negocio.whatsapp` al número del bot. Es un dato, no una migración: hacelo desde el admin si tiene el campo; si no, con `execute_sql`, mostrándole antes el `update`. Dejá `whatsapp_atencion` con el número de Max.
6. **Plantillas:** que cree las 5 de la guía (categoría Utilidad, Español ARG). Cuando Meta las apruebe, verificá que los nombres y textos coinciden con `packages/shared/src/whatsapp/textos.ts`.
7. Marcá los ítems de WhatsApp en el roadmap y el plan.

**Idea para proponerle (no la hagas sin su OK):** que la respuesta del bot a una transferencia sume "¿Preferís pagar con Mercado Pago? Tocá acá" con un link de pago nuevo, igual que en el checkout.

## 2. Publicar el admin en Vercel
Hace falta para que salgan los avisos de estado por WhatsApp ("en la plancha", "en camino"…): los manda el servidor del admin.
1. Proyecto nuevo de Vercel desde el mismo repo, **Root Directory `apps/admin`**. Verificá antes en la doc de Vercel y Astro cómo se configura un monorepo pnpm hoy.
2. Variables que usa el admin: `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`. El admin **no** lleva la clave secreta de Supabase.
3. En Supabase Auth, sumá la URL del admin a las URLs permitidas si el login la necesita. Probá el login con MFA (lo hace Max) y un cambio de estado que mande un aviso.
4. Tildá en el roadmap "Deploy en Vercel" (Fase 0).

## 3. Cerrar la prueba de Mercado Pago (sigue pendiente)
Hoy **no hay ningún pedido pagado con MP** en la base. Los pasos están en la sección 1 de `docs/Prompts/Traspaso 2026-10-30 - WhatsApp y AR.md` (tarjeta APRO, verificar que lo apruebe **solo el webhook**, probar un rechazo y explicar el paso a credenciales de producción).

Lo nuevo: en el checkout ya no está "Mercado Pago" como opción. Max tiene que elegir **Transferencia → "Pagar $X con Mercado Pago"**. Es la primera prueba de punta a punta de ese botón.

## 4. Pendientes chicos
- **Alias, CVU y titular**: Max los carga en admin → **Pagos**. Sin eso, el checkout y el bot dicen "te pasamos el alias por WhatsApp".
- **Pestaña "Zonas de envío" del admin** (`EditorCatalogo.tsx`, `lib/catalogo.ts`, `api/catalogo.ts`): el delivery ya no cobra por zona. Preguntale a Max si se saca.
- **Bloque del alias en el checkout**: hoy aparece debajo de todas las opciones (después de Efectivo). Proponele moverlo justo debajo de Transferencia.
- **Horarios reales**: los carga Max en admin → Horarios (hoy la tienda está "abierta a mano").
- Preguntas abiertas que tocan al bot: cuánto se espera una transferencia antes de cancelar, y el nombre legal y CUIT para `/privacidad`.

## 5. Trucos nuevos
- **Pruebas a 375 px:** Edge instalado + `playwright-core` del caché de npx (`C:/Users/Maxi/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright-core`), con `executablePath` de Edge y `viewport: {width: 375}` en el contexto. Funciona en headless. No descargues navegadores.
- **Simular datos sin tocar la base:** con `context.route` sobre `/checkout`, cambiá las props serializadas de la isla en el HTML (`&quot;mercadopago&quot;:[0,false]` → `true`, el alias, etc.). Sirve para ver el alias y el botón de MP en local, donde no hay credenciales de MP ni alias cargado.
- **Carrito de prueba:** `localStorage['burritos:carrito:v1'] = {state:{items:[…]},version:0}` con `addInitScript`.
- **Errores de consola de Vite** (`[vite]` websocket) en headless: son ruido, filtralos.
- **La base de prueba** es la misma que usa la tienda publicada (`burritos-dev`, id `qoxzylgpstmzjzgxnetw`): cualquier pedido de prueba le manda un push a Max.

## 6. Al terminar cada tarea
`pnpm typecheck && pnpm test`, build si tocaste el servidor, probar a 375 px, actualizar `docs/` (skill `notas-obsidian`), commit convencional en español con `Co-Authored-By` y push a `main`.
