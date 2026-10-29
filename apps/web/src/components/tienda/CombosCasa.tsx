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

      <ul className="mt-4 space-y-4">
        {combos.map((combo) => {
          const tamano = catalogo.tamanos.find((t) => t.id === combo.armado.tamanoId);
          const doble = (tamano?.cantTapas ?? 1) > 1;
          const tortilla = catalogo.ingredientes.find((i) => i.id === combo.armado.seleccion.tortilla[0]);
          return (
            <li key={combo.id} className="juguete overflow-hidden rounded-3xl bg-white">
              <div className="fondo-puntos relative px-4 pt-3 pb-1">
                {combo.destacado && (
                  <span className="absolute top-3 left-3 z-30 rounded-full border-2 border-tinta bg-amarillo px-2.5 font-heading font-extrabold">
                    Recomendado
                  </span>
                )}
                <BurritoConPapas doble={doble} tortilla={tortilla?.slug} className="max-w-[16rem]" />
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-2xl font-extrabold">{combo.nombre}</h3>
                  <span className="font-heading text-2xl font-extrabold">{formatoPesos(precioVistaPrevia(combo.armado, catalogo))}</span>
                </div>
                <span
                  className={cn(
                    'mt-1 inline-block rounded-full border-2 border-tinta px-2.5 font-heading font-extrabold',
                    doble ? 'bg-rojo text-white' : 'bg-amarillo',
                  )}
                >
                  {tamano?.nombre}
                </span>
                <p className="mt-2 text-tinta-suave">{resumenCorto(combo.armado, catalogo)}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => onAgregar(combo)}
                    className="juguete flex min-h-12 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-rojo px-2 font-heading text-lg font-extrabold whitespace-nowrap text-white shadow-[0_4px_0_var(--rojo-oscuro)]"
                  >
                    <ShoppingBag aria-hidden className="size-5" /> Agregar
                  </button>
                  <button
                    type="button"
                    onClick={() => onPersonalizar(combo)}
                    className="juguete flex min-h-12 items-center gap-1.5 rounded-2xl bg-white px-3 font-heading text-base font-extrabold"
                  >
                    <Pencil aria-hidden className="size-4" /> Cambiarle algo
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
