import { apiClient } from '../../core/apiClient';

/**
 * Interfaz para el modelo de Facultad
 */
export interface Facultad {
    id?: number;
    nombre: string;
    activa?: boolean;
    sede_id?: number;
    sede_nombre?: string;
    sede_ciudad?: string;
}

interface FacultadApi {
    id?: number;
    nombre: string;
    activa?: boolean;
    sede?: number | null;
}

const toFrontendFacultad = (facultad: FacultadApi): Facultad => ({
    id: facultad.id,
    nombre: facultad.nombre,
    activa: facultad.activa,
    sede_id: facultad.sede ?? undefined,
});

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
        const updated = await apiClient.put<FacultadApi>(`/facultades/${payload.id}/`, payload);
        return { message: 'Facultad actualizada', id: updated.id ?? payload.id };
    },

    /**
     * Elimina una facultad
     */
    delete: async (payload: DeleteFacultadPayload): Promise<{ message: string }> => {
        await apiClient.delete(`/facultades/${payload.id}/`);
        return { message: 'Facultad eliminada' };
    },

    /**
     * Obtiene una facultad por ID
     */
    get: async (id: number): Promise<Facultad> => {
        const facultad = await apiClient.get<FacultadApi>(`/facultades/${id}/`);
        return toFrontendFacultad(facultad);
    },

    /**
     * Lista todas las facultades
     */
    list: async (): Promise<ListFacultadesResponse> => {
        const facultadesApi = await apiClient.get<FacultadApi[]>('/facultades/');
        const facultades = facultadesApi.map(toFrontendFacultad);
        return { facultades };
    }
};
