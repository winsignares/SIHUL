import { apiClient } from '../../../core/apiClient';
import type { HistorialFactura, PaginatedResponse } from '../../../models/financiero/core.models';
import { API_BASE, buildQueryString } from '../core/shared';

export const historialService = {
  getAll: async (params?: Record<string, unknown>): Promise<HistorialFactura[]> => {
    const query = buildQueryString(params);
    const endpoint = `${API_BASE}/historial/${query ? `?${query}` : ''}`;
    const response = await apiClient.get<PaginatedResponse<HistorialFactura> | HistorialFactura[]>(endpoint);
    if (Array.isArray(response)) return response;
    return response.results || [];
  },

  getByFactura: async (facturaId: number): Promise<HistorialFactura[]> => {
    const query = buildQueryString({ factura_id: facturaId });
    const endpoint = `${API_BASE}/historial/${query ? `?${query}` : ''}`;
    const response = await apiClient.get<PaginatedResponse<HistorialFactura> | HistorialFactura[]>(endpoint);
    if (Array.isArray(response)) return response;
    return response.results || [];
  },
};
