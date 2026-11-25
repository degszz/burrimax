import type { IngredienteCatalogo } from '@burritos/shared';
import { ArrowDown, ArrowRight, Check, ChefHat, Pointer } from 'lucide-react';
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

        <div className="mx-auto mt-3 flex max-w-sm flex-col gap-2.5 lg:mx-0 lg:mt-6">
          <BotonArmar texto={textoBoton} onArmar={onArmar} />
          {/* Instagram se ve aunque todavía no tenga link (Max lo crea y lo pasa). */}
          <div className="grid grid-cols-2 gap-2.5">
            <BotonRed href={instagram} etiqueta="Instagram" icono={<IconoInstagram className="size-5" />} />
            <BotonRed href={whatsapp ? `https://wa.me/${whatsapp}` : null} etiqueta="WhatsApp" icono={<IconoWhatsapp className="size-5" />} />
          </div>
        </div>
      </div>

      {/* El armador asoma a todo el ancho y se desenfoca hacia abajo */}
      <DemoArmador ingredientes={demo} textoBoton={textoBoton} onArmar={onArmar} />
    </section>
  );
}

/** El botón principal: mismo estilo y ancho que los de abajo, pero rojo y más alto. */
function BotonArmar({ texto, onArmar }: { texto: string; onArmar: () => void }) {
  return (
    <button
      type="button"
      onClick={onArmar}
      className="juguete flex min-h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-rojo px-5 font-heading text-xl font-extrabold text-white hover:brightness-110 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-amarillo"
    >
      <ChefHat aria-hidden className="size-6" strokeWidth={2.5} />
      {texto}
    </button>
  );
}

function BotonRed({ href, etiqueta, icono }: { href: string | null; etiqueta: string; icono: React.ReactNode }) {
  const clases = 'juguete flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-3 font-heading text-lg font-extrabold hover:bg-panel';
  // Sin link todavía: se ve igual, pero no lleva a ningún lado. [A CONFIRMAR]
  if (!href) {
    return (
      <span title="Pronto" className={clases}>
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
      {/* Toda la muestra es un botón: se toque donde se toque, arranca el armador. */}
      <button
        type="button"
        onClick={onArmar}
        aria-label={textoBoton}
        className="group absolute inset-0 cursor-pointer text-left focus-visible:outline-4 focus-visible:-outline-offset-4 focus-visible:outline-amarillo lg:rounded-3xl"
      >
        {/* Fuera del flujo: la zona mide lo que queda de pantalla y la grilla se corta */}
        <span aria-hidden className="absolute inset-x-0 top-0 grid grid-cols-3 gap-2.5 px-3 pt-3 transition-transform duration-300 select-none group-hover:-translate-y-1">
          {ingredientes.map((ingrediente, i) => (
            <span
              key={ingrediente.id}
              className={cn(
                'juguete relative flex min-w-0 flex-col items-center rounded-2xl px-1 pt-2 pb-1.5 transition-colors duration-500',
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
            </span>
          ))}
        </span>

        {/* Desenfoque que sube desde abajo: deja nítida una fila y media */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 top-[22%] bg-gradient-to-b from-crema/0 via-crema/55 to-crema/90 backdrop-blur-[8px] [mask-image:linear-gradient(to_bottom,transparent,black_30%)]"
        />

        <span aria-hidden className="absolute inset-x-0 bottom-14 flex flex-col items-center gap-2 px-4">
          <span className="rounded-full bg-white/80 px-3 py-0.5 text-sm font-bold text-tinta-suave">Elegís todo vos, paso a paso</span>
          <span className="juguete flex min-h-12 items-center gap-2 rounded-full bg-amarillo px-5 font-heading text-lg font-extrabold group-hover:-translate-y-0.5 group-active:translate-y-[3px] group-active:shadow-[0_1px_0_var(--tinta)]">
            <Pointer className="size-5" strokeWidth={2.5} /> Empezar a armar <ArrowRight className="animate-empujar size-5" strokeWidth={3} />
          </span>
        </span>
      </button>

      {/* Fuera del botón (no se anidan links en botones). */}
      <a
        href="#combos-casa"
        className="absolute inset-x-0 bottom-1 mx-auto flex min-h-12 w-fit items-center gap-1.5 px-2 font-bold text-tinta-suave underline underline-offset-4"
      >
        o elegí uno de la casa <ArrowDown aria-hidden className="size-4" />
      </a>
    </div>
  );
}
