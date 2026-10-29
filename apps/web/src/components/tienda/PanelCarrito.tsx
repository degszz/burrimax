import { precioVistaPrevia, type Catalogo } from '@burritos/shared';
import { ChevronDown, Minus, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { describir } from '@/lib/armador/reglas';
import { formatoPesos } from '@/lib/formato';
import { cn } from '@/lib/utils';
import { useCarrito, type ItemCarrito } from '@/stores/carrito';
import { MiniBurrito } from './MiniBurrito';

interface Props {
  abierto: boolean;
  catalogo: Catalogo;
  onCerrar: () => void;
  onEditar: (item: ItemCarrito) => void;
  onArmarOtro: () => void;
}

export function PanelCarrito({ abierto, catalogo, onCerrar, onEditar, onArmarOtro }: Props) {
  const { items, cambiarCantidad, quitar, total, cantidadBurritos } = useCarrito();
  const burritos = cantidadBurritos();

  return (
    <Sheet open={abierto} onOpenChange={(a) => !a && onCerrar()}>
      <SheetContent showCloseButton={false} className="gap-0 border-l-[2.5px] border-tinta bg-crema p-0 data-[side=right]:w-[min(92vw,28rem)] data-[side=right]:sm:max-w-md">
        <div className="flex items-start justify-between px-4 pt-5 pb-3">
          <div>
            <SheetTitle className="font-heading text-3xl font-extrabold text-tinta">Tu pedido</SheetTitle>
            <SheetDescription className="text-base text-tinta-suave">
              {burritos} {burritos === 1 ? 'burrito' : 'burritos'}
            </SheetDescription>
          </div>
          <SheetClose aria-label="Cerrar" className="juguete grid size-12 place-items-center rounded-2xl bg-white">
            <X className="size-6" strokeWidth={2.5} />
          </SheetClose>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4">
          {items.length === 0 ? (
            <div className="py-10 text-center">
              <p className="font-heading text-2xl font-extrabold">Todavía no sumaste nada</p>
              <p className="mt-1 text-tinta-suave">Armá tu burrito y aparece acá.</p>
            </div>
          ) : (
            items.map((item) => <Item key={item.id} item={item} catalogo={catalogo} onCantidad={(n) => cambiarCantidad(item.id, n)} onQuitar={() => quitar(item.id)} onEditar={() => onEditar(item)} />)
          )}
        </div>

        <div className="border-t-[2.5px] border-tinta px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {items.length > 0 && (
            <>
              <div className="flex items-end justify-between">
                <span className="text-xl font-bold">Subtotal</span>
                <span className="font-heading text-3xl font-extrabold">{formatoPesos(total(catalogo))}</span>
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-tinta-suave">
                <span aria-hidden>🍟</span> Cada burrito viene con papas fritas
              </p>
            </>
          )}
          <button
            type="button"
            onClick={onArmarOtro}
            className="juguete mt-3 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-white font-heading text-xl font-extrabold"
          >
            <Plus aria-hidden className="size-5" strokeWidth={3} /> Armar {items.length ? 'otro' : 'mi'} burrito
          </button>
          {items.length > 0 && (
            // Fase 2: datos del cliente y pago.
            <button type="button" disabled className="mt-3 min-h-14 w-full rounded-2xl border-2 border-dashed border-tinta/40 font-heading text-lg font-bold text-tinta-suave">
              Confirmar pedido (muy pronto)
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface ItemProps {
  item: ItemCarrito;
  catalogo: Catalogo;
  onCantidad: (n: number) => void;
  onQuitar: () => void;
  onEditar: () => void;
}

function Item({ item, catalogo, onCantidad, onQuitar, onEditar }: ItemProps) {
  const [abierto, setAbierto] = useState(false);
  const { armado } = item;
  const tamano = catalogo.tamanos.find((t) => t.id === armado.tamanoId);
  const unitario = precioVistaPrevia(armado, catalogo);
  const nombre = armado.nombrePersonalizado ?? `Burrito ${tamano?.nombre.toLowerCase() ?? ''}`;
  const filas: [string, string][] = [
    ['Tortilla', describir(armado.seleccion.tortilla, catalogo)],
    ['Salsas', describir(armado.seleccion.salsa, catalogo) || 'Sin salsas'],
    ['Carne', describir(armado.seleccion.carne, catalogo)],
    ['Vegetales', describir(armado.seleccion.vegetal, catalogo) || 'Sin vegetales'],
  ];

  return (
    <article className="juguete rounded-3xl bg-white p-3">
      <div className="flex gap-3">
        <MiniBurrito armado={armado} catalogo={catalogo} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 text-xl leading-tight font-extrabold break-words">{nombre}</h3>
            <span className="font-heading text-xl font-extrabold">{formatoPesos(unitario * armado.cantidad)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className={cn('rounded-full border-2 border-tinta px-2 text-sm font-extrabold', (tamano?.cantTapas ?? 1) > 1 ? 'bg-rojo text-white' : 'bg-amarillo')}>
              {tamano?.nombre}
            </span>
            {armado.cantidad > 1 && (
              <span className="text-tinta-suave">
                {armado.cantidad} × {formatoPesos(unitario)}
              </span>
            )}
          </div>
        </div>
      </div>

      <button type="button" aria-expanded={abierto} onClick={() => setAbierto(!abierto)} className="mt-2 flex min-h-11 items-center gap-1 font-bold text-rojo underline underline-offset-4">
        {abierto ? 'Ocultar qué lleva' : 'Ver qué lleva'}
        <ChevronDown aria-hidden className={cn('size-5 transition-transform', abierto && 'rotate-180')} />
      </button>
      {abierto && (
        <dl className="mb-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-2xl bg-panel/50 p-3">
          {filas.map(([etiqueta, valor]) => (
            <div key={etiqueta} className="contents">
              <dt className="text-tinta-suave">{etiqueta}</dt>
              <dd className="font-bold">{valor}</dd>
            </div>
          ))}
          <dt className="text-tinta-suave">Papas</dt>
          <dd className="font-bold text-verde">Incluidas</dd>
        </dl>
      )}

      <div className="mt-1 flex items-center gap-2">
        <button type="button" onClick={() => onCantidad(armado.cantidad - 1)} aria-label="Uno menos" className="juguete grid size-12 place-items-center rounded-xl bg-amarillo">
          <Minus className="size-5" strokeWidth={3} />
        </button>
        <span aria-live="polite" className="w-6 text-center font-heading text-xl font-extrabold">
          {armado.cantidad}
        </span>
        <button type="button" onClick={() => onCantidad(armado.cantidad + 1)} aria-label="Uno más" className="juguete grid size-12 place-items-center rounded-xl bg-amarillo">
          <Plus className="size-5" strokeWidth={3} />
        </button>
        <button type="button" onClick={onEditar} className="juguete ml-auto flex min-h-12 items-center gap-1.5 rounded-xl bg-white px-3 font-bold">
          <Pencil aria-hidden className="size-4" /> Editar
        </button>
        <button type="button" onClick={onQuitar} aria-label={`Sacar ${nombre} del pedido`} className="juguete grid size-12 place-items-center rounded-xl bg-white text-rojo">
          <Trash2 className="size-5" />
        </button>
      </div>
    </article>
  );
}
