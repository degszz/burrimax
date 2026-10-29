---
tags: [burritos, 3d, diseño]
actualizado: 2026-10-29
---
# Armador (hero de la home)

> Diseño completo: [[superpowers/specs/2026-10-28-armador-hero-design|Diseño del armador en el hero]] · Decisiones: [[09 Decisiones]]

## Idea
La home **es** el armador. El burrito se arma frente al cliente: la tortilla en un plato y cada ingrediente **cae con un rebote** en su lugar (salsas en chorrito, carnes al centro, vegetales alrededor). Estilo caricatura cálido. El "3D" lo dan los **renders `.avif` de Max**, no un motor 3D.

## Pantalla (mobile, una columna)
1. Encabezado: logo, "Abierto ahora", carrito con contador.
2. Selector de tamaño: **Simple** (2 carnes · 4 verd.) | **Doble tapa** (4 carnes · 6 verd.).
3. Escenario: plato con la tortilla, contador "Relleno X/N", sello "Papas fritas incluidas".
4. Barra de pasos (1 Tortilla · 2 Salsas · 3 Carne · 4 Vegetales · 5 ¡Listo!).
5. Título del paso + "Elegiste X de N" y **grilla de 2 columnas** con tarjetas grandes. Carne con `− n +` por porciones.
6. Botón fijo abajo "Siguiente · $X" con el motivo si falta algo ("Te falta 1 porción de carne (1/2)").
7. Al bajar, **resumen flotante** arriba: plato en miniatura, relleno, salsas y precio.

## Imágenes
- `apps/web/public/armador/<slug>.avif` (slug = `ingredientes.slug`). Fondo transparente.
- Si falta el `.avif`, se usa `<slug>.svg` provisorio; si tampoco, un círculo de color.
- Faltan: `cerdo` y el burrito enrollado. Salsas: las 14 en `.avif` (en baja resolución, ~146 px).

## Accesibilidad
- `prefers-reduced-motion`: nada cae ni rebota.
- Botones ≥ 48px, textos ≥ 16px, todo con nombre accesible.
- Nada se pierde: el armado en curso, el carrito y Mis combos quedan en el celular.

## Código
`apps/web/src/components/Tienda.tsx` (isla raíz) · `components/armador/*` · `lib/armador/reglas.ts` · `stores/{armador,carrito}.ts` · `lib/misCombos.ts`
