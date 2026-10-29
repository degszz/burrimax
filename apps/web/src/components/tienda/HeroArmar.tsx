import { ArrowDown, ChefHat } from 'lucide-react';
import { formatoPesos } from '@/lib/formato';
import { BurritoConPapas } from '../armador/BurritoConPapas';

interface Props {
  precioDesde: number;
  /** Hay un burrito a medio armar guardado en el celular. */
  enCurso: boolean;
  onArmar: () => void;
}

/** Portada: invita a armar el propio, pero no obliga: abajo están los de la casa. */
export function HeroArmar({ precioDesde, enCurso, onArmar }: Props) {
  return (
    <section aria-labelledby="titulo-hero" className="px-4">
      <div className="juguete fondo-puntos relative overflow-hidden rounded-3xl px-4 pt-5 pb-5">
        <span className="juguete mb-2 inline-flex -rotate-2 items-center gap-1.5 rounded-xl bg-amarillo px-2.5 py-1 font-heading font-extrabold">
          <span aria-hidden>🍟</span> Papas fritas incluidas
        </span>
        <h1 id="titulo-hero" className="text-4xl font-extrabold">
          Armá tu burrito
        </h1>
        <p className="mt-1 max-w-[26ch] text-lg text-tinta-suave">Elegí tortilla, salsas, carne y vegetales. Lo ves armarse en vivo.</p>
        <BurritoConPapas doble={false} className="my-2" />
        <button
          type="button"
          onClick={onArmar}
          className="juguete flex min-h-16 w-full items-center justify-center gap-2 rounded-2xl bg-rojo font-heading text-2xl font-extrabold text-white shadow-[0_4px_0_var(--rojo-oscuro)]"
        >
          <ChefHat aria-hidden className="size-7" strokeWidth={2.5} />
          {enCurso ? 'Seguir armando el mío' : 'Armar el mío'}
        </button>
        <p className="mt-2 text-center text-base font-semibold text-tinta-suave">Desde {formatoPesos(precioDesde)}</p>
      </div>
      <a href="#combos-casa" className="mt-3 flex min-h-12 items-center justify-center gap-1.5 font-bold text-tinta-suave underline underline-offset-4">
        o elegí uno de la casa <ArrowDown aria-hidden className="size-4" />
      </a>
    </section>
  );
}
