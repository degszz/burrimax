import type { IngredienteCatalogo } from '@burritos/shared';
import { ArrowDown, Check, ChefHat } from 'lucide-react';
import { useEffect, useState } from 'react';
import { formatoPesos } from '@/lib/formato';
import { MARCA, urlInstagram } from '@/lib/marca';
import { cn } from '@/lib/utils';
import { BurritoConPapas } from '../armador/BurritoConPapas';
import { ImagenIngrediente } from '../armador/ImagenIngrediente';
import { IconoInstagram, IconoWhatsapp } from './IconosRedes';

interface Props {
  precioDesde: number;
  /** Hay un burrito a medio armar guardado en el celular. */
  enCurso: boolean;
  /** Ingredientes para la mini demostración (6). */
  demo: IngredienteCatalogo[];
  whatsapp: string | null;
  onArmar: () => void;
  className?: string;
}

/**
 * Portada: el título de la marca, el producto y las acciones. Abajo, a todo
 * el ancho, asoma el armador (una fila y media de ingredientes) que se
 * desenfoca hacia abajo, con el botón encima. Junto con el encabezado ocupa
 * exactamente una pantalla.
 */
export function HeroArmar({ precioDesde, enCurso, demo, whatsapp, onArmar, className }: Props) {
  const textoBoton = enCurso ? 'Seguir armando el mío' : 'Armá tu burrito';
  const instagram = urlInstagram();

  return (
    // PC: título, foto y botones a la izquierda; el armador de muestra a la derecha.
    <section aria-labelledby="titulo-hero" className={cn('flex flex-col lg:grid lg:grid-cols-2 lg:items-center lg:gap-12 lg:px-6', className)}>
      <div className="px-4 pt-2 text-center lg:px-0 lg:text-left">
        <h1 id="titulo-hero" className="text-[2.3rem] leading-none font-extrabold lg:text-7xl">
          {MARCA.frase}
        </h1>

        <div className="relative mx-auto mt-2 w-[64%] max-w-[15rem] lg:mx-0 lg:mt-6 lg:w-[78%] lg:max-w-[26rem]">
          <span className="juguete absolute -top-1 -left-4 z-30 -rotate-6 rounded-lg bg-amarillo px-1.5 font-heading text-xs font-extrabold">
            desde {formatoPesos(precioDesde)}
          </span>
          <BurritoConPapas doble={false} />
        </div>

        <div className="mx-auto mt-2 flex max-w-xs flex-col gap-2 lg:mx-0 lg:mt-6">
          <button
            type="button"
            onClick={onArmar}
            className="juguete flex min-h-12 items-center justify-center gap-2 rounded-xl bg-rojo font-heading text-lg font-extrabold text-white shadow-[0_4px_0_var(--rojo-oscuro)]"
          >
            <ChefHat aria-hidden className="size-5" strokeWidth={2.5} /> {textoBoton}
          </button>
          <div className="grid grid-cols-2 gap-2">
            <BotonRed href={instagram} etiqueta="Instagram" icono={<IconoInstagram className="size-4" />} />
            <BotonRed href={whatsapp ? `https://wa.me/${whatsapp}` : null} etiqueta="WhatsApp" icono={<IconoWhatsapp className="size-4" />} />
          </div>
        </div>
      </div>

      {/* El armador asoma a todo el ancho y se desenfoca hacia abajo */}
      <DemoArmador ingredientes={demo} textoBoton={textoBoton} onArmar={onArmar} />
    </section>
  );
}

function BotonRed({ href, etiqueta, icono }: { href: string | null; etiqueta: string; icono: React.ReactNode }) {
  const clases = 'juguete flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-white font-heading text-base font-extrabold';
  // Sin link cargado todavía: se ve, pero no lleva a ningún lado. [A CONFIRMAR]
  if (!href) {
    return (
      <span aria-disabled="true" title="Pronto" className={cn(clases, 'opacity-50')}>
        {icono} {etiqueta}
      </span>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={clases}>
      {icono} {etiqueta}
    </a>
  );
}

function DemoArmador({ ingredientes, textoBoton, onArmar }: { ingredientes: IngredienteCatalogo[]; textoBoton: string; onArmar: () => void }) {
  // Las tarjetas de la parte nítida "se eligen solas" de a una, para que se
  // entienda que se arma tocando.
  const visibles = Math.min(4, ingredientes.length);
  const [elegida, setElegida] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || visibles === 0) return;
    const t = setInterval(() => setElegida((i) => (i + 1) % visibles), 1300);
    return () => clearInterval(t);
  }, [visibles]);

  return (
    <div className="relative mt-3 min-h-56 flex-1 overflow-hidden lg:mt-0 lg:h-[min(36rem,78dvh)] lg:flex-none lg:rounded-3xl">
      {/* Fuera del flujo: la zona mide lo que queda de pantalla y la grilla se corta */}
      <ul aria-hidden className="absolute inset-x-0 top-0 grid grid-cols-3 gap-2.5 px-3 pt-1 select-none">
        {ingredientes.map((ingrediente, i) => (
          <li
            key={ingrediente.id}
            className={cn(
              'juguete relative flex flex-col items-center rounded-2xl px-1 pt-2 pb-1.5 transition-colors duration-500',
              i === elegida ? 'border-verde bg-verde-claro' : 'bg-white',
            )}
          >
            {i === elegida && (
              <span className="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full border-2 border-tinta bg-verde text-white">
                <Check className="size-3.5" strokeWidth={3.5} />
              </span>
            )}
            <ImagenIngrediente ingrediente={ingrediente} className="w-[62%]" />
            <span className="mt-0.5 w-full truncate text-center font-heading text-base font-extrabold">{ingrediente.nombre}</span>
          </li>
        ))}
      </ul>

      {/* Desenfoque que sube desde abajo: deja nítida una fila y media */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 top-[22%] bg-gradient-to-b from-crema/0 via-crema/55 to-crema/90 backdrop-blur-[8px] [mask-image:linear-gradient(to_bottom,transparent,black_30%)]"
      />

      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-1 px-4 pb-2">
        <button
          type="button"
          onClick={onArmar}
          className="juguete flex min-h-12 items-center gap-2 rounded-xl bg-amarillo px-5 font-heading text-lg font-extrabold"
        >
          <ChefHat aria-hidden className="size-5" strokeWidth={2.5} /> {textoBoton}
        </button>
        <a href="#combos-casa" className="flex min-h-11 items-center gap-1.5 font-bold text-tinta-suave underline underline-offset-4">
          o elegí uno de la casa <ArrowDown aria-hidden className="size-4" />
        </a>
      </div>
    </div>
  );
}
