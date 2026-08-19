/**
 * Límites de repetición de préstamos en función del periodo académico
 * al que pertenece la fecha del préstamo. La repetición nunca debe
 * extenderse más allá de la fecha_fin del periodo (backend/prestamos
 * asigna el periodo automáticamente según `fecha` y rechaza fechas
 * fuera de todo periodo).
 */

export type RepeatQuickOption =
  | 'none'
  | 'daily'
  | 'weekly_current'
  | 'monthly_date'
  | 'custom';

// 'year' se descarta a propósito: un periodo académico dura un semestre,
// nunca un año completo, así que una repetición anual jamás cabría una
// segunda vez dentro del periodo (ver backend/prestamos/views.py,
// _fin_periodo_vigente).
export type CustomPeriod = 'day' | 'week' | 'month';

export interface PeriodoRango {
  fecha_inicio: string;
  fecha_fin: string;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const parseFecha = (fecha: string): Date => new Date(`${fecha}T00:00:00`);

/** Días restantes desde `fecha` (inclusive) hasta el fin del periodo. */
export const diasRestantesEnPeriodo = (fecha: string, periodo: PeriodoRango): number => {
  const inicio = parseFecha(fecha);
  const fin = parseFecha(periodo.fecha_fin);
  return Math.floor((fin.getTime() - inicio.getTime()) / MS_PER_DAY);
};

/** Meses completos restantes desde `fecha` hasta el fin del periodo. */
export const mesesRestantesEnPeriodo = (fecha: string, periodo: PeriodoRango): number => {
  const inicio = parseFecha(fecha);
  const fin = parseFecha(periodo.fecha_fin);
  let meses =
    (fin.getFullYear() - inicio.getFullYear()) * 12 + (fin.getMonth() - inicio.getMonth());
  if (fin.getDate() < inicio.getDate()) meses -= 1;
  return Math.max(0, meses);
};

/**
 * Indica si una opción rápida de repetición ("Cada día", "Cada semana...",
 * "Cada mes...") cabe al menos una vez más dentro de lo que queda del
 * periodo. 'none' y 'custom' siempre están permitidas (custom se valida
 * aparte con `maxIntervaloPermitido`).
 */
export const opcionRapidaPermitida = (
  option: RepeatQuickOption,
  fecha: string | undefined,
  periodo: PeriodoRango | null
): boolean => {
  if (!fecha || !periodo) return true;
  if (option === 'none' || option === 'custom') return true;

  const dias = diasRestantesEnPeriodo(fecha, periodo);
  if (option === 'daily') return dias >= 1;
  if (option === 'weekly_current') return dias >= 7;
  if (option === 'monthly_date') return mesesRestantesEnPeriodo(fecha, periodo) >= 1;
  return true;
};

/**
 * Máximo intervalo permitido para el modo "Personalizar" según la unidad
 * elegida (día/semana/mes), de modo que la repetición no exceda el
 * periodo. Devuelve null si no hay fecha/periodo para acotar (sin límite
 * adicional al que ya impone la UI).
 */
export const maxIntervaloPermitido = (
  customPeriod: CustomPeriod,
  fecha: string | undefined,
  periodo: PeriodoRango | null
): number | null => {
  if (!fecha || !periodo) return null;

  if (customPeriod === 'day') return Math.max(1, diasRestantesEnPeriodo(fecha, periodo));
  if (customPeriod === 'week') return Math.max(1, Math.floor(diasRestantesEnPeriodo(fecha, periodo) / 7));
  return Math.max(1, mesesRestantesEnPeriodo(fecha, periodo));
};

/**
 * Número máximo de ocurrencias (repeticiones) que caben en lo que resta
 * del periodo, dado el intervalo y la unidad seleccionados. Se usa para
 * acotar "Después de N repeticiones" y como tope de auto-corrección.
 */
export const maxOcurrenciasEnPeriodo = (
  frecuenciaDias: number,
  fecha: string | undefined,
  periodo: PeriodoRango | null
): number | null => {
  if (!fecha || !periodo || frecuenciaDias <= 0) return null;
  const dias = diasRestantesEnPeriodo(fecha, periodo);
  return Math.max(1, Math.floor(dias / frecuenciaDias) + 1);
};

/** Fecha fin del periodo, usada como tope para `fin_repeticion_fecha`. */
export const fechaFinPeriodo = (periodo: PeriodoRango | null): string | null =>
  periodo ? periodo.fecha_fin : null;

/** Días aproximados entre ocurrencias, usado para acotar "N repeticiones". */
export const diasPorOcurrencia = (
  frecuencia: 'daily' | 'weekly' | 'monthly',
  intervalo: number
): number => {
  const unidad = frecuencia === 'daily' ? 1 : frecuencia === 'weekly' ? 7 : 30;
  return unidad * Math.max(1, intervalo);
};

/**
 * Máximo de ocurrencias permitidas para una opción rápida o personalizada,
 * dado el intervalo y unidad. Devuelve null si no hay fecha/periodo con qué acotar.
 */
export const maxOcurrenciasPorOpcion = (
  option: RepeatQuickOption,
  customPeriod: CustomPeriod,
  intervalo: number,
  fecha: string | undefined,
  periodo: PeriodoRango | null
): number | null => {
  if (!fecha || !periodo) return null;

  let frecuencia: 'daily' | 'weekly' | 'monthly';
  let intervaloEfectivo = 1;

  if (option === 'daily') frecuencia = 'daily';
  else if (option === 'weekly_current') frecuencia = 'weekly';
  else if (option === 'monthly_date') frecuencia = 'monthly';
  else if (option === 'custom') {
    frecuencia = customPeriod === 'day' ? 'daily' : customPeriod === 'week' ? 'weekly' : 'monthly';
    intervaloEfectivo = intervalo;
  } else {
    return null;
  }

  return maxOcurrenciasEnPeriodo(diasPorOcurrencia(frecuencia, intervaloEfectivo), fecha, periodo);
};
