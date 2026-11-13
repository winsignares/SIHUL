import type { useConsultaEspacios } from './useConsultaEspacios';
import { type RepeatQuickOption, type CustomPeriod, WEEKDAY_NAMES } from './consultaEspaciosComun';
import {
  getOrdinalWeekdayText,
  getWeekdayJSForRecurrence,
  getWeekdayMondayIndex,
  type FormDataSolicitud,
} from './nuevaSolicitudUtils';

type DeConsulta = ReturnType<typeof useConsultaEspacios>;

/** Cálculos de la repetición de una solicitud: datos para el backend, resumen y fechas de vista previa. */
export function crearCalculosRecurrencia({ formData, repeatOption, customPeriod, nuevaSolicitudData }: {
  formData: FormDataSolicitud;
  repeatOption: RepeatQuickOption;
  customPeriod: CustomPeriod;
  nuevaSolicitudData: DeConsulta['nuevaSolicitudData'];
}) {
  const buildRecurrenceFromSelection = () => {
    const baseEnd = {
      fin_repeticion_tipo: formData.fin_repeticion_tipo,
      fin_repeticion_fecha: formData.fin_repeticion_tipo === 'until_date' ? formData.fin_repeticion_fecha : '',
      fin_repeticion_ocurrencias:
        formData.fin_repeticion_tipo === 'count' ? formData.fin_repeticion_ocurrencias : ''
    };

    if (repeatOption === 'none') {
      return {
        es_recurrente: false,
        frecuencia: 'none' as const,
        intervalo: 1,
        dias_semana: [] as number[],
        ...baseEnd
      };
    }

    if (repeatOption === 'daily') {
      return {
        es_recurrente: true,
        frecuencia: 'daily' as const,
        intervalo: 1,
        dias_semana: [] as number[],
        ...baseEnd
      };
    }

    if (repeatOption === 'weekly_current') {
      return {
        es_recurrente: true,
        frecuencia: 'weekly' as const,
        intervalo: 1,
        dias_semana: [getWeekdayMondayIndex(nuevaSolicitudData?.fecha, nuevaSolicitudData?.diaSemana)],
        ...baseEnd
      };
    }

    if (repeatOption === 'monthly_date') {
      const fechaBase = nuevaSolicitudData?.fecha;
      const diaG = nuevaSolicitudData?.diaSemana;
      const date = fechaBase ? new Date(`${fechaBase}T12:00:00`) : null;
      const day = date ? date.getDate() : 1;
      // ordinalNum: 1=primer, 2=segundo, 3=tercer, 4=cuarto, 5=quinto
      const ordinalNum = Math.floor((day - 1) / 7) + 1;
      // weekdayJS: 0=domingo ... 6=sábado
      const weekdayJS = getWeekdayJSForRecurrence(diaG, fechaBase);
      // dias_semana para mensual: [patrón, weekdayJS] donde patrón 0=énésimo
      return {
        es_recurrente: true,
        frecuencia: 'monthly' as const,
        intervalo: 1,
        dias_semana: [ordinalNum - 1, weekdayJS] as [number, number],
        ...baseEnd
      };
    }

    const customFrequency =
      customPeriod === 'day'
        ? 'daily' as const
        : customPeriod === 'week'
          ? 'weekly' as const
          : 'monthly' as const;

    return {
      es_recurrente: true,
      frecuencia: customFrequency,
      intervalo: Math.max(1, formData.intervalo),
      dias_semana: customFrequency === 'weekly' ? formData.dias_semana : [],
      ...baseEnd
    };
  };

  const recurrenceSummary = () => {
    const finishText =
      formData.fin_repeticion_tipo === 'until_date' && formData.fin_repeticion_fecha
        ? ` hasta el ${new Date(`${formData.fin_repeticion_fecha}T00:00:00`).toLocaleDateString('es-CO')}`
        : formData.fin_repeticion_tipo === 'count' && formData.fin_repeticion_ocurrencias
          ? ` durante ${formData.fin_repeticion_ocurrencias} repeticiones`
          : '';

    if (repeatOption === 'none') return 'No se repetirá.';
    if (repeatOption === 'daily') return `Se repetirá cada día${finishText}.`;
    if (repeatOption === 'weekly_current') {
      return `Se repetirá cada semana el ${WEEKDAY_NAMES[getWeekdayMondayIndex(nuevaSolicitudData?.fecha, nuevaSolicitudData?.diaSemana)]}${finishText}.`;
    }
    if (repeatOption === 'monthly_date') {
      const ordinalText = getOrdinalWeekdayText(nuevaSolicitudData?.fecha, nuevaSolicitudData?.diaSemana);
      return `Se repetirá cada mes el ${ordinalText}${finishText}.`;
    }
    const periodText = customPeriod === 'day' ? 'día' : customPeriod === 'week' ? 'semana' : 'mes';
    const daysText =
      customPeriod === 'week' && formData.dias_semana.length > 0
        ? ` los ${formData.dias_semana.map((d) => WEEKDAY_NAMES[d]).join(', ')}`
        : '';
    return `Se repetirá cada ${Math.max(1, formData.intervalo)} ${periodText}${Math.max(1, formData.intervalo) > 1 ? 's' : ''}${daysText}${finishText}.`;
  };

  // Función para generar las fechas de repetición según la configuración
  const generateRecurrenceDates = (): Date[] => {
    if (!nuevaSolicitudData?.fecha) return [];

    const startDate = new Date(`${nuevaSolicitudData.fecha}T12:00:00`);
    const dates: Date[] = [new Date(startDate)];

    // Si no hay repetición, solo retornar la fecha inicial
    if (repeatOption === 'none') return dates;

    let interval = 1;
    let frequency: 'daily' | 'weekly' | 'monthly' = 'daily';
    let selectedDays: number[] = [];

    // Configurar parámetros según la opción seleccionada
    switch (repeatOption) {
      case 'daily':
        frequency = 'daily';
        interval = 1;
        break;
      case 'weekly_current':
        frequency = 'weekly';
        interval = 1;
        selectedDays = [getWeekdayMondayIndex(nuevaSolicitudData.fecha, nuevaSolicitudData.diaSemana)];
        break;
      case 'monthly_date':
        frequency = 'monthly';
        interval = 1;
        break;
      case 'custom':
        frequency = customPeriod === 'day' ? 'daily' :
                   customPeriod === 'week' ? 'weekly' : 'monthly';
        interval = Math.max(1, formData.intervalo);
        selectedDays = frequency === 'weekly' ? formData.dias_semana : [];
        break;
    }

    // Calcular fecha límite
    let maxOccurrences = 100; // Límite de seguridad por defecto
    let endDate: Date | null = null;

    if (formData.fin_repeticion_tipo === 'count' && formData.fin_repeticion_ocurrencias) {
      maxOccurrences = parseInt(formData.fin_repeticion_ocurrencias);
    } else if (formData.fin_repeticion_tipo === 'until_date' && formData.fin_repeticion_fecha) {
      endDate = new Date(`${formData.fin_repeticion_fecha}T23:59:59`);
      maxOccurrences = 365; // Límite para búsqueda por fecha
    }

    // Generar fechas
    let currentDate = new Date(startDate);
    const safetyLimit = 365; // Límite máximo de iteraciones

    for (let i = 0; i < safetyLimit && dates.length < maxOccurrences + 1; i++) {
      let nextDate: Date | null = null;

      switch (frequency) {
        case 'daily':
          nextDate = new Date(currentDate);
          nextDate.setDate(nextDate.getDate() + interval);
          break;

        case 'weekly':
          if (selectedDays.length === 0) {
            // Si no hay días seleccionados, usar el día de la fecha inicial
            nextDate = new Date(currentDate);
            nextDate.setDate(nextDate.getDate() + (interval * 7));
          } else {
            // Encontrar el siguiente día seleccionado
            const currentWeekday = currentDate.getDay(); // 0=dom, 1=lun, ..., 6=sáb
            const currentMondayIndex = currentWeekday === 0 ? 6 : currentWeekday - 1; // 0=lun, ..., 6=dom

            // Ordenar días seleccionados
            const sortedDays = [...selectedDays].sort((a, b) => a - b);

            // Buscar el siguiente día en la semana actual
            const nextDay = sortedDays.find(d => d > currentMondayIndex);

            if (nextDay !== undefined) {
              // Hay un día posterior en esta semana
              const daysToAdd = nextDay - currentMondayIndex;
              nextDate = new Date(currentDate);
              nextDate.setDate(nextDate.getDate() + daysToAdd);
            } else {
              // Pasar a la siguiente semana
              const firstDayOfWeek = sortedDays[0];
              const daysToAdd = (7 - currentMondayIndex) + firstDayOfWeek + ((interval - 1) * 7);
              nextDate = new Date(currentDate);
              nextDate.setDate(nextDate.getDate() + daysToAdd);
            }
          }
          break;

        case 'monthly':
          nextDate = new Date(currentDate);
          nextDate.setMonth(nextDate.getMonth() + interval);
          break;
      }

      if (!nextDate) break;

      // Verificar si excede la fecha límite
      if (endDate && nextDate > endDate) break;

      // Agregar la fecha
      dates.push(nextDate);
      currentDate = nextDate;
    }

    return dates;
  };

  return { buildRecurrenceFromSelection, recurrenceSummary, generateRecurrenceDates };
}
