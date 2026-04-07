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
        const componentes = await apiClient.get<Componente[]>('/componentes/');
        return { componentes };
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
        const updated = await apiClient.put<Componente>(`/componentes/${payload.id}/`, payload);
        return {
            message: 'Componente actualizado',
            id: updated.id ?? payload.id,
            nombre: updated.nombre,
            descripcion: updated.descripcion,
        };
    },

    /**
     * Elimina un componente
     */
    delete: async (payload: DeleteComponentePayload): Promise<{ message: string }> => {
        await apiClient.delete(`/componentes/${payload.id}/`);
        return { message: 'Componente eliminado' };
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
        const created = await apiClient.post<ComponenteRol>('/componentes/roles/', payload);
        return {
            message: 'ComponenteRol creado',
            id: created.id ?? 0,
            componente_id: created.componente_id,
            rol_id: created.rol_id,
            permiso: created.permiso,
        };
    },

    /**
     * Lista todos los ComponenteRoles
     */
    list: async (): Promise<ListComponenteRolesResponse> => {
        const componente_roles = await apiClient.get<ComponenteRol[]>('/componentes/roles/');
        return { componente_roles };
    },

    /**
     * Obtiene un ComponenteRol por ID
     */
    get: async (id: number): Promise<ComponenteRol> => {
        return apiClient.get<ComponenteRol>(`/componentes/roles/${id}/`);
    },

    /**
     * Actualiza un ComponenteRol existente
     */
    update: async (payload: UpdateComponenteRolPayload): Promise<{ message: string; id: number; componente_id: number; rol_id: number; permiso: string }> => {
        const updated = await apiClient.put<ComponenteRol>(`/componentes/roles/${payload.id}/`, payload);
        return {
            message: 'ComponenteRol actualizado',
            id: updated.id ?? payload.id,
            componente_id: updated.componente_id,
            rol_id: updated.rol_id,
            permiso: updated.permiso,
        };
    },

    /**
     * Elimina un ComponenteRol
     */
    delete: async (payload: DeleteComponenteRolPayload): Promise<{ message: string }> => {
        await apiClient.delete(`/componentes/roles/${payload.id}/`);
        return { message: 'ComponenteRol eliminado' };
    }
};
