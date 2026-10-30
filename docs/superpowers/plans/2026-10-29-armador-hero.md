# Armador en el hero — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** La home de la tienda es el armador de burritos (carrusel con perspectiva + burrito por capas de `.avif`), con carrito mínimo y "Mis combos" guardados en el celular.

**Architecture:** Las reglas (tortilla 1, salsas ≤2, carne exacta por tamaño con porciones repetibles, vegetales ≤ máx.) viven en `packages/shared` y leen límites del catálogo que viene de Supabase. La home SSR carga el catálogo y monta una sola isla React (`Tienda`) con stores Zustand persistidos (armado en curso, carrito) y un módulo de "Mis combos" sobre `localStorage`. Sin WebGL.

**Tech Stack:** Astro 7 SSR + React 19 + Tailwind 4 + shadcn (Base UI) · Zustand 5.0.16 · @supabase/supabase-js 2.118.0 · Zod 4 · Vitest 5.

**Spec:** `docs/superpowers/specs/2026-10-28-armador-hero-design.md` · Referencia visual: PDF de Claude Design "Armá tu burrito — Home mobile" (8 pantallas).

**Ejecución:** Max pidió avanzar sin esperar revisión del plan → modo nativo (lo implemento yo en esta sesión) y revisión al final.

## Global Constraints
- Simple: tortilla 1 · salsas ≤ 2 · carne **exactamente 2** porciones · vegetales ≤ 4 (relleno 6).
- Doble: tortilla 1 (dos tapas iguales) · salsas ≤ 2 · carne **exactamente 4** · vegetales ≤ 6 (relleno 10).
- Carne repetible (cada repetición = 1 porción). Tortilla, salsa y vegetal sin repetidos.
- Papas fritas incluidas siempre, no se eligen; el precio base las incluye.
- Precio = `precio_base` + Σ `precio_extra` por porción/ingrediente. Extras en 0 `[A CONFIRMAR]`.
- Límites desde la base (`tamanos`, `categorias_ingrediente`), nunca hardcodeados en la UI.
- Botones ≥ 48px, texto ≥ 16px, AA, español rioplatense, `prefers-reduced-motion` sin caídas ni inclinación.
- Imágenes en `apps/web/public/armador/<slug>.avif`; si falta, se usa `<slug>.svg` provisorio (fallback automático en `<img onError>`).
- Persistencia en `localStorage` siempre con try/catch.

## Review Focus
1. Cambiar Doble → Simple con 4 carnes y 6 vegetales: diálogo, nunca recorte silencioso; "Mejor lo dejo en Doble tapa" no cambia nada.
2. Combo guardado con un ingrediente que después se desactiva: al pedirlo/editarlo se avisa y se quita, y el carrito no queda con un armado inválido.
3. `localStorage` bloqueado o con JSON corrupto: la página carga igual, sin combos ni carrito.
4. Supabase caído al cargar la home: mensaje "No pudimos cargar el menú, probá de nuevo", sin pantalla en blanco.
5. Precio de vista previa con armado incompleto: muestra base + extras elegidos, sin tirar error.

---

### Task 1: Catálogo nuevo en la base

**Files:**
- Create: `supabase/migrations/20261029120000_armador_tortilla_carne_vegetal.sql`
- Modify: `supabase/seed.sql` (reescribir)
- Move: `public/*.avif` → `apps/web/public/armador/<slug>.avif`
- Create: `apps/web/public/armador/{cerdo,guacamole,pico-de-gallo,crema-acida,picante-suave,picante-fuerte}.svg`

**Interfaces — Produces:** tablas con
- `categorias_ingrediente.slug ∈ ('tortilla','salsa','carne','vegetal')`, `permite_repetir boolean not null default false`.
- `tamanos`: `min_carnes`, `max_carnes`, `max_salsas`, `max_vegetales` (se eliminan `max_proteinas`, `max_rellenos`, `max_agregados`), `check (min_carnes <= max_carnes)`.
- `ingredientes.slug text unique` (para la imagen y para tests), `imagen_url = '/armador/<slug>.avif'`.

