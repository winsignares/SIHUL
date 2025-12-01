import { apiClient } from '../../core/apiClient';
import type { CapacidadUtilizada } from '../../models/index';

export interface CapacidadResponse {
  semana_inicio: string;
  semana_fin: string;
  capacidad: CapacidadUtilizada[];
}

class CapacidadService {
  /**
   * Obtiene la capacidad utilizada por tipo de espacio
   * @param semanaOffset - Offset de semanas (0 = semana actual, 1 = próxima, -1 = pasada)
   */
  async getCapacidad(semanaOffset: number = 0): Promise<CapacidadResponse> {
    try {
      const params = new URLSearchParams();
      params.append('semana_offset', semanaOffset.toString());

      const response = await apiClient.get(`/espacios/reporte/capacidad/?${params.toString()}`);
      return response as CapacidadResponse;
    } catch (error) {
      console.error('Error fetching capacidad:', error);
      throw error;
    }
  }
}

export const capacidadService = new CapacidadService();
