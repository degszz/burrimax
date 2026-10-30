/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_PUBLISHABLE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals {
    /** Cliente de Supabase con la sesión del admin (cookies httpOnly). Todo pasa por RLS. */
    supabase: import('@supabase/supabase-js').SupabaseClient<import('@burritos/shared').Database>;
    usuario: { id: string; email: string | null } | null;
  }
}
