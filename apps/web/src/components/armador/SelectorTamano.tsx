import type { TamanoCatalogo } from '@burritos/shared';
import { cn } from '@/lib/utils';

interface Props {
  tamanos: TamanoCatalogo[];
  elegidoId: string | null;
  onElegir: (tamano: TamanoCatalogo) => void;
}

export function SelectorTamano({ tamanos, elegidoId, onElegir }: Props) {
  return (
    <div role="radiogroup" aria-label="Tamaño del burrito" className="grid grid-cols-2 gap-3 px-4">
      {tamanos.map((tamano) => {
        const elegido = tamano.id === elegidoId;
        return (
          <button
            key={tamano.id}
            type="button"
            role="radio"
            aria-checked={elegido}
            onClick={() => onElegir(tamano)}
            className={cn('juguete min-h-14 rounded-2xl px-2 py-1.5 text-center', elegido ? 'bg-amarillo' : 'bg-white')}
          >
            <span className="block font-heading text-xl font-extrabold leading-tight">{tamano.nombre}</span>
            <span className="block text-sm font-semibold text-tinta-suave">
              {tamano.minimos.carne} carnes · {tamano.maximos.vegetal} verd.
            </span>
          </button>
        );
      })}
    </div>
  );
}
