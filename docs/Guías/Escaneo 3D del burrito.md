---
tags: [burritos, guia, 3d, realidad-aumentada]
actualizado: 2026-11-25
---
# Escaneo 3D del burrito (para "Verlo en mi mesa")

> [!info] Qué es
> Se llama **escaneo 3D** o **fotogrametría**: sacás muchas fotos alrededor del plato y una app arma el modelo 3D. Después, en la web, "Verlo en mi mesa" pone ese burrito sobre la mesa del cliente, a tamaño real.
> Hace falta **uno solo** (pedido de Max, 2026-11-25): la misma porción sirve para todos los combos. Se sube desde el admin.

## La app: KIRI Engine (gratis)
Verificado el 2026-11-02 en https://www.kiriengine.app/pricing: el plan gratis tiene "Photo Scan" con exportaciones ilimitadas, hasta **150 fotos** por escaneo, y exporta **GLB**.
- **Solo hace falta el GLB.** El archivo para iPhone (USDZ) lo arma solo la web.
- Polycam también sirve, pero en el plan gratis exporta solo glTF y 10 escaneos.

## Preparar
1. Burrito **cerrado, en el plato con las papas**, igual que como sale.
2. Mesa con un **mantel liso que no brille**, de un color distinto al plato (nada de blanco sobre blanco).
3. **Luz pareja**: de día cerca de una ventana **sin sol directo**, o la luz del techo más una lámpara de cada lado. Sin flash y sin sombras duras.
4. Medí con una regla **lo más largo de lo que vas a escanear** (el burrito, o el plato si lo escaneás con plato). Ese número va en el admin.

## Sacar las fotos
1. Abrí KIRI Engine → **Photo Scan**.
2. **No muevas el plato**: el que da vueltas sos vos, a unos 40–50 cm.
3. Tres vueltas completas:
   - **Baja**: el celular casi a la altura de la mesa.
   - **Media**: mirando el plato en diagonal.
   - **Alta**: casi desde arriba.
4. Una foto cada uno o dos pasos: **entre 70 y 120 fotos** en total (el plan gratis acepta hasta 150). Cada foto con el plato entero, quieta y enfocada.
5. Subila y esperá que la procese (unos minutos).

## Revisar y exportar
1. Giralo en la app. Si tiene agujeros o partes derretidas, repetí con más fotos desde abajo.
2. Recortá la mesa con la herramienta de recorte: que quede **solo el plato** con el burrito y las papas.
3. Exportá en **GLB**.

## Subirlo desde el admin
1. Entrá al admin → **Catálogo** → **Combos** → **Burrito en 3D**.
2. Escribí el **largo real en cm** (lo que mediste con la regla).
3. Tocá **Subir modelo (.glb)** y elegí el archivo.

El admin solo:
- Lo deja en **tamaño real** con tu medida (las apps de escaneo no siempre lo guardan bien) y te avisa si el escaneo medía muy distinto.
- Lo **apoya en la mesa** y lo centra.
- Lo publica: aparece **"Verlo en 3D"** en Combos de la casa y en el último paso del armador ("Verlo en mi mesa").

No hace falta el archivo de iPhone (.usdz): la web lo arma sola desde el .glb. Si pesa más de 50 MB, exportalo en calidad media (lo ideal es menos de 10 MB para que cargue rápido en el celular).

## Probarlo (lo hacés vos, con la web publicada)
- **Android**: "Verlo en mi mesa" → "Ponerlo en mi mesa". Mirá que quede apoyado, del tamaño de un burrito de verdad, y que puedas acercarte.
- **iPhone (Safari)**: lo mismo. La primera vez tarda unos segundos más (arma el archivo de iPhone).
- Contame si se ve flotando, muy chico o muy grande, o si tarda mucho en cargar.

## Si el escaneo no sale bien
IA de imagen a 3D (Meshy, Tripo o Rodin) a partir de 2 o 3 fotos. Es menos fiel que el escaneo.

Relacionado: [[Planes/Fase 8 - Contenido visual con IA]]
