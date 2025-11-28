import { apiClient } from '../../core/apiClient';
import { ENDPOINTS } from '../../core/endpoints';
import type {
  Facultad,
  CreateFacultadDto,
  UpdateFacultadDto,
  FacultadesResponse,
  FacultadResponse,
} from '../../models/facultad';

export const facultadesService = {
  async getAll(): Promise<Facultad[]> {
    const response = await apiClient.get<{ facultades: any[] }>(ENDPOINTS.FACULTADES.LIST);
    return response.facultades;
  },

  async getById(id: number): Promise<Facultad> {
    return await apiClient.get<Facultad>(ENDPOINTS.FACULTADES.GET(id));
  },

  async create(data: CreateFacultadDto): Promise<Facultad> {
    const response = await apiClient.post<{ message: string; id: number }>(ENDPOINTS.FACULTADES.CREATE, data);
    return await this.getById(response.id);
  },

  async update(data: UpdateFacultadDto): Promise<Facultad> {
    const response = await apiClient.put<{ message: string; id: number }>(ENDPOINTS.FACULTADES.UPDATE, data);
    return await this.getById(response.id);
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(ENDPOINTS.FACULTADES.DELETE, { id });
  },
};
