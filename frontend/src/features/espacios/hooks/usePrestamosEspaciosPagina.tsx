import { Badge } from '../../../components/ui/badge';
import { Clock, Check, X } from 'lucide-react';
import { usePrestamosEspacios } from './usePrestamosEspacios';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { useAuth } from '../../../context/AuthContext';
import { useState, useEffect } from 'react';
import { periodoService, type PeriodoAcademico } from '../../gestionAcademica/services/periodos/periodoAPI';
import { maxIntervaloPermitido, maxOcurrenciasEnPeriodo, diasPorOcurrencia, diasRestantesEnPeriodo, mesesRestantesEnPeriodo, type CustomPeriod } from '../../../utils/recurrenceLimits';

/** Estado y acciones de la página de préstamos de espacios. */
export function usePrestamosEspaciosPagina() {
  const isMobile = useIsMobile();
  const { user, hasEditPermission } = useAuth();
  const puedeGestionarPrestamos = hasEditPermission('Préstamos de Espacios');
  const [periodoEdicion, setPeriodoEdicion] = useState<PeriodoAcademico | null>(null);
  const [vista, setVista] = useState<'lista' | 'cuadricula'>('lista');
  const [detalleGridId, setDetalleGridId] = useState<string | null>(null);
  const {
    searchTerm,
    setSearchTerm,
    filterEstado,
    setFilterEstado,
    filterFechaHora,
    setFilterFechaHora,
    filterFechaEspecifica,
    setFilterFechaEspecifica,
    filterPeriodo,
    setFilterPeriodo,
    periodos,
    verSolicitudDialog,
    setVerSolicitudDialog,
    comentariosAccion,
    setComentariosAccion,
    modoEdicion,
    prestamoEditando,
    setPrestamoEditando,
    espaciosDisponibles,
    tiposActividad,
    recursosDisponibles,
    paginatedPrestamos,
    filteredPrestamos,
    totalFilteredPrestamos,
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
    statsData,
    aprobarSolicitud,
    rechazarSolicitud,
    iniciarEdicion,
    cancelarEdicion,
    guardarEdicion,
    eliminarSolicitud,
    loading
  } = usePrestamosEspacios();

  const fechaEnEdicion = prestamoEditando?.fecha;
  useEffect(() => {
    if (!fechaEnEdicion) {
      setPeriodoEdicion(null);
      return;
    }
    let cancelado = false;
    periodoService.periodoPorRangoFechas(fechaEnEdicion, fechaEnEdicion)
      .then((response) => {
        if (!cancelado) setPeriodoEdicion(response.periodos?.[0] ?? null);
      })
      .catch(() => {
        if (!cancelado) setPeriodoEdicion(null);
      });
    return () => { cancelado = true; };
  }, [fechaEnEdicion]);

  const frecuenciaAMaxIntervalo = (frecuencia: string | undefined): number | null => {
    if (!fechaEnEdicion || !periodoEdicion) return null;
    const customPeriod: CustomPeriod =
      frecuencia === 'daily' || frecuencia === 'weekdays' ? 'day'
        : frecuencia === 'weekly' ? 'week'
        : 'month';
    return maxIntervaloPermitido(customPeriod, fechaEnEdicion, periodoEdicion);
  };

  const frecuenciaCabeEnPeriodo = (frecuencia: string): boolean => {
    if (!fechaEnEdicion || !periodoEdicion) return true;
    if (frecuencia === 'none') return true;
    if (frecuencia === 'daily' || frecuencia === 'weekdays') return diasRestantesEnPeriodo(fechaEnEdicion, periodoEdicion) >= 1;
    if (frecuencia === 'weekly') return diasRestantesEnPeriodo(fechaEnEdicion, periodoEdicion) >= 7;
    if (frecuencia === 'monthly') return mesesRestantesEnPeriodo(fechaEnEdicion, periodoEdicion) >= 1;
    return true;
  };

  const frecuenciaAMaxOcurrencias = (frecuencia: string | undefined, intervalo: number): number | null => {
    if (!fechaEnEdicion || !periodoEdicion) return null;
    const dias = frecuencia === 'daily' || frecuencia === 'weekdays' ? diasPorOcurrencia('daily', intervalo)
      : frecuencia === 'weekly' ? diasPorOcurrencia('weekly', intervalo)
      : diasPorOcurrencia('monthly', intervalo);
    return maxOcurrenciasEnPeriodo(dias, fechaEnEdicion, periodoEdicion);
  };

  const FRECUENCIA_LABELS: Record<string, string> = {
    none: 'No se repite',
    daily: 'Diario',
    weekly: 'Semanal',
    monthly: 'Mensual',
    yearly: 'Anual',
    weekdays: 'Días laborales'
  };

  const FIN_LABELS: Record<string, string> = {
    never: 'Nunca',
    until_date: 'Hasta una fecha',
    count: 'Después de N repeticiones'
  };

  const DIAS_LABELS: Record<number, string> = {
    0: 'Lunes',
    1: 'Martes',
    2: 'Miércoles',
    3: 'Jueves',
    4: 'Viernes',
    5: 'Sábado',
    6: 'Domingo'
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recurrenceSummary = (prestamo: any) => {
    if (!prestamo?.es_recurrente) return 'No se repite';
    const freq = FRECUENCIA_LABELS[prestamo.frecuencia || 'none']?.toLowerCase() || 'semanal';
    const interval = prestamo.intervalo || 1;
    const cada = `Cada ${interval} ${freq}`;
    const dias = prestamo.frecuencia === 'weekly' && Array.isArray(prestamo.dias_semana) && prestamo.dias_semana.length > 0
      ? ` (${prestamo.dias_semana.map((d: number) => DIAS_LABELS[d]).join(', ')})`
      : '';
    let fin = FIN_LABELS[prestamo.fin_repeticion_tipo || 'never'] || 'Nunca';
    if (prestamo.fin_repeticion_tipo === 'until_date' && prestamo.fin_repeticion_fecha) {
      fin = `Hasta ${new Date(prestamo.fin_repeticion_fecha + 'T00:00:00').toLocaleDateString('es-CO')}`;
    }
    if (prestamo.fin_repeticion_tipo === 'count' && prestamo.fin_repeticion_ocurrencias) {
      fin = `${prestamo.fin_repeticion_ocurrencias} repeticiones`;
    }
    return `${cada}${dias}. ${fin}.`;
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>;
      case 'aprobado':
        return <Badge className="bg-green-100 text-green-800 border-green-300"><Check className="w-3 h-3 mr-1" />Aprobado</Badge>;
      case 'rechazado':
        return <Badge className="bg-red-100 text-red-800 border-red-300"><X className="w-3 h-3 mr-1" />Rechazado</Badge>;
      default:
        return null;
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'aprobado':
        return <Check className="w-5 h-5 text-green-600" />;
      case 'rechazado':
        return <X className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  return {
    isMobile,
    user,
    hasEditPermission,
    puedeGestionarPrestamos,
    periodoEdicion,
    setPeriodoEdicion,
    vista,
    setVista,
    detalleGridId,
    setDetalleGridId,
    searchTerm,
    setSearchTerm,
    filterEstado,
    setFilterEstado,
    filterFechaHora,
    setFilterFechaHora,
    filterFechaEspecifica,
    setFilterFechaEspecifica,
    filterPeriodo,
    setFilterPeriodo,
    periodos,
    verSolicitudDialog,
    setVerSolicitudDialog,
    comentariosAccion,
    setComentariosAccion,
    modoEdicion,
    prestamoEditando,
    setPrestamoEditando,
    espaciosDisponibles,
    tiposActividad,
    recursosDisponibles,
    paginatedPrestamos,
    filteredPrestamos,
    totalFilteredPrestamos,
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
    statsData,
    aprobarSolicitud,
    rechazarSolicitud,
    iniciarEdicion,
    cancelarEdicion,
    guardarEdicion,
    eliminarSolicitud,
    loading,
    fechaEnEdicion,
    frecuenciaAMaxIntervalo,
    frecuenciaCabeEnPeriodo,
    frecuenciaAMaxOcurrencias,
    FRECUENCIA_LABELS,
    FIN_LABELS,
    DIAS_LABELS,
    recurrenceSummary,
    getEstadoBadge,
    getEstadoIcon,
  };
}
