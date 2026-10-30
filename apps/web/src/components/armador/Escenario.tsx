import { contarRelleno, maximoRelleno, type Armado, type Catalogo, type IngredienteCatalogo } from '@burritos/shared';
import { Smile } from 'lucide-react';
import { useLatido } from '@/lib/useLatido';
import { cn } from '@/lib/utils';
import { ImagenIngrediente } from './ImagenIngrediente';

interface Props {
  armado: Armado;
  catalogo: Catalogo;
}

// Posiciones (en % del plato): carnes juntas al centro y vegetales en una
// ronda apretada alrededor, para que se vea como un relleno armado.
const LUGARES_CARNE = [
  [47, 47],
  [56, 54],
  [44, 57],
  [55, 44],
] as const;
const LUGARES_VEGETAL = [
  [33, 41],
  [67, 42],
  [34, 63],
  [66, 64],
  [50, 33],
  [50, 70],
] as const;

// Manchas de salsa (coordenadas del plato, 0–100): la primera cruza el centro
// y la segunda se superpone en diagonal, para que se vean las dos.
const MANCHAS_SALSA = [
  {
    forma: 'M20 47 C 24 36, 40 33, 52 37 C 63 40, 76 36, 82 43 C 87 50, 78 58, 66 57 C 54 56, 44 62, 32 60 C 22 58, 17 53, 20 47 Z',
    brillo: 'M30 43 C 36 39, 46 39, 52 41 C 46 42, 38 43, 30 45 Z',
  },
  {
    forma: 'M30 26 C 40 22, 52 28, 56 38 C 60 48, 70 56, 74 66 C 77 74, 68 79, 60 74 C 52 69, 48 58, 40 52 C 32 46, 22 34, 30 26 Z',
    brillo: 'M36 30 C 42 28, 48 32, 50 37 C 46 35, 41 33, 36 32 Z',
  },
] as const;

export function Escenario({ armado, catalogo }: Props) {
  const tamano = catalogo.tamanos.find((t) => t.id === armado.tamanoId);
  const buscar = (id: string) => catalogo.ingredientes.find((i) => i.id === id);
  const tortilla = armado.seleccion.tortilla[0] ? buscar(armado.seleccion.tortilla[0]) : undefined;
  const salsas = armado.seleccion.salsa.map(buscar).filter((i): i is IngredienteCatalogo => !!i);
  const relleno = contarRelleno(armado);
  const maximo = tamano ? maximoRelleno(tamano) : 0;
  const doble = (tamano?.cantTapas ?? 1) > 1;
  // Animaciones que responden a lo que se elige.
  const cambio = `${armado.seleccion.tortilla.join()}|${armado.seleccion.salsa.join()}|${relleno}`;
  const latidoPlato = useLatido<HTMLDivElement>(cambio, 'animate-plato');
  const latidoRelleno = useLatido<HTMLDivElement>(relleno, 'animate-latido');

  return (
    <section aria-label="Tu burrito" className="flex min-h-0 flex-1 flex-col px-4">
      {/* Sin tarjeta: el plato apoyado sobre el fondo, con los dos carteles.
          Ocupa el lugar que sobra; el plato es un cuadrado del lado más corto. */}
      <div className="relative min-h-20 flex-1 [container-type:size]">
        {/* Contador de relleno */}
        <div ref={latidoRelleno} className="absolute top-1 left-0 z-20 rounded-2xl border-2 border-tinta bg-white px-3 py-1.5">
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
        <div className="absolute top-1/2 left-1/2 @container size-[min(100cqh,100cqw,18rem)] -translate-x-1/2 -translate-y-1/2">
          {/* Se hunde apenas cuando le cae algo encima */}
          <div ref={latidoPlato} className="absolute inset-0">
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
            <div className="absolute inset-[9%] grid place-items-center rounded-full border-[3px] border-dashed border-tinta/45 text-center @max-[9rem]:hidden">
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
          {/* Salsas: manchas untadas sobre la tortilla, debajo de la carne y los vegetales */}
          <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 z-10" aria-hidden>
            <defs>
              <clipPath id="sobre-tortilla">
                <circle cx="50" cy="50" r="40" />
              </clipPath>
              {/* Borde irregular, como salsa untada con cuchara */}
              <filter id="salsa-untada" x="-10%" y="-10%" width="120%" height="120%">
                <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="2" seed="7" result="ruido" />
                <feDisplacementMap in="SourceGraphic" in2="ruido" scale="4" xChannelSelector="R" yChannelSelector="G" />
                <feDropShadow dx="0" dy="0.6" stdDeviation="0.7" floodColor="#2B1B12" floodOpacity="0.22" />
              </filter>
            </defs>
            <g clipPath="url(#sobre-tortilla)">
              {salsas.map((salsa, i) => {
                const mancha = MANCHAS_SALSA[i % MANCHAS_SALSA.length]!;
                return (
                  <g key={salsa.id} className="animate-aparecer" filter="url(#salsa-untada)">
                    <path d={mancha.forma} fill={salsa.colorHex ?? '#E4572E'} opacity="0.93" />
                    <path d={mancha.brillo} fill="#FFFFFF" opacity="0.28" />
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Carnes al centro, vegetales alrededor */}
          {armado.seleccion.carne.map((id, i) => {
            const carne = buscar(id);
            const lugar = LUGARES_CARNE[i % LUGARES_CARNE.length]!;
            return carne ? (
              <span
                key={`${id}-${i}`}
                className="animate-caer absolute z-[11] w-[32%]"
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
                className="animate-caer absolute z-[12] w-[28%]"
                style={{ left: `${lugar[0]}%`, top: `${lugar[1]}%`, transform: 'translate(-50%, -50%)' }}
              >
                <ImagenIngrediente ingrediente={vegetal} className="w-full drop-shadow-[0_2px_0_rgba(43,27,18,.35)]" />
              </span>
            ) : null;
          })}
          </div>
        </div>

        {/* Papas incluidas */}
        <div className="juguete absolute right-0 bottom-1 z-20 flex rotate-[-6deg] items-center gap-1.5 rounded-xl bg-amarillo px-2.5 py-1.5">
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
