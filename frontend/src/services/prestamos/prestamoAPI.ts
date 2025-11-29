import { apiClient } from '../../core/apiClient';

export interface PrestamoEspacio {
  id?: number;
  espacio_id: number;
  usuario_id: number | null;
  administrador_id: number | null;
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
    return apiClient.get('/prestamos/');
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
    return apiClient.post('/prestamos/create/', {
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
  },

  /**
   * Cambia el estado de un préstamo
   * @param id ID del préstamo
   * @param nuevoEstado Nuevo estado del préstamo
   */
  cambiarEstadoPrestamo: async (id: number, nuevoEstado: PrestamoEspacio['estado']): Promise<{ message: string; id: number }> => {
    return apiClient.put(`/prestamos/${id}/cambiar-estado/`, { estado: nuevoEstado });
  }
};