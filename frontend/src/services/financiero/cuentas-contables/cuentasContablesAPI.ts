import { apiClient } from '../../../core/apiClient';
import type { CuentaContable, PaginatedResponse } from '../../../models/financiero/core.models';
import { API_BASE, buildQueryString } from '../core/shared';

export const cuentasContablesService = {
  getAll: async (params?: Record<string, unknown>): Promise<PaginatedResponse<CuentaContable>> => {
    const query = buildQueryString(params);
    const endpoint = `${API_BASE}/cuentas-contables/${query ? `?${query}` : ''}`;
    return apiClient.get<PaginatedResponse<CuentaContable>>(endpoint);
  },

  getById: async (id: number): Promise<CuentaContable> => {
    return apiClient.get<CuentaContable>(`${API_BASE}/cuentas-contables/${id}/`);
  },
};
