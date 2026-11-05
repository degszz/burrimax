import type { IngredienteCatalogo } from '@burritos/shared';
import { Check, Minus } from 'lucide-react';
import { useLatido } from '@/lib/useLatido';
import { cn } from '@/lib/utils';
import { ImagenIngrediente } from './ImagenIngrediente';

export interface LadoSelector {
  ingrediente: IngredienteCatalogo;
  /** Porciones (carne) o 0/1 (tortilla). */
  cantidad: number;
  /** Se llegó al máximo y este lado no está elegido. */
  apagado: boolean;
  /** Elegir (tortilla) o sumar una porción (carne). */
  onTocar: () => void;
  onRestar: () => void;
}

interface Props {
  lados: [LadoSelector, LadoSelector];
  /** Carne: cada toque suma una porción y aparece el "−". */
  porciones: boolean;
  puedeSumar: boolean;
  etiqueta: string;
  /** Avisa qué lado se tocó, para centrarlo en el carrusel. */
  onEnfocar: (indice: number) => void;
}

/**
 * Cuando el paso tiene solo 2 opciones (tortilla, carne), una pastilla
 * partida en dos debajo del carrusel: se elige de un toque, sin deslizar.
 * Es la forma más directa para quien no se lleva bien con el carrusel.
 */
export function SelectorDosLados({ lados, porciones, puedeSumar, etiqueta, onEnfocar }: Props) {
  return (
    <div role="group" aria-label={`${etiqueta}: elegí de un toque`} className="mx-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1.5">
      {lados.map((lado, i) => [
        // La "o" del medio: son dos caminos
        i === 1 && (
          <span
            key="o"
            aria-hidden
            className="grid size-7 place-items-center rounded-full border-[2.5px] border-tinta bg-amarillo font-heading text-sm leading-none font-extrabold"
          >
            o
          </span>
        ),
        <Lado
          key={lado.ingrediente.id}
          lado={lado}
          porciones={porciones}
          puedeSumar={puedeSumar}
          onTocar={() => {
            onEnfocar(i);
            if (!lado.apagado && (!porciones || puedeSumar)) lado.onTocar();
          }}
        />,
      ])}
    </div>
  );
}

function Lado({ lado, porciones, puedeSumar, onTocar }: { lado: LadoSelector; porciones: boolean; puedeSumar: boolean; onTocar: () => void }) {
  const { ingrediente, cantidad, apagado } = lado;
  const elegido = cantidad > 0;
  const latido = useLatido<HTMLDivElement>(cantidad, 'animate-pop');
  const sumable = porciones ? puedeSumar && !apagado : !apagado;

  const estado = porciones
    ? elegido
      ? `× ${cantidad}`
      : 'Sumar porción'
    : elegido
      ? '✓ Elegida'
      : 'Elegir';

  return (
    <div
      ref={latido}
      className={cn(
        'juguete relative flex min-h-14 items-stretch overflow-hidden rounded-2xl transition-colors [@media(max-height:720px)]:min-h-12',
        elegido ? 'border-verde bg-verde-claro' : 'bg-white',
        apagado && 'opacity-45 grayscale',
      )}
    >
      <button
        type="button"
        onClick={onTocar}
        aria-pressed={porciones ? undefined : elegido}
        aria-disabled={!sumable}
        aria-label={porciones ? `Sumar una porción de ${ingrediente.nombre}` : ingrediente.nombre}
        className="flex min-w-0 flex-1 items-center gap-2 py-1 pr-1 pl-1.5 text-left"
      >
        <span className="relative shrink-0">
          <ImagenIngrediente ingrediente={ingrediente} prioridad className="size-10 [@media(max-height:720px)]:size-8" />
          {elegido && (
            <span className="animate-sello absolute -top-1.5 -left-1.5 grid size-5 place-items-center rounded-full border-2 border-tinta bg-verde text-white">
              {porciones ? (
                <span className="font-heading text-[0.7rem] leading-none font-extrabold">{cantidad}</span>
              ) : (
                <Check className="size-3" strokeWidth={4} aria-hidden />
              )}
            </span>
          )}
        </span>
        <span className="min-w-0">
          <span className="line-clamp-2 block font-heading text-base leading-tight font-extrabold">{ingrediente.nombre}</span>
          <span aria-live="polite" className={cn('block truncate text-xs font-bold', elegido ? 'text-verde' : 'text-tinta-suave')}>
            {estado}
          </span>
        </span>
      </button>
      {porciones && elegido && (
        <button
          type="button"
          onClick={lado.onRestar}
          aria-label={`Sacar una porción de ${ingrediente.nombre}`}
          className="grid w-11 shrink-0 place-items-center border-l-2 border-tinta/20 bg-amarillo/70 active:bg-amarillo"
        >
          <Minus className="size-5" strokeWidth={3} aria-hidden />
        </button>
      )}
    </div>
  );
}
