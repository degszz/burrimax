import { Camera, X } from 'lucide-react';
import { useEffect, useRef, useState, type PointerEvent as EventoPuntero } from 'react';
import { BurritoConPapas } from './BurritoConPapas';

interface Props {
  doble: boolean;
  tortilla?: string;
  onCerrar: () => void;
}

type Estado = 'pidiendo' | 'lista' | 'sin-permiso' | 'sin-camara';

/**
 * "Ver en mi mesa": la cámara del celular con el burrito encima. Se mueve con
 * un dedo y se agranda pellizcando. No queda anclado a la mesa (eso necesita
 * el modelo 3D, ver docs/Planes/Fase 8), pero anda en cualquier celular.
 */
export function VerEnMiMesa({ doble, tortilla, onCerrar }: Props) {
  const video = useRef<HTMLVideoElement>(null);
  const escena = useRef<HTMLDivElement>(null);
  const burrito = useRef<HTMLDivElement>(null);
  const [estado, setEstado] = useState<Estado>('pidiendo');
  const [pos, setPos] = useState({ x: 0, y: 0, escala: 1 });
  const punteros = useRef(new Map<number, { x: number; y: number }>());
  const [aviso, setAviso] = useState<string | null>(null);

  // Prende la cámara trasera y la apaga al cerrar.
  useEffect(() => {
    let flujo: MediaStream | null = null;
    let cancelado = false;
    if (!navigator.mediaDevices?.getUserMedia) {
      setEstado('sin-camara');
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      .then((s) => {
        if (cancelado) return s.getTracks().forEach((t) => t.stop());
        flujo = s;
        if (video.current) {
          video.current.srcObject = s;
          void video.current.play();
        }
        setEstado('lista');
      })
      .catch((e: DOMException) => setEstado(e.name === 'NotAllowedError' ? 'sin-permiso' : 'sin-camara'));
    return () => {
      cancelado = true;
      flujo?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar();
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [onCerrar]);

  function alApoyar(e: EventoPuntero) {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    punteros.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
  }

  function alMover(e: EventoPuntero) {
    const previo = punteros.current.get(e.pointerId);
    if (!previo) return;
    const otros = [...punteros.current.entries()].filter(([id]) => id !== e.pointerId);
    if (otros.length === 0) {
      // Un dedo: arrastrar.
      setPos((p) => ({ ...p, x: p.x + e.clientX - previo.x, y: p.y + e.clientY - previo.y }));
    } else {
      // Dos dedos: pellizcar para agrandar o achicar.
      const otro = otros[0]![1];
      const antes = Math.hypot(previo.x - otro.x, previo.y - otro.y);
      const ahora = Math.hypot(e.clientX - otro.x, e.clientY - otro.y);
      if (antes > 0) setPos((p) => ({ ...p, escala: Math.min(3, Math.max(0.4, p.escala * (ahora / antes))) }));
    }
    punteros.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
  }

  function alSoltar(e: EventoPuntero) {
    punteros.current.delete(e.pointerId);
  }

  async function sacarFoto() {
    const v = video.current;
    const contenedor = escena.current;
    if (!v || !contenedor || !v.videoWidth) return;

    // El video se muestra "cover": se traduce lo que se ve en pantalla a píxeles del video.
    const marco = contenedor.getBoundingClientRect();
    const escala = Math.max(marco.width / v.videoWidth, marco.height / v.videoHeight);
    const desfaseX = (marco.width - v.videoWidth * escala) / 2;
    const desfaseY = (marco.height - v.videoHeight * escala) / 2;

    const lienzo = document.createElement('canvas');
    lienzo.width = v.videoWidth;
    lienzo.height = v.videoHeight;
    const ctx = lienzo.getContext('2d')!;
    ctx.drawImage(v, 0, 0);
    for (const img of burrito.current?.querySelectorAll('img') ?? []) {
      const r = img.getBoundingClientRect();
      ctx.save();
      ctx.filter = getComputedStyle(img).filter;
      ctx.drawImage(
        img,
        (r.left - marco.left - desfaseX) / escala,
        (r.top - marco.top - desfaseY) / escala,
        r.width / escala,
        r.height / escala,
      );
      ctx.restore();
    }

    const blob = await new Promise<Blob | null>((ok) => lienzo.toBlob(ok, 'image/jpeg', 0.9));
    if (!blob) return;
    const archivo = new File([blob], 'mi-burrito.jpg', { type: 'image/jpeg' });
    if (navigator.canShare?.({ files: [archivo] })) {
      try {
        await navigator.share({ files: [archivo], title: 'Mi burrito' });
        return;
      } catch {
        // canceló el menú de compartir: igual se puede descargar
      }
    }
    const enlace = document.createElement('a');
    enlace.href = URL.createObjectURL(archivo);
    enlace.download = archivo.name;
    enlace.click();
    URL.revokeObjectURL(enlace.href);
    setAviso('¡Foto guardada!');
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="Ver el burrito en tu mesa" className="fixed inset-0 z-[70] bg-black">
      <div ref={escena} className="absolute inset-0 overflow-hidden">
        <video ref={video} playsInline muted className="absolute inset-0 size-full object-cover" />

        {estado === 'lista' && (
          <div
            ref={burrito}
            onPointerDown={alApoyar}
            onPointerMove={alMover}
            onPointerUp={alSoltar}
            onPointerCancel={alSoltar}
            className="absolute bottom-[22%] left-1/2 w-[85%] max-w-md cursor-grab touch-none select-none active:cursor-grabbing"
            style={{ transform: `translate(calc(-50% + ${pos.x}px), ${pos.y}px) scale(${pos.escala})` }}
          >
            <BurritoConPapas doble={doble} tortilla={tortilla} />
          </div>
        )}

        {estado !== 'lista' && (
          <div className="absolute inset-0 grid place-items-center p-8 text-center text-white">
            <p className="max-w-xs text-lg font-bold">
              {estado === 'pidiendo' && 'Abriendo la cámara…'}
              {estado === 'sin-permiso' && 'Para verlo en tu mesa necesitamos permiso para usar la cámara. Activalo en los ajustes del navegador y probá de nuevo.'}
              {estado === 'sin-camara' && 'No pudimos abrir la cámara de este dispositivo.'}
            </p>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onCerrar}
        aria-label="Cerrar la cámara"
        className="juguete absolute top-[max(1rem,env(safe-area-inset-top))] right-4 grid size-12 place-items-center rounded-2xl bg-white"
      >
        <X className="size-6" strokeWidth={2.5} />
      </button>

      {estado === 'lista' && (
        <div className="absolute inset-x-0 bottom-0 px-4 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-center">
          <p aria-live="polite" className="mb-3 inline-block rounded-full bg-black/55 px-3 py-1 text-base font-bold text-white">
            {aviso ?? 'Movelo con el dedo · pellizcá para agrandarlo'}
          </p>
          <button
            type="button"
            onClick={sacarFoto}
            className="juguete mx-auto flex min-h-14 w-full max-w-sm items-center justify-center gap-2 rounded-2xl bg-amarillo font-heading text-xl font-extrabold"
          >
            <Camera aria-hidden className="size-6" strokeWidth={2.5} /> Sacar foto
          </button>
        </div>
      )}
    </div>
  );
}
