import { contarRelleno, maximoRelleno, precioVistaPrevia, type Armado, type Catalogo } from '@burritos/shared';
import { ChevronUp } from 'lucide-react';
import { formatoPesos } from '@/lib/formato';
import { cn } from '@/lib/utils';
import { PlatoArmado, esDobleTapa } from './Escenario';

interface Props {
  visible: boolean;
  armado: Armado;
  catalogo: Catalogo;
  onVer: () => void;
  /** Como encabezado del armador: siempre a la vista, arriba de todo. */
  encabezado?: boolean;
}

/**
 * Franja con el pedido en curso: el plato en miniatura, el relleno, las salsas
 * y el precio. En el armador es el encabezado (la flecha vuelve a los combos).
 */
export function ResumenFlotante({ visible, armado, catalogo, onVer, encabezado = false }: Props) {
  const tamano = catalogo.tamanos.find((t) => t.id === armado.tamanoId);
  const doble = esDobleTapa(armado, catalogo);
  const salsas = armado.seleccion.salsa.length;
  const precio = precioVistaPrevia(armado, catalogo);

  return (
    <button
      type="button"
      onClick={onVer}
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      aria-label={encabezado ? 'Volver a los combos' : 'Ver tu burrito'}
      className={cn(
        'inset-x-0 top-0 z-50 border-b-[2.5px] border-tinta bg-crema/95 backdrop-blur',
        encabezado
          ? 'sticky w-full'
          : cn('fixed transition-transform duration-200 motion-reduce:transition-none', visible ? 'translate-y-0' : '-translate-y-full'),
      )}
    >
      <span className="mx-auto flex max-w-md items-center gap-3 px-4 py-2 lg:max-w-6xl lg:px-6">
        {/* El mismo plato del armador, en chiquito: redondo (simple) u ovalado (doble) */}
        <span aria-hidden className={cn('relative block shrink-0', doble ? 'h-14 w-24' : 'size-14')}>
          <PlatoArmado armado={armado} catalogo={catalogo} mini />
        </span>
        <span className="min-w-0 flex-1 text-left">
          <span className="block font-heading text-lg leading-tight font-extrabold">
            Relleno {contarRelleno(armado)}/{tamano ? maximoRelleno(tamano) : 0}
          </span>
          <span className="block truncate text-sm font-semibold text-tinta-suave">
            Salsas {salsas}/{tamano?.maximos.salsa ?? 0} · {tamano?.nombre}
          </span>
        </span>
        {/* key: el precio late cada vez que cambia */}
        <span key={precio} className="animate-latido font-heading text-xl font-extrabold">
          {formatoPesos(precio)}
        </span>
        <ChevronUp aria-hidden className="size-6 shrink-0" strokeWidth={2.5} />
      </span>
    </button>
  );
}
