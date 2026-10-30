// Modelo 3D del burrito para "Verlo en mi mesa" con realidad aumentada.
// Para activarlo alcanza con poner los archivos en apps/web/public/modelos/:
//   burrito.glb  → Android (Scene Viewer) y el visor 3D en la web
//   burrito.usdz → iPhone (Quick Look)
// Mientras no existan, se usa la versión con la foto sobre la cámara.

export const MODELO_3D = {
  glb: '/modelos/burrito.glb',
  usdz: '/modelos/burrito.usdz',
} as const;

let disponible: Promise<boolean> | null = null;

/** ¿Está subido el modelo? Se pregunta una sola vez por visita. */
export function hayModelo3D(): Promise<boolean> {
  disponible ??= fetch(MODELO_3D.glb, { method: 'HEAD' })
    .then((r) => r.ok && !(r.headers.get('content-type') ?? '').includes('text/html'))
    .catch(() => false);
  return disponible;
}
