import { Box, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Modelo3D } from '@/lib/catalogo.server';
import { MARCA } from '@/lib/marca';
import { cn } from '@/lib/utils';

/**
 * "Verlo en 3D": abre el burrito escaneado (uno para todos los combos) para
 * girarlo y acercarlo, y "Verlo en tu mesa" con realidad aumentada en su tamaño
 * real (ar-scale fixed). El visor (`@google/model-viewer`, con three.js) se
 * descarga recién al abrirlo: la portada no carga nada de 3D.
 */
export function BotonVer3D({ modelo, className }: { modelo: Modelo3D; className?: string }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className={cn('juguete flex min-h-12 items-center gap-2 rounded-full bg-white px-4 font-heading text-base font-extrabold', className)}
      >
        <Box aria-hidden className="size-5" strokeWidth={2.5} /> Verlo en 3D
      </button>
      {abierto && <Visor modelo={modelo} onCerrar={() => setAbierto(false)} />}
    </>
  );
}

function Visor({ modelo, onCerrar }: { modelo: Modelo3D; onCerrar: () => void }) {
  const [listo, setListo] = useState(false);
  const [error, setError] = useState(false);
  const dialogo = useRef<HTMLDialogElement>(null);
  const quieto = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    dialogo.current?.showModal();
    let vivo = true;
    import('@google/model-viewer')
      .then(() => vivo && setListo(true))
      .catch(() => vivo && setError(true));
    return () => {
      vivo = false;
    };
  }, []);

  return (
    <dialog
      ref={dialogo}
      onClose={onCerrar}
      aria-label={`${MARCA.nombre} en 3D`}
      className="m-0 h-dvh max-h-none w-screen max-w-none bg-crema p-0 text-tinta backdrop:bg-tinta/60 sm:m-auto sm:h-[min(44rem,90dvh)] sm:w-[min(40rem,92vw)] sm:rounded-3xl sm:border-[3px] sm:border-tinta"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-3 px-4 pt-4 pb-2">
          <div className="min-w-0 flex-1">
            <p className="font-heading text-2xl leading-tight font-extrabold">Tu burrito en 3D</p>
            <p className="text-sm font-semibold text-tinta-suave">Giralo con el dedo y pellizcá para acercarte</p>
          </div>
          <button type="button" onClick={() => dialogo.current?.close()} aria-label="Cerrar" className="juguete grid size-12 shrink-0 place-items-center rounded-2xl bg-white">
            <X className="size-6" strokeWidth={2.5} />
          </button>
        </div>

        <div className="fondo-puntos relative mx-4 mb-4 min-h-0 flex-1 overflow-hidden rounded-3xl border-[2.5px] border-tinta">
          {error ? (
            <p className="grid h-full place-items-center p-6 text-center font-semibold">No pudimos abrir el 3D en este celular. Probá desde otro navegador.</p>
          ) : !listo ? (
            <p className="grid h-full place-items-center font-semibold text-tinta-suave" aria-live="polite">
              Cargando el burrito…
            </p>
          ) : (
            <model-viewer
              src={modelo.glb}
              ios-src={modelo.usdz ?? undefined}
              alt={`Burrito de ${MARCA.nombre} en 3D`}
              camera-controls=""
              touch-action="pan-y"
              ar=""
              ar-modes="webxr scene-viewer quick-look"
              ar-scale="fixed"
              shadow-intensity="1"
              shadow-softness="0.8"
              exposure="1.05"
              interaction-prompt="auto"
              {...(quieto ? {} : { 'auto-rotate': '', 'auto-rotate-delay': '1500', 'rotation-per-second': '18deg' })}
              style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}
            >
              {/* Solo aparece si el celular puede usar realidad aumentada */}
              <button
                slot="ar-button"
                type="button"
                className="juguete absolute bottom-4 left-1/2 flex min-h-14 -translate-x-1/2 items-center gap-2 rounded-2xl bg-rojo px-6 font-heading text-lg font-extrabold whitespace-nowrap text-white"
              >
                Verlo en tu mesa
              </button>
            </model-viewer>
          )}
        </div>
      </div>
    </dialog>
  );
}
