import { apiClient } from '../../../core/apiClient';
import type { CreateFacturaDTO, Factura, PaginatedResponse } from '../../../models/financiero/core.models';
import { API_BASE, buildQueryString } from '../core/shared';

export const facturasService = {
  getAll: async (params?: Record<string, unknown>): Promise<PaginatedResponse<Factura>> => {
    const query = buildQueryString(params);
    const endpoint = `${API_BASE}/facturas/${query ? `?${query}` : ''}`;
    return apiClient.get<PaginatedResponse<Factura>>(endpoint);
  },

  getById: async (id: number): Promise<Factura> => {
    return apiClient.get<Factura>(`${API_BASE}/facturas/${id}/`);
  },

  create: async (data: CreateFacturaDTO): Promise<Factura> => {
    return apiClient.post<Factura>(`${API_BASE}/facturas/`, data);
  },

  update: async (id: number, data: Partial<Factura>): Promise<Factura> => {
    return apiClient.patch<Factura>(`${API_BASE}/facturas/${id}/`, data);
  },

  radicar: async (id: number, observaciones?: string): Promise<Factura> => {
    const body = observaciones ? { observaciones } : undefined;
    return apiClient.post<Factura>(`${API_BASE}/facturas/${id}/radicar/`, body);
  },

  causar: async (
    id: number,
    opts?: { cuenta_contable_id?: number; centro_costo_id?: number; observaciones?: string }
  ): Promise<Factura> => {
    return apiClient.post<Factura>(`${API_BASE}/facturas/${id}/causar/`, opts || {});
  },

  getByEstado: async (estado: string): Promise<Factura[]> => {
    const response = await apiClient.get<PaginatedResponse<Factura> | Factura[]>(
      `${API_BASE}/facturas/?estado=${encodeURIComponent(estado)}`
    );
    if (Array.isArray(response)) return response;
    return response?.results || [];
  },

  alistar: async (id: number): Promise<Factura> => {
    return apiClient.post<Factura>(`${API_BASE}/facturas/${id}/alistar/`);
  },

  rechazar: async (id: number, motivo: string): Promise<Factura> => {
    return apiClient.post<Factura>(`${API_BASE}/facturas/${id}/rechazar/`, { motivo });
  },

  getPendientes: async (): Promise<Factura[]> => {
    const response = await apiClient.get<PaginatedResponse<Factura> | Factura[]>(`${API_BASE}/facturas/pendientes/`);
    if (Array.isArray(response)) return response;
    return response?.results || [];
  },

  getEstadisticas: async (): Promise<Record<string, unknown>> => {
    return apiClient.get<Record<string, unknown>>(`${API_BASE}/facturas/estadisticas/`);
  },

  getSeguimiento: async (id: number): Promise<Record<string, unknown>> => {
    return apiClient.get<Record<string, unknown>>(`${API_BASE}/facturas/${id}/seguimiento/`);
  },

  getNumeroSugerido: async (): Promise<string> => {
    const response = await apiClient.get<{ numero_factura?: string }>(`${API_BASE}/facturas/numero_sugerido/`);
    return response?.numero_factura || '';
  },

  completarRegistro: async (id: number, data: Partial<Factura>): Promise<Factura> => {
    return apiClient.patch<Factura>(`${API_BASE}/facturas/${id}/completar_registro/`, data);
  },
};
