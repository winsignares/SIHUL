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
    /** 'NINGUNO' solo existe en el ajuste de una seccional: quita un componente que la plantilla da. */
    permiso: 'VER' | 'EDITAR' | 'NINGUNO';
    permiso_display?: string;
    /** Vacío = plantilla general; con valor = ajuste que solo aplica a esa seccional. */
    seccional_id?: number | null;
}

/**
 * Payload para crear un ComponenteRol
 */
export interface CreateComponenteRolPayload {
    componente_id: number;
    rol_id: number;
    permiso?: 'VER' | 'EDITAR' | 'NINGUNO';
    /** Sin valor, el servidor usa la seccional de quien guarda (o la plantilla si es administrador general). */
    seccional_id?: number | null;
}

/**
 * Payload para actualizar un ComponenteRol
 */
export interface UpdateComponenteRolPayload {
    id: number;
    permiso?: 'VER' | 'EDITAR' | 'NINGUNO';
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

export interface ComponenteUsuario {
    id?: number;
    componente_id: number;
    usuario_id: number;
    permiso: 'VER' | 'EDITAR';
    activo: boolean;
}

export interface ListComponenteUsuariosResponse {
    componente_usuarios: ComponenteUsuario[];
}

interface ComponenteUsuarioApi {
    id?: number;
    componente: number;
    usuario: number;
    permiso: 'VER' | 'EDITAR';
    activo: boolean;
}

interface ComponenteRolApi {
    id?: number;
    componente: number;
    rol: number;
    permiso: 'VER' | 'EDITAR' | 'NINGUNO';
    seccional?: number | null;
}

const toFrontendComponenteRol = (item: ComponenteRolApi): ComponenteRol => ({
    id: item.id,
    componente_id: item.componente,
    rol_id: item.rol,
    permiso: item.permiso,
    seccional_id: item.seccional ?? null,
});

/** Qué puede hacer quien abre la pantalla de permisos por rol. */
export interface AlcancePermisos {
    es_general: boolean;
    puede_ajustar: boolean;
    seccional: { id: number; ciudad: string } | null;
    seccionales: { id: number; ciudad: string }[];
}

const toFrontendComponenteUsuario = (item: ComponenteUsuarioApi): ComponenteUsuario => ({
    id: item.id,
    componente_id: item.componente,
    usuario_id: item.usuario,
    permiso: item.permiso,
    activo: item.activo,
});

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
    list: async (params?: { financiero?: boolean }): Promise<ListComponentesResponse> => {
        const query = params?.financiero ? '?financiero=1' : '';
        const componentes = await apiClient.get<Componente[]>(`/componentes/${query}`);
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
        const created = await apiClient.post<ComponenteRolApi>('/componentes/roles/', {
            componente: payload.componente_id,
            rol: payload.rol_id,
            permiso: payload.permiso,
            ...(payload.seccional_id !== undefined ? { seccional: payload.seccional_id } : {}),
        });
        const normalized = toFrontendComponenteRol(created);
        return {
            message: 'ComponenteRol creado',
            id: normalized.id ?? 0,
            componente_id: normalized.componente_id,
            rol_id: normalized.rol_id,
            permiso: normalized.permiso,
        };
    },

    /**
     * Lista todos los ComponenteRoles
     */
    list: async (params?: { financiero?: boolean; seccional?: number }): Promise<ListComponenteRolesResponse> => {
        const query = new URLSearchParams();
        if (params?.financiero) query.set('financiero', '1');
        if (params?.seccional) query.set('seccional', String(params.seccional));
        const texto = query.toString();
        const componenteRolesApi = await apiClient.get<ComponenteRolApi[]>(`/componentes/roles/${texto ? `?${texto}` : ''}`);
        const componente_roles = componenteRolesApi.map(toFrontendComponenteRol);
        return { componente_roles };
    },

    /** Si la persona es administradora general o de una seccional (define qué ve la pantalla de permisos). */
    alcance: async (): Promise<AlcancePermisos> => apiClient.get<AlcancePermisos>('/componentes/alcance/'),

    /**
     * Obtiene un ComponenteRol por ID
     */
    get: async (id: number): Promise<ComponenteRol> => {
        const item = await apiClient.get<ComponenteRolApi>(`/componentes/roles/${id}/`);
        return toFrontendComponenteRol(item);
    },

    /**
     * Actualiza un ComponenteRol existente
     */
    update: async (payload: UpdateComponenteRolPayload): Promise<{ message: string; id: number; componente_id: number; rol_id: number; permiso: string }> => {
        const updated = await apiClient.patch<ComponenteRolApi>(`/componentes/roles/${payload.id}/`, {
            permiso: payload.permiso,
        });
        const normalized = toFrontendComponenteRol(updated);
        return {
            message: 'ComponenteRol actualizado',
            id: normalized.id ?? payload.id,
            componente_id: normalized.componente_id,
            rol_id: normalized.rol_id,
            permiso: normalized.permiso,
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

export const componenteUsuarioService = {
    list: async (params?: { usuarioId?: number; financiero?: boolean }): Promise<ListComponenteUsuariosResponse> => {
        const searchParams = new URLSearchParams();
        if (params?.usuarioId) searchParams.set('usuario', String(params.usuarioId));
        if (params?.financiero) searchParams.set('financiero', '1');
        const query = searchParams.size ? `?${searchParams.toString()}` : '';
        const componenteUsuariosApi = await apiClient.get<ComponenteUsuarioApi[]>(`/componentes/usuarios/${query}`);
        const componente_usuarios = componenteUsuariosApi.map(toFrontendComponenteUsuario);
        return { componente_usuarios };
    },

    create: async (payload: Omit<ComponenteUsuario, 'id'>): Promise<ComponenteUsuario> => {
        const created = await apiClient.post<ComponenteUsuarioApi>('/componentes/usuarios/', {
            componente: payload.componente_id,
            usuario: payload.usuario_id,
            permiso: payload.permiso,
            activo: payload.activo,
        });
        return toFrontendComponenteUsuario(created);
    },

    update: async (payload: Partial<ComponenteUsuario> & { id: number }): Promise<ComponenteUsuario> => {
        const updated = await apiClient.patch<ComponenteUsuarioApi>(`/componentes/usuarios/${payload.id}/`, {
            permiso: payload.permiso,
            activo: payload.activo,
        });
        return toFrontendComponenteUsuario(updated);
    },

    delete: async (id: number): Promise<{ message: string }> => {
        await apiClient.delete(`/componentes/usuarios/${id}/`);
        return { message: 'ComponenteUsuario eliminado' };
    },
};
