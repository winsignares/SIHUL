import { apiClient } from '../../core/apiClient';

/**
 * Interfaz para el modelo de Horario
 */
export interface Horario {
    id?: number;
    grupo_id: number;
    asignatura_id: number;
    docente_id?: number | null;
    espacio_id: number;
    dia_semana: string;
    hora_inicio: string;
    hora_fin: string;
    cantidad_estudiantes?: number | null;
}

/**
 * Payload para crear un horario
 */
export interface CreateHorarioPayload {
    grupo_id: number;
    asignatura_id: number;
    espacio_id: number;
    dia_semana: string;
    hora_inicio: string;
    hora_fin: string;
    docente_id?: number | null;
    cantidad_estudiantes?: number | null;
    usuario_id?: number | null;
}

/**
 * Payload para actualizar un horario
 */
export interface UpdateHorarioPayload {
    id: number;
    grupo_id?: number;
    asignatura_id?: number;
    docente_id?: number | null;
    espacio_id?: number;
    dia_semana?: string;
    hora_inicio?: string;
    hora_fin?: string;
    cantidad_estudiantes?: number | null;
}

/**
 * Payload para eliminar un horario
 */
export interface DeleteHorarioPayload {
    id: number;
}

/**
 * Respuesta de la lista de horarios
 */
export interface ListHorariosResponse {
    horarios: Horario[];
}

/**
 * Interfaz para horarios extendidos con información de relaciones
 */
export interface HorarioExtendido {
    id: number;
    grupo_id: number;
    grupo_nombre: string;
    programa_id: number;
    programa_nombre: string;
    semestre: number;
    asignatura_id: number;
    asignatura_nombre: string;
    docente_id: number | null;
    docente_nombre: string;
    espacio_id: number;
    espacio_nombre: string;
    dia_semana: string;
    hora_inicio: string;
    hora_fin: string;
    cantidad_estudiantes: number | null;
}

/**
 * Respuesta de la lista de horarios extendidos
 */
export interface ListHorariosExtendidosResponse {
    horarios: HorarioExtendido[];
}

/**
 * Interfaz para el modelo de HorarioFusionado
 */
export interface HorarioFusionado {
    id?: number;
    grupo1_id: number;
    grupo2_id: number;
    grupo3_id?: number | null;
    asignatura_id: number;
    docente_id?: number | null;
    espacio_id: number;
    dia_semana: string;
    hora_inicio: string;
    hora_fin: string;
    cantidad_estudiantes?: number | null;
    comentario?: string;
}

/**
 * Payload para crear un horario fusionado
 */
export interface CreateHorarioFusionadoPayload {
    grupo1_id: number;
    grupo2_id: number;
    grupo3_id?: number | null;
    asignatura_id: number;
    espacio_id: number;
    dia_semana: string;
    hora_inicio: string;
    hora_fin: string;
    docente_id?: number | null;
    cantidad_estudiantes?: number | null;
    comentario?: string;
}

/**
 * Payload para actualizar un horario fusionado
 */
export interface UpdateHorarioFusionadoPayload {
    id: number;
    grupo1_id?: number;
    grupo2_id?: number;
    grupo3_id?: number | null;
    asignatura_id?: number;
    docente_id?: number | null;
    espacio_id?: number;
    dia_semana?: string;
    hora_inicio?: string;
    hora_fin?: string;
    cantidad_estudiantes?: number | null;
    comentario?: string;
}

/**
 * Payload para eliminar un horario fusionado
 */
export interface DeleteHorarioFusionadoPayload {
    id: number;
}

/**
 * Respuesta de la lista de horarios fusionados
 */
export interface ListHorariosFusionadosResponse {
    horarios_fusionados: HorarioFusionado[];
}

/**
 * Servicio de horarios para comunicación con el backend
 */
export const horarioService = {
    /**
     * Crea un nuevo horario
     */
    create: async (payload: CreateHorarioPayload): Promise<{ message: string; id: number }> => {
        return apiClient.post<{ message: string; id: number }>('/horario/', payload);
    },

    /**
     * Actualiza un horario existente
     */
    update: async (payload: UpdateHorarioPayload): Promise<{ message: string; id: number }> => {
        return apiClient.put<{ message: string; id: number }>('/horario/update/', payload);
    },

    /**
     * Elimina un horario
     */
    delete: async (payload: DeleteHorarioPayload): Promise<{ message: string }> => {
        return apiClient.delete<{ message: string }>('/horario/delete/', payload);
    },

    /**
     * Obtiene un horario por ID
     */
    get: async (id: number): Promise<Horario> => {
        return apiClient.get<Horario>(`/horario/${id}/`);
    },

    /**
     * Lista todos los horarios
     */
    list: async (): Promise<ListHorariosResponse> => {
        return apiClient.get<ListHorariosResponse>('/horario/list/');
    },

    /**
     * Lista todos los horarios con información extendida
     */
    listExtendidos: async (): Promise<ListHorariosExtendidosResponse> => {
        return apiClient.get<ListHorariosExtendidosResponse>('/horario/list/extendidos/');
    }
};

/**
 * Servicio de horarios fusionados para comunicación con el backend
 */
export const horarioFusionadoService = {
    /**
     * Crea un nuevo horario fusionado
     */
    create: async (payload: CreateHorarioFusionadoPayload): Promise<{ message: string; id: number }> => {
        return apiClient.post<{ message: string; id: number }>('/horario/fusionado/', payload);
    },

    /**
     * Actualiza un horario fusionado existente
     */
    update: async (payload: UpdateHorarioFusionadoPayload): Promise<{ message: string; id: number }> => {
        return apiClient.put<{ message: string; id: number }>('/horario/fusionado/update/', payload);
    },

    /**
     * Elimina un horario fusionado
     */
    delete: async (payload: DeleteHorarioFusionadoPayload): Promise<{ message: string }> => {
        return apiClient.delete<{ message: string }>('/horario/fusionado/delete/', payload);
    },

    /**
     * Obtiene un horario fusionado por ID
     */
    get: async (id: number): Promise<HorarioFusionado> => {
        return apiClient.get<HorarioFusionado>(`/horario/fusionado/${id}/`);
    },

    /**
     * Lista todos los horarios fusionados
     */
    list: async (): Promise<ListHorariosFusionadosResponse> => {
        return apiClient.get<ListHorariosFusionadosResponse>('/horario/fusionado/list/');
    }
};
