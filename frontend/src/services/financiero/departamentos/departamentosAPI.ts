import { apiClient } from '../../../core/apiClient';
import type { Departamento, PaginatedResponse } from '../../../models/financiero/core.models';
import { API_BASE, buildQueryString } from '../core/shared';

export const departamentosService = {
  getAll: async (params?: Record<string, unknown>): Promise<PaginatedResponse<Departamento>> => {
    const query = buildQueryString(params);
    const endpoint = `${API_BASE}/departamentos/${query ? `?${query}` : ''}`;
    return apiClient.get<PaginatedResponse<Departamento>>(endpoint);
  },

  getById: async (id: number): Promise<Departamento> => {
    return apiClient.get<Departamento>(`${API_BASE}/departamentos/${id}/`);
  },

  getAreasSolicitantes: async (): Promise<Departamento[]> => {
    const response = await apiClient.get<PaginatedResponse<Departamento> | Departamento[]>(`${API_BASE}/departamentos/areas_solicitantes/`);
    if (Array.isArray(response)) return response;
    return response?.results || [];
  },
};
