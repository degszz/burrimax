---
name: estilo-3d
description: Usar para todo lo visual — estilo caricatura 3D, escena React Three Fiber del armador, animaciones de ingredientes, fallback 2D, paleta, tipografía y componentes de UI de la tienda.
---
# Estilo visual y 3D

## Dirección de arte
- **Caricatura cálida y comestible**: formas redondeadas, colores saturados, contornos oscuros suaves, sombras planas.
- Paleta base `[A CONFIRMAR con la marca]`: tortilla `#F4D9A6`, salsa `#E4572E`, palta `#7BB661`, fondo crema `#FFF8EC`, texto `#2B1B12`, acento `#FFB703`.
- Tipografía: display redondeada y gordita para títulos (ej. "Baloo 2" o "Fredoka"), sans legible para el resto (16px mínimo en mobile).
- Definir colores como tokens CSS en `:root` y en el tema de Tailwind; modo oscuro opcional, no prioritario.
- Botones: alto ≥ 48px, radio grande, sombra "de juguete" (borde inferior más oscuro), estado presionado que se hunde.
- shadcn/ui como base, retocado para que NO se vea genérico.

## Escena 3D (React Three Fiber + drei)
- `Canvas` con `dpr={[1, 1.5]}`, `frameloop="demand"` salvo durante animaciones.
- Cámara 3/4 fija; `OrbitControls` limitado (sin pan, zoom acotado, ángulo polar limitado).
- Luz: 1 direccional + ambiente; sombras de contacto (`ContactShadows`) en vez de sombras reales.
- Materiales: `MeshToonMaterial` con gradientMap de 3 tonos + `<Outlines>` de drei.
- Modelos `.glb` con `useGLTF` + `useGLTF.preload` del siguiente paso; comprimidos (Draco/Meshopt).
- Cada categoría tiene una "zona" sobre la tapa para que no se tapen entre sí; posiciones con leve aleatoriedad determinística (seed = id del ingrediente).
- Animación de entrada: cae desde arriba con resorte (`@react-spring/three`), squash & stretch al tocar la tapa.
- Doble tapa: dos discos corridos 10–15%; el enrollado final es más largo y grueso.
- Final: enrollado + confeti suave. Respetar `prefers-reduced-motion` (sin caídas, aparece directo).

## Detección de rendimiento
- Sin WebGL → 2D. `prefers-reduced-motion` → 2D. `PerformanceMonitor` de drei: si cae bajo 30 FPS → 2D automáticamente con aviso discreto. Botón manual "Modo simple".

## Fallback 2D
- Mismo store, solo cambia el render. Capas WebP con transparencia, `position: absolute`, transición `translateY` + `scale`.

## Checklist antes de terminar una tarea visual
- [ ] Probado a 375px y 768px
- [ ] Contraste AA en textos
- [ ] Nada se mueve si reduced-motion está activo
- [ ] El canvas no se descarga en la home si no se usa (import dinámico)
