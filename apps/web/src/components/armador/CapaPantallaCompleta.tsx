import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * Capa que ocupa toda la pantalla, header incluido, sin scroll de fondo.
 * Va por portal al <body>: el paso "¡Listo!" tiene una animación con transform
 * y un `fixed` adentro queda atrapado en esa sección (se veía el header encima
 * y había que scrollear para ver la cámara).
 */
export function CapaPantallaCompleta({ children }: { children: ReactNode }) {
  useEffect(() => {
    const { documentElement: html, body } = document;
    const antes = [html.style.overflow, body.style.overflow];
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    return () => {
      [html.style.overflow, body.style.overflow] = antes as [string, string];
    };
  }, []);

  return createPortal(children, document.body);
}
