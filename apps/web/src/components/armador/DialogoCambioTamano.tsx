import { precioVistaPrevia, type Armado, type Catalogo, type TamanoCatalogo } from '@burritos/shared';
import { Check, CircleAlert, Minus, Plus, RotateCcw, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { formatoPesos } from '@/lib/formato';
import { cn } from '@/lib/utils';
import { ImagenIngrediente } from './ImagenIngrediente';

interface Props {
  armado: Armado;
  destino: TamanoCatalogo | null;
  catalogo: Catalogo;
  onConfirmar: (seleccion: Armado['seleccion']) => void;
  onCancelar: () => void;
}

/**
 * Al pasar a un tamaño más chico con más cosas de las que entran: el cliente
 * elige qué sacar. Nunca se recorta en silencio.
 */
export function DialogoCambioTamano({ armado, destino, catalogo, onConfirmar, onCancelar }: Props) {
  const [carnes, setCarnes] = useState<Record<string, number>>({});
  const [sacados, setSacados] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!destino) return;
    const conteo: Record<string, number> = {};
    for (const id of armado.seleccion.carne) conteo[id] = (conteo[id] ?? 0) + 1;
    setCarnes(conteo);
    setSacados(new Set());
  }, [destino, armado.seleccion.carne]);

  if (!destino) return null;

  const buscar = (id: string) => catalogo.ingredientes.find((i) => i.id === id);
  const totalCarnes = Object.values(carnes).reduce((a, b) => a + b, 0);
  const vegetales = armado.seleccion.vegetal.filter((id) => !sacados.has(id));
  const salsas = armado.seleccion.salsa.filter((id) => !sacados.has(id));
  const sobranCarnes = totalCarnes - destino.maximos.carne;
  const sobranVegetales = vegetales.length - destino.maximos.vegetal;
  const sobranSalsas = salsas.length - destino.maximos.salsa;
  const entra = sobranCarnes <= 0 && sobranVegetales <= 0 && sobranSalsas <= 0;

  const nueva: Armado['seleccion'] = {
    tortilla: armado.seleccion.tortilla,
    salsa: salsas,
    carne: Object.entries(carnes).flatMap(([id, n]) => Array<string>(n).fill(id)),
    vegetal: vegetales,
  };
  const precio = precioVistaPrevia({ ...armado, tamanoId: destino.id, seleccion: nueva }, catalogo);

  const alternarSacado = (id: string) =>
    setSacados((actual) => {
      const copia = new Set(actual);
      if (copia.has(id)) copia.delete(id);
      else copia.add(id);
      return copia;
    });

  const aviso = sobranCarnes > 0
    ? `Te sobra${sobranCarnes > 1 ? 'n' : ''} ${sobranCarnes} porci${sobranCarnes > 1 ? 'ones' : 'ón'} de carne (${totalCarnes}/${destino.maximos.carne})`
    : sobranVegetales > 0
      ? `Te sobra${sobranVegetales > 1 ? 'n' : ''} ${sobranVegetales} vegetal${sobranVegetales > 1 ? 'es' : ''} (${vegetales.length}/${destino.maximos.vegetal})`
      : sobranSalsas > 0
        ? `Te sobra${sobranSalsas > 1 ? 'n' : ''} ${sobranSalsas} salsa${sobranSalsas > 1 ? 's' : ''}`
        : null;

  return (
    <Dialog open onOpenChange={(abierto) => !abierto && onCancelar()}>
      <DialogContent showCloseButton={false} className="max-h-[92dvh] overflow-y-auto rounded-3xl border-[2.5px] border-tinta bg-crema p-4 sm:max-w-md">
        <DialogTitle className="font-heading text-2xl leading-tight font-extrabold">
          Tu burrito tiene más de lo que entra en uno {destino.nombre.toLowerCase()}. ¿Qué sacamos?
        </DialogTitle>
        <DialogDescription className="sr-only">Elegí qué sacar para que entre en el tamaño {destino.nombre}.</DialogDescription>

        <div className={cn('juguete rounded-2xl bg-white p-3', sobranCarnes > 0 && 'border-rojo')}>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xl font-extrabold">Carne</h3>
            <Estado sobran={sobranCarnes} entran={destino.maximos.carne} />
          </div>
          {Object.entries(carnes).map(([id, n]) => {
            const carne = buscar(id);
            if (!carne) return null;
            return (
              <div key={id} className="flex items-center gap-3 border-t-2 border-dashed border-tinta/15 py-2">
                <ImagenIngrediente ingrediente={carne} className="w-10" />
                <span className={cn('flex-1 font-bold', n === 0 && 'text-tinta-suave')}>
                  {carne.nombre} {n === 0 && <span className="font-normal">(sacada)</span>}
                </span>
                <button
                  type="button"
                  disabled={n === 0}
                  onClick={() => setCarnes({ ...carnes, [id]: n - 1 })}
                  aria-label={`Sacar una porción de ${carne.nombre}`}
                  className="juguete grid size-12 place-items-center rounded-xl bg-amarillo disabled:bg-beige disabled:opacity-60"
                >
                  <Minus className="size-5" strokeWidth={3} />
                </button>
                <span className="w-5 text-center font-heading text-xl font-extrabold">{n}</span>
                <button
                  type="button"
                  disabled={sobranCarnes >= 0}
                  onClick={() => setCarnes({ ...carnes, [id]: n + 1 })}
                  aria-label={`Sumar una porción de ${carne.nombre}`}
                  className="juguete grid size-12 place-items-center rounded-xl bg-amarillo disabled:bg-beige disabled:opacity-60"
                >
                  <Plus className="size-5" strokeWidth={3} />
                </button>
              </div>
            );
          })}
        </div>

        {[
          { titulo: 'Vegetales', ids: armado.seleccion.vegetal, sobran: sobranVegetales, quedan: vegetales.length, max: destino.maximos.vegetal },
          { titulo: 'Salsas', ids: armado.seleccion.salsa, sobran: sobranSalsas, quedan: salsas.length, max: destino.maximos.salsa },
        ]
          .filter((grupo) => grupo.ids.length > 0 && (grupo.titulo === 'Vegetales' || grupo.sobran > 0))
          .map((grupo) => (
            <div key={grupo.titulo} className={cn('juguete rounded-2xl bg-white p-3', grupo.sobran > 0 && 'border-rojo')}>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xl font-extrabold">
                  {grupo.titulo} {grupo.quedan}/{grupo.max}
                </h3>
                <Estado sobran={grupo.sobran} entran={grupo.max} />
              </div>
              <div className="flex flex-wrap gap-2">
                {grupo.ids.map((id) => {
                  const item = buscar(id);
                  if (!item) return null;
                  const sacado = sacados.has(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => alternarSacado(id)}
                      aria-pressed={sacado}
                      aria-label={sacado ? `Volver a poner ${item.nombre}` : `Sacar ${item.nombre}`}
                      className={cn(
                        'flex min-h-12 items-center gap-2 rounded-full border-2 border-tinta py-1 pr-1.5 pl-2 font-bold',
                        sacado ? 'border-dashed bg-transparent text-tinta-suave line-through' : 'bg-white shadow-[0_3px_0_var(--tinta)]',
                      )}
                    >
                      <ImagenIngrediente ingrediente={item} className="w-7" />
                      {item.nombre}
                      {sacado ? (
                        <RotateCcw aria-hidden className="size-6 p-0.5" />
                      ) : (
                        <X aria-hidden className="size-6 rounded-full bg-rojo p-1 text-white" strokeWidth={3} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

        {aviso && (
          <p role="status" className="flex items-center justify-center gap-1.5 font-bold text-rojo">
            <CircleAlert aria-hidden className="size-5" /> {aviso}
          </p>
        )}

        <button
          type="button"
          disabled={!entra}
          onClick={() => onConfirmar(nueva)}
          className="juguete min-h-14 w-full rounded-2xl bg-rojo font-heading text-xl font-extrabold text-white shadow-[0_4px_0_var(--rojo-oscuro)] disabled:border-tinta/40 disabled:bg-beige disabled:text-tinta-suave disabled:shadow-[0_4px_0_rgba(43,27,18,.25)]"
        >
          Pasar a {destino.nombre} · {formatoPesos(precio)}
        </button>
        <button type="button" onClick={onCancelar} className="juguete min-h-14 w-full rounded-2xl bg-white font-heading text-lg font-extrabold">
          Mejor lo dejo como está
        </button>
      </DialogContent>
    </Dialog>
  );
}

function Estado({ sobran, entran }: { sobran: number; entran: number }) {
  return sobran > 0 ? (
    <span className="rounded-full bg-rojo/10 px-2.5 py-0.5 font-bold text-rojo">
      Sacá {sobran} más
    </span>
  ) : (
    <span className="flex items-center gap-1 rounded-full bg-verde-claro px-2.5 py-0.5 font-bold text-verde">
      <Check aria-hidden className="size-4" strokeWidth={3} /> Entran {entran} · listo
    </span>
  );
}
