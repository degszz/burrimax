interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_PUBLISHABLE_KEY: string;
  /** URL pública del sitio (para webhooks y retornos de pago). Si falta, se usa la del request. */
  readonly PUBLIC_SITE_URL?: string;
  /** Solo servidor: crear pedidos y procesar webhooks. */
  readonly SUPABASE_SECRET_KEY?: string;
  /** Solo servidor: Mercado Pago (usar las de PRUEBA en desarrollo). */
  readonly MP_ACCESS_TOKEN?: string;
  readonly MP_WEBHOOK_SECRET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
