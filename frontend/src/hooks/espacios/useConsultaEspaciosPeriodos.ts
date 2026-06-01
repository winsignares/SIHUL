import { useCallback, useEffect, useState } from 'react';
import { periodoService } from '../../services/periodos/periodoAPI';
import { horarioService } from '../../services/horarios/horariosAPI';
import type { PeriodoAcademico } from '../../services/periodos/periodoAPI';
import type { HorarioExtendido } from '../../services/horarios/horariosAPI';
import type { OcupacionView } from './types';

type HorarioEstado = 'aprobado' | 'pendiente' | 'rechazado';

type PeriodoConMetricas = PeriodoAcademico & {
  horarios_registrados?: number;
  programas_activos?: number;
};

function horaANumero(hora: string): number {
  const partes = hora.split(':');
  const horas = parseInt(partes[0], 10);
  const minutos = parseInt(partes[1], 10) || 0;
  return horas + minutos / 60;
}

function normalizarDia(dia: string): string {
  const diaLower = dia.toLowerCase().trim();
  const mapeo: Record<string, string> = {
    lunes: 'Lunes',
    monday: 'Lunes',
    martes: 'Martes',
    tuesday: 'Martes',
    'miércoles': 'Miércoles',
    'miercoles': 'Miércoles',  // Backend envía sin tilde
    wednesday: 'Miércoles',
    jueves: 'Jueves',
    thursday: 'Jueves',
    viernes: 'Viernes',
    friday: 'Viernes',
    'sábado': 'Sábado',
    'sabado': 'Sábado',  // Backend envía sin tilde
    saturday: 'Sábado',
    domingo: 'Domingo',
    sunday: 'Domingo'
  };
  return mapeo[diaLower] || dia;
}

function mapearHorariosAOcupacion(horarios: HorarioExtendido[]): OcupacionView[] {
  return horarios
    .filter((h) => h.espacio_id != null)
    .map((h) => ({
      id: h.id,
      espacioId: String(h.espacio_id),
      dia: normalizarDia(h.dia_semana),
      horaInicio: horaANumero(h.hora_inicio),
      horaFin: horaANumero(h.hora_fin),
      materia: h.asignatura_nombre,
      docente: h.docente_nombre,
      grupo: h.grupo_nombre,
      estado: h.estado === 'pendiente' ? 'pendiente' : 'ocupado',
      tipo: 'horario'
    }));
}

function ordenarPeriodosPorRelevancia(periodos: PeriodoConMetricas[]): PeriodoConMetricas[] {
  return [...periodos].sort((a, b) => {
    const horariosA = Number(a.horarios_registrados ?? 0);
    const horariosB = Number(b.horarios_registrados ?? 0);
    if (horariosB !== horariosA) return horariosB - horariosA;

    const programasA = Number(a.programas_activos ?? 0);
    const programasB = Number(b.programas_activos ?? 0);
    if (programasB !== programasA) return programasB - programasA;

    const activoA = a.activo ? 1 : 0;
    const activoB = b.activo ? 1 : 0;
    if (activoB !== activoA) return activoB - activoA;

    const inicio = b.fecha_inicio.localeCompare(a.fecha_inicio);
    if (inicio !== 0) return inicio;

    const fin = b.fecha_fin.localeCompare(a.fecha_fin);
    if (fin !== 0) return fin;

    return Number(b.id ?? 0) - Number(a.id ?? 0);
  });
}

export function useConsultaEspaciosPeriodos() {
  const [periodos, setPeriodos] = useState<PeriodoAcademico[]>([]);
  const [horariosPeriodo, setHorariosPeriodo] = useState<OcupacionView[]>([]);
  const [periodosLoading, setPerodosLoading] = useState(false);
  const [horariosLoading, setHorariosLoading] = useState(false);
  const [errorBusquedaPeriodo, setErrorBusquedaPeriodo] = useState<string | null>(null);

  const cargarPeriodos = useCallback(async () => {
    setPerodosLoading(true);
    try {
      const result = await periodoService.listarPeriodos();
      setPeriodos(result.periodos);
    } catch (error) {
      console.error('Error cargando períodos:', error);
    } finally {
      setPerodosLoading(false);
    }
  }, []);

  const cargarHorariosPorPeriodo = useCallback(async (periodoId: number, estado?: HorarioEstado | HorarioEstado[]) => {
    setHorariosLoading(true);
    setErrorBusquedaPeriodo(null);
    try {
      const result = await horarioService.horariosPorPeriodo(periodoId, estado);
      const ocupacion = mapearHorariosAOcupacion(result.horarios);
      setHorariosPeriodo(ocupacion);
    } catch (error: any) {
      const status = error?.status;
      if (status !== 404) {
        console.error('Error cargando horarios del período:', error);
      }
      setHorariosPeriodo([]);
    } finally {
      setHorariosLoading(false);
    }
  }, []);

  const buscarPeriodoPorRangoFechas = useCallback(
    async (fechaInicio: string, fechaFin: string): Promise<PeriodoAcademico | null> => {
      setHorariosLoading(true);
      setErrorBusquedaPeriodo(null);
      try {
        const result = await periodoService.periodoPorRangoFechas(fechaInicio, fechaFin);

        if (!result.periodos || result.periodos.length === 0) {
          setErrorBusquedaPeriodo(
            `La fecha digitada no se encuentra dentro de un periodo existente en el sistema, digite otra.`
          );
          setHorariosPeriodo([]);
          return null;
        }

        const periodosOrdenados = ordenarPeriodosPorRelevancia(result.periodos as PeriodoConMetricas[]);
        const periodo = periodosOrdenados[0];

        if (!periodo?.id) {
          setErrorBusquedaPeriodo(
            `La fecha digitada no se encuentra dentro de un periodo existente en el sistema, digite otra.`
          );
          setHorariosPeriodo([]);
          return null;
        }

        await cargarHorariosPorPeriodo(periodo.id, ['aprobado', 'pendiente']);

        return periodo;
      } catch (error: any) {
        const status = error?.status;
        if (status !== 404) {
          console.error('Error buscando período por rango de fechas:', error);
        }
        setErrorBusquedaPeriodo(
          `La fecha digitada no se encuentra dentro de un periodo existente en el sistema, digite otra.`
        );
        setHorariosPeriodo([]);
        return null;
      } finally {
        setHorariosLoading(false);
      }
    },
    [cargarHorariosPorPeriodo]
  );

  useEffect(() => {
    cargarPeriodos();
  }, [cargarPeriodos]);

  return {
    periodos,
    horariosPeriodo,
    periodosLoading,
    horariosLoading,
    errorBusquedaPeriodo,
    cargarPeriodos,
    cargarHorariosPorPeriodo,
    buscarPeriodoPorRangoFechas
  };
}
