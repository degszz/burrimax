import { useState, type ReactNode } from 'react';
import { TIENDA, TITULO_CATEGORIA, type CategoriaSlug, type FilaCombo, type FilaIngrediente, type FilaTamano, type FilaZona, type TablaCatalogo } from '@/lib/catalogo';

interface Props {
  ingredientes: FilaIngrediente[];
  tamanos: FilaTamano[];
  combos: FilaCombo[];
  zonas: FilaZona[];
}

type Pestana = 'ingredientes' | 'tamanos' | 'combos' | 'zonas';

const PESTANAS: { id: Pestana; titulo: string }[] = [
  { id: 'ingredientes', titulo: 'Ingredientes' },
  { id: 'tamanos', titulo: 'Tamaños' },
  { id: 'combos', titulo: 'Combos de la casa' },
  { id: 'zonas', titulo: 'Zonas de envío' },
];

const CATEGORIAS: CategoriaSlug[] = ['tortilla', 'salsa', 'carne', 'vegetal'];

/** Precios, disponibilidad y datos del catálogo. La tienda lo toma en la próxima visita. */
export default function EditorCatalogo({ ingredientes, tamanos, combos, zonas }: Props) {
  const [pestana, setPestana] = useState<Pestana>('ingredientes');
  const sinStock = ingredientes.filter((i) => !i.activo).length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-2xl font-bold">Catálogo</h1>
      <p className="text-zinc-600">Los cambios se ven en la tienda apenas se guardan (en la próxima carga de la página).</p>

      <div role="tablist" aria-label="Secciones del catálogo" className="sticky top-[60px] z-20 -mx-4 mt-4 flex gap-2 overflow-x-auto bg-zinc-100 px-4 py-2">
        {PESTANAS.map((p) => (
          <button
            key={p.id}
            role="tab"
            type="button"
            aria-selected={pestana === p.id}
            onClick={() => setPestana(p.id)}
            className={`h-11 shrink-0 rounded-full px-4 font-semibold ${pestana === p.id ? 'bg-zinc-900 text-white' : 'bg-white'}`}
          >
            {p.titulo}
            {p.id === 'ingredientes' && sinStock > 0 && <span className="ml-1.5 rounded-full bg-red-600 px-2 text-xs text-white">{sinStock} sin stock</span>}
          </button>
        ))}
      </div>

      {pestana === 'ingredientes' &&
        CATEGORIAS.map((cat) => {
          const lista = ingredientes.filter((i) => i.categoria === cat);
          if (!lista.length) return null;
          return (
            <section key={cat} className="mt-5">
              <h2 className="mb-2 text-lg font-bold">{TITULO_CATEGORIA[cat]}</h2>
              <ul className="space-y-2">
                {lista.map((i) => (
                  <Ingrediente key={i.id} inicial={i} />
                ))}
              </ul>
            </section>
          );
        })}

      {pestana === 'tamanos' && (
        <section className="mt-5 space-y-3">
          <p className="rounded-xl bg-amber-50 p-3 text-sm">
            ⚠️ Si cambiás los límites, los combos de la casa que ya no entren dejan de mostrarse en la tienda. El relleno total = carnes + vegetales.
          </p>
          {tamanos.map((t) => (
            <Tamano key={t.id} inicial={t} />
          ))}
        </section>
      )}

      {pestana === 'combos' && (
        <section className="mt-5 space-y-3">
          <p className="text-sm text-zinc-600">El precio de cada combo sale solo de su tamaño + ingredientes. La receta se cambia más adelante desde acá.</p>
          {combos.map((c) => (
            <Combo key={c.id} inicial={c} />
          ))}
        </section>
      )}

      {pestana === 'zonas' && (
        <section className="mt-5 space-y-2">
          {zonas.map((z) => (
            <Zona key={z.id} inicial={z} />
          ))}
        </section>
      )}
    </div>
  );
}

// ─── Guardado ─────────────────────────────────────────────────────────

type Estado = 'quieto' | 'guardando' | 'guardado' | 'error';

