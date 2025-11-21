import { apiClient } from '../../core/apiClient';
import { ENDPOINTS } from '../../core/endpoints';

export interface DashboardEstadisticas {
  total_usuarios: number;
  total_espacios: number;
  total_horarios: number;
  total_prestamos: number;
  prestamos_pendientes: number;
  prestamos_hoy: number;
  espacios_disponibles: number;
  ocupacion_promedio: number;
}

export const dashboardService = {
  async getEstadisticas(): Promise<DashboardEstadisticas> {
    return await apiClient.get<DashboardEstadisticas>(ENDPOINTS.DASHBOARD.ESTADISTICAS);
  },
};
