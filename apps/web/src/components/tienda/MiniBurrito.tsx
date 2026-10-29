import type { Armado, Catalogo } from '@burritos/shared';
import { ImagenIngrediente } from '../armador/ImagenIngrediente';

/** Miniatura: la tortilla con la primera carne encima. */
export function MiniBurrito({ armado, catalogo }: { armado: Armado; catalogo: Catalogo }) {
  const buscar = (id?: string) => (id ? catalogo.ingredientes.find((i) => i.id === id) : undefined);
  const tortilla = buscar(armado.seleccion.tortilla[0]);
  const carne = buscar(armado.seleccion.carne[0]);
  return (
    <span className="relative grid size-16 shrink-0 place-items-center">
      {tortilla ? <ImagenIngrediente ingrediente={tortilla} className="w-16 rounded-full" /> : <span className="size-16 rounded-full bg-panel" />}
      {carne && <ImagenIngrediente ingrediente={carne} className="absolute w-9" />}
    </span>
  );
}
