import { useState, type ReactNode } from 'react';
import EditorCombo from './EditorCombo';
import { FotoIngrediente } from './FotoIngrediente';
import { ColorPortada, FotoCombo, Modelo3D } from './SubidasCombos';
import { TITULO_CATEGORIA, type CategoriaSlug, type FilaCombo, type FilaIngrediente, type FilaTamano, type FilaZona, type TablaCatalogo } from '@/lib/catalogo';

interface Props {
  ingredientes: FilaIngrediente[];
  tamanos: FilaTamano[];
  combos: FilaCombo[];
  zonas: FilaZona[];
  /** El burrito en 3D (uno para todos los combos). */
  modelo: { glb: string | null; usdz: string | null };
  /** Fondo de la portada de la tienda (null = el de siempre). */
  colorPortada: string | null;
  /** Fondo de abajo (combos de la casa). */
  colorCatalogo: string | null;
}

type Pestana = 'ingredientes' | 'tamanos' | 'combos' | 'zonas';

const PESTANAS: { id: Pestana; titulo: string; corto: string }[] = [
  { id: 'ingredientes', titulo: 'Ingredientes', corto: 'Ingredientes' },
  { id: 'tamanos', titulo: 'Tamaños', corto: 'Tamaños' },
  { id: 'combos', titulo: 'Combos de la casa', corto: 'Combos' },
  { id: 'zonas', titulo: 'Zonas de envío', corto: 'Zonas de envío' },
];

const CATEGORIAS: CategoriaSlug[] = ['tortilla', 'salsa', 'carne', 'vegetal'];

