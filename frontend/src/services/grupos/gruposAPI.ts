import { apiClient } from '../../core/apiClient';

/**
 * Interfaz para el modelo de Grupo
 */
export interface Grupo {
    id?: number;
    nombre: string;
    programa_id: number;
    periodo_id: number;
    semestre: number;
    activo?: boolean;
}

/**
 * Payload para crear un grupo
 */
export interface CreateGrupoPayload {
    nombre: string;
    programa_id: number;
    periodo_id: number;
    semestre: number;
    activo?: boolean;
}

/**
 * Payload para actualizar un grupo
 */
export interface UpdateGrupoPayload {
    id: number;
    nombre?: string;
    programa_id?: number;
    periodo_id?: number;
    semestre?: number;
    activo?: boolean;
}

/**
 * Payload para eliminar un grupo
 */
export interface DeleteGrupoPayload {
    id: number;
}

/**
 * Respuesta de la lista de grupos
 */
export interface ListGruposResponse {
    grupos: Grupo[];
}

/**
 * Servicio de grupos para comunicación con el backend
 */
export const grupoService = {
    /**
     * Crea un nuevo grupo
     */
    create: async (payload: CreateGrupoPayload): Promise<{ message: string; id: number }> => {
        return apiClient.post<{ message: string; id: number }>('/grupos/', payload);
    },

    /**
     * Actualiza un grupo existente
     */
    update: async (payload: UpdateGrupoPayload): Promise<{ message: string; id: number }> => {
        return apiClient.put<{ message: string; id: number }>('/grupos/update/', payload);
    },

    /**
     * Elimina un grupo
     */
    delete: async (payload: DeleteGrupoPayload): Promise<{ message: string }> => {
        return apiClient.delete<{ message: string }>('/grupos/delete/', payload);
    },

    /**
     * Obtiene un grupo por ID
     */
    get: async (id: number): Promise<Grupo> => {
        return apiClient.get<Grupo>(`/grupos/${id}/`);
    },

    /**
     * Lista todos los grupos
     */
    list: async (): Promise<ListGruposResponse> => {
        return apiClient.get<ListGruposResponse>('/grupos/list/');
    }
};
