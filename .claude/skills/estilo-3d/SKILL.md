---
name: estilo-3d
description: Usar para todo lo visual — estilo caricatura con renders 3D en .avif, escenario del armador, animaciones de ingredientes, paleta, tipografía y componentes de UI de la tienda.
---
# Estilo visual y 3D

## Dirección de arte
- **Caricatura cálida y comestible**: formas redondeadas, colores saturados, contornos oscuros suaves, sombras planas.
- Paleta base `[A CONFIRMAR con la marca]`: tortilla `#F4D9A6`, salsa `#E4572E`, palta `#7BB661`, fondo crema `#FFF8EC`, texto `#2B1B12`, acento `#FFB703`.
- Tipografía: display redondeada y gordita para títulos (ej. "Baloo 2" o "Fredoka"), sans legible para el resto (16px mínimo en mobile).
- Definir colores como tokens CSS en `:root` y en el tema de Tailwind; modo oscuro opcional, no prioritario.
- Botones: alto ≥ 48px, radio grande, sombra "de juguete" (borde inferior más oscuro), estado presionado que se hunde.
- shadcn/ui como base, retocado para que NO se vea genérico.

## Escenario del armador (sin WebGL, ver docs/09 Decisiones)
- Plato blanco con la tortilla (.avif). Doble tapa: dos tortillas corridas.
- Salsas como ondas SVG del color del ingrediente; carnes al centro; vegetales en ronda (posiciones fijas por índice para que no se tapen).
- Animación `.animate-caer` (caída con rebote, squash & stretch) definida en `global.css`; con reduced-motion no se mueve nada.
- Imágenes: `apps/web/public/armador/<slug>.avif`, fondo transparente; `ImagenIngrediente` cae a `.svg` y luego a un círculo de color.
- Opciones en **grilla de 2 columnas** (no carrusel) + `ResumenFlotante` arriba cuando el escenario sale de pantalla.
- Utilidades CSS: `juguete` (borde tinta + sombra dura que se hunde), `fondo-puntos`.

## Checklist antes de terminar una tarea visual
- [ ] Probado a 375px y 768px
- [ ] Contraste AA en textos
- [ ] Nada se mueve si reduced-motion está activo
- [ ] Las imágenes nuevas pesan < 40 KB (.avif)
