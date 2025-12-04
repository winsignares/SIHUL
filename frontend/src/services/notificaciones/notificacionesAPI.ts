import { apiClient } from '../../core/apiClient';
import type { NotificacionBackend, NotificacionesPaginadas, NotificacionesPaginacionParams } from '../../models/users/notification.model';

const API_URL = '/notificaciones';

// Usar la interfaz del modelo
export type Notificacion = NotificacionBackend;

export interface NotificacionCreate {
  id_usuario: number;
  tipo_notificacion: string;
  mensaje: string;
  prioridad?: 'alta' | 'media' | 'baja';
}

export interface NotificacionUpdate {
  id: number;
  tipo_notificacion?: string;
  mensaje?: string;
  prioridad?: 'alta' | 'media' | 'baja';
  es_leida?: boolean;
}

export interface EstadisticasNotificaciones {
  total: number;
  leidas: number;
  no_leidas: number;
  por_prioridad: {
    alta: number;
    media: number;
    baja: number;
  };
}

export interface NotificacionesResponse {
  notificaciones: Notificacion[];
  total?: number;
}

// ==================== CRUD BÁSICO ====================

/**
 * Crear una nueva notificación
 * POST /notificaciones/
 */
export const crearNotificacion = async (data: NotificacionCreate): Promise<Notificacion> => {
  return await apiClient.post<Notificacion>(`${API_URL}/`, data);
};

/**
 * Actualizar una notificación
 * PUT /notificaciones/update/
 */
export const actualizarNotificacion = async (data: NotificacionUpdate): Promise<{ message: string; id: number }> => {
  return await apiClient.put<{ message: string; id: number }>(`${API_URL}/update/`, data);
};

/**
 * Eliminar una notificación
 * DELETE /notificaciones/delete/
 */
export const eliminarNotificacion = async (id: number): Promise<{ message: string }> => {
  return await apiClient.delete<{ message: string }>(`${API_URL}/delete/`, { id });
};

/**
 * Obtener una notificación por ID
 * GET /notificaciones/{id}/
 */
export const obtenerNotificacion = async (id: number): Promise<Notificacion> => {
  return await apiClient.get<Notificacion>(`${API_URL}/${id}/`);
};

/**
 * Listar todas las notificaciones con filtros opcionales
 * GET /notificaciones/list/?id_usuario={id}&no_leidas={true|false}
 */
export const listarNotificaciones = async (params?: {
  id_usuario?: number;
  no_leidas?: boolean;
}): Promise<NotificacionesResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.id_usuario) queryParams.append('id_usuario', params.id_usuario.toString());
  if (params?.no_leidas !== undefined) queryParams.append('no_leidas', params.no_leidas.toString());
  
  const queryString = queryParams.toString();
  const endpoint = queryString ? `${API_URL}/list/?${queryString}` : `${API_URL}/list/`;
  
  return await apiClient.get<NotificacionesResponse>(endpoint);
};

// ==================== ACCIONES PERSONALIZADAS ====================

/**
 * Obtener las notificaciones de un usuario específico con paginación
 * GET /notificaciones/mis-notificaciones/?id_usuario={id}&pagina={page}&limite={limit}&busqueda={search}
 */
export const obtenerMisNotificaciones = async (params: {
  id_usuario: number;
  no_leidas?: boolean;
  pagina?: number;
  limite?: number;
  busqueda?: string;
  tipo?: string;
  prioridad?: 'alta' | 'media' | 'baja';
}): Promise<NotificacionesResponse> => {
  const queryParams = new URLSearchParams();
  queryParams.append('id_usuario', params.id_usuario.toString());
  if (params.no_leidas !== undefined) queryParams.append('no_leidas', params.no_leidas.toString());
  if (params.pagina) queryParams.append('pagina', params.pagina.toString());
  if (params.limite) queryParams.append('limite', params.limite.toString());
  if (params.busqueda) queryParams.append('busqueda', params.busqueda);
  if (params.tipo) queryParams.append('tipo', params.tipo);
  if (params.prioridad) queryParams.append('prioridad', params.prioridad);
  
  return await apiClient.get<NotificacionesResponse>(`${API_URL}/mis-notificaciones/?${queryParams.toString()}`);
};