/**
 * Una fila editable: guarda solo lo que cambió. `alternar` guarda al instante
 * (para "Disponible", que se usa mucho cuando algo se termina).
 */
function useFila<T extends { id: string }>(tabla: TablaCatalogo, inicial: T) {
  const [guardada, setGuardada] = useState(inicial);
  const [fila, setFila] = useState(inicial);
  const [estado, setEstado] = useState<Estado>('quieto');
  const [error, setError] = useState<string | null>(null);

  const cambios = Object.fromEntries(
    Object.entries(fila).filter(([k, v]) => k !== 'id' && v !== guardada[k as keyof T]),
  ) as Partial<T>;
  const sucio = Object.keys(cambios).length > 0;

  async function enviar(datos: Partial<T>, base: T) {
    setEstado('guardando');
    setError(null);
    try {
      const r = await fetch('/api/catalogo', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ tabla, id: inicial.id, cambios: datos }),
      });
      const res = (await r.json().catch(() => ({}))) as { error?: string };
      if (r.status === 401) {
        window.location.href = '/login';
        return;
      }
      if (!r.ok) {
        setEstado('error');
        setError(res.error ?? 'No se pudo guardar');
        return;
      }
      setGuardada({ ...base, ...datos });
      setEstado('guardado');
      window.setTimeout(() => setEstado((e) => (e === 'guardado' ? 'quieto' : e)), 2000);
    } catch {
      setEstado('error');
      setError('Sin conexión');
    }
  }

  return {
    fila,
    sucio,
    estado,
    error,
    cambiar: <K extends keyof T>(campo: K, valor: T[K]) => setFila((f) => ({ ...f, [campo]: valor })),
    guardar: () => enviar(cambios, guardada),
    descartar: () => {
      setFila(guardada);
      setError(null);
    },
    alternar: (campo: keyof T) => {
      const valor = !fila[campo] as T[keyof T];
      setFila((f) => ({ ...f, [campo]: valor }));
      void enviar({ [campo]: valor } as Partial<T>, guardada);
    },
  };
}

// ─── Piezas de interfaz ───────────────────────────────────────────────

