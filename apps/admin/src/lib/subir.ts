import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CLAVE_PUBLICA, SUPABASE_URL } from './supabasePublico';

// Subida de la foto de un combo o del burrito en 3D (ver /api/subidas).

export type DestinoSubida = 'combo' | 'glb' | 'usdz';

const TIPOS: Record<string, string> = {
  webp: 'image/webp',
  png: 'image/png',
  jpg: 'image/jpeg',
  avif: 'image/avif',
  glb: 'model/gltf-binary',
  usdz: 'model/vnd.usdz+zip',
};

async function api<T>(cuerpo: Record<string, unknown>): Promise<T> {
  const r = await fetch('/api/subidas', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(cuerpo) });
  const res = (await r.json().catch(() => ({}))) as T & { error?: string };
  if (r.status === 401) {
    window.location.href = '/login';
    throw new Error('La sesión venció');
  }
  if (!r.ok) throw new Error(res.error ?? 'No se pudo subir');
  return res;
}

/** Sube el archivo directo a Storage y guarda su dirección. Devuelve la URL pública. */
export async function subirArchivo(destino: DestinoSubida, archivo: Blob, extension: string, id?: string): Promise<string> {
  const { bucket, path, token } = await api<{ bucket: string; path: string; token: string }>({ accion: 'pedir', destino, id, extension });
  const storage = createClient(SUPABASE_URL, SUPABASE_CLAVE_PUBLICA, { auth: { persistSession: false } }).storage;
  const { error } = await storage.from(bucket).uploadToSignedUrl(path, token, archivo, { contentType: TIPOS[extension] });
  if (error) throw new Error(/size|large|exceed/i.test(error.message) ? 'El archivo es muy pesado' : 'No se pudo subir el archivo');
  const { url } = await api<{ url: string }>({ accion: 'confirmar', destino, id, path });
  return url;
}

/** Vuelve a la foto de siempre (combo) o saca el modelo 3D. */
export async function quitarArchivo(destino: DestinoSubida, id?: string): Promise<void> {
  await api({ accion: 'quitar', destino, id });
}

/**
 * La foto se achica en el celular antes de subirla: WebP de hasta 900 px,
 * con el fondo transparente si lo tiene. Así la tienda carga rápido.
 */
export async function achicarFoto(archivo: File): Promise<Blob> {
  const imagen = await createImageBitmap(archivo);
  const escala = Math.min(1, 900 / Math.max(imagen.width, imagen.height));
  const lienzo = document.createElement('canvas');
  lienzo.width = Math.round(imagen.width * escala);
  lienzo.height = Math.round(imagen.height * escala);
  lienzo.getContext('2d')!.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
  imagen.close();
  return new Promise((ok, mal) => lienzo.toBlob((b) => (b ? ok(b) : mal(new Error('No se pudo leer la foto'))), 'image/webp', 0.86));
}
