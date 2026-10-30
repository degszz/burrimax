import { ArrowRight } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Props<T> {
  items: T[];
  clave: (item: T) => string;
  render: (item: T, enCentro: boolean) => ReactNode;
  pista: string;
  etiqueta: string;
}

/**
 * Carrusel que se desliza con el dedo. La tarjeta del centro se agranda y las
 * de los costados se inclinan en perspectiva (salvo con reduced-motion).
 */
export function Carrusel<T>({ items, clave, render, pista, etiqueta }: Props<T>) {
  const pista_ = useRef<HTMLDivElement>(null);
  const [centro, setCentro] = useState(0);

  useEffect(() => {
    const contenedor = pista_.current;
    if (!contenedor) return;
    const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let cuadro = 0;

    const actualizar = () => {
      cuadro = 0;
      const medio = contenedor.scrollLeft + contenedor.clientWidth / 2;
      let masCerca = 0;
      let menorDistancia = Infinity;
      Array.from(contenedor.children).forEach((nodo, i) => {
        const tarjeta = nodo as HTMLElement;
        const distancia = (tarjeta.offsetLeft + tarjeta.offsetWidth / 2 - medio) / tarjeta.offsetWidth;
        if (Math.abs(distancia) < menorDistancia) {
          menorDistancia = Math.abs(distancia);
          masCerca = i;
        }
        if (sinMovimiento) return;
        const d = Math.max(-1.6, Math.min(1.6, distancia));
        tarjeta.style.transform = `perspective(900px) rotateY(${-d * 24}deg) scale(${1 - Math.abs(d) * 0.13})`;
        tarjeta.style.zIndex = String(100 - Math.round(Math.abs(d) * 10));
      });
      setCentro(masCerca);
    };

    const alDeslizar = () => {
      if (!cuadro) cuadro = requestAnimationFrame(actualizar);
    };
    actualizar();
    contenedor.addEventListener('scroll', alDeslizar, { passive: true });
    window.addEventListener('resize', alDeslizar);
    return () => {
      contenedor.removeEventListener('scroll', alDeslizar);
      window.removeEventListener('resize', alDeslizar);
      cancelAnimationFrame(cuadro);
    };
  }, [items.length]);

  return (
    <div>
      <div
        ref={pista_}
        role="list"
        aria-label={etiqueta}
        className="sin-scrollbar relative flex snap-x snap-mandatory gap-1 overflow-x-auto px-[calc(50%-min(22vw,5.75rem))] py-2.5"
      >
        {items.map((item, i) => (
          <div key={clave(item)} role="listitem" className="w-[min(44vw,11.5rem)] shrink-0 snap-center will-change-transform">
            {render(item, i === centro)}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-3 px-4 text-tinta-suave">
        <span aria-hidden className="flex gap-1.5">
          {items.map((item, i) => (
            <span key={clave(item)} className={cn('h-2 rounded-full transition-all', i === centro ? 'w-5 bg-tinta' : 'w-2 bg-tinta/25')} />
          ))}
        </span>
        <span className="flex items-center gap-1 text-base font-semibold">
          {pista}
          {pista.startsWith('Deslizá') && <ArrowRight aria-hidden className="size-4" />}
        </span>
      </div>
    </div>
  );
}
