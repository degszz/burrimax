// localStorage puede no existir, estar bloqueado (modo privado, permisos) o
// tener datos viejos/rotos. Todo pasa por acá para que eso nunca rompa la página.

function almacen(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function leer<T>(clave: string, valida: (dato: unknown) => T | null): T | null {
  try {
    const texto = almacen()?.getItem(clave);
    return texto == null ? null : valida(JSON.parse(texto));
  } catch {
    return null;
  }
}

export function escribir(clave: string, valor: unknown): boolean {
  try {
    const destino = almacen();
    if (!destino) return false;
    destino.setItem(clave, JSON.stringify(valor));
    return true;
  } catch {
    return false;
  }
}

export function borrar(clave: string): void {
  try {
    almacen()?.removeItem(clave);
  } catch {
    // nada que hacer
  }
}

/** Adaptador para `persist` de Zustand. */
export const almacenSeguro = {
  getItem: (clave: string) => {
    try {
      return almacen()?.getItem(clave) ?? null;
    } catch {
      return null;
    }
  },
  setItem: (clave: string, valor: string) => {
    try {
      almacen()?.setItem(clave, valor);
    } catch {
      // sin espacio o bloqueado: se sigue sin persistir
    }
  },
  removeItem: (clave: string) => borrar(clave),
};
