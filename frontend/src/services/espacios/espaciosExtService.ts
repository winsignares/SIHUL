import { apiClient } from '../../core/apiClient';
import { ENDPOINTS } from '../../core/endpoints';

export interface DisponibilidadRequest {
  espacio_id: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
}

export interface Conflicto {
  tipo: 'horario' | 'prestamo';
  descripcion: string;
  hora_inicio: string;
  hora_fin: string;
}

export interface DisponibilidadResponse {
  disponible: boolean;
  conflictos: Conflicto[];
}

export interface OcupacionEspacio {
  espacio_id: number;
  espacio_tipo: string;
  espacio_ubicacion: string;
  capacidad: number;
  disponible: boolean;
  horarios: Array<{
    dia_semana: string;
    hora_inicio: string;
    hora_fin: string;
    tipo: 'horario' | 'prestamo';
    asignatura_nombre: string | null;
    grupo_nombre: string | null;
  }>;
  porcentaje_ocupacion: number;
}

export const espaciosExtService = {
  async validarDisponibilidad(data: DisponibilidadRequest): Promise<DisponibilidadResponse> {
    return await apiClient.post<DisponibilidadResponse>(ENDPOINTS.ESPACIOS.VALIDAR_DISPONIBILIDAD, data);
  },

  async getOcupacion(params?: {
    sede_id?: number;
    tipo?: string;
    fecha_inicio?: string;
    fecha_fin?: string;
  }): Promise<OcupacionEspacio[]> {
    let url = ENDPOINTS.ESPACIOS.OCUPACION;
    if (params) {
      const queryParams = new URLSearchParams();
      if (params.sede_id) queryParams.append('sede_id', params.sede_id.toString());
      if (params.tipo) queryParams.append('tipo', params.tipo);
      if (params.fecha_inicio) queryParams.append('fecha_inicio', params.fecha_inicio);
      if (params.fecha_fin) queryParams.append('fecha_fin', params.fecha_fin);
      
      const query = queryParams.toString();
      if (query) url += `?${query}`;
    }
    
    const response = await apiClient.get<{ ocupacion: OcupacionEspacio[] }>(url);
    return response.ocupacion || [];
  },

  async getRecursosByEspacio(espacioId: number) {
    const response = await apiClient.get<{ recursos: any[] }>(ENDPOINTS.ESPACIOS.RECURSOS(espacioId));
    return response.recursos || [];
  },
};
