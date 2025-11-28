import { apiClient } from '../../core/apiClient.ts';
import { ENDPOINTS } from '../../core/endpoints.ts';
import type {
  Recurso,
  CreateRecursoDto,
  UpdateRecursoDto,
  EspacioRecurso,
  CreateEspacioRecursoDto,
  UpdateEspacioRecursoDto,
} from '../../models/recurso';

export const recursosService = {
  async getAll(): Promise<Recurso[]> {
    const response = await apiClient.get<{ recursos: any[] }>(ENDPOINTS.RECURSOS.LIST);
    return response.recursos || [];
  },

  async getById(id: number): Promise<Recurso> {
    return await apiClient.get<Recurso>(ENDPOINTS.RECURSOS.GET(id));
  },

  async create(data: CreateRecursoDto): Promise<Recurso> {
    const response = await apiClient.post<{ message: string; id: number }>(ENDPOINTS.RECURSOS.CREATE, data);
    return await this.getById(response.id);
  },

  async update(data: UpdateRecursoDto): Promise<Recurso> {
    const response = await apiClient.put<{ message: string; id: number }>(ENDPOINTS.RECURSOS.UPDATE, data);
    return await this.getById(response.id);
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(ENDPOINTS.RECURSOS.DELETE, { id });
  },
};

export const espacioRecursoService = {
  async getAll(): Promise<EspacioRecurso[]> {
    const response = await apiClient.get<{ espacio_recursos: any[] }>(ENDPOINTS.ESPACIO_RECURSO.LIST);
    return response.espacio_recursos || [];
  },

  async create(data: CreateEspacioRecursoDto): Promise<EspacioRecurso> {
    return await apiClient.post<EspacioRecurso>(ENDPOINTS.ESPACIO_RECURSO.CREATE, data);
  },

  async update(data: UpdateEspacioRecursoDto): Promise<EspacioRecurso> {
    return await apiClient.put<EspacioRecurso>(ENDPOINTS.ESPACIO_RECURSO.UPDATE, data);
  },

  async delete(espacioId: number, recursoId: number): Promise<void> {
    await apiClient.delete(ENDPOINTS.ESPACIO_RECURSO.DELETE, { espacio_id: espacioId, recurso_id: recursoId });
  },
};
