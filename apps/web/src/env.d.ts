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
  /** Solo servidor: avisos push al celular del admin. */
  readonly VAPID_PRIVATE_KEY?: string;
  /** Solo servidor: bot de WhatsApp (Cloud API de Meta). */
  readonly WHATSAPP_TOKEN?: string;
  readonly WHATSAPP_PHONE_NUMBER_ID?: string;
  /** App Secret de la app de Meta: verifica la firma X-Hub-Signature-256. */
  readonly WHATSAPP_APP_SECRET?: string;
  /** Lo inventa Max: Meta lo manda al verificar el webhook. */
  readonly WHATSAPP_VERIFY_TOKEN?: string;
  /** Solo servidor: leer comprobantes de transferencia (pre-aprobación). Opcional. */
  readonly ANTHROPIC_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
