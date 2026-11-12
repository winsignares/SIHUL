/** Tipos, constantes y fechas que comparten la consulta de espacios y la ventana de nueva solicitud. */
export type RepeatQuickOption =
  | 'none'
  | 'daily'
  | 'weekly_current'
  | 'monthly_date'
  | 'custom';

// 'year' se descarta a propósito: un periodo académico dura un semestre,
// nunca un año completo, así que una repetición anual jamás cabría una
// segunda vez dentro del periodo.
export type CustomPeriod = 'day' | 'week' | 'month';

export const WEEKDAY_NAMES = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

/** Nombre de columna del cronograma → Date.getDay() (0=dom … 6=sáb). */
export const GRID_DIA_A_JS_WEEKDAY: Record<string, number> = {
  Domingo: 0,
  Lunes: 1,
  Martes: 2,
  Miércoles: 3,
  Jueves: 4,
  Viernes: 5,
  Sábado: 6
};

export function formatFechaLocalYYYYMMDD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getFechaColombiaISO(): string {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());

  const year = partes.find((p) => p.type === 'year')?.value;
  const month = partes.find((p) => p.type === 'month')?.value;
  const day = partes.find((p) => p.type === 'day')?.value;

  if (!year || !month || !day) {
    return new Date().toISOString().slice(0, 10);
  }

  return `${year}-${month}-${day}`;
}

export function getHoyColombia(): Date {
  return new Date(`${getFechaColombiaISO()}T00:00:00`);
}

// Helper para formatear hora decimal (e.g., 7.5) a formato de tiempo (e.g., "7:30")
export function formatHoraDecimal(hora: number): string {
  const horas = Math.floor(hora);
  const minutos = Math.round((hora % 1) * 60);
  return `${horas}:${String(minutos).padStart(2, '0')}`;
}

export function formatHoraApi(hora: number): string {
  const horas = Math.floor(hora);
  const minutos = Math.round((hora % 1) * 60);
  return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:00`;
}
