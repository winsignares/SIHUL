import { apiClient } from '../../core/apiClient.ts';
import { ENDPOINTS } from '../../core/endpoints.ts';
import type {
  Grupo,
  CreateGrupoDto,
  UpdateGrupoDto,
} from '../../models/grupo';

export const gruposService = {
  async getAll(): Promise<Grupo[]> {
    const response = await apiClient.get<{ grupos: any[] }>(ENDPOINTS.GRUPOS.LIST);
    return response.grupos || [];
  },

  async getById(id: number): Promise<Grupo> {
    return await apiClient.get<Grupo>(ENDPOINTS.GRUPOS.GET(id));
  },

  async create(data: CreateGrupoDto): Promise<Grupo> {
    const response = await apiClient.post<{ message: string; id: number }>(ENDPOINTS.GRUPOS.CREATE, data);
    return await this.getById(response.id);
  },

  async update(data: UpdateGrupoDto): Promise<Grupo> {
    const response = await apiClient.put<{ message: string; id: number }>(ENDPOINTS.GRUPOS.UPDATE, data);
    return await this.getById(response.id);
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(ENDPOINTS.GRUPOS.DELETE, { id });
  },
};
