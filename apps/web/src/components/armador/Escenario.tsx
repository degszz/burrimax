import { contarRelleno, maximoRelleno, type Armado, type Catalogo, type IngredienteCatalogo } from '@burritos/shared';
import { Smile } from 'lucide-react';
import { useLatido } from '@/lib/useLatido';
import { cn } from '@/lib/utils';
import { ImagenIngrediente } from './ImagenIngrediente';

interface Props {
  armado: Armado;
  catalogo: Catalogo;
}

// Dos escenarios: simple (plato redondo, una tortilla) y doble tapa (plato
// ovalado, dos tortillas una al lado de la otra). Posiciones en % del plato;
// los ingredientes de la doble se reparten a lo largo de las dos tortillas.
type Lugar = readonly [number, number];
interface Geometria {
  carnes: readonly Lugar[];
  vegetales: readonly Lugar[];
  /** Ancho de cada ingrediente, en % del ancho del plato. */
  anchoCarne: string;
  anchoVegetal: string;
  /** Coordenadas del SVG de salsas (alto siempre 100). */
  ancho: number;
  /** Zonas sobre la tortilla donde se ve la salsa (círculos cx, cy, r). */
  tortillas: readonly (readonly [number, number, number])[];
  manchas: readonly { forma: string; brillo: string }[];
}

const SIMPLE: Geometria = {
  // Carnes juntas al centro y vegetales en una ronda apretada alrededor.
  carnes: [
    [47, 47],
    [56, 54],
    [44, 57],
    [55, 44],
  ],
  vegetales: [
    [33, 41],
    [67, 42],
    [34, 63],
    [66, 64],
    [50, 33],
    [50, 70],
  ],
  anchoCarne: 'w-[32%]',
  anchoVegetal: 'w-[28%]',
  ancho: 100,
  tortillas: [[50, 50, 35]],
  // La primera mancha cruza el centro y la segunda se superpone en diagonal.
  manchas: [
    {
      forma: 'M20 47 C 24 36, 40 33, 52 37 C 63 40, 76 36, 82 43 C 87 50, 78 58, 66 57 C 54 56, 44 62, 32 60 C 22 58, 17 53, 20 47 Z',
      brillo: 'M30 43 C 36 39, 46 39, 52 41 C 46 42, 38 43, 30 45 Z',
    },
    {
      forma: 'M30 26 C 40 22, 52 28, 56 38 C 60 48, 70 56, 74 66 C 77 74, 68 79, 60 74 C 52 69, 48 58, 40 52 C 32 46, 22 34, 30 26 Z',
      brillo: 'M36 30 C 42 28, 48 32, 50 37 C 46 35, 41 33, 36 32 Z',
    },
  ],
};


const DOBLE: Geometria = {
  // Una carne y un par de vegetales por tortilla, de punta a punta.
  carnes: [
    [30, 50],
    [42, 57],
    [58, 44],
    [70, 51],
  ],
  vegetales: [
    [21, 47],
    [79, 52],
    [34, 34],
    [66, 66],
    [49, 67],
    [53, 32],
  ],
  anchoCarne: 'w-[19%]',
  anchoVegetal: 'w-[16.5%]',
  ancho: 170,
  // Centros de las dos tortillas (ver las clases de las imágenes más abajo).
  tortillas: [
    [61, 50, 33],
    [109, 50, 33],
  ],
  // Manchas largas que cruzan las dos tortillas.
  manchas: [
    {
      forma: 'M42.3 48.3 C 47.9 38.1, 68.9 36.4, 85.7 39.8 C 102.5 43.2, 119.3 36.4, 129.1 43.2 C 135.4 50, 127 58.5, 112.3 56.8 C 95.5 55.1, 78.7 61.9, 60.5 59.4 C 47.2 57.7, 38.8 54.3, 42.3 48.3 Z',
      brillo: 'M50.7 44.9 C 61.9 40.7, 75.9 40.7, 87.1 42.4 C 75.9 44.1, 63.3 44.9, 50.7 46.6 Z',
    },
    {
      forma: 'M46.5 33.9 C 60.5 26.2, 78.7 33, 89.9 43.2 C 99.7 52.6, 113.7 61.1, 126.3 61.9 C 134.7 62.8, 132.6 72.1, 122.1 72.1 C 105.3 72.1, 91.3 62.8, 80.8 54.3 C 68.9 44.9, 54.9 43.2, 47.2 39.8 C 43 38.1, 43 35.6, 46.5 33.9 Z',
      brillo: 'M53.5 33 C 61.9 30.5, 70.3 33, 75.9 37.3 C 68.9 35.6, 61.9 34.7, 53.5 34.7 Z',
    },
  ],
};

