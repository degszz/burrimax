import type { EstadoPedido } from '@burritos/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BotonAvisos } from './BotonAvisos';
import { COLUMNAS, NOMBRE_PAGO, siguienteEstado, type PedidoTablero } from '@/lib/pedidos';

/** Cada cuánto se buscan pedidos nuevos (la sesión vive en cookies httpOnly del servidor). */
const CADA_MS = 8000;

const pesos = (n: number) => `$${n.toLocaleString('es-AR')}`;
const hora = (iso: string) =>
  new Intl.DateTimeFormat('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(iso));
const numero = (n: number) => `#${String(n).padStart(4, '0')}`;

/**
 * Tablero de la cocina: una columna por estado. Busca pedidos cada pocos
 * segundos, suena cuando entra uno nuevo y avanza cada pedido con un toque.
 * Cada cambio queda en el historial y el cliente lo ve en su seguimiento.
 */
export default function TableroPedidos() {
  const [pedidos, setPedidos] = useState<PedidoTablero[] | null>(null);
  const [sinConexion, setSinConexion] = useState(false);
  const [sonido, setSonido] = useState(false);
  const [nuevos, setNuevos] = useState<Set<string>>(new Set());
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imprimir, setImprimir] = useState<PedidoTablero | null>(null);
  const [aCancelar, setACancelar] = useState<PedidoTablero | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  // Celular: una columna a la vez, con pestañas.
  const [columnaMovil, setColumnaMovil] = useState<EstadoPedido>('confirmado');
  const [ahora, setAhora] = useState(() => Date.now());
  const conocidos = useRef<Set<string> | null>(null);
  const audio = useRef<AudioContext | null>(null);

  const sonar = useCallback(() => {
    const ctx = audio.current;
    if (!ctx) return;
    // Dos tonos cortos ("ding-dong"), bien audibles en la cocina.
    [880, 660].forEach((frecuencia, i) => {
      const osc = ctx.createOscillator();
      const vol = ctx.createGain();
      osc.frequency.value = frecuencia;
      vol.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.28);
      vol.gain.exponentialRampToValueAtTime(0.6, ctx.currentTime + i * 0.28 + 0.02);
      vol.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.28 + 0.26);
      osc.connect(vol).connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.28);
      osc.stop(ctx.currentTime + i * 0.28 + 0.3);
    });
  }, []);

  const cargar = useCallback(async () => {
    try {
      const r = await fetch('/api/pedidos', { headers: { accept: 'application/json' } });
      if (r.status === 401) {
        window.location.href = '/login';
        return;
      }
      if (!r.ok) throw new Error();
      const { pedidos: lista } = (await r.json()) as { pedidos: PedidoTablero[] };
      setSinConexion(false);
      setPedidos(lista);

      // Pedidos que no estaban antes → resaltar y sonar (no en la primera carga).
      const ids = new Set(lista.map((p) => p.id));
      if (conocidos.current) {
        const entrantes = lista.filter((p) => !conocidos.current!.has(p.id) && p.estado !== 'entregado' && p.estado !== 'cancelado');
        if (entrantes.length) {
          setNuevos((n) => new Set([...n, ...entrantes.map((p) => p.id)]));
          sonar();
        }
      }
      conocidos.current = ids;
    } catch {
      setSinConexion(true);
    }
  }, [sonar]);

  useEffect(() => {
    cargar();
    const t = window.setInterval(() => {
      if (document.visibilityState === 'visible') cargar();
    }, CADA_MS);
    const reloj = window.setInterval(() => setAhora(Date.now()), 30_000);
    const alVolver = () => document.visibilityState === 'visible' && cargar();
    document.addEventListener('visibilitychange', alVolver);
    return () => {
      window.clearInterval(t);
      window.clearInterval(reloj);
      document.removeEventListener('visibilitychange', alVolver);
    };
  }, [cargar]);

  // Imprimir: se muestra la comanda sola y se abre el diálogo de impresión.
  useEffect(() => {
    if (!imprimir) return;
    const t = window.setTimeout(() => {
      window.print();
      setImprimir(null);
    }, 50);
    return () => window.clearTimeout(t);
  }, [imprimir]);

  function activarSonido() {
    audio.current ??= new AudioContext();
    void audio.current.resume();
    setSonido(true);
    sonar();
  }

  // Aviso corto arriba ("Pedido #0003 cancelado").
  useEffect(() => {
    if (!aviso) return;
    const t = window.setTimeout(() => setAviso(null), 3500);
    return () => window.clearTimeout(t);
  }, [aviso]);

  async function accion(id: string, url: string, cuerpo: object, exito: string): Promise<boolean> {
    setOcupado(id);
    setError(null);
    setNuevos((n) => {
      const copia = new Set(n);
      copia.delete(id);
      return copia;
    });
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(cuerpo) });
      const res = (await r.json().catch(() => ({}))) as { error?: string };
      if (r.status === 401) {
        window.location.href = '/login';
        return false;
      }
      if (!r.ok) {
        setError(res.error ?? 'No se pudo guardar el cambio');
        return false;
      }
      setAviso(exito);
      await cargar();
      return true;
    } catch {
      setError('Sin conexión: no se guardó el cambio');
      return false;
    } finally {
      setOcupado(null);
    }
  }

  const avanzar = (p: PedidoTablero, estado: EstadoPedido) =>
    accion(p.id, `/api/pedidos/${p.id}/estado`, { estado }, `${numero(p.numero)} → ${COLUMNAS.find((c) => c.estado === estado)?.titulo ?? 'Entregado'}`);
  const marcarPagado = (p: PedidoTablero) => accion(p.id, `/api/pedidos/${p.id}/pagado`, {}, `${numero(p.numero)}: pago confirmado`);
  // Sin window.prompt: está bloqueado en varios navegadores (y en apps instaladas).
  async function confirmarCancelacion(p: PedidoTablero, motivo: string) {
    const ok = await accion(p.id, `/api/pedidos/${p.id}/estado`, { estado: 'cancelado', motivo }, `Pedido ${numero(p.numero)} cancelado`);
    if (ok) setACancelar(null);
  }

  const terminados = (pedidos ?? []).filter((p) => p.estado === 'entregado' || p.estado === 'cancelado');
  const vendidoHoy = terminados.filter((p) => p.estado === 'entregado').reduce((s, p) => s + p.total, 0);

  return (
    <>
      <div className="mx-auto max-w-[1600px] px-4 py-4 print:hidden">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">Pedidos</h1>
          {sinConexion && <span className="rounded-full bg-red-600 px-3 py-1 text-sm font-bold text-white">Sin conexión · reintentando</span>}
          <div className="flex w-full flex-wrap items-center gap-2 sm:ml-auto sm:w-auto">
            <BotonAvisos />
            {!sonido ? (
              <button type="button" onClick={activarSonido} className="h-11 rounded-xl bg-amber-400 px-4 text-sm font-bold">
                🔔 Activar sonido
              </button>
            ) : (
              <span className="text-sm font-semibold text-green-700">🔔 Sonido activado</span>
            )}
          </div>
        </div>
        {error && (
          <p role="alert" className="mb-3 rounded-xl bg-red-50 p-3 font-semibold text-red-700">
            {error}
          </p>
        )}
        {aviso && (
          <p role="status" className="fixed inset-x-4 top-16 z-50 mx-auto max-w-md rounded-xl bg-zinc-900 p-3 text-center font-semibold text-white shadow-lg">
            ✓ {aviso}
          </p>
        )}

        {/* Celular: pestañas por estado (una lista a la vez) */}
        {pedidos && (
          <div role="tablist" aria-label="Estados" className="sticky top-[60px] z-20 -mx-4 mb-3 flex gap-2 overflow-x-auto bg-zinc-100 px-4 py-2 md:hidden">
            {COLUMNAS.map((col) => {
              const n = pedidos.filter((p) => p.estado === col.estado).length;
              const hayNuevo = pedidos.some((p) => p.estado === col.estado && nuevos.has(p.id));
              return (
                <button
                  key={col.estado}
                  role="tab"
                  type="button"
                  aria-selected={columnaMovil === col.estado}
                  onClick={() => setColumnaMovil(col.estado)}
                  className={`relative flex h-11 shrink-0 items-center gap-1.5 rounded-full px-4 font-semibold ${columnaMovil === col.estado ? 'bg-zinc-900 text-white' : 'bg-white'}`}
                >
                  {col.titulo}
                  <span className={`rounded-full px-2 text-sm ${n ? 'bg-amber-400 text-zinc-900' : 'bg-zinc-200 text-zinc-500'}`}>{n}</span>
                  {hayNuevo && <span aria-label="nuevo" className="absolute -top-1 -right-1 size-3 rounded-full bg-red-600" />}
                </button>
              );
            })}
          </div>
        )}

        {pedidos === null ? (
          <p className="py-20 text-center text-lg text-zinc-500">Cargando pedidos…</p>
        ) : (
          <div className="pb-4 md:flex md:gap-4 md:overflow-x-auto xl:grid xl:grid-cols-5 xl:overflow-visible">
            {COLUMNAS.map((col) => {
              const lista = pedidos.filter((p) => p.estado === col.estado);
              return (
                <section
                  key={col.estado}
                  aria-label={col.titulo}
                  className={`${columnaMovil === col.estado ? 'block' : 'hidden'} md:block md:w-80 md:shrink-0 xl:w-auto`}
                >
                  <h2 className="mb-2 hidden items-center gap-2 text-lg font-bold md:flex">
                    {col.titulo}
                    <span className="rounded-full bg-zinc-900 px-2.5 text-sm text-white">{lista.length}</span>
                  </h2>
                  <div className="space-y-3">
                    {lista.length === 0 && <p className="rounded-xl border-2 border-dashed border-zinc-300 p-4 text-center text-zinc-400">Nada por acá</p>}
                    {lista.map((p) => (
                      <Tarjeta
                        key={p.id}
                        pedido={p}
                        nuevo={nuevos.has(p.id)}
                        ocupado={ocupado === p.id}
                        minutos={Math.floor((ahora - new Date(p.creado).getTime()) / 60000)}
                        onAvanzar={avanzar}
                        onPagado={marcarPagado}
                        onCancelar={setACancelar}
                        onImprimir={setImprimir}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {terminados.length > 0 && (
          <details className="mt-6 rounded-xl bg-white p-4">
            <summary className="cursor-pointer text-lg font-bold">
              Terminados (últimas 12 h): {terminados.length} · Entregado: {pesos(vendidoHoy)}
            </summary>
            <ul className="mt-3 divide-y">
              {terminados
                .slice()
                .reverse()
                .map((p) => (
                  <li key={p.id} className="flex flex-wrap justify-between gap-2 py-2">
                    <span>
                      <b>{numero(p.numero)}</b> · {hora(p.creado)} · {p.cliente}
                    </span>
                    <span className={p.estado === 'cancelado' ? 'font-semibold text-red-600' : 'font-semibold text-green-700'}>
                      {p.estado === 'cancelado' ? 'Cancelado' : 'Entregado'} · {pesos(p.total)}
                    </span>
                  </li>
                ))}
            </ul>
          </details>
        )}
      </div>

      {imprimir && <Comanda pedido={imprimir} />}
      {aCancelar && (
        <DialogoCancelar
          pedido={aCancelar}
          ocupado={ocupado === aCancelar.id}
          onCerrar={() => setACancelar(null)}
          onConfirmar={(motivo) => void confirmarCancelacion(aCancelar, motivo)}
        />
      )}
    </>
  );
}

interface TarjetaProps {
  pedido: PedidoTablero;
  nuevo: boolean;
  ocupado: boolean;
  minutos: number;
  onAvanzar: (p: PedidoTablero, estado: EstadoPedido) => void;
  onPagado: (p: PedidoTablero) => void;
  onCancelar: (p: PedidoTablero) => void;
  onImprimir: (p: PedidoTablero) => void;
}

function Tarjeta({ pedido: p, nuevo, ocupado, minutos, onAvanzar, onPagado, onCancelar, onImprimir }: TarjetaProps) {
  const siguiente = siguienteEstado(p);
  const cobrable = (p.metodoPago === 'transferencia' || p.metodoPago === 'efectivo') && p.estadoPago !== 'aprobado';
  const tarde = minutos > 30;
  const telefono = p.telefono.replace(/\D/g, '');
  const wa = `https://wa.me/${telefono.startsWith('54') ? telefono : `549${telefono}`}`;

  return (
    <article className={`rounded-2xl bg-white p-4 shadow-sm ${nuevo ? 'animate-pulse ring-4 ring-amber-400' : ''} ${ocupado ? 'opacity-60' : ''}`}>
      <header className="flex items-baseline justify-between gap-2">
        <span className="text-2xl font-black">{numero(p.numero)}</span>
        <span className={`text-sm font-bold ${tarde ? 'text-red-600' : 'text-zinc-500'}`}>
          {hora(p.creado)} · {minutos} min
        </span>
      </header>
      <p className="mt-1 text-lg font-semibold">{p.cliente}</p>
      <div className="mt-1 flex flex-wrap gap-2 text-sm">
        <a href={wa} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-green-600 px-3 py-1.5 font-bold text-white">
          WhatsApp
        </a>
        <span className="rounded-lg bg-zinc-100 px-3 py-1.5 font-semibold">{p.tipoEntrega === 'delivery' ? '🛵 Delivery' : '🏪 Retira'}</span>
      </div>
      {p.direccion && (
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.direccion)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 block font-semibold text-blue-700 underline"
        >
          📍 {p.direccion}
        </a>
      )}
      {p.referencias && <p className="text-sm text-zinc-600">{p.referencias}</p>}

      <ul className="mt-3 space-y-2 border-t pt-3">
        {p.items.map((item) => (
          <li key={item.id}>
            <p className="font-bold">
              {item.cantidad} × {item.nombre}
            </p>
            <p className="text-sm text-zinc-700">{describirItem(item.ingredientes)}</p>
          </li>
        ))}
      </ul>
      {p.notas && <p className="mt-2 rounded-lg bg-amber-50 p-2 text-sm font-semibold">📝 {p.notas}</p>}

      <div className="mt-3 flex items-center justify-between border-t pt-3">
        <span className="text-sm">
          {NOMBRE_PAGO[p.metodoPago]} ·{' '}
          <b className={p.estadoPago === 'aprobado' ? 'text-green-700' : 'text-amber-700'}>{p.estadoPago === 'aprobado' ? 'Pagado' : 'Sin pagar'}</b>
          {p.metodoPago === 'efectivo' && p.pagaCon ? (
            <>
              <br />
              Paga con {pesos(p.pagaCon)} · <b>vuelto {pesos(p.pagaCon - p.total)}</b>
            </>
          ) : null}
        </span>
        <span className="text-xl font-black">{pesos(p.total)}</span>
      </div>

      <div className="mt-3 grid gap-2">
        {cobrable && (
          <button type="button" disabled={ocupado} onClick={() => onPagado(p)} className="h-12 rounded-xl bg-amber-400 text-base font-bold">
            {p.metodoPago === 'transferencia' ? 'Llegó la transferencia' : 'Cobrado'}
          </button>
        )}
        {siguiente && (
          <button
            type="button"
            disabled={ocupado}
            onClick={() => onAvanzar(p, siguiente.estado)}
            className="h-14 rounded-xl bg-zinc-900 text-lg font-bold text-white"
          >
            {siguiente.texto} →
          </button>
        )}
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => onImprimir(p)} className="h-11 rounded-xl bg-zinc-100 font-semibold">
            🖨️ Comanda
          </button>
          <button type="button" disabled={ocupado} onClick={() => onCancelar(p)} className="h-11 rounded-xl bg-zinc-100 font-semibold text-red-700">
            Cancelar
          </button>
        </div>
      </div>
    </article>
  );
}

/** "Maíz · Vaca ×2 · Guacamole · Cebolla, Tomate" */
function describirItem(ingredientes: PedidoTablero['items'][number]['ingredientes']): string {
  const orden = ['tortilla', 'salsa', 'carne', 'vegetal'];
  return [...ingredientes]
    .sort((a, b) => orden.indexOf(a.categoria) - orden.indexOf(b.categoria))
    .map((g) => (g.porciones > 1 ? `${g.nombre} ×${g.porciones}` : g.nombre))
    .join(' · ');
}

/** Ticket para impresora de 58/80 mm: letra grande, ingredientes en lista. */
function Comanda({ pedido: p }: { pedido: PedidoTablero }) {
  return (
    <div className="hidden p-2 font-mono text-[15px] leading-snug text-black print:block">
      <p className="text-2xl font-black">{numero(p.numero)}</p>
      <p>
        {hora(p.creado)} · {p.tipoEntrega === 'delivery' ? 'DELIVERY' : 'RETIRA'}
      </p>
      <p className="font-bold">{p.cliente}</p>
      {p.direccion && <p>{p.direccion}</p>}
      {p.referencias && <p>{p.referencias}</p>}
      <hr className="my-2 border-black" />
      {p.items.map((item) => (
        <div key={item.id} className="mb-2">
          <p className="text-lg font-black">
            {item.cantidad} × {item.nombre}
          </p>
          <ul>
            {item.ingredientes.map((g) => (
              <li key={`${g.categoria}-${g.nombre}`}>
                - {g.nombre}
                {g.porciones > 1 ? ` x${g.porciones}` : ''}
              </li>
            ))}
            <li>- Papas fritas</li>
          </ul>
        </div>
      ))}
      {p.notas && <p className="font-bold">NOTA: {p.notas}</p>}
      <hr className="my-2 border-black" />
      <p>
        {NOMBRE_PAGO[p.metodoPago]} · {p.estadoPago === 'aprobado' ? 'PAGADO' : 'A COBRAR'}
      </p>
      <p className="text-xl font-black">TOTAL {pesos(p.total)}</p>
      {p.metodoPago === 'efectivo' && p.pagaCon ? <p>Vuelto: {pesos(p.pagaCon - p.total)}</p> : null}
    </div>
  );
}

const MOTIVOS = ['El cliente canceló', 'No hay stock', 'No llegó el pago', 'Fuera de la zona de envío', 'Pedido repetido'];

/** Cancelar con motivo (queda en el historial). Ventana propia: anda en celular y en la app instalada. */
function DialogoCancelar({
  pedido,
  ocupado,
  onCerrar,
  onConfirmar,
}: {
  pedido: PedidoTablero;
  ocupado: boolean;
  onCerrar: () => void;
  onConfirmar: (motivo: string) => void;
}) {
  const [elegido, setElegido] = useState<string | null>(null);
  const [otro, setOtro] = useState('');
  const motivo = (elegido === 'Otro' ? otro : elegido ?? '').trim();

  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar();
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [onCerrar]);

  return (
    <div className="fixed inset-0 z-[60] grid place-items-end bg-black/50 sm:place-items-center print:hidden" onClick={onCerrar}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-cancelar"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:rounded-3xl"
      >
        <h2 id="titulo-cancelar" className="text-xl font-bold">
          ¿Cancelar el pedido {numero(pedido.numero)}?
        </h2>
        <p className="text-zinc-600">
          {pedido.cliente} · {pesos(pedido.total)}. Elegí el motivo:
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {[...MOTIVOS, 'Otro'].map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={elegido === m}
              onClick={() => setElegido(m)}
              className={`min-h-11 rounded-full border-2 px-4 font-semibold ${elegido === m ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 bg-white'}`}
            >
              {m}
            </button>
          ))}
        </div>
        {elegido === 'Otro' && (
          <input
            autoFocus
            value={otro}
            maxLength={200}
            onChange={(e) => setOtro(e.target.value)}
            placeholder="Escribí el motivo"
            aria-label="Motivo"
            className="mt-3 h-12 w-full rounded-xl border px-3 text-lg"
          />
        )}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button type="button" onClick={onCerrar} className="h-12 rounded-xl bg-zinc-100 font-bold">
            Volver
          </button>
          <button
            type="button"
            disabled={!motivo || ocupado}
            onClick={() => onConfirmar(motivo)}
            className="h-12 rounded-xl bg-red-600 font-bold text-white disabled:opacity-40"
          >
            {ocupado ? 'Cancelando…' : 'Cancelar pedido'}
          </button>
        </div>
      </div>
    </div>
  );
}
