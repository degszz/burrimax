import { z } from 'zod';

// Horarios de la semana y "¿estamos abiertos ahora?". Lo usan la tienda (para
// mostrar Abierto/Cerrado y no aceptar pedidos fuera de hora) y el admin.
// La hora es SIEMPRE la de Argentina, sin importar dónde corra el servidor.

export const DIAS = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'] as const;
export type Dia = (typeof DIAS)[number];

export const NOMBRE_DIA: Record<Dia, string> = {
  lun: 'lunes',
  mar: 'martes',
  mie: 'miércoles',
  jue: 'jueves',
  vie: 'viernes',
  sab: 'sábado',
  dom: 'domingo',
};

export const ZONA_HORARIA = 'America/Argentina/Buenos_Aires';

const hora = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Hora inválida (HH:MM)');

/** Un turno. Si `hasta` es menor que `desde`, cruza la medianoche (20:00 → 01:00). */
export const turnoSchema = z
  .object({ desde: hora, hasta: hora })
  .refine((t) => t.desde !== t.hasta, 'El turno no puede empezar y terminar a la misma hora');
export type Turno = z.infer<typeof turnoSchema>;

export const horariosSchema = z.object(
  Object.fromEntries(DIAS.map((d) => [d, z.array(turnoSchema).max(3)])) as Record<Dia, z.ZodArray<typeof turnoSchema>>,
);
export type Horarios = z.infer<typeof horariosSchema>;

/** automatico: según los horarios · abierto/cerrado: a mano (ej. feriado o se llenó la cocina). */
export const MODOS_APERTURA = ['automatico', 'abierto', 'cerrado'] as const;
export type ModoApertura = (typeof MODOS_APERTURA)[number];

export const HORARIOS_VACIOS: Horarios = { lun: [], mar: [], mie: [], jue: [], vie: [], sab: [], dom: [] };

/**
 * Lee lo que haya en la base. Acepta el formato nuevo y el viejo del seed
 * ({"lun-dom": "19:30-23:30"}); lo que no entiende lo ignora.
 */
export function normalizarHorarios(valor: unknown): Horarios {
  const nuevo = horariosSchema.safeParse(valor);
  if (nuevo.success) return nuevo.data;

  const resultado: Horarios = copiarHorarios(HORARIOS_VACIOS);
  if (!valor || typeof valor !== 'object') return resultado;
  for (const [clave, rango] of Object.entries(valor as Record<string, unknown>)) {
    if (typeof rango !== 'string') continue;
    const [desde, hasta] = rango.split('-').map((s) => s.trim());
    const turno = turnoSchema.safeParse({ desde, hasta });
    if (!turno.success) continue;
    const [inicio, fin = inicio] = clave.split('-') as [string, string?];
    const i = DIAS.indexOf(inicio as Dia);
    const f = DIAS.indexOf(fin as Dia);
    if (i < 0 || f < 0) continue;
    for (let d = i; ; d = (d + 1) % 7) {
      resultado[DIAS[d]!].push(turno.data);
      if (d === f) break;
    }
  }
  return resultado;
}

function aMinutos(h: string): number {
  const [hh, mm] = h.split(':').map(Number);
  return hh! * 60 + mm!;
}

/** Día (0 = lunes) y minutos desde las 00:00, en hora de Argentina. */
export function ahoraEnArgentina(fecha: Date): { dia: number; minutos: number } {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: ZONA_HORARIA,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(fecha);
  const valor = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? '';
  const dias = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return { dia: dias.indexOf(valor('weekday')), minutos: Number(valor('hour')) * 60 + Number(valor('minute')) };
}

export interface EstadoApertura {
  abierto: boolean;
  /** Si está abierto: a qué hora cierra ("23:30"). */
  cierraA?: string;
  /** Si está cerrado: cuándo abre (dentro de los próximos 7 días). */
  proxima?: { dia: Dia; desde: string; enDias: number };
  /** Abierto/cerrado a mano desde el admin. */
  manual: boolean;
}

export function estadoApertura(modo: ModoApertura, horarios: Horarios, fecha: Date = new Date()): EstadoApertura {
  const { dia, minutos } = ahoraEnArgentina(fecha);

  if (modo === 'abierto') return { abierto: true, manual: true };

  // ¿Hay un turno corriendo? (de hoy, o de ayer que cruzó la medianoche)
  if (modo === 'automatico') {
    for (const turno of horarios[DIAS[dia]!]) {
      const d = aMinutos(turno.desde);
      const h = aMinutos(turno.hasta);
      if (h > d ? minutos >= d && minutos < h : minutos >= d) return { abierto: true, cierraA: turno.hasta, manual: false };
    }
    for (const turno of horarios[DIAS[(dia + 6) % 7]!]) {
      const d = aMinutos(turno.desde);
      const h = aMinutos(turno.hasta);
      if (h < d && minutos < h) return { abierto: true, cierraA: turno.hasta, manual: false };
    }
  }

  // Cerrado: el próximo turno que empieza (hoy más tarde o en los días siguientes).
  // Cerrado a mano no anuncia horario de hoy: puede que no abra.
  for (let enDias = modo === 'cerrado' ? 1 : 0; enDias <= 7; enDias++) {
    const d = DIAS[(dia + enDias) % 7]!;
    const turnos = [...horarios[d]].sort((a, b) => aMinutos(a.desde) - aMinutos(b.desde));
    const turno = turnos.find((t) => enDias > 0 || aMinutos(t.desde) > minutos);
    if (turno) return { abierto: false, proxima: { dia: d, desde: turno.desde, enDias }, manual: modo === 'cerrado' };
  }
  return { abierto: false, manual: modo === 'cerrado' };
}

/** Texto corto para la tienda: "Abierto · cierra 23:30", "Abrimos hoy a las 19:30"… */
export function textoApertura(estado: EstadoApertura): string {
  if (estado.abierto) return estado.cierraA ? `Abierto · cierra ${estado.cierraA}` : 'Abierto ahora';
  const p = estado.proxima;
  if (!p) return 'Cerrado por ahora';
  if (p.enDias === 0) return `Abrimos hoy a las ${p.desde}`;
  if (p.enDias === 1) return `Abrimos mañana a las ${p.desde}`;
  return `Abrimos el ${NOMBRE_DIA[p.dia]} a las ${p.desde}`;
}

/** Copia independiente (para editar sin tocar el original). */
export function copiarHorarios(h: Horarios): Horarios {
  return Object.fromEntries(DIAS.map((d) => [d, h[d].map((t) => ({ ...t }))])) as Horarios;
}
