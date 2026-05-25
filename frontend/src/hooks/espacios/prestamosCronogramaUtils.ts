import type { PrestamoEspacio } from '../../services/prestamos/prestamoAPI';

/** Lunes=0 … Domingo=6 (igual que `dias_semana` en el formulario). */
function mondayBasedWeekday(d: Date): number {
  const js = d.getDay();
  return js === 0 ? 6 : js - 1;
}

function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatLocalISO(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${da}`;
}

function startOfIsoWeekMonday(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const idx = mondayBasedWeekday(x);
  x.setDate(x.getDate() - idx);
  return x;
}

function addCalendarMonths(year: number, monthIndex: number, delta: number): [number, number] {
  const d = new Date(year, monthIndex + delta, 1);
  return [d.getFullYear(), d.getMonth()];
}

/** weekdayJS: 0=domingo … 6=sábado (Date.getDay). ordinal 1 = primera aparición de ese día en el mes. */
function nthWeekdayOfMonth(
  year: number,
  monthIndex: number,
  weekdayJS: number,
  ordinal: number
): Date | null {
  if (ordinal < 1) return null;
  let count = 0;
  const d = new Date(year, monthIndex, 1);
  while (d.getMonth() === monthIndex) {
    if (d.getDay() === weekdayJS) {
      count += 1;
      if (count === ordinal) return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }
    d.setDate(d.getDate() + 1);
  }
  return null;
}

function lastWeekdayOfMonth(year: number, monthIndex: number, weekdayJS: number): Date | null {
  const d = new Date(year, monthIndex + 1, 0);
  while (d.getMonth() === monthIndex) {
    if (d.getDay() === weekdayJS) return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    d.setDate(d.getDate() - 1);
  }
  return null;
}

/** Misma regla que el formulario: “primer/segundo/…” = floor((díaMes-1)/7)+1. */
function ordinalWeekdayInMonthFromDate(base: Date): number {
  return Math.floor((base.getDate() - 1) / 7) + 1;
}

/**
 * Detecta si la fecha base coincide con el último {weekday} del mes (opción “último sábado…”).
 */
function esUltimoWeekdayDelMes(base: Date): boolean {
  const last = lastWeekdayOfMonth(base.getFullYear(), base.getMonth(), base.getDay());
  if (!last) return false;
  return formatLocalISO(base) === formatLocalISO(last);
}

function normalizarDiasSemanaLista(ds: unknown): number[] {
  if (ds == null) return [];
  if (typeof ds === 'string') {
    const t = ds.trim();
    if (!t) return [];
    try {
      return normalizarDiasSemanaLista(JSON.parse(t));
    } catch {
      return [];
    }
  }
  if (!Array.isArray(ds)) return [];
  const out: number[] = [];
  for (const x of ds) {
    const n = typeof x === 'number' ? x : Number(x);
    if (Number.isFinite(n)) out.push(n);
  }
  return out;
}

/**
 * Mensual: `[patrón, weekdayJS]` (0=énésimo, 1=último; weekday 0=dom…6=sáb).
 * Sin patrón guardado (BD vieja): asumir **último sábado** — antes se deducía el 1.er/énésimo sábado
 * desde la fecha (p. ej. 4 abr → 1.er sábado) y en mayo aparecía el día 2, no el último sábado.
 */
function interpretarMensual(p: PrestamoEspacio): { modo: 'last' | 'ordinal'; weekdayJS: number } {
  const norm = normalizarDiasSemanaLista(p.dias_semana);
  if (norm.length >= 2) {
    const p0 = norm[0];
    const p1 = norm[1];
    if ((p0 === 0 || p0 === 1) && p1 >= 0 && p1 <= 6) {
      return { modo: p0 === 1 ? 'last' : 'ordinal', weekdayJS: p1 };
    }
  }
  const freq = (p.frecuencia || '').toLowerCase();
  if (freq === 'monthly' && norm.length === 0) {
    return { modo: 'last', weekdayJS: 6 };
  }
  const base = parseLocalDate(p.fecha);
  const weekdayJS = base.getDay();
  const modo: 'last' | 'ordinal' = esUltimoWeekdayDelMes(base) ? 'last' : 'ordinal';
  return { modo, weekdayJS };
}

/**
 * Fechas en [rangeStart, rangeEnd] para préstamo mensual (primer/segundo/…/último día de la semana del mes).
 * Compatible con `dias_semana` vacío (heurística por fecha) o `[patrón, weekdayJS]` persistido.
 */
export function fechasMensualesEnRango(
  p: PrestamoEspacio,
  rangeStart: string,
  rangeEnd: string
): string[] {
  const r1 = rangeEnd || rangeStart;
  const base = parseLocalDate(p.fecha);
  const { modo, weekdayJS } = interpretarMensual(p);
  const ordinal = modo === 'ordinal' ? ordinalWeekdayInMonthFromDate(base) : 0;

  const intervalo = p.intervalo && p.intervalo >= 1 ? p.intervalo : 1;

  let limiteSuperior = r1;
  if (p.fin_repeticion_tipo === 'until_date' && p.fin_repeticion_fecha) {
    if (p.fin_repeticion_fecha < limiteSuperior) limiteSuperior = p.fin_repeticion_fecha;
  }

  const finRango = parseLocalDate(limiteSuperior);
  const ultimoMesInicio = new Date(finRango.getFullYear(), finRango.getMonth(), 1);

  const fechaEnMes = (year: number, monthIdx: number): Date | null => {
    if (modo === 'last') return lastWeekdayOfMonth(year, monthIdx, weekdayJS);
    return nthWeekdayOfMonth(year, monthIdx, weekdayJS, ordinal);
  };

  if (p.fin_repeticion_tipo === 'count' && typeof p.fin_repeticion_ocurrencias === 'number' && p.fin_repeticion_ocurrencias >= 1) {
    const maxN = p.fin_repeticion_ocurrencias;
    const todas: string[] = [];
    let y = base.getFullYear();
    let m = base.getMonth();
    let n = 0;
    while (n < maxN && y < 2100) {
      const hit = fechaEnMes(y, m);
      if (hit) {
        const iso = formatLocalISO(hit);
        if (iso >= p.fecha) {
          todas.push(iso);
          n += 1;
        }
      }
      [y, m] = addCalendarMonths(y, m, intervalo);
    }
    return todas.filter((iso) => iso >= rangeStart && iso <= r1 && iso <= limiteSuperior);
  }

  const out: string[] = [];
  let y = base.getFullYear();
  let m = base.getMonth();

  while (true) {
    const mesInicio = new Date(y, m, 1);
    if (mesInicio > ultimoMesInicio) break;

    const hit = fechaEnMes(y, m);
    if (hit) {
      const iso = formatLocalISO(hit);
      if (iso >= p.fecha && iso >= rangeStart && iso <= r1 && iso <= limiteSuperior) {
        out.push(iso);
      }
    }

    [y, m] = addCalendarMonths(y, m, intervalo);
    if (y > 2100) break;
  }

  return out;
}

/** Anual: mismo mes/día; 29 feb en año no bisiesto → 28 feb (alineado con Django `date` + años). */
function fechaAnualDesdeBase(year: number, base: Date): Date | null {
  const month = base.getMonth();
  const day = base.getDate();
  const candidate = new Date(year, month, day);
  if (
    candidate.getFullYear() === year &&
    candidate.getMonth() === month &&
    candidate.getDate() === day
  ) {
    return candidate;
  }
  if (month === 1 && day === 29) {
    const feb28 = new Date(year, 1, 28);
    if (feb28.getFullYear() === year && feb28.getMonth() === 1 && feb28.getDate() === 28) {
      return feb28;
    }
  }
  return null;
}

/**
 * Fechas en [rangeStart, rangeEnd] para préstamo anual (mismo día y mes cada `intervalo` años).
 */
export function fechasAnualesEnRango(
  p: PrestamoEspacio,
  rangeStart: string,
  rangeEnd: string
): string[] {
  const r1 = rangeEnd || rangeStart;
  const base = parseLocalDate(p.fecha);
  const intervalo = p.intervalo && p.intervalo >= 1 ? p.intervalo : 1;

  let limiteSuperior = r1;
  if (p.fin_repeticion_tipo === 'until_date' && p.fin_repeticion_fecha) {
    if (p.fin_repeticion_fecha < limiteSuperior) limiteSuperior = p.fin_repeticion_fecha;
  }

  if (p.fin_repeticion_tipo === 'count' && typeof p.fin_repeticion_ocurrencias === 'number' && p.fin_repeticion_ocurrencias >= 1) {
    const maxN = p.fin_repeticion_ocurrencias;
    const todas: string[] = [];
    let y = base.getFullYear();
    let n = 0;
    while (n < maxN && y < 2200) {
      const hit = fechaAnualDesdeBase(y, base);
      if (hit) {
        const iso = formatLocalISO(hit);
        if (iso >= p.fecha) {
          todas.push(iso);
          n += 1;
        }
      }
      y += intervalo;
    }
    return todas.filter((iso) => iso >= rangeStart && iso <= r1 && iso <= limiteSuperior);
  }

  const out: string[] = [];
  const topeAno = parseLocalDate(limiteSuperior).getFullYear();
  let y = base.getFullYear();
  while (y <= topeAno + 1 && y < 2200) {
    const hit = fechaAnualDesdeBase(y, base);
    if (hit) {
      const iso = formatLocalISO(hit);
      if (iso >= p.fecha && iso >= rangeStart && iso <= r1 && iso <= limiteSuperior) {
        out.push(iso);
      }
    }
    y += intervalo;
  }

  return out;
}

/**
 * Fechas (YYYY-MM-DD) en [rangeStart, rangeEnd] que cumplen la serie semanal del préstamo padre.
 * Solo para `es_recurrente` + `weekly` + `dias_semana`; no usar en filas hijas ya materializadas.
 */
export function fechasSemanalesEnRango(
  p: PrestamoEspacio,
  rangeStart: string,
  rangeEnd: string
): string[] {
  const r1 = rangeEnd || rangeStart;
  const dias = p.dias_semana;
  if (!dias?.length) return [];

  const intervalo = p.intervalo && p.intervalo >= 1 ? p.intervalo : 1;
  const base = parseLocalDate(p.fecha);
  const baseWeek = startOfIsoWeekMonday(base);

  let limiteSuperior = r1;
  if (p.fin_repeticion_tipo === 'until_date' && p.fin_repeticion_fecha) {
    if (p.fin_repeticion_fecha < limiteSuperior) limiteSuperior = p.fin_repeticion_fecha;
  }

  const inicioRango = parseLocalDate(rangeStart);
  const finRango = parseLocalDate(limiteSuperior);

  const out: string[] = [];

  const encajaIntervalo = (d: Date): boolean => {
    const weekD = startOfIsoWeekMonday(d);
    const weeksDiff = Math.round((weekD.getTime() - baseWeek.getTime()) / (7 * 24 * 60 * 60 * 1000));
    if (weeksDiff < 0) return false;
    return weeksDiff % intervalo === 0;
  };

  if (p.fin_repeticion_tipo === 'count' && typeof p.fin_repeticion_ocurrencias === 'number' && p.fin_repeticion_ocurrencias >= 1) {
    const maxN = p.fin_repeticion_ocurrencias;
    const todas: string[] = [];
    const d = new Date(base);
    let tomadas = 0;
    while (tomadas < maxN && d.getFullYear() < 2100) {
      const wd = mondayBasedWeekday(d);
      if (dias.includes(wd) && encajaIntervalo(d)) {
        const iso = formatLocalISO(d);
        if (iso >= p.fecha) {
          todas.push(iso);
          tomadas += 1;
        }
      }
      d.setDate(d.getDate() + 1);
    }
    return todas.filter((iso) => iso >= rangeStart && iso <= r1 && iso <= limiteSuperior);
  }

  const d = new Date(Math.max(inicioRango.getTime(), base.getTime()));
  while (d <= finRango) {
    const wd = mondayBasedWeekday(d);
    if (dias.includes(wd) && encajaIntervalo(d)) {
      const iso = formatLocalISO(d);
      if (iso >= p.fecha && iso >= rangeStart && iso <= r1) {
        out.push(iso);
      }
    }
    d.setDate(d.getDate() + 1);
  }

  return out;
}

/** Incluye préstamos cuya fecha cae en el rango o cuya serie recurrente cruza el rango (semanal, mensual o anual). */
export function prestamoIntersectsRangoCronograma(
  p: PrestamoEspacio,
  rangeStart: string,
  rangeEnd: string
): boolean {
  const r1 = rangeEnd || rangeStart;
  if (p.estado !== 'Aprobado' && p.estado !== 'Pendiente') return false;

  if (p.fecha >= rangeStart && p.fecha <= r1) return true;

  if (p.prestamo_padre_id || p.es_ocurrencia_generada) return false;

  if (!p.es_recurrente) return false;

  if (p.fecha > r1) return false;
  if (p.fin_repeticion_tipo === 'until_date' && p.fin_repeticion_fecha && p.fin_repeticion_fecha < rangeStart) {
    return false;
  }

  const freq = (p.frecuencia || '').toLowerCase();
  if (freq === 'weekly' && p.dias_semana?.length) {
    return fechasSemanalesEnRango(p, rangeStart, r1).length > 0;
  }

  if (freq === 'monthly') {
    return fechasMensualesEnRango(p, rangeStart, r1).length > 0;
  }

  if (freq === 'yearly') {
    return fechasAnualesEnRango(p, rangeStart, r1).length > 0;
  }

  return false;
}

/**
 * Expande el padre de una serie semanal en varias filas con `fecha` distinta (misma fila BD).
 * Las filas hijas reales en BD se dejan igual.
 */
export function expandirPrestamosParaCronograma(
  prestamos: PrestamoEspacio[],
  rangeStart: string,
  rangeEnd: string
): PrestamoEspacio[] {
  const r1 = rangeEnd || rangeStart;
  const out: PrestamoEspacio[] = [];

  for (const p of prestamos) {
    // Ocurrencias hijas en BD: ignorar si es serie recurrente (el padre se expande en el cliente)
    if (p.prestamo_padre_id && p.es_recurrente) {
      continue;
    }

    if (p.prestamo_padre_id || p.es_ocurrencia_generada) {
      if (p.fecha >= rangeStart && p.fecha <= r1) out.push(p);
      continue;
    }

    const freq = (p.frecuencia || '').toLowerCase();
    if (p.es_recurrente && freq === 'weekly' && p.dias_semana?.length) {
      const fechas = fechasSemanalesEnRango(p, rangeStart, r1);
      if (fechas.length === 0) continue;
      for (const fecha of fechas) {
        out.push({ ...p, fecha });
      }
    } else if (p.es_recurrente && freq === 'monthly') {
      const fechas = fechasMensualesEnRango(p, rangeStart, r1);
      if (fechas.length === 0) continue;
      for (const fecha of fechas) {
        out.push({ ...p, fecha });
      }
    } else if (p.es_recurrente && freq === 'yearly') {
      const fechas = fechasAnualesEnRango(p, rangeStart, r1);
      if (fechas.length === 0) continue;
      for (const fecha of fechas) {
        out.push({ ...p, fecha });
      }
    } else {
      if (p.fecha >= rangeStart && p.fecha <= r1) out.push(p);
    }
  }

  return out;
}

/** Día de la semana en español para una fecha YYYY-MM-DD (hora local, sin desfase UTC). */
export function getDiaSemanaEspanolDesdeISO(fecha: string): string {
  const [y, m, d] = fecha.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return dias[date.getDay()];
}
