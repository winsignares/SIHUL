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
    prioridad: 'alta' | 'media' | 'baja';
}

/**
 * Tipos de notificación mapeados
 */
export type TipoNotificacion = 
    | 'solicitud' 
    | 'mensaje' 
    | 'alerta' 
    | 'sistema' 
    | 'exito' 
    | 'error' 
    | 'advertencia'
    | 'horario'
    | 'prestamo'
    | 'espacio'
    | 'facultad'
    | 'solicitud_espacio'
    | 'solicitud_aprobada'
    | 'solicitud_rechazada'
    | 'grupo'
    | 'cambio_nombre'
    | 'cambio_contrasena'
    | 'licencia'
    | 'periodo_academico'
    | 'profesor_sin_asignar'
    | 'grupo_sin_espacio';

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
 * Tipos de notificaciones consideradas IMPORTANTES
 * - Acciones de otros usuarios que afectan al sistema
 * - Creaciones, modificaciones, eliminaciones importantes
 * - Solicitudes que requieren atención
 */
export const NOTIFICACIONES_IMPORTANTES = [
    'solicitud',
    'solicitud_espacio',
    'solicitud_aprobada',
    'solicitud_rechazada',
    'horario', // Cuando se crea/modifica un horario
    'grupo', // Cuando se crea un grupo
    'prestamo', // Solicitudes de préstamo
    'profesor_sin_asignar', // Alertas importantes
    'grupo_sin_espacio', // Alertas importantes
    'licencia', // Avisos críticos
    'periodo_academico', // Avisos importantes del período
];

/**
 * Tipos de notificaciones del enfoque SISTEMA
 */
export const NOTIFICACIONES_SISTEMA = [
    'sistema',
    'cambio_nombre',
    'cambio_contrasena',
    'licencia',
    'periodo_academico',
    'profesor_sin_asignar',
    'grupo_sin_espacio',
    'alerta',
    'advertencia',
    'mensaje',
    'exito',
    'error'
];

/**
 * Tipos de notificaciones del enfoque HORARIO
 */
export const NOTIFICACIONES_HORARIOS = [
    'horario',
    'grupo',
    'periodo_academico'
];

/**
 * Tipos de notificaciones del enfoque ESPACIO
 */
export const NOTIFICACIONES_ESPACIOS = [
    'espacio',
    'solicitud_espacio',
    'solicitud_aprobada',
    'solicitud_rechazada',
    'grupo_sin_espacio',
    'prestamo'
];

/**
 * Parámetros para paginación y búsqueda
 */
export interface NotificacionesPaginacionParams {
    pagina?: number;
    limite?: number;
    busqueda?: string;
    tipo?: string;
    prioridad?: 'alta' | 'media' | 'baja';
    leidas?: boolean;
    filtroTiempo?: FiltroTiempo;
    categoria?: CategoriaNotificacion;
    enfoque?: EnfoqueNotificacion;
}

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
