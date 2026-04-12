import { useCallback, useEffect, useState } from 'react';
import { periodoService } from '../../services/periodos/periodoAPI';
import { horarioService } from '../../services/horarios/horariosAPI';
import type { PeriodoAcademico } from '../../services/periodos/periodoAPI';
import type { HorarioExtendido } from '../../services/horarios/horariosAPI';
import type { OcupacionView } from './types';

function normalizarDia(dia: string): string {
  const diaLower = dia.toLowerCase().trim();
  const mapeo: Record<string, string> = {
    lunes: 'Lunes',
    monday: 'Lunes',
    martes: 'Martes',
    tuesday: 'Martes',
    'miércoles': 'Miércoles',
    wednesday: 'Miércoles',
    jueves: 'Jueves',
    thursday: 'Jueves',
    viernes: 'Viernes',
    friday: 'Viernes',
    'sábado': 'Sábado',
    saturday: 'Sábado',
    domingo: 'Domingo',
    sunday: 'Domingo'
  };
  return mapeo[diaLower] || dia;
}

function mapearHorariosAOcupacion(horarios: HorarioExtendido[]): OcupacionView[] {
  return horarios.map((h) => ({
    id: h.id,
    espacioId: h.espacio_id.toString(),
    dia: normalizarDia(h.dia_semana),
    horaInicio: parseInt(h.hora_inicio.split(':')[0], 10),
    horaFin: parseInt(h.hora_fin.split(':')[0], 10),
    materia: h.asignatura_nombre,
    docente: h.docente_nombre,
    grupo: h.grupo_nombre,
    estado: 'ocupado',
    tipo: 'horario'
  }));
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

  const cargarHorariosPorPeriodo = useCallback(async (periodoId: number, estado?: string) => {
    setHorariosLoading(true);
    setErrorBusquedaPeriodo(null);
    try {
      const result = await horarioService.horariosPorPeriodo(periodoId, estado as any);
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

        const periodo = result.periodos[0];

        await cargarHorariosPorPeriodo(periodo.id || 0, 'aprobado');

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
