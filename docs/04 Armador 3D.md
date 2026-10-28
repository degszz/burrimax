---
tags: [burritos, 3d, diseño]
---
# Armador 3D

## Idea
El burrito se arma frente al cliente: la tapa abierta en la mesa, y cada ingrediente **cae con un rebote** y se acomoda arriba. Al final, la tapa se enrolla. Estilo **caricatura**: colores saturados, bordes suaves, contornos, sombras simples.

## Tecnología
- **React Three Fiber + drei** dentro de una isla React de Astro (`client:visible`).
- Modelos **.glb low-poly** (uno por ingrediente), comprimidos con Draco/Meshopt, < 150 KB cada uno, en Supabase Storage.
- Material **toon** (`MeshToonMaterial`) + contorno (`Outlines` de drei) para el look caricatura.
- Animaciones con `@react-spring/three` (caída + rebote) o `framer-motion-3d`.
- Precarga de modelos del paso siguiente mientras el cliente decide.

## Cómo se representa cada cosa
| Elemento | Representación |
|---|---|
| Tapa simple | Un disco de masa, color según tipo (beige, marrón integral, verde espinaca, amarillo sin TACC) |
| Doble tapa | Dos discos superpuestos levemente corridos + burrito final más gordo y largo |
| Proteína / rellenos | "Montoncitos" sobre la tapa, cada uno en su zona para que no se tapen |
| Salsas | Chorrito animado encima |
| Agregados | Ícono brillante ✨ + caída especial |
| Final | Animación de enrollado + "¡Listo!" con confeti suave |

## Cámara e interacción
- Cámara fija en ángulo 3/4, el usuario puede girar con el dedo (limitado, sin zoom loco).
- Tocar un ingrediente en el 3D lo resalta y muestra "Quitar".

## Fallback 2D (obligatorio)
Se usa si: no hay WebGL, `prefers-reduced-motion`, equipo lento (FPS < 30 en los primeros 2 s) o el cliente toca "Modo simple".
- Ilustraciones PNG/WebP por capas, apiladas con CSS y animación de caída suave.
- Mismos datos y mismo store: solo cambia el componente que dibuja.

## Rendimiento
- El canvas no carga hasta que el usuario entra al armador.
- `dpr` limitado a [1, 1.5] en mobile.
- Objetivo: armador interactivo en < 3 s con 4G.

## Assets a producir
- [ ] Lista final de ingredientes (ver [[02 Reglas de negocio]])
- [ ] Un .glb por ingrediente + tapa + burrito enrollado (simple y doble)
- [ ] Un PNG por ingrediente para el fallback
- [ ] Paleta de colores y tipografía (ver skill `estilo-3d`)

Opciones para los modelos: Blender a mano, kits low-poly comprados, o generadores 3D por IA y retoque en Blender. → [[10 Preguntas abiertas]]
