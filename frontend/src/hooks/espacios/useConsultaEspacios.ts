import { useCallback, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useConsultaEspaciosFiltros } from './useConsultaEspaciosFiltros';
import { useConsultaEspaciosDatos } from './useConsultaEspaciosDatos';
import { useConsultaEspaciosPaginacion } from './useConsultaEspaciosPaginacion';
import { useConsultaEspaciosSeleccion } from './useConsultaEspaciosSeleccion';
import { useConsultaEspaciosExport } from './useConsultaEspaciosExport';
import type { EspacioView } from './types';

export type {
  EspacioView,
  OcupacionView,
  SeleccionRango,
  NuevaSolicitudData,
  MensajeFiltroFecha,
  EncabezadoDiaCronograma
} from './types';

export function useConsultaEspacios() {
  const [vistaActual, setVistaActual] = useState<'tarjetas' | 'cronograma'>('tarjetas');
  const [espacioSeleccionado, setEspacioSeleccionado] = useState<EspacioView | null>(null);
  const { user } = useAuth();

  const puedeCrearSolicitudes = !!user;

  const filtros = useConsultaEspaciosFiltros();

  const datos = useConsultaEspaciosDatos({
    user: user
      ? {
          id: user.id,
          rol: String(user.rol),
          facultad: user.facultad ? { id: user.facultad.id ?? null } : null
        }
      : undefined,
    filterFechaInicio: filtros.filterFechaInicio
  });

  const filteredEspacios = useMemo(() => {
    return datos.espacios.filter((e) => {
      const matchesSearch =
        e.nombre.toLowerCase().includes(filtros.searchTerm.toLowerCase()) ||
        (e.edificio && e.edificio.toLowerCase().includes(filtros.searchTerm.toLowerCase()));
      const matchesTipo = filtros.filterTipo === 'todos' || e.tipo === filtros.filterTipo;
      const matchesApertura = 
        filtros.filterApertura === 'todas' || 
        (filtros.filterApertura === 'abierto' && e.estaAbierto) ||
        (filtros.filterApertura === 'cerrado' && !e.estaAbierto);
      const matchesSede = filtros.filterSede === 'todas' || e.sede === filtros.filterSede;
      return matchesSearch && matchesTipo && matchesApertura && matchesSede;
    });
  }, [
    datos.espacios,
    filtros.filterApertura,
    filtros.filterSede,
    filtros.filterTipo,
    filtros.searchTerm
  ]);

  const paginacion = useConsultaEspaciosPaginacion(filteredEspacios);

  const seleccion = useConsultaEspaciosSeleccion({
    puedeCrearSolicitudes,
    espacios: datos.espacios,
    filterFechaInicio: filtros.filterFechaInicio,
    getOcupacionPorHora: datos.getOcupacionPorHora
  });

  const exportacion = useConsultaEspaciosExport({
    filteredEspacios,
    getOcupacionPorHora: datos.getOcupacionPorHora
  });

  const verCronogramaIndividual = useCallback((espacio: EspacioView) => {
    setEspacioSeleccionado(espacio);
    setVistaActual('cronograma');
  }, []);

  const volverALista = useCallback(() => {
    setEspacioSeleccionado(null);
    setVistaActual('tarjetas');
  }, []);

  return {
    searchTerm: filtros.searchTerm,
    setSearchTerm: filtros.setSearchTerm,
    filterTipo: filtros.filterTipo,
    setFilterTipo: filtros.setFilterTipo,
    filterApertura: filtros.filterApertura,
    setFilterApertura: filtros.setFilterApertura,
    filterSede: filtros.filterSede,
    setFilterSede: filtros.setFilterSede,
    filterFechaInicio: filtros.filterFechaInicio,
    filterFechaFin: filtros.filterFechaFin,
    mensajeFiltroFecha: filtros.mensajeFiltroFecha,
    handleFechaInicioChange: filtros.handleFechaInicioChange,
    handleFechaFinChange: filtros.handleFechaFinChange,
    vistaActual,
    setVistaActual,
    tiposEspacio: datos.tiposEspacio,
    sedes: datos.sedes,
    diasSemana: filtros.diasSemana,
    encabezadosDiasCronograma: filtros.encabezadosDiasCronograma,
    horas: filtros.horas,
    isDiaBloqueado: filtros.isDiaBloqueado,
    isCeldaBloqueada: filtros.isCeldaBloqueada,
    filteredEspacios,
    paginatedEspacios: paginacion.paginatedEspacios,
    totalFilteredEspacios: paginacion.totalFilteredEspacios,
    currentPage: paginacion.currentPage,
    totalPages: paginacion.totalPages,
    pageNumbers: paginacion.pageNumbers,
    pageSize: paginacion.pageSize,
    goToPage: paginacion.goToPage,
    goToNextPage: paginacion.goToNextPage,
    goToPrevPage: paginacion.goToPrevPage,
    hasPrevPageWindow: paginacion.hasPrevPageWindow,
    hasNextPageWindow: paginacion.hasNextPageWindow,
    goToPrevPageWindow: paginacion.goToPrevPageWindow,
    goToNextPageWindow: paginacion.goToNextPageWindow,
    estadisticas: datos.estadisticas,
    getOcupacionPorHora: datos.getOcupacionPorHora,
    loading: datos.loading,
    horarios: datos.horariosConPrestamos,
    prestamos: datos.prestamos,
    exportarCronogramaPDF: exportacion.exportarCronogramaPDF,
    exportarCronogramaExcel: exportacion.exportarCronogramaExcel,
    isDragging: seleccion.isDragging,
    seleccionRango: seleccion.seleccionRango,
    iniciarSeleccion: seleccion.iniciarSeleccion,
    actualizarSeleccion: seleccion.actualizarSeleccion,
    finalizarSeleccion: seleccion.finalizarSeleccion,
    cancelarSeleccion: seleccion.cancelarSeleccion,
    puedeCrearSolicitudes,
    dialogSolicitudOpen: seleccion.dialogSolicitudOpen,
    setDialogSolicitudOpen: seleccion.setDialogSolicitudOpen,
    nuevaSolicitudData: seleccion.nuevaSolicitudData,
    setNuevaSolicitudData: seleccion.setNuevaSolicitudData,
    espacioSeleccionado,
    verCronogramaIndividual,
    volverALista,
    limpiarFiltros: filtros.limpiarFiltros,
    recargarDatos: datos.recargarDatos
  };
}
