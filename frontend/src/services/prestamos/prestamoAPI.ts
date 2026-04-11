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
  /** Semanal: Lunes=0…Domingo=6. Mensual: `[patrón, weekdayJS]` con patrón 0=énésimo, 1=último; weekdayJS 0=dom…6=sáb (Date.getDay). */
  dias_semana?: number[];
  fin_repeticion_tipo?: 'never' | 'until_date' | 'count';
  fin_repeticion_fecha?: string | null;
  fin_repeticion_ocurrencias?: number | null;
  serie_id?: string | null;
  es_ocurrencia_generada?: boolean;
  prestamo_padre_id?: number | null;
}

interface PrestamoEspacioApi {
  id?: number;
  espacio: number;
  espacio_nombre?: string;
  espacio_tipo?: string;
  usuario: number | null;
  usuario_nombre?: string;
  usuario_correo?: string;
  administrador: number | null;
  administrador_nombre?: string;
  tipo_actividad: number;
  tipo_actividad_nombre?: string;
  prestamo_padre?: number | null;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  motivo?: string | null;
  asistentes?: number;
  telefono?: string | null;
  estado: 'Pendiente' | 'Aprobado' | 'Rechazado' | 'Vencido';
  es_recurrente?: boolean;
  frecuencia?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'weekdays';
  intervalo?: number;
  dias_semana?: number[];
  fin_repeticion_tipo?: 'never' | 'until_date' | 'count';
  fin_repeticion_fecha?: string | null;
  fin_repeticion_ocurrencias?: number | null;
  serie_id?: string | null;
  es_ocurrencia_generada?: boolean;
}

const toFrontendPrestamo = (prestamo: PrestamoEspacioApi): PrestamoEspacio => ({
  id: prestamo.id,
  espacio_id: prestamo.espacio,
  espacio_nombre: prestamo.espacio_nombre,
  espacio_tipo: prestamo.espacio_tipo,
  usuario_id: prestamo.usuario,
  usuario_nombre: prestamo.usuario_nombre,
  usuario_correo: prestamo.usuario_correo,
  administrador_id: prestamo.administrador,
  administrador_nombre: prestamo.administrador_nombre,
  tipo_actividad_id: prestamo.tipo_actividad,
  tipo_actividad_nombre: prestamo.tipo_actividad_nombre,
  prestamo_padre_id: prestamo.prestamo_padre ?? null,
  fecha: prestamo.fecha,
  hora_inicio: prestamo.hora_inicio,
  hora_fin: prestamo.hora_fin,
  motivo: prestamo.motivo ?? undefined,
  asistentes: prestamo.asistentes,
  telefono: prestamo.telefono ?? undefined,
  estado: prestamo.estado,
  es_recurrente: prestamo.es_recurrente,
  frecuencia: prestamo.frecuencia,
  intervalo: prestamo.intervalo,
  dias_semana: prestamo.dias_semana,
  fin_repeticion_tipo: prestamo.fin_repeticion_tipo,
  fin_repeticion_fecha: prestamo.fin_repeticion_fecha,
  fin_repeticion_ocurrencias: prestamo.fin_repeticion_ocurrencias,
  serie_id: prestamo.serie_id,
  es_ocurrencia_generada: prestamo.es_ocurrencia_generada,
});

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

  if (prestamo.frecuencia === 'monthly' && Array.isArray(prestamo.dias_semana) && prestamo.dias_semana.length === 2) {
    const [a, b] = prestamo.dias_semana;
    if ((a === 0 || a === 1) && typeof b === 'number' && b >= 0 && b <= 6) {
      payload.dias_semana = prestamo.dias_semana;
    }
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
   * Obtiene la lista de todos los préstamos.
   * @param includeOcurrencias Si es true, incluye cada ocurrencia de series recurrentes (filas hijas en BD).
   */
  listarPrestamos: async (options?: { includeOcurrencias?: boolean }): Promise<{ prestamos: PrestamoEspacio[] }> => {
    const query = options?.includeOcurrencias ? '?include_ocurrencias=true' : '';
    const prestamosApi = await apiClient.get<PrestamoEspacioApi[]>(`/prestamos/espacios/${query}`);
    const prestamos = prestamosApi.map(toFrontendPrestamo);
    return { prestamos };
  },

  /**
   * Obtiene la lista de TODOS los préstamos (autenticados + públicos) para admin
   */
  listarTodosPrestamosAdmin: async (): Promise<{ prestamos: PrestamoEspacio[] }> => {
    const prestamosApi = await apiClient.get<PrestamoEspacioApi[]>('/prestamos/espacios/');
    const prestamos = prestamosApi.map(toFrontendPrestamo);
    return { prestamos };
  },

  /**
   * Obtiene la lista de préstamos de un usuario específico
   * @param usuarioId ID del usuario
   */
  listarPrestamosPorUsuario: async (usuarioId: number): Promise<{ prestamos: PrestamoEspacio[] }> => {
    const prestamosApi = await apiClient.get<PrestamoEspacioApi[]>('/prestamos/espacios/');
    const prestamos = prestamosApi.map(toFrontendPrestamo);
    return { prestamos: prestamos.filter((item) => item.usuario_id === usuarioId) };
  },

  /**
   * Obtiene un préstamo por su ID
   * @param id ID del préstamo
   */
  obtenerPrestamo: async (id: number): Promise<PrestamoEspacio> => {
    const prestamoApi = await apiClient.get<PrestamoEspacioApi>(`/prestamos/espacios/${id}/`);
    return toFrontendPrestamo(prestamoApi);
  },

  /**
   * Crea un nuevo préstamo de espacio
   * @param prestamo Datos del préstamo a crear
   */
  crearPrestamo: async (prestamo: Omit<PrestamoEspacio, 'id'>): Promise<{ message: string; id: number }> => {
    const created = await apiClient.post<PrestamoEspacioApi>('/prestamos/espacios/', {
      espacio: prestamo.espacio_id,
      usuario: prestamo.usuario_id,
      administrador: prestamo.administrador_id,
      tipo_actividad: prestamo.tipo_actividad_id,
      prestamo_padre: prestamo.prestamo_padre_id,
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
    return { message: 'Préstamo creado', id: created.id ?? 0 };
  },

  /**
   * Actualiza un préstamo existente
   * @param prestamo Datos actualizados del préstamo
   */
  actualizarPrestamo: async (prestamo: PrestamoEspacio): Promise<{ message: string; id: number }> => {
    if (!prestamo.id) {
      throw new Error('Se requiere el ID del préstamo para actualizar');
    }

    const updated = await apiClient.put<PrestamoEspacioApi>(`/prestamos/espacios/${prestamo.id}/`, {
      espacio: prestamo.espacio_id,
      usuario: prestamo.usuario_id,
      administrador: prestamo.administrador_id,
      tipo_actividad: prestamo.tipo_actividad_id,
      prestamo_padre: prestamo.prestamo_padre_id,
      fecha: prestamo.fecha,
      hora_inicio: prestamo.hora_inicio,
      hora_fin: prestamo.hora_fin,
      motivo: prestamo.motivo,
      asistentes: prestamo.asistentes,
      telefono: prestamo.telefono,
      estado: prestamo.estado,
      ...buildRecurrencePayload(prestamo)
    });
    return { message: 'Préstamo actualizado', id: updated.id ?? prestamo.id };
  },

  /**
   * Elimina un préstamo
   * @param id ID del préstamo a eliminar
   */
  eliminarPrestamo: async (id: number): Promise<{ message: string }> => {
    await apiClient.delete(`/prestamos/espacios/${id}/`);
    return { message: 'Préstamo eliminado' };
  }
};