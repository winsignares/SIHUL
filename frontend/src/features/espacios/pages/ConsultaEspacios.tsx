import { Input } from '../../../components/ui/input';
import { DatePickerField } from '../../../components/ui/date-picker-field';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Badge } from '../../../components/ui/badge';
import { Label } from '../../../components/ui/label';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { 
  Search, 
  MapPin, 
  Grid3x3, 
  ArrowLeft, 
  Home, 
  RefreshCw, 
  FileDown, 
  FileSpreadsheet,
  AlertCircle,
  X,
} from 'lucide-react';
import { useConsultaEspacios } from '../hooks/useConsultaEspacios';
import { getRangoSemanaCompleta } from '../hooks/semanaUtils';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { useAuth } from '../../../context/AuthContext';
import { useState, useEffect, useCallback } from 'react';
import { prestamoService } from '../../prestamos/services/prestamoAPI';
import { horarioService } from '../../horarios/services/horariosAPI';
import { toast } from 'sonner';

import {
  formatFechaLocalYYYYMMDD,
  getHoyColombia,
  formatHoraDecimal,
  formatHoraApi,
} from '../hooks/consultaEspaciosComun';
import { NuevaSolicitudDialog } from '../components/consulta/NuevaSolicitudDialog';


import { useMoverClase } from '../hooks/useMoverClase';
import { MoverClaseDialog } from '../components/consulta/MoverClaseDialog';
import { VistaTarjetas } from '../components/consulta/VistaTarjetas';
import { VistaCronograma } from '../components/consulta/VistaCronograma';
import { ConfirmarMovimientoDialog } from '../components/consulta/ConfirmarMovimientoDialog';
import { ConfirmarEliminarHorarioDialog } from '../components/consulta/ConfirmarEliminarHorarioDialog';
export default function ConsultaEspacios() {
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

      <VistaTarjetas hook={hook} firstItemIndex={firstItemIndex} lastItemIndex={lastItemIndex} isMobile={isMobile} getAperturaBadge={getAperturaBadge} periodoSeleccionado={periodoSeleccionado} />
      <VistaCronograma hook={hook} dragOverCell={dragOverCell} setDragOverCell={setDragOverCell} draggedHorario={draggedHorario} setDraggedHorario={setDraggedHorario} editModeEnabled={editModeEnabled} setEditModeEnabled={setEditModeEnabled} espaciosToShow={espaciosToShow} estaEnRangoSeleccion={estaEnRangoSeleccion} getDayColumnIndex={getDayColumnIndex} puedeEditarDisponibilidad={puedeEditarDisponibilidad} setConfirmDeleteDialogOpen={setConfirmDeleteDialogOpen} setConfirmMoveDialogOpen={setConfirmMoveDialogOpen} setHorarioToDelete={setHorarioToDelete} setIsProcessingMove={setIsProcessingMove} setMoveClassDialogOpen={setMoveClassDialogOpen} setMoveClassError={setMoveClassError} setPendingMove={setPendingMove} setSelectedClassToMove={setSelectedClassToMove} setTargetEspacioId={setTargetEspacioId} validarMovimiento={validarMovimiento} />
      {/* Modal de Nueva Solicitud */}
      <NuevaSolicitudDialog user={user} dialogSolicitudOpen={dialogSolicitudOpen} setDialogSolicitudOpen={setDialogSolicitudOpen} nuevaSolicitudData={nuevaSolicitudData} filteredEspacios={filteredEspacios} horarios={horarios} getConflictoEnRango={getConflictoEnRango} periodoSeleccionado={periodoSeleccionado} puedeEditarDisponibilidad={puedeEditarDisponibilidad} describirConflicto={describirConflicto} />

      {/* Diálogo de Confirmación para Drag and Drop */}
      <ConfirmarMovimientoDialog confirmMoveDialogOpen={confirmMoveDialogOpen} ejecutarMovimiento={ejecutarMovimiento} isProcessingMove={isProcessingMove} pendingMove={pendingMove} setConfirmMoveDialogOpen={setConfirmMoveDialogOpen} setDraggedHorario={setDraggedHorario} setPendingMove={setPendingMove} />

      {/* Diálogo para Mover Clase a Otro Espacio */}
      <MoverClaseDialog moverClase={moverClase} filteredEspacios={filteredEspacios} diasSemana={diasSemana} horas={horas} getOcupacionPorHora={getOcupacionPorHora} getConflictoEnRango={getConflictoEnRango} describirConflicto={describirConflicto} />

      {/* Diálogo de Confirmación para Eliminar Horario */}
      <ConfirmarEliminarHorarioDialog confirmDeleteDialogOpen={confirmDeleteDialogOpen} eliminarHorario={eliminarHorario} horarioToDelete={horarioToDelete} isDeleting={isDeleting} setConfirmDeleteDialogOpen={setConfirmDeleteDialogOpen} setHorarioToDelete={setHorarioToDelete} />
    </div>
  );
}
