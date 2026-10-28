---
name: panel-admin
description: Usar para la app de administración separada (apps/admin) — login con MFA, rol admin, pedidos en tiempo real con sonido, cambios de estado, catálogo, configuración e impresión de comandas.
---
# Panel admin

Lee `docs/07 Panel admin.md`.

## Base
- `apps/admin`: Astro SSR + islas React + shadcn/ui. Deploy propio en `admin.[dominio]`. `<meta name="robots" content="noindex">` y `robots.txt` bloqueando todo.
- Auth: Supabase Auth con `@supabase/ssr` (cookies httpOnly). Middleware de Astro: sin sesión → `/login`; sin `role = admin` → cerrar sesión y mostrar "Sin acceso"; sin MFA verificada (AAL2) → `/mfa`.
- Alta de admins: script `pnpm admin:crear <email>` que usa service role para crear usuario y setear `app_metadata.role = 'admin'`. No hay registro público.
- Nunca usar service role en el navegador del admin: todo pasa por RLS con `es_admin()`.

## Pedidos en vivo (pantalla principal, pensada para tablet)
- Kanban por estado; carga inicial de pedidos del día no entregados.
- Suscripción Realtime a `pedidos`: INSERT → sonido (con botón inicial "Activar sonido" por la política de autoplay) + tarjeta resaltada; UPDATE → mover tarjeta.
- Reconexión automática y aviso "Sin conexión" visible.
- Tarjeta: #número, hora, minutos transcurridos (rojo > 30 min), cliente, teléfono con botón WhatsApp, dirección con link a Maps, ítems con ingredientes, forma de pago, total, vuelto (si efectivo).
- Botones grandes para avanzar estado; cancelar pide confirmación y motivo. Todo cambio → `pedido_historial`.
- "Marcar pagado" para transferencias.
- Imprimir comanda: vista `@media print` en ancho 58/80 mm, letra grande, ingredientes en lista.

## Catálogo y configuración
- CRUD de ingredientes (con subida de imagen y .glb a Storage), tamaños y límites, productos, combos, menús.
- Toggle rápido activo/inactivo (sin stock).
- Configuración: abierto/cerrado, horarios, alias/CVU/titular, WhatsApp, zonas de envío, medios de pago activos, aviso celíacos.

## Historial
- Filtros por fecha, estado, teléfono, número. Total vendido del día y por medio de pago.