/**
 * Obtener las notificaciones de un usuario específico con paginación completa
 * GET /notificaciones/mis-notificaciones-paginadas/
 */
export const obtenerMisNotificacionesPaginadas = async (params: {
  id_usuario: number;
  pagina?: number;
  limite?: number;
  busqueda?: string;
  tipo?: string;
  prioridad?: 'alta' | 'media' | 'baja';
  leidas?: boolean;
}): Promise<NotificacionesPaginadas> => {
  const queryParams = new URLSearchParams();
  queryParams.append('id_usuario', params.id_usuario.toString());
  queryParams.append('pagina', (params.pagina || 1).toString());
  queryParams.append('limite', (params.limite || 10).toString());
  if (params.busqueda) queryParams.append('busqueda', params.busqueda);
  if (params.tipo) queryParams.append('tipo', params.tipo);
  if (params.prioridad) queryParams.append('prioridad', params.prioridad);
  if (params.leidas !== undefined) queryParams.append('leidas', params.leidas.toString());
  
  return await apiClient.get<NotificacionesPaginadas>(`${API_URL}/mis-notificaciones-paginadas/?${queryParams.toString()}`);
};

/**
 * Obtener estadísticas de notificaciones del usuario
 * GET /notificaciones/estadisticas/?id_usuario={id}
 */
export const obtenerEstadisticas = async (id_usuario: number): Promise<EstadisticasNotificaciones> => {
  return await apiClient.get<EstadisticasNotificaciones>(`${API_URL}/estadisticas/?id_usuario=${id_usuario}`);
};

/**
 * Marcar una notificación como leída
 * POST /notificaciones/marcar-leida/{id}/
 */
export const marcarComoLeida = async (id: number): Promise<{ message: string; id: number }> => {
  return await apiClient.post<{ message: string; id: number }>(`${API_URL}/marcar-leida/${id}/`);
};

/**
 * Marcar todas las notificaciones de un usuario como leídas
 * POST /notificaciones/marcar-todas-leidas/
 */
export const marcarTodasComoLeidas = async (id_usuario: number): Promise<{ message: string; cantidad: number }> => {
  return await apiClient.post<{ message: string; cantidad: number }>(`${API_URL}/marcar-todas-leidas/`, { id_usuario });
};

// ==================== FUNCIONES AUXILIARES ====================

/**
 * Obtener solo las notificaciones no leídas de un usuario
 */
export const obtenerNotificacionesNoLeidas = async (id_usuario: number): Promise<NotificacionesResponse> => {
  return obtenerMisNotificaciones({ id_usuario, no_leidas: true });
};

/**
 * Obtener el conteo de notificaciones no leídas
 */
export const contarNotificacionesNoLeidas = async (id_usuario: number): Promise<number> => {
  const stats = await obtenerEstadisticas(id_usuario);
  return stats.no_leidas;
};

/**
 * Verificar si hay notificaciones no leídas
 */
export const tieneNotificacionesNoLeidas = async (id_usuario: number): Promise<boolean> => {
  const count = await contarNotificacionesNoLeidas(id_usuario);
  return count > 0;
};

/**
 * Obtener notificaciones recientes (últimas 10)
 */
export const obtenerNotificacionesRecientes = async (id_usuario: number): Promise<Notificacion[]> => {
  const response = await obtenerMisNotificaciones({ id_usuario });
  return response.notificaciones.slice(0, 10);
};

/**
 * Obtener notificaciones por prioridad
 */
export const obtenerNotificacionesPorPrioridad = async (
  id_usuario: number,
  prioridad: 'alta' | 'media' | 'baja'
): Promise<Notificacion[]> => {
  const response = await obtenerMisNotificaciones({ id_usuario });
  return response.notificaciones.filter(n => n.prioridad === prioridad);
};

export default {
  crearNotificacion,
  actualizarNotificacion,
  eliminarNotificacion,
  obtenerNotificacion,
  listarNotificaciones,
  obtenerMisNotificaciones,
  obtenerMisNotificacionesPaginadas,
  obtenerEstadisticas,
  marcarComoLeida,
  marcarTodasComoLeidas,
  obtenerNotificacionesNoLeidas,
  contarNotificacionesNoLeidas,
  tieneNotificacionesNoLeidas,
  obtenerNotificacionesRecientes,
  obtenerNotificacionesPorPrioridad,
};
