---
tags: [burritos, herramientas, claude-code]
---
# Plugins, skills y MCPs para Claude Code

## 1. Instalar (una sola vez, dentro de Claude Code)
```text
# Superpowers
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace

# Oficiales de Anthropic (marketplace claude-plugins-official, ya viene registrado)
/plugin install frontend-design@claude-plugins-official
/plugin install security-guidance@claude-plugins-official
/plugin install code-review@claude-plugins-official
/plugin install commit-commands@claude-plugins-official
/plugin install typescript-lsp@claude-plugins-official
/plugin install playwright@claude-plugins-official
/plugin install vercel@claude-plugins-official
/plugin install skill-creator@claude-plugins-official
/plugin install claude-code-setup@claude-plugins-official
```
`typescript-lsp` necesita `npm i -g typescript-language-server typescript`.

## 2. Skills de Supabase (en la terminal, raíz del repo)
```bash
npx skills add supabase/agent-skills
```

## 2b. Skills de skills.sh (en la terminal, raíz del repo)
```bash
npx skills add vercel-labs/agent-skills   # elegí: vercel-react-best-practices, vercel-composition-patterns, web-design-guidelines
npx skills add shadcn/ui                  # skill oficial de shadcn
npx skills add mattpocock/skills          # elegí: grill-me (te interroga el plan antes de codear)
npx skills add vercel-labs/skills         # find-skills: busca skills nuevas cuando haga falta
```
- **vercel-react-best-practices / composition-patterns** → las islas React del armador, carrito y admin.
- **web-design-guidelines** → accesibilidad y UX (botones grandes, contraste, formularios).
- **grill-me** → antes de cada fase, que te haga preguntas incómodas del plan.
- No instalar `tdd` de mattpocock **y** el TDD de Superpowers juntos: hacen lo mismo y se pisan. Quedate con Superpowers.
- `agent-browser` de Vercel se superpone con el plugin `playwright`; usá uno solo.
- En skills.sh no hay skills destacadas de Mercado Pago, Stripe, Astro ni Three.js: para eso están el MCP de MP, el MCP de Astro y nuestras skills `pagos-*` y `estilo-3d`.

## ✅ Selección final para este proyecto
**Instalar sí:**
1. Superpowers (flujo de trabajo + TDD + debugging)
2. Plugins oficiales: `frontend-design`, `security-guidance`, `code-review`, `commit-commands`, `typescript-lsp`, `playwright`, `vercel`
3. `supabase/agent-skills`
4. `vercel-labs/agent-skills` → solo `vercel-react-best-practices` y `web-design-guidelines`
5. `shadcn/ui`
6. `kepano/obsidian-skills` → para que Claude escriba bien en Obsidian (ver abajo)
7. MCPs de `.mcp.json`: astro-docs, shadcn, mercadopago

**Opcionales:** `grill-me` (si querés que te cuestione cada plan), `skill-creator`, `claude-code-setup`, `find-skills`.
**No instalar:** `tdd` de mattpocock (duplica Superpowers), `agent-browser` (duplica playwright), skills de "taste" de terceros (se pelean con `frontend-design` y `estilo-3d`).

## 🔗 Integración con Obsidian
1. **El vault vive dentro del repo:** en Obsidian → "Abrir carpeta como vault" → elegí `docs/`. Claude Code lee y escribe esas mismas notas, sin MCP ni sincronización extra.
2. **Skills de Obsidian:**
   ```bash
   npx skills add kepano/obsidian-skills    # obsidian-markdown, obsidian-bases, json-canvas
   ```
   Así Claude respeta wikilinks, callouts, frontmatter y puede armar canvas (ej. mapa del flujo de pedido).
3. **Skill del proyecto `notas-obsidian`:** le dice a Claude qué nota actualizar al terminar cada tarea (roadmap, bitácora, decisiones, preguntas abiertas).
4. **Plugin "Git" de la comunidad de Obsidian:** commitea las notas solo, así lo que escribís en Obsidian llega al repo y lo que escribe Claude aparece en tu vault.
5. **Ciclo de trabajo:** vos respondés preguntas y ajustás reglas en Obsidian → le decís a Claude "leé docs/10 y seguí" → Claude codea y actualiza las notas → lo ves en Obsidian (vista gráfica, tareas tildadas, bitácora).
6. Opcional: plugin **Dataview** o **Bases** para ver todas las tareas pendientes del roadmap en una tabla.

## 3. MCPs del proyecto
Ya están en `.mcp.json` (raíz del repo): **astro-docs**, **shadcn** y **mercadopago**. Al abrir Claude Code te pide aprobarlos; en `/mcp` tocá "needs authentication" en Mercado Pago y autorizá con tu cuenta (OAuth, sin pegar tokens). GitHub y Supabase ya los tenés.

## Para qué sirve cada uno en este proyecto
| Herramienta | Uso concreto acá |
|---|---|
| **Superpowers** | Flujo de cada fase: brainstorm → plan → ejecutar. TDD para `pricing.ts` y validaciones; debugging sistemático para webhooks |
| **frontend-design** | Que la tienda no quede con cara de plantilla shadcn; complementa la skill `estilo-3d` |
| **security-guidance** | Revisa endpoints de pedidos, webhooks, RLS, secretos expuestos |
| **code-review** | Revisión con varios agentes antes de cerrar cada fase |
| **commit-commands** | Commits convencionales en español |
| **typescript-lsp** | Errores de tipos en vivo en el monorepo |
| **playwright** | Probar el flujo completo en viewport 375px, sacar capturas del armador |
| **vercel** | Deploys, previews, logs de los webhooks |
| **skill-creator** | Mejorar nuestras 7 skills de `.claude/skills/` con lo que vayamos aprendiendo |
| **claude-code-setup** | Cuando el repo ya tenga código: escanea y sugiere hooks/skills extra |
| **supabase/agent-skills** | Buenas prácticas de RLS, migraciones y seguridad de Supabase |
| **astro-docs MCP** | Docs actuales de Astro (SSR, islas, endpoints) |
| **shadcn MCP** | Buscar e instalar componentes correctos |
| **mercadopago MCP** | Buscar en la doc oficial de MP y obtener credenciales de prueba |

## Cómo combinar Superpowers con este kit
Por cada fase del [[08 Roadmap por fases]]:
1. `/superpowers:brainstorm` → "Fase 2 del roadmap, leé docs/ y CLAUDE.md"
2. `/superpowers:write-plan` → guarda el plan; revisalo vos
3. `/superpowers:execute-plan` → ejecuta usando nuestras skills de proyecto
4. `/code-review` antes de cerrar la fase
5. Si se decidió algo nuevo → [[09 Decisiones]]

## Opcional (comunidad, revisar antes de instalar)
- Skills de React Three Fiber/Three.js de la comunidad (hay varias en marketplaces de skills). Leé el `SKILL.md` antes de instalar: son de terceros y la calidad varía. Nuestra `estilo-3d` ya cubre lo esencial.
- Stripe: no instalar nada hasta decidir si se usa (ver [[06 Pagos]]).
