import { Box } from 'lucide-react';
import { useState } from 'react';
import type { ModeloSubido } from '@/lib/catalogo.server';
import { cn } from '@/lib/utils';
import { VerEnMiMesa3D } from '../armador/VerEnMiMesa3D';

/**
 * "Verlo en 3D" en Combos de la casa: abre el burrito que Max subió en el
 * admin (uno para todos los combos) con el mismo visor del último paso del
 * armador: girarlo, acercarlo y ponerlo en la mesa en tamaño real.
 */
export function BotonVer3D({ modelo, className }: { modelo: ModeloSubido; className?: string }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className={cn('juguete flex min-h-12 items-center gap-2 rounded-full bg-white px-4 font-heading text-base font-extrabold', className)}
      >
        <Box aria-hidden className="size-5" strokeWidth={2.5} /> Verlo en 3D
      </button>
      {abierto && <VerEnMiMesa3D modelo={{ ...modelo, tamano: 'generico' }} pedido="simple" onCerrar={() => setAbierto(false)} />}
    </>
  );
}
