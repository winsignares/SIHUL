import { apiClient } from '../../core/apiClient';

/**
 * Interfaz para el modelo de Facultad
 */
export interface Facultad {
    id?: number;
    nombre: string;
    activa?: boolean;
}

/**
 * Payload para crear una facultad
 */
export interface CreateFacultadPayload {
    nombre: string;
    activa?: boolean;
}

/**
 * Payload para actualizar una facultad
 */
export interface UpdateFacultadPayload {
    id: number;
    nombre?: string;
    activa?: boolean;
}

/**
 * Payload para eliminar una facultad
 */
export interface DeleteFacultadPayload {
    id: number;
}

/**
 * Respuesta de la lista de facultades
 */
export interface ListFacultadesResponse {
    facultades: Facultad[];
}

/**
 * Servicio de facultades para comunicación con el backend
 */
export const facultadService = {
    /**
     * Crea una nueva facultad
     */
    create: async (payload: CreateFacultadPayload): Promise<{ message: string; id: number }> => {
        return apiClient.post<{ message: string; id: number }>('/facultades/', payload);
    },

    /**
     * Actualiza una facultad existente
     */
    update: async (payload: UpdateFacultadPayload): Promise<{ message: string; id: number }> => {
        return apiClient.put<{ message: string; id: number }>('/facultades/update/', payload);
    },

    /**
     * Elimina una facultad
     */
    delete: async (payload: DeleteFacultadPayload): Promise<{ message: string }> => {
        return apiClient.delete<{ message: string }>('/facultades/delete/', payload);
    },

    /**
     * Obtiene una facultad por ID
     */
    get: async (id: number): Promise<Facultad> => {
        return apiClient.get<Facultad>(`/facultades/${id}/`);
    },

    /**
     * Lista todas las facultades
     */
    list: async (): Promise<ListFacultadesResponse> => {
        return apiClient.get<ListFacultadesResponse>('/facultades/list/');
    }
};
