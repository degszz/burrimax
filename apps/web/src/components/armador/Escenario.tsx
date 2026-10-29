import { contarRelleno, maximoRelleno, type Armado, type Catalogo, type IngredienteCatalogo } from '@burritos/shared';
import { Smile } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImagenIngrediente } from './ImagenIngrediente';

interface Props {
  armado: Armado;
  catalogo: Catalogo;
}

// Posiciones (en % del plato) para que nada se tape: carnes al centro,
// vegetales en ronda alrededor.
const LUGARES_CARNE = [
  [50, 46],
  [40, 56],
  [60, 56],
  [50, 64],
] as const;
const LUGARES_VEGETAL = [
  [27, 38],
  [73, 38],
  [24, 62],
  [76, 62],
  [38, 78],
  [62, 78],
] as const;

export function Escenario({ armado, catalogo }: Props) {
  const tamano = catalogo.tamanos.find((t) => t.id === armado.tamanoId);
  const buscar = (id: string) => catalogo.ingredientes.find((i) => i.id === id);
  const tortilla = armado.seleccion.tortilla[0] ? buscar(armado.seleccion.tortilla[0]) : undefined;
  const salsas = armado.seleccion.salsa.map(buscar).filter((i): i is IngredienteCatalogo => !!i);
  const relleno = contarRelleno(armado);
  const maximo = tamano ? maximoRelleno(tamano) : 0;
  const doble = (tamano?.cantTapas ?? 1) > 1;

  return (
    <section aria-label="Tu burrito" className="px-4">
      <div className="juguete fondo-puntos relative overflow-hidden rounded-3xl" style={{ aspectRatio: '16 / 10.5' }}>
        {/* Contador de relleno */}
        <div className="absolute top-3 left-3 z-20 rounded-2xl border-2 border-tinta bg-white px-3 py-1.5">
          <p className="font-heading text-lg leading-none font-extrabold">
            Relleno {relleno}/{maximo}
          </p>
          <div aria-hidden className="mt-1.5 flex gap-1">
            {Array.from({ length: maximo }, (_, i) => (
              <span key={i} className={cn('h-1.5 w-3 rounded-full', i < relleno ? 'bg-rojo' : 'bg-beige')} />
            ))}
          </div>
        </div>

        {/* Plato con la tortilla */}
        <div className="absolute top-1/2 left-1/2 aspect-square h-[92%] -translate-x-1/2 -translate-y-1/2">
          <div className="absolute inset-0 rounded-full border-[3px] border-tinta bg-white shadow-[0_5px_0_var(--tinta)]" />

          {tortilla ? (
            <>
              {doble && (
                <ImagenIngrediente
                  ingrediente={tortilla}
                  prioridad
                  className="absolute top-[8%] left-[14%] w-[80%] rounded-full opacity-90"
                />
              )}
              <ImagenIngrediente
                ingrediente={tortilla}
                prioridad
                className={cn('absolute w-[84%] rounded-full', doble ? 'top-[6%] left-[4%]' : 'top-[8%] left-[8%]')}
              />
            </>
          ) : (
            <div className="absolute inset-[9%] grid place-items-center rounded-full border-[3px] border-dashed border-tinta/45 text-center">
              <div>
                <Smile aria-hidden className="mx-auto size-9 text-tinta/70" />
                <p className="mt-1 font-heading text-lg leading-tight font-bold text-tinta/80">
                  Acá se arma
                  <br />
                  tu burrito
                </p>
              </div>
            </div>
          )}

          {/* Salsas: chorritos ondulados */}
          <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 z-10" aria-hidden>
            {salsas.map((salsa, i) => {
              const y = 40 + i * 18;
              const d = `M18 ${y} q8 -8 16 0 t16 0 t16 0 t16 0`;
              return (
                <g key={salsa.id} className="animate-aparecer">
                  <path d={d} fill="none" stroke="#2B1B12" strokeWidth="6.5" strokeLinecap="round" />
                  <path d={d} fill="none" stroke={salsa.colorHex ?? '#E4572E'} strokeWidth="4" strokeLinecap="round" />
                </g>
              );
            })}
          </svg>

          {/* Carnes al centro, vegetales alrededor */}
          {armado.seleccion.carne.map((id, i) => {
            const carne = buscar(id);
            const lugar = LUGARES_CARNE[i % LUGARES_CARNE.length]!;
            return carne ? (
              <span
                key={`${id}-${i}`}
                className="animate-caer absolute z-[11] w-[26%]"
                style={{ left: `${lugar[0]}%`, top: `${lugar[1]}%`, transform: 'translate(-50%, -50%)' }}
              >
                <ImagenIngrediente ingrediente={carne} className="w-full drop-shadow-[0_2px_0_rgba(43,27,18,.35)]" />
              </span>
            ) : null;
          })}
          {armado.seleccion.vegetal.map((id, i) => {
            const vegetal = buscar(id);
            const lugar = LUGARES_VEGETAL[i % LUGARES_VEGETAL.length]!;
            return vegetal ? (
              <span
                key={id}
                className="animate-caer absolute z-[12] w-[22%]"
                style={{ left: `${lugar[0]}%`, top: `${lugar[1]}%`, transform: 'translate(-50%, -50%)' }}
              >
                <ImagenIngrediente ingrediente={vegetal} className="w-full drop-shadow-[0_2px_0_rgba(43,27,18,.35)]" />
              </span>
            ) : null;
          })}
        </div>

        {/* Papas incluidas */}
        <div className="juguete absolute right-2.5 bottom-3 z-20 flex rotate-[-6deg] items-center gap-1.5 rounded-xl bg-amarillo px-2.5 py-1.5">
          <span aria-hidden className="text-xl">🍟</span>
          <span className="font-heading text-base leading-[1.05] font-extrabold">
            Papas fritas
            <br />
            incluidas
          </span>
        </div>
      </div>
    </section>
  );
}
