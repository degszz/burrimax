import { useEffect } from 'react';
import { IconoWhatsapp } from '../tienda/IconosRedes';

interface Props {
  numero: number;
  linkWhatsapp: string;
  urlSeguimiento: string;
}

/** Cuánto se ve el tilde antes de saltar a WhatsApp. */
const ESPERA_MS = 1800;

/**
 * Pantalla completa de "¡Listo!": un tilde grande que se dibuja, el número de
 * pedido, y enseguida abre WhatsApp con el mensaje ya escrito. Si el salto
 * no anda (o la persona vuelve), tiene el botón para abrirlo a mano.
 */
export function PedidoEnviado({ numero, linkWhatsapp, urlSeguimiento }: Props) {
  useEffect(() => {
    const espera = window.setTimeout(() => {
      window.location.href = linkWhatsapp;
    }, ESPERA_MS);
    return () => window.clearTimeout(espera);
  }, [linkWhatsapp]);

  return (
    <div role="alertdialog" aria-modal="true" aria-labelledby="titulo-enviado" className="fixed inset-0 z-50 grid place-items-center bg-crema px-6 text-center">
      <div className="w-full max-w-sm">
        <div className="animate-sello mx-auto grid size-36 place-items-center rounded-full border-[3px] border-tinta bg-verde shadow-[0_6px_0_var(--tinta)]">
          <svg viewBox="0 0 52 52" className="size-20" aria-hidden>
            <path className="animate-tilde" d="M14 27 L23 36 L39 17" fill="none" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 id="titulo-enviado" className="animate-aparecer mt-6 text-4xl font-extrabold">
          ¡Listo!
        </h1>
        <p className="animate-aparecer mt-1 text-xl font-semibold">
          Tu pedido <span className="font-heading font-extrabold">#{String(numero).padStart(4, '0')}</span> está armado
        </p>
        <p className="mt-4 text-lg text-tinta-suave" aria-live="polite">
          <IconoWhatsapp className="mr-1 inline size-5 align-[-4px] text-verde" />
          Te llevamos a WhatsApp para mandarlo…
        </p>

        <a
          href={linkWhatsapp}
          className="juguete mt-6 flex min-h-16 items-center justify-center gap-2 rounded-2xl bg-verde font-heading text-xl font-extrabold text-white shadow-[0_4px_0_var(--tinta)]"
        >
          <IconoWhatsapp className="size-6" /> Abrir WhatsApp
        </a>
        <a href={urlSeguimiento} className="mt-3 inline-flex min-h-12 items-center font-bold text-tinta-suave underline underline-offset-4">
          Ver mi pedido
        </a>
      </div>
    </div>
  );
}
