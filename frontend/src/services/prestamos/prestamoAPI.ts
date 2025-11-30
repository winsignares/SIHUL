import { apiClient } from '../../core/apiClient';

export interface PrestamoEspacio {
  id?: number;
  espacio_id: number;
  espacio_nombre?: string;
  espacio_tipo?: string;
  usuario_id: number | null;
  usuario_nombre?: string;
  usuario_correo?: string;
  administrador_id: number | null;
  administrador_nombre?: string;
  fecha: string; // Formato: YYYY-MM-DD
  hora_inicio: string; // Formato: HH:MM:SS
  hora_fin: string;    // Formato: HH:MM:SS
  motivo?: string;
  estado: 'Pendiente' | 'Aprobado' | 'Rechazado' | 'Vencido';
}

/**
 * Servicio para la gestión de préstamos de espacios
 */
export const prestamoService = {
  /**
   * Obtiene la lista de todos los préstamos
   */
  listarPrestamos: async (): Promise<{ prestamos: PrestamoEspacio[] }> => {
    return apiClient.get('/prestamos/list/');
  },

  /**
   * Obtiene un préstamo por su ID
   * @param id ID del préstamo
   */
  obtenerPrestamo: async (id: number): Promise<PrestamoEspacio> => {
    return apiClient.get(`/prestamos/${id}/`);
  },

  /**
   * Crea un nuevo préstamo de espacio
   * @param prestamo Datos del préstamo a crear
   */
  crearPrestamo: async (prestamo: Omit<PrestamoEspacio, 'id'>): Promise<{ message: string; id: number }> => {
    return apiClient.post('/prestamos/', {
      espacio_id: prestamo.espacio_id,
      usuario_id: prestamo.usuario_id,
      administrador_id: prestamo.administrador_id,
      fecha: prestamo.fecha,
      hora_inicio: prestamo.hora_inicio,
      hora_fin: prestamo.hora_fin,
      motivo: prestamo.motivo,
      estado: prestamo.estado || 'Pendiente'
    });
  },

  /**
   * Actualiza un préstamo existente
   * @param prestamo Datos actualizados del préstamo
   */
  actualizarPrestamo: async (prestamo: PrestamoEspacio): Promise<{ message: string; id: number }> => {
    if (!prestamo.id) {
      throw new Error('Se requiere el ID del préstamo para actualizar');
    }
    
    return apiClient.put('/prestamos/update/', {
      id: prestamo.id,
      espacio_id: prestamo.espacio_id,
      usuario_id: prestamo.usuario_id,
      administrador_id: prestamo.administrador_id,
      fecha: prestamo.fecha,
      hora_inicio: prestamo.hora_inicio,
      hora_fin: prestamo.hora_fin,
      motivo: prestamo.motivo,
      estado: prestamo.estado
    });
  },

  /**
   * Elimina un préstamo
   * @param id ID del préstamo a eliminar
   */
  eliminarPrestamo: async (id: number): Promise<{ message: string }> => {
    return apiClient.delete('/prestamos/delete/', { id });
  }
};