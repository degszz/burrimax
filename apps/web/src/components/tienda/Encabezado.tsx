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
      {/* Logo de la marca (public/logo.webp, fondo transparente) */}
      <img src="/logo.webp" alt="" width={1520} height={860} className="h-11 w-auto shrink-0" />

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
