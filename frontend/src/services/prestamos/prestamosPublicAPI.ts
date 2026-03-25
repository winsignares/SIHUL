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
    es_recurrente?: boolean;
    frecuencia?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'weekdays';
    intervalo?: number;
    dias_semana?: number[];
    fin_repeticion_tipo?: 'never' | 'until_date' | 'count';
    fin_repeticion_fecha?: string;
    fin_repeticion_ocurrencias?: number;
}

export interface PrestamoPublicoItem {
    id: number;
    espacio_id: number;
    espacio_nombre: string;
    espacio_tipo: string;
    usuario_nombre: string;
    usuario_correo: string;
    administrador_id?: number | null;
    administrador_nombre?: string | null;
    tipo_actividad_id: number;
    tipo_actividad_nombre: string;
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
    motivo: string;
    asistentes: number;
    telefono: string;
    identificacion: string;
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
    prestamo_padre_id?: number | null;
}

export interface ActualizarPrestamoPublicoPayload {
    id: number;
    espacio_id: number;
    nombre_solicitante: string;
    correo_solicitante: string;
    telefono_solicitante: string;
    identificacion_solicitante?: string;
    administrador_id?: number | null;
    tipo_actividad_id: number;
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
    motivo: string;
    asistentes: number;
    estado: 'Pendiente' | 'Aprobado' | 'Rechazado' | 'Vencido';
    es_recurrente?: boolean;
    frecuencia?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'weekdays';
    intervalo?: number;
    dias_semana?: number[];
    fin_repeticion_tipo?: 'never' | 'until_date' | 'count';
    fin_repeticion_fecha?: string | null;
    fin_repeticion_ocurrencias?: number | null;
}

export interface PrestamoPublicoDetalle {
    id: number;
    espacio_id: number;
    tipo_actividad_id: number;
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
    motivo: string;
    asistentes: number;
    telefono: string;
    estado: 'Pendiente' | 'Aprobado' | 'Rechazado' | 'Vencido';
    usuario_nombre?: string;
    usuario_correo?: string;
    administrador_id?: number | null;
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

export interface PrestamoPublicoListado {
    id: number;
    espacio_id: number;
    espacio_nombre: string;
    espacio_tipo: string;
    usuario_id: null;
    usuario_nombre: string;
    usuario_correo: string;
    solicitante_publico_nombre?: string;
    solicitante_publico_correo?: string;
    solicitante_publico_telefono?: string;
    solicitante_publico_identificacion?: string;
    administrador_id?: number | null;
    administrador_nombre?: string | null;
    tipo_actividad_id: number;
    tipo_actividad_nombre: string;
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
    motivo: string;
    asistentes: number;
    telefono: string;
    estado: 'Pendiente' | 'Aprobado' | 'Rechazado' | 'Vencido';
    recursos: [];
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
    },

    /**
     * Lista todos los préstamos públicos
     */
    listarPrestamosPublicos: async (): Promise<{ prestamos: PrestamoPublicoListado[] }> => {
        return apiClient.get('/prestamos/public/list/');
    },

    /**
     * Lista las solicitudes públicas por identificación y correo
     */
    listarMisSolicitudes: async (
        identificacion: string,
        correo: string
    ): Promise<{ prestamos: PrestamoPublicoItem[] }> => {
        const params = new URLSearchParams({
            identificacion,
            correo
        });

        return apiClient.get(`/prestamos/public/mis-solicitudes/?${params}`);
    },

    /**
     * Actualiza una solicitud pública
     */
    actualizarSolicitud: async (
        payload: ActualizarPrestamoPublicoPayload
    ): Promise<{ message: string; id: number }> => {
        return apiClient.put('/prestamos/public/update/', payload);
    },

    /**
     * Obtiene el detalle de una solicitud pública por ID
     */
    obtenerSolicitud: async (id: number): Promise<PrestamoPublicoDetalle> => {
        return apiClient.get(`/prestamos/public/${id}/`);
    },

    /**
     * Elimina una solicitud pública
     */
    eliminarSolicitud: async (
        id: number,
        identificacion?: string,
        correo?: string
    ): Promise<{ message: string }> => {
        return apiClient.delete('/prestamos/public/delete/', {
            id,
            identificacion,
            correo
        });
    }
};