Slugs: tortillas `tortilla-maiz` (sin TACC), `tortilla-trigo` · carnes `pollo`, `vaca`, `cerdo`, `pescado` · salsas `guacamole`, `pico-de-gallo`, `crema-acida`, `picante-suave`, `picante-fuerte` · vegetales `lechuga`, `tomate`, `cebolla`, `cebolla-morada`, `cebolla-verdeo`, `choclo`, `morron`, `repollo`, `zanahoria`, `huevo`.
Archivos: `TortilladeMaizSINTACC→tortilla-maiz`, `TortilladeTrigo→tortilla-trigo`, `salmon→pescado`, `morrones→morron`, `cebollamorada→cebolla-morada`, `cebolladeverdeo→cebolla-verdeo`, el resto igual.

- [ ] Vaciar el catálogo de ejemplo en `burritos-dev` (`truncate ... cascade` de catálogo, zonas y config; no hay pedidos).
- [ ] Escribir y aplicar la migración con `apply_migration` (mismo nombre).
- [ ] Reescribir y ejecutar `seed.sql`: tamaños simple (2/2/2/4, $9.000) y doble (4/4/2/6, $13.500) `[A CONFIRMAR]`; categorías con paso 1–4 y `permite_repetir` solo en carne; 20 ingredientes; menús; 3 prehechos (Clásico simple: trigo, vaca×2, pico, lechuga, tomate, cebolla · Pollo y choclo simple: maíz, pollo×2, guacamole, choclo, lechuga, morrón · El Doble: trigo, vaca×2, pollo×2, picante fuerte, 6 vegetales) + gaseosa/agua + 1 combo; zonas y config.
- [ ] Verificar con SQL como `anon`: 20 ingredientes, 4 categorías, 2 tamaños. `get_advisors security` sin errores nuevos.
- [ ] Mover imágenes y crear SVG provisorios.
- [ ] Commit `feat: catálogo de tortilla, carne y vegetales con imágenes`.

### Task 2: Reglas y precios en `shared`

**Files:** Modify `packages/shared/src/{constantes,catalogo,armador/schema,pricing}.ts`, `src/test/catalogoEjemplo.ts`, `src/pricing.test.ts`; regenerate `src/db.types.ts`.

**Interfaces — Produces:**
- `CATEGORIAS = ['tortilla','salsa','carne','vegetal'] as const`.
- `TamanoCatalogo { id, slug, nombre, cantTapas, precioBase, minimos: Record<CategoriaSlug,number>, maximos: Record<CategoriaSlug,number>, activo, orden }` (tortilla min=max=1; salsa/vegetal min 0).
- `IngredienteCatalogo { id, slug, categoria, nombre, precioExtra, activo, sinTacc, imagenUrl: string|null, colorHex: string|null, orden }`.
- `Catalogo { tamanos, categorias: Record<CategoriaSlug,{ nombre: string; paso: number; permiteRepetir: boolean }>, ingredientes, productos, zonasEnvio }` (se va `minimos` global).
- `armadoSchema.seleccion = { tortilla, salsa, carne, vegetal }`.
- `validarArmado` (mismos tipos de error) — repetido solo es error si `!permiteRepetir`; mínimos y máximos por tamaño.
- Nuevo `precioVistaPrevia(armado, catalogo): number` — base del tamaño (0 si no hay) + extras conocidos, sin validar.
- `contarRelleno(armado): number` = carne + vegetal; `maximoRelleno(tamano): number` = maximos.carne + maximos.vegetal.

- [ ] Tests (fallan primero): simple con pollo×2 = precio base · simple con 1 carne → `faltan carne 2/1` · doble con 3 → `faltan` · doble con 5 → `excede` · 5 vegetales en simple → `excede vegetal 4` · salsa repetida → `ingrediente_repetido` · carne repetida NO da error · 2 tortillas → `excede tortilla 1` · pescado con extra 500 ×2 suma 1000 · `precioVistaPrevia` con armado vacío y tamaño simple = base · `contarRelleno` y `maximoRelleno` 6/10. Ajustar tests de pedido al nuevo shape.
- [ ] Implementar, regenerar tipos con `generate_typescript_types`, `pnpm --filter @burritos/shared test` y `typecheck` en verde.
- [ ] Commit `feat(shared): reglas de tortilla, carne por porciones y vegetales`.

