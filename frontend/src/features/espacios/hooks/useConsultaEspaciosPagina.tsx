import { Badge } from '../../../components/ui/badge';
import { useConsultaEspacios } from './useConsultaEspacios';
import { getRangoSemanaCompleta } from './semanaUtils';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { useAuth } from '../../../context/AuthContext';
import { useState, useEffect, useCallback } from 'react';
import { prestamoService } from '../../prestamos/services/prestamoAPI';
import { horarioService } from '../../horarios/services/horariosAPI';
import { toast } from 'sonner';
import { formatFechaLocalYYYYMMDD, getHoyColombia, formatHoraDecimal, formatHoraApi } from './consultaEspaciosComun';
import { useMoverClase } from './useMoverClase';

/** Estado y acciones de la página de disponibilidad de espacios. */
export function useConsultaEspaciosPagina() {
  const isMobile = useIsMobile();
  const { user, hasEditPermission } = useAuth();
  
  const hook = useConsultaEspacios();
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
    aplicarRangoPeriodo,
    vistaActual,
    setVistaActual,
    tiposEspacio,
    sedes,
    diasSemana,
    horas,
    filteredEspacios,
    totalFilteredEspacios,
    currentPage,
    pageSize,
    estadisticas,
    horarios,
    prestamos,
    exportarCronogramaPDF,
    exportarCronogramaExcel,
    getOcupacionPorHora,
    getConflictoEnRango,
    // Drag-to-select
    isDragging,
    seleccionRango,
    finalizarSeleccion,
    puedeCrearSolicitudes,
    // Modal solicitud
    dialogSolicitudOpen,
    setDialogSolicitudOpen,
    nuevaSolicitudData,
    // Período académico
    periodos,
    fechaServidor,
    periodosLoading,
    errorBusquedaPeriodo,
    buscarPeriodoPorRangoFechas,
    cargarHorariosPorPeriodo,
    cargarPeriodos,
    // Vista individual
    espacioSeleccionado,
    volverALista,
    // Filtros
    limpiarFiltros,
    // Recarga
    recargarDatos,
    loading
  } = hook;

  const describirConflicto = (conflicto: typeof horarios[number]) => {
    const etiqueta =
      conflicto.tipo === 'prestamo'
        ? `préstamo${conflicto.prestamo?.estado ? ` ${conflicto.prestamo.estado.toLowerCase()}` : ''}`
        : conflicto.materia || 'horario existente';

    return `${etiqueta} (${formatHoraDecimal(conflicto.horaInicio)}-${formatHoraDecimal(conflicto.horaFin)})`;
  };

  // Calcular índices de paginación
  const firstItemIndex = totalFilteredEspacios === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastItemIndex = Math.min(currentPage * pageSize, totalFilteredEspacios);

  // Estado para el período seleccionado
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<typeof periodos[0] | null>(null);
  const [mensajeAutoPeriodo, setMensajeAutoPeriodo] = useState<string | null>(null);
  const [inicializacionAplicada, setInicializacionAplicada] = useState(false);
  const [rangoDefaultSincronizado, setRangoDefaultSincronizado] = useState(false);
  const puedeEditarDisponibilidad = hasEditPermission('Disponibilidad de Espacios');

  const encontrarInicioValidoPeriodo = (periodo: typeof periodos[0]) => {
    const hoy = fechaServidor ? new Date(`${fechaServidor}T00:00:00`) : getHoyColombia();
    const inicioPeriodo = new Date(`${periodo.fecha_inicio}T00:00:00`);
    const finPeriodo = new Date(`${periodo.fecha_fin}T00:00:00`);
    inicioPeriodo.setHours(0, 0, 0, 0);
    finPeriodo.setHours(0, 0, 0, 0);

    // Período ya finalizado: solo permite consultar, mostrando su última semana.
    if (hoy > finPeriodo) {
      const inicioRango = new Date(finPeriodo);
      inicioRango.setDate(inicioRango.getDate() - 7);
      const inicioValido = inicioRango < inicioPeriodo ? inicioPeriodo : inicioRango;

      return {
        inicio: formatFechaLocalYYYYMMDD(inicioValido),
        fin: formatFechaLocalYYYYMMDD(finPeriodo),
        ajustadoPorDomingo: false
      };
    }

    const inicioValido = hoy < inicioPeriodo ? inicioPeriodo : hoy;
    const finRango = new Date(inicioValido);
    finRango.setDate(finRango.getDate() + 7);
    const finValido = finRango > finPeriodo ? finPeriodo : finRango;

    return {
      inicio: formatFechaLocalYYYYMMDD(inicioValido),
      fin: formatFechaLocalYYYYMMDD(finValido),
      ajustadoPorDomingo: false
    };
  };

  const aplicarPeriodoConIntervaloValido = (periodo: typeof periodos[0], mostrarMensajeDomingo = false) => {
    const intervalo = encontrarInicioValidoPeriodo(periodo);
    if (!intervalo) {
      setMensajeAutoPeriodo('No se encontró una fecha de inicio válida dentro del período seleccionado.');
      return;
    }

    setPeriodoSeleccionado(periodo);
    setFilterPeriodo(periodo.id ?? null);
    aplicarRangoPeriodo(intervalo.inicio, intervalo.fin);

    if (mostrarMensajeDomingo && intervalo.ajustadoPorDomingo) {
      setMensajeAutoPeriodo('La fecha de hoy cae en domingo. El filtro fue ajustado automáticamente al lunes siguiente.');
    } else {
      setMensajeAutoPeriodo(null);
    }
  };

  const recargarDisponibilidad = useCallback(async () => {
    await Promise.all([
      recargarDatos(),
      cargarPeriodos(),
      filterPeriodo && filterFechaInicio
        ? (() => {
            const { desde, hasta } = getRangoSemanaCompleta(filterFechaInicio);
            return cargarHorariosPorPeriodo(filterPeriodo, ['aprobado', 'pendiente'], {
              fechaInicio: desde,
              fechaFin: hasta
            });
          })()
        : Promise.resolve()
    ]);
  }, [cargarHorariosPorPeriodo, cargarPeriodos, filterFechaInicio, filterPeriodo, recargarDatos]);

  const resolverPeriodoVigente = () => {
    const hoyISO = fechaServidor || formatFechaLocalYYYYMMDD(getHoyColombia());

    const activo = periodos.find((p) => p.activo);
    if (activo) return activo;

    const contieneHoy = periodos.find((p) => p.fecha_inicio <= hoyISO && p.fecha_fin >= hoyISO);
    if (contieneHoy) return contieneHoy;

    const proximo = periodos
      .filter((p) => p.fecha_inicio > hoyISO)
      .sort((a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio))[0];
    if (proximo) return proximo;

    return [...periodos].sort((a, b) => b.fecha_fin.localeCompare(a.fecha_fin))[0] ?? null;
  };

  useEffect(() => {
    if (inicializacionAplicada || periodosLoading || periodos.length === 0 || !fechaServidor) return;

    const vigente = resolverPeriodoVigente();
    if (!vigente) return;

    aplicarPeriodoConIntervaloValido(vigente, true);
    setInicializacionAplicada(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inicializacionAplicada, periodosLoading, periodos, fechaServidor]);

  useEffect(() => {
    if (rangoDefaultSincronizado || !inicializacionAplicada || !periodoSeleccionado) return;

    const hoyISO = fechaServidor || formatFechaLocalYYYYMMDD(getHoyColombia());
    const hoyEstaEnPeriodo =
      periodoSeleccionado.fecha_inicio <= hoyISO && periodoSeleccionado.fecha_fin >= hoyISO;

    if (!hoyEstaEnPeriodo) {
      setRangoDefaultSincronizado(true);
      return;
    }

    if (filterFechaInicio !== hoyISO) {
      const intervalo = encontrarInicioValidoPeriodo(periodoSeleccionado);
      aplicarRangoPeriodo(intervalo.inicio, intervalo.fin);
    }

    setRangoDefaultSincronizado(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangoDefaultSincronizado, inicializacionAplicada, periodoSeleccionado, fechaServidor]);

  // Integrar búsqueda de período cuando se cambian las fechas
  useEffect(() => {
    if (!inicializacionAplicada || !rangoDefaultSincronizado) return;

    if (filterFechaInicio && filterFechaFin) {
      buscarPeriodoPorRangoFechas(filterFechaInicio, filterFechaFin).then((periodo) => {
        if (periodo) {
          setPeriodoSeleccionado(periodo);
          setFilterPeriodo(periodo.id ?? null);
        }
      });
    }
  }, [
    buscarPeriodoPorRangoFechas,
    filterFechaInicio,
    filterFechaFin,
    inicializacionAplicada,
    rangoDefaultSincronizado,
    setFilterPeriodo
  ]);


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


  // Efecto para finalizar selección cuando se suelta el mouse fuera de la cuadrícula
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging && puedeCrearSolicitudes && !editModeEnabled) {
        finalizarSeleccion();
      }
    };

    if (isDragging) {
      window.addEventListener('mouseup', handleGlobalMouseUp, { once: true });
      return () => {
        window.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging, puedeCrearSolicitudes, editModeEnabled, finalizarSeleccion]);

  // Efecto para cargar horarios del período seleccionado cuando cambia el filtro de período
  useEffect(() => {
    if (filterPeriodo && filterFechaInicio) {
      const { desde, hasta } = getRangoSemanaCompleta(filterFechaInicio);
      cargarHorariosPorPeriodo(filterPeriodo, ['aprobado', 'pendiente'], {
        fechaInicio: desde,
        fechaFin: hasta
      });
    }
  }, [filterPeriodo, filterFechaInicio, cargarHorariosPorPeriodo]);


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


  // Memoizar esta función para evitar recálculos en cada render
  const estaEnRangoSeleccion = useCallback((espacioId: string, dia: string, hora: number) => {
    if (!seleccionRango) return false;
    return seleccionRango.espacioId === espacioId &&
           seleccionRango.dia === dia &&
           hora >= seleccionRango.horaInicio &&
           hora < seleccionRango.horaFin;
  }, [seleccionRango]);

  // Función para validar si un movimiento es posible (sin conflictos)
  const validarMovimiento = (
    horario: typeof horarios[0],
    targetEspacioId: string,
    targetDia: string,
    targetHoraInicio: number,
    targetHoraFin: number
  ): { valido: boolean; error?: string } => {
    if (targetHoraFin > 23) {
      return { valido: false, error: 'El horario excede el límite permitido (23:00)' };
    }

    if (targetHoraInicio >= targetHoraFin) {
      return { valido: false, error: 'La hora de inicio debe ser menor que la hora de fin' };
    }

    const conflicto = getConflictoEnRango(
      targetEspacioId,
      targetDia,
      targetHoraInicio,
      targetHoraFin,
      horario
    );

    if (conflicto) {
      return {
        valido: false,
        error: `Conflicto con ${describirConflicto(conflicto)}`
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
      recargarDisponibilidad();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      const formatHora = formatHoraApi;

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
          ...horario.prestamo,
          id: horario.id,
          estado: horario.estado || 'Pendiente',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          fecha: (horario as any).fecha || (horario.prestamo?.fecha),
          hora_inicio: formatHora(targetHoraInicio),
          hora_fin: formatHora(targetHoraFin)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      recargarDisponibilidad();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // Diálogo para mover una clase a otro espacio (estado y movimiento en useMoverClase)
  const moverClase = useMoverClase({ horarios, filteredEspacios, getConflictoEnRango, validarMovimiento, recargarDisponibilidad });
  const { setSelectedClassToMove, setTargetEspacioId, setMoveClassDialogOpen, setMoveClassError } = moverClase;

  return {
    hook,
    isMobile,
    user,
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
    aplicarRangoPeriodo,
    vistaActual,
    setVistaActual,
    tiposEspacio,
    sedes,
    diasSemana,
    horas,
    filteredEspacios,
    totalFilteredEspacios,
    currentPage,
    pageSize,
    estadisticas,
    horarios,
    prestamos,
    exportarCronogramaPDF,
    exportarCronogramaExcel,
    getOcupacionPorHora,
    getConflictoEnRango,
    isDragging,
    seleccionRango,
    finalizarSeleccion,
    puedeCrearSolicitudes,
    dialogSolicitudOpen,
    setDialogSolicitudOpen,
    nuevaSolicitudData,
    periodos,
    fechaServidor,
    periodosLoading,
    errorBusquedaPeriodo,
    buscarPeriodoPorRangoFechas,
    cargarHorariosPorPeriodo,
    cargarPeriodos,
    espacioSeleccionado,
    volverALista,
    limpiarFiltros,
    recargarDatos,
    loading,
    describirConflicto,
    firstItemIndex,
    lastItemIndex,
    periodoSeleccionado,
    setPeriodoSeleccionado,
    mensajeAutoPeriodo,
    setMensajeAutoPeriodo,
    inicializacionAplicada,
    setInicializacionAplicada,
    rangoDefaultSincronizado,
    setRangoDefaultSincronizado,
    puedeEditarDisponibilidad,
    encontrarInicioValidoPeriodo,
    aplicarPeriodoConIntervaloValido,
    recargarDisponibilidad,
    resolverPeriodoVigente,
    editModeEnabled,
    setEditModeEnabled,
    draggedHorario,
    setDraggedHorario,
    dragOverCell,
    setDragOverCell,
    confirmMoveDialogOpen,
    setConfirmMoveDialogOpen,
    pendingMove,
    setPendingMove,
    espaciosToShow,
    getAperturaBadge,
    getDayColumnIndex,
    estaEnRangoSeleccion,
    validarMovimiento,
    isProcessingMove,
    setIsProcessingMove,
    horarioToDelete,
    setHorarioToDelete,
    confirmDeleteDialogOpen,
    setConfirmDeleteDialogOpen,
    isDeleting,
    setIsDeleting,
    eliminarHorario,
    ejecutarMovimiento,
    moverClase,
    setSelectedClassToMove,
    setTargetEspacioId,
    setMoveClassDialogOpen,
    setMoveClassError,
  };
}
