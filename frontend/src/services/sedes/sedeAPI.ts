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
    return apiClient.get('/sedes/');
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
    return apiClient.post('/sedes/create/', {
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

    return apiClient.put('/sedes/update/', {
      id: sede.id,
      nombre: sede.nombre,
      direccion: sede.direccion,
      ciudad: sede.ciudad,
      activa: sede.activa
    });
  },

  /**
   * Elimina una sede
   * @param id ID de la sede a eliminar
   */
  eliminarSede: async (id: number): Promise<{ message: string }> => {
    return apiClient.delete('/sedes/delete/', { id });
  }
};