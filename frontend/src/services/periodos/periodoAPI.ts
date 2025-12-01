import { apiClient } from '../../core/apiClient';

export interface PeriodoAcademico {
  id?: number;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  activo: boolean;
  programas_activos?: number;
  horarios_registrados?: number;
}

/**
 * Servicio para la gestión de períodos académicos
 */
export const periodoService = {
  /**
   * Obtiene la lista de todos los períodos académicos
   */
  listarPeriodos: async (): Promise<{ periodos: PeriodoAcademico[] }> => {
    return apiClient.get('/periodos/list/');
  },

  /**
   * Obtiene un período académico por su ID
   * @param id ID del período académico
   */
  obtenerPeriodo: async (id: number): Promise<PeriodoAcademico> => {
    return apiClient.get(`/periodos/${id}/`);
  },

  /**
   * Crea un nuevo período académico
   * @param periodo Datos del período académico a crear
   */
  crearPeriodo: async (periodo: Omit<PeriodoAcademico, 'id'>): Promise<{ message: string; id: number }> => {
    return apiClient.post('/periodos/', periodo);
  },

  /**
   * Actualiza un período académico existente
   * @param periodo Datos del período académico a actualizar
   */
  actualizarPeriodo: async (periodo: PeriodoAcademico): Promise<{ message: string; id: number }> => {
    return apiClient.put('/periodos/update/', {
      id: periodo.id,
      nombre: periodo.nombre,
      fecha_inicio: periodo.fecha_inicio,
      fecha_fin: periodo.fecha_fin,
      activo: periodo.activo
    });
  },

  /**
   * Elimina un período académico
   * @param id ID del período académico a eliminar
   */
  eliminarPeriodo: async (id: number): Promise<{ message: string }> => {
    return apiClient.delete('/periodos/delete/', { id });
  }
};