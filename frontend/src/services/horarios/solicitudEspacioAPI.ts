import { apiClient } from '../../core/apiClient';

/**
 * Interfaz para el modelo de SolicitudEspacio
 */
export interface SolicitudEspacio {
    id: number;
    grupo_id: number;
    grupo_nombre: string;
    asignatura_id: number;
    asignatura_nombre: string;
    docente_id: number | null;
    docente_nombre: string | null;
    espacio_solicitado_id: number;
    espacio_solicitado_nombre: string;
    planificador_id: number | null;
    planificador_nombre: string | null;
    dia_semana: string;
    hora_inicio: string;
    hora_fin: string;
    cantidad_estudiantes: number | null;
    estado: 'pendiente' | 'aprobada' | 'rechazada';
    fecha_solicitud: string;
    fecha_aprobacion: string | null;
    aprobado_por_id: number | null;
    aprobado_por_nombre: string | null;
    comentario: string | null;
    horario_generado_id: number | null;
}

/**
 * Payload para aprobar una solicitud
 */
export interface AprobarSolicitudPayload {
    solicitud_id: number;
    admin_id: number;
    comentario?: string;
}

/**
 * Payload para rechazar una solicitud
 */
export interface RechazarSolicitudPayload {
    solicitud_id: number;
    admin_id: number;
    comentario?: string;
}

/**
 * Respuesta de la lista de solicitudes
 */
export interface ListSolicitudesResponse {
    solicitudes: SolicitudEspacio[];
}

/**
 * Servicio de solicitudes de espacio para comunicación con el backend
 */
export const solicitudEspacioService = {
    /**
     * Lista todas las solicitudes de espacio con filtro opcional
     */
    list: async (estado?: string): Promise<ListSolicitudesResponse> => {
        const params = estado ? `?estado=${estado}` : '';
        return apiClient.get<ListSolicitudesResponse>(`/horario/solicitudes/${params}`);
    },

    /**
     * Lista solicitudes pendientes
     */
    listPendientes: async (): Promise<ListSolicitudesResponse> => {
        return apiClient.get<ListSolicitudesResponse>('/horario/solicitudes/?estado=pendiente');
    },

    /**
     * Aprueba una solicitud de espacio
     */
    aprobar: async (payload: AprobarSolicitudPayload): Promise<{ message: string; solicitud_id: number; horario_id: number }> => {
        return apiClient.post<{ message: string; solicitud_id: number; horario_id: number }>('/horario/solicitudes/aprobar/', payload);
    },

    /**
     * Rechaza una solicitud de espacio
     */
    rechazar: async (payload: RechazarSolicitudPayload): Promise<{ message: string; solicitud_id: number }> => {
        return apiClient.post<{ message: string; solicitud_id: number }>('/horario/solicitudes/rechazar/', payload);
    }
};
