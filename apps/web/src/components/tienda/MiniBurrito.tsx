import type { Armado, Catalogo } from '@burritos/shared';

/** Miniatura del combo: la misma foto del burrito cerrado para todos (por ahora). */
export function MiniBurrito(_: { armado: Armado; catalogo: Catalogo }) {
  return (
    <span className="grid size-16 shrink-0 place-items-center rounded-2xl border-2 border-tinta bg-panel">
      <img src="/armador/burrito-cerrado.avif" alt="" decoding="async" loading="lazy" className="w-14 -rotate-12" />
    </span>
  );
}
