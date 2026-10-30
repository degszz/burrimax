import { configPagosSchema, cvuDigitosOk } from '@burritos/shared';
import { useMemo, useState } from 'react';

interface Pagos {
  mercadopago: boolean;
  transferencia: boolean;
  efectivo: boolean;
}

interface Transferencia {
  alias: string;
  cvu: string;
  titular: string;
}

interface Props {
  pagosIniciales: Pagos;
  transferenciaInicial: Transferencia;
}

const MEDIOS: { id: keyof Pagos; titulo: string; detalle: string; nota?: string }[] = [
  {
    id: 'mercadopago',
    titulo: 'Mercado Pago',
    detalle: 'Tarjeta, débito o dinero en cuenta. El pedido pasa a pagado solo.',
    nota: 'La tienda lo ofrece únicamente si además están cargadas las claves de Mercado Pago en el servidor (Vercel).',
  },
  { id: 'transferencia', titulo: 'Transferencia', detalle: 'El cliente transfiere y vos marcás "Llegó la transferencia".' },
  { id: 'efectivo', titulo: 'Efectivo', detalle: 'Paga al recibir. El pedido entra directo como confirmado.' },
];

const CAMPOS = [
  { id: 'alias', etiqueta: 'Alias', ayuda: 'Por ejemplo: burrimax.mp', inputMode: 'text' },
  { id: 'cvu', etiqueta: 'CVU o CBU', ayuda: '22 números', inputMode: 'numeric' },
  { id: 'titular', etiqueta: 'Titular de la cuenta', ayuda: 'Nombre completo, como figura en la cuenta', inputMode: 'text' },
] as const;

