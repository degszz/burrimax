// Modelos 3D del burrito para "Verlo en mi mesa" con realidad aumentada.
// Uno por tamaño, en apps/web/public/modelos/:
//   burrito-simple.glb · burrito-doble.glb  → Android (Scene Viewer) y el visor 3D
//   burrito-simple.usdz · burrito-doble.usdz → iPhone (Quick Look). OPCIONALES:
//     si no están, <model-viewer> arma el USDZ solo a partir del GLB.
// Si falta el de un tamaño se usa el del otro; si no hay ninguno, la versión
// con la foto sobre la cámara.

export type TamanoModelo = 'simple' | 'doble';

export interface Modelo3D {
  glb: string;
  /** null: lo genera <model-viewer> desde el GLB al tocar "Ponerlo en mi mesa" en el iPhone. */
  usdz: string | null;
  /** El tamaño del modelo que se encontró (puede no ser el pedido). */
  tamano: TamanoModelo | 'generico';
}

const ruta = (nombre: string, extension: 'glb' | 'usdz') => `/modelos/${nombre}.${extension}`;

const existe = new Map<string, Promise<boolean>>();

/** ¿Está subido ese archivo? Se pregunta una sola vez por visita. */
function hayArchivo(url: string): Promise<boolean> {
  let respuesta = existe.get(url);
  if (!respuesta) {
    respuesta = fetch(url, { method: 'HEAD' })
      .then((r) => r.ok && !(r.headers.get('content-type') ?? '').includes('text/html'))
      .catch(() => false);
    existe.set(url, respuesta);
  }
  return respuesta;
}

/** El modelo para ese tamaño, el del otro tamaño, el genérico viejo (`burrito.glb`) o null. */
export async function modelo3D(tamano: TamanoModelo): Promise<Modelo3D | null> {
  const otro: TamanoModelo = tamano === 'simple' ? 'doble' : 'simple';
  const candidatos: [string, Modelo3D['tamano']][] = [
    [`burrito-${tamano}`, tamano],
    [`burrito-${otro}`, otro],
    ['burrito', 'generico'],
  ];
  // Se pregunta por todos a la vez (en un celular lento, uno detrás del otro tarda).
  const hay = await Promise.all(candidatos.flatMap(([nombre]) => [hayArchivo(ruta(nombre, 'glb')), hayArchivo(ruta(nombre, 'usdz'))]));
  const i = candidatos.findIndex((_, n) => hay[n * 2]);
  if (i < 0) return null;
  const [nombre, encontrado] = candidatos[i]!;
  return { glb: ruta(nombre, 'glb'), usdz: hay[i * 2 + 1] ? ruta(nombre, 'usdz') : null, tamano: encontrado };
}
