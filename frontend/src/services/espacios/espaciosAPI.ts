import { apiClient } from '../../core/apiClient';

/**
 * Interfaz para el modelo de EspacioFisico
 */
export interface EspacioFisico {
    id?: number;
    sede_id: number;
    tipo: string;
    capacidad: number;
    ubicacion?: string;
    disponible?: boolean;
}

/**
 * Payload para crear un espacio físico
 */
export interface CreateEspacioPayload {
    sede_id: number;
    tipo: string;
    capacidad: number;
    ubicacion?: string;
    disponible?: boolean;
}

/**
 * Payload para actualizar un espacio físico
 */
export interface UpdateEspacioPayload {
    id: number;
    sede_id?: number;
    tipo?: string;
    capacidad?: number;
    ubicacion?: string;
    disponible?: boolean;
}

/**
 * Payload para eliminar un espacio físico
 */
export interface DeleteEspacioPayload {
    id: number;
}

/**
 * Respuesta de la lista de espacios físicos
 */
export interface ListEspaciosResponse {
    espacios: EspacioFisico[];
}

/**
 * Interfaz para el modelo de EspacioPermitido
 */
export interface EspacioPermitido {
    id?: number;
    espacio_id: number;
    espacio_tipo?: string;
    espacio_ubicacion?: string;
    usuario_id: number;
    usuario_nombre?: string;
    usuario_correo?: string;
}

/**
 * Payload para crear un EspacioPermitido
 */
export interface CreateEspacioPermitidoPayload {
    espacio_id: number;
    usuario_id: number;
}

/**
 * Payload para eliminar un EspacioPermitido
 */
export interface DeleteEspacioPermitidoPayload {
    id: number;
}

/**
 * Respuesta de la lista de espacios permitidos
 */
export interface ListEspaciosPermitidosResponse {
    espacios_permitidos: EspacioPermitido[];
}

/**
 * Respuesta de espacios por usuario
 */
export interface ListEspaciosByUsuarioResponse {
    espacios: EspacioFisico[];
}

/**
 * Servicio de espacios físicos para comunicación con el backend
 */
export const espacioService = {
    /**
     * Crea un nuevo espacio físico
     */
    create: async (payload: CreateEspacioPayload): Promise<{ message: string; id: number }> => {
        return apiClient.post<{ message: string; id: number }>('/espacios/', payload);
    },

    /**
     * Actualiza un espacio físico existente
     */
    update: async (payload: UpdateEspacioPayload): Promise<{ message: string; id: number }> => {
        return apiClient.put<{ message: string; id: number }>('/espacios/update/', payload);
    },

    /**
     * Elimina un espacio físico
     */
    delete: async (payload: DeleteEspacioPayload): Promise<{ message: string }> => {
        return apiClient.delete<{ message: string }>('/espacios/delete/', payload);
    },

    /**
     * Obtiene un espacio físico por ID
     */
    get: async (id: number): Promise<EspacioFisico> => {
        return apiClient.get<EspacioFisico>(`/espacios/${id}/`);
    },

    /**
     * Lista todos los espacios físicos
     */
    list: async (): Promise<ListEspaciosResponse> => {
        return apiClient.get<ListEspaciosResponse>('/espacios/list/');
    }
};

/**
 * Servicio de EspacioPermitido para comunicación con el backend
 */
export const espacioPermitidoService = {
    /**
     * Crea un nuevo EspacioPermitido
     */
    create: async (payload: CreateEspacioPermitidoPayload): Promise<{ message: string; id: number; espacio_id: number; usuario_id: number }> => {
        return apiClient.post<{ message: string; id: number; espacio_id: number; usuario_id: number }>('/espacios/permitido/', payload);
    },

    /**
     * Lista todos los EspaciosPermitidos
     */
    list: async (): Promise<ListEspaciosPermitidosResponse> => {
        return apiClient.get<ListEspaciosPermitidosResponse>('/espacios/permitido/list/');
    },

    /**
     * Obtiene un EspacioPermitido por ID
     */
    get: async (id: number): Promise<EspacioPermitido> => {
        return apiClient.get<EspacioPermitido>(`/espacios/permitido/${id}/`);
    },

    /**
     * Elimina un EspacioPermitido
     */
    delete: async (payload: DeleteEspacioPermitidoPayload): Promise<{ message: string }> => {
        return apiClient.delete<{ message: string }>('/espacios/permitido/delete/', payload);
    },

    /**
     * Lista todos los espacios permitidos para un usuario específico
     */
    listByUsuario: async (usuario_id: number): Promise<ListEspaciosByUsuarioResponse> => {
        return apiClient.get<ListEspaciosByUsuarioResponse>(`/espacios/permitido/usuario/${usuario_id}/`);
    }
};
