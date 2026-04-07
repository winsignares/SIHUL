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

interface GrupoApi {
    id?: number;
    nombre: string;
    programa: number;
    periodo: number;
    semestre: number;
    activo?: boolean;
}

const toFrontendGrupo = (grupo: GrupoApi): Grupo => ({
    id: grupo.id,
    nombre: grupo.nombre,
    programa_id: grupo.programa,
    periodo_id: grupo.periodo,
    semestre: grupo.semestre,
    activo: grupo.activo,
});

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
        const created = await apiClient.post<GrupoApi>('/grupos/', {
            nombre: payload.nombre,
            programa: payload.programa_id,
            periodo: payload.periodo_id,
            semestre: payload.semestre,
            activo: payload.activo,
        });
        return { message: 'Grupo creado', id: created.id ?? 0 };
    },

    /**
     * Actualiza un grupo existente
     */
    update: async (payload: UpdateGrupoPayload): Promise<{ message: string; id: number }> => {
        const updated = await apiClient.put<GrupoApi>(`/grupos/${payload.id}/`, {
            ...(payload.nombre !== undefined ? { nombre: payload.nombre } : {}),
            ...(payload.programa_id !== undefined ? { programa: payload.programa_id } : {}),
            ...(payload.periodo_id !== undefined ? { periodo: payload.periodo_id } : {}),
            ...(payload.semestre !== undefined ? { semestre: payload.semestre } : {}),
            ...(payload.activo !== undefined ? { activo: payload.activo } : {}),
        });
        return { message: 'Grupo actualizado', id: updated.id ?? payload.id };
    },

    /**
     * Elimina un grupo
     */
    delete: async (payload: DeleteGrupoPayload): Promise<{ message: string }> => {
        await apiClient.delete(`/grupos/${payload.id}/`);
        return { message: 'Grupo eliminado' };
    },

    /**
     * Obtiene un grupo por ID
     */
    get: async (id: number): Promise<Grupo> => {
        const grupoApi = await apiClient.get<GrupoApi>(`/grupos/${id}/`);
        return toFrontendGrupo(grupoApi);
    },

    /**
     * Lista todos los grupos
     */
    list: async (): Promise<ListGruposResponse> => {
        const gruposApi = await apiClient.get<GrupoApi[]>('/grupos/');
        const grupos = gruposApi.map(toFrontendGrupo);
        return { grupos };
    }
};
