import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  asignacionEspaciosService,
  type HorarioAsignacion,
  type EspacioDisponible,
  type HorarioSinEspacioFilters,
} from '../../services/horarios/asignacionEspaciosService';
import { programaService, type Programa } from '../../services/programas/programaAPI';
import { grupoService, type Grupo } from '../../services/grupos/gruposAPI';
import { asignaturaService, type Asignatura } from '../../services/asignaturas/asignaturaAPI';
import { periodoService, type PeriodoAcademico } from '../../services/periodos/periodoAPI';
import { useAuth } from '../../context/AuthContext';

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const getSeccionalIdFromUser = (user: ReturnType<typeof useAuth>['user']) => {
  if (!user || !user.sede) return null;
  if (typeof user.sede === 'object' && 'seccional_id' in user.sede) {
    const seccionalId = user.sede.seccional_id;
    return typeof seccionalId === 'number' ? seccionalId : null;
  }
  return null;
};

const resolveCurrentPeriodoId = (periodos: PeriodoAcademico[]): number | null => {
  const now = new Date();

  for (const periodo of periodos) {
    if (!periodo.id) continue;

    const fechaInicio = new Date(`${periodo.fecha_inicio}T00:00:00`);
    const fechaFin = new Date(`${periodo.fecha_fin}T23:59:59`);

    if (!Number.isNaN(fechaInicio.getTime()) && !Number.isNaN(fechaFin.getTime()) && now >= fechaInicio && now <= fechaFin) {
      return periodo.id;
    }
  }

  const periodoActivo = periodos.find((periodo) => Boolean(periodo.activo && periodo.id));
  return periodoActivo?.id ?? null;
};

export function useAsignacionEspaciosSeccional() {
  const { user } = useAuth();
  const [horarios, setHorarios] = useState<HorarioAsignacion[]>([]);
  const [espaciosDisponibles, setEspaciosDisponibles] = useState<EspacioDisponible[]>([]);
  const [horarioSeleccionado, setHorarioSeleccionado] = useState<HorarioAsignacion | null>(null);
  const [espacioSeleccionado, setEspacioSeleccionado] = useState<EspacioDisponible | null>(null);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [loadingEspacios, setLoadingEspacios] = useState(false);
  const [loadingAsignacion, setLoadingAsignacion] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [programas, setProgramas] = useState<Programa[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [periodos, setPeriodos] = useState<PeriodoAcademico[]>([]);

  const [filtros, setFiltrosState] = useState<HorarioSinEspacioFilters>(() => ({
    seccionalId: getSeccionalIdFromUser(user),
    programaId: null,
    grupoId: null,
    docenteId: null,
    asignaturaId: null,
    periodoId: null,
    diaSemana: null,
    soloSinEspacio: true,
  }));

  const setFiltros = useCallback((next: Partial<HorarioSinEspacioFilters>) => {
    setFiltrosState((prev) => ({ ...prev, ...next }));
  }, []);

  useEffect(() => {
    const userSeccionalId = getSeccionalIdFromUser(user);
    if (userSeccionalId !== null && filtros.seccionalId !== userSeccionalId) {
      setFiltrosState((prev) => ({ ...prev, seccionalId: userSeccionalId }));
    }
  }, [user, filtros.seccionalId]);

  const gruposFiltrados = useMemo(() => {
    if (!filtros.programaId) return grupos;
    return grupos.filter((g) => g.programa_id === filtros.programaId);
  }, [grupos, filtros.programaId]);

  const cargarFiltros = useCallback(async () => {
    try {
      const [programasRes, gruposRes, asignaturasRes, periodosRes] = await Promise.all([
        programaService.listarProgramas(),
        grupoService.list(),
        asignaturaService.list(),
        periodoService.listarPeriodos(),
      ]);

      setProgramas(programasRes.programas ?? []);
      setGrupos(gruposRes.grupos ?? []);
      setAsignaturas(asignaturasRes.asignaturas ?? []);

      const periodosCatalogo = periodosRes.periodos ?? [];
      setPeriodos(periodosCatalogo);

      setFiltrosState((prev) => {
        if (prev.periodoId) return prev;
        const periodoActualId = resolveCurrentPeriodoId(periodosCatalogo);
        if (!periodoActualId) return prev;
        return { ...prev, periodoId: periodoActualId };
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar los filtros';
      setError(message);
    }
  }, []);

  const recargarHorarios = useCallback(async () => {
    setLoadingHorarios(true);
    setError(null);

    try {
      const response = await asignacionEspaciosService.getHorariosSinEspacio({
        ...filtros,
      });
      setHorarios(response.horarios ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar horarios';
      setError(message);
    } finally {
      setLoadingHorarios(false);
    }
  }, [filtros]);

  const seleccionarHorario = useCallback((horario: HorarioAsignacion) => {
    setHorarioSeleccionado(horario);
    setEspaciosDisponibles([]);
    setEspacioSeleccionado(null);
    setError(null);
    setSuccessMessage(null);
  }, []);

  const consultarEspaciosDisponibles = useCallback(async (horario?: HorarioAsignacion) => {
    const horarioObjetivo = horario ?? horarioSeleccionado;

    if (!horarioObjetivo) {
      setError('Selecciona un horario antes de buscar espacios disponibles.');
      return;
    }

    setLoadingEspacios(true);
    setError(null);

    try {
      const response = await asignacionEspaciosService.getEspaciosDisponiblesPorHorario({
        seccionalId: horarioObjetivo.seccional_id ?? filtros.seccionalId ?? null,
        dia: horarioObjetivo.dia_semana,
        horaInicio: horarioObjetivo.hora_inicio,
        horaFin: horarioObjetivo.hora_fin,
        horarioId: horarioObjetivo.id,
      });
      setEspaciosDisponibles(response.espacios ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al consultar espacios disponibles';
      setError(message);
    } finally {
      setLoadingEspacios(false);
    }
  }, [horarioSeleccionado, filtros.seccionalId]);

  const asignarEspacio = useCallback(async () => {
    if (!horarioSeleccionado || !espacioSeleccionado) {
      setError('Debes seleccionar un horario y un espacio para asignar.');
      return;
    }

    setLoadingAsignacion(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await asignacionEspaciosService.asignarEspacioHorario({
        horarioId: horarioSeleccionado.id,
        espacioId: espacioSeleccionado.id,
      });
      setSuccessMessage('Espacio asignado correctamente.');
      await recargarHorarios();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al asignar el espacio';
      setError(message);
    } finally {
      setLoadingAsignacion(false);
    }
  }, [horarioSeleccionado, espacioSeleccionado, recargarHorarios]);

  const limpiarSeleccion = useCallback(() => {
    setHorarioSeleccionado(null);
    setEspacioSeleccionado(null);
    setEspaciosDisponibles([]);
    setError(null);
    setSuccessMessage(null);
  }, []);

  useEffect(() => {
    cargarFiltros();
  }, [cargarFiltros]);

  useEffect(() => {
    recargarHorarios();
  }, [recargarHorarios]);

  return {
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
    grupos: gruposFiltrados,
    asignaturas,
    periodos,
    diasSemana: DIAS_SEMANA,
  };
}
