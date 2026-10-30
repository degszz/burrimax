import { contarRelleno, maximoRelleno, precioVistaPrevia, type Armado, type Catalogo } from '@burritos/shared';
import { ChevronUp } from 'lucide-react';
import { formatoPesos } from '@/lib/formato';
import { cn } from '@/lib/utils';
import { ImagenIngrediente } from './ImagenIngrediente';

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
  const buscar = (id?: string) => (id ? catalogo.ingredientes.find((i) => i.id === id) : undefined);
  const tortilla = buscar(armado.seleccion.tortilla[0]);
  // Sin tortilla no se muestra el relleno (queda guardado para cuando elija una).
  const encima = (tortilla ? [...armado.seleccion.carne, ...armado.seleccion.vegetal] : [])
    .filter((id, i, todos) => todos.indexOf(id) === i)
    .slice(-4)
    .map(buscar)
    .filter((i) => !!i);
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
        <span className="relative grid size-14 shrink-0 place-items-center rounded-full border-2 border-tinta bg-white">
          {tortilla ? (
            <ImagenIngrediente ingrediente={tortilla} className="w-12 rounded-full" />
          ) : (
            <span className="size-12 rounded-full border-2 border-dashed border-tinta/40" />
          )}
          {encima.map((ingrediente, i) => (
            // de a dos por fila sobre la tortilla
            <span key={ingrediente!.id} className="absolute w-6" style={{ left: 8 + (i % 2) * 18, top: 8 + Math.floor(i / 2) * 18 }}>
              <ImagenIngrediente ingrediente={ingrediente!} className="w-full" />
            </span>
          ))}
        </span>
        <span className="min-w-0 flex-1 text-left">
          <span className="block font-heading text-lg leading-tight font-extrabold">
            Relleno {contarRelleno(armado)}/{tamano ? maximoRelleno(tamano) : 0}
          </span>
          <span className="block text-sm font-semibold text-tinta-suave">
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
