import { apiClient } from '../../../core/apiClient';
import type { PaginatedResponse, ParametroSLA } from '../../../models/financiero/core.models';
import { API_BASE, buildQueryString } from '../core/shared';

export interface AdminDashboardResumen {
  usuarios_activos: number;
  proveedores_activos?: number;
  total_facturas?: number;
  facturas_en_proceso: number;
  facturas_riesgo?: number;
  facturas_vencidas?: number;
  monto_total_tramite: number;
  tiempo_promedio_dias: number;
  pagos_aplicados_mes?: number;
}

export interface AdminDashboardEstado {
  estado: string;
  cantidad: number;
}

export interface AdminDashboardAlerta {
  id: number;
  numero_factura: string;
  estado: string;
  indicador_riesgo: string;
  dias_transcurridos: number;
  valor_total: number;
}

export interface AdminDashboardActividad {
  id: number;
  numero_factura?: string;
  usuario_nombre: string;
  accion: string;
  estado_nuevo?: string;
  fecha_accion: string;
}

export interface AdminDashboardResponse {
  resumen: AdminDashboardResumen;
  distribucion_estados: AdminDashboardEstado[];
  alertas: AdminDashboardAlerta[];
  actividades: AdminDashboardActividad[];
}

export interface ReporteGenerado {
  id: number;
  tipo_reporte: string;
  nombre_reporte: string;
  formato: 'PDF' | 'Excel' | 'CSV' | 'JSON';
  parametros_filtros?: Record<string, unknown>;
  cantidad_registros?: number;
  tamano_archivo_bytes?: number;
  fecha_generacion: string;
}

export interface ExportarReportePayload {
  tipo_reporte: string;
  formato: 'Excel' | 'PDF';
  filtros?: {
    fecha_inicio?: string;
    fecha_fin?: string;
    estado?: string;
    proveedor_id?: number;
  };
}

export const reportesFinancieroService = {
  getDashboardAdmin: async (): Promise<AdminDashboardResponse> => {
    return apiClient.get<AdminDashboardResponse>(`${API_BASE}/reportes/dashboard_admin/`);
  },

  exportar: async (payload: ExportarReportePayload): Promise<Blob> => {
    return apiClient.postBlob(`${API_BASE}/reportes/exportar/`, payload);
  },

  listarGenerados: async (params?: Record<string, unknown>): Promise<ReporteGenerado[]> => {
    const query = buildQueryString(params);
    const endpoint = `${API_BASE}/reportes/${query ? `?${query}` : ''}`;
    const response = await apiClient.get<PaginatedResponse<ReporteGenerado> | ReporteGenerado[]>(endpoint);
    if (Array.isArray(response)) return response;
    return response?.results || [];
  },
};

export const parametrosSlaAdminService = {
  listar: async (): Promise<ParametroSLA[]> => {
    const response = await apiClient.get<PaginatedResponse<ParametroSLA> | ParametroSLA[]>(`${API_BASE}/parametros-sla/`);
    if (Array.isArray(response)) return response;
    return response?.results || [];
  },

  actualizar: async (id: number, data: Partial<ParametroSLA>): Promise<ParametroSLA> => {
    return apiClient.patch<ParametroSLA>(`${API_BASE}/parametros-sla/${id}/`, data);
  },
};

export interface ParametroFinanciero {
  id: number;
  clave: string;
  valor: string;
  tipo_dato: 'string' | 'number' | 'boolean' | 'json';
  descripcion?: string;
  editable: boolean;
  categoria: 'general' | 'sla' | 'autorizacion' | 'email' | 'sistema' | 'reportes';
}

export const parametrosFinancieroService = {
  listar: async (categoria?: string): Promise<ParametroFinanciero[]> => {
    const query = buildQueryString(categoria ? { categoria } : {});
    const endpoint = `${API_BASE}/parametros-financiero/${query ? `?${query}` : ''}`;
    const response = await apiClient.get<PaginatedResponse<ParametroFinanciero> | ParametroFinanciero[]>(endpoint);
    if (Array.isArray(response)) return response;
    return response?.results || [];
  },

  actualizar: async (id: number, data: Partial<ParametroFinanciero>): Promise<ParametroFinanciero> => {
    return apiClient.patch<ParametroFinanciero>(`${API_BASE}/parametros-financiero/${id}/`, data);
  },
};
