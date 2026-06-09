import { useCallback, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useConsultaEspaciosFiltros } from './useConsultaEspaciosFiltros';
import { useConsultaEspaciosDatos } from './useConsultaEspaciosDatos';
import { useConsultaEspaciosPaginacion } from './useConsultaEspaciosPaginacion';
import { useConsultaEspaciosSeleccion } from './useConsultaEspaciosSeleccion';
import { useConsultaEspaciosExport } from './useConsultaEspaciosExport';
import { useConsultaEspaciosPeriodos } from './useConsultaEspaciosPeriodos';
import type { EspacioView, OcupacionView } from './types';

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
  const periodos = useConsultaEspaciosPeriodos();

  // Memoizar el objeto user para evitar recreación en cada render
  const userParams = useMemo(() => {
    return user
      ? {
          id: user.id,
          rol: typeof user.rol === 'string' ? user.rol : String(user.rol?.nombre ?? ''),
          facultad: user.facultad ? { id: user.facultad.id ?? null } : null
        }
      : undefined;
  }, [user]);

  const datos = useConsultaEspaciosDatos({
    user: userParams,
    filterFechaInicio: filtros.filterFechaInicio
  });

  const horariosMostrados = useMemo(() => {
    const rangoCompletoSeleccionado = Boolean(filtros.filterFechaInicio && filtros.filterFechaFin);
    const baseHorarios = rangoCompletoSeleccionado ? periodos.horariosPeriodo : datos.horarios;
    const prestamosComoOcupacion = datos.horariosConPrestamos.filter((h) => h.tipo === 'prestamo');
    return [...baseHorarios, ...prestamosComoOcupacion];
  }, [
    datos.horarios,
    datos.horariosConPrestamos,
    filtros.filterFechaFin,
    filtros.filterFechaInicio,
    periodos.horariosPeriodo
  ]);

  const getOcupacionPorHora = useCallback(
    (espacioId: string, dia: string, hora: number) => {
      const matches = horariosMostrados.filter(
        (h) => h.espacioId === espacioId && h.dia === dia && hora >= h.horaInicio && hora < h.horaFin
      );
      return matches.find((h) => h.tipo === 'prestamo') ?? matches[0];
    },
    [horariosMostrados]
  );

  const esMismaOcupacion = useCallback((ocupacionActual: OcupacionView, ocupacionObjetivo: OcupacionView) => {
    if (ocupacionActual === ocupacionObjetivo) return true;

    if (
      ocupacionActual.tipo === 'horario' &&
      ocupacionObjetivo.tipo === 'horario' &&
      ocupacionActual.id &&
      ocupacionObjetivo.id
    ) {
      return (
        ocupacionActual.id === ocupacionObjetivo.id &&
        ocupacionActual.espacioId === ocupacionObjetivo.espacioId &&
        ocupacionActual.dia === ocupacionObjetivo.dia &&
        ocupacionActual.horaInicio === ocupacionObjetivo.horaInicio &&
        ocupacionActual.horaFin === ocupacionObjetivo.horaFin
      );
    }

    if (
      ocupacionActual.tipo === 'prestamo' &&
      ocupacionObjetivo.tipo === 'prestamo' &&
      ocupacionActual.id &&
      ocupacionObjetivo.id
    ) {
      return (
        ocupacionActual.id === ocupacionObjetivo.id &&
        ocupacionActual.espacioId === ocupacionObjetivo.espacioId &&
        ocupacionActual.dia === ocupacionObjetivo.dia &&
        ocupacionActual.prestamo?.fecha === ocupacionObjetivo.prestamo?.fecha &&
        ocupacionActual.horaInicio === ocupacionObjetivo.horaInicio &&
        ocupacionActual.horaFin === ocupacionObjetivo.horaFin
      );
    }

    return (
      ocupacionActual.espacioId === ocupacionObjetivo.espacioId &&
      ocupacionActual.dia === ocupacionObjetivo.dia &&
      ocupacionActual.horaInicio === ocupacionObjetivo.horaInicio &&
      ocupacionActual.horaFin === ocupacionObjetivo.horaFin &&
      ocupacionActual.materia === ocupacionObjetivo.materia &&
      ocupacionActual.tipo === ocupacionObjetivo.tipo &&
      ocupacionActual.prestamo?.fecha === ocupacionObjetivo.prestamo?.fecha
    );
  }, []);

  const getConflictoEnRango = useCallback(
    (
      espacioId: string,
      dia: string,
      horaInicio: number,
      horaFin: number,
      ocupacionIgnorada?: typeof horariosMostrados[number] | null
    ) => {
      if (horaInicio >= horaFin) return null;

      // Combinar todos los horarios disponibles (base + periodo + prestamos)
      const todosLosHorarios = [
        ...datos.horarios,
        ...horariosMostrados.filter(h => !datos.horarios.some(dh => dh.id === h.id && dh.espacioId === h.espacioId && dh.dia === h.dia && dh.horaInicio === h.horaInicio))
      ];

      let ocupacionIgnoradaConsumida = false;
      const matches = todosLosHorarios.filter((h) => {
        if (h.espacioId !== espacioId || h.dia !== dia) return false;
        if (
          ocupacionIgnorada &&
          !ocupacionIgnoradaConsumida &&
          esMismaOcupacion(h, ocupacionIgnorada)
        ) {
          ocupacionIgnoradaConsumida = true;
          return false;
        }
        return horaInicio < h.horaFin && horaFin > h.horaInicio;
      });

      return matches.find((h) => h.tipo === 'prestamo') ?? matches[0] ?? null;
    },
    [esMismaOcupacion, horariosMostrados, datos.horarios]
  );

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

      // Filtrar por ocupación (horarios/préstamos) - USAR HORARIOS DEL PERIODO SELECCIONADO
      // Si hay un período específico seleccionado, usar solo horarios de ese período
      // Si no, usar horariosMostrados (que incluye horarios base + préstamos)
      const horariosParaFiltro = filtros.filterPeriodo 
        ? periodos.horariosPeriodo 
        : horariosMostrados;
      
      const horariosEspacio = horariosParaFiltro.filter(h => h.espacioId === e.id);
      const tieneHorarios = horariosEspacio.some(h => h.tipo !== 'prestamo');
      const tienePrestamos = horariosEspacio.some(h => h.tipo === 'prestamo');

      let matchesOcupacion = true;
      switch (filtros.filterOcupacion) {
        case 'solo_horario':
          matchesOcupacion = tieneHorarios;
          break;
        case 'solo_prestamo':
          matchesOcupacion = tienePrestamos;
          break;
        case 'sin_horario_ni_prestamo':
          matchesOcupacion = !tieneHorarios && !tienePrestamos;
          break;
        case 'sin_horario':
          matchesOcupacion = !tieneHorarios;
          break;
        case 'sin_prestamo':
          matchesOcupacion = !tienePrestamos;
          break;
        default:
          matchesOcupacion = true; // 'todos'
      }

      return matchesSearch && matchesTipo && matchesApertura && matchesSede && matchesOcupacion;
    });
  }, [
    datos.espacios,
    filtros.filterApertura,
    filtros.filterSede,
    filtros.filterTipo,
    filtros.filterOcupacion,
    filtros.filterPeriodo,
    filtros.searchTerm,
    horariosMostrados,
    periodos.horariosPeriodo
  ]);

  const paginacion = useConsultaEspaciosPaginacion(filteredEspacios);

  // Combinar TODOS los horarios para detección de conflictos
  const todosLosHorarios = useMemo(() => {
    const horariosSet = new Map<string, OcupacionView>();
    
    // Agregar horarios del período
    periodos.horariosPeriodo.forEach(h => {
      const key = `${h.espacioId}-${h.dia}-${h.horaInicio}-${h.horaFin}`;
      horariosSet.set(key, h);
    });
    
    // Agregar horarios base
    datos.horarios.forEach(h => {
      const key = `${h.espacioId}-${h.dia}-${h.horaInicio}-${h.horaFin}`;
      if (!horariosSet.has(key)) {
        horariosSet.set(key, h);
      }
    });
    
    // Agregar préstamos
    datos.horariosConPrestamos.forEach(h => {
      const key = `${h.espacioId}-${h.dia}-${h.horaInicio}-${h.horaFin}-${h.tipo}`;
      if (!horariosSet.has(key)) {
        horariosSet.set(key, h);
      }
    });
    
    return Array.from(horariosSet.values());
  }, [datos.horarios, datos.horariosConPrestamos, periodos.horariosPeriodo]);

  const seleccion = useConsultaEspaciosSeleccion({
    puedeCrearSolicitudes,
    espacios: datos.espacios,
    filterFechaInicio: filtros.filterFechaInicio,
    getConflictoEnRango,
    horarios: todosLosHorarios
  });

  const exportacion = useConsultaEspaciosExport({
    filteredEspacios,
    getOcupacionPorHora
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
    filterPeriodo: filtros.filterPeriodo,
    setFilterPeriodo: filtros.setFilterPeriodo,
    filterFechaInicio: filtros.filterFechaInicio,
    filterFechaFin: filtros.filterFechaFin,
    filterOcupacion: filtros.filterOcupacion,
    setFilterOcupacion: filtros.setFilterOcupacion,
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
    horaToSlotIndex: filtros.horaToSlotIndex,
    isHoraExacta: filtros.isHoraExacta,
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
    getOcupacionPorHora,
    getConflictoEnRango,
    loading: datos.loading,
    horarios: horariosMostrados,
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
    recargarDatos: datos.recargarDatos,
    // Período académico
    periodos: periodos.periodos,
    periodosLoading: periodos.periodosLoading,
    horariosLoading: periodos.horariosLoading,
    errorBusquedaPeriodo: periodos.errorBusquedaPeriodo,
    buscarPeriodoPorRangoFechas: periodos.buscarPeriodoPorRangoFechas,
    cargarHorariosPorPeriodo: periodos.cargarHorariosPorPeriodo
  };
}
