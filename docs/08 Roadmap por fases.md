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
- [ ] Deploy de prueba en Vercel (las dos apps) — falta `vercel login`

## Fase 1 — Armador en el hero (ver [[superpowers/specs/2026-10-28-armador-hero-design|diseño]])
- [x] Home = armador, con el catálogo desde Supabase
- [x] Store Zustand del armador (pasos, límites, precio en vivo)
- [x] Armador completo con los renders `.avif` de Max: grilla de opciones, escenario con caída, resumen flotante
- [x] Diálogo doble → simple, resumen final con papas incluidas
- [x] Carrito persistente y **Mis combos** guardados en el celular
- [ ] Sección de prehechos y combos del menú (están en la base, falta mostrarlos)
- [ ] Imágenes reales de cerdo y salsas (hoy SVG provisorios)

## Fase 2 — Checkout y pedidos (2–3 días)
- [ ] Formulario de datos con validación
- [ ] `POST /api/pedidos` con recálculo en servidor
- [ ] Efectivo y transferencia funcionando de punta a punta
- [ ] Página de seguimiento con token

## Fase 3 — Admin (3 días)
- [ ] Login + MFA + rol
- [ ] Pedidos en vivo con Realtime y sonido
- [ ] Catálogo y configuración
- [ ] Impresión de comanda

## Fase 4 — Mercado Pago (2 días)
- [ ] `PaymentProvider` + Checkout Pro
- [ ] Webhook con firma e idempotencia
- [ ] Pruebas con usuarios de prueba

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
- [ ] Dominio, SEO básico, Open Graph con foto de burrito

## Fase 8 — Contenido visual con IA (secundaria) → [[Planes/Fase 8 - Contenido visual con IA|plan]]
- [ ] Paseo con scroll "Así hacemos tu burrito" en `/como-lo-hacemos` (fotos reales + clips de Higgsfield)
- [ ] "Ver en mi mesa": burrito cerrado en plato con realidad aumentada
- [ ] Renders faltantes con Higgsfield: cerdo, salsas, burrito enrollado
