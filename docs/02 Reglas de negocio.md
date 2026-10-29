---
tags: [burritos, negocio]
---
# Reglas de negocio

> Todo lo marcado `[A CONFIRMAR]` es un valor de ejemplo. Se guarda en la base (tablas `tamanos`, `categorias_ingrediente`, `config_negocio`), así se cambia desde el admin sin tocar código.

## Tamaños (decidido por Max, 2026-10-28)
| Tamaño | Tapas | Precio base (con papas) | Carne | Vegetales | Relleno total | Salsas |
|---|---|---|---|---|---|---|
| **Simple** | 1 | `[A CONFIRMAR]` $9.000 | **exactamente 2** porciones | hasta 4 | 6 | hasta 2 |
| **Doble tapa** | 2 | `[A CONFIRMAR]` $13.500 | **exactamente 4** porciones | hasta 6 | 10 | hasta 2 |

- La doble tapa usa **dos tortillas del mismo tipo**.
- **No hay opción sin carne.** Se puede repetir la misma carne (ej. pollo ×2).
- **Papas fritas incluidas siempre**, no se eligen.

## Pasos del armador (en este orden)
0. **Tamaño** — selector siempre visible arriba (simple / doble tapa)
1. **Tortilla** — obligatoria, elegís 1
2. **Salsas** — opcional, hasta 2
3. **Carne** — por porciones, exacta según tamaño
4. **Vegetales** — opcional, hasta el máximo del tamaño
5. **¡Listo!** — resumen, nombre opcional ("El de Juan"), cantidad, agregar al pedido o guardar en el celular

## Ingredientes `[A CONFIRMAR nombres]`
- **Tortillas:** maíz (sin TACC) · harina de trigo
- **Carnes:** pollo · vaca · cerdo · pescado
- **Salsas:** guacamole · pico de gallo · crema ácida · picante suave · picante fuerte
- **Vegetales:** lechuga · tomate · cebolla · cebolla morada · cebolla de verdeo · choclo · morrones · repollo · zanahoria · huevo

## Precio
```
precio_item = tamaño.precio_base           (incluye papas)
            + Σ precio_extra de cada porción/ingrediente
total = Σ (precio_item × cantidad) + costo_envio
```
- Hoy todos los extras son $0. Si el pescado o el maíz tienen extra, se carga en `precio_extra` y cada porción lo suma. `[A CONFIRMAR]`
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
