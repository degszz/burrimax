// Datos PÚBLICOS de Supabase (van al navegador; no son secretos). Si faltan
// las variables en Vercel, se usan estos valores para que la tienda cargue.
// La clave secreta (SUPABASE_SECRET_KEY) nunca va acá: solo en variables del servidor.

const URL_POR_DEFECTO = 'https://qoxzylgpstmzjzgxnetw.supabase.co';
const CLAVE_PUBLICA_POR_DEFECTO = 'sb_publishable_vE1Y9WMUSfW3q7gpf2hf_g_W8Qrjhro';

export const SUPABASE_URL: string = import.meta.env.PUBLIC_SUPABASE_URL || URL_POR_DEFECTO;
export const SUPABASE_CLAVE_PUBLICA: string = import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY || CLAVE_PUBLICA_POR_DEFECTO;
