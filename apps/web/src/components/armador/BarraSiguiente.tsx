import { ArrowLeft, ArrowRight, CircleAlert, Check } from 'lucide-react';
import { formatoPesos } from '@/lib/formato';

interface Props {
  precio: number;
  motivo: string | null;
  mensajeOk: string | null;
  puedeVolver: boolean;
  /** Hay algo elegido: se puede borrar todo y empezar de nuevo. */
  puedeBorrar: boolean;
  onSiguiente: () => void;
  onAnterior: () => void;
  onBorrar: () => void;
}

/** Barra fija abajo: qué falta (o qué viene) y el botón Siguiente con el precio. */
export function BarraSiguiente({ precio, motivo, mensajeOk, puedeVolver, puedeBorrar, onSiguiente, onAnterior, onBorrar }: Props) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 rounded-t-3xl border-t-[2.5px] border-tinta bg-crema px-4 pt-2 pb-[max(0.25rem,env(safe-area-inset-bottom))]">
      <p aria-live="polite" className="mb-1.5 flex min-h-6 items-center justify-center gap-1.5 text-center text-base font-bold">
        {motivo ? (
          <span className="flex items-center gap-1.5 text-rojo">
            <CircleAlert aria-hidden className="size-5" /> {motivo}
          </span>
        ) : mensajeOk ? (
          <span className="flex items-center gap-1.5 text-verde">
            <Check aria-hidden className="size-5" strokeWidth={3} /> {mensajeOk}
          </span>
        ) : null}
      </p>
      <div className="mx-auto flex max-w-md gap-3">
        {puedeVolver && (
          <button type="button" onClick={onAnterior} aria-label="Volver al paso anterior" className="juguete grid size-14 shrink-0 place-items-center rounded-2xl bg-white">
            <ArrowLeft className="size-6" strokeWidth={2.5} />
          </button>
        )}
        <button
          type="button"
          onClick={onSiguiente}
          disabled={!!motivo}
          className="juguete flex min-h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-rojo font-heading text-xl font-extrabold text-white shadow-[0_4px_0_var(--rojo-oscuro)] disabled:border-tinta/40 disabled:bg-beige disabled:text-tinta-suave disabled:shadow-[0_4px_0_rgba(43,27,18,.25)]"
        >
          Siguiente · {formatoPesos(precio)}
          {!motivo && <ArrowRight aria-hidden className="size-6" strokeWidth={2.5} />}
        </button>
      </div>
      {/* Siempre ocupa su lugar, así la barra no cambia de alto al elegir algo */}
      <div className="flex h-9 items-center justify-center">
        {puedeBorrar && (
          <button type="button" onClick={onBorrar} className="flex min-h-9 items-center px-3 text-sm font-semibold text-tinta-suave underline underline-offset-4">
            Borrar y empezar de nuevo
          </button>
        )}
      </div>
    </div>
  );
}