export function Escenario({ armado, catalogo }: Props) {
  const tamano = catalogo.tamanos.find((t) => t.id === armado.tamanoId);
  const buscar = (id: string) => catalogo.ingredientes.find((i) => i.id === id);
  const tortilla = armado.seleccion.tortilla[0] ? buscar(armado.seleccion.tortilla[0]) : undefined;
  const salsas = armado.seleccion.salsa.map(buscar).filter((i): i is IngredienteCatalogo => !!i);
  const relleno = contarRelleno(armado);
  const maximo = tamano ? maximoRelleno(tamano) : 0;
  const doble = (tamano?.cantTapas ?? 1) > 1;
  const geo = doble ? DOBLE : SIMPLE;
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

        {/* Plato: redondo (simple) u ovalado y más largo (doble tapa), del tamaño que entre */}
        <div
          className={cn(
            'absolute top-1/2 left-1/2 @container -translate-x-1/2 -translate-y-1/2 transition-[width,height] duration-300',
            doble
              ? 'aspect-[17/10] w-[min(100cqw,170cqh,30rem)] lg:w-[min(100cqw,170cqh,52rem)]'
              : 'size-[min(100cqh,100cqw,18rem)] lg:size-[min(100cqh,100cqw,34rem)]',
          )}
        >
          {/* Se hunde apenas cuando le cae algo encima */}
          <div ref={latidoPlato} className="absolute inset-0">
          <div className="absolute inset-0 rounded-[50%] border-[3px] border-tinta bg-white shadow-[0_5px_0_var(--tinta)]" />

          {tortilla ? (
            doble ? (
              // Dos tortillas una al lado de la otra, apenas encimadas: se arma a lo largo.
              <>
                <ImagenIngrediente
                  ingrediente={tortilla}
                  prioridad
                  className="absolute top-[8%] left-[11%] w-[49.4%] -rotate-6 rounded-full"
                />
                <ImagenIngrediente
                  ingrediente={tortilla}
                  prioridad
                  className="absolute top-[8%] left-[39.6%] w-[49.4%] rotate-[7deg] rounded-full drop-shadow-[-3px_0_2px_rgba(43,27,18,.18)]"
                />
              </>
            ) : (
              <ImagenIngrediente ingrediente={tortilla} prioridad className="absolute top-[8%] left-[8%] w-[84%] rounded-full" />
            )
          ) : (
            <div className="absolute inset-[9%] grid place-items-center rounded-[50%] border-[3px] border-dashed border-tinta/45 text-center @max-[9rem]:hidden">
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

          {/* Sin tortilla no hay dónde apoyar nada: el relleno elegido queda guardado
              (no se borra) y vuelve a aparecer apenas se elige una tortilla. */}
          {tortilla && (
          <>
          {/* Salsas: manchas untadas sobre la tortilla, debajo de la carne y los vegetales */}
          <svg viewBox={`0 0 ${geo.ancho} 100`} className="pointer-events-none absolute inset-0 z-10 size-full" aria-hidden>
            <defs>
              <clipPath id="sobre-tortilla">
                {geo.tortillas.map(([cx, cy, r]) => (
                  <circle key={cx} cx={cx} cy={cy} r={r} />
                ))}
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
                const mancha = geo.manchas[i % geo.manchas.length]!;
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
            const lugar = geo.carnes[i % geo.carnes.length]!;
            return carne ? (
              <span
                key={`${id}-${i}`}
                className={cn('animate-caer absolute z-[11]', geo.anchoCarne)}
                style={{ left: `${lugar[0]}%`, top: `${lugar[1]}%`, transform: 'translate(-50%, -50%)' }}
              >
                <ImagenIngrediente ingrediente={carne} className="w-full drop-shadow-[0_2px_0_rgba(43,27,18,.35)]" />
              </span>
            ) : null;
          })}
          {armado.seleccion.vegetal.map((id, i) => {
            const vegetal = buscar(id);
            const lugar = geo.vegetales[i % geo.vegetales.length]!;
            return vegetal ? (
              <span
                key={id}
                className={cn('animate-caer absolute z-[12]', geo.anchoVegetal)}
                style={{ left: `${lugar[0]}%`, top: `${lugar[1]}%`, transform: 'translate(-50%, -50%)' }}
              >
                <ImagenIngrediente ingrediente={vegetal} className="w-full drop-shadow-[0_2px_0_rgba(43,27,18,.35)]" />
              </span>
            ) : null;
          })}
          </>
          )}
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
