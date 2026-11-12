/**
 * Notificación tal como viene del backend
 */
export interface NotificacionBackend {
    id: number;
    id_usuario: number;
    tipo_notificacion: string;
    mensaje: string;
    es_leida: boolean;
    fecha_creacion: string;
    prioridad: 'alta' | 'media' | 'baja';
}

/**
 * Notificación con formato para el frontend
 */
export interface NotificacionUsuario {
    id: number;
    tipo: string;
    titulo: string;
    descripcion: string;
    fecha: string;
    leida: boolean;
    eliminada?: boolean;
    prioridad: 'alta' | 'media' | 'baja';
}

/**
 * Filtro de tiempo para notificaciones
 */
export type FiltroTiempo = 'dia' | 'semana' | 'mes' | 'todo';

/**
 * Categorías de notificaciones para filtrado (SOLO 2 PESTAÑAS)
 */
export type CategoriaNotificacion = 'pendientes' | 'leidas';

/**
 * Enfoque de notificaciones (filtro adicional)
 */
export type EnfoqueNotificacion = 'todos' | 'sistema' | 'espacio' | 'horario';

/**
 * Respuesta paginada de notificaciones
 */
export interface NotificacionesPaginadas {
    notificaciones: NotificacionBackend[];
    total: number;
    pagina_actual: number;
    total_paginas: number;
    tiene_siguiente: boolean;
    tiene_anterior: boolean;
}
