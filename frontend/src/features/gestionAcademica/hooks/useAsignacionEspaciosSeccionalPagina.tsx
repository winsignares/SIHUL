import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAsignacionEspaciosSeccional } from '../../horarios/hooks/useAsignacionEspaciosSeccional';
import type { HorarioAsignacion } from '../../horarios/services/asignacionEspaciosService';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { Badge } from '../../../components/ui/badge';

/** Estado y acciones de la página de asignación de espacios por seccional. */
export function useAsignacionEspaciosSeccionalPagina() {
  const isMobile = useIsMobile();
  const [modalOpen, setModalOpen] = useState(false);
  
  // Pagination state for horarios table
  const [currentPageHorarios, setCurrentPageHorarios] = useState(1);
  const [itemsPerPageHorarios, setItemsPerPageHorarios] = useState(10);

  // Pagination state for espacios table
  const [currentPageEspacios, setCurrentPageEspacios] = useState(1);
  const [itemsPerPageEspacios, setItemsPerPageEspacios] = useState(8);

  // Filter state for espacios
  const [filtroEspacioId, setFiltroEspacioId] = useState<string>('all');

  const {
    horarios,
    espaciosDisponibles,
    filtros,
    horarioSeleccionado,
    espacioSeleccionado,
    loadingHorarios,
    loadingEspacios,
    loadingAsignacion,
    error,
    successMessage,
    setFiltros,
    seleccionarHorario,
    consultarEspaciosDisponibles,
    asignarEspacio,
    limpiarSeleccion,
    recargarHorarios,
    setEspacioSeleccionado,
    programas,
    grupos,
    asignaturas,
    periodos,
    diasSemana,
  } = useAsignacionEspaciosSeccional();

  // Force reload function
  const handleForceReload = useCallback(async () => {
    // Clear cache and reload
    localStorage.removeItem('sihul_cache_asignacion-espacios-seccional-horarios');
    localStorage.removeItem('sihul_cache_asignacion-espacios-seccional-filtros');
    await recargarHorarios();
  }, [recargarHorarios]);

  useEffect(() => {
    if (!successMessage) return;
    setModalOpen(false);
    limpiarSeleccion();
    setCurrentPageHorarios(1);
    setCurrentPageEspacios(1);
    setFiltroEspacioId('all');
  }, [successMessage, limpiarSeleccion]);

  useEffect(() => {
    setCurrentPageHorarios(1);
  }, [filtros]);

  const handleAbrirAsignacion = async (horario: HorarioAsignacion) => {
    seleccionarHorario(horario);
    setModalOpen(true);
    await consultarEspaciosDisponibles(horario);
  };

  const handleCerrarModal = () => {
    setModalOpen(false);
    setCurrentPageEspacios(1);
    setFiltroEspacioId('all');
    limpiarSeleccion();
  };

  const handleConfirmar = async () => {
    await asignarEspacio();
  };

  const resolveEstadoBadge = (estado?: string) => {
    if (!estado) return null;

    const normalized = estado.toLowerCase();
    if (normalized === 'aprobado') {
      return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 font-medium">Aprobado</Badge>;
    }

    if (normalized === 'pendiente') {
      return <Badge className="bg-slate-100 text-slate-700 border-slate-200 font-medium">Pendiente</Badge>;
    }

    if (normalized === 'rechazado') {
      return <Badge className="bg-red-100 text-red-700 border-red-200 font-medium">Rechazado</Badge>;
    }

    return <Badge variant="outline">{estado}</Badge>;
  };

  // Memoizar paginación para evitar recálculos
  const horariosPaginados = useMemo(() => {
    return horarios.slice(
      (currentPageHorarios - 1) * itemsPerPageHorarios,
      currentPageHorarios * itemsPerPageHorarios
    );
  }, [horarios, currentPageHorarios, itemsPerPageHorarios]);

  // Memoizar total de páginas
  const totalPagesHorarios = useMemo(() => {
    return Math.ceil(horarios.length / itemsPerPageHorarios);
  }, [horarios.length, itemsPerPageHorarios]);

  return {
    isMobile,
    modalOpen,
    setModalOpen,
    currentPageHorarios,
    setCurrentPageHorarios,
    itemsPerPageHorarios,
    setItemsPerPageHorarios,
    currentPageEspacios,
    setCurrentPageEspacios,
    itemsPerPageEspacios,
    setItemsPerPageEspacios,
    filtroEspacioId,
    setFiltroEspacioId,
    horarios,
    espaciosDisponibles,
    filtros,
    horarioSeleccionado,
    espacioSeleccionado,
    loadingHorarios,
    loadingEspacios,
    loadingAsignacion,
    error,
    successMessage,
    setFiltros,
    seleccionarHorario,
    consultarEspaciosDisponibles,
    asignarEspacio,
    limpiarSeleccion,
    recargarHorarios,
    setEspacioSeleccionado,
    programas,
    grupos,
    asignaturas,
    periodos,
    diasSemana,
    handleForceReload,
    handleAbrirAsignacion,
    handleCerrarModal,
    handleConfirmar,
    resolveEstadoBadge,
    horariosPaginados,
    totalPagesHorarios,
  };
}
