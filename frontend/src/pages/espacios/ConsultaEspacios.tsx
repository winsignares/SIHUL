import { Input } from '../../share/input';
import { DatePickerField } from '../../share/date-picker-field';
import { Button } from '../../share/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../share/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../share/select';
import { Badge } from '../../share/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../share/dialog';
import { Label } from '../../share/label';
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
import { getRangoSemanaCompleta } from '../../hooks/espacios/semanaUtils';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect, useCallback } from 'react';
import { prestamoService } from '../../services/prestamos/prestamoAPI';
import { horarioService } from '../../services/horarios/horariosAPI';
import { toast } from 'sonner';

import {
  formatFechaLocalYYYYMMDD,
  getHoyColombia,
  formatHoraDecimal,
  formatHoraApi,
} from '../../hooks/espacios/consultaEspaciosComun';
import { NuevaSolicitudDialog } from '../../components/espacios/consulta/NuevaSolicitudDialog';


import { useMoverClase } from '../../hooks/espacios/useMoverClase';
import { MoverClaseDialog } from '../../components/espacios/consulta/MoverClaseDialog';
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
    aplicarRangoPeriodo,
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
    getConflictoEnRango,
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
    fechaServidor,
    periodosLoading,
    horariosLoading,
    errorBusquedaPeriodo,
    buscarPeriodoPorRangoFechas,
    cargarHorariosPorPeriodo,
    cargarPeriodos,
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
            onClick={recargarDisponibilidad}
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
                <DatePickerField
                  value={filterFechaInicio}
                  onChange={handleFechaInicioChange}
                  className={`${isMobile ? 'flex-1' : 'w-[150px]'} h-9 ${isMobile ? 'text-sm' : ''}`}
                  placeholder="Fecha inicio"
                  title="Fecha inicio del rango"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-slate-500">Hasta</Label>
                <DatePickerField
                  value={filterFechaFin}
                  onChange={handleFechaFinChange}
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

          {!loading && paginatedEspacios.length === 0 && (
            <div className="col-span-full rounded-lg border border-slate-200 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-800">
              <AlertCircle className="mx-auto mb-3 h-10 w-10 text-slate-400" />
              <p className="font-medium text-slate-700 dark:text-slate-200">
                {filterOcupacion === 'todos'
                  ? 'No hay espacios que coincidan con los filtros seleccionados.'
                  : 'No hay espacios que cumplan el filtro de ocupación seleccionado.'}
              </p>
              {periodoSeleccionado && (
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Los horarios y préstamos se están consultando únicamente para el periodo {periodoSeleccionado.nombre}.
                </p>
              )}
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
                    <div className="min-w-[1000px] grid grid-cols-[60px_repeat(7,1fr)] gap-1" style={{ gridAutoRows: '32px' }}>
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
                          // Slots de 15 minutos (4 slots por hora) para precisión en horarios
                          const duracionSlots = draggedHorario ? Math.round((draggedHorario.horaFin - draggedHorario.horaInicio) * 4) : 0;
                          const dropStartIdx = dragOverCell ? horaToSlotIndex(dragOverCell.hora) : -1;
                          const isDragOver = dragOverCell?.dia === dia &&
                            draggedHorario &&
                            horaIdx >= dropStartIdx &&
                            horaIdx < dropStartIdx + duracionSlots;
                          const conflictoDrop = draggedHorario
                            ? getConflictoEnRango(
                                espacio.id,
                                dia,
                                hora,
                                hora + (draggedHorario.horaFin - draggedHorario.horaInicio),
                                draggedHorario
                              )
                            : null;
                          
                          // Verificar si hay un horario arrastrado que puede soltarse aquí
                          // Para horarios, no bloquear por fecha pasada (son recurrentes)
                          const canDrop =
                            !!draggedHorario &&
                            editModeEnabled &&
                            draggedHorario.espacioId === espacio.id &&
                            !celdaBloqueada &&
                            !conflictoDrop;
                          
                          // Handlers inline sin useCallback (usar useCallback dentro de loop causa error de hooks)
                          const handleMouseDown = () => {
                            if (!celdaBloqueada && !ocupado && puedeCrearSolicitudes && !editModeEnabled) {
                              iniciarSeleccion(espacio.id, dia, hora);
                            }
                          };
                          
                          const handleMouseEnter = () => {
                            if (!celdaBloqueada && !ocupado && puedeCrearSolicitudes && !editModeEnabled) {
                              actualizarSeleccion(espacio.id, dia, hora);
                            }
                          };
                          
                          const handleMouseUp = () => {
                            if (puedeCrearSolicitudes && !editModeEnabled) {
                              finalizarSeleccion();
                            }
                          };
                          
                          const handleDragOver = (e: React.DragEvent) => {
                            if (canDrop) {
                              e.preventDefault();
                              setDragOverCell({ dia, hora });
                            } else if (dragOverCell?.dia === dia && dragOverCell?.hora === hora) {
                              setDragOverCell(null);
                            }
                          };
                          
                          const handleDragLeave = () => {
                            if (dragOverCell?.dia === dia && dragOverCell?.hora === hora) {
                              setDragOverCell(null);
                            }
                          };
                          
                          const handleDrop = (e: React.DragEvent) => {
                            e.preventDefault();
                            setDragOverCell(null);
                            if (draggedHorario && draggedHorario.espacioId === espacio.id) {
                              const duracion = draggedHorario.horaFin - draggedHorario.horaInicio;
                              const nuevaHoraInicio = hora;
                              const nuevaHoraFin = nuevaHoraInicio + duracion;
                              
                              if (nuevaHoraFin <= 23) {
                                const validacion = validarMovimiento(
                                  draggedHorario,
                                  espacio.id,
                                  dia,
                                  nuevaHoraInicio,
                                  nuevaHoraFin
                                );

                                if (!validacion.valido) {
                                  toast.error(validacion.error || 'No se puede mover el horario');
                                  return;
                                }

                                setIsProcessingMove(false);
                                setPendingMove({
                                  horario: draggedHorario,
                                  targetDia: dia,
                                  targetHoraInicio: nuevaHoraInicio
                                });
                                setConfirmMoveDialogOpen(true);
                              } else {
                                toast.error('No se puede mover el horario: las clases solo se permiten hasta las 23:00');
                              }
                            }
                          };

                          // Simplificado: solo verificar si es hora exacta para marcar visualmente
                          // La selección ahora es por bloques de 1 hora pero visualmente simple
                          const esHoraExactaSeleccion = estaSeleccionada && hora % 1 === 0;

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
                                      ? esHoraExactaSeleccion
                                        ? 'bg-purple-500 border-purple-700 cursor-grabbing'
                                        : 'bg-purple-400 border-purple-600 cursor-grabbing'
                                      : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/20'
                                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                              }`}
                              style={{
                                gridColumn: diaIdx + 2,
                                gridRow: horaIdx + 2,
                                zIndex: isDragOver && canDrop ? 20 : 1
                              }}
                              onMouseDown={handleMouseDown}
                              onMouseEnter={handleMouseEnter}
                              onMouseUp={handleMouseUp}
                              onDragOver={handleDragOver}
                              onDragLeave={handleDragLeave}
                              onDrop={handleDrop}
                            />
                          );
                        })
                      )}

                      {/* Horarios ocupados */}
                      {horarios
                        .filter(h => h.espacioId === espacio.id && encabezadosDiasCronograma.some(d => d.dia === h.dia))
                        .map((ocupacion, idx) => {
                          const colStart = getDayColumnIndex(ocupacion.dia);
                          // Calcular fila usando slots de 15 minutos (precisión para horarios)
                          const slotStart = Math.round((ocupacion.horaInicio - 6) * 4);
                          const slotEnd = Math.round((ocupacion.horaFin - 6) * 4);
                          const rowStart = slotStart + 2;
                          const rowSpan = Math.max(1, slotEnd - slotStart);

                          // Validar rango: tenemos 68 slots (17 horas * 4) + 1 header = 69 filas
                          if (rowStart < 2 || rowStart > 70) return null;

                          // Determinar si es un préstamo o un horario académico
                          const isPrestamo = ocupacion.tipo === 'prestamo';
                          const isPrestamoPendiente = isPrestamo && ocupacion.prestamo?.estado === 'Pendiente';
                          const isPrestamoAprobado = isPrestamo && ocupacion.prestamo?.estado === 'Aprobado';
                          const isHorarioPendiente = !isPrestamo && ocupacion.estado === 'pendiente';
                          const prestamoMotivo = isPrestamo
                            ? ocupacion.prestamo?.motivo || ocupacion.grupo || ocupacion.materia || 'Préstamo'
                            : '';
                          
                          let colorClass = '';
                          let labelText = '';
                          
                          if (isPrestamoPendiente) {
                            colorClass = 'bg-gradient-to-br from-yellow-300 to-yellow-400 hover:from-yellow-400 hover:to-yellow-500 text-slate-900';
                            labelText = 'PENDIENTE';
                          } else if (isPrestamoAprobado) {
                            colorClass = 'bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white';
                            labelText = '';
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
                                    {isPrestamoPendiente && labelText && (
                                      <p className="text-[8px] sm:text-[9px] font-bold mb-0.5 bg-white/30 px-1 py-0.5 rounded shrink-0">{labelText}</p>
                                    )}
                                    <p className="font-semibold text-[9px] sm:text-[10px] md:text-[11px] leading-tight break-words w-full line-clamp-2">
                                      {isPrestamo ? prestamoMotivo : ocupacion.materia}
                                    </p>
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
      <NuevaSolicitudDialog user={user} dialogSolicitudOpen={dialogSolicitudOpen} setDialogSolicitudOpen={setDialogSolicitudOpen} nuevaSolicitudData={nuevaSolicitudData} filteredEspacios={filteredEspacios} horarios={horarios} getConflictoEnRango={getConflictoEnRango} periodoSeleccionado={periodoSeleccionado} puedeEditarDisponibilidad={puedeEditarDisponibilidad} describirConflicto={describirConflicto} />

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
      <MoverClaseDialog moverClase={moverClase} filteredEspacios={filteredEspacios} diasSemana={diasSemana} horas={horas} getOcupacionPorHora={getOcupacionPorHora} getConflictoEnRango={getConflictoEnRango} describirConflicto={describirConflicto} />

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
