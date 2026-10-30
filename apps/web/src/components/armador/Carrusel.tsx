import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
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
 * Carrusel que se desliza con el dedo, estilo coverflow: la tarjeta del centro
 * se agranda y las de los costados se achican y se desenfocan. Con
 * reduced-motion se mantiene igual pero sin el giro en perspectiva.
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
        // Coverflow: la del centro se agranda y queda nítida; las de los
        // costados se achican, se meten un poco atrás y se desenfocan.
        // El tamaño y el desenfoque siguen al dedo (no es animación), así que
        // van siempre; con reduced-motion solo se saca el giro en perspectiva.
        const d = Math.max(-2, Math.min(2, distancia));
        const lejos = Math.min(1, Math.abs(d));
        const giro = sinMovimiento ? '' : `perspective(900px) rotateY(${-d * 18}deg) `;
        tarjeta.style.transform = `translateX(${-d * 14}%) ${giro}scale(${1.06 - lejos * 0.24})`;
        tarjeta.style.filter = lejos > 0.05 ? `blur(${(lejos * 2.5).toFixed(2)}px)` : '';
        tarjeta.style.opacity = String(1 - lejos * 0.35);
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

  // Centra la tarjeta de al lado (flechas en PC).
  function mover(direccion: 1 | -1) {
    const contenedor = pista_.current;
    const destino = contenedor?.children[centro + direccion] as HTMLElement | undefined;
    if (!contenedor || !destino) return;
    const suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    contenedor.scrollTo({
      left: destino.offsetLeft - (contenedor.clientWidth - destino.offsetWidth) / 2,
      behavior: suave ? 'smooth' : 'auto',
    });
  }

  return (
    <div>
      <div
        ref={pista_}
        role="list"
        aria-label={etiqueta}
        className="sin-scrollbar relative flex snap-x snap-mandatory gap-1 overflow-x-auto px-[calc(50%-min(22vw,5.75rem,11dvh))] py-2.5"
      >
        {items.map((item, i) => (
          <div key={clave(item)} role="listitem" className="w-[min(44vw,11.5rem,22dvh)] shrink-0 snap-center will-change-[transform,filter]">
            {render(item, i === centro)}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-3 px-4 text-tinta-suave">
        {/* Con mouse no se puede deslizar con el dedo: flechas (solo en PC) */}
        <Flecha lado="izq" onClick={() => mover(-1)} disabled={centro === 0} />
        <span aria-hidden className="flex gap-1.5">
          {items.map((item, i) => (
            <span key={clave(item)} className={cn('h-2 rounded-full transition-all', i === centro ? 'w-5 bg-tinta' : 'w-2 bg-tinta/25')} />
          ))}
        </span>
        <span className="flex items-center gap-1 text-base font-semibold">
          {pista}
          {pista.startsWith('Deslizá') && <ArrowRight aria-hidden className="size-4 [@media(pointer:fine)]:hidden" />}
        </span>
        <Flecha lado="der" onClick={() => mover(1)} disabled={centro === items.length - 1} />
      </div>
    </div>
  );
}

function Flecha({ lado, onClick, disabled }: { lado: 'izq' | 'der'; onClick: () => void; disabled: boolean }) {
  const Icono = lado === 'izq' ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={lado === 'izq' ? 'Ver el anterior' : 'Ver el siguiente'}
      className="juguete hidden size-11 shrink-0 place-items-center rounded-full bg-white disabled:opacity-35 [@media(pointer:fine)]:grid"
    >
      <Icono aria-hidden className="size-6" strokeWidth={2.75} />
    </button>
  );
}
