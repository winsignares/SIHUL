import { apiClient } from '../../core/apiClient';

export interface RecursoPrestamo {
  recurso_id: number;
  recurso_nombre?: string;
  cantidad: number;
}

export interface PrestamoEspacio {
  id?: number;
  espacio_id: number;
  espacio_nombre?: string;
  espacio_tipo?: string;
  usuario_id: number | null;
  usuario_nombre?: string;
  usuario_correo?: string;
  solicitante_publico_id?: number | null;
  solicitante_publico_nombre?: string;
  solicitante_publico_correo?: string;
  solicitante_publico_telefono?: string;
  solicitante_publico_identificacion?: string;
  administrador_id: number | null;
  administrador_nombre?: string;
  tipo_actividad_id: number;
  tipo_actividad_nombre?: string;
  fecha: string; // Formato: YYYY-MM-DD
  hora_inicio: string; // Formato: HH:MM:SS
  hora_fin: string;    // Formato: HH:MM:SS
  motivo?: string;
  asistentes?: number;
  telefono?: string;
  estado: 'Pendiente' | 'Aprobado' | 'Rechazado' | 'Vencido';
  recursos?: RecursoPrestamo[];
  es_recurrente?: boolean;
  frecuencia?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'weekdays';
  intervalo?: number;
  dias_semana?: number[];
  fin_repeticion_tipo?: 'never' | 'until_date' | 'count';
  fin_repeticion_fecha?: string | null;
  fin_repeticion_ocurrencias?: number | null;
  serie_id?: string | null;
  es_ocurrencia_generada?: boolean;
  prestamo_padre_id?: number | null;
}

const buildRecurrencePayload = (prestamo: Partial<PrestamoEspacio>) => {
  if (!prestamo.es_recurrente) {
    return {};
  }

  const payload: Record<string, unknown> = {
    es_recurrente: true,
    frecuencia: prestamo.frecuencia || 'weekly',
    intervalo: prestamo.intervalo && prestamo.intervalo >= 1 ? prestamo.intervalo : 1,
    fin_repeticion_tipo: prestamo.fin_repeticion_tipo || 'never'
  };

  if (prestamo.frecuencia === 'weekly' && Array.isArray(prestamo.dias_semana) && prestamo.dias_semana.length > 0) {
    payload.dias_semana = prestamo.dias_semana;
  }

  if (prestamo.fin_repeticion_tipo === 'until_date' && prestamo.fin_repeticion_fecha) {
    payload.fin_repeticion_fecha = prestamo.fin_repeticion_fecha;
  }

  if (
    prestamo.fin_repeticion_tipo === 'count' &&
    typeof prestamo.fin_repeticion_ocurrencias === 'number' &&
    prestamo.fin_repeticion_ocurrencias > 0
  ) {
    payload.fin_repeticion_ocurrencias = prestamo.fin_repeticion_ocurrencias;
  }

  return payload;
};

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
   * Obtiene la lista de TODOS los préstamos (autenticados + públicos) para admin
   */
  listarTodosPrestamosAdmin: async (): Promise<{ prestamos: PrestamoEspacio[] }> => {
    return apiClient.get('/prestamos/list/todos/');
  },

  /**
   * Obtiene la lista de préstamos de un usuario específico
   * @param usuarioId ID del usuario
   */
  listarPrestamosPorUsuario: async (usuarioId: number): Promise<{ prestamos: PrestamoEspacio[] }> => {
    return apiClient.get(`/prestamos/usuario/${usuarioId}/`);
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
      tipo_actividad_id: prestamo.tipo_actividad_id,
      fecha: prestamo.fecha,
      hora_inicio: prestamo.hora_inicio,
      hora_fin: prestamo.hora_fin,
      motivo: prestamo.motivo,
      asistentes: prestamo.asistentes,
      telefono: prestamo.telefono,
      estado: prestamo.estado || 'Pendiente',
      recursos: prestamo.recursos || [],
      ...buildRecurrencePayload(prestamo)
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
      tipo_actividad_id: prestamo.tipo_actividad_id,
      fecha: prestamo.fecha,
      hora_inicio: prestamo.hora_inicio,
      hora_fin: prestamo.hora_fin,
      motivo: prestamo.motivo,
      asistentes: prestamo.asistentes,
      telefono: prestamo.telefono,
      estado: prestamo.estado,
      ...buildRecurrencePayload(prestamo)
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