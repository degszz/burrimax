import { useRef, useState } from 'react';
import { TIENDA } from '@/lib/catalogo';
import { achicarFoto, quitarArchivo, subirArchivo } from '@/lib/subir';

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

/**
 * El burrito escaneado en 3D: uno solo, para todos los combos. Antes de subirlo
 * se pone en tamaño real con el largo que mide Max (las apps de escaneo no
 * siempre lo guardan bien) y se apoya en la mesa.
 */
export function Modelo3D({ glb }: { glb: string | null }) {
  const [url, setUrl] = useState(glb);
  const [largo, setLargo] = useState('');
  const [estado, setEstado] = useState<Estado>({ tipo: 'quieto' });
  const [nota, setNota] = useState<string | null>(null);
  const entrada = useRef<HTMLInputElement>(null);
  const cm = Number(largo.replace(',', '.'));
  const largoOk = cm >= 5 && cm <= 100;

  async function elegir(archivo: File | undefined) {
    if (!archivo) return;
    setNota(null);
    if (!archivo.name.toLowerCase().endsWith('.glb')) {
      setEstado({ tipo: 'error', mensaje: 'Elegí el archivo .glb que exporta la app de escaneo' });
      return;
    }
    if (archivo.size > 50 * 1024 * 1024) {
      setEstado({ tipo: 'error', mensaje: 'Pesa más de 50 MB: exportalo en calidad media' });
      return;
    }
    setEstado({ tipo: 'subiendo' });
    try {
      const { ajustarModelo } = await import('@/lib/modelo');
      const ajustado = await ajustarModelo(archivo, cm).catch(() => null);
      if (!ajustado) setNota('No pudimos ajustar el tamaño de este archivo: se subió tal cual.');
      else if (Math.abs(ajustado.largoOriginalCm - cm) > cm * 0.15) {
        setNota(`El escaneo medía ${Math.round(ajustado.largoOriginalCm)} cm: lo dejamos en ${cm} cm, el tamaño real.`);
      }
      setUrl(await subirArchivo('glb', ajustado?.archivo ?? archivo, 'glb'));
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
      await quitarArchivo('glb');
      await quitarArchivo('usdz');
      setUrl(null);
      setEstado({ tipo: 'listo' });
    } catch (e) {
      setEstado({ tipo: 'error', mensaje: mensaje(e) });
    }
  }

  return (
    <section className="rounded-2xl border-2 border-zinc-900 bg-white p-4">
      <h2 className="text-lg font-bold">Burrito en 3D</h2>
      <p className="text-sm text-zinc-600">
        Uno solo para todos los combos. Con el modelo cargado, la tienda muestra "Verlo en 3D" (girarlo, acercarlo y ponerlo en la mesa
        en tamaño real) en los combos y al terminar de armar. Cómo escanearlo: docs, guía "Escaneo 3D del burrito".
      </p>
      <p className="mt-2 font-semibold">{url ? '✓ Modelo cargado' : 'Todavía no hay modelo'}</p>

      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="block font-semibold">Largo real (cm)</span>
          <span className="block text-sm text-zinc-500">Medí con una regla lo más largo de lo que escaneaste</span>
          <input
            inputMode="decimal"
            value={largo}
            onChange={(e) => setLargo(e.target.value)}
            placeholder="Ej. 22"
            className="mt-1 h-12 w-32 rounded-lg border px-3 text-lg"
          />
        </label>
        <label
          className={`flex h-12 cursor-pointer items-center rounded-xl border-2 border-zinc-900 bg-white px-4 font-semibold hover:bg-zinc-100 ${!largoOk || estado.tipo === 'subiendo' ? 'pointer-events-none opacity-40' : ''}`}
        >
          {url ? 'Cambiar modelo (.glb)' : 'Subir modelo (.glb)'}
          <input ref={entrada} type="file" accept=".glb" disabled={!largoOk} className="sr-only" onChange={(e) => elegir(e.target.files?.[0])} />
        </label>
        {url && (
          <button type="button" onClick={quitar} disabled={estado.tipo === 'subiendo'} className="h-12 rounded-xl px-3 font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">
            Quitar modelo
          </button>
        )}
      </div>
      {!largoOk && <p className="mt-1 text-sm text-zinc-500">Primero poné el largo (entre 5 y 100 cm).</p>}
      {nota && <p className="mt-2 text-sm font-semibold text-amber-700">{nota}</p>}
      <div className="mt-1">
        <Aviso estado={estado} />
      </div>
    </section>
  );
}
