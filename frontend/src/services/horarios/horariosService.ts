import { apiClient } from '../../core/apiClient';
import { ENDPOINTS } from '../../core/endpoints';
import type {
  Horario,
  CreateHorarioDto,
  UpdateHorarioDto,
  HorariosResponse,
  HorarioResponse,
} from '../../models/horario';

export const horariosService = {
  async getAll(): Promise<Horario[]> {
    const response = await apiClient.get<{ horarios: any[] }>(ENDPOINTS.HORARIOS.LIST);
    return response.horarios;
  },

  async getById(id: number): Promise<Horario> {
    return await apiClient.get<Horario>(ENDPOINTS.HORARIOS.GET(id));
  },

  async getByProfesor(profesorId: number): Promise<Horario[]> {
    // Usar endpoint específico del backend
    const response = await apiClient.get<{ horarios: any[] }>(ENDPOINTS.HORARIOS.BY_DOCENTE(profesorId));
    return response.horarios || [];
  },

  async getByEstudiante(estudianteId: number): Promise<Horario[]> {
    // Usar endpoint específico del backend
    const response = await apiClient.get<{ horarios: any[] }>(ENDPOINTS.HORARIOS.BY_ESTUDIANTE(estudianteId));
    return response.horarios || [];
  },

  async getByGrupo(grupoId: number): Promise<Horario[]> {
    const response = await apiClient.get<{ horarios: any[] }>(ENDPOINTS.HORARIOS.BY_GRUPO(grupoId));
    return response.horarios || [];
  },

  async getByEspacio(espacioId: number): Promise<Horario[]> {
    const response = await apiClient.get<{ horarios: any[] }>(ENDPOINTS.HORARIOS.BY_ESPACIO(espacioId));
    return response.horarios || [];
  },

  async create(data: CreateHorarioDto): Promise<Horario> {
    const response = await apiClient.post<{ message: string; id: number }>(ENDPOINTS.HORARIOS.CREATE, data);
    return await this.getById(response.id);
  },

  async update(data: UpdateHorarioDto): Promise<Horario> {
    const response = await apiClient.put<{ message: string; id: number }>(ENDPOINTS.HORARIOS.UPDATE, data);
    return await this.getById(response.id);
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(ENDPOINTS.HORARIOS.DELETE, { id });
  },
};
