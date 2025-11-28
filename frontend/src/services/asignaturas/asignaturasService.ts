import { apiClient } from '../../core/apiClient.ts';
import { ENDPOINTS } from '../../core/endpoints.ts';
import type {
  Asignatura,
  CreateAsignaturaDto,
  UpdateAsignaturaDto,
} from '../../models/asignatura';

export const asignaturasService = {
  async getAll(): Promise<Asignatura[]> {
    const response = await apiClient.get<{ asignaturas: any[] }>(ENDPOINTS.ASIGNATURAS.LIST);
    return response.asignaturas || [];
  },

  async getById(id: number): Promise<Asignatura> {
    return await apiClient.get<Asignatura>(ENDPOINTS.ASIGNATURAS.GET(id));
  },

  async create(data: CreateAsignaturaDto): Promise<Asignatura> {
    const response = await apiClient.post<{ message: string; id: number }>(ENDPOINTS.ASIGNATURAS.CREATE, data);
    return await this.getById(response.id);
  },

  async update(data: UpdateAsignaturaDto): Promise<Asignatura> {
    const response = await apiClient.put<{ message: string; id: number }>(ENDPOINTS.ASIGNATURAS.UPDATE, data);
    return await this.getById(response.id);
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(ENDPOINTS.ASIGNATURAS.DELETE, { id });
  },
};
