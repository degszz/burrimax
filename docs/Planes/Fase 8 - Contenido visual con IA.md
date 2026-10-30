---
tags: [burritos, plan, ia, higgsfield]
estado: propuesta
prioridad: secundaria
actualizado: 2026-10-29
---
# Fase 8 — Contenido visual con IA (secundaria)

> [!info] Prioridad
> Va **después** de lo que vende (checkout, admin, Mercado Pago). Ninguna de estas piezas va en el hero: la home sigue siendo el [[04 Armador 3D|armador]] y tiene que cargar en 1–2 s.

Referencia: video de midudev [Crea una Landing ESPECTACULAR con Claude Code](https://www.youtube.com/watch?v=A4QYEDQCnaQ&t=1395s) y su repo [midudev/mcp-higgsfield-landing](https://github.com/midudev/mcp-higgsfield-landing) (mismo stack: Astro 7 + Tailwind 4).

## Las tres piezas

| # | Pieza | Dónde va | Para qué | Costo aprox. |
|---|---|---|---|---|
| 1 | **Paseo con scroll** "Así hacemos tu burrito" | Página propia `/como-lo-hacemos` + link desde la home | Mostrar el proceso real y dar confianza; termina en "Armá el tuyo" | US$10–15 (clips + pruebas) |
| 2 | **"Ver en mi mesa" (AR)** | Botón en el paso "¡Listo!" | Burrito cerrado en plato, sobre la mesa real, con la cámara | Gratis/bajo (modelo con IA de imagen a 3D) |
| 3 | **Renders faltantes** | `apps/web/public/armador/` | Cerdo y burrito enrollado simple y doble, con el mismo estilo | Créditos de Higgsfield |

## 1 · Paseo con scroll (método midudev)
Cómo funciona: **7 fotos reales en orden → 6 clips** (la foto N es el primer cuadro y la N+1 el último) → el scroll adelanta o atrasa el video (no se reproduce solo).

Fotos a sacar (mismo ángulo y luz parecida):
1. Plancha caliente
2. Tortilla calentándose
3. Carne dorándose
4. Vegetales frescos cortados
5. Armado sobre la tortilla
6. Enrollado
7. Plato con papas fritas

Pasos:
- [ ] Max saca las 7 fotos y las deja en `apps/web/src/assets/paseo/` (o `public/photos/`)
- [ ] Configurar Higgsfield (ver "Herramientas" abajo)
- [ ] Comparar modelos con **una** transición (Kling 3.0 · MiniMax H3 · Seedance 2.0) y elegir. midudev eligió **MiniMax H3**: 6 clips ≈ US$5
- [ ] Generar los 6 clips (8 s, 2K → bajados a 1080p). Fotos verticales → ampliar a 16:9 con outpaint si hace falta
- [ ] Codificar para scrub con ffmpeg (`-g 6`, color BT.709/sRGB, `+faststart`) y sacar el póster de cada clip
- [ ] Página `/como-lo-hacemos`: GSAP ScrollTrigger + Lenis, carga de clips por cercanía, póster mientras carga, recorte vertical en celular, truco `play()/pause()` para iPhone
- [ ] Con `prefers-reduced-motion` o ahorro de datos: solo pósters, sin video
- [ ] Texto de cada parada en español rioplatense, sin inventar nada (lo no confirmado va como `[A CONFIRMAR]`)

## 2 · "Ver en mi mesa" (realidad aumentada)
- [x] Paso intermedio hecho (2026-10-29): "Verlo en mi mesa" con la cámara y la foto del burrito + papas encima (`VerEnMiMesa.tsx`). Al tener el `.glb`, el mismo botón pasa a AR real
- [x] (2026-10-30) Código listo: `<model-viewer>` 4.4.0 + `three` 0.183.2, `VerEnMiMesa3D.tsx`. Se carga **solo al tocar** (archivo aparte de ~1 MB). El botón "Verlo en mi mesa" detecta solo si existe `public/modelos/burrito.glb`: si está, abre el 3D con "Ponerlo en mi mesa" (AR nativo: Scene Viewer en Android, Quick Look en iPhone, anclado a la mesa y a tamaño real); si no, sigue la versión con la foto.
- [ ] **Max consigue el modelo** (la opción más real es escanear un burrito de verdad):
  1. **Escaneo con el celular (recomendado, gratis):** app **Polycam**, **KIRI Engine** o **Luma AI**, modo "Photo/Object capture". Burrito cerrado en el plato con papas, sobre una mesa con buena luz pareja (sin sol directo), girando alrededor despacio en 2–3 alturas (50–100 fotos). Exportar **GLB** y **USDZ**.
  2. **Con IA de imagen a 3D** (si el escaneo no sale): Meshy, Tripo o Rodin a partir de 2–3 fotos. Menos fiel que el escaneo.
- [ ] Dejar `burrito.glb` y `burrito.usdz` en `apps/web/public/modelos/` (escala real: ~0,22 m de largo; menos de 5 MB cada uno). Si pesa más, se comprime con `gltf-transform` (Draco/Meshopt + texturas WebP).
- [ ] Probar en un Android y en un iPhone con la web publicada
- Un modelo por tamaño, **genérico** (cerrado no se ve el relleno). Descartado: generar el burrito exacto de cada cliente con IA (lento, caro, puede no coincidir con lo que llega)

## 3 · Renders faltantes con Higgsfield
- [ ] Cerdo (`cerdo.avif`)
- [x] Salsas: las 14 ya las puso Max (2026-10-29). Opcional: versión 512×512
- [ ] Burrito enrollado simple y doble + papas (reemplaza la ilustración de `BurritoEnrollado.tsx`)
- Formato: `.avif`, fondo transparente, cuadrado (íconos 512×512), < 40 KB, estilo igual a los que ya hizo Max. Se copian con el nombre del `slug` y listo, sin tocar código.

## Herramientas
| Herramienta | Uso | Cuidado |
|---|---|---|
| **Higgsfield CLI** — `npm i -g @higgsfield/cli` → `higgsfield auth login` → `npx skills add higgsfield-ai/skills` | Imágenes y video desde Claude Code | **El login y los créditos los hace Max** en el navegador |
| [`elayadesign/ai-design-skills`](https://github.com/elayadesign/ai-design-skills) → `landing-page-design` | Estructura y copy de `/como-lo-hacemos` | Se basa en `taste-skill`, que se pelea con `frontend-design` y `estilo-3d` (ver [[11 Plugins y herramientas]]). Usarla **solo** para esa página y reemplazar su sección de diseño por nuestra paleta y fuentes |
| [`oso95/scroll-world`](https://github.com/oso95/scroll-world) | Referencia del motor de scrub | Su pipeline por defecto (Monid) es más caro (~US$27 por 6 escenas, el doble con versión vertical). Nos alcanza con la técnica |

Antes de instalar cualquiera: leer su `SKILL.md` (son de terceros).

## Lo que necesita Max
- [ ] Cuenta de Higgsfield con créditos (~US$10–15 para todo, con margen)
- [ ] Las 7 fotos del proceso
- [ ] Las fotos del burrito cerrado en plato (simple y doble)
- [ ] OK para instalar las herramientas
