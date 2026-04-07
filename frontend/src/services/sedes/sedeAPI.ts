import { apiClient } from '../../core/apiClient';

export interface Sede {
  id?: number;
  nombre: string;
  direccion?: string;
  ciudad?: string;
  activa: boolean;
}

/**
 * Servicio para la gestión de sedes
 */
export const sedeService = {
  /**
   * Obtiene la lista de todas las sedes
   */
  listarSedes: async (): Promise<{ sedes: Sede[] }> => {
    const sedes = await apiClient.get<Sede[]>('/sedes/');
    return { sedes };
  },

  /**
   * Obtiene una sede por su ID
   * @param id ID de la sede
   */
  obtenerSede: async (id: number): Promise<Sede> => {
    return apiClient.get(`/sedes/${id}/`);
  },

  /**
   * Crea una nueva sede
   * @param sede Datos de la sede a crear
   */
  crearSede: async (sede: Omit<Sede, 'id'>): Promise<{ message: string; id: number }> => {
    return apiClient.post('/sedes/', {
      nombre: sede.nombre,
      direccion: sede.direccion,
      ciudad: sede.ciudad,
      activa: sede.activa ?? true
    });
  },

  /**
   * Actualiza una sede existente
   * @param sede Datos de la sede a actualizar
   */
  actualizarSede: async (sede: Sede): Promise<{ message: string; id: number }> => {
    if (!sede.id) {
      throw new Error('Se requiere el ID de la sede para actualizar');
    }

    const actualizada = await apiClient.put<Sede>(`/sedes/${sede.id}/`, {
      nombre: sede.nombre,
      direccion: sede.direccion,
      ciudad: sede.ciudad,
      activa: sede.activa
    });

    return { message: 'Sede actualizada', id: actualizada.id ?? sede.id };
  },

  /**
   * Elimina una sede
   * @param id ID de la sede a eliminar
   */
  eliminarSede: async (id: number): Promise<{ message: string }> => {
    await apiClient.delete(`/sedes/${id}/`);
    return { message: 'Sede eliminada' };
  }
};