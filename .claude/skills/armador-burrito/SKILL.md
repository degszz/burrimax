---
name: armador-burrito
description: Usar al construir o modificar el armador de burritos — pasos, límites de ingredientes por tamaño (simple/doble tapa), store de Zustand, precio en vivo, edición desde el carrito.
---
# Armador de burritos

Lee primero: `docs/02 Reglas de negocio.md`, `docs/03 Flujo del cliente.md`, `docs/04 Armador 3D.md`.

## Arquitectura
```
apps/web/src/components/Tienda.tsx          # isla raíz (client:load): armador, carrito, Mis combos
apps/web/src/components/armador/
  SelectorTamano · Escenario (tortilla + capas .avif) · BarraPasos
  TarjetaIngrediente (grilla; carne con − n +) · BarraSiguiente · ResumenFlotante
  PasoListo · BurritoEnrollado · DialogoCambioTamano · ImagenIngrediente (.avif → .svg)
apps/web/src/lib/armador/reglas.ts          # puedeAgregar, motivoBloqueo, excesoAlCambiar, limpiarContraCatalogo
apps/web/src/lib/misCombos.ts               # combos guardados en el celular
apps/web/src/stores/{armador,carrito}.ts    # Zustand persistido (skipHydration + rehydrate al montar)
packages/shared/src/armador/schema.ts       # Zod + validarArmado
packages/shared/src/pricing.ts              # precioUnitarioArmado, precioVistaPrevia
```

## Store (Zustand)
Estado: `paso`, `tamanoId`, `seleccion: { tortilla, salsa, carne, vegetal }` (en carne, ids repetidos = porciones), `cantidad`, `nombre`, `editandoItemId`.
Acciones: `elegirTamano`, `alternar`, `sumarPorcion`, `restarPorcion`, `irAPaso`, `siguiente`, `anterior`, `cargar` (editar desde carrito o Mis combos), `reset`.
`armadoActual(estado)` arma el `Armado` de shared.

## Reglas
- Los límites vienen de la tabla `tamanos` (nunca hardcodeados).
- **Cambiar de simple a doble** conserva todo. **De doble a simple**: si se excede algún límite, mostrar diálogo "Tu burrito tiene más de lo que entra en uno simple. ¿Qué sacamos?" — nunca recortar en silencio.
- Tortilla: selección única (tocar otra la reemplaza). Carne: exacta según tamaño (2 simple, 4 doble), se puede repetir. Salsas hasta 2. Vegetales hasta 4/6.
- Al llegar al límite: tarjetas restantes `disabled` + texto "Llegaste al máximo (4/4)". Contador siempre visible.
- Ingrediente inactivo que estaba en el carrito → al cargar, avisar y sacarlo.
- Persistir el armador en curso en localStorage (try/catch) para no perderlo si se cierra la pestaña.

## Validación compartida
`armadoSchema` en `shared` recibe el catálogo/límites y valida: tortilla única, carne exacta, repetidos solo en carne, mínimos, máximos por categoría, ingredientes activos. El MISMO schema corre en `POST /api/pedidos`.

## UX
- Un paso por pantalla, botón "Siguiente" fijo abajo, "Atrás" nunca pierde datos.
- Tarjetas de ingrediente: imagen grande, nombre, `+$X` si tiene costo, badge "Sin TACC".
- Vibración corta (`navigator.vibrate`) al agregar, si existe.

## Tests mínimos
- Exceder límite → `puedeAgregar` false.
- Cambio doble→simple con exceso → pide resolución.
- `precioPreview` igual a `pricing` del servidor para los mismos datos.
