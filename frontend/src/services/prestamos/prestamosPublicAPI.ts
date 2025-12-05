import { apiClient } from '../../core/apiClient';

export interface SedeAPI {
    id: number;
    nombre: string;
}

export interface TipoActividadAPI {
    id: number;
    nombre: string;
    descripcion?: string;
}

export interface EspacioDisponibleAPI {
    id: number;
    nombre: string;
    capacidad: number;
    tipo: string;
    sede: string;
    sede_id: number;
    ubicacion?: string;
}

export interface SolicitudPrestamoPublico {
    nombre_completo: string;
    correo_institucional: string;
    telefono: string;
    identificacion: string;
    espacio_id: number;
    tipo_actividad_id: number;
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
    motivo: string;
    asistentes: number;
}

export const prestamosPublicAPI = {
    /**
     * Obtiene la lista de tipos de actividad
     */
    listarTiposActividad: async (): Promise<{ tipos_actividad: TipoActividadAPI[] }> => {
        return apiClient.get('/prestamos/tipos-actividad/');
    },

    /**
     * Obtiene espacios disponibles para una fecha y horario específico
     */
    listarEspaciosDisponibles: async (
        fecha: string,
        hora_inicio: string,
        hora_fin: string,
        sede_id?: number
    ): Promise<{ espacios: EspacioDisponibleAPI[]; total: number }> => {
        const params = new URLSearchParams({
            fecha,
            hora_inicio,
            hora_fin,
            ...(sede_id && { sede_id: sede_id.toString() })
        });
        return apiClient.get(`/prestamos/public/espacios-disponibles/?${params}`);
    },

    /**
     * Crea una solicitud de préstamo para usuarios públicos
     */
    crearSolicitud: async (solicitud: SolicitudPrestamoPublico): Promise<{ message: string; id: number }> => {
        return apiClient.post('/prestamos/public/solicitar/', solicitud);
    }
};
