---
tags: [burritos, diseño, armador]
estado: aprobado
actualizado: 2026-10-29
---
# Diseño — Armador de burritos en el hero

## Intención
La home de la tienda **es** el armador: lo primero que ve el cliente es su burrito armándose. Tiene que ser rápido y claro en cualquier celular, también para gente mayor o poco técnica ("si algo no se entiende en 3 segundos, está mal diseñado"). El "3D" lo dan los renders del dueño (íconos 3D en `.avif`), no un motor 3D. El cliente puede guardar lo que armó en su celular como "Mi combo" para volver a pedirlo con un toque.

## Lo que decidió Max
- **Tortilla:** 2 opciones, **maíz (sin TACC)** o **harina de trigo**. Se elige 1. En la doble tapa, las dos tapas son del mismo tipo.
- **Salsas:** hasta 2, a gusto.
- **Carne:** pollo, vaca, cerdo o pescado. **No hay opción sin carne.** Se cuentan **porciones** y **se puede repetir la misma carne** (ej. 2 porciones de pollo).
  - Simple: **exactamente 2** porciones (nunca 1).
  - Doble tapa: **exactamente 4** porciones.
- **Vegetales / ingredientes naturales:** el resto del relleno.
  - Simple: relleno total máximo 6 → hasta **4 vegetales**.
  - Doble: relleno total máximo 10 → hasta **6 vegetales**.
- **Papas fritas incluidas** siempre con el burrito.
- **Orden:** tortilla → salsas → relleno (carne y vegetales).
- **Interacción:** elegir deslizando de un lado al otro (carrusel).
- **Enfoque A** (elegido entre 3, ver abajo): carrusel con perspectiva + burrito armado apilando las imágenes de Max.
- **Imágenes:** Max manda las 2 tortillas y un ícono 3D por ingrediente en `.avif`.

## Objetivos
1. El hero es el armador completo, utilizable a 375px con una mano.
2. Reglas de arriba validadas igual en cliente y servidor (`packages/shared`).
3. El cliente ve el precio en vivo y el burrito armándose con cada elección.
4. "Agregar al pedido" deja el burrito en un carrito persistente (base para la Fase 2).
5. "Guardar en mi celular" lo agrega a **Mis combos**, que se ve en la home y permite volver a pedirlo.
6. Las imágenes provisorias se reemplazan por las de Max **solo copiando archivos**, sin tocar código.

## No objetivos
- Checkout, datos del cliente y pago (siguen en la Fase 2).
- Motor 3D / WebGL / modelos `.glb` (el enfoque B y C quedaron descartados por ahora).
- Agregados con costo (panceta, extra queso…): salen del armador. Si vuelven, es otra tarea.
- Cuentas de usuario o sincronizar "Mis combos" entre dispositivos.
- Bebidas dentro del combo armado.

## Anti-objetivos (sería un fracaso aunque funcione)
- Que la home tarde en mostrarse o se trabe en un celular común.
- Que haya que leer instrucciones para entender cómo elegir.
- Que se pueda pedir algo que el servidor después rechace sin explicar por qué.
- Que se pierda lo elegido al ir para atrás, cambiar de tamaño o cerrar la pestaña.

## Restricciones
- Stack existente: Astro 7 (SSR) + isla React + Tailwind 4 + shadcn (Base UI) + Zustand (persistido con try/catch).
- El precio lo calcula el servidor; el cliente solo muestra la vista previa con la misma función.
- `prefers-reduced-motion`: nada cae ni rebota, aparece directo.
- Botones ≥ 48px, textos ≥ 16px, contraste AA.
- Los límites salen de la base (`tamanos`, `categorias_ingrediente`), no del código.

## Enfoques considerados
| | Enfoque | A favor | En contra |
|---|---|---|---|
| **A ✅** | Carrusel con perspectiva (CSS 3D transforms + scroll-snap) y burrito por capas de `.avif` | Carga en 1–2 s en 4G, anda en celulares viejos, se ve igual a los renders de Max, el modo simple sale casi gratis | No se puede girar el burrito |
| B | Escena WebGL (React Three Fiber) con los íconos como tarjetas dentro | Profundidad real, se gira | 5–10× más pesado, puede ir a saltos en celulares baratos, hay que hacer el 2D aparte, los íconos se ven como cartones |
| C | Modelos `.glb` por ingrediente | Lo más vistoso | No existen; semanas de trabajo |

