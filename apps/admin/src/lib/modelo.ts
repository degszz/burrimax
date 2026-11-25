// Deja el burrito escaneado listo para "Verlo en mi mesa": en tamaño real
// (según el largo que mide Max con una regla), apoyado en el piso y centrado.
// Se hace en el navegador antes de subirlo, así vale también para la realidad
// aumentada de Android e iPhone (que leen el archivo tal cual).

export interface ModeloAjustado {
  archivo: Blob;
  /** Lo que medía el escaneo antes de ajustarlo (para avisar si era muy distinto). */
  largoOriginalCm: number;
}

export async function ajustarModelo(archivo: File, largoCm: number): Promise<ModeloAjustado> {
  const [{ WebIO, getBounds }, { ALL_EXTENSIONS }] = await Promise.all([import('@gltf-transform/core'), import('@gltf-transform/extensions')]);
  const io = new WebIO().registerExtensions(ALL_EXTENSIONS);
  const doc = await io.readBinary(new Uint8Array(await archivo.arrayBuffer()));
  const raiz = doc.getRoot();
  const escena = raiz.getDefaultScene() ?? raiz.listScenes()[0];
  if (!escena) throw new Error('El archivo no tiene ningún modelo');

  const { min, max } = getBounds(escena);
  // Lo más largo en el plano de la mesa (x o z); y es la altura.
  const largo = Math.max(max[0] - min[0], max[2] - min[2]);
  if (!(largo > 0)) throw new Error('El modelo está vacío');
  const s = largoCm / 100 / largo;

  // Un nodo nuevo envuelve todo: escala a metros reales, centra y apoya la base en y = 0.
  const nodo = doc
    .createNode('burrito')
    .setScale([s, s, s])
    .setTranslation([(-(min[0] + max[0]) / 2) * s, -min[1] * s, (-(min[2] + max[2]) / 2) * s]);
  for (const hijo of escena.listChildren()) {
    escena.removeChild(hijo);
    nodo.addChild(hijo);
  }
  escena.addChild(nodo);
  raiz.setDefaultScene(escena);

  const binario = await io.writeBinary(doc);
  return { archivo: new Blob([binario as BlobPart], { type: 'model/gltf-binary' }), largoOriginalCm: largo * 100 };
}
