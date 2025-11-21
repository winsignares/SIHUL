import { apiClient } from '../../core/apiClient.ts';
import { ENDPOINTS } from '../../core/endpoints.ts';
import type {
  Periodo,
  CreatePeriodoDto,
  UpdatePeriodoDto,
} from '../../models/periodo';

export const periodosService = {
  async getAll(): Promise<Periodo[]> {
    const response = await apiClient.get<{ periodos: any[] }>(ENDPOINTS.PERIODOS.LIST);
    return response.periodos || [];
  },

  async getById(id: number): Promise<Periodo> {
    return await apiClient.get<Periodo>(ENDPOINTS.PERIODOS.GET(id));
  },

  async create(data: CreatePeriodoDto): Promise<Periodo> {
    const response = await apiClient.post<{ message: string; id: number }>(ENDPOINTS.PERIODOS.CREATE, data);
    return await this.getById(response.id);
  },

  async update(data: UpdatePeriodoDto): Promise<Periodo> {
    const response = await apiClient.put<{ message: string; id: number }>(ENDPOINTS.PERIODOS.UPDATE, data);
    return await this.getById(response.id);
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(ENDPOINTS.PERIODOS.DELETE, { id });
  },
};
