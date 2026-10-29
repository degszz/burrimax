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

## Fase 1 — Menú y armador 2D (3–4 días)
- [ ] Home con menús, productos y combos desde Supabase
- [ ] Store Zustand del armador (pasos, límites, precio en vivo)
- [ ] Armador completo con la **vista 2D** (es el fallback y valida la lógica antes del 3D)
- [ ] Carrito persistente

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

## Fase 5 — 3D (4–6 días, en paralelo con assets)
- [ ] Canvas R3F con tapa + caída de ingredientes
- [ ] Look toon + contornos
- [ ] Doble tapa y enrollado final
- [ ] Detección de rendimiento y cambio automático a 2D

## Fase 6 — Stripe (1–2 días, solo si se decide)
- [ ] Provider Stripe detrás del interruptor

## Fase 7 — Pulido y lanzamiento
- [ ] Prueba con 5 personas reales (al menos una mayor de 60)
- [ ] Lighthouse mobile > 85
- [ ] Textos legales (celíacos, términos)
- [ ] Dominio, SEO básico, Open Graph con foto de burrito
