import { apiClient } from '../../core/apiClient';

const API_URL = 'http://localhost:8000/sedes';

export interface Sede {
  id: number;
  nombre: string;
  direccion?: string;
  ciudad?: string;
  activa: boolean;
}

export const sedesAPI = {
  // Obtener todas las sedes
  async listarSedes(): Promise<Sede[]> {
    try {
      const data = await apiClient.get<{ sedes: Sede[] }>('/sedes/list/');
      return data.sedes;
    } catch (error) {
      console.error('Error al obtener sedes:', error);
      throw error;
    }
  },

  // Obtener una sede por ID
  async obtenerSede(id: number): Promise<Sede> {
    try {
      const data = await apiClient.get<Sede>(`/sedes/${id}/`);
      return data;
    } catch (error) {
      console.error('Error al obtener sede:', error);
      throw error;
    }
  },

  // Crear una nueva sede
  async crearSede(sede: Omit<Sede, 'id'>): Promise<Sede> {
    try {
      const data = await apiClient.post<Sede>('/sedes/', sede);
      return data;
    } catch (error) {
      console.error('Error al crear sede:', error);
      throw error;
    }
  },

  // Actualizar una sede
  async actualizarSede(id: number, sede: Partial<Sede>): Promise<Sede> {
    try {
      const data = await apiClient.put<Sede>('/sedes/update/', { ...sede, id });
      return data;
    } catch (error) {
      console.error('Error al actualizar sede:', error);
      throw error;
    }
  },

  // Eliminar una sede
  async eliminarSede(id: number): Promise<void> {
    try {
      await apiClient.delete('/sedes/delete/', { id });
    } catch (error) {
      console.error('Error al eliminar sede:', error);
      throw error;
    }
  }
};

export default sedesAPI;
