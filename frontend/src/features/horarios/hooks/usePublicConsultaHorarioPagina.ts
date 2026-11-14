import { useConsultaHorario } from './useConsultaHorario';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { useState, useEffect } from 'react';
import { PAGE_SIZE_DEFAULT } from '../../gestionAcademica/hooks/paginacion';

/** Estado de la página pública de consulta de horarios: filtros, paginación y diálogos. */
export function usePublicConsultaHorarioPagina() {
  const isMobile = useIsMobile();
  const [currentPageDocente, setCurrentPageDocente] = useState(1);
  const [currentPagePrograma, setCurrentPagePrograma] = useState(1);
  const pageSize = PAGE_SIZE_DEFAULT;

  const {
    periodoActual,
    tipoConsulta,
    setTipoConsulta,
    filtroDocente,
    setFiltroDocente,
    filtroPrograma,
    setFiltroPrograma,
    horariosDocente,
    horariosPrograma,
    docentes,
    programas,
    exportarPDF,
    exportarExcel,
    showHorarioModal,
    setShowHorarioModal,
    grupoSeleccionado,
    handleVerHorarioGrupo,
    obtenerHorariosGrupo,
    docenteSeleccionado,
    showHorarioDocenteModal,
    setShowHorarioDocenteModal,
    handleVerHorarioDocente,
    obtenerHorariosDocente
  } = useConsultaHorario();

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPageDocente(1);
  }, [filtroDocente]);

  useEffect(() => {
    setCurrentPagePrograma(1);
  }, [filtroPrograma]);

  useEffect(() => {
    setCurrentPageDocente(1);
    setCurrentPagePrograma(1);
  }, [tipoConsulta]);

  return {
    isMobile,
    currentPageDocente,
    setCurrentPageDocente,
    currentPagePrograma,
    setCurrentPagePrograma,
    pageSize,
    periodoActual,
    tipoConsulta,
    setTipoConsulta,
    filtroDocente,
    setFiltroDocente,
    filtroPrograma,
    setFiltroPrograma,
    horariosDocente,
    horariosPrograma,
    docentes,
    programas,
    exportarPDF,
    exportarExcel,
    showHorarioModal,
    setShowHorarioModal,
    grupoSeleccionado,
    handleVerHorarioGrupo,
    obtenerHorariosGrupo,
    docenteSeleccionado,
    showHorarioDocenteModal,
    setShowHorarioDocenteModal,
    handleVerHorarioDocente,
    obtenerHorariosDocente,
  };
}