### Task 3: Reglas de la UI y almacenamiento local (`apps/web`)

**Files:** Create `apps/web/src/lib/armador/reglas.ts`, `reglas.test.ts`, `apps/web/src/lib/almacenLocal.ts`, `apps/web/src/lib/misCombos.ts`, `misCombos.test.ts`, `apps/web/src/lib/formato.ts`; add `vitest` + script `test` en `apps/web`.

**Interfaces — Produces:**
- `cuantas(armado, categoria, ingredienteId?): number`.
- `puedeAgregar(armado, categoria, catalogo): boolean`.
- `motivoBloqueo(paso: 1|2|3|4, armado, catalogo): string | null` — copy exacto: paso 1 `"Elegí una tortilla para seguir"`; paso 3 `"Te falta 1 porción de carne (1/2)"` (singular/plural, con conteo); pasos 2 y 4 nunca bloquean.
- `excesoAlCambiar(armado, tamanoDestino): { categoria, sobran: number }[]`.
- `limpiarContraCatalogo(armado, catalogo): { armado, quitados: string[] }` (nombres de lo quitado; si la tortilla o el tamaño ya no existen, se vacían).
- `almacenLocal = { leer<T>(clave, valida: (x: unknown) => T | null): T | null, escribir(clave, valor): boolean, borrar(clave) }` — try/catch, JSON corrupto → `null`.
- `misCombos`: `listar(): ComboGuardado[]`, `guardar(armado, nombre): ComboGuardado | null` (máx. 10, el más viejo sale), `borrar(id)`. `ComboGuardado { id, nombre, armado, guardadoEn }`, clave `burritos:mis-combos:v1`.
- `formatoPesos(n): string` → `"$9.000"` (es-AR, sin decimales).

- [ ] Tests (fallan primero) para cada función, incluidos: localStorage que tira en `getItem` → `listar()` = `[]`; JSON inválido → `[]`; 11º combo saca al más viejo; doble→simple con 4 carnes y 6 vegetales → `[{carne,2},{vegetal,2}]`; ingrediente inactivo quitado con su nombre.
- [ ] Implementar y correr `pnpm --filter @burritos/web test`.
- [ ] Commit `feat(web): reglas del armador y mis combos en el celular`.

### Task 4: Stores y carga del catálogo

**Files:** Create `apps/web/src/stores/armador.ts`, `apps/web/src/stores/carrito.ts`, `apps/web/src/lib/catalogo.server.ts`, `apps/web/src/env.d.ts` (tipos de `PUBLIC_SUPABASE_*`).

**Interfaces — Produces:**
- `cargarCatalogo(): Promise<Catalogo>` (server, clave publicable, mapea filas → `Catalogo`, solo activos, ordenado por `orden`). Tira si falla.
- `useArmador` (persist `burritos:armador:v1`): estado `{ paso: 1..5, tamanoId, seleccion, cantidad, nombre, editandoItemId: string|null }`; acciones `elegirTamano(id)`, `alternar(categoria, id)`, `sumarPorcion(id)`, `restarPorcion(id)`, `irAPaso(n)`, `siguiente()`, `anterior()`, `cargar(armado, editandoItemId?)`, `reset(tamanoId)`, `setCantidad(n)`, `setNombre(s)`, `armado(): Armado`.
- `useCarrito` (persist `burritos:carrito:v1`): `items: { id, armado, nombre }[]`; `agregar(armado, nombre)`, `reemplazar(id, armado, nombre)`, `cambiarCantidad(id, n)`, `quitar(id)`, `total(catalogo)`, `cantidadBurritos()`.
- Persistencia de Zustand con `createJSONStorage` sobre `almacenLocal` (no rompe si localStorage tira).

- [ ] Test de store: `alternar` respeta máximo y `sumarPorcion` no pasa `maximos.carne`; `cambiarCantidad(id, 0)` quita.
- [ ] Implementar, tests y typecheck en verde.
- [ ] Commit `feat(web): stores del armador y del carrito`.

