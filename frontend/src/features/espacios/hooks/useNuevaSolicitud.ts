import type { useConsultaEspacios } from './useConsultaEspacios';
import type { useAuth } from '../../../context/AuthContext';
import { useState, useEffect } from 'react';
import { tipoActividadService, type TipoActividad } from '../../prestamos/services/tipoActividadAPI';
import { recursoService, type Recurso } from '../../../services/recursos/recursoAPI';
import { sedeService } from '../../../services/sedes/sedeAPI';
import { prestamosPublicAPI, type EspacioDisponibleAPI } from '../../prestamos/services/prestamosPublicAPI';
import { prestamoService, type RecursoPrestamo } from '../../prestamos/services/prestamoAPI';
import { toast } from 'sonner';
import type { Sede } from '../../../services/sedes/sedeAPI';
import {
  opcionRapidaPermitida,
  maxIntervaloPermitido,
  maxOcurrenciasPorOpcion,
  fechaFinPeriodo,
} from '../../../utils/recurrenceLimits';

import {
  type RepeatQuickOption,
  type CustomPeriod,
  WEEKDAY_NAMES,
} from './consultaEspaciosComun';
import {
  FIN_REPETICION_OPTIONS,
  DIAS_SEMANA_OPTIONS,
  getWeekdayMondayIndex,
  getOrdinalWeekdayText,
  type ConflictoForm,
} from './nuevaSolicitudUtils';
import { crearCalculosRecurrencia } from './recurrenciaSolicitud';

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
  const [conflictosFormulario, setConflictosFormulario] = useState<ConflictoForm[]>([]);

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

  const { buildRecurrenceFromSelection, recurrenceSummary, generateRecurrenceDates } = crearCalculosRecurrencia({
    formData, repeatOption, customPeriod, nuevaSolicitudData,
  });


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
