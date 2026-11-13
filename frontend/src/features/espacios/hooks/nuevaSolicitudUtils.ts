import { WEEKDAY_NAMES, GRID_DIA_A_JS_WEEKDAY } from './consultaEspaciosComun';

/** Datos del formulario de la ventana «Nueva Solicitud». */
export interface FormDataSolicitud {
  sede_id: number;
  espacio_id: number;
  tipo_actividad_id: number;
  asistentes: string;
  motivo: string;
  telefono: string;
  es_recurrente: boolean;
  frecuencia: 'none' | 'daily' | 'weekly' | 'monthly' | 'weekdays';
  intervalo: number;
  dias_semana: number[];
  fin_repeticion_tipo: 'never' | 'until_date' | 'count';
  fin_repeticion_fecha: string;
  fin_repeticion_ocurrencias: string;
}

export type ConflictoForm = {
  tipo: 'horario' | 'prestamo';
  materia: string;
  horaInicio: number;
  horaFin: number;
};

export const FIN_REPETICION_OPTIONS = [
  { value: 'never', label: 'Nunca' },
  { value: 'until_date', label: 'Hasta una fecha' },
  { value: 'count', label: 'Después de N repeticiones' }
] as const;

export const DIAS_SEMANA_OPTIONS = [
  { value: 0, label: 'Lunes' },
  { value: 1, label: 'Martes' },
  { value: 2, label: 'Miércoles' },
  { value: 3, label: 'Jueves' },
  { value: 4, label: 'Viernes' },
  { value: 5, label: 'Sábado' },
  { value: 6, label: 'Domingo' }
] as const;

export const getWeekdayMondayIndex = (dateStr?: string, diaSemanaGrid?: string): number => {
  if (diaSemanaGrid && diaSemanaGrid in GRID_DIA_A_JS_WEEKDAY) {
    const js = GRID_DIA_A_JS_WEEKDAY[diaSemanaGrid];
    return js === 0 ? 6 : js - 1;
  }
  if (!dateStr) return 0;
  const jsDay = new Date(`${dateStr}T12:00:00`).getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
};

export const getWeekdayJSForRecurrence = (diaSemanaGrid?: string, dateStr?: string): number => {
  if (diaSemanaGrid && diaSemanaGrid in GRID_DIA_A_JS_WEEKDAY) {
    return GRID_DIA_A_JS_WEEKDAY[diaSemanaGrid];
  }
  return dateStr ? new Date(`${dateStr}T12:00:00`).getDay() : 0;
};

export const getOrdinalWeekdayText = (dateStr?: string, diaSemanaGrid?: string): string => {
  if (!dateStr) return 'primer lunes';
  const date = new Date(`${dateStr}T12:00:00`);
  const day = date.getDate();
  const ordinalNum = Math.floor((day - 1) / 7) + 1;
  const ordinals = ['primer', 'segundo', 'tercer', 'cuarto', 'quinto'];
  const weekdayName = WEEKDAY_NAMES[getWeekdayMondayIndex(dateStr, diaSemanaGrid)];
  return `${ordinals[Math.min(ordinalNum - 1, 4)]} ${weekdayName}`;
};
