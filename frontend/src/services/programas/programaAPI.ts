import { apiClient } from '../../core/apiClient';

export interface Programa {
  id?: number;
  nombre: string;
  facultad_id: number;
  semestres: number;
  activo: boolean;
}

/**
 * Servicio para la gestión de programas académicos
 */
export const programaService = {
  /**
   * Obtiene la lista de todos los programas académicos
   */
  listarProgramas: async (): Promise<{ programas: Programa[] }> => {
    return apiClient.get('/programas/');
  },

  /**
   * Obtiene un programa académico por su ID
   * @param id ID del programa académico
   */
  obtenerPrograma: async (id: number): Promise<Programa> => {
    return apiClient.get(`/programas/${id}/`);
  },

  /**
   * Crea un nuevo programa académico
   * @param programa Datos del programa a crear
   */
  crearPrograma: async (programa: Omit<Programa, 'id'>): Promise<{ message: string; id: number }> => {
    return apiClient.post('/programas/create/', {
      nombre: programa.nombre,
      facultad_id: programa.facultad_id,
      semestres: programa.semestres,
      activo: programa.activo ?? true
    });
  },

  /**
   * Actualiza un programa académico existente
   * @param programa Datos del programa a actualizar
   */
  actualizarPrograma: async (programa: Programa): Promise<{ message: string; id: number }> => {
    if (!programa.id) {
      throw new Error('Se requiere el ID del programa para actualizar');
    }

    return apiClient.put('/programas/update/', {
      id: programa.id,
      nombre: programa.nombre,
      facultad_id: programa.facultad_id,
      semestres: programa.semestres,
      activo: programa.activo
    });
  },

  /**
   * Elimina un programa académico
   * @param id ID del programa a eliminar
   */
  eliminarPrograma: async (id: number): Promise<{ message: string }> => {
    return apiClient.delete('/programas/delete/', { id });
  }
};