-- Reserva con vencimiento para los mensajes del bot: si la función se corta a
-- mitad de camino (timeout o caída), el mensaje queda "procesando" y el
-- reintento de Meta lo puede volver a tomar pasados unos minutos.
-- procesado = true y procesando_desde = null → contestado (no se toca más).
alter table public.whatsapp_mensajes add column procesando_desde timestamptz;
