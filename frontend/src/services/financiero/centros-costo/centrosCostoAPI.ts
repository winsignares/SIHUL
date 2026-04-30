import { apiClient } from '../../../core/apiClient';
import type { CentroCosto, PaginatedResponse } from '../../../models/financiero/core.models';
import { API_BASE, buildQueryString } from '../core/shared';

export const centrosCostoService = {
  getAll: async (params?: Record<string, unknown>): Promise<PaginatedResponse<CentroCosto>> => {
    const query = buildQueryString(params);
    const endpoint = `${API_BASE}/centros-costo/${query ? `?${query}` : ''}`;
    return apiClient.get<PaginatedResponse<CentroCosto>>(endpoint);
  },

  getById: async (id: number): Promise<CentroCosto> => {
    return apiClient.get<CentroCosto>(`${API_BASE}/centros-costo/${id}/`);
  },
};
