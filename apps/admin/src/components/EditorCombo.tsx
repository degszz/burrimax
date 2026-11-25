import { precioVistaPrevia, validarArmado } from '@burritos/shared';
import { useMemo, useState } from 'react';
import { armadoDesdeReceta, catalogoDesdeFilas, TITULO_CATEGORIA, type CategoriaSlug, type FilaCombo, type FilaIngrediente, type FilaTamano } from '@/lib/catalogo';
import { textoErrorArmado } from '@/lib/combos';
import { FotoIngrediente } from './FotoIngrediente';

interface Props {
  tamanos: FilaTamano[];
  ingredientes: FilaIngrediente[];
  /** Sin combo: alta de uno nuevo. */
  combo?: FilaCombo;
  onCerrar: () => void;
}

const CATEGORIAS: CategoriaSlug[] = ['tortilla', 'salsa', 'carne', 'vegetal'];
const pesos = (n: number) => `$${n.toLocaleString('es-AR')}`;

/**
 * Alta o cambio de receta de un combo de la casa: tamaño e ingredientes, con
 * los mismos límites que el armador de la tienda. El precio se calcula solo.
 */
export default function EditorCombo({ tamanos, ingredientes, combo, onCerrar }: Props) {
  const disponibles = tamanos.filter((t) => t.activo || t.id === combo?.tamano_id);
  const [nombre, setNombre] = useState(combo?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(combo?.descripcion ?? '');
  const [tamanoId, setTamanoId] = useState(combo?.tamano_id ?? disponibles[0]?.id ?? '');
  const [porciones, setPorciones] = useState<Map<string, number>>(
    () => new Map((combo?.items ?? []).map((i) => [i.ingrediente_id, i.porciones])),
  );
  const [estado, setEstado] = useState<'quieto' | 'guardando' | 'error'>('quieto');
  const [mensaje, setMensaje] = useState<string | null>(null);

  const catalogo = useMemo(() => catalogoDesdeFilas(tamanos, ingredientes), [tamanos, ingredientes]);
  const tamano = tamanos.find((t) => t.id === tamanoId);
  const items = [...porciones].map(([ingrediente_id, n]) => ({ ingrediente_id, porciones: n }));
  const armado = armadoDesdeReceta(tamanoId, items, ingredientes);
  const errores = tamanoId ? validarArmado(armado, catalogo) : [];
  const problema = !tamanoId ? 'Elegí el tamaño' : errores[0] ? textoErrorArmado(errores[0], catalogo) : nombre.trim().length < 2 ? 'Poné un nombre' : null;
  const precio = precioVistaPrevia(armado, catalogo);

  const maximo: Record<CategoriaSlug, number> = {
    tortilla: 1,
    salsa: tamano?.max_salsas ?? 0,
    carne: tamano?.max_carnes ?? 0,
    vegetal: tamano?.max_vegetales ?? 0,
  };
  const elegidosEn = (cat: CategoriaSlug) =>
    ingredientes.filter((i) => i.categoria === cat).reduce((total, i) => total + (porciones.get(i.id) ?? 0), 0);

  function alternar(ingrediente: FilaIngrediente) {
    const nuevo = new Map(porciones);
    if (nuevo.has(ingrediente.id)) nuevo.delete(ingrediente.id);
    else {
      // Tortilla: una sola (elegir otra reemplaza la anterior).
      if (ingrediente.categoria === 'tortilla') for (const i of ingredientes) if (i.categoria === 'tortilla') nuevo.delete(i.id);
      nuevo.set(ingrediente.id, 1);
    }
    setPorciones(nuevo);
  }

  function cambiarPorciones(id: string, delta: number) {
    const nuevo = new Map(porciones);
    const n = (nuevo.get(id) ?? 0) + delta;
    if (n <= 0) nuevo.delete(id);
    else nuevo.set(id, n);
    setPorciones(nuevo);
  }

  async function guardar() {
    if (problema) return;
    setEstado('guardando');
    setMensaje(null);
    try {
      const r = await fetch('/api/combos', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: combo?.id ?? null, nombre, descripcion: descripcion.trim() || null, tamano_id: tamanoId, items }),
      });
      const res = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) {
        setEstado('error');
        setMensaje(res.error ?? 'No se pudo guardar');
        return;
      }
      window.location.reload(); // la lista vuelve con la receta y el precio nuevos
    } catch {
      setEstado('error');
      setMensaje('Sin conexión: no se guardó');
    }
  }

  return (
    <div className="rounded-2xl border-2 border-zinc-900 bg-white p-4">
      <h2 className="text-xl font-bold">{combo ? `Receta de ${combo.nombre}` : 'Nuevo combo'}</h2>

      <label className="mt-3 block font-bold" htmlFor="combo-nombre">
        Nombre
      </label>
      <input
        id="combo-nombre"
        value={nombre}
        maxLength={60}
        placeholder="Ej. Pollo picante"
        onChange={(e) => setNombre(e.target.value)}
        className="mt-1 h-12 w-full rounded-lg border px-3 text-lg"
      />
      <label className="mt-3 block font-bold" htmlFor="combo-descripcion">
        Descripción <span className="font-normal text-zinc-500">(opcional)</span>
      </label>
      <textarea
        id="combo-descripcion"
        value={descripcion}
        maxLength={200}
        onChange={(e) => setDescripcion(e.target.value)}
        className="mt-1 min-h-16 w-full rounded-lg border p-2"
      />

      <fieldset className="mt-4">
        <legend className="font-bold">Tamaño</legend>
        <div className="mt-1 flex flex-wrap gap-2">
          {disponibles.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={t.id === tamanoId}
              onClick={() => setTamanoId(t.id)}
              className={`h-12 rounded-xl border-2 px-4 font-semibold ${t.id === tamanoId ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-300 bg-white'}`}
            >
              {t.nombre} · {pesos(t.precio_base)}
            </button>
          ))}
        </div>
      </fieldset>

      {CATEGORIAS.map((cat) => {
        const lista = ingredientes.filter((i) => i.categoria === cat && (i.activo || porciones.has(i.id)));
        const elegidos = elegidosEn(cat);
        const ayuda =
          cat === 'tortilla'
            ? 'Elegí 1'
            : cat === 'carne'
              ? `Porciones: de ${tamano?.min_carnes ?? 1} a ${maximo.carne}`
              : `Hasta ${maximo[cat]}`;
        return (
          <fieldset key={cat} className="mt-4">
            <legend className="flex w-full items-baseline justify-between gap-2">
              <span className="font-bold">{TITULO_CATEGORIA[cat]}</span>
              <span className={`text-sm ${elegidos > maximo[cat] ? 'font-bold text-red-700' : 'text-zinc-500'}`}>
                {ayuda} · {elegidos} elegid{cat === 'carne' ? 'as' : 'os'}
              </span>
            </legend>
            <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {lista.map((i) => {
                const n = porciones.get(i.id) ?? 0;
                const sinStock = !i.activo;
                if (cat === 'carne') {
                  return (
                    <div key={i.id} className={`flex min-h-14 items-center gap-2 rounded-xl border-2 p-1.5 ${n ? 'border-zinc-900' : 'border-zinc-200'}`}>
                      <FotoIngrediente imagen={i.imagen_url} color={i.color_hex} className="size-9" />
                      <span className="min-w-0 flex-1 truncate font-semibold">
                        {i.nombre}
                        {sinStock && <span className="block text-xs text-red-700">Sin stock</span>}
                      </span>
                      <button type="button" aria-label={`Una porción menos de ${i.nombre}`} disabled={!n} onClick={() => cambiarPorciones(i.id, -1)} className="size-10 rounded-lg bg-zinc-100 text-xl font-bold disabled:opacity-30">
                        −
                      </button>
                      <span className="w-5 text-center text-lg font-bold" aria-live="polite">
                        {n}
                      </span>
                      <button type="button" aria-label={`Una porción más de ${i.nombre}`} disabled={sinStock} onClick={() => cambiarPorciones(i.id, 1)} className="size-10 rounded-lg bg-zinc-100 text-xl font-bold disabled:opacity-30">
                        +
                      </button>
                    </div>
                  );
                }
                return (
                  <button
                    key={i.id}
                    type="button"
                    aria-pressed={n > 0}
                    onClick={() => alternar(i)}
                    className={`flex min-h-14 items-center gap-2 rounded-xl border-2 p-1.5 text-left ${n ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 bg-white'}`}
                  >
                    <FotoIngrediente imagen={i.imagen_url} color={i.color_hex} className="size-9" />
                    <span className="min-w-0 flex-1 truncate font-semibold">
                      {i.nombre}
                      {sinStock && <span className="block text-xs text-red-500">Sin stock</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        );
      })}

      <div className="sticky bottom-(--alto-nav) z-10 -mx-4 mt-5 -mb-4 rounded-b-2xl border-t bg-white/95 p-4 backdrop-blur">
        <div className="flex flex-wrap items-center gap-3">
          <div className="mr-auto">
            <p className="text-sm text-zinc-500">Precio en la tienda</p>
            <p className="text-2xl font-bold">{pesos(precio)}</p>
          </div>
          <button type="button" onClick={onCerrar} className="h-12 rounded-xl px-4 font-semibold hover:bg-zinc-100">
            Cancelar
          </button>
          <button
            type="button"
            onClick={guardar}
            disabled={!!problema || estado === 'guardando'}
            className="h-12 rounded-xl bg-zinc-900 px-6 text-lg font-bold text-white disabled:opacity-40"
          >
            {estado === 'guardando' ? 'Guardando…' : combo ? 'Guardar receta' : 'Crear combo'}
          </button>
        </div>
        {(problema || mensaje) && (
          <p role="alert" className="mt-2 font-semibold text-red-700">
            {mensaje ?? problema}
          </p>
        )}
      </div>
    </div>
  );
}
