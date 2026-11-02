// Firma de los avisos de Meta: cabecera `X-Hub-Signature-256: sha256=<hex>`,
// HMAC-SHA256 del cuerpo crudo con el App Secret de la app. Se calcula sobre
// los bytes tal como llegan (antes de leer el JSON).

const aHex = (buffer: ArrayBuffer) => [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');

/** Comparación en tiempo constante (no corta en el primer carácter distinto). */
function iguales(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diferencia = 0;
  for (let i = 0; i < a.length; i++) diferencia |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diferencia === 0;
}

export async function firmaMeta(cuerpo: Uint8Array | string, secreto: string): Promise<string> {
  const datos = typeof cuerpo === 'string' ? new TextEncoder().encode(cuerpo) : cuerpo;
  const clave = await crypto.subtle.importKey('raw', new TextEncoder().encode(secreto), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return aHex(await crypto.subtle.sign('HMAC', clave, datos as Uint8Array<ArrayBuffer>));
}

export async function firmaMetaValida(cuerpo: Uint8Array | string, cabecera: string | null, secreto: string | undefined): Promise<boolean> {
  if (!secreto || !cabecera?.startsWith('sha256=')) return false;
  const recibida = cabecera.slice('sha256='.length).trim().toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(recibida)) return false;
  return iguales(await firmaMeta(cuerpo, secreto), recibida);
}
