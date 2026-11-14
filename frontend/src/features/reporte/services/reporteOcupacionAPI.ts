import { apiClient } from '../../../core/apiClient';

export type EstadoHorarioReporte = 'aprobado' | 'pendiente' | 'todos';

export interface DatoOcupacionJornadaAPI {
  jornada: string;
  ocupacion: number;
  espacios: number;
  color?: string;
}

export interface EspacioMasUsadoAPI {
  espacio: string;
  usos: number;
  ocupacion: number;
}

export interface OcupacionReporteResponse {
  periodo: string;
  semana_inicio: string;
  semana_fin: string;
  ocupacion_por_jornada: DatoOcupacionJornadaAPI[];
  espacios_mas_usados: EspacioMasUsadoAPI[];
}

class ReporteOcupacionService {
  /**
   * Obtiene los datos de ocupación por jornada y espacios más usados
   * @param semanaOffset - Offset de semanas (0 = semana actual, 1 = próxima, -1 = pasada)
   */
  async getOcupacionReporte(semanaOffset: number = 0, estadoHorario: EstadoHorarioReporte = 'aprobado'): Promise<OcupacionReporteResponse> {
    try {
      const params = new URLSearchParams();
      params.append('semana_offset', semanaOffset.toString());
      params.append('estado_horario', estadoHorario);

      const response = await apiClient.get(`/espacios/reporte/ocupacion/?${params.toString()}`);
      return response as OcupacionReporteResponse;
    } catch (error) {
      console.error('Error fetching reporte ocupación:', error);
      throw error;
    }
  }

  /** PDF del reporte de ocupacion (semana actual por defecto). */
  async descargarPdf(estadoHorario: EstadoHorarioReporte = 'aprobado', semanaOffset: number = 0): Promise<Blob> {
    return apiClient.postBlob('/espacios/reporte/ocupacion/pdf/', {
      semana_offset: semanaOffset,
      estado_horario: estadoHorario
    });
  }
}

export const reporteOcupacionService = new ReporteOcupacionService();
