import { apiClient } from '../../core/apiClient';
import type { DisponibilidadEspacio } from '../../models/index';
import type { EstadoHorarioReporte } from './reporteOcupacionAPI';

export interface DisponibilidadResponse {
  semana_inicio: string;
  semana_fin: string;
  disponibilidad: DisponibilidadEspacio[];
  resumen: {
    total_disponible: number;
    total_ocupado: number;
    promedio_ocupacion: number;
  };
}

class DisponibilidadService {
  /**
   * Obtiene la disponibilidad general de espacios
   * @param semanaOffset - Offset de semanas (0 = semana actual, 1 = próxima, -1 = pasada)
   */
  async getDisponibilidad(semanaOffset: number = 0, estadoHorario: EstadoHorarioReporte = 'aprobado'): Promise<DisponibilidadResponse> {
    try {
      const params = new URLSearchParams();
      params.append('semana_offset', semanaOffset.toString());
      params.append('estado_horario', estadoHorario);

      const response = await apiClient.get(`/espacios/reporte/disponibilidad/?${params.toString()}`);
      return response as DisponibilidadResponse;
    } catch (error) {
      console.error('Error fetching disponibilidad:', error);
      throw error;
    }
  }
}

export const disponibilidadService = new DisponibilidadService();
