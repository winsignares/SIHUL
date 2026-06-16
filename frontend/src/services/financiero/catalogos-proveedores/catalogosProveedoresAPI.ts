import { apiClient } from '../../../core/apiClient';
import type {
  BancoCatalogo,
  CiudadCatalogo,
  DepartamentoGeograficoCatalogo,
  PaginatedResponse,
  PaisCatalogo,
  TipoCuentaCatalogo,
} from '../../../models/financiero/core.models';
import { API_BASE, buildQueryString } from '../core/shared';

const toList = <T,>(response: PaginatedResponse<T> | T[]): T[] => {
  if (Array.isArray(response)) return response;
  return response?.results || [];
};

export const catalogosProveedoresService = {
  getPaises: async (): Promise<PaisCatalogo[]> => {
    const response = await apiClient.get<PaginatedResponse<PaisCatalogo> | PaisCatalogo[]>(`${API_BASE}/paises/`);
    return toList(response);
  },

  getDepartamentos: async (params?: { pais_id?: number; ciudad_id?: number }): Promise<DepartamentoGeograficoCatalogo[]> => {
    const query = buildQueryString(params);
    const response = await apiClient.get<PaginatedResponse<DepartamentoGeograficoCatalogo> | DepartamentoGeograficoCatalogo[]>(
      `${API_BASE}/departamentos-geograficos/${query ? `?${query}` : ''}`
    );
    return toList(response);
  },

  getCiudades: async (params?: { pais_id?: number; departamento_id?: number }): Promise<CiudadCatalogo[]> => {
    const query = buildQueryString(params);
    const response = await apiClient.get<PaginatedResponse<CiudadCatalogo> | CiudadCatalogo[]>(
      `${API_BASE}/ciudades/${query ? `?${query}` : ''}`
    );
    return toList(response);
  },

  getBancos: async (): Promise<BancoCatalogo[]> => {
    const response = await apiClient.get<PaginatedResponse<BancoCatalogo> | BancoCatalogo[]>(`${API_BASE}/bancos/`);
    return toList(response);
  },

  getTiposCuenta: async (): Promise<TipoCuentaCatalogo[]> => {
    const response = await apiClient.get<PaginatedResponse<TipoCuentaCatalogo> | TipoCuentaCatalogo[]>(`${API_BASE}/tipos-cuenta/`);
    return toList(response);
  },
};
