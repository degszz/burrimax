---
tags: [burritos, roadmap]
---
# Roadmap por fases

## Fase 0 — Base (1–2 días)
- [x] Monorepo pnpm: `apps/web`, `apps/admin`, `packages/shared`
- [x] Astro + Tailwind + React + shadcn/ui en ambas apps
- [x] Proyecto Supabase `burritos-dev` en la nube (sin Docker, ver [[09 Decisiones]]) con las migraciones de `supabase/migrations/` aplicadas
- [x] RLS + seed con ingredientes de ejemplo (aplicados y probados como anon y admin)
- [x] `packages/shared`: schemas Zod, `pricing.ts` con tests (20 pasan)
- [x] `packages/shared`: tipos generados de Supabase (`db.types.ts`)
- [ ] Deploy en Vercel: **tienda publicada** (burrimax.vercel.app); falta el proyecto del **admin** (Root Directory `apps/admin`)

## Fase 1 — Armador en el hero (ver [[superpowers/specs/2026-10-28-armador-hero-design|diseño]])
- [x] Home = armador, con el catálogo desde Supabase
- [x] Store Zustand del armador (pasos, límites, precio en vivo)
- [x] Armador completo con los renders `.avif` de Max: grilla de opciones, escenario con caída, resumen flotante
- [x] Diálogo doble → simple, resumen final con papas incluidas
- [x] Carrito persistente y **Mis combos** guardados en el celular
- [x] Combos de la casa en la home (con "Agregar" y "Cambiarle algo")
- [x] Imágenes de las 14 salsas
- [ ] Imagen real de cerdo (hoy SVG provisorio)

## Fase 2 — Checkout y pedidos
- [x] Formulario de datos con validación (`/checkout`)
- [x] `POST /api/pedidos` con recálculo en servidor (`crear_pedido` en la base)
- [x] Efectivo y transferencia funcionando: `SUPABASE_SECRET_KEY` cargada en Vercel (2026-10-30); el pedido sale por WhatsApp
- [x] Página de seguimiento con token (`/pedido/[id]`), probada con un pedido de prueba

## Fase 3 — Admin (3 días)
- [x] Login + MFA + rol (MFA exigido también en la base)
- [x] Pedidos en vivo con sonido (consulta cada 8 s; sesión httpOnly)
- [x] Catálogo: precios, sin stock, tamaños, combos y zonas de envío · horarios automáticos
- [x] Pagos (`/pagos`): medios de pago prendidos/apagados y alias, CVU y titular para transferir (la tienda ya los lee de la base)
- [ ] Fotos de ingredientes nuevos (Storage) y recetas de combos (stock, precios y alta de ingredientes ya hechos)
- [ ] Historial de pedidos con filtros
- [x] Impresión de comanda (80 mm)

## Fase 4 — Mercado Pago
- [x] Checkout Pro (SDK `mercadopago` 3.6.1): preferencia con `external_reference` = pedido
- [x] Webhook con firma (validador oficial), idempotencia y control de monto
- [ ] Pruebas con usuarios de prueba — **faltan `MP_ACCESS_TOKEN` (prueba), deploy y `MP_WEBHOOK_SECRET`**

## Fase 5 — Pulido visual del armador
> [!note] El 3D real (WebGL) quedó descartado por ahora: el "3D" lo dan los renders de Max. Ver [[09 Decisiones]].
- [ ] Render del burrito enrollado (simple y doble) para el paso "¡Listo!"
- [ ] Revisar animaciones con 5 personas reales

## Fase 6 — Stripe (1–2 días, solo si se decide)
- [ ] Provider Stripe detrás del interruptor

## Fase 7 — Pulido y lanzamiento
- [ ] Prueba con 5 personas reales (al menos una mayor de 60)
- [ ] Lighthouse mobile > 85
- [ ] Textos legales (celíacos, términos)
- [ ] Dominio propio (SEO, Open Graph, íconos y ficha de Google ya hechos)

## Fase 8 — Contenido visual con IA (secundaria) → [[Planes/Fase 8 - Contenido visual con IA|plan]]
- [ ] Paseo con scroll "Así hacemos tu burrito" en `/como-lo-hacemos` (fotos reales + clips de Higgsfield)
- [ ] "Ver en mi mesa": burrito cerrado en plato con realidad aumentada
- [ ] Renders faltantes con Higgsfield: cerdo, burrito enrollado
