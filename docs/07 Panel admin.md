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

## Estado (2026-10-30)
Hecho en `apps/admin`:
- **Login + MFA obligatorio** (TOTP: Google Authenticator/Authy). Sesión en cookies **httpOnly**; el middleware exige sesión → rol admin → código del celular (`aal2`). La base exige lo mismo: `es_admin()` = rol admin **y** `aal2` (migración `admin_exige_mfa`).
- **Pedidos** (`/`): tablero por columnas (Esperando pago · Nuevos · En preparación · Listos · En camino), se actualiza cada 8 s, **sonido** al entrar un pedido (tocar "Activar sonido" una vez), minutos en rojo pasados los 30, WhatsApp y Maps con un toque, vuelto en efectivo, botón grande para avanzar, "Llegó la transferencia"/"Cobrado", cancelar con motivo, **imprimir comanda** 80 mm. Terminados de las últimas 12 h con total entregado.
- Cada cambio pasa por `cambiar_estado_pedido` / `marcar_pagado` (validan y dejan historial con usuario y motivo). El cliente ve cada paso **con su hora** en `/pedido/<id>`.
- **Horarios** (`/horarios`): modo Automático / Abierto ahora / Cerrado ahora, turnos por día (hasta 3, cruzan la medianoche), "Copiar a todos" y vista previa de lo que ve el cliente.

Falta: catálogo (precios, sin stock), resto de configuración (alias, zonas, medios de pago), historial con filtros, avisos por WhatsApp (ver [[Planes/WhatsApp automático]]).

## Cómo entrar por primera vez (lo hace Max)
1. Supabase → **Authentication → Users → Add user → Create new user**: tu email y una contraseña larga, con "Auto Confirm User".
2. Supabase → **SQL Editor**, pegá esto (con tu email) y tocá Run:
   ```sql
   update auth.users
   set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'::jsonb
   where email = 'TU_EMAIL';
   ```
3. `pnpm dev:admin` → http://localhost:4322 → email y contraseña → escaneá el QR con Google Authenticator → código de 6 números.
4. Publicarlo: en Vercel, **Add New → Project** → el mismo repo `burrimax` → **Root Directory `apps/admin`** → Deploy. No necesita variables (usa la clave pública; nunca la secreta). Después, dominio `admin.<tu-dominio>`.
