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
    horas?: number;
}

interface AsignaturaProgramaApi {
    id?: number;
    programa: number;
    asignatura: number;
    semestre: number;
    componente_formativo: 'electiva' | 'optativa' | 'profesional' | 'humanística' | 'básica';
}

const toFrontendAsignaturaPrograma = (item: AsignaturaProgramaApi): AsignaturaPrograma => ({
    id: item.id,
    programa_id: item.programa,
    asignatura_id: item.asignatura,
    semestre: item.semestre,
    componente_formativo: item.componente_formativo,
});

/**
 * Payload para crear una asignatura
 */
export interface CreateAsignaturaPayload {
    nombre: string;
    codigo: string;
    creditos: number;
    tipo?: 'teórica' | 'práctica' | 'mixta';
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
 * Interfaz para el modelo de AsignaturaPrograma
 */
export interface AsignaturaPrograma {
    id?: number;
    programa_id: number;
    programa_nombre?: string;
    asignatura_id: number;
    asignatura_nombre?: string;
    asignatura_codigo?: string;
    creditos?: number;
    semestre: number;
    componente_formativo: 'electiva' | 'optativa' | 'profesional' | 'humanística' | 'básica';
    horas?: number;
}

/**
 * Payload para crear una relación asignatura-programa
 */
export interface CreateAsignaturaProgramaPayload {
    programa_id: number;
    asignatura_id: number;
    semestre: number;
    componente_formativo?: 'electiva' | 'optativa' | 'profesional' | 'humanística' | 'básica';
}

/**
 * Payload para actualizar una relación asignatura-programa
 */
export interface UpdateAsignaturaProgramaPayload {
    id: number;
    semestre?: number;
    componente_formativo?: 'electiva' | 'optativa' | 'profesional' | 'humanística' | 'básica';
}

/**
 * Payload para eliminar una relación asignatura-programa
 */
export interface DeleteAsignaturaProgramaPayload {
    id: number;
}

/**
 * Respuesta de la lista de asignaturas por programa
 */
export interface ListAsignaturasProgramaResponse {
    asignaturas_programa: AsignaturaPrograma[];
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
        const updated = await apiClient.put<Asignatura>(`/asignaturas/${payload.id}/`, payload);
        return { message: 'Asignatura actualizada', id: updated.id ?? payload.id };
    },

    /**
     * Elimina una asignatura
     */
    delete: async (payload: DeleteAsignaturaPayload): Promise<{ message: string }> => {
        await apiClient.delete(`/asignaturas/${payload.id}/`);
        return { message: 'Asignatura eliminada' };
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
        const asignaturas = await apiClient.get<Asignatura[]>('/asignaturas/');
        return { asignaturas: Array.isArray(asignaturas) ? asignaturas : [] };
    }
};

/**
 * Servicio de asignaturas por programa para comunicación con el backend
 */
export const asignaturaProgramaService = {
    /**
     * Crea una nueva relación asignatura-programa
     */
    create: async (payload: CreateAsignaturaProgramaPayload): Promise<{ message: string; id: number }> => {
        const created = await apiClient.post<AsignaturaProgramaApi>('/asignaturas-programa/', {
            programa: payload.programa_id,
            asignatura: payload.asignatura_id,
            semestre: payload.semestre,
            componente_formativo: payload.componente_formativo,
        });
        return { message: 'Asignatura-programa creada', id: created.id ?? 0 };
    },

    /**
     * Actualiza una relación asignatura-programa existente
     */
    update: async (payload: UpdateAsignaturaProgramaPayload): Promise<{ message: string; id: number }> => {
        const updated = await apiClient.put<AsignaturaProgramaApi>(`/asignaturas-programa/${payload.id}/`, payload);
        return { message: 'Asignatura-programa actualizada', id: updated.id ?? payload.id };
    },

    /**
     * Elimina una relación asignatura-programa
     */
    delete: async (payload: DeleteAsignaturaProgramaPayload): Promise<{ message: string }> => {
        await apiClient.delete(`/asignaturas-programa/${payload.id}/`);
        return { message: 'Asignatura-programa eliminada' };
    },

    /**
     * Obtiene una relación asignatura-programa por ID
     */
    get: async (id: number): Promise<AsignaturaPrograma> => {
        const item = await apiClient.get<AsignaturaProgramaApi>(`/asignaturas-programa/${id}/`);
        return toFrontendAsignaturaPrograma(item);
    },

    /**
     * Lista todas las relaciones asignatura-programa
     * @param programa_id - Opcional: Filtra por programa específico
     */
    list: async (programa_id?: number): Promise<ListAsignaturasProgramaResponse> => {
        const allApi = await apiClient.get<AsignaturaProgramaApi[]>('/asignaturas-programa/');
        const all = allApi.map(toFrontendAsignaturaPrograma);
        const asignaturas_programa = programa_id
            ? all.filter((item) => item.programa_id === programa_id)
            : all;
        return { asignaturas_programa };
    }
};
