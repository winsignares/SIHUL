import { Input } from '../../share/input';
import { Button } from '../../share/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../share/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../share/select';
import { SearchableSelect } from '../../share/searchableSelect';
import { Badge } from '../../share/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../share/dialog';
import { Label } from '../../share/label';
import { Textarea } from '../../share/textarea';
import { Alert, AlertDescription } from '../../share/alert';
import { 
  GripVertical, 
  Search, 
  CalendarDays, 
  MapPin, 
  Users, 
  Grid3x3, 
  ArrowLeft, 
  Home, 
  RefreshCw, 
  FileDown, 
  FileSpreadsheet,
  Pencil,
  AlertCircle,
  ChevronsLeft,
  ChevronsRight,
  X,
  Trash2
} from 'lucide-react';
import { motion } from 'motion/react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../share/tooltip';
import { useConsultaEspacios } from '../../hooks/espacios/useConsultaEspacios';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import { tipoActividadService, type TipoActividad } from '../../services/prestamos/tipoActividadAPI';
import { recursoService, type Recurso } from '../../services/recursos/recursoAPI';
import { sedeService } from '../../services/sedes/sedeAPI';
import { prestamosPublicAPI, type EspacioDisponibleAPI } from '../../services/prestamos/prestamosPublicAPI';
import { prestamoService, type RecursoPrestamo } from '../../services/prestamos/prestamoAPI';
import { horarioService } from '../../services/horarios/horariosAPI';
import { toast } from 'sonner';
import type { Sede } from '../../services/sedes/sedeAPI';

type RepeatQuickOption =
  | 'none'
  | 'daily'
  | 'weekly_current'
  | 'monthly_date'
  | 'yearly_date'
  | 'custom';

type CustomPeriod = 'day' | 'week' | 'month' | 'year';

const WEEKDAY_NAMES = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
const MONTH_NAMES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/** Nombre de columna del cronograma → Date.getDay() (0=dom … 6=sáb). */
const GRID_DIA_A_JS_WEEKDAY: Record<string, number> = {
  Domingo: 0,
  Lunes: 1,
  Martes: 2,
  Miércoles: 3,
  Jueves: 4,
  Viernes: 5,
  Sábado: 6
};

function formatFechaLocalYYYYMMDD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getHoyColombia(): Date {
  const ahora = new Date();
  const utc = ahora.getTime() + ahora.getTimezoneOffset() * 60000;
  const colombia = new Date(utc + 3600000 * -5);
  colombia.setHours(0, 0, 0, 0);
  return colombia;
}

// Helper para formatear hora decimal (e.g., 7.5) a formato de tiempo (e.g., "7:30")
function formatHoraDecimal(hora: number): string {
  const horas = Math.floor(hora);
  const minutos = Math.round((hora % 1) * 60);
  return `${horas}:${String(minutos).padStart(2, '0')}`;
}

// Helper para redondear hora a múltiplo de 15 minutos (0.25 horas)
// Usa ceil para redondear hacia arriba y asegurar que la celda cubra todo el horario
function roundTo15Min(hora: number): number {
  // Agregar pequeña tolerancia para errores de precisión flotante
  const horaConTolerancia = hora + 0.001;
  // Redondear hacia arriba (ceil) al múltiplo de 0.25 (15 minutos)
  // Ej: 12.40 -> 12.666... -> 13 -> 12.75 (12:45)
  return Math.ceil(horaConTolerancia * 4) / 4;
}

