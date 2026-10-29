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

### 2026-10-28 · Supabase de desarrollo en la nube, sin Docker
La base local de Supabase necesita Docker, y en Windows eso pide WSL y reinicio. Usamos un proyecto gratis de desarrollo (`burritos-dev`, São Paulo) y aplicamos migraciones con el MCP de Supabase. Las migraciones igual viven en `supabase/migrations/`. Descartado por ahora: Docker + `supabase start`.

### 2026-10-28 · shadcn con Base UI
Es la opción recomendada actual del CLI de shadcn (preset `nova`). Descartado: Radix (el propio shadcn ofrece migrar de Radix a Base).

### 2026-10-28 · TypeScript 6, no 7
`@astrojs/check` todavía no soporta TypeScript 7. Volver a mirar cuando lo soporte.

### 2026-10-28 · Validación del armado separada del precio
`validarArmado` (en `shared/armador/schema.ts`) devuelve todos los errores juntos; `pricing.ts` la usa y tira `PedidoInvalidoError`. El pedido que manda el cliente no tiene campos de precio: Zod los descarta.

### 2026-10-28 · `config_negocio` es de lectura pública y no guarda secretos
El asesor de Supabase marcó la vista `config_publica` con permisos de su creador (security definer) como error. Todo lo que hay en `config_negocio` se le muestra al cliente (alias, CVU, WhatsApp), así que la tabla tiene una política de lectura pública y la vista corre con los permisos del que consulta (`security_invoker`). **Las claves y tokens van siempre en variables de entorno, nunca en esta tabla.**

### 2026-10-28 · `ver_pedido` pública a propósito
Es una función con permisos de su creador que el asesor marca como aviso. Es intencional: solo devuelve datos con el id y el token de 36 caracteres hex. Solo la puede llamar `anon` (la tienda).

### 2026-10-29 · El "3D" son renders `.avif`, sin WebGL
El armador apila los renders 3D de Max (íconos `.avif` livianos) sobre la tortilla. Carga rápido y anda en cualquier celular. Descartado: React Three Fiber (5–10× más pesado, va a saltos en celulares baratos) y modelos `.glb` (no existen). Ver [[superpowers/specs/2026-10-28-armador-hero-design|diseño]].

### 2026-10-29 · Opciones en grilla, no en carrusel
Pedido de Max. La grilla muestra todo de un vistazo, no hay que descubrir que se desliza y cada tarjeta es un botón grande y quieto: mejor para gente mayor. Cuando el escenario sale de la pantalla, una franja arriba muestra el plato en miniatura, "Relleno X/N" y el precio, para que cada toque se vea. Descartado: carrusel con perspectiva (del diseño de Claude Design).

### 2026-10-29 · Mis combos y carrito en el celular, sin cuenta
`localStorage` con try/catch (máx. 10 combos). Al cargar, todo se valida contra el catálogo actual y se avisa qué ingrediente ya no está. Los precios se recalculan siempre; nunca se guardan.

### 2026-10-29 · Catálogo de ejemplo rearmado en `burritos-dev`
La base de desarrollo no tenía pedidos: se vació el catálogo viejo (tapa/proteína/relleno/agregado) y se cargó el nuevo con `seed.sql`. Imágenes con nombre = `slug` del ingrediente; si falta el `.avif`, se usa el `.svg` provisorio.

### 2026-10-28 · El `precio_extra` de la tapa se cobra una vez, también en la doble
Regla de ejemplo hasta que se confirme (ver [[10 Preguntas abiertas]]).