function Interruptor({ encendido, onCambiar, etiqueta, deshabilitado, textos = ["Disponible", "Sin stock"] }: { encendido: boolean; onCambiar: () => void; etiqueta: string; deshabilitado?: boolean; textos?: [string, string] }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={encendido}
      aria-label={etiqueta}
      disabled={deshabilitado}
      onClick={onCambiar}
      className={`flex h-11 shrink-0 items-center gap-2 rounded-full px-3 text-sm font-bold ${encendido ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}
    >
      <span className={`relative h-6 w-11 rounded-full transition ${encendido ? 'bg-green-600' : 'bg-zinc-400'}`}>
        <span className={`absolute top-0.5 size-5 rounded-full bg-white transition-all ${encendido ? 'left-[22px]' : 'left-0.5'}`} />
      </span>
      {encendido ? textos[0] : textos[1]}
    </button>
  );
}

function CampoPesos({ valor, onCambiar, etiqueta }: { valor: number; onCambiar: (n: number) => void; etiqueta: string }) {
  return (
    <label className="flex items-center gap-1">
      <span className="text-sm text-zinc-500">{etiqueta}</span>
      <span className="flex h-11 items-center rounded-lg border bg-white px-2 focus-within:ring-2 focus-within:ring-zinc-900">
        <span className="text-zinc-500">$</span>
        {/* Sin puntos mientras se escribe (el formato movería el cursor). */}
        <input
          inputMode="numeric"
          aria-label={etiqueta}
          value={String(valor)}
          onChange={(e) => onCambiar(Number(e.target.value.replace(/\D/g, '').slice(0, 8) || 0))}
          className="w-24 bg-transparent px-1 text-right text-lg font-semibold tabular-nums outline-none"
        />
      </span>
    </label>
  );
}

function CampoNumero({ valor, onCambiar, etiqueta, min, max }: { valor: number; onCambiar: (n: number) => void; etiqueta: string; min: number; max: number }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm text-zinc-600">{etiqueta}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={valor}
        onChange={(e) => onCambiar(Number(e.target.value))}
        className="h-11 w-24 rounded-lg border bg-white px-2 text-lg font-semibold"
      />
    </label>
  );
}

function BotonesGuardar({ sucio, estado, error, onGuardar, onDescartar }: { sucio: boolean; estado: Estado; error: string | null; onGuardar: () => void; onDescartar: () => void }) {
  return (
    <div className="flex items-center gap-2" aria-live="polite">
      {error && <span className="text-sm font-semibold text-red-700">{error}</span>}
      {estado === 'guardado' && <span className="text-sm font-semibold text-green-700">✓ Guardado</span>}
      {sucio && (
        <>
          <button type="button" onClick={onDescartar} className="h-11 rounded-lg px-3 font-semibold text-zinc-600 hover:bg-zinc-100">
            Deshacer
          </button>
          <button type="button" onClick={onGuardar} disabled={estado === 'guardando'} className="h-11 rounded-lg bg-zinc-900 px-4 font-bold text-white disabled:opacity-50">
            {estado === 'guardando' ? 'Guardando…' : 'Guardar'}
          </button>
        </>
      )}
    </div>
  );
}

function Tarjeta({ apagada, children }: { apagada: boolean; children: ReactNode }) {
  return <div className={`rounded-xl bg-white p-3 ${apagada ? 'opacity-70 ring-2 ring-red-200' : ''}`}>{children}</div>;
}

// ─── Filas ────────────────────────────────────────────────────────────

function Ingrediente({ inicial }: { inicial: FilaIngrediente }) {
  const f = useFila('ingredientes', inicial);
  const i = f.fila;
  return (
    <li>
      <Tarjeta apagada={!i.activo}>
        <div className="flex flex-wrap items-center gap-3">
          {i.imagen_url ? (
            <img src={`${TIENDA}${i.imagen_url}`} alt="" className="size-12 shrink-0 rounded-lg bg-zinc-50 object-contain" loading="lazy" />
          ) : (
            <span className="size-12 shrink-0 rounded-lg bg-zinc-100" />
          )}
          <input
            aria-label="Nombre"
            value={i.nombre}
            onChange={(e) => f.cambiar('nombre', e.target.value)}
            className="h-11 min-w-0 flex-1 rounded-lg border px-3 text-lg font-semibold"
          />
          <CampoPesos etiqueta="Extra" valor={i.precio_extra} onCambiar={(n) => f.cambiar('precio_extra', n)} />
          {i.categoria === 'tortilla' && (
            <label className="flex h-11 items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={i.sin_tacc} onChange={() => f.cambiar('sin_tacc', !i.sin_tacc)} className="size-5" /> Sin TACC
            </label>
          )}
          <Interruptor encendido={i.activo} etiqueta={`${i.nombre}: disponible`} deshabilitado={f.estado === 'guardando'} onCambiar={() => f.alternar('activo')} />
        </div>
        <div className="mt-2 flex justify-end empty:hidden">
          <BotonesGuardar sucio={f.sucio} estado={f.estado} error={f.error} onGuardar={f.guardar} onDescartar={f.descartar} />
        </div>
      </Tarjeta>
    </li>
  );
}

function Tamano({ inicial }: { inicial: FilaTamano }) {
  const f = useFila('tamanos', inicial);
  const t = f.fila;
  return (
    <Tarjeta apagada={!t.activo}>
      <div className="flex flex-wrap items-center gap-3">
        <input aria-label="Nombre" value={t.nombre} onChange={(e) => f.cambiar('nombre', e.target.value)} className="h-11 min-w-0 flex-1 rounded-lg border px-3 text-lg font-bold" />
        <CampoPesos etiqueta="Precio" valor={t.precio_base} onCambiar={(n) => f.cambiar('precio_base', n)} />
        <Interruptor encendido={t.activo} etiqueta={`${t.nombre}: disponible`} deshabilitado={f.estado === 'guardando'} onCambiar={() => f.alternar('activo')} />
      </div>
      <div className="mt-3 flex flex-wrap gap-3">
        <CampoNumero etiqueta="Carne mín." min={1} max={10} valor={t.min_carnes} onCambiar={(n) => f.cambiar('min_carnes', n)} />
        <CampoNumero etiqueta="Carne máx." min={1} max={10} valor={t.max_carnes} onCambiar={(n) => f.cambiar('max_carnes', n)} />
        <CampoNumero etiqueta="Vegetales máx." min={0} max={20} valor={t.max_vegetales} onCambiar={(n) => f.cambiar('max_vegetales', n)} />
        <CampoNumero etiqueta="Salsas máx." min={0} max={10} valor={t.max_salsas} onCambiar={(n) => f.cambiar('max_salsas', n)} />
        <p className="self-end pb-2 text-sm text-zinc-600">
          Relleno total: <b>{t.max_carnes + t.max_vegetales}</b>
        </p>
      </div>
      <div className="mt-2 flex justify-end empty:hidden">
        <BotonesGuardar sucio={f.sucio} estado={f.estado} error={f.error} onGuardar={f.guardar} onDescartar={f.descartar} />
      </div>
    </Tarjeta>
  );
}

function Combo({ inicial }: { inicial: FilaCombo }) {
  // receta es solo lectura: no se manda.
  const f = useFila('productos', inicial);
  const c = f.fila;
  return (
    <Tarjeta apagada={!c.activo}>
      <div className="flex flex-wrap items-center gap-3">
        <input aria-label="Nombre" value={c.nombre} onChange={(e) => f.cambiar('nombre', e.target.value)} className="h-11 min-w-0 flex-1 rounded-lg border px-3 text-lg font-bold" />
        <label className="flex h-11 items-center gap-2 font-semibold">
          <input type="checkbox" checked={c.destacado} onChange={() => f.alternar('destacado')} className="size-5" /> Recomendado
        </label>
        <Interruptor encendido={c.activo} etiqueta={`${c.nombre}: disponible`} deshabilitado={f.estado === 'guardando'} onCambiar={() => f.alternar('activo')} />
      </div>
      <p className="mt-2 text-sm text-zinc-600">{c.receta}</p>
      <textarea
        aria-label="Descripción"
        placeholder="Descripción corta (opcional)"
        value={c.descripcion ?? ''}
        maxLength={200}
        onChange={(e) => f.cambiar('descripcion', e.target.value || null)}
        className="mt-2 min-h-16 w-full rounded-lg border p-2"
      />
      <div className="mt-2 flex justify-end empty:hidden">
        <BotonesGuardar sucio={f.sucio} estado={f.estado} error={f.error} onGuardar={f.guardar} onDescartar={f.descartar} />
      </div>
    </Tarjeta>
  );
}

function Zona({ inicial }: { inicial: FilaZona }) {
  const f = useFila('zonas_envio', inicial);
  const z = f.fila;
  return (
    <Tarjeta apagada={!z.activo}>
      <div className="flex flex-wrap items-center gap-3">
        <input aria-label="Nombre de la zona" value={z.nombre} onChange={(e) => f.cambiar('nombre', e.target.value)} className="h-11 min-w-0 flex-1 rounded-lg border px-3 text-lg font-semibold" />
        <CampoPesos etiqueta="Envío" valor={z.costo} onCambiar={(n) => f.cambiar('costo', n)} />
        <Interruptor encendido={z.activo} textos={["Activa", "Pausada"]} etiqueta={`${z.nombre}: activa`} deshabilitado={f.estado === 'guardando'} onCambiar={() => f.alternar('activo')} />
      </div>
      <div className="mt-2 flex justify-end empty:hidden">
        <BotonesGuardar sucio={f.sucio} estado={f.estado} error={f.error} onGuardar={f.guardar} onDescartar={f.descartar} />
      </div>
    </Tarjeta>
  );
}
