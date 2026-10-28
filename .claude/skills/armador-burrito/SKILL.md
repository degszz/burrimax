---
name: armador-burrito
description: Usar al construir o modificar el armador de burritos — pasos, límites de ingredientes por tamaño (simple/doble tapa), store de Zustand, precio en vivo, edición desde el carrito.
---
# Armador de burritos

Lee primero: `docs/02 Reglas de negocio.md`, `docs/03 Flujo del cliente.md`, `docs/04 Armador 3D.md`.

## Arquitectura
```
apps/web/src/components/armador/
  Armador.tsx              # isla raíz (client:visible), elige Vista3D o Vista2D
  PasoTamano.tsx · PasoIngredientes.tsx (genérico por categoría) · PasoResumen.tsx
  BarraProgreso.tsx · BotonSiguiente.tsx (con precio parcial)
  vista2d/Vista2D.tsx      # capas PNG apiladas
  vista3d/Vista3D.tsx      # canvas R3F (lazy import)
apps/web/src/stores/armador.ts
packages/shared/src/armador/schema.ts   # Zod
packages/shared/src/pricing.ts
```

## Store (Zustand)
Estado: `paso`, `tamanoId`, `seleccion: Record<categoriaSlug, ingredienteId[]>`, `cantidad`, `nombrePersonalizado`, `editandoItemId?`.
Acciones: `elegirTamano`, `toggleIngrediente`, `siguiente`, `anterior`, `reset`, `cargarDesdeItem` (editar desde carrito), `cargarDesdeProducto` (personalizar un prehecho).
Derivados (selectores): `limiteDe(categoria)`, `puedeAgregar(categoria)`, `pasoValido`, `precioPreview` (usa `pricing.ts`).

## Reglas
- Los límites vienen de la tabla `tamanos` (nunca hardcodeados).
- **Cambiar de simple a doble** conserva todo. **De doble a simple**: si se excede algún límite, mostrar diálogo "Tu burrito tiene más de lo que entra en uno simple. ¿Qué sacamos?" — nunca recortar en silencio.
- Tapa: selección única. Proteína: mín. 1.
- Al llegar al límite: tarjetas restantes `disabled` + texto "Llegaste al máximo (4/4)". Contador siempre visible.
- Ingrediente inactivo que estaba en el carrito → al cargar, avisar y sacarlo.
- Persistir el armador en curso en localStorage (try/catch) para no perderlo si se cierra la pestaña.

## Validación compartida
`armadoSchema` en `shared` recibe el catálogo/límites y valida: tapa única, mínimos, máximos por categoría, ingredientes activos. El MISMO schema corre en `POST /api/pedidos`.

## UX
- Un paso por pantalla, botón "Siguiente" fijo abajo, "Atrás" nunca pierde datos.
- Tarjetas de ingrediente: imagen grande, nombre, `+$X` si tiene costo, badge "Sin TACC".
- Vibración corta (`navigator.vibrate`) al agregar, si existe.

## Tests mínimos
- Exceder límite → `puedeAgregar` false.
- Cambio doble→simple con exceso → pide resolución.
- `precioPreview` igual a `pricing` del servidor para los mismos datos.
