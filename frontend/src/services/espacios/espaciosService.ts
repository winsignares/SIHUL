import { apiClient } from '../../core/apiClient';
import { ENDPOINTS } from '../../core/endpoints';
import type {
  Espacio,
  CreateEspacioDto,
  UpdateEspacioDto,
  EspaciosResponse,
  EspacioResponse,
} from '../../models/espacio';

export const espaciosService = {
  async getAll(): Promise<Espacio[]> {
    const response = await apiClient.get<{ espacios: any[] }>(ENDPOINTS.ESPACIOS.LIST);
    return response.espacios;
  },

  async getById(id: number): Promise<Espacio> {
    return await apiClient.get<Espacio>(ENDPOINTS.ESPACIOS.GET(id));
  },

  async create(data: CreateEspacioDto): Promise<Espacio> {
    const response = await apiClient.post<{ message: string; id: number }>(ENDPOINTS.ESPACIOS.CREATE, data);
    return await this.getById(response.id);
  },

  async update(data: UpdateEspacioDto): Promise<Espacio> {
    const response = await apiClient.put<{ message: string; id: number }>(ENDPOINTS.ESPACIOS.UPDATE, data);
    return await this.getById(response.id);
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(ENDPOINTS.ESPACIOS.DELETE, { id });
  },
};
