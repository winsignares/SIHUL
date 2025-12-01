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

/**
 * Servicio de asignaturas por programa para comunicación con el backend
 */
export const asignaturaProgramaService = {
    /**
     * Crea una nueva relación asignatura-programa
     */
    create: async (payload: CreateAsignaturaProgramaPayload): Promise<{ message: string; id: number }> => {
        return apiClient.post<{ message: string; id: number }>('/asignaturas/programa/', payload);
    },

    /**
     * Actualiza una relación asignatura-programa existente
     */
    update: async (payload: UpdateAsignaturaProgramaPayload): Promise<{ message: string; id: number }> => {
        return apiClient.put<{ message: string; id: number }>('/asignaturas/programa/update/', payload);
    },

    /**
     * Elimina una relación asignatura-programa
     */
    delete: async (payload: DeleteAsignaturaProgramaPayload): Promise<{ message: string }> => {
        return apiClient.delete<{ message: string }>('/asignaturas/programa/delete/', payload);
    },

    /**
     * Obtiene una relación asignatura-programa por ID
     */
    get: async (id: number): Promise<AsignaturaPrograma> => {
        return apiClient.get<AsignaturaPrograma>(`/asignaturas/programa/${id}/`);
    },

    /**
     * Lista todas las relaciones asignatura-programa
     * @param programa_id - Opcional: Filtra por programa específico
     */
    list: async (programa_id?: number): Promise<ListAsignaturasProgramaResponse> => {
        const url = programa_id 
            ? `/asignaturas/programa/list/?programa_id=${programa_id}`
            : '/asignaturas/programa/list/';
        return apiClient.get<ListAsignaturasProgramaResponse>(url);
    }
};
