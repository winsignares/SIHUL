import { apiClient } from '../../../core/apiClient';
import type { ComentarioFactura, PaginatedResponse } from '../../../models/financiero/core.models';
import { API_BASE, buildQueryString } from '../core/shared';

export const comentariosService = {
  getByFactura: async (facturaId: number): Promise<ComentarioFactura[]> => {
    const query = buildQueryString({ factura_id: facturaId });
    const endpoint = `${API_BASE}/comentarios/${query ? `?${query}` : ''}`;
    const response = await apiClient.get<PaginatedResponse<ComentarioFactura> | ComentarioFactura[]>(endpoint);
    if (Array.isArray(response)) return response;
    return response.results || [];
  },

  create: async (facturaId: number, comentario: string, tipo: string): Promise<ComentarioFactura> => {
    return apiClient.post<ComentarioFactura>(`${API_BASE}/comentarios/`, {
      factura: facturaId,
      comentario,
      tipo,
    });
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete<void>(`${API_BASE}/comentarios/${id}/`);
  },
};
