import { apiClient } from '../../core/apiClient';
import { ENDPOINTS } from '../../core/endpoints';

export interface ReporteOcupacion {
  periodo: {
    fecha_inicio: string;
    fecha_fin: string;
  };
  espacios: Array<{
    espacio_id: number;
    espacio_tipo: string;
    total_horas_disponibles: number;
    total_horas_ocupadas: number;
    porcentaje_ocupacion: number;
    horarios_count: number;
    prestamos_count: number;
  }>;
}

export const reportesService = {
  async getOcupacionEspacios(params: {
    fecha_inicio: string;
    fecha_fin: string;
    sede_id?: number;
  }): Promise<ReporteOcupacion> {
    let url = ENDPOINTS.REPORTES.OCUPACION_ESPACIOS;
    const queryParams = new URLSearchParams();
    queryParams.append('fecha_inicio', params.fecha_inicio);
    queryParams.append('fecha_fin', params.fecha_fin);
    if (params.sede_id) queryParams.append('sede_id', params.sede_id.toString());
    
    url += `?${queryParams.toString()}`;
    
    const response = await apiClient.get<{ reporte: ReporteOcupacion }>(url);
    return response.reporte;
  },
};
