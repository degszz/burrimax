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

/** Tonos sacados del logo, todos claros para que el texto se lea bien. */
const TONOS = [
  { nombre: 'Arena', color: '#F7E4B9' },
  { nombre: 'Mostaza suave', color: '#FCE3A0' },
  { nombre: 'Durazno', color: '#FAD7C3' },
  { nombre: 'Crema', color: '#FFF8EC' },
  { nombre: 'Verde suave', color: '#E4F1D7' },
  { nombre: 'Blanco', color: '#FFFFFF' },
];
const PORTADA = '#F7E4B9';
const CATALOGO = '#FFF8EC';

/** Qué tan clara es (0 negro, 1 blanco): con fondos oscuros el texto marrón no se lee. */
function claridad(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function ElegirColor({ titulo, ayuda, color, onCambiar }: { titulo: string; ayuda: string; color: string; onCambiar: (c: string) => void }) {
  return (
    <fieldset>
      <legend className="font-bold">{titulo}</legend>
      <p className="text-sm text-zinc-600">{ayuda}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {TONOS.map((t) => {
          const elegido = color.toLowerCase() === t.color.toLowerCase();
          return (
            <button
              key={t.color}
              type="button"
              aria-pressed={elegido}
              onClick={() => onCambiar(t.color)}
              className={`flex h-12 items-center gap-2 rounded-xl border-2 px-3 font-semibold ${elegido ? 'border-zinc-900' : 'border-zinc-200'}`}
            >
              <span aria-hidden className="size-6 rounded-full border border-zinc-400" style={{ backgroundColor: t.color }} />
              {t.nombre}
            </button>
          );
        })}
        <label className="flex h-12 cursor-pointer items-center gap-2 rounded-xl border-2 border-zinc-200 px-3 font-semibold">
          <input type="color" value={color} onChange={(e) => onCambiar(e.target.value)} className="size-7 cursor-pointer" />
          Otro
        </label>
      </div>
    </fieldset>
  );
}

/** Colores de fondo de la tienda: la portada (arriba) y el catálogo de combos (abajo). */
export function ColorPortada({ portada, catalogo }: { portada: string | null; catalogo: string | null }) {
  const [guardados, setGuardados] = useState({ portada: portada ?? PORTADA, catalogo: catalogo ?? CATALOGO });
  const [colores, setColores] = useState(guardados);
  const [estado, setEstado] = useState<Estado>({ tipo: 'quieto' });
  const muyOscuro = claridad(colores.portada) < 0.6 || claridad(colores.catalogo) < 0.6;
  const sinCambios = colores.portada === guardados.portada && colores.catalogo === guardados.catalogo;

  async function guardar() {
    setEstado({ tipo: 'subiendo' });
    try {
      const r = await fetch('/api/config/portada', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(colores) });
      const res = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) throw new Error(res.error ?? 'No se pudo guardar');
      setGuardados(colores);
      setEstado({ tipo: 'listo' });
    } catch (e) {
      setEstado({ tipo: 'error', mensaje: mensaje(e) });
    }
  }

  return (
    <section className="rounded-2xl border-2 border-zinc-900 bg-white p-4">
      <h2 className="text-lg font-bold">Colores de la tienda</h2>
      <div className="mt-3">
        <ElegirColor titulo="Portada (arriba)" ayuda="El fondo del título y la muestra para armar." color={colores.portada} onCambiar={(c) => setColores({ ...colores, portada: c })} />
      </div>
      <div className="mt-4 border-t border-zinc-200 pt-4">
        <ElegirColor titulo="Catálogo (abajo)" ayuda="El fondo de los combos de la casa, debajo del borde de ticket." color={colores.catalogo} onCambiar={(c) => setColores({ ...colores, catalogo: c })} />
      </div>

      {/* Vista previa: portada, borde de ticket y catálogo */}
      <div className="mt-4 overflow-hidden rounded-xl border">
        <div className="px-4 pt-3 pb-5 font-bold text-[#2B1B12]" style={{ backgroundColor: colores.portada }}>
          Burrito a tu Gusto
        </div>
        <div style={{ backgroundColor: colores.portada }}>
          <div className="borde-ticket h-[10px]" style={{ backgroundColor: colores.catalogo }} />
        </div>
        <div className="px-4 pt-2 pb-3 text-sm font-semibold text-[#2B1B12]" style={{ backgroundColor: colores.catalogo }}>
          Combos de la casa…
        </div>
      </div>
      {muyOscuro && <p className="mt-2 text-sm font-semibold text-red-700">Hay un color muy oscuro: el texto no se leería. Elegí uno más claro.</p>}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={guardar}
          disabled={muyOscuro || sinCambios || estado.tipo === 'subiendo'}
          className="h-12 rounded-xl bg-zinc-900 px-6 text-lg font-bold text-white disabled:opacity-40"
        >
          {estado.tipo === 'subiendo' ? 'Guardando…' : 'Guardar colores'}
        </button>
        <Aviso estado={estado} />
      </div>
    </section>
  );
}
