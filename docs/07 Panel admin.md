---
tags: [burritos, admin]
---
# Panel admin

## Separación
- App propia: `apps/admin`, deploy separado en `admin.[dominio]`.
- No comparte rutas ni cookies con la tienda. `noindex`.
- Login con Supabase Auth (email + contraseña) + **MFA TOTP obligatorio**.
- Solo usuarios con `app_metadata.role = 'admin'` (se asigna a mano o con script; no hay registro público).

## Pantallas
1. **Pedidos en vivo** (pantalla principal, pensada para tablet en la cocina)
   - Columnas tipo kanban: Pendiente pago · Confirmado · En preparación · Listo · En camino.
   - Supabase Realtime: pedido nuevo → **sonido + tarjeta que parpadea**.
   - Tarjeta: número, hora, nombre, teléfono (botón WhatsApp), dirección, ítems con ingredientes, forma de pago, total, vuelto.
   - Botones grandes para avanzar estado. "Marcar pagado" para transferencias.
   - **Imprimir comanda** (formato ticket 58/80 mm).
2. **Catálogo**: ingredientes, tamaños y límites, productos, combos, menús. Activar/desactivar con un toque (sin stock).
3. **Configuración**: abierto/cerrado, horarios, alias/CVU, WhatsApp, zonas de envío, medios de pago activos.
4. **Historial**: búsqueda por número/teléfono/fecha, total vendido del día.

## Seguridad
- Toda escritura pasa por RLS de admin; nada de service role en el navegador.
- Registro de cambios de estado en `pedido_historial` con el usuario que lo hizo.
- Sesión que expira; botón "Cerrar sesión en todos los dispositivos".
