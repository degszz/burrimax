import { useState } from 'react';
import { cn } from '@/lib/utils';

interface Props {
  doble: boolean;
  /** Slug de la tortilla elegida (`tortilla-maiz`, `tortilla-trigo`…). */
  tortilla?: string;
  className?: string;
}

const BASE = '/armador/burrito-cerrado';

/**
 * El burrito cerrado con sus papas: cualquier combinación termina así.
 * Busca primero la foto específica (doble y/o maíz) y, si todavía no existe,
 * usa la misma foto base para todos (pedido de Max, hasta tener las fotos).
 */
export function BurritoConPapas({ doble, tortilla, className }: Props) {
  const maiz = tortilla === 'tortilla-maiz';
  const candidatos = [
    doble && maiz && `${BASE}-doble-maiz.avif`,
    doble && `${BASE}-doble.avif`,
    maiz && `${BASE}-maiz.avif`,
    `${BASE}.avif`,
  ].filter((c): c is string => !!c);

  const [indice, setIndice] = useState(0);
  const src = candidatos[Math.min(indice, candidatos.length - 1)]!;

  return (
    <div className={cn('relative mx-auto flex w-full max-w-sm items-end justify-center', className)}>
      <img
        key={src}
        src={src}
        alt=""
        decoding="async"
        draggable={false}
        onError={() => setIndice((i) => i + 1)}
        className="relative z-10 w-[64%] -rotate-6 drop-shadow-[0_10px_10px_rgba(43,27,18,.28)]"
      />
      <img
        src="/armador/papas.avif"
        alt=""
        decoding="async"
        draggable={false}
        className="relative z-20 -ml-[10%] w-[30%] drop-shadow-[0_8px_8px_rgba(43,27,18,.25)]"
      />
      <span className="sr-only">
        Tu burrito {doble ? 'doble tapa' : 'simple'} cerrado, con papas fritas
      </span>
    </div>
  );
}
