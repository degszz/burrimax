-- Advisor de Supabase: config_publica no debe ser SECURITY DEFINER.
-- config_negocio no guarda secretos (alias, CVU y WhatsApp se muestran al
-- cliente; las claves van en variables de entorno), así que alcanza con una
-- política de lectura y una vista normal.

drop policy "admin lee" on public.config_negocio;
create policy "lectura publica" on public.config_negocio for select to anon, authenticated
  using (true);

alter view public.config_publica set (security_invoker = true);

-- ver_pedido es pública a propósito (protegida por el token de seguimiento),
-- pero solo la usa la tienda: el admin lee pedidos directo con RLS.
revoke execute on function public.ver_pedido(uuid, text) from authenticated;
