import { calcularPedido, pedidoSchema, precioVistaPrevia, type Catalogo, type MetodoPago } from '@burritos/shared';
import { ArrowLeft, Banknote, Bike, CircleAlert, CreditCard, Landmark, Store } from 'lucide-react';
import { useEffect, useState, type ReactNode, type SubmitEvent } from 'react';
import { describir } from '@/lib/armador/reglas';
import { DATOS_VACIOS, guardarDatosCliente, leerDatosCliente, olvidarDatosCliente, type DatosCliente } from '@/lib/datosCliente';
import { formatoPesos } from '@/lib/formato';
import { cn } from '@/lib/utils';
import { useCarrito } from '@/stores/carrito';

interface Props {
  catalogo: Catalogo;
  pagos: { mercadopago: boolean; transferencia: boolean; efectivo: boolean };
  abierto: boolean;
}

type MetodoVisible = Exclude<MetodoPago, 'stripe'>;

const METODOS: { id: MetodoVisible; titulo: string; detalle: string; icono: ReactNode }[] = [
  { id: 'mercadopago', titulo: 'Mercado Pago', detalle: 'Tarjeta, débito o dinero en cuenta', icono: <CreditCard aria-hidden className="size-7" /> },
  { id: 'transferencia', titulo: 'Transferencia', detalle: 'Te pasamos el alias para transferir', icono: <Landmark aria-hidden className="size-7" /> },
  { id: 'efectivo', titulo: 'Efectivo', detalle: 'Pagás cuando lo recibís', icono: <Banknote aria-hidden className="size-7" /> },
];

// Mensajes en lenguaje humano para cada campo (los de Zod son genéricos).
const MENSAJES: Record<string, string> = {
  'cliente.nombre': 'Falta tu nombre',
  'cliente.telefono': 'Falta tu teléfono con código de área (ej. 11 2345-6789)',
  'cliente.email': 'Revisá el email',
  'entrega.direccion': 'Falta la dirección',
  'entrega.zonaEnvioId': 'Elegí tu zona',
  'pago.metodoPago': 'Elegí cómo pagás',
  'pago.pagaCon': 'Revisá con cuánto pagás',
};

