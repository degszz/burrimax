import { precioVistaPrevia, type Armado, type Catalogo, type CategoriaSlug } from '@burritos/shared';
import { Camera, Check, HeartPlus, Minus, Plus, ShoppingBag, WheatOff } from 'lucide-react';
import { useState } from 'react';
import { CATEGORIA_DEL_PASO, describir, type PasoDeCategoria } from '@/lib/armador/reglas';
import { formatoPesos } from '@/lib/formato';
import { BurritoConPapas } from './BurritoConPapas';
import { ImagenIngrediente } from './ImagenIngrediente';
import { VerEnMiMesa } from './VerEnMiMesa';

interface Props {
  armado: Armado;
  catalogo: Catalogo;
  /** Lo que se está escribiendo, sin recortar. */
  nombre: string;
  editando: boolean;
  onCambiar: (paso: PasoDeCategoria) => void;
  onCantidad: (cantidad: number) => void;
  onNombre: (nombre: string) => void;
  onAgregar: () => void;
  onGuardar: () => void;
}

const ETIQUETAS: Record<CategoriaSlug, string> = { tortilla: 'Tortilla', salsa: 'Salsas', carne: 'Carne', vegetal: 'Vegetales' };

export function PasoListo({ armado, catalogo, nombre, editando, onCambiar, onCantidad, onNombre, onAgregar, onGuardar }: Props) {
  const tamano = catalogo.tamanos.find((t) => t.id === armado.tamanoId);
  const buscar = (id: string) => catalogo.ingredientes.find((i) => i.id === id);
  const tortilla = armado.seleccion.tortilla[0] ? buscar(armado.seleccion.tortilla[0]) : undefined;
  const precio = precioVistaPrevia(armado, catalogo);
  const doble = (tamano?.cantTapas ?? 1) > 1;
  const [camara, setCamara] = useState(false);

  return (
    <section aria-labelledby="titulo-listo" className="animate-aparecer px-4 pb-8">
      <h1 id="titulo-listo" className="text-4xl font-extrabold">
        ¡Listo! Así quedó
      </h1>
      <p className="mt-1 text-lg text-tinta-suave">Revisalo y sumalo a tu pedido</p>

      <div className="juguete fondo-puntos relative mt-4 rounded-3xl px-2 pt-10 pb-2">
        <span className="juguete absolute top-3 left-3 flex -rotate-3 items-center gap-1.5 rounded-xl bg-amarillo px-2.5 py-1 font-heading font-extrabold">
          <span aria-hidden>🍟</span> Papas fritas incluidas
        </span>
        <BurritoConPapas doble={doble} tortilla={tortilla?.slug} className="pt-2 pb-4" />
        <button
          type="button"
          onClick={() => setCamara(true)}
          className="juguete mx-auto mb-2 flex min-h-12 items-center gap-2 rounded-2xl bg-white px-4 font-heading text-lg font-extrabold"
        >
          <Camera aria-hidden className="size-5" strokeWidth={2.5} /> Verlo en mi mesa
        </button>
      </div>
      {camara && <VerEnMiMesa doble={doble} tortilla={tortilla?.slug} onCerrar={() => setCamara(false)} />}

      <div className="juguete mt-5 overflow-hidden rounded-3xl bg-white">
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="text-2xl font-extrabold">Lo que lleva</h2>
          <span className="rounded-full border-2 border-tinta bg-amarillo px-3 font-heading font-extrabold">{tamano?.nombre}</span>
        </div>
        <ul>
          {([1, 2, 3, 4] as PasoDeCategoria[]).map((paso) => {
            const categoria = CATEGORIA_DEL_PASO[paso];
            const ids = armado.seleccion[categoria];
            const primero = ids[0] ? buscar(ids[0]) : undefined;
            const contador = categoria === 'tortilla' ? '' : ` (${ids.length}/${tamano?.maximos[categoria] ?? 0})`;
            return (
              <li key={categoria} className="flex items-center gap-3 border-t-2 border-dashed border-tinta/20 px-4 py-3">
                <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-tinta bg-panel">
                  {primero ? <ImagenIngrediente ingrediente={primero} className="w-10" /> : <span aria-hidden>—</span>}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-tinta-suave">
                    {ETIQUETAS[categoria]}
                    {contador}
                  </p>
                  <p className="font-heading text-lg leading-tight font-bold">
                    {ids.length ? describir(ids, catalogo) : 'Sin ' + ETIQUETAS[categoria].toLowerCase()}
                    {categoria === 'tortilla' && primero?.sinTacc && (
                      <span className="ml-2 inline-flex items-center gap-1 rounded-full border-2 border-verde bg-verde-claro px-2 align-middle font-sans text-sm text-verde">
                        <WheatOff aria-hidden className="size-4" /> Sin TACC
                      </span>
                    )}
                  </p>
                </div>
                <button type="button" onClick={() => onCambiar(paso)} className="min-h-12 px-1 font-bold text-rojo underline underline-offset-4">
                  Cambiar
                </button>
              </li>
            );
          })}
          <li className="flex items-center gap-3 border-t-2 border-dashed border-tinta/20 bg-amarillo/15 px-4 py-3">
            <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-full border-2 border-tinta bg-amarillo text-2xl">
              🍟
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-tinta-suave">Papas fritas</p>
              <p className="font-heading text-lg font-bold">Incluidas, siempre</p>
            </div>
            <span className="grid size-9 place-items-center rounded-full border-2 border-verde bg-verde-claro text-verde">
              <Check aria-hidden className="size-5" strokeWidth={3} />
            </span>
          </li>
        </ul>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="font-heading text-xl font-extrabold">¿Cuántos de este?</p>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => onCantidad(armado.cantidad - 1)}
            disabled={armado.cantidad <= 1}
            aria-label="Uno menos"
            className="juguete grid size-12 place-items-center rounded-xl bg-amarillo disabled:bg-beige disabled:opacity-60"
          >
            <Minus className="size-6" strokeWidth={3} />
          </button>
          <span aria-live="polite" className="w-6 text-center font-heading text-2xl font-extrabold">
            {armado.cantidad}
          </span>
          <button type="button" onClick={() => onCantidad(armado.cantidad + 1)} aria-label="Uno más" className="juguete grid size-12 place-items-center rounded-xl bg-amarillo">
            <Plus className="size-6" strokeWidth={3} />
          </button>
        </div>
      </div>

      <label className="mt-6 block">
        <span className="font-heading text-xl font-extrabold">
          Ponele nombre <span className="font-sans text-base font-semibold text-tinta-suave">(opcional)</span>
        </span>
        <input
          type="text"
          maxLength={40}
          value={nombre}
          onChange={(e) => onNombre(e.target.value)}
          placeholder="Ej. El de Juan"
          className="mt-2 min-h-14 w-full rounded-2xl border-[2.5px] border-tinta bg-white px-4 text-lg outline-none focus-visible:ring-4 focus-visible:ring-amarillo"
        />
        <span className="mt-1 block text-base text-tinta-suave">Así sabés cuál es cuál cuando llega el pedido</span>
      </label>

      <div className="mt-6 flex items-end justify-between border-t-2 border-dashed border-tinta/30 pt-4">
        <span className="text-xl font-bold">Total</span>
        <span className="font-heading text-4xl font-extrabold">{formatoPesos(precio * armado.cantidad)}</span>
      </div>

      <button
        type="button"
        onClick={onAgregar}
        className="juguete mt-4 flex min-h-16 w-full items-center justify-center gap-2 rounded-2xl bg-rojo font-heading text-2xl font-extrabold text-white shadow-[0_4px_0_var(--rojo-oscuro)]"
      >
        <ShoppingBag aria-hidden className="size-6" strokeWidth={2.5} />
        {editando ? 'Guardar cambios' : 'Agregar al pedido'}
      </button>
      <button
        type="button"
        onClick={onGuardar}
        className="juguete mt-3 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-white font-heading text-xl font-extrabold"
      >
        <HeartPlus aria-hidden className="size-6" strokeWidth={2.5} />
        Guardar en mi celular
      </button>
    </section>
  );
}
