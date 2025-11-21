import { apiClient } from '../../core/apiClient';
import { ENDPOINTS } from '../../core/endpoints';

export interface Notificacion {
  id: number;
  titulo: string;
  mensaje: string;
  tipo: string;
  leida: boolean;
  fecha_creacion: string;
}

export const notificacionesService = {
  async getByUsuario(usuarioId: number, leidas?: boolean): Promise<Notificacion[]> {
    let url = ENDPOINTS.NOTIFICACIONES.BY_USUARIO(usuarioId);
    if (leidas !== undefined) {
      url += `?leidas=${leidas}`;
    }
    const response = await apiClient.get<{ notificaciones: Notificacion[] }>(url);
    return response.notificaciones || [];
  },

  async marcarLeida(notificacionId: number): Promise<void> {
    await apiClient.put(ENDPOINTS.NOTIFICACIONES.MARCAR_LEIDA(notificacionId));
  },
};
