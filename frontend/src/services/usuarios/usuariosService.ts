import { apiClient } from '../../core/apiClient';
import { ENDPOINTS } from '../../core/endpoints';
import type {
  Usuario,
  CreateUsuarioDto,
  UpdateUsuarioDto,
  UsuariosResponse,
  UsuarioResponse,
} from '../../models/usuario';

export const usuariosService = {
  async getAll(): Promise<Usuario[]> {
    const response = await apiClient.get<{ usuarios: any[] }>(ENDPOINTS.USUARIOS.LIST);
    return response.usuarios;
  },

  async getById(id: number): Promise<Usuario> {
    return await apiClient.get<Usuario>(ENDPOINTS.USUARIOS.GET(id));
  },

  async create(data: CreateUsuarioDto): Promise<Usuario> {
    const response = await apiClient.post<{ message: string; id: number }>(ENDPOINTS.USUARIOS.CREATE, data);
    // Después de crear, obtener el usuario completo
    return await this.getById(response.id);
  },

  async update(data: UpdateUsuarioDto): Promise<Usuario> {
    const response = await apiClient.put<{ message: string; id: number }>(ENDPOINTS.USUARIOS.UPDATE, data);
    // Después de actualizar, obtener el usuario completo
    return await this.getById(response.id);
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(ENDPOINTS.USUARIOS.DELETE, { id });
  },

  async changePassword(correo: string, oldPassword: string, newPassword: string): Promise<void> {
    await apiClient.put(ENDPOINTS.USUARIOS.CHANGE_PASSWORD, {
      correo,
      old_contrasena: oldPassword,
      new_contrasena: newPassword,
    });
  },
};
