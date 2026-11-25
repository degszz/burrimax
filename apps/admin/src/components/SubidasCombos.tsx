import { useRef, useState } from 'react';
import { TIENDA } from '@/lib/catalogo';
import { achicarFoto, quitarArchivo, subirArchivo, type DestinoSubida } from '@/lib/subir';

type Estado = { tipo: 'quieto' } | { tipo: 'subiendo' } | { tipo: 'listo' } | { tipo: 'error'; mensaje: string };

function Aviso({ estado }: { estado: Estado }) {
  if (estado.tipo === 'subiendo') return <p className="text-sm font-semibold text-zinc-600" aria-live="polite">Subiendo…</p>;
  if (estado.tipo === 'listo') return <p className="text-sm font-semibold text-green-700" aria-live="polite">✓ Guardado. La tienda ya lo muestra.</p>;
  if (estado.tipo === 'error') return <p role="alert" className="text-sm font-semibold text-red-700">{estado.mensaje}</p>;
  return null;
}

const mensaje = (e: unknown) => (e instanceof Error ? e.message : 'No se pudo subir');

/**
 * Foto del burrito de un combo. Las papas las agrega la tienda, así que la foto
 * es solo el burrito (ideal: PNG o WebP con fondo transparente).
 */
export function FotoCombo({ id, nombre, inicial }: { id: string; nombre: string; inicial: string | null }) {
  const [url, setUrl] = useState(inicial);
  const [estado, setEstado] = useState<Estado>({ tipo: 'quieto' });
  const entrada = useRef<HTMLInputElement>(null);

  async function elegir(archivo: File | undefined) {
    if (!archivo) return;
    setEstado({ tipo: 'subiendo' });
    try {
      const foto = await achicarFoto(archivo);
      setUrl(await subirArchivo('combo', foto, 'webp', id));
      setEstado({ tipo: 'listo' });
    } catch (e) {
      setEstado({ tipo: 'error', mensaje: mensaje(e) });
    } finally {
      if (entrada.current) entrada.current.value = '';
    }
  }

  async function quitar() {
    setEstado({ tipo: 'subiendo' });
    try {
      await quitarArchivo('combo', id);
      setUrl(null);
      setEstado({ tipo: 'listo' });
    } catch (e) {
      setEstado({ tipo: 'error', mensaje: mensaje(e) });
    }
  }

  return (
    <div className="mt-3 flex items-center gap-3 rounded-xl bg-zinc-50 p-2">
      <img
        src={url ?? `${TIENDA}/armador/burrito-cerrado.avif`}
        alt={`Foto de ${nombre}`}
        className="size-20 shrink-0 rounded-lg bg-white object-contain"
      />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm text-zinc-600">{url ? 'Foto propia del combo' : 'Usa la foto de siempre'} · las papas se suman solas</p>
        <div className="flex flex-wrap gap-2">
          <label className={`flex h-11 cursor-pointer items-center rounded-xl border-2 border-zinc-900 bg-white px-4 font-semibold hover:bg-zinc-100 ${estado.tipo === 'subiendo' ? 'pointer-events-none opacity-50' : ''}`}>
            {url ? 'Cambiar foto' : 'Subir foto'}
            <input
              ref={entrada}
              type="file"
              accept="image/png,image/webp,image/jpeg,image/avif"
              className="sr-only"
              onChange={(e) => elegir(e.target.files?.[0])}
            />
          </label>
          {url && (
            <button type="button" onClick={quitar} disabled={estado.tipo === 'subiendo'} className="h-11 rounded-xl px-3 font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">
              Quitar foto
            </button>
          )}
        </div>
        <Aviso estado={estado} />
      </div>
    </div>
  );
}

/** El burrito escaneado en 3D: uno solo, para todos los combos. */
export function Modelo3D({ glb, usdz }: { glb: string | null; usdz: string | null }) {
  return (
    <section className="rounded-2xl border-2 border-zinc-900 bg-white p-4">
      <h2 className="text-lg font-bold">Burrito en 3D</h2>
      <p className="text-sm text-zinc-600">
        Uno solo para todos los combos. Con el .glb la tienda muestra el botón "Verlo en 3D" (girarlo, acercarlo y, en Android, verlo en tu
        mesa). El .usdz es para ver en tu mesa desde iPhone.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <ArchivoModelo destino="glb" titulo="Modelo .glb (web y Android)" inicial={glb} />
        <ArchivoModelo destino="usdz" titulo="Modelo .usdz (iPhone, opcional)" inicial={usdz} />
      </div>
    </section>
  );
}

function ArchivoModelo({ destino, titulo, inicial }: { destino: Extract<DestinoSubida, 'glb' | 'usdz'>; titulo: string; inicial: string | null }) {
  const [url, setUrl] = useState(inicial);
  const [estado, setEstado] = useState<Estado>({ tipo: 'quieto' });
  const entrada = useRef<HTMLInputElement>(null);

  async function elegir(archivo: File | undefined) {
    if (!archivo) return;
    const extension = archivo.name.split('.').pop()?.toLowerCase() ?? '';
    if (extension !== destino) {
      setEstado({ tipo: 'error', mensaje: `Elegí un archivo .${destino}` });
      return;
    }
    if (archivo.size > 50 * 1024 * 1024) {
      setEstado({ tipo: 'error', mensaje: 'Pesa más de 50 MB: exportalo más liviano' });
      return;
    }
    setEstado({ tipo: 'subiendo' });
    try {
      setUrl(await subirArchivo(destino, archivo, destino));
      setEstado({ tipo: 'listo' });
    } catch (e) {
      setEstado({ tipo: 'error', mensaje: mensaje(e) });
    } finally {
      if (entrada.current) entrada.current.value = '';
    }
  }

  async function quitar() {
    setEstado({ tipo: 'subiendo' });
    try {
      await quitarArchivo(destino);
      setUrl(null);
      setEstado({ tipo: 'listo' });
    } catch (e) {
      setEstado({ tipo: 'error', mensaje: mensaje(e) });
    }
  }

  return (
    <div className="space-y-2 rounded-xl bg-zinc-50 p-3">
      <p className="font-semibold">{titulo}</p>
      <p className="text-sm text-zinc-600">{url ? '✓ Cargado' : 'Sin cargar'}</p>
      <div className="flex flex-wrap gap-2">
        <label className={`flex h-11 cursor-pointer items-center rounded-xl border-2 border-zinc-900 bg-white px-4 font-semibold hover:bg-zinc-100 ${estado.tipo === 'subiendo' ? 'pointer-events-none opacity-50' : ''}`}>
          {url ? 'Cambiar archivo' : 'Subir archivo'}
          <input ref={entrada} type="file" accept={`.${destino}`} className="sr-only" onChange={(e) => elegir(e.target.files?.[0])} />
        </label>
        {url && (
          <button type="button" onClick={quitar} disabled={estado.tipo === 'subiendo'} className="h-11 rounded-xl px-3 font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">
            Quitar
          </button>
        )}
      </div>
      <Aviso estado={estado} />
    </div>
  );
}
