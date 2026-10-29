// localStorage en memoria para los tests (Vitest corre en Node).

export function instalarLocalStorage(opciones: { roto?: boolean } = {}) {
  const datos = new Map<string, string>();
  const almacen = {
    getItem(clave: string) {
      if (opciones.roto) throw new Error('SecurityError');
      return datos.get(clave) ?? null;
    },
    setItem(clave: string, valor: string) {
      if (opciones.roto) throw new Error('QuotaExceededError');
      datos.set(clave, valor);
    },
    removeItem(clave: string) {
      datos.delete(clave);
    },
    clear() {
      datos.clear();
    },
  };
  Object.defineProperty(globalThis, 'localStorage', { value: almacen, configurable: true, writable: true });
  return datos;
}