/** Medios de pago y datos para transferir. Valida con el mismo schema que el servidor. */
export default function EditorPagos({ pagosIniciales, transferenciaInicial }: Props) {
  const [pagos, setPagos] = useState<Pagos>(pagosIniciales);
  const [transferencia, setTransferencia] = useState<Transferencia>(transferenciaInicial);
  const [tocados, setTocados] = useState<Set<string>>(new Set());
  const [estado, setEstado] = useState<'sin-cambios' | 'cambios' | 'guardando' | 'guardado' | 'error'>('sin-cambios');
  const [mensaje, setMensaje] = useState<string | null>(null);

  const resultado = useMemo(() => configPagosSchema.safeParse({ pagos, transferencia }), [pagos, transferencia]);
  const errores = useMemo(() => {
    const porCampo: Record<string, string> = {};
    if (!resultado.success) {
      for (const problema of resultado.error.issues) {
        const clave = problema.path.join('.');
        if (!(clave in porCampo)) porCampo[clave] = problema.message;
      }
    }
    return porCampo;
  }, [resultado]);
  const error = (clave: string) => (tocados.has(clave) ? errores[clave] : undefined);

  const limpios = resultado.success ? resultado.data.transferencia : null;
  const cvuRaro = !!limpios?.cvu && !cvuDigitosOk(limpios.cvu);
  const sinDatos = pagos.transferencia && !!limpios && !limpios.alias && !limpios.cvu;

  const nombres = MEDIOS.filter((m) => pagos[m.id]).map((m) => m.titulo);

  function cambiarPago(id: keyof Pagos, valor: boolean) {
    setPagos({ ...pagos, [id]: valor });
    setTocados(new Set(tocados).add('pagos'));
    setEstado('cambios');
  }

  function cambiarCampo(id: keyof Transferencia, valor: string) {
    setTransferencia({ ...transferencia, [id]: valor });
    setEstado('cambios');
  }

  function tocar(clave: string) {
    if (!tocados.has(clave)) setTocados(new Set(tocados).add(clave));
  }

  async function guardar() {
    if (!resultado.success) {
      setTocados(new Set(['pagos', ...CAMPOS.map((c) => `transferencia.${c.id}`)]));
      setEstado('error');
      setMensaje('Revisá los campos marcados en rojo');
      return;
    }
    setEstado('guardando');
    setMensaje(null);
    try {
      const r = await fetch('/api/config/pagos', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(resultado.data),
      });
      const res = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) {
        setEstado('error');
        setMensaje(res.error ?? 'No se pudo guardar');
        return;
      }
      // Deja en pantalla lo que quedó guardado (sin espacios de más).
      const t = resultado.data.transferencia;
      setTransferencia({ alias: t.alias ?? '', cvu: t.cvu ?? '', titular: t.titular ?? '' });
      setEstado('guardado');
    } catch {
      setEstado('error');
      setMensaje('Sin conexión: no se guardó');
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 pb-28">
      <div>
        <h1 className="text-2xl font-bold">Pagos</h1>
        <p className="text-zinc-600">Elegí cómo te pueden pagar y a qué cuenta transferir. Los cambios se ven en la tienda al instante.</p>
      </div>

      <div className="rounded-2xl bg-zinc-900 p-4 text-white">
        <p className="text-sm text-zinc-400">Así lo ve el cliente al pagar</p>
        <p className="text-2xl font-bold">{nombres.length ? nombres.join(' · ') : 'Ningún medio de pago'}</p>
        {pagos.transferencia && (
          <p className="mt-1 text-zinc-300">
            {limpios?.alias ? `Transferencia al alias ${limpios.alias}` : limpios?.cvu ? 'Transferencia al CVU cargado' : 'Transferencia: "Te pasamos el alias por WhatsApp"'}
          </p>
        )}
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-lg font-bold">Formas de pago</legend>
        {MEDIOS.map((m) => (
          <label
            key={m.id}
            className={`flex min-h-16 cursor-pointer items-center gap-3 rounded-xl border-2 bg-white p-3 ${pagos[m.id] ? 'border-zinc-900' : 'border-transparent'}`}
          >
            <input
              type="checkbox"
              role="switch"
              checked={pagos[m.id]}
              onChange={(e) => cambiarPago(m.id, e.target.checked)}
              className="size-6 shrink-0"
            />
            <span>
              <span className="block font-bold">{m.titulo}</span>
              <span className="block text-sm text-zinc-600">{m.detalle}</span>
              {m.nota && pagos[m.id] && <span className="mt-1 block text-sm font-semibold text-amber-700">{m.nota}</span>}
            </span>
          </label>
        ))}
        {error('pagos') && (
          <p role="alert" className="font-semibold text-red-700">
            {error('pagos')}
          </p>
        )}
      </fieldset>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-bold">Datos para transferir</h2>
          <p className="text-sm text-zinc-600">
            {pagos.transferencia
              ? 'El cliente los ve para copiarlos. Con el alias alcanza; el CVU es opcional.'
              : 'La transferencia está apagada: el cliente no ve estos datos.'}
          </p>
        </div>
        <div className={`space-y-4 rounded-xl bg-white p-3 ${pagos.transferencia ? '' : 'opacity-60'}`}>
          {CAMPOS.map((c) => {
            const clave = `transferencia.${c.id}`;
            const mensajeError = error(clave);
            return (
              <div key={c.id}>
                <label htmlFor={`campo-${c.id}`} className="block font-bold">
                  {c.etiqueta}
                </label>
                <input
                  id={`campo-${c.id}`}
                  type="text"
                  inputMode={c.inputMode}
                  autoComplete="off"
                  autoCapitalize={c.id === 'titular' ? 'words' : 'none'}
                  autoCorrect="off"
                  spellCheck={false}
                  value={transferencia[c.id]}
                  onChange={(e) => cambiarCampo(c.id, e.target.value)}
                  onBlur={() => tocar(clave)}
                  aria-invalid={!!mensajeError}
                  aria-describedby={`ayuda-${c.id}`}
                  className={`mt-1 h-12 w-full rounded-lg border px-3 text-lg ${mensajeError ? 'border-red-600' : ''}`}
                />
                <p id={`ayuda-${c.id}`} className={`mt-1 text-sm ${mensajeError ? 'font-semibold text-red-700' : 'text-zinc-500'}`} role={mensajeError ? 'alert' : undefined}>
                  {mensajeError ?? c.ayuda}
                </p>
                {c.id === 'cvu' && cvuRaro && !mensajeError && (
                  <p className="mt-1 text-sm font-semibold text-amber-700">
                    Revisá los números: los dígitos verificadores no cierran. Si lo copiaste de tu app, podés guardarlo igual.
                  </p>
                )}
              </div>
            );
          })}
        </div>
        {sinDatos && (
          <p className="rounded-xl bg-amber-50 p-3 font-semibold text-amber-800">
            Sin alias ni CVU, el cliente ve "Te pasamos el alias por WhatsApp" y tenés que mandárselo a mano.
          </p>
        )}
      </section>

      <div className="fixed inset-x-0 bottom-0 border-t bg-white/95 p-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <span className="text-sm font-semibold" aria-live="polite">
            {estado === 'guardado' && <span className="text-green-700">✓ Guardado. La tienda ya lo muestra.</span>}
            {estado === 'cambios' && <span className="text-amber-700">Tenés cambios sin guardar</span>}
            {estado === 'error' && <span className="text-red-700">{mensaje}</span>}
          </span>
          <button
            type="button"
            onClick={guardar}
            disabled={estado === 'guardando' || estado === 'sin-cambios' || estado === 'guardado'}
            className="ml-auto h-12 rounded-xl bg-zinc-900 px-6 text-lg font-bold text-white disabled:opacity-40"
          >
            {estado === 'guardando' ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