### Task 5: UI del armador (hero)

**Files:** Create en `apps/web/src/components/`: `Tienda.tsx` (isla raíz), `tienda/Encabezado.tsx`, `armador/{SelectorTamano,Escenario,BarraPasos,Carrusel,TarjetaIngrediente,BarraSiguiente,PasoListo,DialogoCambioTamano,ImagenIngrediente,BurritoEnrollado}.tsx`; Modify `apps/web/src/pages/index.astro`, `layouts/Base.astro`, `styles/global.css`; shadcn `dialog` y `sheet`.

Visual según el PDF: fondo crema, tarjetas blancas con borde marrón y sombra "de juguete", botón principal rojo `#C8441E`-ish, amarillo `#FFB703` para seleccionado, verde para "listo". Tipos: Baloo 2 (títulos) + Nunito (texto), Google Fonts.

- [ ] Tokens de color y fuentes en `global.css`; `Base.astro` con fuentes y `lang="es-AR"`.
- [ ] `index.astro`: `cargarCatalogo()` en try/catch → `<Tienda client:load catalogo={...} abierto={...} />` o mensaje de error amable.
- [ ] Encabezado (logo, "[NOMBRE]", "Abierto ahora", botón carrito con contador) + `SelectorTamano` ("2 carnes · 4 verd." desde el catálogo).
- [ ] `Escenario`: tortilla (doble = dos discos corridos), salsas como ondas SVG de color, carnes al centro, vegetales alrededor (posiciones determinísticas por índice), animación `caer` (desactivada con reduced-motion), contador "Relleno X/N" con barritas, sello "Papas fritas incluidas"; vacío = "Acá se arma tu burrito".
- [ ] `BarraPasos` (check en pasos completos) + título y subtítulo por paso.
- [ ] `Carrusel` con scroll-snap y transform según distancia al centro (rotateY/scale); puntos + "Deslizá para ver más →" / "Podés repetir la misma" / "Sacá uno para cambiarlo"; `TarjetaIngrediente` con tilde, badge Sin TACC, "Tocá para sacar", `− n +` en carne, apagada al máximo.
- [ ] `BarraSiguiente`: motivo en rojo o mensaje verde ("¡Carne lista! Ahora, los vegetales", "¡Todo listo! Mirá cómo quedó"), botón "Siguiente · $X".
- [ ] `PasoListo`: `BurritoEnrollado` + papas, "Lo que lleva" con "Cambiar" por categoría, cantidad, nombre opcional, total, "Agregar al pedido" y "Guardar en mi celular".
- [ ] `DialogoCambioTamano` como en el PDF (carne −/+, chips de vegetales con ✕ y deshacer, "Pasar a Simple · $X" deshabilitado hasta que entre, "Mejor lo dejo en Doble tapa").
- [ ] Commit `feat(web): armador en el hero`.

### Task 6: Mis combos y carrito

**Files:** Create `apps/web/src/components/tienda/{MisCombos,PanelCarrito}.tsx`.

- [ ] `MisCombos`: debajo del hero si hay combos; tarjeta con imagen de la carne/tortilla, nombre, badge tamaño, precio actual, resumen; "Pedir de nuevo" (limpia contra catálogo, avisa lo quitado, agrega al carrito), "Editar" (carga en el armador y sube), borrar.
- [ ] `PanelCarrito` (sheet): ítems con "Ver qué lleva" plegable, cantidad −/+, Editar, borrar, subtotal, "Cada burrito viene con papas fritas", "Armar otro burrito".
- [ ] Commit `feat(web): mis combos y carrito`.

### Task 7: Verificación y documentación

- [ ] `pnpm typecheck && pnpm test && pnpm build` en verde.
- [ ] Navegador a 375px: recorrer simple completo, doble completo, doble→simple, guardar, pedir de nuevo, carrito; consola sin errores; reduced-motion.
- [ ] Actualizar `docs/02`, `04`, `05`, `08`, `09`, `10`, bitácora, CLAUDE.md (sin R3F) y skills `armador-burrito`/`estilo-3d`; spec `estado: aprobado`.
- [ ] Commit `docs: armador en el hero` .
