# CLAUDE.md — Web de Burritos ([NOMBRE DEL EMPRENDIMIENTO])

> Contexto principal del proyecto para Claude Code. La documentación completa vive en `docs/` (vault de Obsidian). Antes de una tarea grande, leé la nota relevante de `docs/`.

@docs/00 Inicio.md
@docs/02 Reglas de negocio.md
@docs/05 Modelo de datos.md

## Qué es
Web de pedidos de burritos para un emprendimiento local en Argentina. El centro de la experiencia es el **armador de burritos 3D** (estilo caricatura): el cliente elige tamaño (tapa simple o doble), la tapa/masa, el relleno, salsas y agregados, y lo ve armarse en pantalla. También hay menús, burritos prehechos y combos.

Público: cualquier persona desde el celular, incluidas personas mayores o poco técnicas. **Si algo no se entiende en 3 segundos, está mal diseñado.**

## Stack
- **Monorepo** con pnpm workspaces:
  - `apps/web` → tienda pública (Astro + islas React)
  - `apps/admin` → panel de administración, app separada en subdominio `admin.`
  - `packages/shared` → tipos, schemas Zod, **lógica de precios** y constantes compartidas
- **Astro** (SSR con adaptador de Vercel para endpoints y webhooks) + **Tailwind** + **shadcn/ui** (dentro de islas React)
- **React Three Fiber + drei** para el armador 3D (isla `client:visible`, carga diferida)
- **Zustand** para el estado del armador y del carrito (persistido en localStorage con try/catch)
- **Supabase**: Postgres, Auth (solo admin), Storage (imágenes y modelos .glb), Realtime (pedidos nuevos en el admin)
- **Pagos**: Mercado Pago (Checkout Pro) principal · Stripe detrás de feature flag · efectivo · transferencia
- MCPs: GitHub, Supabase, y en `.mcp.json`: `astro-docs` (docs actuales de Astro), `shadcn` (componentes) y `mercadopago` (doc oficial y credenciales de prueba). Usalos antes de responder de memoria.
- Plugins instalados y cómo combinarlos: ver `docs/11 Plugins y herramientas.md`. Flujo por fase: Superpowers brainstorm → write-plan → execute-plan → code-review.

Antes de instalar una librería o usar una API de pagos, verificá la versión actual y su documentación; no confíes en APIs de memoria.

## Comandos
```bash
pnpm install
pnpm dev:web        # tienda en localhost:4321
pnpm dev:admin      # admin en localhost:4322
pnpm build
pnpm typecheck
pnpm test           # Vitest (lógica de precios y validaciones)
pnpm db:types       # regenera tipos de Supabase en packages/shared
```

## Reglas no negociables
1. **El precio se calcula SIEMPRE en el servidor** con `packages/shared/pricing.ts` y datos de la base. El total que manda el cliente se ignora.
2. **Los límites de ingredientes se validan en cliente Y servidor** (mismo schema Zod de `shared`).
3. **El cliente nunca escribe directo en `pedidos`.** Los pedidos se crean desde `POST /api/pedidos` con service role, después de validar.
4. **Un pedido online solo pasa a "pagado" por webhook verificado** (firma de MP o Stripe), nunca por la URL de retorno.
5. Webhooks **idempotentes**: registrar cada evento en `pagos_eventos` y no procesar dos veces el mismo.
6. Secretos solo en variables de entorno del servidor. Nada de claves privadas con prefijo `PUBLIC_`.
7. El admin es otra app, otro dominio, con login + MFA y rol `admin` en `app_metadata`. RLS en todas las tablas.
8. Teléfono obligatorio, **email opcional**. Nunca pedir datos que no se usan.
9. Mobile first. Botones grandes (mín. 48px), texto claro, un paso a la vez.
10. Accesibilidad: respetar `prefers-reduced-motion` y tener **fallback 2D** si no hay WebGL o el equipo es lento.

## Convenciones
- Código y nombres de tablas/variables en **español** (`pedidos`, `ingredientes`, `tamano`), salvo términos técnicos estándar.
- Textos de interfaz en español rioplatense, tono cercano ("Armá tu burrito", "Elegí tu tapa").
- Precios en ARS, guardados como enteros (centavos no; pesos enteros) en `integer`.
- Componentes: `PascalCase.tsx`; utilidades: `camelCase.ts`; rutas Astro en kebab-case.
- Cada cambio de base = migración en `supabase/migrations/`, nunca cambios manuales.
- Commits convencionales en español: `feat: armador paso de salsas`.

## Skills del proyecto (`.claude/skills/`)
| Skill | Cuándo usarla |
|---|---|
| `armador-burrito` | Todo lo del armador: pasos, límites, estado, 3D |
| `estilo-3d` | Diseño visual, modelos, animaciones, fallback 2D |
| `supabase-datos` | Tablas, migraciones, RLS, tipos |
| `checkout-pedido` | Carrito, formulario de datos, creación del pedido |
| `pagos-mercadopago` | Checkout Pro, webhook, transferencia |
| `pagos-stripe` | Checkout Session, webhook, feature flag |
| `panel-admin` | App admin, auth, pedidos en tiempo real |
| `notas-obsidian` | **Al cerrar cada tarea**: actualizar roadmap, bitácora, decisiones y preguntas en `docs/` |

## Cómo trabajar
- Seguí el roadmap de `docs/08 Roadmap por fases.md`; no adelantes fases sin avisar.
- Si tomás una decisión de arquitectura, agregala a `docs/09 Decisiones.md`.
- Si algo del negocio no está definido, anotalo en `docs/10 Preguntas abiertas.md` y usá el valor de ejemplo marcado como `[A CONFIRMAR]`.
- Al terminar una tarea: `pnpm typecheck && pnpm test` y probar en viewport de 375px.
