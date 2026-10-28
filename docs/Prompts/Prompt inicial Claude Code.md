---
tags: [burritos, prompts]
---
# Prompt inicial para Claude Code

Pegá esto en la primera sesión, con `CLAUDE.md`, `.claude/skills/` y `docs/` ya en la raíz del repo:

```
Leé CLAUDE.md y las notas de docs/ (empezá por "00 Inicio.md").
Vamos a ejecutar la Fase 0 de "docs/08 Roadmap por fases.md".

1. Armá el monorepo pnpm con apps/web, apps/admin y packages/shared.
2. Configurá Astro (SSR, adaptador Vercel) + Tailwind + React + shadcn/ui en ambas apps.
3. Usando la skill supabase-datos, creá la primera migración con todo el modelo
   de "docs/05 Modelo de datos.md", las políticas RLS y un seed con los
   ingredientes de ejemplo de "docs/02 Reglas de negocio.md".
4. En packages/shared: schemas Zod del armador y del pedido, y pricing.ts con
   tests en Vitest (casos: simple sin extras, doble con agregados, exceder límite = error).
5. Al final, typecheck + tests y un resumen de lo hecho. Si tomaste alguna
   decisión nueva, agregala a docs/09 Decisiones.md.

Antes de empezar, mostrame el plan de archivos y esperá mi OK.
```

## Prompts por fase
- **Fase 1:** "Usando las skills armador-burrito y estilo-3d, hacé la Fase 1. El armador va en 2D primero."
- **Fase 2:** "Usando checkout-pedido, hacé la Fase 2. Efectivo y transferencia de punta a punta."
- **Fase 3:** "Usando panel-admin, hacé la Fase 3."
- **Fase 4:** "Usando pagos-mercadopago, hacé la Fase 4. Verificá la documentación actual de MP antes de codear."
- **Fase 5:** "Usando armador-burrito y estilo-3d, sumá la vista 3D sin romper la 2D."
