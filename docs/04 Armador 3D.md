---
tags: [burritos, 3d, diseño]
actualizado: 2026-10-29
---
# Armador (hero de la home)

> Diseño completo: [[superpowers/specs/2026-10-28-armador-hero-design|Diseño del armador en el hero]] · Decisiones: [[09 Decisiones]]

## Idea
La home **es** el armador. El burrito se arma frente al cliente: la tortilla en un plato y cada ingrediente **cae con un rebote** en su lugar (salsas en chorrito, carnes al centro, vegetales alrededor). Estilo caricatura cálido. El "3D" lo dan los **renders `.avif` de Max**, no un motor 3D.

## Pantalla (mobile, todo en 100dvh)
1. Encabezado = el pedido en curso: plato en miniatura, "Relleno X/N", salsas, tamaño y precio. La flecha vuelve a los combos.
2. "Armá tu burrito" + **Simple** | **Doble tapa** — solo hasta que elegís (o tocás Siguiente). Vuelve con "Atrás" desde el paso 1.
3. Plato **sin tarjeta** sobre el fondo con los carteles "Relleno X/N" y "Papas fritas incluidas". Se agranda cuando ya no están los botones de tamaño.
4. Línea de pasos (1 Tortilla · 2 Salsas · 3 Carne · 4 Vegetales · 5 ¡Listo!).
5. Título del paso y **carrusel** con perspectiva (como en los bocetos). Carne con `− n +` por porciones.
6. Barra fija abajo: motivo o mensaje, "Siguiente · $X" y "Borrar y empezar de nuevo" (alto fijo).

## Imágenes
- `apps/web/public/armador/<slug>.avif` (slug = `ingredientes.slug`). Fondo transparente.
- Si falta el `.avif`, se usa `<slug>.svg` provisorio; si tampoco, un círculo de color.
- Faltan: `cerdo`; fotos del burrito cerrado doble y de maíz. Salsas: las 14 en `.avif` (en baja resolución, ~146 px).
- Final: `burrito-cerrado.avif` + `papas.avif` (`BurritoConPapas.tsx`). Prueba en orden `burrito-cerrado-doble-maiz`, `-doble`, `-maiz` y la base.
- Salsas en el escenario: manchas de color untadas, debajo de los ingredientes.
- **Verlo en mi mesa** (`VerEnMiMesa.tsx`): cámara trasera + la foto del burrito encima; un dedo mueve, dos agrandan, "Sacar foto" comparte o descarga. Necesita https (Vercel) o localhost.

## Accesibilidad
- `prefers-reduced-motion`: nada cae ni rebota.
- Botones ≥ 48px, textos ≥ 16px, todo con nombre accesible.
- Nada se pierde: el armado en curso, el carrito y Mis combos quedan en el celular.

## Código
`apps/web/src/components/Tienda.tsx` (isla raíz) · `components/armador/*` · `lib/armador/reglas.ts` · `stores/{armador,carrito}.ts` · `lib/misCombos.ts`
