import { apiClient } from '../../core/apiClient.ts';
import { ENDPOINTS } from '../../core/endpoints.ts';
import type {
  Sede,
  CreateSedeDto,
  UpdateSedeDto,
} from '../../models/sede';

export const sedesService = {
  async getAll(): Promise<Sede[]> {
    const response = await apiClient.get<{ sedes: any[] }>(ENDPOINTS.SEDES.LIST);
    return response.sedes || [];
  },

  async getById(id: number): Promise<Sede> {
    return await apiClient.get<Sede>(ENDPOINTS.SEDES.GET(id));
  },

  async create(data: CreateSedeDto): Promise<Sede> {
    const response = await apiClient.post<{ message: string; id: number }>(ENDPOINTS.SEDES.CREATE, data);
    return await this.getById(response.id);
  },

  async update(data: UpdateSedeDto): Promise<Sede> {
    const response = await apiClient.put<{ message: string; id: number }>(ENDPOINTS.SEDES.UPDATE, data);
    return await this.getById(response.id);
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(ENDPOINTS.SEDES.DELETE, { id });
  },
};
