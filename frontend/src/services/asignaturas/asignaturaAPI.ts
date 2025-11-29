import { apiClient } from '../../core/apiClient';

/**
 * Interfaz para el modelo de Asignatura
 */
export interface Asignatura {
    id?: number;
    nombre: string;
    codigo: string;
    creditos: number;
    tipo?: 'teórica' | 'práctica' | 'mixta';
    facultad_id?: number;
    horas?: number;
}

/**
 * Payload para crear una asignatura
 */
export interface CreateAsignaturaPayload {
    nombre: string;
    codigo: string;
    creditos: number;
    tipo?: 'teórica' | 'práctica' | 'mixta';
    facultad_id?: number;
    horas?: number;
}

/**
 * Payload para actualizar una asignatura
 */
export interface UpdateAsignaturaPayload {
    id: number;
    nombre?: string;
    codigo?: string;
    creditos?: number;
    tipo?: 'teórica' | 'práctica' | 'mixta';
    facultad_id?: number;
    horas?: number;
}

/**
 * Payload para eliminar una asignatura
 */
export interface DeleteAsignaturaPayload {
    id: number;
}

/**
 * Respuesta de la lista de asignaturas
 */
export interface ListAsignaturasResponse {
    asignaturas: Asignatura[];
}

/**
 * Servicio de asignaturas para comunicación con el backend
 */
export const asignaturaService = {
    /**
     * Crea una nueva asignatura
     */
    create: async (payload: CreateAsignaturaPayload): Promise<{ message: string; id: number }> => {
        return apiClient.post<{ message: string; id: number }>('/asignaturas/', payload);
    },

    /**
     * Actualiza una asignatura existente
     */
    update: async (payload: UpdateAsignaturaPayload): Promise<{ message: string; id: number }> => {
        return apiClient.put<{ message: string; id: number }>('/asignaturas/update/', payload);
    },

    /**
     * Elimina una asignatura
     */
    delete: async (payload: DeleteAsignaturaPayload): Promise<{ message: string }> => {
        return apiClient.delete<{ message: string }>('/asignaturas/delete/', payload);
    },

    /**
     * Obtiene una asignatura por ID
     */
    get: async (id: number): Promise<Asignatura> => {
        return apiClient.get<Asignatura>(`/asignaturas/${id}/`);
    },

    /**
     * Lista todas las asignaturas
     */
    list: async (): Promise<ListAsignaturasResponse> => {
        return apiClient.get<ListAsignaturasResponse>('/asignaturas/list/');
    }
};
