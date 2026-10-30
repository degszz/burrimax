import { Box, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { MODELO_3D } from '@/lib/modelo3d';

interface Props {
  onCerrar: () => void;
}

// <model-viewer> es un componente web de Google: se carga solo al abrir esto.
declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & Record<string, unknown>;
    }
  }
}

/**
 * Burrito en 3D de verdad: se gira con el dedo y, en el celular, "Ponerlo en
 * mi mesa" abre la realidad aumentada del sistema (Android: Scene Viewer,
 * iPhone: Quick Look). Queda apoyado en la mesa, a tamaño real, y se puede
 * rodear y acercar.
 */
export function VerEnMiMesa3D({ onCerrar }: Props) {
  const [listo, setListo] = useState(false);
  const [sinAR, setSinAR] = useState(false);
  const visor = useRef<HTMLElement & { canActivateAR?: boolean }>(null);
  const sinMovimiento = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    let vivo = true;
    import('@google/model-viewer').then(() => vivo && setListo(true));
    const alTeclear = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar();
    window.addEventListener('keydown', alTeclear);
    return () => {
      vivo = false;
      window.removeEventListener('keydown', alTeclear);
    };
  }, [onCerrar]);

  // En la compu no hay AR: se avisa que se abre desde el celular.
  useEffect(() => {
    const el = visor.current;
    if (!listo || !el) return;
    const revisar = () => setSinAR(!el.canActivateAR);
    el.addEventListener('load', revisar);
    return () => el.removeEventListener('load', revisar);
  }, [listo]);

  return (
    <div role="dialog" aria-modal="true" aria-label="Tu burrito en 3D" className="fixed inset-0 z-[70] flex flex-col bg-crema">
      <div className="flex items-center justify-between px-4 pt-4">
        <p className="font-heading text-2xl font-extrabold">Tu burrito en 3D</p>
        <button type="button" onClick={onCerrar} aria-label="Cerrar" className="juguete grid size-12 place-items-center rounded-2xl bg-white">
          <X className="size-6" strokeWidth={2.5} />
        </button>
      </div>

      {listo ? (
        <model-viewer
          ref={visor}
          src={MODELO_3D.glb}
          ios-src={MODELO_3D.usdz}
          alt="Burrito con papas fritas en 3D"
          ar=""
          ar-modes="webxr scene-viewer quick-look"
          ar-scale="fixed"
          ar-placement="floor"
          camera-controls=""
          touch-action="pan-y"
          shadow-intensity="1"
          exposure="1"
          {...(sinMovimiento ? {} : { 'auto-rotate': '' })}
          class="min-h-0 w-full flex-1"
        >
          <button
            slot="ar-button"
            type="button"
            className="juguete absolute bottom-6 left-1/2 flex min-h-14 -translate-x-1/2 items-center gap-2 rounded-2xl bg-rojo px-6 font-heading text-xl font-extrabold whitespace-nowrap text-white shadow-[0_4px_0_var(--rojo-oscuro)]"
          >
            <Box aria-hidden className="size-6" strokeWidth={2.5} /> Ponerlo en mi mesa
          </button>
        </model-viewer>
      ) : (
        <div className="grid flex-1 place-items-center text-lg font-semibold text-tinta-suave">Cargando el burrito…</div>
      )}

      <p className="px-6 pb-6 text-center text-base text-tinta-suave">
        {sinAR ? 'Giralo con el mouse. Para verlo en tu mesa, abrí la web desde el celular.' : 'Giralo con el dedo · tocá "Ponerlo en mi mesa" y apuntá a la mesa'}
      </p>
    </div>
  );
}
