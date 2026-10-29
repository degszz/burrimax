import type { IngredienteCatalogo } from '@burritos/shared';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface Props {
  ingrediente: Pick<IngredienteCatalogo, 'nombre' | 'imagenUrl' | 'colorHex'>;
  className?: string;
  /** Las del primer paso se cargan de una; el resto, cuando hacen falta. */
  prioridad?: boolean;
}

/**
 * Muestra el .avif del ingrediente. Si todavía no está, prueba el .svg
 * provisorio con el mismo nombre, y si tampoco, un círculo de color.
 */
export function ImagenIngrediente({ ingrediente, className, prioridad = false }: Props) {
  const [intento, setIntento] = useState<'avif' | 'svg' | 'ninguno'>(ingrediente.imagenUrl ? 'avif' : 'ninguno');

  if (intento === 'ninguno' || !ingrediente.imagenUrl) {
    return (
      <span
        aria-hidden
        className={cn('grid aspect-square place-items-center rounded-full border-2 border-tinta font-heading text-2xl', className)}
        style={{ backgroundColor: ingrediente.colorHex ?? 'var(--panel)' }}
      >
        {ingrediente.nombre.charAt(0)}
      </span>
    );
  }

  const src = intento === 'avif' ? ingrediente.imagenUrl : ingrediente.imagenUrl.replace(/\.avif$/, '.svg');
  return (
    <img
      src={src}
      alt=""
      draggable={false}
      loading={prioridad ? 'eager' : 'lazy'}
      decoding="async"
      className={cn('aspect-square object-contain select-none', className)}
      onError={() => setIntento(intento === 'avif' ? 'svg' : 'ninguno')}
    />
  );
}
