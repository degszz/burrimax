import { precioVistaPrevia, type Armado, type Catalogo } from '@burritos/shared';
import { ArrowUp, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import { describir } from '@/lib/armador/reglas';
import { formatoPesos } from '@/lib/formato';
import type { ComboGuardado } from '@/lib/misCombos';
import { cn } from '@/lib/utils';
import { MiniBurrito } from './MiniBurrito';

interface Props {
  combos: ComboGuardado[];
  catalogo: Catalogo;
  onPedir: (combo: ComboGuardado) => void;
  onEditar: (combo: ComboGuardado) => void;
  onBorrar: (combo: ComboGuardado) => void;
  onVolverArriba: () => void;
}

export function resumenCorto(armado: Armado, catalogo: Catalogo): string {
  return [armado.seleccion.tortilla, armado.seleccion.carne, armado.seleccion.salsa, armado.seleccion.vegetal]
    .map((ids) => describir(ids, catalogo))
    .filter(Boolean)
    .join(' · ');
}

export function MisCombos({ combos, catalogo, onPedir, onEditar, onBorrar, onVolverArriba }: Props) {
  if (combos.length === 0) return null;

  return (
    <section id="mis-combos" aria-labelledby="titulo-mis-combos" className="px-4 pt-10 pb-6">
      <button
        type="button"
        onClick={onVolverArriba}
        className="mx-auto mb-6 flex min-h-12 items-center gap-2 rounded-full border-[2.5px] border-dashed border-tinta px-5 font-bold"
      >
        <ArrowUp aria-hidden className="size-5" /> Volver a armar mi burrito
      </button>
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 id="titulo-mis-combos" className="text-3xl font-extrabold">
            Mis combos
          </h2>
          <p className="text-tinta-suave">Guardados en este celular</p>
        </div>
        <span className="grid size-10 place-items-center rounded-full border-2 border-tinta bg-amarillo font-heading text-lg font-extrabold">
          {combos.length}
        </span>
      </div>

      <ul className="space-y-4">
        {combos.map((combo) => {
          const tamano = catalogo.tamanos.find((t) => t.id === combo.armado.tamanoId);
          return (
            <li key={combo.id} className="juguete rounded-3xl bg-white p-4">
              <div className="flex gap-3">
                <MiniBurrito armado={combo.armado} catalogo={catalogo} />
                <div className="min-w-0">
                  <h3 className="truncate text-2xl font-extrabold">{combo.nombre}</h3>
                  <p className="mt-1 flex items-center gap-2">
                    <span
                      className={cn(
                        'rounded-full border-2 border-tinta px-2.5 font-heading font-extrabold',
                        (tamano?.cantTapas ?? 1) > 1 ? 'bg-rojo text-white' : 'bg-amarillo',
                      )}
                    >
                      {tamano?.nombre ?? 'Tamaño no disponible'}
                    </span>
                    <span className="font-heading text-xl font-extrabold">{formatoPesos(precioVistaPrevia(combo.armado, catalogo))}</span>
                  </p>
                </div>
              </div>
              <p className="mt-2 text-tinta-suave">{resumenCorto(combo.armado, catalogo)}</p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => onPedir(combo)}
                  className="juguete flex min-h-12 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-rojo px-2 font-heading text-base font-extrabold whitespace-nowrap text-white shadow-[0_4px_0_var(--rojo-oscuro)]"
                >
                  <RotateCcw aria-hidden className="size-5" /> Pedir de nuevo
                </button>
                <button
                  type="button"
                  onClick={() => onEditar(combo)}
                  className="juguete flex min-h-12 items-center gap-1.5 rounded-2xl bg-white px-3 font-heading text-base font-extrabold"
                >
                  <Pencil aria-hidden className="size-4" /> Editar
                </button>
                <button
                  type="button"
                  onClick={() => onBorrar(combo)}
                  aria-label={`Borrar ${combo.nombre}`}
                  className="juguete grid size-12 place-items-center rounded-2xl bg-white text-rojo"
                >
                  <Trash2 className="size-5" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
