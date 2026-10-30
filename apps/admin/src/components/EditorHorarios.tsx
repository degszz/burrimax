import {
  DIAS,
  NOMBRE_DIA,
  copiarHorarios,
  estadoApertura,
  textoApertura,
  type Dia,
  type Horarios,
  type ModoApertura,
} from '@burritos/shared';
import { useEffect, useState } from 'react';

interface Props {
  modoInicial: ModoApertura;
  horariosIniciales: Horarios;
}

const MODOS: { id: ModoApertura; titulo: string; detalle: string }[] = [
  { id: 'automatico', titulo: 'Automático', detalle: 'Abre y cierra solo según los horarios de abajo' },
  { id: 'abierto', titulo: 'Abierto ahora', detalle: 'Toma pedidos aunque esté fuera de horario' },
  { id: 'cerrado', titulo: 'Cerrado ahora', detalle: 'No toma pedidos (feriado, se llenó la cocina…)' },
];

/** Horarios de la semana y modo de apertura. Muestra en vivo lo que ve el cliente. */
export default function EditorHorarios({ modoInicial, horariosIniciales }: Props) {
  const [modo, setModo] = useState<ModoApertura>(modoInicial);
  const [horarios, setHorarios] = useState<Horarios>(() => copiarHorarios(horariosIniciales));
  const [estado, setEstado] = useState<'sin-cambios' | 'cambios' | 'guardando' | 'guardado' | 'error'>('sin-cambios');
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [ahora, setAhora] = useState(() => new Date());

  useEffect(() => {
    const t = window.setInterval(() => setAhora(new Date()), 30_000);
    return () => window.clearInterval(t);
  }, []);

  const vistaPrevia = textoApertura(estadoApertura(modo, horarios, ahora));

  function cambiar(nuevos: Horarios) {
    setHorarios(nuevos);
    setEstado('cambios');
  }

  function editarTurno(dia: Dia, i: number, campo: 'desde' | 'hasta', valor: string) {
    const nuevos = copiarHorarios(horarios);
    nuevos[dia][i]![campo] = valor;
    cambiar(nuevos);
  }

  function agregarTurno(dia: Dia) {
    const nuevos = copiarHorarios(horarios);
    nuevos[dia].push(nuevos[dia].length ? { desde: '12:00', hasta: '15:00' } : { desde: '19:30', hasta: '23:30' });
    cambiar(nuevos);
  }

  function quitarTurno(dia: Dia, i: number) {
    const nuevos = copiarHorarios(horarios);
    nuevos[dia].splice(i, 1);
    cambiar(nuevos);
  }

  function copiarATodos(dia: Dia) {
    const nuevos = copiarHorarios(horarios);
    for (const d of DIAS) nuevos[d] = horarios[dia].map((t) => ({ ...t }));
    cambiar(nuevos);
  }

  async function guardar() {
    setEstado('guardando');
    setMensaje(null);
    try {
      const r = await fetch('/api/config/horarios', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ modo, horarios }),
      });
      const res = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) {
        setEstado('error');
        setMensaje(res.error ?? 'No se pudo guardar');
        return;
      }
      setEstado('guardado');
    } catch {
      setEstado('error');
      setMensaje('Sin conexión: no se guardó');
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 pb-28">
      <div>
        <h1 className="text-2xl font-bold">Horarios</h1>
        <p className="text-zinc-600">Fuera de horario la tienda muestra cuándo abre y no toma pedidos. Hora de Argentina.</p>
      </div>

      <div className="rounded-2xl bg-zinc-900 p-4 text-white">
        <p className="text-sm text-zinc-400">Así lo ve el cliente ahora mismo</p>
        <p className="text-2xl font-bold">{vistaPrevia}</p>
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-lg font-bold">Modo</legend>
        {MODOS.map((m) => (
          <label
            key={m.id}
            className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 bg-white p-3 ${modo === m.id ? 'border-zinc-900' : 'border-transparent'}`}
          >
            <input
              type="radio"
              name="modo"
              checked={modo === m.id}
              onChange={() => {
                setModo(m.id);
                setEstado('cambios');
              }}
              className="size-5"
            />
            <span>
              <span className="block font-bold">{m.titulo}</span>
              <span className="block text-sm text-zinc-600">{m.detalle}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Semana</h2>
        <p className="text-sm text-zinc-600">Si cerrás después de medianoche, poné la hora igual (ej. 20:00 a 01:00).</p>
        {DIAS.map((dia) => (
          <div key={dia} className="rounded-xl bg-white p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-lg font-bold capitalize">{NOMBRE_DIA[dia]}</span>
              <div className="flex gap-2">
                {horarios[dia].length > 0 && (
                  <button type="button" onClick={() => copiarATodos(dia)} className="h-10 rounded-lg px-3 text-sm font-semibold text-zinc-600 hover:bg-zinc-100">
                    Copiar a todos
                  </button>
                )}
                {horarios[dia].length < 3 && (
                  <button type="button" onClick={() => agregarTurno(dia)} className="h-10 rounded-lg bg-zinc-100 px-3 text-sm font-bold">
                    + Turno
                  </button>
                )}
              </div>
            </div>
            {horarios[dia].length === 0 ? (
              <p className="mt-1 text-zinc-500">Cerrado</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {horarios[dia].map((turno, i) => (
                  <li key={i} className="flex flex-wrap items-center gap-2">
                    <input
                      type="time"
                      aria-label={`${NOMBRE_DIA[dia]}: abre`}
                      value={turno.desde}
                      onChange={(e) => editarTurno(dia, i, 'desde', e.target.value)}
                      className="h-12 rounded-lg border px-2 text-lg"
                    />
                    <span>a</span>
                    <input
                      type="time"
                      aria-label={`${NOMBRE_DIA[dia]}: cierra`}
                      value={turno.hasta}
                      onChange={(e) => editarTurno(dia, i, 'hasta', e.target.value)}
                      className="h-12 rounded-lg border px-2 text-lg"
                    />
                    {turno.hasta < turno.desde && <span className="text-sm font-semibold text-zinc-500">(hasta el día siguiente)</span>}
                    <button
                      type="button"
                      onClick={() => quitarTurno(dia, i)}
                      aria-label={`Quitar turno de ${NOMBRE_DIA[dia]}`}
                      className="ml-auto h-10 rounded-lg px-3 font-semibold text-red-700 hover:bg-red-50"
                    >
                      Quitar
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
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