export default function Checkout({ catalogo, pagos, abierto }: Props) {
  const carrito = useCarrito();
  const [listo, setListo] = useState(false);
  const [datos, setDatos] = useState<DatosCliente>(DATOS_VACIOS);
  const [recordar, setRecordar] = useState(true);
  const [metodo, setMetodo] = useState<MetodoVisible | null>(null);
  const [pagaCon, setPagaCon] = useState('');
  const [notas, setNotas] = useState('');
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const metodosActivos = METODOS.filter((m) => pagos[m.id]);

  useEffect(() => {
    useCarrito.persist.rehydrate()?.then?.(() => setListo(true)) ?? setListo(true);
    const guardados = leerDatosCliente();
    if (guardados) setDatos(guardados);
    if (metodosActivos.length === 1) setMetodo(metodosActivos[0]!.id);
  }, []);

  const cambiar = <K extends keyof DatosCliente>(campo: K, valor: DatosCliente[K]) => setDatos((d) => ({ ...d, [campo]: valor }));

  const items = carrito.items.map((i) => ({ tipo: 'armado' as const, armado: i.armado }));
  const delivery = datos.tipoEntrega === 'delivery';
  const zona = catalogo.zonasEnvio.find((z) => z.id === datos.zonaEnvioId);
  const subtotal = carrito.items.reduce((s, i) => s + precioVistaPrevia(i.armado, catalogo) * i.armado.cantidad, 0);
  const envio = delivery ? (zona?.costo ?? 0) : 0;
  const total = subtotal + envio;

  function armarEntrada() {
    return {
      cliente: { nombre: datos.nombre, telefono: datos.telefono, email: datos.email },
      entrega: delivery
        ? { tipoEntrega: 'delivery', direccion: datos.direccion, referencias: datos.referencias || undefined, zonaEnvioId: datos.zonaEnvioId }
        : { tipoEntrega: 'retiro' },
      pago: { metodoPago: metodo, ...(metodo === 'efectivo' && pagaCon ? { pagaCon: Number(pagaCon.replace(/\D/g, '')) } : {}) },
      items,
      notas: notas.trim() || undefined,
    };
  }

  async function confirmar(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorGeneral(null);
    const entrada = armarEntrada();
    const validado = pedidoSchema.safeParse(entrada);
    const nuevos: Record<string, string> = {};
    if (!validado.success) {
      for (const issue of validado.error.issues) {
        const campo = issue.path.join('.');
        if (campo.startsWith('items')) continue;
        nuevos[campo] ??= MENSAJES[campo] ?? issue.message;
      }
    }
    if (metodo === 'efectivo' && pagaCon && Number(pagaCon.replace(/\D/g, '')) < total) {
      nuevos['pago.pagaCon'] = `Con eso no alcanza: el total es ${formatoPesos(total)}`;
    }
    setErrores(nuevos);
    if (Object.keys(nuevos).length) {
      document.querySelector('[aria-invalid="true"]')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }

    // Antes de mandar, que lo armado siga valiendo con el menú actual.
    try {
      calcularPedido(items, entrada.entrega as never, catalogo);
    } catch {
      setErrorGeneral('Algo de tu pedido cambió en el menú. Volvé a revisarlo.');
      return;
    }

    if (recordar) guardarDatosCliente(datos);
    else olvidarDatosCliente();

    setEnviando(true);
    try {
      const formulario = new FormData(e.currentTarget);
      const respuesta = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...entrada, web: formulario.get('web') }),
      });
      const cuerpo = (await respuesta.json().catch(() => ({}))) as { error?: string; url?: string; redirectUrl?: string };
      if (!respuesta.ok || !cuerpo.url) {
        setErrorGeneral(cuerpo.error ?? 'No pudimos mandar tu pedido. Probá de nuevo.');
        return;
      }
      window.location.href = cuerpo.redirectUrl ?? `${cuerpo.url}&nuevo=1`;
    } catch {
      setErrorGeneral('Parece que no hay conexión. Revisá tu internet y probá de nuevo.');
    } finally {
      setEnviando(false);
    }
  }

  if (!listo) return null;

  if (carrito.items.length === 0) {
    return (
      <main className="mx-auto grid min-h-[70dvh] max-w-md place-items-center px-6 text-center">
        <div>
          <p className="text-5xl" aria-hidden>🌯</p>
          <h1 className="mt-3 text-3xl font-extrabold">Tu pedido está vacío</h1>
          <a href="/" className="juguete mt-6 inline-flex min-h-14 items-center rounded-2xl bg-rojo px-6 font-heading text-xl font-extrabold text-white">
            Armá tu burrito
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-4 pt-4 pb-10">
      <a href="/" className="inline-flex min-h-11 items-center gap-1 font-bold text-tinta-suave underline underline-offset-4">
        <ArrowLeft aria-hidden className="size-5" /> Seguir eligiendo
      </a>
      <h1 className="mt-2 text-4xl font-extrabold">Tu pedido</h1>

      {!abierto && (
        <p role="alert" className="mt-3 rounded-2xl border-2 border-rojo bg-rojo/10 p-3 font-bold text-rojo">
          Ahora estamos cerrados. Podés dejar todo listo y pedir cuando abramos.
        </p>
      )}

      <section aria-label="Resumen" className="juguete mt-4 rounded-3xl bg-white p-4">
        <ul className="space-y-2">
          {carrito.items.map((item) => {
            const tamano = catalogo.tamanos.find((t) => t.id === item.armado.tamanoId);
            return (
              <li key={item.id} className="flex justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-heading text-lg font-extrabold">
                    {item.armado.cantidad} × {item.armado.nombrePersonalizado ?? `Burrito ${tamano?.nombre.toLowerCase()}`}
                  </p>
                  <p className="truncate text-sm text-tinta-suave">{describir(item.armado.seleccion.carne, catalogo)} · con papas</p>
                </div>
                <span className="font-heading text-lg font-extrabold whitespace-nowrap">
                  {formatoPesos(precioVistaPrevia(item.armado, catalogo) * item.armado.cantidad)}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <form noValidate onSubmit={confirmar} className="mt-6 space-y-6">
        {/* Trampa para bots: invisible para las personas */}
        <input type="text" name="web" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] size-px opacity-0" />

        <Seccion titulo="Tus datos">
          <Campo etiqueta="Nombre" error={errores['cliente.nombre']}>
            {(props) => <input {...props} autoComplete="name" value={datos.nombre} onChange={(e) => cambiar('nombre', e.target.value)} />}
          </Campo>
          <Campo etiqueta="Teléfono" ayuda="Te escribimos por WhatsApp si hace falta" error={errores['cliente.telefono']}>
            {(props) => (
              <input {...props} type="tel" inputMode="tel" autoComplete="tel" placeholder="11 2345-6789" value={datos.telefono} onChange={(e) => cambiar('telefono', e.target.value)} />
            )}
          </Campo>
          <Campo etiqueta="Email" opcional ayuda="Solo si querés recibir el comprobante" error={errores['cliente.email']}>
            {(props) => <input {...props} type="email" inputMode="email" autoComplete="email" value={datos.email} onChange={(e) => cambiar('email', e.target.value)} />}
          </Campo>
        </Seccion>

        <Seccion titulo="¿Cómo lo recibís?">
          <div role="radiogroup" aria-label="Forma de entrega" className="grid grid-cols-2 gap-3">
            <Opcion elegida={delivery} onElegir={() => cambiar('tipoEntrega', 'delivery')} icono={<Bike aria-hidden className="size-7" />} titulo="Delivery" detalle="Te lo llevamos" />
            <Opcion elegida={!delivery} onElegir={() => cambiar('tipoEntrega', 'retiro')} icono={<Store aria-hidden className="size-7" />} titulo="Retiro" detalle="Lo buscás en el local" />
          </div>
          {delivery && (
            <>
              <fieldset aria-invalid={!!errores['entrega.zonaEnvioId']}>
                <legend className="font-heading text-lg font-extrabold">Tu zona</legend>
                <div className="mt-2 grid gap-2">
                  {catalogo.zonasEnvio.map((z) => (
                    <label
                      key={z.id}
                      className={cn(
                        'juguete flex min-h-14 cursor-pointer items-center justify-between rounded-2xl px-4 font-bold',
                        datos.zonaEnvioId === z.id ? 'bg-amarillo' : 'bg-white',
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <input type="radio" name="zona" className="size-5 accent-[var(--rojo)]" checked={datos.zonaEnvioId === z.id} onChange={() => cambiar('zonaEnvioId', z.id)} />
                        {z.nombre}
                      </span>
                      <span>{formatoPesos(z.costo)}</span>
                    </label>
                  ))}
                </div>
                {errores['entrega.zonaEnvioId'] && <Error texto={errores['entrega.zonaEnvioId']} />}
              </fieldset>
              <Campo etiqueta="Dirección" error={errores['entrega.direccion']}>
                {(props) => <input {...props} autoComplete="street-address" placeholder="Calle y número" value={datos.direccion} onChange={(e) => cambiar('direccion', e.target.value)} />}
              </Campo>
              <Campo etiqueta="Referencias" opcional ayuda="Entre calles, piso, timbre">
                {(props) => <input {...props} value={datos.referencias} onChange={(e) => cambiar('referencias', e.target.value)} />}
              </Campo>
            </>
          )}
        </Seccion>

        <Seccion titulo="¿Cómo pagás?">
          <div role="radiogroup" aria-label="Forma de pago" aria-invalid={!!errores['pago.metodoPago']} className="grid gap-3">
            {metodosActivos.map((m) => (
              <Opcion key={m.id} elegida={metodo === m.id} onElegir={() => setMetodo(m.id)} icono={m.icono} titulo={m.titulo} detalle={m.detalle} horizontal />
            ))}
          </div>
          {errores['pago.metodoPago'] && <Error texto={errores['pago.metodoPago']} />}
          {metodo === 'efectivo' && (
            <Campo etiqueta="¿Con cuánto pagás?" opcional ayuda="Así te llevamos el vuelto justo" error={errores['pago.pagaCon']}>
              {(props) => <input {...props} inputMode="numeric" placeholder={formatoPesos(Math.ceil(total / 1000) * 1000)} value={pagaCon} onChange={(e) => setPagaCon(e.target.value)} />}
            </Campo>
          )}
        </Seccion>

        <Campo etiqueta="¿Algo más?" opcional ayuda="Ej. sin picante para el chico">
          {(props) => <textarea {...props} rows={2} maxLength={300} value={notas} onChange={(e) => setNotas(e.target.value)} />}
        </Campo>

        <section aria-label="Total" className="space-y-1 border-t-2 border-dashed border-tinta/30 pt-4 text-lg">
          <p className="flex justify-between"><span>Subtotal</span><span>{formatoPesos(subtotal)}</span></p>
          <p className="flex justify-between"><span>Envío</span><span>{delivery ? (zona ? formatoPesos(envio) : 'Elegí tu zona') : 'Gratis'}</span></p>
          <p className="flex items-end justify-between pt-1"><span className="font-bold">Total</span><span className="font-heading text-4xl font-extrabold">{formatoPesos(total)}</span></p>
          <p className="text-base text-tinta-suave">🍟 Cada burrito viene con papas fritas</p>
        </section>

        <label className="flex min-h-12 items-center gap-3 text-base">
          <input type="checkbox" className="size-5 accent-[var(--rojo)]" checked={recordar} onChange={(e) => setRecordar(e.target.checked)} />
          Recordar mis datos en este celular
        </label>

        {errorGeneral && (
          <p role="alert" className="flex items-start gap-2 rounded-2xl border-2 border-rojo bg-rojo/10 p-3 font-bold text-rojo">
            <CircleAlert aria-hidden className="mt-0.5 size-5 shrink-0" /> {errorGeneral}
          </p>
        )}

        <button
          type="submit"
          disabled={enviando || !abierto}
          className="juguete flex min-h-16 w-full items-center justify-center rounded-2xl bg-rojo font-heading text-2xl font-extrabold text-white shadow-[0_4px_0_var(--rojo-oscuro)] disabled:border-tinta/40 disabled:bg-beige disabled:text-tinta-suave disabled:shadow-none"
        >
          {enviando ? 'Mandando…' : metodo === 'mercadopago' ? `Ir a pagar · ${formatoPesos(total)}` : `Confirmar pedido · ${formatoPesos(total)}`}
        </button>
      </form>
    </main>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-extrabold">{titulo}</h2>
      {children}
    </section>
  );
}

interface CampoProps {
  etiqueta: string;
  ayuda?: string;
  opcional?: boolean;
  error?: string;
  children: (props: { id: string; className: string; 'aria-invalid': boolean; 'aria-describedby'?: string }) => ReactNode;
}

function Campo({ etiqueta, ayuda, opcional, error, children }: CampoProps) {
  const id = `campo-${etiqueta.toLowerCase().replace(/[^a-z]+/g, '-')}`;
  return (
    <div>
      <label htmlFor={id} className="font-heading text-lg font-extrabold">
        {etiqueta} {opcional && <span className="font-sans text-base font-semibold text-tinta-suave">(opcional)</span>}
      </label>
      {children({
        id,
        'aria-invalid': !!error,
        'aria-describedby': error || ayuda ? `${id}-ayuda` : undefined,
        className: cn(
          'mt-1 min-h-14 w-full rounded-2xl border-[2.5px] bg-white px-4 py-3 text-lg outline-none focus-visible:ring-4 focus-visible:ring-amarillo',
          error ? 'border-rojo' : 'border-tinta',
        ),
      })}
      <p id={`${id}-ayuda`} className={cn('mt-1 text-base', error ? 'font-bold text-rojo' : 'text-tinta-suave')}>
        {error ?? ayuda}
      </p>
    </div>
  );
}

function Opcion({ elegida, onElegir, icono, titulo, detalle, horizontal }: { elegida: boolean; onElegir: () => void; icono: ReactNode; titulo: string; detalle: string; horizontal?: boolean }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={elegida}
      onClick={onElegir}
      className={cn(
        'juguete flex min-h-16 rounded-2xl p-3 text-left',
        horizontal ? 'items-center gap-3' : 'flex-col items-start gap-1',
        elegida ? 'bg-amarillo' : 'bg-white',
      )}
    >
      {icono}
      <span>
        <span className="block font-heading text-xl leading-tight font-extrabold">{titulo}</span>
        <span className="block text-base text-tinta-suave">{detalle}</span>
      </span>
    </button>
  );
}

function Error({ texto }: { texto: string }) {
  return <p className="mt-1 text-base font-bold text-rojo">{texto}</p>;
}
