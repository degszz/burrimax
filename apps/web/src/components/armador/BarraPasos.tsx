import { Check } from 'lucide-react';
import { Fragment } from 'react';
import type { Paso } from '@/lib/armador/reglas';
import { cn } from '@/lib/utils';

const NOMBRES: Record<Paso, string> = { 1: 'Tortilla', 2: 'Salsas', 3: 'Carne', 4: 'Vegetales', 5: '¡Listo!' };
const PASOS: Paso[] = [1, 2, 3, 4, 5];

interface Props {
  actual: Paso;
  /** Hasta qué paso se puede saltar tocando la barra. */
  alcanzable: Paso;
  onIr: (paso: Paso) => void;
}

export function BarraPasos({ actual, alcanzable, onIr }: Props) {
  return (
    <nav aria-label="Pasos del armado" className="px-4">
      <ol className="flex items-center">
        {PASOS.map((paso, i) => {
          const hecho = paso < actual;
          const esActual = paso === actual;
          return (
            <Fragment key={paso}>
              {i > 0 && <li aria-hidden className={cn('h-0.5 min-w-2 flex-1', paso <= actual ? 'bg-verde' : 'bg-tinta/25')} />}
              <li className="shrink-0">
                <button
                  type="button"
                  disabled={paso > alcanzable || esActual}
                  onClick={() => onIr(paso)}
                  aria-current={esActual ? 'step' : undefined}
                  aria-label={`Paso ${paso}: ${NOMBRES[paso]}${hecho ? ' (hecho)' : ''}`}
                  className={cn(
                    'flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-full border-2 font-heading font-extrabold',
                    esActual && 'animate-latido border-tinta bg-tinta pr-4 pl-1.5 text-white',
                    hecho && 'border-verde bg-verde-claro text-verde',
                    !esActual && !hecho && 'border-tinta/40 bg-white text-tinta',
                  )}
                >
                  {hecho ? (
                    <Check className="size-5" strokeWidth={3} />
                  ) : esActual ? (
                    <>
                      <span className="grid size-8 place-items-center rounded-full bg-amarillo text-tinta">{paso}</span>
                      <span className="text-base">{NOMBRES[paso]}</span>
                    </>
                  ) : (
                    paso
                  )}
                </button>
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
