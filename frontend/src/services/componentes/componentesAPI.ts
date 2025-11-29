import { apiClient } from '../../core/apiClient';

/**
 * Interfaz para el modelo de Componente
 */
export interface Componente {
    id?: number;
    nombre: string;
    descripcion?: string;
}

/**
 * Payload para crear un componente
 */
export interface CreateComponentePayload {
    nombre: string;
    descripcion?: string;
}

/**
 * Payload para actualizar un componente
 */
export interface UpdateComponentePayload {
    id: number;
    nombre?: string;
    descripcion?: string;
}

/**
 * Payload para eliminar un componente
 */
export interface DeleteComponentePayload {
    id: number;
}

/**
 * Respuesta de la lista de componentes
 */
export interface ListComponentesResponse {
    componentes: Componente[];
}

/**
 * Interfaz para el modelo de ComponenteRol
 */
export interface ComponenteRol {
    id?: number;
    componente_id: number;
    componente_nombre?: string;
    rol_id: number;
    rol_nombre?: string;
    permiso: 'VER' | 'EDITAR';
    permiso_display?: string;
}

/**
 * Payload para crear un ComponenteRol
 */
export interface CreateComponenteRolPayload {
    componente_id: number;
    rol_id: number;
    permiso?: 'VER' | 'EDITAR';
}

/**
 * Payload para actualizar un ComponenteRol
 */
export interface UpdateComponenteRolPayload {
    id: number;
    permiso?: 'VER' | 'EDITAR';
}

/**
 * Payload para eliminar un ComponenteRol
 */
export interface DeleteComponenteRolPayload {
    id: number;
}

/**
 * Respuesta de la lista de ComponenteRoles
 */
export interface ListComponenteRolesResponse {
    componente_roles: ComponenteRol[];
}

/**
 * Servicio de componentes para comunicación con el backend
 */
export const componenteService = {
    /**
     * Crea un nuevo componente
     */
    create: async (payload: CreateComponentePayload): Promise<{ message: string; id: number; nombre: string; descripcion?: string }> => {
        return apiClient.post<{ message: string; id: number; nombre: string; descripcion?: string }>('/componentes/', payload);
    },

    /**
     * Lista todos los componentes
     */
    list: async (): Promise<ListComponentesResponse> => {
        return apiClient.get<ListComponentesResponse>('/componentes/list/');
    },

    /**
     * Obtiene un componente por ID
     */
    get: async (id: number): Promise<Componente> => {
        return apiClient.get<Componente>(`/componentes/${id}/`);
    },

    /**
     * Actualiza un componente existente
     */
    update: async (payload: UpdateComponentePayload): Promise<{ message: string; id: number; nombre: string; descripcion?: string }> => {
        return apiClient.put<{ message: string; id: number; nombre: string; descripcion?: string }>('/componentes/update/', payload);
    },

    /**
     * Elimina un componente
     */
    delete: async (payload: DeleteComponentePayload): Promise<{ message: string }> => {
        return apiClient.delete<{ message: string }>('/componentes/delete/', payload);
    }
};

/**
 * Servicio de ComponenteRol para comunicación con el backend
 */
export const componenteRolService = {
    /**
     * Crea un nuevo ComponenteRol
     */
    create: async (payload: CreateComponenteRolPayload): Promise<{ message: string; id: number; componente_id: number; rol_id: number; permiso: string }> => {
        return apiClient.post<{ message: string; id: number; componente_id: number; rol_id: number; permiso: string }>('/componentes/rol/', payload);
    },

    /**
     * Lista todos los ComponenteRoles
     */
    list: async (): Promise<ListComponenteRolesResponse> => {
        return apiClient.get<ListComponenteRolesResponse>('/componentes/rol/list/');
    },

    /**
     * Obtiene un ComponenteRol por ID
     */
    get: async (id: number): Promise<ComponenteRol> => {
        return apiClient.get<ComponenteRol>(`/componentes/rol/${id}/`);
    },

    /**
     * Actualiza un ComponenteRol existente
     */
    update: async (payload: UpdateComponenteRolPayload): Promise<{ message: string; id: number; componente_id: number; rol_id: number; permiso: string }> => {
        return apiClient.put<{ message: string; id: number; componente_id: number; rol_id: number; permiso: string }>('/componentes/rol/update/', payload);
    },

    /**
     * Elimina un ComponenteRol
     */
    delete: async (payload: DeleteComponenteRolPayload): Promise<{ message: string }> => {
        return apiClient.delete<{ message: string }>('/componentes/rol/delete/', payload);
    }
};