**Elegido: A.** Público con celulares comunes y gente mayor; Max ya pensó en velocidad al elegir `.avif`.

## Cambios en las reglas y en la base
Reemplaza lo que había en [[02 Reglas de negocio]] para el armador.

### Categorías (`categorias_ingrediente`)
| slug | nombre | paso | mín | repetible |
|---|---|---|---|---|
| `tortilla` | Tortilla | 1 | 1 | no |
| `salsa` | Salsas | 2 | 0 | no |
| `carne` | Carne | 3 | (según tamaño) | **sí** |
| `vegetal` | Vegetales | 4 | 0 | no |

- Columna nueva `permite_repetir boolean`.
- Se eliminan del armador `tapa`, `proteina`, `relleno`, `agregado` (migración nueva, sin borrar a mano).

### Tamaños (`tamanos`)
Columnas por categoría: `min_carnes`, `max_carnes`, `max_salsas`, `max_vegetales` (la tortilla siempre es 1).
| slug | min_carnes | max_carnes | max_salsas | max_vegetales |
|---|---|---|---|---|
| simple | 2 | 2 | 2 | 4 |
| doble | 4 | 4 | 2 | 6 |

### Ingredientes de ejemplo `[A CONFIRMAR nombres]`
- **Tortillas:** Maíz (sin TACC, `sin_tacc = true`), Harina de trigo.
- **Carnes:** Pollo, Vaca, Cerdo, Pescado.
- **Salsas:** Guacamole, Pico de gallo, Crema ácida, Picante suave, Picante fuerte.
- **Vegetales:** Lechuga, Tomate, Cebolla, Morrón, Choclo, Porotos negros, Arroz, Zanahoria.

### Precio
```
precio = tamaño.precio_base            (incluye papas fritas)
       + Σ precio_extra de cada porción/ingrediente elegido
```
- Cada porción de carne suma su `precio_extra` (2 porciones de algo con extra = 2 veces el extra).
- Todos los extras arrancan en 0. `[A CONFIRMAR]` si el pescado o el maíz llevan extra, y los precios base.

### Papas fritas
- No se eligen. Se muestran en el armador y en el resumen como "🍟 Papas fritas incluidas".
- En el pedido, el ítem lleva `incluye_papas: true` en `detalle` (snapshot), para que la cocina lo vea.

## Modelo de datos del armado (`packages/shared`)
- `seleccion` pasa a: `{ tortilla: id[], salsa: id[], carne: id[], vegetal: id[] }`.
  - En `carne` **se permiten ids repetidos** (cada repetición = 1 porción). En las demás, no.
- Validación (`validarArmado`):
  - tortilla: exactamente 1.
  - carne: entre `min_carnes` y `max_carnes` del tamaño (cuenta porciones).
  - salsa y vegetal: hasta el máximo del tamaño.
  - repetidos solo donde `permite_repetir`.
  - ingredientes activos y de la categoría correcta (como hoy).
- `pricing.ts` suma el extra por porción.
- Tests nuevos: simple 2 porciones del mismo pollo, simple con 1 carne = error, doble con 3 carnes = error, doble con 5 = error, 5 vegetales en simple = error, salsa repetida = error.

> [!note] 2026-10-29 · Cambio pedido por Max
> Las opciones van en **grilla de 2 columnas** en vez de carrusel, y al bajar aparece un **resumen flotante** arriba (plato en miniatura, relleno, salsas y precio). Ver [[09 Decisiones]].

## Experiencia (pantalla)
Mobile, una columna, todo en el hero:

1. **Arriba:** selector de tamaño siempre visible: `Simple | Doble tapa` (pastillas grandes). Arranca en Simple.
2. **Escenario (mitad superior):** la tortilla vista desde arriba; cada elección "cae" con rebote en su zona (salsas en chorrito arriba, carnes al centro, vegetales alrededor). Contador de relleno "Relleno 3/6".
3. **Paso actual (mitad inferior):** título grande ("Elegí tu tortilla"), barra de pasos (1 Tortilla · 2 Salsas · 3 Carne · 4 Vegetales · 5 Listo) y el **carrusel**:
   - Deslizar de un lado al otro; el ícono del centro se agranda, los de los costados quedan inclinados en perspectiva.
   - Tocar un ícono lo agrega (o lo saca si ya estaba). En carne, el ícono muestra `−  2  +` para porciones.
   - Al llegar al máximo, el resto se apaga con "Llegaste al máximo (4/4)".