/** Precios, disponibilidad y datos del catálogo. La tienda lo toma en la próxima visita. */
export default function EditorCatalogo({ ingredientes, tamanos, combos, zonas, modelo, colorPortada, colorCatalogo }: Props) {
  const [pestana, setPestana] = useState<Pestana>('ingredientes');
  // Los nuevos se suman acá sin recargar la página.
  const [listaIngredientes, setListaIngredientes] = useState(ingredientes);
  const sinStock = listaIngredientes.filter((i) => !i.activo).length;
  // Combo abierto para editar la receta ('nuevo' = alta).
  const [editandoCombo, setEditandoCombo] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-2xl font-bold">Catálogo</h1>
      <p className="text-zinc-600">Los cambios se ven en la tienda apenas se guardan (en la próxima carga de la página).</p>

      {/* Celular: las 4 a la vista en dos filas. Tablet/PC: una fila que queda pegada arriba. */}
      <div
        role="tablist"
        aria-label="Secciones del catálogo"
        className="mt-4 grid grid-cols-2 gap-2 sm:sticky sm:top-(--alto-menu) sm:z-20 sm:-mx-4 sm:flex sm:overflow-x-auto sm:bg-zinc-100 sm:px-4 sm:py-2"
      >
        {PESTANAS.map((p) => (
          <button
            key={p.id}
            role="tab"
            type="button"
            aria-selected={pestana === p.id}
            onClick={() => setPestana(p.id)}
            className={`flex h-12 shrink-0 items-center justify-center rounded-full px-4 font-semibold sm:h-11 ${pestana === p.id ? 'bg-zinc-900 text-white' : 'bg-white'}`}
          >
            <span className="sm:hidden">{p.corto}</span>
            <span className="hidden sm:inline">{p.titulo}</span>
            {p.id === 'ingredientes' && sinStock > 0 && (
              <span className="ml-1.5 rounded-full bg-red-600 px-2 text-xs text-white">
                {sinStock}
                <span className="sr-only sm:not-sr-only"> sin stock</span>
              </span>
            )}
          </button>
        ))}
      </div>

      {pestana === 'ingredientes' &&
        CATEGORIAS.map((cat) => {
          const lista = listaIngredientes.filter((i) => i.categoria === cat);
          return (
            <section key={cat} className="mt-5">
              <h2 className="mb-2 text-lg font-bold">{TITULO_CATEGORIA[cat]}</h2>
              <ul className="space-y-2">
                {lista.map((i) => (
                  <Ingrediente key={i.id} inicial={i} />
                ))}
              </ul>
              <AgregarIngrediente categoria={cat} onAgregado={(nuevo) => setListaIngredientes((l) => [...l, nuevo])} />
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
          <p className="text-sm text-zinc-600">
            Los combos aparecen en la tienda debajo de la portada. El precio sale solo de su tamaño + ingredientes.
          </p>
          <ColorPortada portada={colorPortada} catalogo={colorCatalogo} />
          <Modelo3D glb={modelo.glb} />
          {editandoCombo === 'nuevo' ? (
            <EditorCombo tamanos={tamanos} ingredientes={listaIngredientes} onCerrar={() => setEditandoCombo(null)} />
          ) : (
            <button
              type="button"
              onClick={() => setEditandoCombo('nuevo')}
              className="flex h-14 w-full items-center justify-center rounded-2xl border-2 border-dashed border-zinc-400 bg-white text-lg font-bold hover:border-zinc-900"
            >
              + Nuevo combo
            </button>
          )}
          {combos.map((c) =>
            editandoCombo === c.id ? (
              <EditorCombo key={c.id} tamanos={tamanos} ingredientes={listaIngredientes} combo={c} onCerrar={() => setEditandoCombo(null)} />
            ) : (
              <Combo key={c.id} inicial={c} onCambiarReceta={() => setEditandoCombo(c.id)} />
            ),
          )}
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

/** Etiqueta arriba y caja abajo: así queda alineada con el interruptor de al lado. */
function CampoPesos({ valor, onCambiar, etiqueta, opcional = false }: { valor: number; onCambiar: (n: number) => void; etiqueta: string; opcional?: boolean }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm text-zinc-600">{etiqueta}</span>
      <span className="flex h-11 w-fit items-center rounded-lg border bg-white px-2 focus-within:ring-2 focus-within:ring-zinc-900">
        <span className="text-zinc-500">$</span>
        {/* Sin puntos mientras se escribe (el formato movería el cursor). */}
        <input
          inputMode="numeric"
          aria-label={etiqueta}
          value={opcional && valor === 0 ? '' : String(valor)}
          placeholder={opcional ? 'Sin cargo' : '0'}
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
        className="h-11 w-full rounded-lg border bg-white px-2 text-lg font-semibold sm:w-24"
      />
    </label>
  );
}

/** Nombre a lo ancho en el celular; en tablet/PC, todo en una línea. */
function FilaDatos({ nombre, controles }: { nombre: ReactNode; controles: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex min-w-0 flex-1 items-center gap-3">{nombre}</div>
      <div className="flex flex-wrap items-end justify-between gap-3">{controles}</div>
    </div>
  );
}

function CasillaSinTacc({ marcada, onCambiar }: { marcada: boolean; onCambiar: () => void }) {
  // Celular: en su propio renglón, debajo del precio y el interruptor.
  return (
    <label className="order-last flex h-11 basis-full items-center gap-2 text-sm font-semibold sm:order-none sm:basis-auto">
      <input type="checkbox" checked={marcada} onChange={onCambiar} className="size-5" /> Sin TACC
    </label>
  );
}

// Corta a propósito: más ancha que la caja empuja el interruptor abajo en 360 px. Vacío = "Sin cargo".
const etiquetaPrecioExtra = (categoria: CategoriaSlug) => (categoria === 'carne' ? 'Extra por porción' : 'Precio extra');

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
        <FilaDatos
          nombre={
            <>
              <FotoIngrediente imagen={i.imagen_url} color={i.color_hex} />
              <input
                aria-label="Nombre"
                value={i.nombre}
                onChange={(e) => f.cambiar('nombre', e.target.value)}
                className="h-11 min-w-0 flex-1 rounded-lg border px-3 text-lg font-semibold"
              />
            </>
          }
          controles={
            <>
              <CampoPesos etiqueta={etiquetaPrecioExtra(i.categoria)} opcional valor={i.precio_extra} onCambiar={(n) => f.cambiar('precio_extra', n)} />
              {i.categoria === 'tortilla' && <CasillaSinTacc marcada={i.sin_tacc} onCambiar={() => f.cambiar('sin_tacc', !i.sin_tacc)} />}
              <Interruptor encendido={i.activo} etiqueta={`${i.nombre}: disponible`} deshabilitado={f.estado === 'guardando'} onCambiar={() => f.alternar('activo')} />
            </>
          }
        />
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
      <FilaDatos
        nombre={<input aria-label="Nombre" value={t.nombre} onChange={(e) => f.cambiar('nombre', e.target.value)} className="h-11 min-w-0 flex-1 rounded-lg border px-3 text-lg font-bold" />}
        controles={
          <>
            <CampoPesos etiqueta="Precio" valor={t.precio_base} onCambiar={(n) => f.cambiar('precio_base', n)} />
            <Interruptor encendido={t.activo} etiqueta={`${t.nombre}: disponible`} deshabilitado={f.estado === 'guardando'} onCambiar={() => f.alternar('activo')} />
          </>
        }
      />
      <div className="mt-3 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
        <CampoNumero etiqueta="Carne mín." min={1} max={10} valor={t.min_carnes} onCambiar={(n) => f.cambiar('min_carnes', n)} />
        <CampoNumero etiqueta="Carne máx." min={1} max={10} valor={t.max_carnes} onCambiar={(n) => f.cambiar('max_carnes', n)} />
        <CampoNumero etiqueta="Vegetales máx." min={0} max={20} valor={t.max_vegetales} onCambiar={(n) => f.cambiar('max_vegetales', n)} />
        <CampoNumero etiqueta="Salsas máx." min={0} max={10} valor={t.max_salsas} onCambiar={(n) => f.cambiar('max_salsas', n)} />
        <p className="col-span-2 text-sm text-zinc-600 sm:self-end sm:pb-2">
          Relleno total: <b>{t.max_carnes + t.max_vegetales}</b>
        </p>
      </div>
      <div className="mt-2 flex justify-end empty:hidden">
        <BotonesGuardar sucio={f.sucio} estado={f.estado} error={f.error} onGuardar={f.guardar} onDescartar={f.descartar} />
      </div>
    </Tarjeta>
  );
}

function Combo({ inicial, onCambiarReceta }: { inicial: FilaCombo; onCambiarReceta: () => void }) {
  // receta, tamaño e items no cambian acá (no se mandan): la receta se edita con EditorCombo.
  const f = useFila('productos', inicial);
  const c = f.fila;
  return (
    <Tarjeta apagada={!c.activo}>
      <FilaDatos
        nombre={<input aria-label="Nombre" value={c.nombre} onChange={(e) => f.cambiar('nombre', e.target.value)} className="h-11 min-w-0 flex-1 rounded-lg border px-3 text-lg font-bold" />}
        controles={
          <>
            <label className="flex h-11 items-center gap-2 font-semibold">
              <input type="checkbox" checked={c.destacado} onChange={() => f.alternar('destacado')} className="size-5" /> Recomendado
            </label>
            <Interruptor encendido={c.activo} etiqueta={`${c.nombre}: disponible`} deshabilitado={f.estado === 'guardando'} onCambiar={() => f.alternar('activo')} />
          </>
        }
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <p className="min-w-0 flex-1 text-sm text-zinc-600">{c.receta}</p>
        <button type="button" onClick={onCambiarReceta} className="h-11 rounded-xl border-2 border-zinc-900 px-4 font-semibold hover:bg-zinc-100">
          Cambiar receta
        </button>
      </div>
      <textarea
        aria-label="Descripción"
        placeholder="Descripción corta (opcional)"
        value={c.descripcion ?? ''}
        maxLength={200}
        onChange={(e) => f.cambiar('descripcion', e.target.value || null)}
        className="mt-2 min-h-16 w-full rounded-lg border p-2"
      />
      <FotoCombo id={c.id} nombre={c.nombre} inicial={inicial.imagen_url} />
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
      <FilaDatos
        nombre={
          <input aria-label="Nombre de la zona" value={z.nombre} onChange={(e) => f.cambiar('nombre', e.target.value)} className="h-11 min-w-0 flex-1 rounded-lg border px-3 text-lg font-semibold" />
        }
        controles={
          <>
            <CampoPesos etiqueta="Costo de envío" valor={z.costo} onCambiar={(n) => f.cambiar('costo', n)} />
            <Interruptor encendido={z.activo} textos={['Activa', 'Pausada']} etiqueta={`${z.nombre}: activa`} deshabilitado={f.estado === 'guardando'} onCambiar={() => f.alternar('activo')} />
          </>
        }
      />
      <div className="mt-2 flex justify-end empty:hidden">
        <BotonesGuardar sucio={f.sucio} estado={f.estado} error={f.error} onGuardar={f.guardar} onDescartar={f.descartar} />
      </div>
    </Tarjeta>
  );
}

// ─── Alta ─────────────────────────────────────────────────────────────

const NOMBRE_SINGULAR: Record<CategoriaSlug, string> = { tortilla: 'tortilla', salsa: 'salsa', carne: 'carne', vegetal: 'vegetal' };
const EJEMPLO: Record<CategoriaSlug, string> = { tortilla: 'Ej. Integral', salsa: 'Ej. Chipotle', carne: 'Ej. Salmón', vegetal: 'Ej. Palta' };

/**
 * "+ Agregar" de cada categoría. Se crea disponible y sin foto: en la tienda
 * se ve con un círculo de su color hasta que se suba la imagen.
 */
function AgregarIngrediente({ categoria, onAgregado }: { categoria: CategoriaSlug; onAgregado: (fila: FilaIngrediente) => void }) {
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState(0);
  const [color, setColor] = useState('#E9C46A');
  const [sinTacc, setSinTacc] = useState(false);
  const [estado, setEstado] = useState<'quieto' | 'guardando' | 'error'>('quieto');
  const [error, setError] = useState<string | null>(null);

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="mt-2 flex h-12 w-full items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 font-semibold text-zinc-600 hover:border-zinc-500"
      >
        + Agregar {NOMBRE_SINGULAR[categoria]}
      </button>
    );
  }

  async function agregar() {
    setEstado('guardando');
    setError(null);
    try {
      const r = await fetch('/api/ingredientes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ categoria, nombre, precio_extra: precio, color_hex: color, sin_tacc: sinTacc }),
      });
      const res = (await r.json().catch(() => ({}))) as { error?: string; ingrediente?: FilaIngrediente };
      if (r.status === 401) {
        window.location.href = '/login';
        return;
      }
      if (!r.ok || !res.ingrediente) {
        setEstado('error');
        setError(res.error ?? 'No se pudo agregar');
        return;
      }
      onAgregado(res.ingrediente);
      setNombre('');
      setPrecio(0);
      setSinTacc(false);
      setEstado('quieto');
      setAbierto(false);
    } catch {
      setEstado('error');
      setError('Sin conexión');
    }
  }

  return (
    <div className="mt-2 rounded-xl border-2 border-zinc-900 bg-white p-3">
      <p className="font-bold">Nuevo: {NOMBRE_SINGULAR[categoria]}</p>
      <div className="mt-2">
        <FilaDatos
          nombre={
            <>
              <label className="flex shrink-0 items-center" title="Color mientras no haya foto">
                <span className="sr-only">Color</span>
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="size-12 cursor-pointer rounded-full border-2" />
              </label>
              <input
                autoFocus
                aria-label="Nombre"
                placeholder={EJEMPLO[categoria]}
                value={nombre}
                maxLength={60}
                onChange={(e) => setNombre(e.target.value)}
                className="h-11 min-w-0 flex-1 rounded-lg border px-3 text-lg font-semibold"
              />
            </>
          }
          controles={
            <>
              <CampoPesos etiqueta={etiquetaPrecioExtra(categoria)} opcional valor={precio} onCambiar={setPrecio} />
              {categoria === 'tortilla' && <CasillaSinTacc marcada={sinTacc} onCambiar={() => setSinTacc((v) => !v)} />}
            </>
          }
        />
      </div>
      <p className="mt-2 text-sm text-zinc-600">Se agrega disponible. Sin foto, la tienda lo muestra con un círculo de este color.</p>
      {error && <p className="mt-1 font-semibold text-red-700">{error}</p>}
      <div className="mt-3 flex justify-end gap-2">
        <button type="button" onClick={() => setAbierto(false)} className="h-11 rounded-lg px-4 font-semibold text-zinc-600 hover:bg-zinc-100">
          Cancelar
        </button>
        <button
          type="button"
          onClick={agregar}
          disabled={nombre.trim().length < 2 || estado === 'guardando'}
          className="h-11 rounded-lg bg-zinc-900 px-5 font-bold text-white disabled:opacity-40"
        >
          {estado === 'guardando' ? 'Agregando…' : 'Agregar'}
        </button>
      </div>
    </div>
  );
}
