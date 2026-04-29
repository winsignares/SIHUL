import { apiClient } from '../../../core/apiClient';
import type { Factura, PaginatedResponse, Proveedor } from '../../../models/financiero/core.models';
import { API_BASE, buildQueryString } from '../core/shared';

export const proveedoresService = {
  getAll: async (params?: Record<string, unknown>): Promise<PaginatedResponse<Proveedor>> => {
    const query = buildQueryString(params);
    const endpoint = `${API_BASE}/proveedores/${query ? `?${query}` : ''}`;
    return apiClient.get<PaginatedResponse<Proveedor>>(endpoint);
  },

  getById: async (id: number): Promise<Proveedor> => {
    return apiClient.get<Proveedor>(`${API_BASE}/proveedores/${id}/`);
  },

  create: async (data: Partial<Proveedor>): Promise<Proveedor> => {
    return apiClient.post<Proveedor>(`${API_BASE}/proveedores/`, data);
  },

  update: async (id: number, data: Partial<Proveedor>): Promise<Proveedor> => {
    return apiClient.patch<Proveedor>(`${API_BASE}/proveedores/${id}/`, data);
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete<void>(`${API_BASE}/proveedores/${id}/`);
  },

  getMiPerfil: async (nit?: string): Promise<Proveedor> => {
    const query = nit ? `?nit=${encodeURIComponent(nit)}` : '';
    return apiClient.get<Proveedor>(`${API_BASE}/proveedores/mi_perfil/${query}`);
  },

  getMisFacturas: async (proveedorId: number, params?: Record<string, unknown>): Promise<PaginatedResponse<Factura>> => {
    const query = buildQueryString({ proveedor: proveedorId, ...params });
    const endpoint = `${API_BASE}/facturas/${query ? `?${query}` : ''}`;
    return apiClient.get<PaginatedResponse<Factura>>(endpoint);
  },
};
