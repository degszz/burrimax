import type { IngredienteCatalogo } from '@burritos/shared';
import { Check, Minus, Plus, WheatOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImagenIngrediente } from './ImagenIngrediente';

interface Props {
  ingrediente: IngredienteCatalogo;
  /** Porciones (carne) o 0/1 (el resto). */
  cantidad: number;
  /** Se llegó al máximo y esta no está elegida. */
  apagada: boolean;
  porciones: boolean;
  puedeSumar: boolean;
  prioridad?: boolean;
  onTocar: () => void;
  onSumar: () => void;
  onRestar: () => void;
}

export function TarjetaIngrediente({ ingrediente, cantidad, apagada, porciones, puedeSumar, prioridad, onTocar, onSumar, onRestar }: Props) {
  const elegida = cantidad > 0;

  const contenido = (
    <>
      {elegida && (
        <span className="absolute -top-3 -right-3 grid size-9 place-items-center rounded-full border-2 border-tinta bg-verde text-white">
          <Check className="size-5" strokeWidth={3.5} aria-hidden />
        </span>
      )}
      <ImagenIngrediente ingrediente={ingrediente} prioridad={prioridad} className="mx-auto w-[64%]" />
      <span className="mt-1 block font-heading text-lg leading-tight font-extrabold">{ingrediente.nombre}</span>
      {ingrediente.categoria === 'tortilla' && ingrediente.sinTacc && (
        <span className="mt-1 inline-flex items-center gap-1 rounded-full border-2 border-verde bg-verde-claro px-2 text-sm font-bold text-verde">
          <WheatOff className="size-4" aria-hidden /> Sin TACC
        </span>
      )}
      {!porciones && elegida && ingrediente.categoria !== 'tortilla' && (
        <span className="mt-0.5 block text-sm font-semibold text-verde">Tocá para sacar</span>
      )}
    </>
  );

  const clases = cn(
    'juguete relative flex h-full w-full flex-col items-center rounded-3xl px-2 pt-3 pb-3 text-center',
    elegida ? 'border-verde bg-verde-claro' : 'bg-white',
    apagada && 'opacity-45 grayscale',
  );

  if (!porciones) {
    return (
      <button type="button" aria-pressed={elegida} aria-disabled={apagada} onClick={() => !apagada && onTocar()} className={clases}>
        {contenido}
      </button>
    );
  }

  // Carne: la tarjeta suma una porción y el control − n + ajusta.
  return (
    <div className={clases}>
      <button
        type="button"
        aria-disabled={apagada}
        aria-label={`Sumar una porción de ${ingrediente.nombre}`}
        onClick={() => !apagada && onSumar()}
        className="block w-full flex-1"
      >
        {contenido}
      </button>
      <div className="mt-2 flex items-center justify-center gap-2" role="group" aria-label={`Porciones de ${ingrediente.nombre}`}>
        <button
          type="button"
          onClick={onRestar}
          disabled={cantidad === 0}
          aria-label={`Sacar una porción de ${ingrediente.nombre}`}
          className="juguete grid size-12 place-items-center rounded-xl bg-amarillo disabled:bg-beige disabled:opacity-60"
        >
          <Minus className="size-6" strokeWidth={3} />
        </button>
        <span aria-live="polite" className="w-6 font-heading text-2xl font-extrabold">
          {cantidad}
        </span>
        <button
          type="button"
          onClick={onSumar}
          disabled={!puedeSumar}
          aria-label={`Sumar una porción de ${ingrediente.nombre}`}
          className="juguete grid size-12 place-items-center rounded-xl bg-amarillo disabled:bg-beige disabled:opacity-60"
        >
          <Plus className="size-6" strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}