4. **Botón fijo abajo:** "Siguiente · $X" (deshabilitado con motivo si falta algo, ej. "Te falta 1 porción de carne (1/2)").
5. **Paso Listo:** el burrito se enrolla (imagen "enrollado"), resumen con papas incluidas, cantidad, nombre opcional ("El de Juan") y dos botones:
   - **Agregar al pedido** → carrito persistente (contador en el header).
   - **Guardar en mi celular** → Mis combos.

- Cambio Doble → Simple con exceso: diálogo "Tu burrito tiene más de lo que entra en uno simple. ¿Qué sacamos?" — nunca recortar en silencio. Simple → Doble conserva todo y pide completar hasta 4 porciones de carne.
- Ir para atrás nunca pierde lo elegido; el armado en curso se guarda en el dispositivo.

### Mis combos
- Sección debajo del hero, solo si hay alguno guardado: tarjetas con nombre, mini resumen y precio actual; botones **Pedir de nuevo** (va al carrito) y **Editar** (vuelve al armador cargado) y borrar.
- Guardado en `localStorage` (try/catch, máx. 10, versión del formato).
- Al cargar uno, se valida contra el catálogo actual: si un ingrediente ya no está, se avisa "Ya no tenemos Choclo, lo sacamos" y se quita.

### Movimiento y fallback
- Animaciones con CSS/Web Animations (sin librerías pesadas).
- `prefers-reduced-motion`: sin caídas, sin inclinación del carrusel (lista horizontal simple).
- No hace falta detectar WebGL (no se usa).

## Imágenes
- Ruta: `apps/web/public/armador/<slug-del-ingrediente>.avif` y `tortilla-<slug>.avif`, más `enrollado-simple.avif`, `enrollado-doble.avif`, `papas.avif`.
- Formato: cuadradas, fondo transparente. Íconos 512×512; tortillas 1024×1024 vista desde arriba.
- La columna `imagen_url` de `ingredientes` guarda la ruta relativa.
- **Provisorias:** SVG simples con el mismo nombre de archivo base, hasta que lleguen las de Max. El código busca `.avif` y cae al `.svg` si no existe.

## Datos en la página
- La home es SSR: lee el catálogo activo de Supabase con la clave pública y se lo pasa a la isla del armador. Si Supabase falla, mensaje amable "No pudimos cargar el menú, probá de nuevo".
- El armador es una isla `client:load` (es lo principal de la página).

## Decisiones del builder (revisar)
- **Salsas no cuentan en el relleno.** El contador "Relleno X/N" cuenta solo carnes y vegetales.
- **Base de desarrollo:** `burritos-dev` solo tiene el seed de ejemplo y ningún pedido real. La migración nueva borra el catálogo de ejemplo viejo (ingredientes, recetas, combos prehechos) y `seed.sql` se reescribe con el catálogo nuevo, incluidos los prehechos rearmados con los ingredientes nuevos.
- **Carrito incluido, mínimo:** cajón lateral con lista de ítems, cantidad +/−, borrar y "Editar" (vuelve al armador cargado). Contador en el header. Sin checkout.
- **Extra de tortilla en la doble:** se cobra una vez (como ya está en [[10 Preguntas abiertas]]). Hoy todos los extras son 0.

## Fuera de alcance pero a tener en cuenta
- `POST /api/pedidos` (Fase 2) usará el mismo `validarArmado`.
- Combos del menú (prehechos) quedan en la base; se mostrarán en otra sección más adelante.

## Lo que queda a criterio del builder
- Estructura interna de componentes y nombres de archivos dentro de `apps/web/src/components/armador/`.
- Detalle de las animaciones (duraciones, curvas) respetando reduced-motion.
- Cómo se dibujan los SVG provisorios.
- Forma exacta del store de Zustand y del carrito, mientras persistan y validen con `shared`.

## Pendiente de Max `[A CONFIRMAR]`
- Precios base de simple y doble (con papas).
- ¿Pescado o maíz llevan costo extra?
- Lista final de vegetales y salsas.
- Imágenes `.avif`.
