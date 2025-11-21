import { apiClient } from '../../core/apiClient';
import { ENDPOINTS } from '../../core/endpoints';
import type {
  Rol,
  CreateRolDto,
  UpdateRolDto,
} from '../../models/rol';

export const rolesService = {
  async getAll(): Promise<Rol[]> {
    const response = await apiClient.get<{ roles: any[] }>(ENDPOINTS.ROLES.LIST);
    return response.roles || [];
  },

  async getById(id: number): Promise<Rol> {
    return await apiClient.get<Rol>(ENDPOINTS.ROLES.GET(id));
  },

  async create(data: CreateRolDto): Promise<Rol> {
    const response = await apiClient.post<{ message: string; id: number }>(ENDPOINTS.ROLES.CREATE, data);
    return await this.getById(response.id);
  },

  async update(data: UpdateRolDto): Promise<Rol> {
    const response = await apiClient.put<{ message: string; id: number }>(ENDPOINTS.ROLES.UPDATE, data);
    return await this.getById(response.id);
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(ENDPOINTS.ROLES.DELETE, { id });
  },
};
