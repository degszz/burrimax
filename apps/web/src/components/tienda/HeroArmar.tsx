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
 * Portada: frase de la marca, el producto y las acciones. Abajo, una mini
 * demostración del armador (desenfocada) que invita a armarlo. Junto con el
 * encabezado ocupa exactamente una pantalla.
 */
export function HeroArmar({ precioDesde, enCurso, demo, whatsapp, onArmar, className }: Props) {
  const textoBoton = enCurso ? 'Seguir armando el mío' : 'Armá tu burrito';
  const instagram = urlInstagram();

  return (
    <section aria-labelledby="titulo-hero" className={cn('flex flex-col px-4 pb-2', className)}>
      {/* Marca + producto */}
      <div className="flex flex-1 flex-col justify-center gap-3 pt-1">
        <div>
          <h1 id="titulo-hero" className="text-[2.15rem] leading-[1.02] font-extrabold text-balance">
            {MARCA.frase}
          </h1>
          <p className="mt-2 text-lg leading-snug text-tinta-suave">{MARCA.bajada}</p>
        </div>

        <div className="relative mx-auto w-[92%] max-w-[21rem]">
          <span className="juguete absolute -top-1 -left-3 z-30 -rotate-6 rounded-xl bg-amarillo px-2 py-0.5 font-heading text-sm font-extrabold">
            desde {formatoPesos(precioDesde)}
          </span>
          <BurritoConPapas doble={false} />
        </div>

        <div className="space-y-2.5">
          <button
            type="button"
            onClick={onArmar}
            className="juguete flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-rojo font-heading text-xl font-extrabold text-white shadow-[0_4px_0_var(--rojo-oscuro)]"
          >
            <ChefHat aria-hidden className="size-6" strokeWidth={2.5} /> {textoBoton}
          </button>
          <div className="grid grid-cols-2 gap-2.5">
            <BotonRed href={instagram} etiqueta="Instagram" icono={<IconoInstagram className="size-5" />} />
            <BotonRed href={whatsapp ? `https://wa.me/${whatsapp}` : null} etiqueta="WhatsApp" icono={<IconoWhatsapp className="size-5" />} />
          </div>
        </div>
      </div>

      {/* Mini demostración del armador, desenfocada, con el botón encima */}
      <DemoArmador ingredientes={demo} textoBoton={textoBoton} onArmar={onArmar} />

      <a href="#combos-casa" className="mt-1 flex min-h-11 items-center justify-center gap-1.5 font-bold text-tinta-suave underline underline-offset-4">
        o elegí uno de la casa <ArrowDown aria-hidden className="size-4" />
      </a>
    </section>
  );
}

function BotonRed({ href, etiqueta, icono }: { href: string | null; etiqueta: string; icono: React.ReactNode }) {
  const clases = 'juguete flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white font-heading text-lg font-extrabold';
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
  // Las tarjetas "se eligen solas" de a una, para que se entienda que se arma tocando.
  const [elegida, setElegida] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || ingredientes.length === 0) return;
    const t = setInterval(() => setElegida((i) => (i + 1) % ingredientes.length), 1300);
    return () => clearInterval(t);
  }, [ingredientes.length]);

  return (
    <div className="relative mt-3 overflow-hidden rounded-3xl border-[2.5px] border-tinta">
      <ul aria-hidden className="fondo-puntos grid grid-cols-3 gap-2 p-2.5 blur-[2.5px] select-none">
        {ingredientes.map((ingrediente, i) => (
          <li
            key={ingrediente.id}
            className={cn(
              'relative flex flex-col items-center rounded-2xl border-2 px-1 pt-1.5 pb-1 transition-colors duration-500',
              i === elegida ? 'border-verde bg-verde-claro' : 'border-tinta bg-white',
            )}
          >
            {i === elegida && (
              <span className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-verde text-white">
                <Check className="size-3.5" strokeWidth={3.5} />
              </span>
            )}
            <ImagenIngrediente ingrediente={ingrediente} className="w-[58%]" />
            <span className="mt-0.5 truncate font-heading text-sm font-extrabold">{ingrediente.nombre}</span>
          </li>
        ))}
      </ul>
      <div className="absolute inset-0 grid place-items-center bg-crema/35">
        <button
          type="button"
          onClick={onArmar}
          className="juguete flex min-h-14 items-center gap-2 rounded-2xl bg-amarillo px-5 font-heading text-xl font-extrabold"
        >
          <ChefHat aria-hidden className="size-6" strokeWidth={2.5} /> {textoBoton}
        </button>
      </div>
    </div>
  );
}
