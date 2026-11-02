// Teléfonos argentinos: el cliente escribe su número como quiere en el
// checkout ("02271 15 468521", "+54 9 11 1234-5678", "2271468521"…) y Meta
// manda el de WhatsApp como 549 + código de área + número. Para comparar se
// lleva todo al número nacional de 10 dígitos (área + número, sin 0 ni 15).

const soloDigitos = (s: string) => s.replace(/\D/g, '');

/** "5492271468521" → "2271468521". null si no es un número argentino de 10 dígitos. */
export function nacionalDesdeWaId(waId: string): string | null {
  const d = soloDigitos(waId);
  if (!d.startsWith('54')) return null;
  let resto = d.slice(2);
  if (resto.startsWith('9')) resto = resto.slice(1);
  return resto.length === 10 ? resto : null;
}

/**
 * Números nacionales posibles para lo que escribió el cliente. Puede haber
 * más de uno cuando no se sabe dónde termina el código de área y aparece un 15.
 * Los códigos de área argentinos empiezan con 1, 2 o 3: un 54 adelante es el país.
 */
export function candidatosNacionales(telefono: string): string[] {
  let d = soloDigitos(telefono);
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('54') && d.length >= 12) {
    d = d.slice(2);
    if (d.startsWith('9')) d = d.slice(1);
  }
  if (d.startsWith('0')) d = d.slice(1);

  const candidatos = new Set<string>();
  if (d.length === 10) candidatos.add(d);
  if (d.length === 12) {
    for (const largoArea of [2, 3, 4]) {
      if (d.slice(largoArea, largoArea + 2) === '15') candidatos.add(d.slice(0, largoArea) + d.slice(largoArea + 2));
    }
  }
  return [...candidatos];
}

/** ¿El número de WhatsApp que escribe es el mismo que dejó en el pedido? */
export function mismoTelefono(waId: string, telefono: string): boolean {
  const nacional = nacionalDesdeWaId(waId);
  return !!nacional && candidatosNacionales(telefono).includes(nacional);
}
