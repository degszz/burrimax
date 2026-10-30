import { useState } from 'react';
import { TIENDA } from '@/lib/catalogo';

/** Foto del ingrediente (vive en la tienda) o, si no hay, un círculo de su color. */
export function FotoIngrediente({ imagen, color, className = 'size-12' }: { imagen: string | null; color?: string | null; className?: string }) {
  const [falla, setFalla] = useState(false);
  if (!imagen || falla) {
    return <span aria-hidden className={`${className} shrink-0 rounded-full border-2 border-zinc-300`} style={{ backgroundColor: color ?? '#e4e4e7' }} />;
  }
  return <img src={`${TIENDA}${imagen}`} alt="" loading="lazy" onError={() => setFalla(true)} className={`${className} shrink-0 rounded-lg bg-zinc-50 object-contain`} />;
}
