import { useEffect, useRef } from 'react';

/**
 * Vuelve a disparar una animación CSS cada vez que cambia `valor`
 * (por ejemplo, que el contador "lata" al sumar relleno). No hace nada en el
 * primer render: solo responde a lo que la persona hace.
 *
 * `cuando` filtra los cambios que animan (ej. solo cuando algo se habilita).
 */
export function useLatido<T extends HTMLElement>(valor: unknown, clase: string, cuando: (nuevo: unknown) => boolean = () => true) {
  const ref = useRef<T>(null);
  const previo = useRef(valor);

  useEffect(() => {
    if (Object.is(previo.current, valor)) return;
    previo.current = valor;
    const elemento = ref.current;
    if (!elemento || !cuando(valor)) return;
    elemento.classList.remove(clase);
    void elemento.offsetWidth; // reinicia la animación
    elemento.classList.add(clase);
    // animationend burbujea: ignorar las animaciones de los hijos.
    const limpiar = (e: AnimationEvent) => {
      if (e.target !== elemento) return;
      elemento.classList.remove(clase);
      elemento.removeEventListener('animationend', limpiar);
    };
    elemento.addEventListener('animationend', limpiar);
    return () => elemento.removeEventListener('animationend', limpiar);
  }, [valor]);

  return ref;
}
