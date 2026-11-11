import type { useConsultaEspacios } from './useConsultaEspacios';
import type { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import { tipoActividadService, type TipoActividad } from '../../services/prestamos/tipoActividadAPI';
import { recursoService, type Recurso } from '../../services/recursos/recursoAPI';
import { sedeService } from '../../services/sedes/sedeAPI';
import { prestamosPublicAPI, type EspacioDisponibleAPI } from '../../services/prestamos/prestamosPublicAPI';
import { prestamoService, type RecursoPrestamo } from '../../services/prestamos/prestamoAPI';
import { toast } from 'sonner';
import type { Sede } from '../../services/sedes/sedeAPI';
import {
  opcionRapidaPermitida,
  maxIntervaloPermitido,
  maxOcurrenciasPorOpcion,
  fechaFinPeriodo,
} from '../../utils/recurrenceLimits';

import {
  type RepeatQuickOption,
  type CustomPeriod,
  WEEKDAY_NAMES,
  GRID_DIA_A_JS_WEEKDAY,
} from './consultaEspaciosComun';

type DeConsulta = ReturnType<typeof useConsultaEspacios>;

/** Datos de la página que usa la ventana. */
export interface ContextoNuevaSolicitud {
  user: ReturnType<typeof useAuth>['user'];
  dialogSolicitudOpen: DeConsulta['dialogSolicitudOpen'];
  setDialogSolicitudOpen: DeConsulta['setDialogSolicitudOpen'];
  nuevaSolicitudData: DeConsulta['nuevaSolicitudData'];
  filteredEspacios: DeConsulta['filteredEspacios'];
  horarios: DeConsulta['horarios'];
  getConflictoEnRango: DeConsulta['getConflictoEnRango'];
  periodoSeleccionado: DeConsulta['periodos'][number] | null;
  puedeEditarDisponibilidad: boolean;
  describirConflicto: (conflicto: DeConsulta['horarios'][number]) => string;
}

/** Estado y reglas de la ventana «Nueva Solicitud» de la consulta de espacios. */
export function useNuevaSolicitud({ user, dialogSolicitudOpen, nuevaSolicitudData, filteredEspacios, horarios, getConflictoEnRango, periodoSeleccionado, puedeEditarDisponibilidad, describirConflicto }: ContextoNuevaSolicitud) {
  // Estados para el formulario de solicitud
  const [tiposActividad, setTiposActividad] = useState<TipoActividad[]>([]);
  const [recursosDisponibles, setRecursosDisponibles] = useState<Recurso[]>([]);
  const [sedesList, setSedesList] = useState<Sede[]>([]);
  const [espaciosDisponibles, setEspaciosDisponibles] = useState<EspacioDisponibleAPI[]>([]);
  const [recursosSeleccionados, setRecursosSeleccionados] = useState<RecursoPrestamo[]>([]);
  const [formData, setFormData] = useState({
    sede_id: 0,
    espacio_id: 0,
    tipo_actividad_id: 0,
    asistentes: '',
    motivo: '',
    telefono: '',
    es_recurrente: false,
    frecuencia: 'none' as 'none' | 'daily' | 'weekly' | 'monthly' | 'weekdays',
    intervalo: 1,
    dias_semana: [] as number[],
    fin_repeticion_tipo: 'never' as 'never' | 'until_date' | 'count',
    fin_repeticion_fecha: '',
    fin_repeticion_ocurrencias: ''
  });
  const [repeatOption, setRepeatOption] = useState<RepeatQuickOption>('none');
  const [customPeriod, setCustomPeriod] = useState<CustomPeriod>('week');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [recurrencePreviewDates, setRecurrencePreviewDates] = useState<Date[]>([]);

  // Estado para hora fin editable en el formulario de solicitud
  const [horaFinEditable, setHoraFinEditable] = useState<number | null>(null);
  
  // Estado para conflictos en el formulario (recalculados cuando cambia la hora)
  type ConflictoForm = {
    tipo: 'horario' | 'prestamo';
    materia: string;
    horaInicio: number;
    horaFin: number;
  };
  const [conflictosFormulario, setConflictosFormulario] = useState<ConflictoForm[]>([]);

  const FIN_REPETICION_OPTIONS = [
    { value: 'never', label: 'Nunca' },
    { value: 'until_date', label: 'Hasta una fecha' },
    { value: 'count', label: 'Después de N repeticiones' }
  ] as const;

  const DIAS_SEMANA_OPTIONS = [
    { value: 0, label: 'Lunes' },
    { value: 1, label: 'Martes' },
    { value: 2, label: 'Miércoles' },
    { value: 3, label: 'Jueves' },
    { value: 4, label: 'Viernes' },
    { value: 5, label: 'Sábado' },
    { value: 6, label: 'Domingo' }
  ] as const;

  const getWeekdayMondayIndex = (dateStr?: string, diaSemanaGrid?: string): number => {
    if (diaSemanaGrid && diaSemanaGrid in GRID_DIA_A_JS_WEEKDAY) {
      const js = GRID_DIA_A_JS_WEEKDAY[diaSemanaGrid];
      return js === 0 ? 6 : js - 1;
    }
    if (!dateStr) return 0;
    const jsDay = new Date(`${dateStr}T12:00:00`).getDay();
    return jsDay === 0 ? 6 : jsDay - 1;
  };

  const getWeekdayJSForRecurrence = (diaSemanaGrid?: string, dateStr?: string): number => {
    if (diaSemanaGrid && diaSemanaGrid in GRID_DIA_A_JS_WEEKDAY) {
      return GRID_DIA_A_JS_WEEKDAY[diaSemanaGrid];
    }
    return dateStr ? new Date(`${dateStr}T12:00:00`).getDay() : 0;
  };

  const getOrdinalWeekdayText = (dateStr?: string, diaSemanaGrid?: string): string => {
    if (!dateStr) return 'primer lunes';
    const date = new Date(`${dateStr}T12:00:00`);
    const day = date.getDate();
    const ordinalNum = Math.floor((day - 1) / 7) + 1;
    const ordinals = ['primer', 'segundo', 'tercer', 'cuarto', 'quinto'];
    const weekdayName = WEEKDAY_NAMES[getWeekdayMondayIndex(dateStr, diaSemanaGrid)];
    return `${ordinals[Math.min(ordinalNum - 1, 4)]} ${weekdayName}`;
  };

  const repeatOptions = (() => {
    const fechaBase = nuevaSolicitudData?.fecha;
    const diaG = nuevaSolicitudData?.diaSemana;
    const weekdayName = WEEKDAY_NAMES[getWeekdayMondayIndex(fechaBase, diaG)] || 'lunes';

    const ordinalWeekdayText = getOrdinalWeekdayText(fechaBase, diaG);

    const opciones = [
      { value: 'none' as const, label: 'No se repite' },
      { value: 'daily' as const, label: 'Cada día' },
      { value: 'weekly_current' as const, label: `Cada semana el ${weekdayName}` },
      { value: 'monthly_date' as const, label: `Cada mes el ${ordinalWeekdayText}` },
      { value: 'custom' as const, label: 'Personalizar' }
    ];

    return opciones.filter((opt) => opcionRapidaPermitida(opt.value, fechaBase, periodoSeleccionado));
  })();

  const intervaloMaximoPeriodo = maxIntervaloPermitido(customPeriod, nuevaSolicitudData?.fecha, periodoSeleccionado);
  const finRepeticionMaxFecha = fechaFinPeriodo(periodoSeleccionado);
  const ocurrenciasMaximoPeriodo = maxOcurrenciasPorOpcion(
    repeatOption,
    customPeriod,
    formData.intervalo,
    nuevaSolicitudData?.fecha,
    periodoSeleccionado
  );

  useEffect(() => {
    if (!repeatOptions.some((opt) => opt.value === repeatOption)) {
      setRepeatOption('none');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nuevaSolicitudData?.fecha, periodoSeleccionado]);

  useEffect(() => {
    if (intervaloMaximoPeriodo != null && formData.intervalo > intervaloMaximoPeriodo) {
      setFormData((prev) => ({ ...prev, intervalo: intervaloMaximoPeriodo }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervaloMaximoPeriodo]);

  const toggleDiaSemana = (dayValue: number) => {
    setFormData((prev) => {
      const exists = prev.dias_semana.includes(dayValue);
      return {
        ...prev,
        dias_semana: exists
          ? prev.dias_semana.filter((d) => d !== dayValue)
          : [...prev.dias_semana, dayValue].sort((a, b) => a - b)
      };
    });
  };

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

  useEffect(() => {
    if (!dialogSolicitudOpen) {
      setFormError(null);
      setSubmitting(false);
      setRecursosSeleccionados([]);
      setHoraFinEditable(null);
      setFormData({
        sede_id: 0,
        espacio_id: 0,
        tipo_actividad_id: 0,
        asistentes: '',
        motivo: '',
        telefono: '',
        es_recurrente: false,
        frecuencia: 'none',
        intervalo: 1,
        dias_semana: [],
        fin_repeticion_tipo: 'never',
        fin_repeticion_fecha: '',
        fin_repeticion_ocurrencias: ''
      });
      setRepeatOption('none');
      setCustomPeriod('week');
      setRecurrencePreviewDates([]);
    } else if (nuevaSolicitudData?.horaFin) {
      // Inicializar hora fin editable cuando se abre el modal
      const horaFinNum = parseInt(nuevaSolicitudData.horaFin.split(':')[0], 10);
      setHoraFinEditable(horaFinNum);
    }
  }, [dialogSolicitudOpen, nuevaSolicitudData]);

  // Actualizar preview de fechas cuando cambian los parámetros de repetición
  useEffect(() => {
    if (nuevaSolicitudData?.fecha) {
      const dates = generateRecurrenceDates();
      setRecurrencePreviewDates(dates);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repeatOption, customPeriod, formData.intervalo, formData.dias_semana, formData.fin_repeticion_tipo, formData.fin_repeticion_fecha, formData.fin_repeticion_ocurrencias, nuevaSolicitudData?.fecha]);

  // Cargar datos para el formulario
  useEffect(() => {
    const loadFormData = async () => {
      try {
        const [tiposResp, recursosResp, sedesResp] = await Promise.all([
          tipoActividadService.listarTiposActividad(),
          recursoService.listarRecursos(),
          sedeService.listarSedes()
        ]);
        setTiposActividad(tiposResp.tipos_actividad);
        setRecursosDisponibles(recursosResp.recursos);
        setSedesList(sedesResp.sedes);
      } catch (err) {
        console.error('Error cargando datos del formulario:', err);
      }
    };
    loadFormData();
  }, []);

  // Cargar espacios disponibles cuando cambian sede/fecha/hora
  useEffect(() => {
    const loadEspaciosDisponibles = async () => {
      if (!nuevaSolicitudData?.fecha || !nuevaSolicitudData?.horaInicio) {
        return;
      }

      // Usar hora fin editable si está disponible, sino usar la hora fin original
      const horaFinParaBusqueda = horaFinEditable
        ? `${String(horaFinEditable).padStart(2, '0')}:00`
        : nuevaSolicitudData.horaFin;

      try {
        // Buscar el sede_id del espacio seleccionado
        const espacio = filteredEspacios.find(e => e.id === nuevaSolicitudData.espacio_id.toString());
        if (!espacio) return;

        const sede = sedesList.find(s => s.nombre === espacio.sede);
        if (!sede) return;

        const response = await prestamosPublicAPI.listarEspaciosDisponibles(
          nuevaSolicitudData.fecha,
          `${nuevaSolicitudData.horaInicio}:00`,
          `${horaFinParaBusqueda}:00`,
          sede.id
        );
        setEspaciosDisponibles(response.espacios || []);
        setFormData(prev => ({
          ...prev,
          sede_id: sede.id!,
          espacio_id: nuevaSolicitudData?.espacio_id || 0
        }));
      } catch (err) {
        console.error('Error cargando espacios disponibles:', err);
      }
    };

    if (dialogSolicitudOpen) {
      loadEspaciosDisponibles();
    }
  }, [dialogSolicitudOpen, nuevaSolicitudData, filteredEspacios, sedesList, horaFinEditable]);

  // Recalcular conflictos cuando cambia la hora final en el formulario
  useEffect(() => {
    if (!nuevaSolicitudData || !horaFinEditable) {
      setConflictosFormulario([]);
      return;
    }
    
    const horaInicioNum = parseInt(nuevaSolicitudData.horaInicio.split(':')[0], 10);
    const espacioId = nuevaSolicitudData.espacio_id.toString();
    const dia = nuevaSolicitudData.diaSemana;
    
    // Buscar conflictos en el nuevo rango usando horarios disponibles
    const conflictos: ConflictoForm[] = [];
    horarios.forEach((h: typeof horarios[0]) => {
      const matchEspacio = String(h.espacioId) === espacioId;
      const matchDia = h.dia === dia;
      const overlap = horaInicioNum < h.horaFin && horaFinEditable > h.horaInicio;
      if (matchEspacio && matchDia && overlap) {
        conflictos.push({
          tipo: (h.tipo || 'horario') as 'horario' | 'prestamo',
          materia: h.materia || 'Horario ocupado',
          horaInicio: h.horaInicio,
          horaFin: h.horaFin
        });
      }
    });
    
    setConflictosFormulario(conflictos);
  }, [horaFinEditable, nuevaSolicitudData, horarios]);

  // Funciones del formulario
  const agregarRecurso = (recurso_id: number) => {
    const recursoExistente = recursosSeleccionados.find(r => r.recurso_id === recurso_id);
    if (recursoExistente) return;
    
    const recurso = recursosDisponibles.find(r => r.id === recurso_id);
    setRecursosSeleccionados(prev => [...prev, {
      recurso_id,
      recurso_nombre: recurso?.nombre,
      cantidad: 1
    }]);
  };

  const eliminarRecurso = (recurso_id: number) => {
    setRecursosSeleccionados(prev => prev.filter(r => r.recurso_id !== recurso_id));
  };

  const handleSubmitSolicitud = async () => {
    if (!nuevaSolicitudData || !user?.id) return;

    // Validaciones
    if (!formData.espacio_id || !formData.tipo_actividad_id || !formData.motivo) {
      setFormError('Por favor complete todos los campos obligatorios');
      return;
    }

    if (!horaFinEditable) {
      setFormError('Por favor seleccione la hora de finalización');
      return;
    }

    const horaInicioNum = parseInt(nuevaSolicitudData.horaInicio.split(':')[0], 10);
    if (horaFinEditable <= horaInicioNum) {
      setFormError('La hora fin debe ser mayor que la hora inicio');
      return;
    }

    if (horaFinEditable > 22) {
      setFormError('La hora fin no puede exceder las 22:00');
      return;
    }

    const conflictoSolicitud = getConflictoEnRango(
      String(formData.espacio_id),
      nuevaSolicitudData.diaSemana,
      horaInicioNum,
      horaFinEditable
    );

    if (conflictoSolicitud) {
      setFormError(`Conflicto con ${describirConflicto(conflictoSolicitud)}`);
      return;
    }

    const recurrenceData = buildRecurrenceFromSelection();

    if (recurrenceData.es_recurrente) {
      if (recurrenceData.intervalo < 1) {
        setFormError('El intervalo debe ser mayor o igual a 1');
        return;
      }
      if (recurrenceData.frecuencia === 'weekly' && recurrenceData.dias_semana.length < 1) {
        setFormError('Seleccione al menos un día de la semana para la repetición semanal');
        return;
      }
      if (formData.fin_repeticion_tipo === 'until_date' && !formData.fin_repeticion_fecha) {
        setFormError('Debe seleccionar una fecha de finalización de repetición');
        return;
      }
      if (
        formData.fin_repeticion_tipo === 'count' &&
        (!formData.fin_repeticion_ocurrencias || Number(formData.fin_repeticion_ocurrencias) < 1)
      ) {
        setFormError('El número de repeticiones debe ser mayor que 0');
        return;
      }
    }

    const asistentesNum = parseInt(formData.asistentes) || 0;
    if (asistentesNum > 0) {
      const espacioSeleccionado = espaciosDisponibles.find(e => e.id === formData.espacio_id);
      if (espacioSeleccionado && asistentesNum > espacioSeleccionado.capacidad) {
        setFormError(`El número de asistentes (${asistentesNum}) excede la capacidad del espacio (${espacioSeleccionado.capacidad})`);
        return;
      }
    }

    setSubmitting(true);
    setFormError(null);

    try {
      // Verificar si el usuario tiene permiso de EDITAR para auto-aprobar
      const puedeAutoAprobar = puedeEditarDisponibilidad;
      const estadoInicial: 'Aprobado' | 'Pendiente' = puedeAutoAprobar ? 'Aprobado' : 'Pendiente';

      const payloadBase = {
        espacio_id: formData.espacio_id,
        usuario_id: user.id,
        administrador_id: null,
        tipo_actividad_id: formData.tipo_actividad_id,
        fecha: nuevaSolicitudData.fecha,
        hora_inicio: `${nuevaSolicitudData.horaInicio}:00`,
        hora_fin: `${String(horaFinEditable).padStart(2, '0')}:00`,
        motivo: formData.motivo,
        asistentes: asistentesNum,
        telefono: formData.telefono,
        estado: estadoInicial,
        recursos: recursosSeleccionados.map(r => ({
          recurso_id: r.recurso_id,
          cantidad: r.cantidad
        }))
      };

      const payloadRecurrencia = recurrenceData.es_recurrente
        ? {
            es_recurrente: true,
            frecuencia: recurrenceData.frecuencia,
            intervalo: recurrenceData.intervalo,
            dias_semana:
              recurrenceData.frecuencia === 'weekly'
                ? recurrenceData.dias_semana
                : recurrenceData.frecuencia === 'monthly' && recurrenceData.dias_semana.length >= 2
                  ? recurrenceData.dias_semana
                  : undefined,
            fin_repeticion_tipo: recurrenceData.fin_repeticion_tipo,
            fin_repeticion_fecha: recurrenceData.fin_repeticion_tipo === 'until_date' ? recurrenceData.fin_repeticion_fecha : undefined,
            fin_repeticion_ocurrencias:
              recurrenceData.fin_repeticion_tipo === 'count' ? Number(recurrenceData.fin_repeticion_ocurrencias) : undefined
          }
        : {};

      await prestamoService.crearPrestamo({
        ...payloadBase,
        ...payloadRecurrencia
      });

      toast.success(puedeAutoAprobar ? 'Préstamo registrado exitosamente' : 'Solicitud enviada exitosamente');
      
      // Recargar la página para actualizar los datos
      setTimeout(() => {
        window.location.reload();
      }, 1000); // Dar tiempo para que se muestre el toast
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setFormError(err.message || 'Error al crear la solicitud');
      setSubmitting(false);
    }
  };

  return {
    tiposActividad,
    recursosDisponibles,
    espaciosDisponibles,
    recursosSeleccionados,
    formData,
    setFormData,
    repeatOption,
    setRepeatOption,
    customPeriod,
    setCustomPeriod,
    formError,
    submitting,
    recurrencePreviewDates,
    horaFinEditable,
    setHoraFinEditable,
    conflictosFormulario,
    FIN_REPETICION_OPTIONS,
    DIAS_SEMANA_OPTIONS,
    repeatOptions,
    intervaloMaximoPeriodo,
    finRepeticionMaxFecha,
    ocurrenciasMaximoPeriodo,
    toggleDiaSemana,
    recurrenceSummary,
    agregarRecurso,
    eliminarRecurso,
    handleSubmitSolicitud,
  };
}
