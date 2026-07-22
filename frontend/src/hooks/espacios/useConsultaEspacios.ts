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
  const { user, areas } = useAuth();

  const puedeCrearSolicitudes = !!user;

  const filtros = useConsultaEspaciosFiltros();
  const periodos = useConsultaEspaciosPeriodos();

  // Memoizar el objeto user para evitar recreación en cada render
  const userParams = useMemo(() => {
    return user
      ? {
          id: user.id,
          rol: typeof user.rol === 'string' ? user.rol : String(user.rol?.nombre ?? ''),
          supervisa_espacios: (typeof user.rol === 'object' ? Boolean(user.rol?.supervisa_espacios) : false) || Boolean(areas?.length),
          facultad: user.facultad ? { id: user.facultad.id ?? null } : null
        }
      : undefined;
  }, [areas?.length, user]);

  const datos = useConsultaEspaciosDatos({
    user: userParams,
    filterFechaInicio: filtros.filterFechaInicio
  });

  const periodoSeleccionado = useMemo(
    () => periodos.periodos.find((periodo) => periodo.id === filtros.filterPeriodo) ?? null,
    [filtros.filterPeriodo, periodos.periodos]
  );

  const prestamosMostrados = useMemo(() => {
    return datos.horariosConPrestamos.filter((ocupacion) => {
      if (ocupacion.tipo !== 'prestamo') return false;
      if (!periodoSeleccionado) return true;

      const fechaPrestamo = ocupacion.prestamo?.fecha;
      return Boolean(
        fechaPrestamo &&
        fechaPrestamo >= periodoSeleccionado.fecha_inicio &&
        fechaPrestamo <= periodoSeleccionado.fecha_fin
      );
    });
  }, [datos.horariosConPrestamos, periodoSeleccionado]);

  const horariosMostrados = useMemo(() => {
    const horariosAcademicos = filtros.filterPeriodo
      ? periodos.horariosPeriodo
      : datos.horarios;

    return [...horariosAcademicos, ...prestamosMostrados];
  }, [
    datos.horarios,
    filtros.filterPeriodo,
    periodos.horariosPeriodo,
    prestamosMostrados
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

      let ocupacionIgnoradaConsumida = false;
      const matches = horariosMostrados.filter((h) => {
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
    [esMismaOcupacion, horariosMostrados]
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

      const horariosEspacio = horariosMostrados.filter(h => h.espacioId === e.id);
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

      return (
        matchesSearch &&
        matchesTipo &&
        matchesApertura &&
        matchesSede &&
        matchesOcupacion
      );
    });
  }, [
    datos.espacios,
    filtros.filterApertura,
    filtros.filterSede,
    filtros.filterTipo,
    filtros.filterOcupacion,
    filtros.searchTerm,
    horariosMostrados
  ]);

  const paginacion = useConsultaEspaciosPaginacion(filteredEspacios);

  // Mantener la detección de conflictos dentro del periodo y rango activos.
  const todosLosHorarios = useMemo(() => {
    const horariosSet = new Map<string, OcupacionView>();

    horariosMostrados.forEach(h => {
      const key = `${h.espacioId}-${h.dia}-${h.horaInicio}-${h.horaFin}-${h.tipo}`;
      horariosSet.set(key, h);
    });

    return Array.from(horariosSet.values());
  }, [horariosMostrados]);

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
    aplicarRangoPeriodo: filtros.aplicarRangoPeriodo,
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
