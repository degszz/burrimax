import { precioVistaPrevia, type Armado, type Catalogo } from '@burritos/shared';
import { ChevronDown, Pencil, ShoppingBag, Sparkles } from 'lucide-react';
import { formatoPesos } from '@/lib/formato';
import type { ComboCasa } from '@/lib/catalogo.server';
import { cn } from '@/lib/utils';
import { BurritoConPapas } from '../armador/BurritoConPapas';
import { resumenCorto } from './MisCombos';

interface Props {
  combos: ComboCasa[];
  catalogo: Catalogo;
  /** El último burrito que armó la persona (aunque no lo haya guardado). */
  tuBurrito: Armado | null;
  /** Cuántos combos tiene guardados en el celular. */
  guardados: number;
  guardadosAbiertos: boolean;
  onAgregar: (armado: Armado, nombre: string) => void;
  onPersonalizar: (armado: Armado) => void;
  onVerGuardados: () => void;
}

/**
 * Grilla de burritos listos para pedir. Si la persona ya armó uno, va primero
 * y bien marcado como suyo; después los recomendados de la casa.
 */
export function CombosCasa({ combos, catalogo, tuBurrito, guardados, guardadosAbiertos, onAgregar, onPersonalizar, onVerGuardados }: Props) {
  if (combos.length === 0 && !tuBurrito) return null;

  // Recomendados primero, después el resto en su orden.
  const ordenados = [...combos].sort((a, b) => Number(b.destacado) - Number(a.destacado));

  return (
    <section id="combos-casa" aria-labelledby="titulo-combos-casa" className="scroll-mt-4 px-4 pt-6">
      <h2 id="titulo-combos-casa" className="text-3xl font-extrabold">
        Combos de la casa
      </h2>
      <p className="text-tinta-suave">Listos para pedir, con papas fritas incluidas</p>

      <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-5 lg:gap-y-6">
        {tuBurrito && (
          <Tarjeta
            armado={tuBurrito}
            nombre={tuBurrito.nombrePersonalizado ?? 'Tu burrito'}
            catalogo={catalogo}
            tuyo
            onAgregar={onAgregar}
            onPersonalizar={onPersonalizar}
            textoCambiar="Editarlo"
          />
        )}
        {ordenados.map((combo) => (
          <Tarjeta
            key={combo.id}
            armado={combo.armado}
            nombre={combo.nombre}
            catalogo={catalogo}
            recomendado={combo.destacado}
            onAgregar={onAgregar}
            onPersonalizar={onPersonalizar}
            textoCambiar="Cambiarle algo"
          />
        ))}
      </ul>

      {guardados > 0 && (
        <button
          type="button"
          onClick={onVerGuardados}
          aria-expanded={guardadosAbiertos}
          className="mx-auto mt-4 flex min-h-12 items-center gap-1.5 rounded-full border-[2.5px] border-dashed border-tinta px-5 font-bold"
        >
          {guardadosAbiertos ? 'Ocultar' : 'Ver'} tus combos guardados ({guardados})
          <ChevronDown aria-hidden className={cn('size-5 transition-transform', guardadosAbiertos && 'rotate-180')} />
        </button>
      )}
    </section>
  );
}

interface TarjetaProps {
  armado: Armado;
  nombre: string;
  catalogo: Catalogo;
  tuyo?: boolean;
  recomendado?: boolean;
  textoCambiar: string;
  onAgregar: (armado: Armado, nombre: string) => void;
  onPersonalizar: (armado: Armado) => void;
}

function Tarjeta({ armado, nombre, catalogo, tuyo, recomendado, textoCambiar, onAgregar, onPersonalizar }: TarjetaProps) {
  const tamano = catalogo.tamanos.find((t) => t.id === armado.tamanoId);
  const doble = (tamano?.cantTapas ?? 1) > 1;

  return (
    <li
      className={cn(
        'juguete flex flex-col overflow-hidden rounded-3xl',
        // El tuyo: borde verde que se va degradando hacia la tarjeta
        tuyo ? 'border-verde bg-gradient-to-b from-verde-claro via-white to-white shadow-[0_4px_0_var(--verde)]' : 'bg-white',
      )}
    >
      <div className={cn('relative px-2 pt-7 pb-1', tuyo ? 'bg-gradient-to-b from-verde/25 to-transparent' : 'fondo-puntos')}>
        {tuyo ? (
          <span className="absolute top-1.5 left-1.5 z-30 flex items-center gap-1 rounded-full border-2 border-tinta bg-verde px-2 font-heading text-xs font-extrabold text-white">
            <Sparkles aria-hidden className="size-3.5" /> Tu burrito
          </span>
        ) : (
          recomendado && (
            <span className="absolute top-1.5 left-1.5 z-30 rounded-full border-2 border-tinta bg-amarillo px-2 font-heading text-xs font-extrabold">
              Recomendado
            </span>
          )
        )}
        {/* La misma foto para todos (también la doble) hasta tener las específicas */}
        <BurritoConPapas doble={false} />
      </div>
      <div className="flex flex-1 flex-col p-3">
        <h3 className="text-xl leading-tight font-extrabold">{nombre}</h3>
        <div className="mt-1 flex items-center justify-between gap-1">
          <span
            className={cn(
              'rounded-full border-2 border-tinta px-2 font-heading text-xs font-extrabold whitespace-nowrap',
              doble ? 'bg-rojo text-white' : 'bg-amarillo',
            )}
          >
            {tamano?.nombre}
          </span>
          <span className="font-heading text-lg font-extrabold">{formatoPesos(precioVistaPrevia(armado, catalogo))}</span>
        </div>
        <p className="mt-1.5 line-clamp-3 flex-1 text-sm text-tinta-suave">{resumenCorto(armado, catalogo)}</p>
        <button
          type="button"
          onClick={() => onAgregar(armado, nombre)}
          className="juguete mt-3 flex min-h-12 items-center justify-center gap-1.5 rounded-xl bg-rojo font-heading text-lg font-extrabold text-white shadow-[0_4px_0_var(--rojo-oscuro)]"
        >
          <ShoppingBag aria-hidden className="size-5" /> Agregar
        </button>
        <button
          type="button"
          onClick={() => onPersonalizar(armado)}
          className="mt-1 flex min-h-11 items-center justify-center gap-1 text-sm font-bold text-tinta-suave underline underline-offset-4"
        >
          <Pencil aria-hidden className="size-3.5" /> {textoCambiar}
        </button>
      </div>
    </li>
  );
}
