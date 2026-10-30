import { ShoppingBag } from 'lucide-react';
import { MARCA } from '@/lib/marca';

interface Props {
  abierto: boolean;
  /** "Abierto · cierra 23:30", "Abrimos hoy a las 19:30"… */
  textoApertura?: string;
  cantidadEnCarrito: number;
  onAbrirCarrito: () => void;
}

export function Encabezado({ abierto, textoApertura, cantidadEnCarrito, onAbrirCarrito }: Props) {
  return (
    <header className="flex items-center gap-3 px-4 pt-4 pb-2">
      <span aria-hidden className="juguete grid size-11 shrink-0 -rotate-6 place-items-center rounded-xl bg-rojo">
        <svg viewBox="0 0 32 32" className="size-7">
          <rect x="4" y="9" width="24" height="14" rx="7" fill="#F4D9A6" stroke="#2B1B12" strokeWidth="2.5" />
          <path d="M11 9v14M17 9v14" stroke="#7BB661" strokeWidth="3" />
          <path d="M23 10.5a6.5 6.5 0 0 1 0 11" stroke="#E4572E" strokeWidth="3" fill="none" />
        </svg>
      </span>
      <div className="min-w-0 flex-1">
        {/* [A CONFIRMAR] nombre del emprendimiento: se cambia en lib/marca.ts */}
        <p className="truncate font-heading text-xl font-extrabold leading-tight">{MARCA.nombre}</p>
        <p className={`flex items-center gap-1.5 text-sm font-bold ${abierto ? 'text-verde' : 'text-rojo'}`}>
          <span aria-hidden className={`size-2.5 rounded-full ${abierto ? 'bg-verde' : 'bg-rojo'}`} />
          {textoApertura ?? (abierto ? 'Abierto ahora' : 'Cerrado ahora')}
        </p>
      </div>
      <button
        type="button"
        onClick={onAbrirCarrito}
        className="juguete relative grid size-12 place-items-center rounded-2xl bg-white"
        aria-label={`Ver tu pedido (${cantidadEnCarrito} ${cantidadEnCarrito === 1 ? 'burrito' : 'burritos'})`}
      >
        <ShoppingBag className="size-6" strokeWidth={2.5} />
        <span className="absolute -top-2.5 -right-2.5 grid min-w-6 place-items-center rounded-full border-2 border-tinta bg-amarillo px-1 font-heading text-sm font-extrabold">
          {cantidadEnCarrito}
        </span>
      </button>
    </header>
  );
}
