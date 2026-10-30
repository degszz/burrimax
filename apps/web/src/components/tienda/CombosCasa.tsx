import { precioVistaPrevia, type Catalogo } from '@burritos/shared';
import { Pencil, ShoppingBag } from 'lucide-react';
import { formatoPesos } from '@/lib/formato';
import type { ComboCasa } from '@/lib/catalogo.server';
import { cn } from '@/lib/utils';
import { BurritoConPapas } from '../armador/BurritoConPapas';
import { resumenCorto } from './MisCombos';

interface Props {
  combos: ComboCasa[];
  catalogo: Catalogo;
  onAgregar: (combo: ComboCasa) => void;
  onPersonalizar: (combo: ComboCasa) => void;
}

/** Burritos armados por la casa, cada uno con papas, listos para sumar. */
export function CombosCasa({ combos, catalogo, onAgregar, onPersonalizar }: Props) {
  if (combos.length === 0) return null;

  return (
    <section id="combos-casa" aria-labelledby="titulo-combos-casa" className="scroll-mt-4 px-4 pt-6">
      <h2 id="titulo-combos-casa" className="text-3xl font-extrabold">
        Combos de la casa
      </h2>
      <p className="text-tinta-suave">Listos para pedir, con papas fritas incluidas</p>

      <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-4">
        {combos.map((combo) => {
          const tamano = catalogo.tamanos.find((t) => t.id === combo.armado.tamanoId);
          const doble = (tamano?.cantTapas ?? 1) > 1;
          return (
            <li key={combo.id} className="juguete flex flex-col overflow-hidden rounded-3xl bg-white">
              <div className="fondo-puntos relative px-2 pt-6 pb-1">
                {combo.destacado && (
                  <span className="absolute top-1.5 left-1.5 z-30 rounded-full border-2 border-tinta bg-amarillo px-2 font-heading text-xs font-extrabold">
                    Recomendado
                  </span>
                )}
                {/* La misma foto para todos (también la doble) hasta tener las específicas */}
                <BurritoConPapas doble={false} />
              </div>
              <div className="flex flex-1 flex-col p-3">
                <h3 className="text-xl leading-tight font-extrabold">{combo.nombre}</h3>
                <div className="mt-1 flex items-center justify-between gap-1">
                  <span
                    className={cn(
                      'rounded-full border-2 border-tinta px-2 font-heading text-xs font-extrabold whitespace-nowrap',
                      doble ? 'bg-rojo text-white' : 'bg-amarillo',
                    )}
                  >
                    {tamano?.nombre}
                  </span>
                  <span className="font-heading text-lg font-extrabold">{formatoPesos(precioVistaPrevia(combo.armado, catalogo))}</span>
                </div>
                <p className="mt-1.5 line-clamp-3 flex-1 text-sm text-tinta-suave">{resumenCorto(combo.armado, catalogo)}</p>
                <button
                  type="button"
                  onClick={() => onAgregar(combo)}
                  className="juguete mt-3 flex min-h-12 items-center justify-center gap-1.5 rounded-xl bg-rojo font-heading text-lg font-extrabold text-white shadow-[0_4px_0_var(--rojo-oscuro)]"
                >
                  <ShoppingBag aria-hidden className="size-5" /> Agregar
                </button>
                <button
                  type="button"
                  onClick={() => onPersonalizar(combo)}
                  className="mt-1 flex min-h-11 items-center justify-center gap-1 text-sm font-bold text-tinta-suave underline underline-offset-4"
                >
                  <Pencil aria-hidden className="size-3.5" /> Cambiarle algo
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