export default function ConsultaEspacios() {
  const isMobile = useIsMobile();
  const { user, hasEditPermission } = useAuth();
  
  const {
    searchTerm,
    setSearchTerm,
    filterTipo,
    setFilterTipo,
    filterApertura,
    setFilterApertura,
    filterSede,
    setFilterSede,
    filterPeriodo,
    setFilterPeriodo,
    filterFechaInicio,
    filterFechaFin,
    filterOcupacion,
    setFilterOcupacion,
    mensajeFiltroFecha,
    handleFechaInicioChange,
    handleFechaFinChange,
    vistaActual,
    setVistaActual,
    tiposEspacio,
    sedes,
    diasSemana,
    encabezadosDiasCronograma,
    horas,
    isDiaBloqueado,
    isCeldaBloqueada,
    horaToSlotIndex,
    isHoraExacta,
    filteredEspacios,
    paginatedEspacios,
    totalFilteredEspacios,
    currentPage,
    totalPages,
    pageNumbers,
    pageSize,
    goToPage,
    goToNextPage,
    goToPrevPage,
    hasPrevPageWindow,
    hasNextPageWindow,
    goToPrevPageWindow,
    goToNextPageWindow,
    estadisticas,
    horarios,
    prestamos,
    exportarCronogramaPDF,
    exportarCronogramaExcel,
    getOcupacionPorHora,
    // Drag-to-select
    isDragging,
    seleccionRango,
    iniciarSeleccion,
    actualizarSeleccion,
    finalizarSeleccion,
    puedeCrearSolicitudes,
    // Modal solicitud
    dialogSolicitudOpen,
    setDialogSolicitudOpen,
    nuevaSolicitudData,
    // Período académico
    periodos,
    periodosLoading,
    horariosLoading,
    errorBusquedaPeriodo,
    buscarPeriodoPorRangoFechas,
    // Vista individual
    espacioSeleccionado,
    verCronogramaIndividual,
    volverALista,
    // Filtros
    limpiarFiltros,
    // Recarga
    recargarDatos,
    loading
  } = useConsultaEspacios();

  // Calcular índices de paginación
  const firstItemIndex = totalFilteredEspacios === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastItemIndex = Math.min(currentPage * pageSize, totalFilteredEspacios);

  // Estado para el período seleccionado
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<typeof periodos[0] | null>(null);
  const [mensajeAutoPeriodo, setMensajeAutoPeriodo] = useState<string | null>(null);
  const [inicializacionAplicada, setInicializacionAplicada] = useState(false);
  const puedeEditarDisponibilidad = hasEditPermission('Disponibilidad de Espacios');

  const encontrarInicioValidoPeriodo = (periodo: typeof periodos[0]) => {
    const hoy = getHoyColombia();
    const finPeriodo = new Date(`${periodo.fecha_fin}T00:00:00`);
    finPeriodo.setHours(0, 0, 0, 0);

    if (hoy <= finPeriodo) {
      return {
        inicio: formatFechaLocalYYYYMMDD(hoy),
        ajustadoPorDomingo: false
      };
    }

    return null;
  };

  const aplicarPeriodoConIntervaloValido = (periodo: typeof periodos[0], mostrarMensajeDomingo = false) => {
    const intervalo = encontrarInicioValidoPeriodo(periodo);
    if (!intervalo) {
      setMensajeAutoPeriodo('No se encontró una fecha de inicio válida dentro del período seleccionado.');
      return;
    }

    setPeriodoSeleccionado(periodo);
    setFilterPeriodo(periodo.id ?? null);
    handleFechaInicioChange(intervalo.inicio);

    if (mostrarMensajeDomingo && intervalo.ajustadoPorDomingo) {
      setMensajeAutoPeriodo('La fecha de hoy cae en domingo. El filtro fue ajustado automáticamente al lunes siguiente.');
    } else {
      setMensajeAutoPeriodo(null);
    }
  };

  const resolverPeriodoVigente = () => {
    const hoy = getHoyColombia();
    const hoyISO = formatFechaLocalYYYYMMDD(hoy);

    const activo = periodos.find((p) => p.activo);
    if (activo) return activo;

    const contieneHoy = periodos.find((p) => p.fecha_inicio <= hoyISO && p.fecha_fin >= hoyISO);
    if (contieneHoy) return contieneHoy;

    const futuros = [...periodos].sort((a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio));
    return futuros[0] ?? null;
  };

  useEffect(() => {
    if (inicializacionAplicada || periodosLoading || periodos.length === 0) return;

    const vigente = resolverPeriodoVigente();
    if (!vigente) return;

    aplicarPeriodoConIntervaloValido(vigente, true);
    setInicializacionAplicada(true);
  }, [inicializacionAplicada, periodosLoading, periodos]);

  // Integrar búsqueda de período cuando se cambian las fechas
  useEffect(() => {
    if (filterFechaInicio && filterFechaFin) {
      buscarPeriodoPorRangoFechas(filterFechaInicio, filterFechaFin).then((periodo) => {
        if (periodo) {
          setPeriodoSeleccionado(periodo);
          setFilterPeriodo(periodo.id ?? null);
        }
      });
    }
  }, [buscarPeriodoPorRangoFechas, filterFechaInicio, filterFechaFin, setFilterPeriodo]);

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
    frecuencia: 'none' as 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'weekdays',
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

  // Estados para edición de horarios (drag and drop)
  const [editModeEnabled, setEditModeEnabled] = useState(false);
  const [draggedHorario, setDraggedHorario] = useState<typeof horarios[0] | null>(null);
  const [dragOverCell, setDragOverCell] = useState<{ dia: string; hora: number } | null>(null);
  const [confirmMoveDialogOpen, setConfirmMoveDialogOpen] = useState(false);
  const [pendingMove, setPendingMove] = useState<{
    horario: typeof horarios[0] | null;
    targetDia: string;
    targetHoraInicio: number;
  } | null>(null);

  // Estados para diálogo de mover clase
  const [moveClassDialogOpen, setMoveClassDialogOpen] = useState(false);
  const [selectedClassToMove, setSelectedClassToMove] = useState<typeof horarios[0] | null>(null);
  const [targetEspacioId, setTargetEspacioId] = useState<string>('');
  const [targetMoveDia, setTargetMoveDia] = useState<string>('');
  const [targetMoveHoraInicio, setTargetMoveHoraInicio] = useState<number | null>(null);
  const [moveClassError, setMoveClassError] = useState<string | null>(null);
  const [movingClass, setMovingClass] = useState(false);

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
    const date = fechaBase ? new Date(`${fechaBase}T12:00:00`) : null;
    const dayOfMonth = date ? date.getDate() : null;
    const yearlyText = date
      ? `${dayOfMonth} de ${MONTH_NAMES[date.getMonth()]}`
      : 'la fecha seleccionada';

    const ordinalWeekdayText = getOrdinalWeekdayText(fechaBase, diaG);

    return [
      { value: 'none' as const, label: 'No se repite' },
      { value: 'daily' as const, label: 'Cada día' },
      { value: 'weekly_current' as const, label: `Cada semana el ${weekdayName}` },
      { value: 'monthly_date' as const, label: `Cada mes el ${ordinalWeekdayText}` },
      { value: 'yearly_date' as const, label: `Anualmente el ${yearlyText}` },
      { value: 'custom' as const, label: 'Personalizar' }
    ];
  })();

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

    if (repeatOption === 'yearly_date') {
      return {
        es_recurrente: true,
        frecuencia: 'yearly' as const,
        intervalo: 1,
        dias_semana: [] as number[],
        ...baseEnd
      };
    }

    const customFrequency =
      customPeriod === 'day'
        ? 'daily' as const
        : customPeriod === 'week'
          ? 'weekly' as const
          : customPeriod === 'month'
            ? 'monthly' as const
            : 'yearly' as const;

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
    if (repeatOption === 'yearly_date' && nuevaSolicitudData?.fecha) {
      const d = new Date(`${nuevaSolicitudData.fecha}T00:00:00`);
      return `Se repetirá anualmente el ${d.getDate()} de ${MONTH_NAMES[d.getMonth()]}${finishText}.`;
    }

    const periodText = customPeriod === 'day' ? 'día' : customPeriod === 'week' ? 'semana' : customPeriod === 'month' ? 'mes' : 'año';
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
    let frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'daily';
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
      case 'yearly_date':
        frequency = 'yearly';
        interval = 1;
        break;
      case 'custom':
        frequency = customPeriod === 'day' ? 'daily' : 
                   customPeriod === 'week' ? 'weekly' : 
                   customPeriod === 'month' ? 'monthly' : 'yearly';
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

        case 'yearly':
          nextDate = new Date(currentDate);
          nextDate.setFullYear(nextDate.getFullYear() + interval);
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
    }
  }, [dialogSolicitudOpen]);

  // Actualizar preview de fechas cuando cambian los parámetros de repetición
  useEffect(() => {
    if (nuevaSolicitudData?.fecha) {
      const dates = generateRecurrenceDates();
      setRecurrencePreviewDates(dates);
    }
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
      if (!nuevaSolicitudData?.fecha || !nuevaSolicitudData?.horaInicio || !nuevaSolicitudData?.horaFin) {
        return;
      }
      
      try {
        // Buscar el sede_id del espacio seleccionado
        const espacio = filteredEspacios.find(e => e.id === nuevaSolicitudData.espacio_id.toString());
        if (!espacio) return;
        
        const sede = sedesList.find(s => s.nombre === espacio.sede);
        if (!sede) return;

        const response = await prestamosPublicAPI.listarEspaciosDisponibles(
          nuevaSolicitudData.fecha,
          `${nuevaSolicitudData.horaInicio}:00`,
          `${nuevaSolicitudData.horaFin}:00`,
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
  }, [dialogSolicitudOpen, nuevaSolicitudData, filteredEspacios, sedesList]);

  // Determinar qué espacios mostrar
  const espaciosToShow = espacioSeleccionado 
    ? filteredEspacios.filter(e => e.id === espacioSeleccionado.id)
    : filteredEspacios;

  const getAperturaBadge = (estaAbierto: boolean) => {
    return estaAbierto ? (
      <Badge className="bg-green-100 text-green-800 border-green-300 text-xs">Abierto</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800 border-red-300 text-xs">Cerrado</Badge>
    );
  };

  const getDayColumnIndex = (dia: string) => {
    const index = diasSemana.indexOf(dia);
    return index !== -1 ? index + 2 : 1;
  };

  const getHourRowIndex = (hora: number) => {
    // Redondear hora a múltiplo de 15 minutos para evitar desplazamientos por decimales imprecisos
    const horaRedondeada = roundTo15Min(hora);
    // Usar la función de slot para calcular la fila correcta
    // horaToSlotIndex devuelve el índice del slot (0-63), sumamos 2 para el header
    const slotIndex = horaToSlotIndex(horaRedondeada);
    return slotIndex + 2;
  };

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

    if (nuevaSolicitudData.horaFin <= nuevaSolicitudData.horaInicio) {
      setFormError('La hora fin debe ser mayor que la hora inicio');
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
        hora_fin: `${nuevaSolicitudData.horaFin}:00`,
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
    } catch (err: any) {
      setFormError(err.message || 'Error al crear la solicitud');
      setSubmitting(false);
    }
  };

  const estaEnRangoSeleccion = (espacioId: string, dia: string, hora: number) => {
    if (!seleccionRango) return false;
    return seleccionRango.espacioId === espacioId &&
           seleccionRango.dia === dia &&
           hora >= seleccionRango.horaInicio &&
           hora < seleccionRango.horaFin;
  };

  // Función para validar si un movimiento es posible (sin conflictos)
  const validarMovimiento = (
    horario: typeof horarios[0],
    targetEspacioId: string,
    targetDia: string,
    targetHoraInicio: number,
    targetHoraFin: number
  ): { valido: boolean; error?: string } => {
    // Verificar que no exceda el horario permitido (hasta las 22:00)
    if (targetHoraFin > 22) {
      return { valido: false, error: 'El horario excede el límite permitido (22:00)' };
    }

    // Verificar que la hora de inicio sea menor que la de fin
    if (targetHoraInicio >= targetHoraFin) {
      return { valido: false, error: 'La hora de inicio debe ser menor que la hora de fin' };
    }

    // Verificar conflictos con otros horarios en el espacio destino (excluyendo el horario que se está moviendo)
    const conflictos = horarios.filter(h => {
      if (h.espacioId !== targetEspacioId) return false;
      // Ignorar el mismo horario comparando por ID
      if (horario.id && h.id === horario.id) {
        console.log('Ignorando horario por ID:', horario.id);
        return false;
      }
      // Como respaldo, también verificar por referencia y valores
      if (h === horario) return false;
      // Ignorar si tiene las mismas propiedades clave (mismo día, hora inicio y fin)
      if (h.dia === horario.dia && h.horaInicio === horario.horaInicio && h.horaFin === horario.horaFin && h.materia === horario.materia) {
        console.log('Ignorando horario por coincidencia de propiedades:', horario.materia);
        return false;
      }
      if (h.dia !== targetDia) return false; // Solo verificar el mismo día

      // Verificar solapamiento de horarios
      const solapamiento = (
        (targetHoraInicio >= h.horaInicio && targetHoraInicio < h.horaFin) ||
        (targetHoraFin > h.horaInicio && targetHoraFin <= h.horaFin) ||
        (targetHoraInicio <= h.horaInicio && targetHoraFin >= h.horaFin)
      );

      if (solapamiento) {
        console.log('Conflicto detectado con:', h.materia, h.horaInicio, '-', h.horaFin);
      }

      return solapamiento;
    });

    if (conflictos.length > 0) {
      const conflicto = conflictos[0];
      return {
        valido: false,
        error: `Conflicto con: ${conflicto.materia} (${formatHoraDecimal(conflicto.horaInicio)}-${formatHoraDecimal(conflicto.horaFin)})`
      };
    }

    // Verificar conflictos con préstamos en el espacio destino
    const conflictosPrestamos = prestamos.filter(p => {
      if (String(p.espacio_id) !== targetEspacioId) return false;
      // Convertir fecha del préstamo a día de la semana
      const prestamoDate = new Date(p.fecha);
      const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const prestamoDia = diasSemana[prestamoDate.getDay()];
      if (prestamoDia !== targetDia) return false;
      if (p.estado !== 'Aprobado') return false; // Solo préstamos aprobados

      // Convertir horas de string a number
      const pHoraInicio = parseInt(p.hora_inicio.split(':')[0]);
      const pHoraFin = parseInt(p.hora_fin.split(':')[0]);

      // Verificar solapamiento
      const solapamiento = (
        (targetHoraInicio >= pHoraInicio && targetHoraInicio < pHoraFin) ||
        (targetHoraFin > pHoraInicio && targetHoraFin <= pHoraFin) ||
        (targetHoraInicio <= pHoraInicio && targetHoraFin >= pHoraFin)
      );

      return solapamiento;
    });

    if (conflictosPrestamos.length > 0) {
      const conflicto = conflictosPrestamos[0];
      const pHoraInicio = parseInt(conflicto.hora_inicio.split(':')[0]);
      const pHoraFin = parseInt(conflicto.hora_fin.split(':')[0]);
      return {
        valido: false,
        error: `Conflicto con préstamo aprobado: ${conflicto.motivo} (${formatHoraDecimal(pHoraInicio)}-${formatHoraDecimal(pHoraFin)})`
      };
    }

    return { valido: true };
  };

  const [isProcessingMove, setIsProcessingMove] = useState(false);
  const [horarioToDelete, setHorarioToDelete] = useState<typeof horarios[0] | null>(null);
  const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Función para eliminar horario
  const eliminarHorario = async () => {
    if (!horarioToDelete || !horarioToDelete.id) return;

    setIsDeleting(true);
    try {
      await horarioService.delete({ id: horarioToDelete.id });
      toast.success(`Horario de ${horarioToDelete.materia} eliminado exitosamente`);
      setConfirmDeleteDialogOpen(false);
      setHorarioToDelete(null);
      recargarDatos();
    } catch (error: any) {
      console.error('Error al eliminar horario:', error);
      const errorMessage = error?.message || error?.response?.data?.message || 'Error desconocido';
      toast.error(`Error al eliminar: ${errorMessage}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Función para ejecutar el movimiento de horario
  const ejecutarMovimiento = async () => {
    if (!pendingMove?.horario || isProcessingMove) return;

    setIsProcessingMove(true);

    const { horario, targetDia, targetHoraInicio } = pendingMove;
    const duracion = horario.horaFin - horario.horaInicio;
    const targetHoraFin = targetHoraInicio + duracion;

    // Validar que el horario tenga ID
    if (!horario.id) {
      console.error('Error: El horario no tiene ID', horario);
      toast.error('Error: No se puede identificar el horario a mover');
      setConfirmMoveDialogOpen(false);
      setPendingMove(null);
      return;
    }

    // Validar el movimiento
    const validacion = validarMovimiento(horario, horario.espacioId, targetDia, targetHoraInicio, targetHoraFin);
    if (!validacion.valido) {
      toast.error(validacion.error || 'No se puede realizar el movimiento');
      setConfirmMoveDialogOpen(false);
      setPendingMove(null);
      return;
    }

    try {
      // Convertir horas a formato string (HH:00:00)
      const formatHora = (h: number) => `${String(h).padStart(2, '0')}:00:00`;

      console.log('Moviendo horario:', {
        id: horario.id,
        dia_semana: targetDia,
        hora_inicio: formatHora(targetHoraInicio),
        hora_fin: formatHora(targetHoraFin)
      });

      // Validar que haya un ID válido
      if (!horario.id) {
        throw new Error('No se puede mover este elemento - ID no válido');
      }

      // Usar el servicio correcto según el tipo
      if (horario.tipo === 'prestamo') {
        // Para préstamos, usar prestamoService
        await prestamoService.actualizarPrestamo({
          id: horario.id,
          estado: horario.estado || 'Pendiente',
          fecha: (horario as any).fecha || (horario.prestamo?.fecha),
          hora_inicio: horario.horaInicio ? `${String(horario.horaInicio).padStart(2, '0')}:00:00` : undefined,
          hora_fin: horario.horaFin ? `${String(horario.horaFin).padStart(2, '0')}:00:00` : undefined
        } as any);
      } else {
        // Para horarios académicos, usar horarioService
        await horarioService.update({
          id: horario.id,
          dia_semana: targetDia,
          hora_inicio: formatHora(targetHoraInicio),
          hora_fin: formatHora(targetHoraFin)
        });
      }

      toast.success(`Horario movido exitosamente a ${targetDia} ${formatHoraDecimal(targetHoraInicio)}-${formatHoraDecimal(targetHoraFin)}`);

      // Recargar los datos
      recargarDatos();
    } catch (error: any) {
      console.error('Error completo al mover horario:', error);
      const errorMessage = error?.message || error?.response?.data?.message || 'Error desconocido';
      toast.error(`Error al mover el horario: ${errorMessage}`);
    } finally {
      setIsProcessingMove(false);
      setConfirmMoveDialogOpen(false);
      setPendingMove(null);
      setDraggedHorario(null);
    }
  };

  // Función para mover clase a otro espacio
  const ejecutarMovimientoOtroEspacio = async () => {
    if (!selectedClassToMove || !targetEspacioId || !targetMoveDia || targetMoveHoraInicio === null) return;

    setMovingClass(true);
    setMoveClassError(null);

    const targetEspacio = filteredEspacios.find(e => e.id === targetEspacioId);
    if (!targetEspacio) {
      setMoveClassError('Espacio no encontrado');
      setMovingClass(false);
      return;
    }

    const duracion = selectedClassToMove.horaFin - selectedClassToMove.horaInicio;
    const targetHoraFin = targetMoveHoraInicio + duracion;

    // Validar el movimiento
    const validacion = validarMovimiento(
      selectedClassToMove,
      targetEspacioId,
      targetMoveDia,
      targetMoveHoraInicio,
      targetHoraFin
    );

    if (!validacion.valido) {
      setMoveClassError(validacion.error || 'No se puede realizar el movimiento');
      setMovingClass(false);
      return;
    }

    try {
      // Convertir horas a formato string (HH:00:00)
      const formatHora = (h: number) => `${String(h).padStart(2, '0')}:00:00`;

      // Validar que haya un ID válido
      if (!selectedClassToMove.id) {
        setMoveClassError('Error: No se puede mover este elemento - ID no válido');
        return;
      }

      // Usar el servicio correcto según el tipo
      if (selectedClassToMove.tipo === 'prestamo') {
        // Para préstamos, usar prestamoService
        await prestamoService.actualizarPrestamo({
          id: selectedClassToMove.id,
          espacio_id: parseInt(targetEspacioId),
          estado: selectedClassToMove.estado || 'Pendiente',
          fecha: (selectedClassToMove as any).fecha || (selectedClassToMove.prestamo?.fecha),
          hora_inicio: formatHora(targetMoveHoraInicio),
          hora_fin: formatHora(targetHoraFin)
        } as any);
      } else {
        // Para horarios académicos, usar horarioService
        await horarioService.update({
          id: selectedClassToMove.id,
          espacio_id: parseInt(targetEspacioId),
          dia_semana: targetMoveDia,
          hora_inicio: formatHora(targetMoveHoraInicio),
          hora_fin: formatHora(targetHoraFin)
        });
      }

      toast.success(`Clase movida exitosamente a ${targetEspacio.nombre} - ${targetMoveDia} ${formatHoraDecimal(targetMoveHoraInicio)}-${formatHoraDecimal(targetHoraFin)}`);

      // Cerrar diálogo y recargar
      setMoveClassDialogOpen(false);
      setSelectedClassToMove(null);
      setTargetEspacioId('');
      setTargetMoveDia('');
      setTargetMoveHoraInicio(null);
      recargarDatos();
    } catch (error) {
      setMoveClassError('Error al mover la clase');
    } finally {
      setMovingClass(false);
    }
  };

  return (
    <div className={`${isMobile ? 'p-4' : 'p-8'} space-y-6`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-slate-900 dark:text-slate-100 mb-2 ${isMobile ? 'text-xl' : ''}`}>
            {espacioSeleccionado ? `Cronograma: ${espacioSeleccionado.nombre}` : 'Disponibilidad de Espacios'}
          </h1>
          <p className={`text-slate-600 dark:text-slate-400 ${isMobile ? 'text-sm' : ''}`}>
            {espacioSeleccionado 
              ? 'Vista individual del espacio seleccionado'
              : 'Consulta la disponibilidad de aulas, laboratorios y espacios'}
          </p>
        </div>
      </div>

      {/* Estadísticas */}
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-2 sm:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className={`text-slate-600 dark:text-slate-400 mb-1 ${isMobile ? 'text-xs' : ''}`}>Total Espacios</p>
                <p className={`text-slate-900 dark:text-slate-100 ${isMobile ? 'text-lg' : ''}`}>{estadisticas.total}</p>
              </div>
              <Home className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} text-blue-600 flex-shrink-0`} />
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className={`text-slate-600 dark:text-slate-400 mb-1 ${isMobile ? 'text-xs' : ''}`}>Abiertos</p>
                <p className={`text-slate-900 dark:text-slate-100 ${isMobile ? 'text-lg' : ''}`}>{estadisticas.abiertos}</p>
              </div>
              <div className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} bg-green-100 dark:bg-green-950 rounded-lg flex items-center justify-center flex-shrink-0`}>
                <MapPin className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} text-green-600`} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className={`text-slate-600 dark:text-slate-400 mb-1 ${isMobile ? 'text-xs' : ''}`}>Cerrados</p>
                <p className={`text-slate-900 dark:text-slate-100 ${isMobile ? 'text-lg' : ''}`}>{estadisticas.cerrados}</p>
              </div>
              <div className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} bg-red-100 dark:bg-red-950 rounded-lg flex items-center justify-center flex-shrink-0`}>
                <MapPin className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} text-red-600`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botones de vista */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex gap-2 w-full sm:w-auto">
          {!espacioSeleccionado && (
            <>
              <Button
                variant={vistaActual === 'tarjetas' ? 'default' : 'outline'}
                onClick={() => setVistaActual('tarjetas')}
                className={`flex-1 sm:flex-none ${vistaActual === 'tarjetas'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                  : 'border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950'
                } ${isMobile ? 'text-sm py-2 h-auto' : ''}`}
              >
                <Grid3x3 className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} mr-2`} />
                {isMobile ? 'Tarjetas' : 'Vista Tarjetas'}
              </Button>
              <Button
                variant={vistaActual === 'cronograma' ? 'default' : 'outline'}
                onClick={() => setVistaActual('cronograma')}
                className={`flex-1 sm:flex-none ${vistaActual === 'cronograma'
                  ? 'bg-gradient-to-r from-yellow-600 to-yellow-700 text-white'
                  : 'border-yellow-600 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950'
                } ${isMobile ? 'text-sm py-2 h-auto' : ''}`}
              >
                <CalendarDays className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} mr-2`} />
                {isMobile ? 'Cronograma' : 'Vista Cronograma'}
              </Button>
            </>
          )}
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {vistaActual === 'cronograma' && (
            <>
              <Button
                onClick={() => exportarCronogramaPDF(espacioSeleccionado ? [espacioSeleccionado] : undefined)}
                className="flex-1 sm:flex-none bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
              >
                <FileDown className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} mr-2`} />
                {isMobile ? 'PDF' : 'Exportar PDF'}
              </Button>
              <Button
                onClick={() => exportarCronogramaExcel(espacioSeleccionado ? [espacioSeleccionado] : undefined)}
                className="flex-1 sm:flex-none bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
              >
                <FileSpreadsheet className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} mr-2`} />
                {isMobile ? 'Excel' : 'Exportar Excel'}
              </Button>
            </>
          )}
          <Button
            onClick={recargarDatos}
            variant="outline"
            className="flex-1 sm:flex-none border-purple-600 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950"
            title="Limpiar caché y recargar datos"
            disabled={loading}
          >
            <RefreshCw className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Recargando...' : isMobile ? 'Recargar' : 'Recargar Datos'}
          </Button>
          {espacioSeleccionado && (
            <Button
              variant="outline"
              onClick={volverALista}
              className="flex-1 sm:flex-none border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
            >
              <ArrowLeft className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} mr-2`} />
              {isMobile ? 'Volver' : 'Volver a la lista'}
            </Button>
          )}
        </div>
      </div>

      {/* Filtros - ocultos cuando se selecciona un espacio */}
      {!espacioSeleccionado && (
        <div className="space-y-4">
          <div className={`flex ${isMobile ? 'flex-col' : 'flex-wrap items-end'} gap-4`}>
            <div className={`${isMobile ? 'w-full' : 'flex-1 min-w-[200px]'} relative`}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              <Input
                placeholder="Buscar espacio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-10 h-9 ${isMobile ? 'text-sm' : ''}`}
              />
            </div>
            {/* Filtro de ocupación - al lado del buscador */}
            <Select value={filterOcupacion} onValueChange={setFilterOcupacion}>
              <SelectTrigger className={`${isMobile ? 'w-full' : 'w-[220px]'} h-9 ${isMobile ? 'text-sm' : ''}`}>
                <SelectValue placeholder="Ocupación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="solo_horario">Solo con horario</SelectItem>
                <SelectItem value="solo_prestamo">Solo con préstamos</SelectItem>
                <SelectItem value="sin_horario_ni_prestamo">Sin horario ni préstamos</SelectItem>
                <SelectItem value="sin_horario">Sin horario</SelectItem>
                <SelectItem value="sin_prestamo">Sin préstamo</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className={`${isMobile ? 'w-full' : 'w-[180px]'} h-9 ${isMobile ? 'text-sm' : ''}`}>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los tipos</SelectItem>
                {tiposEspacio.map(tipo => (
                  <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
      {/* Filtro de Apertura */}
            <Select value={filterApertura} onValueChange={setFilterApertura}>
              <SelectTrigger className={`${isMobile ? 'w-full' : 'w-[180px]'} h-9 ${isMobile ? 'text-sm' : ''}`}>
                <SelectValue placeholder="Apertura" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todos</SelectItem>
                <SelectItem value="abierto">Abierto</SelectItem>
                <SelectItem value="cerrado">Cerrado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterSede} onValueChange={setFilterSede}>
              <SelectTrigger className={`${isMobile ? 'w-full' : 'w-[180px]'} h-9 ${isMobile ? 'text-sm' : ''}`}>
                <SelectValue placeholder="Sede" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las sedes</SelectItem>
                {sedes.map(sede => (
                  <SelectItem key={sede} value={sede}>{sede}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className={`flex gap-2 ${isMobile ? 'w-full' : ''}`}>
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-slate-500">Desde</Label>
                <Input
                  type="date"
                  value={filterFechaInicio}
                  onChange={(e) => handleFechaInicioChange(e.target.value)}
                  className={`${isMobile ? 'flex-1' : 'w-[150px]'} h-9 ${isMobile ? 'text-sm' : ''}`}
                  placeholder="Fecha inicio"
                  title="Fecha inicio del rango"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-slate-500">Hasta</Label>
                <Input
                  type="date"
                  value={filterFechaFin}
                  onChange={(e) => handleFechaFinChange(e.target.value)}
                  className={`${isMobile ? 'flex-1' : 'w-[150px]'} h-9 ${isMobile ? 'text-sm' : ''}`}
                  placeholder="Fecha fin"
                  title="Fecha fin del rango"
                />
              </div>
              <Button
                variant="outline"
                onClick={limpiarFiltros}
                className="border-slate-300 text-slate-600 hover:bg-slate-100 self-end h-9"
                title="Limpiar filtros"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {mensajeFiltroFecha && (
            <Alert variant={mensajeFiltroFecha.tipo === 'error' ? 'destructive' : 'default'}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{mensajeFiltroFecha.texto}</AlertDescription>
            </Alert>
          )}

          {mensajeAutoPeriodo && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{mensajeAutoPeriodo}</AlertDescription>
            </Alert>
          )}

          {/* Mensaje de error de búsqueda de período */}
          {errorBusquedaPeriodo && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorBusquedaPeriodo}</AlertDescription>
            </Alert>
          )}

          {/* Información del período seleccionado */}
          {periodoSeleccionado && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg p-3">
              <p className="text-green-700 dark:text-green-300 text-sm">
                <strong>Período académico encontrado:</strong> {periodoSeleccionado.nombre || 'Período'} ({new Date(periodoSeleccionado.fecha_inicio + 'T00:00:00').toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })} - {new Date(periodoSeleccionado.fecha_fin + 'T00:00:00').toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })})
              </p>
            </div>
          )}

          {/* Selector de períodos disponibles */}
          {periodos.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-slate-600">Seleccionar período académico</Label>
              <Select
                value={filterPeriodo?.toString() || periodoSeleccionado?.id?.toString() || ''}
                onValueChange={(value) => {
                  const periodo = periodos.find(p => p.id?.toString() === value);
                  if (periodo) {
                    aplicarPeriodoConIntervaloValido(periodo);
                  }
                }}
              >
                <SelectTrigger className={`${isMobile ? 'w-full' : 'w-[250px]'} h-9 ${isMobile ? 'text-sm' : ''}`}>
                  <SelectValue placeholder="Seleccionar período..." />
                </SelectTrigger>
                <SelectContent>
                  {periodos.map(periodo => (
                    <SelectItem key={periodo.id} value={periodo.id?.toString() || ''}>
                      {periodo.nombre || 'Período'} - {new Date(periodo.fecha_inicio + 'T00:00:00').toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {filterFechaInicio && (
            <div className="bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-lg p-3">
              <p className="text-blue-700 dark:text-blue-300 text-sm">
                <strong>Rango de fechas:</strong> Mostrando horarios académicos y préstamos aprobados del {new Date(filterFechaInicio + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} al {filterFechaFin ? new Date(filterFechaFin + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'sábado de esa semana'}
                {prestamos.length > 0 && <span className="ml-2">({prestamos.length} préstamo{prestamos.length !== 1 ? 's' : ''} aprobado{prestamos.length !== 1 ? 's' : ''})</span>}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Vista Tarjetas */}
      {vistaActual === 'tarjetas' && !espacioSeleccionado && (
        <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
          {loading && (
            <div className="col-span-full flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 py-10">
              <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span className="text-sm font-medium">Cargando espacios...</span>
              </div>
            </div>
          )}

          {!loading && paginatedEspacios.map(espacio => {
            return (
              <motion.div
                key={espacio.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Card 
                  className="border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow bg-white dark:bg-slate-800 cursor-pointer"
                  onClick={() => verCronogramaIndividual(espacio)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-slate-900 dark:text-slate-100 mb-2">{espacio.nombre}</CardTitle>
                        <Badge variant="outline" className="border-blue-600 text-blue-600">
                          {espacio.tipo}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {getAperturaBadge(espacio.estaAbierto)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Users className="w-4 h-4" />
                      <span>Capacidad: {espacio.capacidad} personas</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <MapPin className="w-4 h-4" />
                      <span>{espacio.sede} - Edificio {espacio.edificio}</span>
                    </div>
                    {espacio.proximaClase && (
                      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mt-3">
                        <p className="text-slate-600 dark:text-slate-400">Próxima clase:</p>
                        <p className="text-blue-700 dark:text-blue-300">{espacio.proximaClase}</p>
                      </div>
                    )}
                    <div className="pt-2">
                      <Button variant="outline" className="w-full text-sm border-blue-600 text-blue-600 hover:bg-blue-50">
                        <CalendarDays className="w-4 h-4 mr-2" />
                        Ver Cronograma
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Paginación - Solo en vista tarjetas */}
      {vistaActual === 'tarjetas' && !espacioSeleccionado && totalFilteredEspacios > 0 && (
        <Card className="border-slate-200 dark:border-slate-700 shadow-lg bg-white dark:bg-slate-800">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Mostrando {firstItemIndex}-{lastItemIndex} de {totalFilteredEspacios} espacios
              </p>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPrevPage}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>

                <div className="flex items-center gap-1 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={goToPrevPageWindow}
                    disabled={!hasPrevPageWindow}
                    className="px-2"
                    title="Ver números de página anteriores"
                    aria-label="Grupo anterior de páginas"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </Button>
                  <div className="flex gap-1 flex-wrap">
                    {pageNumbers.map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => goToPage(page)}
                        className={currentPage === page ? 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800' : ''}
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={goToNextPageWindow}
                    disabled={!hasNextPageWindow}
                    className="px-2"
                    title="Ver números de página siguientes"
                    aria-label="Grupo siguiente de páginas"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </Button>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vista Cronograma */}
      {vistaActual === 'cronograma' && (
        <div className="space-y-6">
          {/* Leyenda */}
          <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-green-500 rounded"></div>
                  <span className="text-sm text-slate-700 dark:text-slate-300">Préstamo Aprobado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-yellow-300 rounded"></div>
                  <span className="text-sm text-slate-700 dark:text-slate-300">Préstamo Pendiente</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-yellow-600 rounded"></div>
                  <span className="text-sm text-slate-700 dark:text-slate-300">Mantenimiento</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-[#f97316] rounded"></div>
                  <span className="text-sm text-slate-700 dark:text-slate-300">Horario Pendiente</span>
                </div>
                {puedeCrearSolicitudes && (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-purple-500 rounded border-2 border-purple-700"></div>
                    <span className="text-sm text-slate-700 dark:text-slate-300">Seleccionar (drag para solicitud)</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Indicador de selección activa */}
          {isDragging && puedeCrearSolicitudes && (
            <div className="bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700 rounded-lg p-3 text-center">
              <p className="text-purple-700 dark:text-purple-300 text-sm font-medium">
                Suelta el mouse para crear una nueva solicitud de préstamo
              </p>
            </div>
          )}

          {espaciosToShow.map((espacio) => (
            <motion.div
              key={espacio.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-slate-900 dark:text-slate-100">{espacio.nombre}</CardTitle>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="border-blue-600 text-blue-600">
                          {espacio.tipo}
                        </Badge>
                        <Badge variant="outline" className="border-slate-600 text-slate-600">
                          Capacidad: {espacio.capacidad}
                        </Badge>
                        <Badge variant="outline" className="border-slate-600 text-slate-600">
                          Edificio {espacio.edificio}
                        </Badge>
                      </div>
                    </div>
                    {puedeEditarDisponibilidad && (
                      <Button
                        variant={editModeEnabled ? "default" : "outline"}
                        size="sm"
                        onClick={() => setEditModeEnabled(!editModeEnabled)}
                        className={`${editModeEnabled
                          ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white'
                          : 'border-purple-600 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950'
                        }`}
                        title={editModeEnabled ? 'Deshabilitar edición de horarios' : 'Habilitar edición de horarios'}
                      >
                        <Pencil className="w-4 h-4 mr-2" />
                        {editModeEnabled ? 'Edición ON' : 'Editar'}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div 
                    className="overflow-x-auto relative"
                    onMouseLeave={() => {
                      if (isDragging) finalizarSeleccion();
                    }}
                  >
                    {(horariosLoading || loading) && (
                      <div className="absolute inset-0 z-30 bg-white/70 dark:bg-slate-900/70 backdrop-blur-[1px] flex items-center justify-center rounded-md">
                        <div className="flex flex-col items-center gap-2 text-slate-700 dark:text-slate-200">
                          <RefreshCw className="w-6 h-6 animate-spin" />
                          <span className="text-xs font-medium">Cargando horarios...</span>
                        </div>
                      </div>
                    )}
                    <div className="min-w-[900px] grid grid-cols-[60px_repeat(6,1fr)] gap-1" style={{ gridAutoRows: '30px' }}>
                      <div className="p-2"></div>
                      {encabezadosDiasCronograma.map(({ dia, fecha }) => {
                        const diaBloqueado = isDiaBloqueado(dia);
                        return (
                        <div
                          key={dia}
                          className={`text-sm text-center text-white font-semibold p-2 rounded ${
                            diaBloqueado
                              ? 'bg-slate-500 shadow-[inset_0_0_0_9999px_rgba(15,23,42,0.25)]'
                              : 'bg-slate-800'
                          }`}
                        >
                          <div>{dia}</div>
                          <div className="text-[11px] font-medium opacity-90">{fecha}</div>
                        </div>
                      )})}

                      {horas.map((hora, idx) => (
                        <div
                          key={`time-${hora}`}
                          className={`text-xs text-slate-500 flex items-start justify-end pr-2 ${isHoraExacta(hora) ? 'font-semibold' : 'text-[9px] opacity-60'}`}
                          style={{
                            gridColumn: 1,
                            gridRow: idx + 2
                          }}
                        >
                          {isHoraExacta(hora) ? `${hora}:00` : `${hora % 1 === 0.25 ? '15' : hora % 1 === 0.5 ? '30' : '45'}`}
                        </div>
                      ))}

                      {/* Celdas vacías / disponibles - con interacción de selección y drop zone */}
                      {horas.flatMap((hora, horaIdx) =>
                        encabezadosDiasCronograma.map(({ dia }, diaIdx) => {
                          const ocupacionRaw = getOcupacionPorHora(espacio.id, dia, hora);
                          
                          // Verificar si la ocupación es del horario que se está arrastrando
                          const esOcupacionDelHorarioArrastrado = draggedHorario && ocupacionRaw && 
                            ocupacionRaw.id === draggedHorario.id &&
                            ocupacionRaw.materia === draggedHorario.materia;
                          
                          // Si es la ocupación del horario arrastrado, tratar como disponible
                          const ocupado = ocupacionRaw && !esOcupacionDelHorarioArrastrado;
                          
                          const estaSeleccionada = estaEnRangoSeleccion(espacio.id, dia, hora);
                          const celdaBloqueada = isCeldaBloqueada(dia, hora);
                          
                          // Verificar si esta celda es parte del rango donde se está arrastrando
                          // Para horarios de múltiples horas, resaltar todas las celdas que ocupará
                          // Ahora usamos slots de 15 minutos (4 slots por hora)
                          const duracionSlots = draggedHorario ? Math.round((draggedHorario.horaFin - draggedHorario.horaInicio) * 4) : 0;
                          const dropStartIdx = dragOverCell ? horaToSlotIndex(dragOverCell.hora) : -1;
                          const isDragOver = dragOverCell?.dia === dia && 
                            draggedHorario && 
                            horaIdx >= dropStartIdx && 
                            horaIdx < dropStartIdx + duracionSlots;
                          
                          // Verificar si hay un horario arrastrado que puede soltarse aquí
                          // Para horarios, no bloquear por fecha pasada (son recurrentes)
                          const canDrop = draggedHorario && editModeEnabled && draggedHorario.espacioId === espacio.id;
                          
                          return (
                            <div
                              key={`cell-${espacio.id}-${dia}-${hora}`}
                              className={`border rounded transition-all ${
                                isDragOver && canDrop
                                  ? 'border-purple-500 bg-purple-100 dark:bg-purple-900/30 ring-2 ring-purple-500'
                                  :
                                celdaBloqueada
                                  ? 'border-slate-300 dark:border-slate-700 bg-slate-200/70 dark:bg-slate-900/60 shadow-[inset_0_0_0_9999px_rgba(15,23,42,0.06)] cursor-not-allowed'
                                  :
                                ocupado 
                                  ? 'border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50' 
                                  : puedeCrearSolicitudes
                                    ? estaSeleccionada
                                      ? 'bg-purple-500 border-purple-700 cursor-grabbing'
                                      : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/20'
                                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                              }`}
                              style={{
                                gridColumn: diaIdx + 2,
                                gridRow: horaIdx + 2,
                                zIndex: isDragOver && canDrop ? 20 : 1
                              }}
                              onMouseDown={() => {
                                if (!celdaBloqueada && !ocupado && puedeCrearSolicitudes && !editModeEnabled) {
                                  iniciarSeleccion(espacio.id, dia, hora);
                                }
                              }}
                              onMouseEnter={() => {
                                if (!celdaBloqueada && !ocupado && puedeCrearSolicitudes && !editModeEnabled) {
                                  actualizarSeleccion(espacio.id, dia, hora);
                                }
                              }}
                              onMouseUp={() => {
                                if (puedeCrearSolicitudes && !editModeEnabled) {
                                  finalizarSeleccion();
                                }
                              }}
                              onDragOver={(e) => {
                                // Para horarios (drag and drop), no bloquear por fecha pasada
                                // Los horarios son recurrentes semanalmente
                                if (editModeEnabled && draggedHorario && draggedHorario.espacioId === espacio.id) {
                                  e.preventDefault();
                                  setDragOverCell({ dia, hora });
                                }
                              }}
                              onDragLeave={() => {
                                if (dragOverCell?.dia === dia && dragOverCell?.hora === hora) {
                                  setDragOverCell(null);
                                }
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                setDragOverCell(null);
                                // Para horarios (drag and drop), no bloquear por fecha pasada
                                // Los horarios son recurrentes semanalmente
                                if (draggedHorario && draggedHorario.espacioId === espacio.id) {
                                  // Calcular nueva hora de inicio basada en el drop
                                  const duracion = draggedHorario.horaFin - draggedHorario.horaInicio;
                                  const nuevaHoraInicio = hora;
                                  const nuevaHoraFin = nuevaHoraInicio + duracion;
                                  
                                  // Validar que no exceda el horario permitido
                                  if (nuevaHoraFin <= 22) {
                                    setIsProcessingMove(false); // Reiniciar estado de procesamiento
                                    setPendingMove({
                                      horario: draggedHorario,
                                      targetDia: dia,
                                      targetHoraInicio: nuevaHoraInicio
                                    });
                                    setConfirmMoveDialogOpen(true);
                                  } else {
                                    toast.error('No se puede mover el horario: las clases solo se permiten hasta las 22:00');
                                  }
                                }
                              }}
                            />
                          );
                        })
                      )}

                      {/* Horarios ocupados */}
                      {horarios
                        .filter(h => h.espacioId === espacio.id)
                        .map((ocupacion, idx) => {
                          const colStart = getDayColumnIndex(ocupacion.dia);
                          const rowStart = getHourRowIndex(ocupacion.horaInicio);
                          // Calcular rowSpan en intervalos de 15 minutos (4 slots por hora)
                          // Redondear horas a múltiplos de 15 min para evitar errores de precisión
                          const horaInicioRounded = roundTo15Min(ocupacion.horaInicio);
                          const horaFinRounded = roundTo15Min(ocupacion.horaFin);
                          const rowSpan = Math.max(1, Math.round((horaFinRounded - horaInicioRounded) * 4));

                          // Validar rango: ahora tenemos 64 slots (16 horas * 4) + 1 header = 66 filas
                          if (rowStart < 2 || rowStart > 66) return null;

                          // Determinar si es un préstamo o un horario académico
                          const isPrestamo = ocupacion.tipo === 'prestamo';
                          const isPrestamoPendiente = isPrestamo && ocupacion.prestamo?.estado === 'Pendiente';
                          const isPrestamoAprobado = isPrestamo && ocupacion.prestamo?.estado === 'Aprobado';
                          const isHorarioPendiente = !isPrestamo && ocupacion.estado === 'pendiente';
                          
                          let colorClass = '';
                          let labelText = '';
                          
                          if (isPrestamoPendiente) {
                            colorClass = 'bg-gradient-to-br from-yellow-300 to-yellow-400 hover:from-yellow-400 hover:to-yellow-500 text-slate-900';
                            labelText = 'PENDIENTE';
                          } else if (isPrestamoAprobado) {
                            colorClass = 'bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white';
                            labelText = 'APROBADO';
                          } else if (isHorarioPendiente) {
                            colorClass = 'bg-[#f97316] hover:bg-[#ea580c] text-white';
                            labelText = 'PENDIENTE';
                          } else if (ocupacion.estado === 'ocupado') {
                            colorClass = 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white';
                            labelText = ocupacion.materia || 'Ocupado';
                          } else {
                            colorClass = 'bg-gradient-to-br from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white';
                            labelText = '';
                          }

                          return (
                            <TooltipProvider key={`ocup-${idx}`}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div
                                    draggable={editModeEnabled && (!isPrestamo || isPrestamoPendiente)}
                                    onDragStart={() => {
                                      if (editModeEnabled && (!isPrestamo || isPrestamoPendiente)) {
                                        setDraggedHorario(ocupacion);
                                      }
                                    }}
                                    onDragEnd={() => {
                                      setDraggedHorario(null);
                                      setDragOverCell(null);
                                    }}
                                    onClick={() => {
                                      if (!editModeEnabled) return;
                                      setSelectedClassToMove(ocupacion);
                                      setTargetEspacioId(espacio.id);
                                      setMoveClassDialogOpen(true);
                                      setMoveClassError(null);
                                    }}
                                    className={`${colorClass} text-white rounded p-1 sm:p-1.5 md:p-2 text-[10px] sm:text-[11px] md:text-xs ${
                                      editModeEnabled && (!isPrestamo || isPrestamoPendiente)
                                        ? 'cursor-move hover:ring-2 hover:ring-purple-400 group' 
                                        : 'cursor-pointer'
                                    } shadow-sm flex flex-col justify-center items-center overflow-hidden h-full text-center leading-tight relative`}
                                    style={{
                                      gridColumn: `${colStart} / span 1`,
                                      gridRow: `${rowStart} / span ${rowSpan}`,
                                      zIndex: 10,
                                      minHeight: `${rowSpan * 30}px`
                                    }}
                                  >
                                    {editModeEnabled && (!isPrestamo || isPrestamoPendiente) && (
                                      <>
                                        <div className="absolute top-0.5 left-0.5 opacity-60">
                                          <GripVertical className="w-3 h-3" />
                                        </div>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (ocupacion.id) {
                                              setHorarioToDelete(ocupacion);
                                              setConfirmDeleteDialogOpen(true);
                                            } else {
                                              toast.error('No se puede eliminar: ID no disponible');
                                            }
                                          }}
                                          className="absolute top-0.5 right-0.5 p-0.5 bg-white/30 hover:bg-red-500 hover:text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                          title="Eliminar horario"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </>
                                    )}
                                    {isPrestamo && labelText && (
                                      <p className="text-[8px] sm:text-[9px] font-bold mb-0.5 bg-white/30 px-1 py-0.5 rounded shrink-0">{labelText}</p>
                                    )}
                                    <p className="font-semibold text-[9px] sm:text-[10px] md:text-[11px] leading-tight break-words w-full line-clamp-2">{ocupacion.materia}</p>
                                    <p className="text-[8px] sm:text-[9px] opacity-90 leading-tight break-words w-full line-clamp-1">{ocupacion.docente}</p>
                                    {rowSpan > 1 && (
                                      <p className="text-[7px] sm:text-[8px] opacity-75 leading-tight mt-0.5 shrink-0">
                                        {Math.floor(ocupacion.horaInicio)}:{String(Math.round((ocupacion.horaInicio % 1) * 60)).padStart(2, '0')}-
                                        {Math.floor(ocupacion.horaFin)}:{String(Math.round((ocupacion.horaFin % 1) * 60)).padStart(2, '0')}
                                      </p>
                                    )}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="space-y-1">
                                    {isPrestamo ? (
                                      <>
                                        <p className={`font-semibold text-sm ${isPrestamoPendiente ? 'text-yellow-600' : 'text-green-600'}`}>
                                          PRÉSTAMO {isPrestamoPendiente ? 'PENDIENTE' : 'APROBADO'}
                                        </p>
                                        <p className="text-xs">Actividad: {ocupacion.materia}</p>
                                        <p className="text-xs">Solicitante: {ocupacion.docente || 'No especificado'}</p>
                                        {ocupacion.grupo && <p className="text-xs">Motivo: {ocupacion.grupo}</p>}
                                        {ocupacion.prestamo?.asistentes && (
                                          <p className="text-xs">Asistentes: {ocupacion.prestamo.asistentes}</p>
                                        )}
                                        {ocupacion.prestamo?.telefono && (
                                          <p className="text-xs">Teléfono: {ocupacion.prestamo.telefono}</p>
                                        )}
                                        <p className="text-xs">Horario: {Math.floor(ocupacion.horaInicio)}:{String(Math.round((ocupacion.horaInicio % 1) * 60)).padStart(2, '0')} - {Math.floor(ocupacion.horaFin)}:{String(Math.round((ocupacion.horaFin % 1) * 60)).padStart(2, '0')}</p>
                                        <p className="text-xs">Fecha: {ocupacion.prestamo?.fecha}</p>
                                      </>
                                    ) : (
                                      <>
                                        <p className="font-semibold text-sm">{ocupacion.materia}</p>
                                        <p className="text-xs">Docente: {ocupacion.docente || 'No asignado'}</p>
                                        <p className="text-xs">Grupo: {ocupacion.grupo || 'N/A'}</p>
                                        <p className="text-xs">Horario: {Math.floor(ocupacion.horaInicio)}:{String(Math.round((ocupacion.horaInicio % 1) * 60)).padStart(2, '0')} - {Math.floor(ocupacion.horaFin)}:{String(Math.round((ocupacion.horaFin % 1) * 60)).padStart(2, '0')}</p>
                                        <p className="text-xs capitalize">Estado: {ocupacion.estado}</p>
                                      </>
                                    )}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          );
                        })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal de Nueva Solicitud */}
      <Dialog open={dialogSolicitudOpen} onOpenChange={setDialogSolicitudOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Solicitud de Préstamo</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {formError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            {/* Información del horario seleccionado */}
            {nuevaSolicitudData && (
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Horario Seleccionado
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Espacio:</span>
                    <p className="font-medium">{nuevaSolicitudData.espacio_nombre}</p>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Día:</span>
                    <p className="font-medium">{nuevaSolicitudData.diaSemana}</p>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Fecha:</span>
                    <p className="font-medium">{nuevaSolicitudData.fecha}</p>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Horario:</span>
                    <p className="font-medium">{nuevaSolicitudData.horaInicio} - {nuevaSolicitudData.horaFin}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Información Personal */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 border-b pb-2">
                Información del Solicitante
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre del Solicitante</Label>
                  <Input value={user?.nombre || ''} disabled className="bg-slate-50 dark:bg-slate-800" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user?.correo || ''} disabled className="bg-slate-50 dark:bg-slate-800" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono de Contacto</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  placeholder="+57 300 123 4567"
                />
              </div>
            </div>

            {/* Selección de Espacio */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 border-b pb-2">
                Selección de Espacio
              </h3>
              {espaciosDisponibles.length > 0 ? (
                <div className="space-y-2">
                  <Label>Espacio Disponible *</Label>
                  <Select
                    value={formData.espacio_id > 0 ? formData.espacio_id.toString() : ''}
                    onValueChange={(v) => setFormData({ ...formData, espacio_id: parseInt(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar espacio disponible" />
                    </SelectTrigger>
                    <SelectContent>
                      {espaciosDisponibles.map(espacio => (
                        <SelectItem key={espacio.id} value={espacio.id.toString()}>
                          {espacio.nombre} - {espacio.tipo} (Capacidad: {espacio.capacidad})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                    {espaciosDisponibles.length} espacio(s) disponible(s) para este horario
                  </p>
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No hay espacios disponibles para la fecha y horario seleccionados.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Detalles de la Actividad */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 border-b pb-2">
                Detalles de la Actividad
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Actividad *</Label>
                  <Select
                    value={formData.tipo_actividad_id > 0 ? formData.tipo_actividad_id.toString() : ''}
                    onValueChange={(v) => setFormData({ ...formData, tipo_actividad_id: parseInt(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposActividad.map(tipo => (
                        <SelectItem key={tipo.id} value={tipo.id.toString()}>{tipo.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Número de Asistentes</Label>
                  <Input
                    type="number"
                    value={formData.asistentes}
                    onChange={(e) => setFormData({ ...formData, asistentes: e.target.value })}
                    placeholder="Ej: 30"
                    min="0"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Motivo del Préstamo *</Label>
                <Textarea
                  value={formData.motivo}
                  onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                  placeholder="Describa el motivo de la solicitud (clase adicional, tutoría, evento, etc.)"
                  rows={3}
                />
              </div>
            </div>

            {/* Configuración de repetición */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 border-b pb-2">
                Configuración de repetición
              </h3>

              <div className="space-y-4 border rounded-lg p-4 bg-slate-50 dark:bg-slate-900/50">
                <div className="space-y-2">
                  <Label>Repetición</Label>
                  <Select value={repeatOption} onValueChange={(v: RepeatQuickOption) => setRepeatOption(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="No se repite" />
                    </SelectTrigger>
                    <SelectContent>
                      {repeatOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {repeatOption === 'custom' && (
                  <div className="space-y-4 border rounded-md p-3 bg-white dark:bg-slate-900/40">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Repetir cada *</Label>
                        <Input
                          type="number"
                          min="1"
                          max={customPeriod === 'day' ? 31 : customPeriod === 'week' ? 3 : customPeriod === 'month' ? 11 : 5}
                          value={formData.intervalo}
                          onChange={(e) => {
                            const maxValue = customPeriod === 'day' ? 31 : customPeriod === 'week' ? 3 : customPeriod === 'month' ? 11 : 5;
                            const value = Math.max(1, Math.min(maxValue, Number(e.target.value) || 1));
                            setFormData((prev) => ({
                              ...prev,
                              intervalo: value
                            }));
                          }}
                        />
                        <p className="text-xs text-slate-500">
                          Máximo: {customPeriod === 'day' ? '31 días' : customPeriod === 'week' ? '3 semanas' : customPeriod === 'month' ? '11 meses' : '5 años'}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Periodo *</Label>
                        <Select value={customPeriod} onValueChange={(v: CustomPeriod) => setCustomPeriod(v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Periodo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="day">Día</SelectItem>
                            <SelectItem value="week">Semana</SelectItem>
                            <SelectItem value="month">Mes</SelectItem>
                            <SelectItem value="year">Año</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {customPeriod === 'week' && (
                      <div className="space-y-2">
                        <Label>Días de la semana *</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {DIAS_SEMANA_OPTIONS.map((dia) => {
                            const selected = formData.dias_semana.includes(dia.value);
                            return (
                              <button
                                key={dia.value}
                                type="button"
                                onClick={() => toggleDiaSemana(dia.value)}
                                className={`px-3 py-2 rounded-md border text-sm text-left transition-colors ${selected
                                  ? 'bg-blue-100 border-blue-400 text-blue-800 dark:bg-blue-950/40 dark:border-blue-700 dark:text-blue-200'
                                  : 'bg-white border-slate-300 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200'
                                }`}
                              >
                                {dia.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {repeatOption !== 'none' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Finaliza repetición</Label>
                      <Select
                        value={formData.fin_repeticion_tipo}
                        onValueChange={(v: 'never' | 'until_date' | 'count') =>
                          setFormData((prev) => ({
                            ...prev,
                            fin_repeticion_tipo: v,
                            fin_repeticion_fecha: v === 'until_date' ? prev.fin_repeticion_fecha : '',
                            fin_repeticion_ocurrencias: v === 'count' ? prev.fin_repeticion_ocurrencias : ''
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar fin" />
                        </SelectTrigger>
                        <SelectContent>
                          {FIN_REPETICION_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.fin_repeticion_tipo === 'until_date' && (
                      <div className="space-y-2">
                        <Label>Fecha de finalización *</Label>
                        <Input
                          type="date"
                          value={formData.fin_repeticion_fecha}
                          onChange={(e) => setFormData((prev) => ({ ...prev, fin_repeticion_fecha: e.target.value }))}
                        />
                      </div>
                    )}

                    {formData.fin_repeticion_tipo === 'count' && (
                      <div className="space-y-2">
                        <Label>Número de repeticiones *</Label>
                        <Input
                          type="number"
                          min="1"
                          value={formData.fin_repeticion_ocurrencias}
                          onChange={(e) => setFormData((prev) => ({ ...prev, fin_repeticion_ocurrencias: e.target.value }))}
                          placeholder="Ej: 10"
                        />
                      </div>
                    )}
                  </div>
                )}

                <p className="text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md p-2">
                  {recurrenceSummary()}
                </p>

                {/* Preview visual de fechas generadas */}
                {recurrencePreviewDates.length > 0 && repeatOption !== 'none' && (
                  <div className="mt-4 border rounded-lg overflow-hidden bg-white dark:bg-slate-900/40">
                    <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Vista previa de horarios ({recurrencePreviewDates.length} fechas)
                      </span>
                    </div>
                    <div className="max-h-48 overflow-y-auto p-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {recurrencePreviewDates.map((date, idx) => (
                          <div
                            key={idx}
                            className={`flex items-center gap-2 p-2 rounded-md text-sm ${
                              idx === 0
                                ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700'
                                : 'bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                              idx === 0
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-200'
                            }`}>
                              {idx + 1}
                            </div>
                            <div className="flex-1">
                              <p className={`font-medium ${idx === 0 ? 'text-blue-800 dark:text-blue-200' : 'text-slate-700 dark:text-slate-300'}`}>
                                {date.toLocaleDateString('es-CO', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {nuevaSolicitudData?.horaInicio} - {nuevaSolicitudData?.horaFin}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {recurrencePreviewDates.length >= 100 && (
                      <div className="px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border-t border-yellow-200 dark:border-yellow-800">
                        <p className="text-xs text-yellow-700 dark:text-yellow-300">
                          Se muestran las primeras 100 ocurrencias. Hay más fechas que se generarán según la configuración.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Recursos Adicionales */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 border-b pb-2">
                Recursos Adicionales (Opcional)
              </h3>
              <div className="space-y-4 border rounded-lg p-4 bg-slate-50 dark:bg-slate-900/50">
                <div>
                  <Label className="text-sm font-medium">Agregar recursos necesarios</Label>
                  <div className="mt-2">
                    <SearchableSelect
                      items={recursosDisponibles.filter(r => !recursosSeleccionados.some(s => s.recurso_id === r.id))}
                      value={null}
                      onSelect={(recurso) => agregarRecurso(recurso.id!)}
                      getItemId={(recurso) => recurso.id!}
                      getItemLabel={(recurso) => recurso.nombre}
                      placeholder="Seleccionar recurso..."
                      searchPlaceholder="Buscar recurso..."
                      emptyMessage="No se encontró ningún recurso."
                    />
                  </div>
                </div>

                {recursosSeleccionados.length > 0 ? (
                  <div className="space-y-2">
                    {recursosSeleccionados.map((item) => (
                      <div key={item.recurso_id} className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-md border border-slate-200 dark:border-slate-700">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {item.recurso_nombre}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => eliminarRecurso(item.recurso_id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-3 text-slate-500 dark:text-slate-400 text-sm italic">
                    No has seleccionado ningún recurso
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setDialogSolicitudOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSubmitSolicitud} 
                disabled={submitting}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white"
              >
                {submitting ? 'Enviando...' : 'Enviar Solicitud'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Confirmación para Drag and Drop */}
      <Dialog open={confirmMoveDialogOpen} onOpenChange={setConfirmMoveDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Movimiento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {pendingMove?.horario && (
              <div className="space-y-3">
                <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Horario Actual:</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {pendingMove.horario.materia} - {pendingMove.horario.dia} {formatHoraDecimal(pendingMove.horario.horaInicio)}-{formatHoraDecimal(pendingMove.horario.horaFin)}
                  </p>
                </div>
                <div className="flex items-center justify-center">
                  <div className="bg-purple-100 dark:bg-purple-900/30 rounded-full p-2">
                    <ArrowLeft className="w-5 h-5 text-purple-600 rotate-90" />
                  </div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Nuevo Horario:</p>
                  <p className="text-sm text-purple-600 dark:text-purple-400">
                    {pendingMove.targetDia} {formatHoraDecimal(pendingMove.targetHoraInicio)}-{formatHoraDecimal(pendingMove.targetHoraInicio + (pendingMove.horario.horaFin - pendingMove.horario.horaInicio))}
                  </p>
                </div>
              </div>
            )}
            <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
              ¿Estás seguro de que deseas mover esta clase?
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => {
              setConfirmMoveDialogOpen(false);
              setPendingMove(null);
              setDraggedHorario(null);
            }}>
              Cancelar
            </Button>
            <Button 
              onClick={ejecutarMovimiento}
              disabled={isProcessingMove}
              className="bg-gradient-to-r from-purple-600 to-purple-700 text-white"
            >
              {isProcessingMove ? 'Procesando...' : 'Confirmar Movimiento'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo para Mover Clase a Otro Espacio */}
      <Dialog open={moveClassDialogOpen} onOpenChange={setMoveClassDialogOpen}>
        <DialogContent className="w-[90vw] h-[85vh] max-w-none max-h-none overflow-y-auto p-4 sm:p-8 rounded-lg" style={{ maxWidth: '50vw' }}>
          <DialogHeader>
            <DialogTitle>Mover Clase a Otro Espacio</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {moveClassError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{moveClassError}</AlertDescription>
              </Alert>
            )}

            {/* Información de la clase actual y nuevo horario */}
            {selectedClassToMove && (
              <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
                  Clase a Mover
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Materia:</span>
                    <p className="font-medium">{selectedClassToMove.materia}</p>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Docente:</span>
                    <p className="font-medium">{selectedClassToMove.docente || 'No asignado'}</p>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Horario Actual:</span>
                    <p className="font-medium">{selectedClassToMove.dia} {formatHoraDecimal(selectedClassToMove.horaInicio)}-{formatHoraDecimal(selectedClassToMove.horaFin)}</p>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Grupo:</span>
                    <p className="font-medium">{selectedClassToMove.grupo || 'N/A'}</p>
                  </div>
                </div>
                {targetEspacioId && targetMoveDia && targetMoveHoraInicio !== null && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-purple-600 dark:text-purple-400 font-medium">Nuevo Horario:</span>
                    <p className="font-medium text-purple-700 dark:text-purple-300">
                      {targetMoveDia} {formatHoraDecimal(targetMoveHoraInicio)}-{formatHoraDecimal(targetMoveHoraInicio + (selectedClassToMove.horaFin - selectedClassToMove.horaInicio))}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Selección de espacio destino */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Seleccionar Espacio Destino</Label>
              <Select 
                value={targetEspacioId} 
                onValueChange={(value) => {
                setTargetEspacioId(value);
                // Inicializar día y hora con los valores originales al seleccionar espacio
                if (selectedClassToMove) {
                  setTargetMoveDia(selectedClassToMove.dia);
                  setTargetMoveHoraInicio(selectedClassToMove.horaInicio);
                }
              }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar aula o espacio..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {filteredEspacios.map((espacio) => (
                    <SelectItem key={espacio.id} value={espacio.id}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{espacio.nombre}</span>
                        <span className="text-xs text-slate-500">
                          {espacio.tipo} - Cap: {espacio.capacidad} - {espacio.sede}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Vista previa del horario del espacio destino */}
            {targetEspacioId && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Vista Previa del Horario Destino
                </h3>
                <Card className="border-slate-200 dark:border-slate-700">
                  <CardContent className="p-4">
                    <div className="w-full">
                      <div className="grid grid-cols-[50px_repeat(6,1fr)] gap-1" style={{ gridAutoRows: '32px' }}>
                        {/* Headers */}
                        <div className="p-1"></div>
                        {diasSemana.map((dia) => (
                          <div
                            key={dia}
                            className={`text-xs text-center text-white font-semibold p-1 rounded bg-slate-800 ${
                              selectedClassToMove?.dia === dia ? 'ring-2 ring-purple-500' : ''
                            }`}
                          >
                            {dia.slice(0, 3)}
                          </div>
                        ))}

                        {/* Time slots */}
                        {horas.map((hora, idx) => (
                          <div key={`time-${hora}`} className="text-xs text-slate-500 flex items-center justify-end pr-1"
                            style={{ gridColumn: 1, gridRow: idx + 2 }}>
                            {hora}:00
                          </div>
                        ))}

                        {/* Grid cells */}
                        {horas.flatMap((hora, horaIdx) =>
                          diasSemana.map((dia, diaIdx) => {
                            // Buscar en horarios (ya incluye horarios y prestamos fusionados)
                            const ocupacionEnCelda = horarios.find(o =>
                              o.espacioId === targetEspacioId &&
                              o.dia === dia &&
                              hora >= o.horaInicio &&
                              hora < o.horaFin
                            );

                            // Separar en horario vs prestamo
                            const horarioEnCelda = ocupacionEnCelda && ocupacionEnCelda.tipo !== 'prestamo' ? ocupacionEnCelda : null;
                            const prestamoEnCelda = ocupacionEnCelda && ocupacionEnCelda.tipo === 'prestamo' ? ocupacionEnCelda : null;

                            // Verificar si es el horario propuesto seleccionado
                            const isProposedSlot = selectedClassToMove &&
                              targetMoveDia &&
                              targetMoveHoraInicio !== null &&
                              dia === targetMoveDia &&
                              hora >= targetMoveHoraInicio &&
                              hora < targetMoveHoraInicio + (selectedClassToMove.horaFin - selectedClassToMove.horaInicio);
                            
                            // Verificar si esta celda está disponible para selección
                            const canSelect = !horarioEnCelda && !prestamoEnCelda && selectedClassToMove;

                            let bgClass = 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700';
                            let hoverClass = canSelect ? 'hover:bg-blue-50 hover:border-blue-300 cursor-pointer' : '';
                            let labelText = '';
                            let textClass = '';

                            if (prestamoEnCelda) {
                              // Los préstamos tienen prioridad sobre los horarios
                              const isPrestamoPendiente = prestamoEnCelda.estado === 'Pendiente';
                              bgClass = isPrestamoPendiente
                                ? 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700'
                                : 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700';
                              hoverClass = '';
                              labelText = isPrestamoPendiente ? 'Préstamo (Pendiente)' : 'Préstamo (Aprobado)';
                              textClass = isPrestamoPendiente ? 'text-yellow-600' : 'text-green-600';
                            } else if (horarioEnCelda) {
                              bgClass = 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700';
                              hoverClass = '';
                              labelText = horarioEnCelda.materia || 'Ocupado';
                              textClass = 'text-red-600';
                            }
                            if (isProposedSlot) {
                              bgClass = 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700 ring-2 ring-purple-500';
                              hoverClass = '';
                            }

                            return (
                              <div
                                key={`preview-${dia}-${hora}`}
                                className={`border rounded text-xs flex items-center justify-center ${bgClass} ${hoverClass} transition-colors`}
                                style={{ gridColumn: diaIdx + 2, gridRow: horaIdx + 2 }}
                                onClick={() => {
                                  if (canSelect) {
                                    setTargetMoveDia(dia);
                                    setTargetMoveHoraInicio(hora);
                                    // Limpiar error si existe
                                    if (moveClassError) setMoveClassError(null);
                                  }
                                }}
                                title={canSelect ? `Seleccionar ${dia} ${hora}:00` : ''}
                              >
                                {prestamoEnCelda && <span className={`${textClass} font-medium truncate px-1`}>{labelText}</span>}
                                {!prestamoEnCelda && horarioEnCelda && <span className={`${textClass} font-medium truncate px-1`}>{labelText}</span>}
                                {isProposedSlot && !horarioEnCelda && !prestamoEnCelda && <span className="text-purple-600 font-medium">Nuevo</span>}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-3 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
                        <span>Horario ocupado</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></div>
                        <span>Préstamo pendiente</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                        <span>Préstamo aprobado</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-purple-100 border border-purple-300 rounded ring-1 ring-purple-500"></div>
                        <span>Posición propuesta</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button variant="outline" onClick={() => {
              setMoveClassDialogOpen(false);
              setSelectedClassToMove(null);
              setTargetEspacioId('');
              setTargetMoveDia('');
              setTargetMoveHoraInicio(null);
              setMoveClassError(null);
            }}>
              Cancelar
            </Button>
            <Button 
              onClick={ejecutarMovimientoOtroEspacio}
              disabled={!targetEspacioId || movingClass}
              className="bg-gradient-to-r from-purple-600 to-purple-700 text-white"
            >
              {movingClass ? 'Moviendo...' : 'Mover Clase'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Confirmación para Eliminar Horario */}
      <Dialog open={confirmDeleteDialogOpen} onOpenChange={setConfirmDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Confirmar Eliminación</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {horarioToDelete && (
              <div className="space-y-3">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">Horario a eliminar:</p>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {horarioToDelete.materia} - {horarioToDelete.dia} {formatHoraDecimal(horarioToDelete.horaInicio)}-{formatHoraDecimal(horarioToDelete.horaFin)}
                  </p>
                  {horarioToDelete.docente && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      Docente: {horarioToDelete.docente}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-center">
                  <div className="bg-red-100 dark:bg-red-900/30 rounded-full p-2">
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </div>
                </div>
              </div>
            )}
            <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
              ¿Estás seguro de que deseas eliminar este horario? Esta acción no se puede deshacer.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => {
              setConfirmDeleteDialogOpen(false);
              setHorarioToDelete(null);
            }}>
              Cancelar
            </Button>
            <Button 
              onClick={eliminarHorario}
              disabled={isDeleting}
              className="bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800"
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar Horario'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
