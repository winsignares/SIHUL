import { apiClient } from '../../core/apiClient';
import { ENDPOINTS } from '../../core/endpoints';
import type {
  HorarioFusionado,
  CreateHorarioFusionadoDto,
  UpdateHorarioFusionadoDto,
} from '../../models/horarioFusionado';

export const horariosFusionadosService = {
  async getAll(): Promise<HorarioFusionado[]> {
    const response = await apiClient.get<{ horarios_fusionados: any[] }>(ENDPOINTS.HORARIOS_FUSIONADOS.LIST);
    return response.horarios_fusionados || [];
  },

  async getById(id: number): Promise<HorarioFusionado> {
    return await apiClient.get<HorarioFusionado>(ENDPOINTS.HORARIOS_FUSIONADOS.GET(id));
  },

  async create(data: CreateHorarioFusionadoDto): Promise<HorarioFusionado> {
    const response = await apiClient.post<{ message: string; id: number }>(ENDPOINTS.HORARIOS_FUSIONADOS.CREATE, data);
    return await this.getById(response.id);
  },

  async update(data: UpdateHorarioFusionadoDto): Promise<HorarioFusionado> {
    const response = await apiClient.put<{ message: string; id: number }>(ENDPOINTS.HORARIOS_FUSIONADOS.UPDATE, data);
    return await this.getById(response.id);
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(ENDPOINTS.HORARIOS_FUSIONADOS.DELETE, { id });
  },
};
