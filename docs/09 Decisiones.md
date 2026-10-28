---
tags: [burritos, decisiones]
---
# Registro de decisiones

Formato: fecha · decisión · por qué · alternativas descartadas.

### 2026-10-28 · Mercado Pago principal, Stripe detrás de interruptor
Stripe no abre cuentas de negocios en Argentina; MP es más barato y conocido para clientes locales. Stripe queda listo pero apagado. Descartado: Stripe como principal.

### 2026-10-28 · Monorepo con admin como app separada
El admin tiene que estar totalmente separado y seguro. Comparten solo `packages/shared` (tipos y precios). Descartado: ruta `/admin` dentro de la tienda.

### 2026-10-28 · Precio calculado solo en servidor
Evita pedidos manipulados. La misma función se usa en el cliente solo para mostrar.

### 2026-10-28 · Armador primero en 2D, después 3D
El 2D es el fallback obligatorio y permite probar toda la lógica sin esperar los modelos.

### 2026-10-28 · Email opcional, teléfono obligatorio
El contacto real es por WhatsApp/teléfono.

### 2026-10-28 · Límites de ingredientes en la base
Así el dueño los cambia desde el admin sin tocar código.
