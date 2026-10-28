---
tags: [burritos, negocio]
---
# Reglas de negocio

> Todo lo marcado `[A CONFIRMAR]` es un valor de ejemplo. Se guarda en la base (tablas `tamanos`, `categorias_ingrediente`, `config_negocio`), así se cambia desde el admin sin tocar código.

## Tamaños
| Tamaño | Tapas | Para quién | Precio base | Proteínas | Rellenos | Salsas | Agregados |
|---|---|---|---|---|---|---|---|
| **Simple** | 1 | El normal | `[A CONFIRMAR]` | 1 | hasta 4 | hasta 2 | hasta 3 |
| **Doble tapa** | 2 | Más grande, con más hambre | `[A CONFIRMAR]` | hasta 2 | hasta 6 | hasta 3 | hasta 5 |

- La doble tapa usa **dos tapas del mismo tipo** (no se mezclan). `[A CONFIRMAR]`

## Pasos del armador (en este orden)
1. **Tamaño** — simple o doble tapa
2. **Tapa (masa)** — obligatoria, elegís 1
3. **Proteína** — obligatoria, mín. 1
4. **Rellenos** — opcional, hasta el límite del tamaño
5. **Salsas** — opcional, hasta el límite
6. **Agregados** — opcional, con costo extra
7. **Resumen** — nombre opcional del burrito ("El de Juan"), cantidad, agregar al carrito

## Ingredientes de ejemplo `[A CONFIRMAR]`
- **Tapas:** harina común · integral · espinaca · sin TACC (celíacos)
- **Proteínas:** carne picada · pollo · cerdo desmechado · vegetariano (porotos)
- **Rellenos:** arroz · porotos negros · lechuga · tomate · cebolla · morrón · choclo · queso
- **Salsas:** guacamole · pico de gallo · crema ácida · picante suave · picante fuerte
- **Agregados (con costo):** extra queso · extra carne · panceta · jalapeños · nachos adentro

## Precio
```
precio_item = tamaño.precio_base
            + Σ ingrediente.precio_extra   (proteínas premium, tapas especiales)
            + Σ agregado.precio
total = Σ (precio_item × cantidad) + costo_envio
```
- Rellenos y salsas dentro del límite **no suman** (están incluidos).
- Algunas tapas/proteínas pueden tener `precio_extra` (ej. sin TACC +$X). `[A CONFIRMAR]`
- **Se calcula en el servidor.** El cliente solo muestra una vista previa con la misma función.

## Celíacos
- Tapa "Sin TACC" marcada con ícono claro.
- Aviso visible: posible contaminación cruzada en cocina compartida. `[A CONFIRMAR texto legal]`

## Datos del cliente
- **Obligatorio:** nombre, teléfono (formato AR), tipo de entrega.
- **Si es delivery:** dirección + referencias (entre calles, timbre).
- **Opcional:** email (para recibir comprobante).

## Formas de pago
| Forma | Cómo se confirma | Estado inicial |
|---|---|---|
| Mercado Pago (online) | Webhook de MP | `pendiente_pago` |
| Tarjeta vía Stripe | Webhook de Stripe | `pendiente_pago` |
| Transferencia | El local verifica y marca pagado | `pendiente_pago` |
| Efectivo | Se paga al recibir. Se pregunta "¿Con cuánto pagás?" para el vuelto | `confirmado` |

## Estados del pedido
`pendiente_pago → confirmado → en_preparacion → listo → en_camino → entregado`
Rama: `cancelado` (desde cualquier estado anterior a `entregado`).

## Operación
- Horario de atención y botón "Abierto/Cerrado" en el admin. Cerrado = no se pueden hacer pedidos.
- Ingrediente sin stock → se desactiva y desaparece del armador.
- Zonas de envío con costo fijo por zona. `[A CONFIRMAR]`
