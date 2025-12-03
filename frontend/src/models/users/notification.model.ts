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
    | 'solicitud_rechazada';
