import { apiClient } from '../../core/apiClient.ts';
import { ENDPOINTS } from '../../core/endpoints.ts';
import type {
  Programa,
  CreateProgramaDto,
  UpdateProgramaDto,
} from '../../models/programa';

export const programasService = {
  async getAll(): Promise<Programa[]> {
    const response = await apiClient.get<{ programas: any[] }>(ENDPOINTS.PROGRAMAS.LIST);
    return response.programas || [];
  },

  async getById(id: number): Promise<Programa> {
    return await apiClient.get<Programa>(ENDPOINTS.PROGRAMAS.GET(id));
  },

  async create(data: CreateProgramaDto): Promise<Programa> {
    const response = await apiClient.post<{ message: string; id: number }>(ENDPOINTS.PROGRAMAS.CREATE, data);
    return await this.getById(response.id);
  },

  async update(data: UpdateProgramaDto): Promise<Programa> {
    const response = await apiClient.put<{ message: string; id: number }>(ENDPOINTS.PROGRAMAS.UPDATE, data);
    return await this.getById(response.id);
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(ENDPOINTS.PROGRAMAS.DELETE, { id });
  },
};
