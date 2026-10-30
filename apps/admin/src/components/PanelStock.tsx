import { useMemo, useState } from 'react';
import { TITULO_CATEGORIA, type CategoriaSlug, type FilaIngrediente } from '@/lib/catalogo';
import { FotoIngrediente } from './FotoIngrediente';

const CATEGORIAS: CategoriaSlug[] = ['tortilla', 'salsa', 'carne', 'vegetal'];

/**
 * Stock durante el servicio: un toque por ingrediente para "Hay / No hay".
 * Lo que no hay desaparece del armador de la tienda al instante (en la
 * próxima carga), y los carritos que lo tenían lo sacan solos.
 */
export default function PanelStock({ ingredientes }: { ingredientes: FilaIngrediente[] }) {
  const [lista, setLista] = useState(ingredientes);
  const [soloSinStock, setSoloSinStock] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [ocupados, setOcupados] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const sinStock = lista.filter((i) => !i.activo);
  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return lista.filter((i) => (!soloSinStock || !i.activo) && (!q || i.nombre.toLowerCase().includes(q)));
  }, [lista, soloSinStock, busqueda]);

  async function guardar(ids: string[], activo: boolean) {
    const antes = lista;
    setError(null);
    setOcupados((o) => new Set([...o, ...ids]));
    // Se ve al instante; si falla, se vuelve atrás.
    setLista((l) => l.map((i) => (ids.includes(i.id) ? { ...i, activo } : i)));
    try {
      const r = await fetch('/api/stock', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ids, activo }) });
      if (r.status === 401) {
        window.location.href = '/login';
        return;
      }
      if (!r.ok) throw new Error();
    } catch {
      setLista(antes);
      setError('No se pudo guardar. Revisá la conexión y probá de nuevo.');
    } finally {
      setOcupados((o) => {
        const copia = new Set(o);
        ids.forEach((id) => copia.delete(id));
        return copia;
      });
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Stock</h1>
          <p className="text-zinc-600">Tocá para marcar lo que se terminó. Desaparece de la tienda enseguida.</p>
        </div>
        {sinStock.length > 0 && (
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`¿Volver a poner disponibles los ${sinStock.length} que faltan?`)) void guardar(sinStock.map((i) => i.id), true);
            }}
            className="h-12 rounded-xl bg-green-600 px-4 font-bold text-white"
          >
            Poner todo disponible
          </button>
        )}
      </div>

      <div className={`mt-4 rounded-2xl p-4 ${sinStock.length ? 'bg-red-50' : 'bg-green-50'}`}>
        {sinStock.length === 0 ? (
          <p className="text-lg font-bold text-green-800">✓ Hay de todo</p>
        ) : (
          <>
            <p className="text-lg font-bold text-red-800">
              {sinStock.length} sin stock: {sinStock.map((i) => i.nombre).join(', ')}
            </p>
            <p className="mt-1 text-sm text-red-700">
              {CATEGORIAS.map((c) => [c, sinStock.filter((i) => i.categoria === c).length] as const)
                .filter(([, n]) => n > 0)
                .map(([c, n]) => `${TITULO_CATEGORIA[c]}: ${n}`)
                .join(' · ')}
            </p>
          </>
        )}
      </div>

      <div className="sticky top-[60px] z-20 -mx-4 mt-4 flex flex-wrap items-center gap-2 bg-zinc-100 px-4 py-2">
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar (ej. palta)"
          aria-label="Buscar ingrediente"
          className="h-12 min-w-0 flex-1 rounded-xl border bg-white px-3 text-lg"
        />
        <button
          type="button"
          aria-pressed={soloSinStock}
          onClick={() => setSoloSinStock((v) => !v)}
          className={`h-12 rounded-xl px-4 font-semibold ${soloSinStock ? 'bg-zinc-900 text-white' : 'bg-white'}`}
        >
          Solo sin stock
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 font-semibold text-red-700">
          {error}
        </p>
      )}

      {CATEGORIAS.map((cat) => {
        const items = visibles.filter((i) => i.categoria === cat);
        if (!items.length) return null;
        return (
          <section key={cat} className="mt-5">
            <h2 className="mb-2 text-lg font-bold">{TITULO_CATEGORIA[cat]}</h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {items.map((i) => (
                <li key={i.id}>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={i.activo}
                    disabled={ocupados.has(i.id)}
                    onClick={() => void guardar([i.id], !i.activo)}
                    className={`flex min-h-16 w-full items-center gap-3 rounded-xl border-2 p-2 text-left transition ${
                      i.activo ? 'border-transparent bg-white' : 'border-red-300 bg-red-50'
                    }`}
                  >
                    <span className={i.activo ? '' : 'opacity-50 grayscale'}>
                      <FotoIngrediente imagen={i.imagen_url} color={i.color_hex} />
                    </span>
                    <span className="min-w-0 flex-1 text-lg font-semibold">{i.nombre}</span>
                    <span className={`rounded-full px-3 py-1.5 text-sm font-bold ${i.activo ? 'bg-green-100 text-green-800' : 'bg-red-600 text-white'}`}>
                      {i.activo ? 'Hay' : 'No hay'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      {visibles.length === 0 && <p className="py-10 text-center text-zinc-500">{soloSinStock ? 'No falta nada 🎉' : 'No hay ingredientes con ese nombre'}</p>}
    </div>
  );
}
